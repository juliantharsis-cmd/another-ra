/**
 * API Client for ActivityDensity
 * Handles all HTTP requests to the Activity Density API
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

export interface ActivityDensity {
  id: string
  Name?: string
  Status?: 'Active' | 'Inactive' | string
  [key: string]: any
}

export interface CreateActivityDensityDto {
  Name?: string
  Status?: 'Active' | 'Inactive' | string
  [key: string]: any
}

export interface UpdateActivityDensityDto {
  Name?: string
  Status?: 'Active' | 'Inactive' | string
  [key: string]: any
}

class ActivityDensityApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/activity-density`
  }

  /**
   * Get Activity Density records with pagination, sorting, filtering, and search
   */
  async getPaginated(params: PaginationParams): Promise<{ 
    data: ActivityDensity[]; 
    pagination: { total: number; limit: number; offset: number; hasMore: boolean } 
  }> {
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

    const result: ApiResponse<ActivityDensity[]> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch Activity Density records')
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
  }

  /**
   * Get a single Activity Density record by ID
   */
  async getById(id: string): Promise<ActivityDensity> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch Activity Density record: ${response.statusText}`)
    }

    const result: ApiResponse<ActivityDensity> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch Activity Density record')
    }

    return result.data
  }

  /**
   * Create a new Activity Density record
   */
  async create(data: CreateActivityDensityDto): Promise<ActivityDensity> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to create Activity Density record: ${response.statusText}`)
    }

    const result: ApiResponse<ActivityDensity> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create Activity Density record')
    }

    return result.data
  }

  /**
   * Update an Activity Density record
   */
  async update(id: string, data: UpdateActivityDensityDto): Promise<ActivityDensity> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to update Activity Density record: ${response.statusText}`)
    }

    const result: ApiResponse<ActivityDensity> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update Activity Density record')
    }

    return result.data
  }

  /**
   * Delete an Activity Density record
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to delete Activity Density record: ${response.statusText}`)
    }

    const result: ApiResponse<void> = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete Activity Density record')
    }
  }
}

export const activityDensityApi = new ActivityDensityApiClient()

