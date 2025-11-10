/**
 * API Client for Emission Factor Version
 * Handles all HTTP requests to the Emission Factor Version API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  status?: string
  category?: string
}

export interface EmissionFactorVersion {
  id: string
  Name?: string
  'Short code'?: string
  Description?: string
  Formula?: string
  Category?: string
  Status?: 'Active' | 'Inactive'
  Notes?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  lastModifiedBy?: string
}

export interface CreateEmissionFactorVersionDto {
  Name?: string
  'Short code'?: string
  Description?: string
  Formula?: string
  Category?: string
  Status?: 'Active' | 'Inactive'
  Notes?: string
}

export interface UpdateEmissionFactorVersionDto {
  Name?: string
  'Short code'?: string
  Description?: string
  Formula?: string
  Category?: string
  Status?: 'Active' | 'Inactive'
  Notes?: string
}

/**
 * API Client for Emission Factor Version
 */
class EmissionFactorVersionApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/emission-factor-version`
  }

  /**
   * Get Emission Factor Version records with pagination, sorting, filtering, and search
   */
  async getPaginated(params: PaginationParams): Promise<{ 
    data: EmissionFactorVersion[]; 
    pagination: { total: number; limit: number; offset: number; hasMore: boolean } 
  }> {
    const maxRetries = 3
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const queryParams = new URLSearchParams()
        
        if (params.page !== undefined && params.limit !== undefined) {
          const offset = (params.page - 1) * params.limit
          queryParams.append('offset', offset.toString())
          queryParams.append('limit', params.limit.toString())
          queryParams.append('paginated', 'true')
        }
        
        if (params.sortBy) {
          queryParams.append('sortBy', params.sortBy)
        }
        if (params.sortOrder) {
          queryParams.append('sortOrder', params.sortOrder)
        }
        if (params.search) {
          queryParams.append('search', params.search)
        }
        if (params.status) {
          queryParams.append('status', params.status)
        }
        if (params.category) {
          queryParams.append('category', params.category)
        }

        const response = await fetch(`${this.baseUrl}?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result: ApiResponse<EmissionFactorVersion[]> = await response.json()

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to fetch Emission Factor Version records')
        }

        return {
          data: result.data,
          pagination: result.pagination || {
            total: result.data.length,
            limit: params.limit || 25,
            offset: (params.page ? (params.page - 1) * (params.limit || 25) : 0),
            hasMore: false,
          },
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError || new Error('Failed to fetch Emission Factor Version records after retries')
  }

  /**
   * Get a single Emission Factor Version record by ID
   */
  async getById(id: string): Promise<EmissionFactorVersion> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch Emission Factor Version record: ${response.statusText}`)
    }

    const result: ApiResponse<EmissionFactorVersion> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch Emission Factor Version record')
    }

    return result.data
  }

  /**
   * Create a new Emission Factor Version record
   */
  async create(data: CreateEmissionFactorVersionDto): Promise<EmissionFactorVersion> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to create Emission Factor Version record: ${response.statusText}`)
    }

    const result: ApiResponse<EmissionFactorVersion> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create Emission Factor Version record')
    }

    return result.data
  }

  /**
   * Update an existing Emission Factor Version record
   */
  async update(id: string, data: UpdateEmissionFactorVersionDto): Promise<EmissionFactorVersion> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || `Failed to update Emission Factor Version record: ${response.statusText}`)
      }

      const result: ApiResponse<EmissionFactorVersion> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || result.message || 'Failed to update Emission Factor Version record')
      }

      return result.data
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to the server. Please check if the API server is running on http://localhost:3001')
      }
      throw error
    }
  }

  /**
   * Delete a Emission Factor Version record
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to delete Emission Factor Version record: ${response.statusText}`)
    }
  }

  /**
   * Get distinct values for a filter field
   */
  async getFilterValues(field: 'status' | 'category', limit: number = 1000): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/filters/values?field=${field}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ApiResponse<string[]> = await response.json()

      if (!result.success || !result.data) {
        return []
      }

      return result.data
    } catch (error) {
      console.error(`Error fetching filter values for ${field}:`, error)
      return []
    }
  }

  /**
   * Bulk import Emission Factor Version records
   */
  async bulkImport(emissionFactorVersions: CreateEmissionFactorVersionDto[]): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': 'System',
        },
        body: JSON.stringify({ emissionFactorVersions }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to import Emission Factor Version records: ${response.statusText}`)
      }

      const result: ApiResponse<{ success: number; failed: number; errors: string[] }> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to import Emission Factor Version records')
      }

      return result.data
    } catch (error) {
      console.error('Error importing Emission Factor Version records:', error)
      throw error
    }
  }
}

// Export singleton instance
export const emissionFactorVersionApi = new EmissionFactorVersionApiClient()

