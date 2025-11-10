/**
 * API Client for GHG Type
 * Handles all HTTP requests to the GHG Type API
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

export interface GHGType {
  id: string
  Name?: string
  'Short code'?: string
  Description?: string
  Formula?: string
  Category?: string
  Status?: 'Active' | 'Inactive'
  Notes?: string
  // Relationship to EF GWP (reverse relationship)
  efGwp?: string[]
  efGwpCount?: number
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  lastModifiedBy?: string
}

export interface CreateGHGTypeDto {
  Name?: string
  'Short code'?: string
  Description?: string
  Formula?: string
  Category?: string
  Status?: 'Active' | 'Inactive'
  Notes?: string
}

export interface UpdateGHGTypeDto {
  Name?: string
  'Short code'?: string
  Description?: string
  Formula?: string
  Category?: string
  Status?: 'Active' | 'Inactive'
  Notes?: string
}

/**
 * API Client for GHG Type
 */
class GHGTypeApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/ghg-types`
  }

  /**
   * Get GHG Type records with pagination, sorting, filtering, and search
   */
  async getPaginated(params: PaginationParams): Promise<{ 
    data: GHGType[]; 
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

        const result: ApiResponse<GHGType[]> = await response.json()

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to fetch GHG Type records')
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

    throw lastError || new Error('Failed to fetch GHG Type records after retries')
  }

  /**
   * Get a single GHG Type record by ID
   */
  async getById(id: string): Promise<GHGType> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch GHG Type record: ${response.statusText}`)
    }

    const result: ApiResponse<GHGType> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch GHG Type record')
    }

    return result.data
  }

  /**
   * Create a new GHG Type record
   */
  async create(data: CreateGHGTypeDto): Promise<GHGType> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to create GHG Type record: ${response.statusText}`)
    }

    const result: ApiResponse<GHGType> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create GHG Type record')
    }

    return result.data
  }

  /**
   * Update an existing GHG Type record
   */
  async update(id: string, data: UpdateGHGTypeDto): Promise<GHGType> {
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
        throw new Error(errorData.error || errorData.message || `Failed to update GHG Type record: ${response.statusText}`)
      }

      const result: ApiResponse<GHGType> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || result.message || 'Failed to update GHG Type record')
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
   * Delete a GHG Type record
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
      throw new Error(errorData.error || `Failed to delete GHG Type record: ${response.statusText}`)
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
   * Bulk import GHG Type records
   */
  async bulkImport(ghgTypes: CreateGHGTypeDto[]): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': 'System',
        },
        body: JSON.stringify({ ghgTypes }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to import GHG Type records: ${response.statusText}`)
      }

      const result: ApiResponse<{ success: number; failed: number; errors: string[] }> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to import GHG Type records')
      }

      return result.data
    } catch (error) {
      console.error('Error importing GHG Type records:', error)
      throw error
    }
  }
}

// Export singleton instance
export const ghgTypeApi = new GHGTypeApiClient()

