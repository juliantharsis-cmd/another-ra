/**
 * API Client for EF GWP (Emission Factor Global Warming Potential)
 * Handles all HTTP requests to the EF GWP API
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
  greenHouseGas?: string // Filter by GHG Type ID
}

export interface EFGWP {
  id: string
  factor_name: string // Name (formula field)
  ars_version?: string // ARS Version
  status: 'Active' | 'Inactive'
  gwp_value: number // GWP factor
  ef_co2e?: string // EF CO2e
  notes?: string
  // Relationship to GHG Type
  greenHouseGas?: string | string[]
  greenHouseGasName?: string | string[]
  // Relationship to Protocol
  protocol?: string | string[]
  protocolName?: string | string[]
  // Relationship to EF/Detailed G
  efDetailedG?: string | string[]
  efDetailedGName?: string | string[]
  // Legacy fields (for backward compatibility)
  unit?: string
  source?: string
  created_at?: string
  updated_at?: string
  createdBy?: string
  lastModifiedBy?: string
}

export interface CreateEFGWPDto {
  factor_name?: string // Name (formula - may be auto-generated)
  ars_version?: string
  status?: 'Active' | 'Inactive'
  gwp_value: number // GWP factor
  ef_co2e?: string // EF CO2e
  notes?: string
  greenHouseGas?: string | string[]
  protocol?: string | string[]
  efDetailedG?: string | string[]
  // Legacy fields
  unit?: string
  source?: string
}

export interface UpdateEFGWPDto {
  factor_name?: string // Name (formula - may be read-only)
  ars_version?: string
  status?: 'Active' | 'Inactive'
  gwp_value?: number // GWP factor
  ef_co2e?: string // EF CO2e
  notes?: string
  greenHouseGas?: string | string[]
  protocol?: string | string[]
  efDetailedG?: string | string[]
  // Legacy fields
  unit?: string
  source?: string
}

/**
 * API Client for EF GWP
 */
class EFGWPApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/emission-factors`
  }

  /**
   * Get EF GWP records with pagination, sorting, filtering, and search
   */
  async getPaginated(params: PaginationParams): Promise<{ 
    data: EFGWP[]; 
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
        if (params.greenHouseGas) {
          queryParams.append('greenHouseGas', params.greenHouseGas)
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

        const result: ApiResponse<EFGWP[]> = await response.json()

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to fetch EF GWP records')
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

    throw lastError || new Error('Failed to fetch EF GWP records after retries')
  }

  /**
   * Get a single EF GWP record by ID
   */
  async getById(id: string): Promise<EFGWP> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch EF GWP record: ${response.statusText}`)
    }

    const result: ApiResponse<EFGWP> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch EF GWP record')
    }

    return result.data
  }

  /**
   * Create a new EF GWP record
   */
  async create(data: CreateEFGWPDto): Promise<EFGWP> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to create EF GWP record: ${response.statusText}`)
    }

    const result: ApiResponse<EFGWP> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create EF GWP record')
    }

    return result.data
  }

  /**
   * Update an existing EF GWP record
   */
  async update(id: string, data: UpdateEFGWPDto): Promise<EFGWP> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || `Failed to update EF GWP record: ${response.statusText}`)
      }

      const result: ApiResponse<EFGWP> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || result.message || 'Failed to update EF GWP record')
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
   * Delete an EF GWP record
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
      throw new Error(errorData.error || `Failed to delete EF GWP record: ${response.statusText}`)
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
export const efGwpApi = new EFGWPApiClient()

// Export type alias for backward compatibility (deprecated, use EFGWP)
export type EmissionFactor = EFGWP
export type CreateEmissionFactorDto = CreateEFGWPDto
export type UpdateEmissionFactorDto = UpdateEFGWPDto
export const emissionFactorApi = efGwpApi

