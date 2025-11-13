/**
 * API Client for GeoCode
 * Handles all HTTP requests to the geo Code API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface GeoCode {
  id: string
  Name?: string
  Notes?: string
  Assignee?: string
  Status?: string
  Ref?: string
  Region?: string
  Geography 🌍?: string
  [key: string]: any
}

export interface CreateGeoCodeDto {
  Name?: string
  Notes?: string
  Assignee?: string
  Status?: string
  Ref?: string
  Region?: string
  Geography 🌍?: string
  [key: string]: any
}

export interface UpdateGeoCodeDto {
  Name?: string
  Notes?: string
  Assignee?: string
  Status?: string
  Ref?: string
  Region?: string
  Geography 🌍?: string
  [key: string]: any
}

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  count: number
  offset?: string
  pagination?: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

class GeoCodeApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/geo-code`
  }

  async getPaginated(params: {
    pageSize?: number
    offset?: string
    filterByFormula?: string
    sort?: Array<{ field: string; direction: 'asc' | 'desc' }>
  }): Promise<PaginatedResponse<GeoCode>> {
    const queryParams = new URLSearchParams()
    if (params?.pageSize) queryParams.append('limit', params.pageSize.toString())
    if (params?.offset) queryParams.append('offset', params.offset)
    if (params?.sort && params.sort.length > 0) {
      queryParams.append('sortBy', params.sort[0].field)
      queryParams.append('sortOrder', params.sort[0].direction)
    }

    const url = `${this.baseUrl}?${queryParams.toString()}`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch geo Code: ${response.statusText}`)
    }
    const result = await response.json()
    
    return {
      success: result.success,
      data: result.data || [],
      count: result.pagination?.total || result.data?.length || 0,
      offset: params.offset,
      pagination: result.pagination,
    }
  }

  async getById(id: string): Promise<GeoCode> {
    const response = await fetch(`${this.baseUrl}/${id}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch geo Code: ${response.statusText}`)
    }
    const result = await response.json()
    return result.data
  }

  async create(data: CreateGeoCodeDto): Promise<GeoCode> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`Failed to create geo Code: ${response.statusText}`)
    }
    const result = await response.json()
    return result.data
  }

  async update(id: string, data: UpdateGeoCodeDto): Promise<GeoCode> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`Failed to update geo Code: ${response.statusText}`)
    }
    const result = await response.json()
    return result.data
  }

  async delete(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error(`Failed to delete geo Code: ${response.statusText}`)
    }
    return response.json()
  }
}

export const geoCodeApi = new GeoCodeApiClient()
