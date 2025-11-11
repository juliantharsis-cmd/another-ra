/**
 * AI Client
 * 
 * Frontend client for making AI requests through the backend API
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatCompletionOptions {
  providerId: string
  apiKey: string
  baseUrl?: string
  model: string
  messages: ChatMessage[]
  maxTokens?: number
  temperature?: number
}

export interface ChatCompletionResponse {
  success: boolean
  content?: string
  error?: string
  model?: string
  usage?: {
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
  }
}

export interface TestConnectionOptions {
  providerId: string
  apiKey: string
  baseUrl?: string
  model?: string
}

export interface TestConnectionResponse {
  success: boolean
  message?: string
  error?: string
  availableModels?: string[]
  verifiedModel?: string
}

export interface ModelDiscoveryResponse {
  success: boolean
  models?: Array<{
    id: string
    name: string
    supportsGenerateContent?: boolean
  }>
  error?: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

class AIClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/ai`
  }

  /**
   * Make a chat completion request
   * Optionally updates lastUsed timestamp for the integration
   */
  async chat(options: ChatCompletionOptions, integrationId?: string): Promise<ChatCompletionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      // Update lastUsed timestamp if integration ID is provided and request was successful
      if (result.success && integrationId && typeof window !== 'undefined') {
        try {
          const { updateLastUsed } = await import('@/lib/integrations/storage')
          updateLastUsed(integrationId)
        } catch (err) {
          console.warn('Failed to update lastUsed timestamp:', err)
        }
      }

      return result
    } catch (error) {
      console.error('Error calling AI chat API:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Discover available models for a provider
   */
  async discoverModels(
    providerId: string,
    apiKey: string,
    baseUrl?: string
  ): Promise<ModelDiscoveryResponse> {
    try {
      const params = new URLSearchParams({
        apiKey,
      })
      if (baseUrl) {
        params.append('baseUrl', baseUrl)
      }

      const response = await fetch(`${this.baseUrl}/models/${providerId}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error discovering models:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Test connection to an AI provider
   */
  async testConnection(options: TestConnectionOptions): Promise<TestConnectionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error testing AI connection:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }
}

export const aiClient = new AIClient()

