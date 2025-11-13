/**
 * API Client for Application List
 * Handles all HTTP requests to the Application List API
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
}

export interface ApplicationList {
  id: string
  Name?: string
  Description?: string
  'Alt URL'?: string // Alternative URL field
  Attachment?: any[] // Airtable attachment field
  Status?: 'Active' | 'Inactive'
  Order?: number // Order/sequence field
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  lastModifiedBy?: string
}

export interface CreateApplicationListDto {
  Name?: string
  Description?: string
  'Alt URL'?: string
  Attachment?: any[]
  Status?: 'Active' | 'Inactive'
  Order?: number
}

export interface UpdateApplicationListDto {
  Name?: string
  Description?: string
  'Alt URL'?: string
  Attachment?: any[]
  Status?: 'Active' | 'Inactive'
  Order?: number
}

/**
 * API Client for Application List
 */
class ApplicationListApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/application-list`
  }

  /**
   * Get Application List records with pagination, sorting, filtering, and search
   */
  async getPaginated(params: PaginationParams): Promise<{ 
    data: ApplicationList[]; 
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

        const response = await fetch(`${this.baseUrl}?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result: ApiResponse<ApplicationList[]> = await response.json()

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to fetch Application List records')
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

    throw lastError || new Error('Failed to fetch Application List records after retries')
  }

  /**
   * Get a single Application List record by ID
   */
  async getById(id: string): Promise<ApplicationList> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch Application List record: ${response.statusText}`)
    }

    const result: ApiResponse<ApplicationList> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch Application List record')
    }

    return result.data
  }

  /**
   * Create a new Application List record
   */
  async create(data: CreateApplicationListDto): Promise<ApplicationList> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to create Application List record: ${response.statusText}`)
    }

    const result: ApiResponse<ApplicationList> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create Application List record')
    }

    return result.data
  }

  /**
   * Update an existing Application List record
   */
  async update(id: string, data: UpdateApplicationListDto): Promise<ApplicationList> {
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
        throw new Error(errorData.error || errorData.message || `Failed to update Application List record: ${response.statusText}`)
      }

      const result: ApiResponse<ApplicationList> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || result.message || 'Failed to update Application List record')
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
   * Delete a Application List record
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
      throw new Error(errorData.error || `Failed to delete Application List record: ${response.statusText}`)
    }
  }

  /**
   * Get distinct values for a filter field
   */
  async getFilterValues(field: 'status', limit: number = 1000): Promise<string[]> {
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
   * Bulk import Application List records
   */
  async bulkImport(applicationLists: CreateApplicationListDto[]): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': 'System',
        },
        body: JSON.stringify({ applicationLists }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to import Application List records: ${response.statusText}`)
      }

      const result: ApiResponse<{ success: number; failed: number; errors: string[] }> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to import Application List records')
      }

      return result.data
    } catch (error) {
      console.error('Error importing Application List records:', error)
      throw error
    }
  }
}

// Export singleton instance
export const applicationListApi = new ApplicationListApiClient()

