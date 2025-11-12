/**
 * API Client for SurveyThemes
 * Auto-generated client for Survey Themes table
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface SurveyThemes {
  id: string
  // TODO: Add fields based on schema
}

export interface CreateSurveyThemesDto {
  // TODO: Add fields
}

export interface UpdateSurveyThemesDto {
  // TODO: Add fields
}

class SurveyThemesApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/survey-themes`
  }

  // TODO: Implement API methods
}

export const surveyThemesApi = new SurveyThemesApiClient()
