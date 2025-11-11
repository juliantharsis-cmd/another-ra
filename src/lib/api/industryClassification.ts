/**
 * API Client for Industry Classification & Emission Factors
 * Handles all HTTP requests to the Industry Classification API
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

export interface IndustryClassification {
  id: string
  Name?: string
  Description?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  lastModifiedBy?: string
  [key: string]: any
}

export interface CreateIndustryClassificationDto {
  Name: string
  Description?: string
  [key: string]: any
}

export interface UpdateIndustryClassificationDto {
  Name?: string
  Description?: string
  [key: string]: any
}

/**
 * Get paginated Industry Classification
 */
export async function getPaginatedIndustryClassification(params: PaginationParams = {}): Promise<ApiResponse<IndustryClassification[]>> {
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

    const response = await fetch(`${API_BASE_URL}/industry-classification?${queryParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching paginated Industry Classification:', error)
    throw error
  }
}

/**
 * Get a single Industry Classification by ID
 */
export async function getIndustryClassificationById(id: string): Promise<IndustryClassification> {
  try {
    const response = await fetch(`${API_BASE_URL}/industry-classification/${id}`, {
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
    console.error('Error fetching Industry Classification by ID:', error)
    throw error
  }
}

/**
 * Create a new Industry Classification
 */
export async function createIndustryClassification(data: CreateIndustryClassificationDto): Promise<IndustryClassification> {
  try {
    const response = await fetch(`${API_BASE_URL}/industry-classification`, {
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
    console.error('Error creating Industry Classification:', error)
    throw error
  }
}

/**
 * Update an existing Industry Classification
 */
export async function updateIndustryClassification(id: string, data: UpdateIndustryClassificationDto): Promise<IndustryClassification> {
  try {
    const response = await fetch(`${API_BASE_URL}/industry-classification/${id}`, {
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
    console.error('Error updating Industry Classification:', error)
    throw error
  }
}

/**
 * Delete an Industry Classification
 */
export async function deleteIndustryClassification(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/industry-classification/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }
  } catch (error) {
    console.error('Error deleting Industry Classification:', error)
    throw error
  }
}

/**
 * Get distinct values for a filter field
 */
export async function getFilterValues(field: string, limit: number = 100): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/industry-classification/filters/values?field=${field}&limit=${limit}`, {
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
 * Industry Classification API client object (for use with ListDetailTemplate)
 */
export const industryClassificationApi = {
  getPaginated: getPaginatedIndustryClassification,
  getById: getIndustryClassificationById,
  create: createIndustryClassification,
  update: updateIndustryClassification,
  delete: deleteIndustryClassification,
  getFilterValues,
}

