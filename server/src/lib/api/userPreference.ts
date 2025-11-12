/**
 * API Client for UserPreference
 * Auto-generated client for User Preference table
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface UserPreference {
  id: string
  // TODO: Add fields based on schema
}

export interface CreateUserPreferenceDto {
  // TODO: Add fields
}

export interface UpdateUserPreferenceDto {
  // TODO: Add fields
}

class UserPreferenceApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/user-preference`
  }

  // TODO: Implement API methods
}

export const userPreferenceApi = new UserPreferenceApiClient()
