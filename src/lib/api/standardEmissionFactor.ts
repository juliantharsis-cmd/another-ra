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
  Status?: 'Active' | 'Inactive' | string
  'Emission Factors Dataset'?: string | string[]
  'Emission Factors Dataset Name'?: string | string[]
  'Emission Factor (CO2e)'?: number
  'Type of EF'?: string
  'GHG Unit (CO2e)'?: string | string[]
  'GHG Unit (CO2e) Name'?: string | string[]
  Created?: string
  'Last Modified'?: string
  'Industry Classification & Emission Factors'?: string | string[]
  'Industry Classification & Emission Factors Name'?: string | string[]
  Version?: string | string[]
  'Version Name'?: string | string[]
  'Publication Date'?: string
  'Normalized activity'?: string | string[]
  'Normalized activity Name'?: string | string[]
  'Ref.IC'?: string | string[]
  'Industry Classification'?: string | string[]
  'Industry Classification Name'?: string | string[]
  'Source UOM'?: string | string[]
  'Source UOM Name'?: string | string[]
  Scope?: string | string[]
  'Scope Name'?: string | string[]
  'Availability '?: string
  'code (from Industry Classification  🏭)'?: string
  'Name copy'?: string
  ID?: number
  'Activity Default UOM'?: string | string[]
  'Activity Default UOM Name'?: string | string[]
  'EF/Detailed G'?: string | string[]
  'EF/Detailed G Name'?: string | string[]
  'Dimension (from Source UOM)'?: string
  'Status (from Version)'?: string
  // Optional fields that may not exist in all bases
  Description?: string
  Notes?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  lastModifiedBy?: string
}

export interface CreateStandardEmissionFactorDto {
  Name?: string
  Status?: 'Active' | 'Inactive' | string
  'Emission Factors Dataset'?: string | string[]
  'Emission Factor (CO2e)'?: number
  'Type of EF'?: string
  'GHG Unit (CO2e)'?: string | string[]
  'Industry Classification & Emission Factors'?: string | string[]
  Version?: string | string[]
  'Publication Date'?: string
  'Normalized activity'?: string | string[]
  'Ref.IC'?: string | string[]
  'Industry Classification'?: string | string[]
  'Source UOM'?: string | string[]
  Scope?: string | string[]
  'Availability '?: string
  'Name copy'?: string
  ID?: number
  'Activity Default UOM'?: string | string[]
  'EF/Detailed G'?: string | string[]
  // Optional fields
  Description?: string
  Notes?: string
}

export interface UpdateStandardEmissionFactorDto {
  Name?: string
  Status?: 'Active' | 'Inactive' | string
  'Emission Factors Dataset'?: string | string[]
  'Emission Factor (CO2e)'?: number
  'Type of EF'?: string
  'GHG Unit (CO2e)'?: string | string[]
  'Industry Classification & Emission Factors'?: string | string[]
  Version?: string | string[]
  'Publication Date'?: string
  'Normalized activity'?: string | string[]
  'Ref.IC'?: string | string[]
  'Industry Classification'?: string | string[]
  'Source UOM'?: string | string[]
  Scope?: string | string[]
  'Availability '?: string
  'Name copy'?: string
  ID?: number
  'Activity Default UOM'?: string | string[]
  'EF/Detailed G'?: string | string[]
  // Optional fields
  Description?: string
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

