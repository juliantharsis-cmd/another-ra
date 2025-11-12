/**
 * API Client for KeywordsTags
 * Auto-generated client for KeyWords/Tags table
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface KeywordsTags {
  id: string
  // TODO: Add fields based on schema
}

export interface CreateKeywordsTagsDto {
  // TODO: Add fields
}

export interface UpdateKeywordsTagsDto {
  // TODO: Add fields
}

class KeywordsTagsApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/keywords-tags`
  }

  // TODO: Implement API methods
}

export const keywordsTagsApi = new KeywordsTagsApiClient()
