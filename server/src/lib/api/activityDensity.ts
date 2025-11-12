/**
 * API Client for ActivityDensity
 * Auto-generated client for Activity Density table
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface ActivityDensity {
  id: string
  // TODO: Add fields based on schema
}

export interface CreateActivityDensityDto {
  // TODO: Add fields
}

export interface UpdateActivityDensityDto {
  // TODO: Add fields
}

class ActivityDensityApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/activity-density`
  }

  // TODO: Implement API methods
}

export const activityDensityApi = new ActivityDensityApiClient()
