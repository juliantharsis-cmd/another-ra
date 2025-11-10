const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface UserPreferences {
  userId: string
  language: string
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  timeFormat: '12h' | '24h'
  timeZone: string
  theme: 'light' | 'dark' | 'system'
  useSchneiderColors: boolean
  emailNotifications: boolean
  inAppAlerts: boolean
  defaultPageSize: number
  defaultSortField?: string
  defaultSortOrder: 'asc' | 'desc'
  createdAt?: string
  updatedAt?: string
}

export interface UpdateUserPreferencesDto {
  language?: string
  dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  timeFormat?: '12h' | '24h'
  timeZone?: string
  theme?: 'light' | 'dark' | 'system'
  useSchneiderColors?: boolean
  emailNotifications?: boolean
  inAppAlerts?: boolean
  defaultPageSize?: number
  defaultSortField?: string
  defaultSortOrder?: 'asc' | 'desc'
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  warning?: string
}

/**
 * Get current user ID from auth context
 * For now, returns a default user ID. In production, get from auth context.
 */
function getUserId(): string {
  // TODO: Get from auth context when authentication is implemented
  if (typeof window !== 'undefined') {
    // Try to get from localStorage or sessionStorage
    const storedUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId')
    if (storedUserId) {
      return storedUserId
    }
  }
  return 'default-user'
}

/**
 * API Client for User Preferences
 */
class UserPreferencesApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/user`
  }

  /**
   * Get user preferences
   */
  async getPreferences(userId?: string): Promise<UserPreferences> {
    try {
      const targetUserId = userId || getUserId()
      
      // Get browser locale and timezone for default preferences
      const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US'
      const timeZone = typeof Intl !== 'undefined' 
        ? Intl.DateTimeFormat().resolvedOptions().timeZone 
        : 'UTC'
      
      const url = `${this.baseUrl}/preferences?userId=${encodeURIComponent(targetUserId)}`
      console.log('🔍 Fetching user preferences from:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': targetUserId,
          'Accept-Language': locale,
          'X-Timezone': timeZone,
        },
      })

      console.log('📡 User preferences response status:', response.status, response.statusText)

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.text()
          if (errorData) {
            errorMessage += `, message: ${errorData}`
          }
        } catch (e) {
          // Ignore parsing errors
        }
        console.error('❌ User preferences API error:', errorMessage)
        throw new Error(errorMessage)
      }

      const result: ApiResponse<UserPreferences> = await response.json()

      if (!result.success || !result.data) {
        const errorMsg = result.error || 'Failed to fetch preferences'
        console.error('❌ User preferences API returned error:', errorMsg)
        throw new Error(errorMsg)
      }

      console.log('✅ User preferences loaded successfully')
      return result.data
    } catch (error) {
      console.error('❌ Error fetching user preferences:', error)
      // Check if it's a network error (backend not running)
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Backend server is not running. Please start the server on port 3001.')
      }
      throw error
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    preferences: UpdateUserPreferencesDto,
    userId?: string
  ): Promise<UserPreferences> {
    try {
      const targetUserId = userId || getUserId()
      const response = await fetch(`${this.baseUrl}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': targetUserId,
        },
        body: JSON.stringify(preferences),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ApiResponse<UserPreferences> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to update preferences')
      }

      return result.data
    } catch (error) {
      console.error('Error updating user preferences:', error)
      throw error
    }
  }
}

// Export singleton instance
export const userPreferencesApi = new UserPreferencesApiClient()

