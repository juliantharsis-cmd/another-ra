/**
 * AI Model Registry API Client
 * 
 * Client-side API for fetching and managing AI models from the registry
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  count?: number
}

export interface AIModel {
  id: string // Airtable record ID
  providerId: string // 'google', 'openai', 'anthropic'
  modelId: string // Unique model identifier (e.g., 'gemini-1.5-flash-latest')
  modelName: string // Display name
  status: 'active' | 'deprecated' | 'beta' | 'preview'
  available: boolean // Currently available via API
  lastVerified?: string // ISO date string
  discoveryMethod: 'api' | 'manual' | 'fallback'
  costPer1KTokens?: number // Pricing information
  maxTokens?: number // Maximum context window
  features?: string[] // ['chat', 'vision', 'embeddings', 'streaming']
  regions?: string[] // ['us', 'eu', 'global']
  deprecationDate?: string // ISO date string
  recommended: boolean // Recommended model for provider
  sortOrder?: number // Display order
  metadata?: Record<string, any> // Additional provider-specific data (includes providerName if resolved)
}

class AIModelRegistryApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/ai-model-registry`
  }

  /**
   * Get all models, optionally filtered by provider
   */
  async getModels(providerId?: string, onlyAvailable: boolean = true): Promise<AIModel[]> {
    try {
      const params = new URLSearchParams()
      if (providerId) {
        params.append('providerId', providerId)
      }
      params.append('onlyAvailable', onlyAvailable.toString())

      const response = await fetch(`${this.baseUrl}/models?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result: ApiResponse<AIModel[]> = await response.json()
      if (result.success && result.data) {
        return Array.isArray(result.data) ? result.data : []
      }
      // Return empty array instead of throwing to prevent UI crashes
      console.warn('Failed to fetch models:', result.error || 'Unknown error')
      return []
    } catch (error) {
      console.error('Error fetching AI models:', error)
      // Return empty array instead of throwing to prevent UI crashes
      return []
    }
  }

  /**
   * Get a single model by ID
   */
  async getModelById(id: string, providerId: string): Promise<AIModel | null> {
    try {
      const params = new URLSearchParams()
      params.append('providerId', providerId)

      const response = await fetch(`${this.baseUrl}/models/${id}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        const error = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result: ApiResponse<AIModel> = await response.json()
      if (result.success && result.data) {
        return result.data
      }
      return null
    } catch (error) {
      console.error('Error fetching AI model:', error)
      throw error
    }
  }

  /**
   * Get recommended model for a provider
   */
  async getRecommendedModel(providerId: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/recommended/${providerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        const error = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result: ApiResponse<{ modelId: string }> = await response.json()
      if (result.success && result.data) {
        return result.data.modelId
      }
      return null
    } catch (error) {
      console.error('Error fetching recommended model:', error)
      throw error
    }
  }
}

export const aiModelRegistryApi = new AIModelRegistryApiClient()

