/**
 * API Client for User Roles
 * Handles all HTTP requests to the User Roles API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: {
    total: number
    page: number
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
  filters?: Record<string, any>
}

export interface UserRole {
  id: string
  Name?: string
  Description?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  lastModifiedBy?: string
  [key: string]: any
}

export interface CreateUserRoleDto {
  Name: string
  Description?: string
  [key: string]: any
}

export interface UpdateUserRoleDto {
  Name?: string
  Description?: string
  [key: string]: any
}

/**
 * Get paginated User Roles
 */
export async function getPaginatedUserRoles(params: PaginationParams = {}): Promise<ApiResponse<UserRole[]>> {
  try {
    const queryParams = new URLSearchParams()
    queryParams.append('paginated', 'true')
    
    if (params.page) queryParams.append('page', String(params.page))
    if (params.limit) queryParams.append('limit', String(params.limit))
    if (params.search) queryParams.append('search', params.search)
    if (params.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)
    
    // Add filters as query parameters
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            // Send array values as multiple query parameters
            value.forEach(v => queryParams.append(key, String(v)))
          } else {
            queryParams.append(key, String(value))
          }
        }
      })
    }

    const response = await fetch(`${API_BASE_URL}/user-roles?${queryParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching paginated User Roles:', error)
    throw error
  }
}

/**
 * Get a single User Role by ID
 */
export async function getUserRoleById(id: string): Promise<UserRole> {
  try {
    const response = await fetch(`${API_BASE_URL}/user-roles/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error fetching User Role by ID:', error)
    throw error
  }
}

/**
 * Create a new User Role
 */
export async function createUserRole(data: CreateUserRoleDto): Promise<UserRole> {
  try {
    const response = await fetch(`${API_BASE_URL}/user-roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error creating User Role:', error)
    throw error
  }
}

/**
 * Update an existing User Role
 */
export async function updateUserRole(id: string, data: UpdateUserRoleDto): Promise<UserRole> {
  try {
    const response = await fetch(`${API_BASE_URL}/user-roles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error updating User Role:', error)
    throw error
  }
}

/**
 * Delete a User Role
 */
export async function deleteUserRole(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/user-roles/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }
  } catch (error) {
    console.error('Error deleting User Role:', error)
    throw error
  }
}

/**
 * Get distinct values for a filter field
 */
export async function getFilterValues(field: string, limit: number = 100): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/user-roles/filters/values?field=${field}&limit=${limit}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result.data || []
  } catch (error) {
    console.error(`Error fetching filter values for field ${field}:`, error)
    return []
  }
}

/**
 * User Roles API client object (for use with ListDetailTemplate)
 */
export const userRolesApi = {
  getPaginated: getPaginatedUserRoles,
  getById: getUserRoleById,
  create: createUserRole,
  update: updateUserRole,
  delete: deleteUserRole,
  getFilterValues,
}

