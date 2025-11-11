/**
 * API Client for Standard Emission Factor
 * Handles all HTTP requests to the Standard Emission Factor API
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

export interface StandardEmissionFactor {
  id: string
  Name?: string
  Description?: string
  Status?: 'Active' | 'Inactive'
  'Emission Factor Version'?: string | string[]
  'Emission Factor Version Name'?: string | string[]
  'Emission Factor Set'?: string | string[]
  'Emission Factor Set Name'?: string | string[]
  'GHG TYPE'?: string | string[]
  'GHG TYPE Name'?: string | string[]
  'EF GWP'?: string | string[]
  'EF GWP Name'?: string | string[]
  'EF/Detailed G'?: string | string[]
  'EF/Detailed G Name'?: string | string[]
  Notes?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  lastModifiedBy?: string
}

export interface CreateStandardEmissionFactorDto {
  Name?: string
  Description?: string
  Status?: 'Active' | 'Inactive'
  'Emission Factor Version'?: string | string[]
  'Emission Factor Set'?: string | string[]
  'GHG TYPE'?: string | string[]
  'EF GWP'?: string | string[]
  'EF/Detailed G'?: string | string[]
  Notes?: string
}

export interface UpdateStandardEmissionFactorDto {
  Name?: string
  Description?: string
  Status?: 'Active' | 'Inactive'
  'Emission Factor Version'?: string | string[]
  'Emission Factor Set'?: string | string[]
  'GHG TYPE'?: string | string[]
  'EF GWP'?: string | string[]
  'EF/Detailed G'?: string | string[]
  Notes?: string
}

/**
 * API Client for Standard Emission Factor
 */
class StandardEmissionFactorApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/standard-emission-factors`
  }

  /**
   * Get Standard Emission Factor records with pagination, sorting, filtering, and search
   */
  async getPaginated(params: PaginationParams): Promise<{ 
    data: StandardEmissionFactor[]; 
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

        const result: ApiResponse<StandardEmissionFactor[]> = await response.json()

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to fetch Standard Emission Factor records')
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

    throw lastError || new Error('Failed to fetch Standard Emission Factor records after retries')
  }

  /**
   * Get a single Standard Emission Factor record by ID
   */
  async getById(id: string): Promise<StandardEmissionFactor> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch Standard Emission Factor record: ${response.statusText}`)
    }

    const result: ApiResponse<StandardEmissionFactor> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch Standard Emission Factor record')
    }

    return result.data
  }

  /**
   * Create a new Standard Emission Factor record
   */
  async create(data: CreateStandardEmissionFactorDto): Promise<StandardEmissionFactor> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to create Standard Emission Factor record: ${response.statusText}`)
    }

    const result: ApiResponse<StandardEmissionFactor> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create Standard Emission Factor record')
    }

    return result.data
  }

  /**
   * Update an existing Standard Emission Factor record
   */
  async update(id: string, data: UpdateStandardEmissionFactorDto): Promise<StandardEmissionFactor> {
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
        throw new Error(errorData.error || errorData.message || `Failed to update Standard Emission Factor record: ${response.statusText}`)
      }

      const result: ApiResponse<StandardEmissionFactor> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || result.message || 'Failed to update Standard Emission Factor record')
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
   * Delete a Standard Emission Factor record
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
      throw new Error(errorData.error || `Failed to delete Standard Emission Factor record: ${response.statusText}`)
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
}

// Export singleton instance
export const standardEmissionFactorApi = new StandardEmissionFactorApiClient()

