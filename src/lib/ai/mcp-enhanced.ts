/**
 * MCP-Enhanced AI Client
 * 
 * Enhances the AI client to use MCP tools when appropriate
 * This allows Gemini to execute actions through MCP tools
 */

import { aiClient, ChatCompletionOptions, ChatCompletionResponse } from './client'
import { callMCPTool, listMCPTools, configureGeminiForMCP } from '../mcp/client'
import { getAllIntegrations } from '../integrations/storage'

/**
 * Enhanced chat that can use MCP tools
 */
export async function chatWithMCPTools(
  options: ChatCompletionOptions,
  integrationId?: string,
  enableMCPTools: boolean = true
): Promise<ChatCompletionResponse> {
  // First, configure Gemini if using Google provider
  if (options.providerId === 'google' && enableMCPTools) {
    const userId = options.userId || 
      (typeof window !== 'undefined' ? localStorage.getItem('userId') || undefined : undefined)
    
    // Get Gemini integration to use its API key
    const integrations = getAllIntegrations()
    const geminiIntegration = integrations.find(i => i.providerId === 'google' && i.enabled)
    
    if (geminiIntegration && geminiIntegration.apiKey) {
      await configureGeminiForMCP(
        geminiIntegration.apiKey,
        options.model,
        userId
      )
    }
  }

  // Make the initial AI call
  const response = await aiClient.chat(options, integrationId)

  // If the response suggests using tools, try to execute them
  if (enableMCPTools && response.success && response.content) {
    // Check if the response mentions tool usage
    // This is a simple heuristic - you might want to use function calling instead
    const toolPattern = /(?:use|call|execute|run)\s+(?:the\s+)?(?:mcp\s+)?tool[s]?\s*:?\s*(\w+)/i
    const match = response.content.match(toolPattern)
    
    if (match) {
      const toolName = match[1]
      const tools = await listMCPTools()
      const tool = tools.find(t => t.name.toLowerCase().includes(toolName.toLowerCase()))
      
      if (tool) {
        // Try to extract arguments from the response or use defaults
        // In a real implementation, you'd parse the AI's intent more carefully
        const toolResult = await callMCPTool({
          name: tool.name,
          arguments: {},
        })

        if (toolResult.success) {
          // Make a follow-up call with the tool result
          const followUpResponse = await aiClient.chat({
            ...options,
            messages: [
              ...options.messages,
              {
                role: 'assistant',
                content: response.content,
              },
              {
                role: 'user',
                content: `Tool result: ${toolResult.content}\n\nPlease provide a summary or analysis based on this result.`,
              },
            ],
          }, integrationId)

          return followUpResponse
        }
      }
    }
  }

  return response
}

/**
 * Smart chat that can intelligently use MCP tools based on user intent
 */
export async function smartChatWithMCP(
  message: string,
  integrationId?: string,
  context?: string
): Promise<ChatCompletionResponse> {
  // Get the integration
  const integrations = getAllIntegrations()
  const integration = integrationId
    ? integrations.find(i => i.id === integrationId)
    : integrations.find(i => i.enabled)

  if (!integration) {
    return {
      success: false,
      error: 'No AI integration available',
    }
  }

  // Detect if the message requires tool usage
  const requiresTool = detectToolUsage(message)
  
  if (requiresTool) {
    // Execute tool first, then chat
    const toolResult = await executeToolFromMessage(message)
    
    if (toolResult) {
      // Include tool result in the chat
      return chatWithMCPTools({
        providerId: integration.providerId,
        apiKey: integration.apiKey,
        baseUrl: integration.baseUrl,
        model: integration.model || 'gemini-1.5-flash',
        messages: [
          ...(context ? [{ role: 'system' as const, content: context }] : []),
          {
            role: 'user' as const,
            content: `${message}\n\nTool result: ${toolResult}`,
          },
        ],
        userId: typeof window !== 'undefined' 
          ? localStorage.getItem('userId') || undefined 
          : undefined,
      }, integration.id)
    }
  }

  // Regular chat without tools
  return chatWithMCPTools({
    providerId: integration.providerId,
    apiKey: integration.apiKey,
    baseUrl: integration.baseUrl,
    model: integration.model || 'gemini-1.5-flash',
    messages: [
      ...(context ? [{ role: 'system' as const, content: context }] : []),
      {
        role: 'user' as const,
        content: message,
      },
    ],
    userId: typeof window !== 'undefined' 
      ? localStorage.getItem('userId') || undefined 
      : undefined,
  }, integration.id)
}

/**
 * Detect if a message requires tool usage
 */
function detectToolUsage(message: string): boolean {
  const toolKeywords = [
    'list', 'show', 'get', 'find', 'search', 'query',
    'create', 'add', 'update', 'delete', 'remove',
    'companies', 'users', 'applications', 'tables',
    'data', 'records', 'preferences',
  ]

  const lowerMessage = message.toLowerCase()
  return toolKeywords.some(keyword => lowerMessage.includes(keyword))
}

/**
 * Execute a tool based on message intent
 */
async function executeToolFromMessage(message: string): Promise<string | null> {
  const lowerMessage = message.toLowerCase()

  // Simple intent detection - in production, use a more sophisticated approach
  if (lowerMessage.includes('list') && lowerMessage.includes('companies')) {
    const result = await callMCPTool({
      name: 'get_table_data',
      arguments: { table: 'companies', limit: 10 },
    })
    return result.success ? result.content : null
  }

  if (lowerMessage.includes('list') && lowerMessage.includes('applications')) {
    const result = await callMCPTool({
      name: 'list_applications',
      arguments: {},
    })
    return result.success ? result.content : null
  }

  if (lowerMessage.includes('list') && lowerMessage.includes('tables')) {
    const result = await callMCPTool({
      name: 'list_tables',
      arguments: {},
    })
    return result.success ? result.content : null
  }

  return null
}

