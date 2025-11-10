/**
 * Preferences API Client
 * 
 * Frontend API client for user preferences
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export type PreferenceNamespace = 'ui' | 'table' | 'filters' | 'featureFlags' | 'misc'
export type PreferenceType = 'string' | 'number' | 'boolean' | 'json'
export type PreferenceVisibility = 'private' | 'org' | 'global'

export interface PreferenceRecord {
  id?: string
  userId: string
  namespace: PreferenceNamespace
  key: string
  tableId?: string
  scopeId?: string
  type: PreferenceType
  value: string | number | boolean | object
  visibility?: PreferenceVisibility
  expiresAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface PreferenceFilter {
  namespace?: PreferenceNamespace | PreferenceNamespace[]
  tableId?: string
  scopeId?: string
  key?: string | string[]
  visibility?: PreferenceVisibility | PreferenceVisibility[]
  expired?: boolean
}

export interface SetPreferenceOptions {
  visibility?: PreferenceVisibility
  expiresAt?: string
  ttl?: number // Time to live in seconds
  overwrite?: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  total?: number
}

/**
 * Get current user ID from auth context
 */
function getUserId(): string {
  if (typeof window !== 'undefined') {
    const storedUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId')
    if (storedUserId) {
      return storedUserId
    }
  }
  return 'default-user'
}

/**
 * Preferences API Client
 */
class PreferencesApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/preferences`
  }

  /**
   * Get all preferences for a user
   */
  async getAll(userId?: string, filter?: PreferenceFilter): Promise<PreferenceRecord[]> {
    const targetUserId = userId || getUserId()
    const queryParams = new URLSearchParams()

    if (filter) {
      if (filter.namespace) {
        const namespaces = Array.isArray(filter.namespace) ? filter.namespace : [filter.namespace]
        queryParams.append('namespace', namespaces.join(','))
      }
      if (filter.tableId) queryParams.append('tableId', filter.tableId)
      if (filter.scopeId) queryParams.append('scopeId', filter.scopeId)
      if (filter.key) {
        const keys = Array.isArray(filter.key) ? filter.key : [filter.key]
        queryParams.append('key', keys.join(','))
      }
      if (filter.visibility) {
        const visibilities = Array.isArray(filter.visibility) ? filter.visibility : [filter.visibility]
        queryParams.append('visibility', visibilities.join(','))
      }
      if (filter.expired) queryParams.append('expired', 'true')
    }

    const url = `${this.baseUrl}/${targetUserId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': targetUserId,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: ApiResponse<PreferenceRecord[]> = await response.json()
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to get preferences')
    }

    return result.data
  }

  /**
   * Get a single preference
   */
  async get(
    key: string,
    namespace: PreferenceNamespace = 'misc',
    userId?: string,
    tableId?: string,
    scopeId?: string
  ): Promise<PreferenceRecord | null> {
    const targetUserId = userId || getUserId()
    const queryParams = new URLSearchParams()
    if (tableId) queryParams.append('tableId', tableId)
    if (scopeId) queryParams.append('scopeId', scopeId)

    const url = `${this.baseUrl}/${targetUserId}/${namespace}/${key}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': targetUserId,
      },
    })

    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: ApiResponse<PreferenceRecord> = await response.json()
    if (!result.success || !result.data) {
      return null
    }

    return result.data
  }

  /**
   * Set (create or update) a preference
   */
  async set(
    key: string,
    value: string | number | boolean | object,
    type: PreferenceType,
    options?: SetPreferenceOptions & {
      namespace?: PreferenceNamespace
      userId?: string
      tableId?: string
      scopeId?: string
    }
  ): Promise<PreferenceRecord> {
    const targetUserId = options?.userId || getUserId()
    const namespace = options?.namespace || 'misc'

    const body = {
      userId: targetUserId,
      namespace,
      key,
      value,
      type,
      tableId: options?.tableId,
      scopeId: options?.scopeId,
      visibility: options?.visibility,
      expiresAt: options?.expiresAt,
      ttl: options?.ttl,
      overwrite: options?.overwrite,
    }

    // Try PUT endpoint first (more RESTful)
    let url = `${this.baseUrl}/${targetUserId}/${namespace}/${key}`
    let response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': targetUserId,
      },
      body: JSON.stringify(body),
    })

    // Fallback to POST if PUT fails
    if (!response.ok && response.status === 404) {
      url = `${this.baseUrl}`
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': targetUserId,
        },
        body: JSON.stringify(body),
      })
    }

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    const result: ApiResponse<PreferenceRecord> = await response.json()
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to set preference')
    }

    return result.data
  }

  /**
   * Delete a preference
   */
  async delete(
    key: string,
    namespace: PreferenceNamespace = 'misc',
    userId?: string,
    tableId?: string,
    scopeId?: string
  ): Promise<boolean> {
    const targetUserId = userId || getUserId()
    const queryParams = new URLSearchParams()
    if (tableId) queryParams.append('tableId', tableId)
    if (scopeId) queryParams.append('scopeId', scopeId)

    const url = `${this.baseUrl}/${targetUserId}/${namespace}/${key}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': targetUserId,
      },
    })

    if (response.status === 404) {
      return false
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: ApiResponse<{ message: string }> = await response.json()
    return result.success
  }

  /**
   * Delete all preferences for a user (with optional filter)
   */
  async deleteAll(userId?: string, filter?: PreferenceFilter): Promise<number> {
    const targetUserId = userId || getUserId()
    const queryParams = new URLSearchParams()

    if (filter) {
      if (filter.namespace) {
        const namespaces = Array.isArray(filter.namespace) ? filter.namespace : [filter.namespace]
        queryParams.append('namespace', namespaces.join(','))
      }
      if (filter.tableId) queryParams.append('tableId', filter.tableId)
      if (filter.scopeId) queryParams.append('scopeId', filter.scopeId)
    }

    const url = `${this.baseUrl}/${targetUserId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': targetUserId,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: ApiResponse<{ deleted: number }> = await response.json()
    return result.data?.deleted || 0
  }
}

// Export singleton instance
export const preferencesApi = new PreferencesApiClient()

