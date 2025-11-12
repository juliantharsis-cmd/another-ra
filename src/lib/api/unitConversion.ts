/**
 * API Client for Unit Conversion
 * Handles all HTTP requests to the Unit Conversion API
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

export interface UnitConversion {
  id: string
  Name?: string
  'Unit to convert'?: string | string[]
  'Unit to convert Name'?: string | string[]
  'Dimension (from Unit to convert)'?: string
  'Normalized unit'?: string | string[]
  'Normalized unit Name'?: string | string[]
  'Dimension (from Normalized unit)'?: string
  Value?: number
  'Conversion value'?: number
  Type?: string
  Description?: string
  'Activity Density'?: string | string[]
  'Activity Density Name'?: string | string[]
  Status?: 'Active' | 'Inactive'
  Notes?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  lastModifiedBy?: string
}

export interface CreateUnitConversionDto {
  Name?: string
  'Unit to convert'?: string | string[]
  'Normalized unit'?: string | string[]
  Value?: number
  'Conversion value'?: number
  Type?: string
  Description?: string
  'Activity Density'?: string | string[]
  Status?: 'Active' | 'Inactive'
  Notes?: string
}

export interface UpdateUnitConversionDto {
  Name?: string
  'Unit to convert'?: string | string[]
  'Normalized unit'?: string | string[]
  Value?: number
  'Conversion value'?: number
  Type?: string
  Description?: string
  'Activity Density'?: string | string[]
  Status?: 'Active' | 'Inactive'
  Notes?: string
}

/**
 * API Client for Unit Conversion
 */
class UnitConversionApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/unit-conversion`
  }

  async getPaginated(params: PaginationParams): Promise<{ 
    data: UnitConversion[]; 
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

        const result: ApiResponse<UnitConversion[]> = await response.json()

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to fetch Unit Conversion records')
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
          const delay = Math.pow(2, attempt) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError || new Error('Failed to fetch Unit Conversion records after retries')
  }

  async getById(id: string): Promise<UnitConversion> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch Unit Conversion record: ${response.statusText}`)
    }

    const result: ApiResponse<UnitConversion> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch Unit Conversion record')
    }

    return result.data
  }

  async create(data: CreateUnitConversionDto): Promise<UnitConversion> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to create Unit Conversion record: ${response.statusText}`)
    }

    const result: ApiResponse<UnitConversion> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create Unit Conversion record')
    }

    return result.data
  }

  async update(id: string, data: UpdateUnitConversionDto): Promise<UnitConversion> {
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
        throw new Error(errorData.error || errorData.message || `Failed to update Unit Conversion record: ${response.statusText}`)
      }

      const result: ApiResponse<UnitConversion> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || result.message || 'Failed to update Unit Conversion record')
      }

      return result.data
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to the server. Please check if the API server is running on http://localhost:3001')
      }
      throw error
    }
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to delete Unit Conversion record: ${response.statusText}`)
    }
  }

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
export const unitConversionApi = new UnitConversionApiClient()

