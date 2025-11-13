/**
 * API Client for ThermalCriteria
 * Handles all HTTP requests to the Thermal Criteria API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface ThermalCriteria {
  id: string
  Zone?: string
  Thermal Criteria?: string
  Pasted field 1?: string
  [key: string]: any
}

export interface CreateThermalCriteriaDto {
  Zone?: string
  Thermal Criteria?: string
  Pasted field 1?: string
  [key: string]: any
}

export interface UpdateThermalCriteriaDto {
  Zone?: string
  Thermal Criteria?: string
  Pasted field 1?: string
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

class ThermalCriteriaApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/thermal-criteria`
  }

  async getPaginated(params: {
    pageSize?: number
    offset?: string
    filterByFormula?: string
    sort?: Array<{ field: string; direction: 'asc' | 'desc' }>
  }): Promise<PaginatedResponse<ThermalCriteria>> {
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
      throw new Error(`Failed to fetch Thermal Criteria: ${response.statusText}`)
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

  async getById(id: string): Promise<ThermalCriteria> {
    const response = await fetch(`${this.baseUrl}/${id}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch Thermal Criteria: ${response.statusText}`)
    }
    const result = await response.json()
    return result.data
  }

  async create(data: CreateThermalCriteriaDto): Promise<ThermalCriteria> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`Failed to create Thermal Criteria: ${response.statusText}`)
    }
    const result = await response.json()
    return result.data
  }

  async update(id: string, data: UpdateThermalCriteriaDto): Promise<ThermalCriteria> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`Failed to update Thermal Criteria: ${response.statusText}`)
    }
    const result = await response.json()
    return result.data
  }

  async delete(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error(`Failed to delete Thermal Criteria: ${response.statusText}`)
    }
    return response.json()
  }
}

export const thermalCriteriaApi = new ThermalCriteriaApiClient()
