/**
 * Integration Marketplace API Client
 * 
 * Fetches AI provider configurations from Airtable
 */

export interface IntegrationMarketplaceProvider {
  id: string
  name: string
  providerId: string
  description: string
  icon: string
  category: 'llm' | 'vision' | 'speech' | 'custom'
  authType: 'api_key' | 'pat' | 'oauth' | 'custom'
  baseUrl?: string
  documentationUrl?: string
  supportedModels?: string[]
  defaultModel?: string
  features: string[]
  enabled: boolean
  sortOrder?: number
  Attachment?: any[] // Attachment field (singular key for frontend)
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  count?: number
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

class IntegrationMarketplaceApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/integration-marketplace`
  }

  /**
   * Get all enabled providers from Airtable
   */
  async getProviders(): Promise<IntegrationMarketplaceProvider[]> {
    try {
      const response = await fetch(`${this.baseUrl}/providers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ApiResponse<IntegrationMarketplaceProvider[]> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch providers')
      }

      // Sort by sortOrder, then by name
      return result.data.sort((a, b) => {
        const orderA = a.sortOrder ?? 999
        const orderB = b.sortOrder ?? 999
        if (orderA !== orderB) {
          return orderA - orderB
        }
        return a.name.localeCompare(b.name)
      })
    } catch (error) {
      console.error('Error fetching integration marketplace providers:', error)
      // Return empty array on error (graceful degradation)
      return []
    }
  }

  /**
   * Get all providers (including disabled) - for admin management
   */
  async getAllProviders(): Promise<IntegrationMarketplaceProvider[]> {
    try {
      const response = await fetch(`${this.baseUrl}/providers/all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ApiResponse<IntegrationMarketplaceProvider[]> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch providers')
      }

      return result.data.sort((a, b) => {
        const orderA = a.sortOrder ?? 999
        const orderB = b.sortOrder ?? 999
        if (orderA !== orderB) {
          return orderA - orderB
        }
        return a.name.localeCompare(b.name)
      })
    } catch (error) {
      console.error('Error fetching all providers:', error)
      return []
    }
  }

  /**
   * Get provider by ID
   */
  async getProviderById(id: string): Promise<IntegrationMarketplaceProvider | null> {
    try {
      const response = await fetch(`${this.baseUrl}/providers/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ApiResponse<IntegrationMarketplaceProvider> = await response.json()

      if (!result.success || !result.data) {
        return null
      }

      return result.data
    } catch (error) {
      console.error('Error fetching provider:', error)
      return null
    }
  }

  /**
   * Create new provider (admin only)
   */
  async createProvider(provider: Omit<IntegrationMarketplaceProvider, 'id'>): Promise<IntegrationMarketplaceProvider | null> {
    try {
      const response = await fetch(`${this.baseUrl}/providers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(provider),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ApiResponse<IntegrationMarketplaceProvider> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create provider')
      }

      return result.data
    } catch (error) {
      console.error('Error creating provider:', error)
      throw error
    }
  }

  /**
   * Update provider (admin only)
   */
  async updateProvider(id: string, updates: Partial<IntegrationMarketplaceProvider>): Promise<IntegrationMarketplaceProvider | null> {
    try {
      const response = await fetch(`${this.baseUrl}/providers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ApiResponse<IntegrationMarketplaceProvider> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to update provider')
      }

      return result.data
    } catch (error) {
      console.error('Error updating provider:', error)
      throw error
    }
  }

  /**
   * Delete provider (admin only)
   */
  async deleteProvider(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/providers/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ApiResponse<void> = await response.json()

      return result.success || false
    } catch (error) {
      console.error('Error deleting provider:', error)
      throw error
    }
  }
}

export const integrationMarketplaceApi = new IntegrationMarketplaceApiClient()

