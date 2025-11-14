/**
 * MCP Client for Frontend
 * 
 * Allows the frontend chatbot to use MCP tools
 * This bridges your Gemini integration with the MCP server
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface MCPToolCall {
  name: string
  arguments: Record<string, any>
}

export interface MCPToolResult {
  success: boolean
  content: string
  error?: string
}

/**
 * Call an MCP tool via the backend proxy
 * The backend will forward the request to the MCP server
 */
export async function callMCPTool(tool: MCPToolCall): Promise<MCPToolResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/mcp/tools/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: tool.name,
        arguments: tool.arguments,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || `Failed to call MCP tool: ${response.statusText}`)
    }

    const result = await response.json()
    return {
      success: true,
      content: result.content || JSON.stringify(result, null, 2),
    }
  } catch (error) {
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * List available MCP tools
 */
export async function listMCPTools(): Promise<Array<{ name: string; description: string }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/mcp/tools/list`)
    
    if (!response.ok) {
      return []
    }

    const result = await response.json()
    return result.tools || []
  } catch (error) {
    console.error('Failed to list MCP tools:', error)
    return []
  }
}

/**
 * Configure Gemini for MCP (uses your existing integration)
 */
export async function configureGeminiForMCP(
  apiKey: string,
  model?: string,
  userId?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  return callMCPTool({
    name: 'configure_gemini',
    arguments: {
      apiKey,
      model: model || 'gemini-1.5-flash',
      userId: userId || (typeof window !== 'undefined' ? localStorage.getItem('userId') || undefined : undefined),
    },
  }).then(result => ({
    success: result.success,
    message: result.success ? 'Gemini configured successfully' : undefined,
    error: result.error,
  }))
}

