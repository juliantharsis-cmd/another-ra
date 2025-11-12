/**
 * AI Agent Profile API Client
 * 
 * Frontend API client for managing user AI Agent Profiles
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export type Tone = 'analytical' | 'conversational' | 'professional' | 'friendly' | 'technical' | 'concise'
export type DetailLevel = 'low' | 'medium' | 'high'
export type ResponseStyle = 'concise' | 'detailed' | 'balanced'
export type DomainFocus = 
  | 'sustainability_data' 
  | 'energy_data' 
  | 'carbon_emissions' 
  | 'compliance' 
  | 'general' 
  | 'financial' 
  | 'operations'

export interface AIAgentProfile {
  tone?: Tone
  detailLevel?: DetailLevel
  responseStyle?: ResponseStyle
  domainFocus?: DomainFocus
  customInstructions?: string
  includeReasoning?: boolean
  outputFormat?: 'paragraph' | 'bullet_points' | 'structured' | 'mixed'
  language?: string
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
 * AI Agent Profile API Client
 */
class AIAgentProfileApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/ai-agent-profile`
  }

  /**
   * Get AI Agent Profile for current user
   */
  async getProfile(userId?: string): Promise<AIAgentProfile> {
    const targetUserId = userId || getUserId()
    const response = await fetch(`${this.baseUrl}/${targetUserId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        // No profile exists, return empty object (will use defaults)
        return {}
      }
      throw new Error(`Failed to fetch AI Agent Profile: ${response.statusText}`)
    }

    const result: ApiResponse<AIAgentProfile> = await response.json()
    if (!result.success || !result.data) {
      return {}
    }

    return result.data
  }

  /**
   * Save AI Agent Profile for current user
   */
  async saveProfile(profile: Partial<AIAgentProfile>, userId?: string): Promise<void> {
    const targetUserId = userId || getUserId()
    const response = await fetch(`${this.baseUrl}/${targetUserId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profile),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to save AI Agent Profile: ${response.statusText}`)
    }
  }

  /**
   * Delete AI Agent Profile for current user (revert to defaults)
   */
  async deleteProfile(userId?: string): Promise<void> {
    const targetUserId = userId || getUserId()
    const response = await fetch(`${this.baseUrl}/${targetUserId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to delete AI Agent Profile: ${response.statusText}`)
    }
  }
}

// Export singleton instance
export const aiAgentProfileApi = new AIAgentProfileApiClient()

