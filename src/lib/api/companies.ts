import { Company } from '../mockData'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  count?: number
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
  primaryIndustry?: string
  primaryActivity?: string
}

export interface CreateCompanyDto {
  isinCode: string
  companyName: string
  status: 'Active' | 'Closed'
  primarySector?: string
  primaryActivity?: string
  primaryIndustry?: string
  notes?: string
}

export interface UpdateCompanyDto {
  isinCode?: string
  companyName?: string
  status?: 'Active' | 'Closed'
  primarySector?: string
  primaryActivity?: string
  primaryIndustry?: string
  notes?: string
}

/**
 * API Client for Companies
 * Handles all HTTP requests to the companies API
 */
class CompaniesApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/companies`
  }

  /**
   * Get all companies with retry logic (for backward compatibility)
   */
  async getAll(): Promise<Company[]> {
    const result = await this.getPaginated({})
    return result.data
  }

  /**
   * Get companies with pagination, sorting, filtering, and search
   */
  async getPaginated(params: PaginationParams): Promise<{ data: Company[]; pagination: { total: number; limit: number; offset: number; hasMore: boolean } }> {
    const maxRetries = 3
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Build query string
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
        if (params.primaryIndustry) {
          queryParams.append('primaryIndustry', params.primaryIndustry)
        }
        if (params.primaryActivity) {
          queryParams.append('primaryActivity', params.primaryActivity)
        }

        const url = `${this.baseUrl}?${queryParams.toString()}`
        
        // Create abort controller for better timeout handling
        const abortController = new AbortController()
        const timeoutId = setTimeout(() => abortController.abort(), 30000) // 30 second timeout

        try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
            signal: abortController.signal,
        })

          clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`)
        }

        const result: ApiResponse<Company[]> = await response.json()

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to fetch companies')
        }

        return {
          data: result.data,
          pagination: result.pagination || {
            total: result.count || result.data.length,
            limit: params.limit || result.data.length,
            offset: params.page ? (params.page - 1) * (params.limit || 25) : 0,
            hasMore: false,
          },
        }
        } catch (fetchError) {
          clearTimeout(timeoutId)
          throw fetchError
        }
      } catch (error) {
        lastError = error as Error
        console.error(`Attempt ${attempt}/${maxRetries} failed:`, error)
        
        // Handle timeout/abort errors with better messaging
        if ((error as any).name === 'AbortError' || (error as Error).message.includes('timeout')) {
          const isFiltered = params.status || params.primaryIndustry || params.primaryActivity || params.search
          if (isFiltered) {
            throw new Error('The filter query took too long to process. This may happen when filters result in no records. Try simplifying your filters or check if the filter values exist in the data.')
          } else {
            throw new Error('Request timed out. The server may be processing a large dataset. Please try again or contact support if the issue persists.')
          }
        }
        
        // If it's a connection error and we have retries left, wait and retry
        if (attempt < maxRetries && (error instanceof TypeError || (error as any).name === 'AbortError')) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Exponential backoff
          continue
        }
        
        // Final attempt failed or non-retryable error
        if (error instanceof TypeError || (error as any).name === 'AbortError') {
          throw new Error(`Cannot connect to API server at ${this.baseUrl}. Make sure the server is running on port 3001. Error: ${lastError.message}`)
        }
        throw error
      }
    }

    throw lastError || new Error('Failed to fetch companies after multiple attempts')
  }

  /**
   * Get a single company by ID
   */
  async getById(id: string): Promise<Company> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`)
      const result: ApiResponse<Company> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch company')
      }

      return result.data
    } catch (error) {
      console.error('Error fetching company:', error)
      throw error
    }
  }

  /**
   * Create a new company
   */
  async create(dto: CreateCompanyDto): Promise<Company> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': 'Julian THARSIS', // In real app, get from auth context
        },
        body: JSON.stringify(dto),
      })

      const result: ApiResponse<Company> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create company')
      }

      return result.data
    } catch (error) {
      console.error('Error creating company:', error)
      throw error
    }
  }

  /**
   * Update an existing company
   */
  async update(id: string, dto: UpdateCompanyDto): Promise<Company> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': 'Julian THARSIS', // In real app, get from auth context
        },
        body: JSON.stringify(dto),
      })

      const result: ApiResponse<Company> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to update company')
      }

      return result.data
    } catch (error) {
      console.error('Error updating company:', error)
      throw error
    }
  }

  /**
   * Delete a company
   */
  async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      })

      const result: ApiResponse<void> = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete company')
      }
    } catch (error) {
      console.error('Error deleting company:', error)
      throw error
    }
  }

  /**
   * Get distinct values for a filter field
   */
  async getFilterValues(field: 'status' | 'primaryIndustry' | 'primaryActivity' | 'primarySector', limit: number = 1000): Promise<string[]> {
    const maxRetries = 3
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const url = `${this.baseUrl}/filters/values?field=${field}&limit=${limit}`
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(15000), // 15 second timeout
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`)
        }

        const result: ApiResponse<string[]> = await response.json()

        if (!result.success || !result.data) {
          throw new Error(result.message || 'Failed to get filter values')
        }

        return result.data
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Unknown error')
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
          console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError || new Error('Failed to get filter values after retries')
  }

  /**
   * Bulk import companies
   */
  async bulkImport(companies: CreateCompanyDto[]): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      console.log('📤 Sending bulk import request to:', `${this.baseUrl}/import`)
      console.log('   Companies to import:', companies.length)
      console.log('   First company:', companies[0] ? JSON.stringify(companies[0], null, 2) : 'none')
      
      const response = await fetch(`${this.baseUrl}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': 'Julian THARSIS',
        },
        body: JSON.stringify({ companies }),
      })
      
      console.log('📥 Bulk import response status:', response.status, response.statusText)

      const result: ApiResponse<{ success: number; failed: number; errors: string[] }> = await response.json()
      
      console.log('📥 Bulk import response:', JSON.stringify(result, null, 2))

      if (!result.success || !result.data) {
        console.error('❌ Bulk import failed:', result.error || result.message)
        throw new Error(result.error || result.message || 'Failed to import companies')
      }

      console.log('✅ Bulk import successful:', result.data)
      return result.data
    } catch (error) {
      console.error('Error importing companies:', error)
      throw error
    }
  }
}

// Export singleton instance
export const companiesApi = new CompaniesApiClient()

