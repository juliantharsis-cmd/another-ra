/**
 * API Client for Geography
 * Handles all HTTP requests to the geography API
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
  country?: string
}

export interface Geography {
  id: string
  Name: string  // Airtable field name
  CODE: string  // Airtable field name
  Status: 'Active' | 'Inactive'  // Airtable field name
  Notes?: string  // Airtable field name
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  lastModifiedBy?: string
  // Legacy aliases for backward compatibility
  regionName?: string  // Maps to Name
  country?: string  // Maps to CODE
  status?: 'Active' | 'Inactive'  // Maps to Status
  notes?: string  // Maps to Notes
}

export interface CreateGeographyDto {
  Name?: string  // Airtable field name
  CODE?: string  // Airtable field name
  Status?: 'Active' | 'Inactive'  // Airtable field name
  Notes?: string  // Airtable field name
  // Legacy aliases for backward compatibility
  regionName?: string  // Maps to Name
  country?: string  // Maps to CODE
  status?: 'Active' | 'Inactive'  // Maps to Status
  notes?: string  // Maps to Notes
}

export interface UpdateGeographyDto {
  Name?: string  // Airtable field name
  CODE?: string  // Airtable field name
  Status?: 'Active' | 'Inactive'  // Airtable field name
  Notes?: string  // Airtable field name
  // Legacy aliases for backward compatibility
  regionName?: string  // Maps to Name
  country?: string  // Maps to CODE
  status?: 'Active' | 'Inactive'  // Maps to Status
  notes?: string  // Maps to Notes
}

/**
 * API Client for Geography
 */
class GeographyApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/geography`
  }

  /**
   * Get geography records with pagination, sorting, filtering, and search
   */
  async getPaginated(params: PaginationParams): Promise<{ 
    data: Geography[]; 
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
        if (params.country) {
          queryParams.append('country', params.country)
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

        const result: ApiResponse<Geography[]> = await response.json()

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to fetch geography records')
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

    throw lastError || new Error('Failed to fetch geography records after retries')
  }

  /**
   * Get a single geography record by ID
   */
  async getById(id: string): Promise<Geography> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch geography record: ${response.statusText}`)
    }

    const result: ApiResponse<Geography> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch geography record')
    }

    return result.data
  }

  /**
   * Create a new geography record
   */
  async create(data: CreateGeographyDto): Promise<Geography> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to create geography record: ${response.statusText}`)
    }

    const result: ApiResponse<Geography> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create geography record')
    }

    return result.data
  }

  /**
   * Update an existing geography record
   */
  async update(id: string, data: UpdateGeographyDto): Promise<Geography> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to update geography record: ${response.statusText}`)
    }

    const result: ApiResponse<Geography> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update geography record')
    }

    return result.data
  }

  /**
   * Delete a geography record
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
      throw new Error(errorData.error || `Failed to delete geography record: ${response.statusText}`)
    }
  }

  /**
   * Get distinct values for a filter field
   */
  async getFilterValues(field: 'status' | 'country', limit: number = 1000): Promise<string[]> {
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
   * Bulk import geography records
   */
  async bulkImport(geographies: CreateGeographyDto[]): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': 'Julian THARSIS',
        },
        body: JSON.stringify({ geographies }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to import geography records: ${response.statusText}`)
      }

      const result: ApiResponse<{ success: number; failed: number; errors: string[] }> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to import geography records')
      }

      return result.data
    } catch (error) {
      console.error('Error importing geography records:', error)
      throw error
    }
  }
}

// Export singleton instance
export const geographyApi = new GeographyApiClient()

