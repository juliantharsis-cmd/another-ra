/**
 * API Client for KeywordsTags
 * Handles all HTTP requests to the Keywords/Tags API
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

export interface KeywordsTags {
  id: string
  Name?: string
  Status?: 'Active' | 'Inactive' | string
  [key: string]: any
}

export interface CreateKeywordsTagsDto {
  Name?: string
  Status?: 'Active' | 'Inactive' | string
  [key: string]: any
}

export interface UpdateKeywordsTagsDto {
  Name?: string
  Status?: 'Active' | 'Inactive' | string
  [key: string]: any
}

class KeywordsTagsApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/keywords-tags`
  }

  /**
   * Get Keywords/Tags records with pagination, sorting, filtering, and search
   */
  async getPaginated(params: PaginationParams): Promise<{ 
    data: KeywordsTags[]; 
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

    const result: ApiResponse<KeywordsTags[]> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch Keywords/Tags records')
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
   * Get a single Keywords/Tags record by ID
   */
  async getById(id: string): Promise<KeywordsTags> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch Keywords/Tags record: ${response.statusText}`)
    }

    const result: ApiResponse<KeywordsTags> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch Keywords/Tags record')
    }

    return result.data
  }

  /**
   * Create a new Keywords/Tags record
   */
  async create(data: CreateKeywordsTagsDto): Promise<KeywordsTags> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to create Keywords/Tags record: ${response.statusText}`)
    }

    const result: ApiResponse<KeywordsTags> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create Keywords/Tags record')
    }

    return result.data
  }

  /**
   * Update a Keywords/Tags record
   */
  async update(id: string, data: UpdateKeywordsTagsDto): Promise<KeywordsTags> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to update Keywords/Tags record: ${response.statusText}`)
    }

    const result: ApiResponse<KeywordsTags> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update Keywords/Tags record')
    }

    return result.data
  }

  /**
   * Delete a Keywords/Tags record
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to delete Keywords/Tags record: ${response.statusText}`)
    }

    const result: ApiResponse<void> = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete Keywords/Tags record')
    }
  }
}

export const keywordsTagsApi = new KeywordsTagsApiClient()

