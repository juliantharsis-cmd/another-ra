/**
 * API Client for user table
 * Handles all HTTP requests to the user table API
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
  filters?: Record<string, any> // All filters as key-value pairs
  status?: string // Legacy support
  category?: string // Legacy support
}

export interface UserTable {
  id: string
  Email?: string
  'First Name'?: string
  'Last Name'?: string
  'User Name'?: string
  UID?: string
  Status?: 'Active' | 'Inactive' | 'Submitted'
  'Profile Name'?: string
  'Activity Scope'?: string
  Company?: string | string[]
  CompanyName?: string | string[]
  'User Roles'?: string | string[]
  'User Roles Name'?: string | string[]
  'Organization Scope'?: string | string[]
  'Organization Scope Name'?: string | string[]
  Modules?: string | string[]
  ModulesName?: string | string[]
  Notes?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  lastModifiedBy?: string
}

export interface CreateUserTableDto {
  Name?: string
  'Short code'?: string
  Description?: string
  Formula?: string
  Category?: string
  Status?: 'Active' | 'Inactive'
  Notes?: string
}

export interface UpdateUserTableDto {
  Name?: string
  'Short code'?: string
  Description?: string
  Formula?: string
  Category?: string
  Status?: 'Active' | 'Inactive'
  Notes?: string
}

/**
 * API Client for user table
 */
class UserTableApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/users`
  }

  /**
   * Get user table records with pagination, sorting, filtering, and search
   */
  async getPaginated(params: PaginationParams): Promise<{ 
    data: UserTable[]; 
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
        
        // Add all filters from params.filters object
        if (params.filters) {
          Object.entries(params.filters).forEach(([key, value]) => {
            if (value) {
              // Handle arrays by appending each value separately
              if (Array.isArray(value)) {
                value.forEach(v => {
                  if (v) {
                    queryParams.append(key, String(v))
                  }
                })
              } else {
                queryParams.append(key, String(value))
              }
            }
          })
        }
        
        // Legacy support for status and category (deprecated, use filters object)
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

        const result: ApiResponse<UserTable[]> = await response.json()

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to fetch user table records')
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

    throw lastError || new Error('Failed to fetch user table records after retries')
  }

  /**
   * Get a single user table record by ID
   */
  async getById(id: string): Promise<UserTable> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch user table record: ${response.statusText}`)
    }

    const result: ApiResponse<UserTable> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch user table record')
    }

    return result.data
  }

  /**
   * Create a new user table record
   */
  async create(data: CreateUserTableDto): Promise<UserTable> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to create user table record: ${response.statusText}`)
    }

    const result: ApiResponse<UserTable> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create user table record')
    }

    return result.data
  }

  /**
   * Update an existing user table record
   */
  async update(id: string, data: UpdateUserTableDto): Promise<UserTable> {
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
        throw new Error(errorData.error || errorData.message || `Failed to update user table record: ${response.statusText}`)
      }

      const result: ApiResponse<UserTable> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || result.message || 'Failed to update user table record')
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
   * Delete a user table record
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
      throw new Error(errorData.error || `Failed to delete user table record: ${response.statusText}`)
    }
  }

  /**
   * Get distinct values for a filter field
   */
  async getFilterValues(field: 'status' | 'category' | 'Company' | 'User Roles' | 'Modules', limit: number = 1000): Promise<string[]> {
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
   * Bulk import user table records
   */
  async bulkImport(userTables: CreateUserTableDto[]): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': 'System',
        },
        body: JSON.stringify({ userTables }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to import user table records: ${response.statusText}`)
      }

      const result: ApiResponse<{ success: number; failed: number; errors: string[] }> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to import user table records')
      }

      return result.data
    } catch (error) {
      console.error('Error importing user table records:', error)
      throw error
    }
  }
}

// Export singleton instance
export const userTableApi = new UserTableApiClient()

