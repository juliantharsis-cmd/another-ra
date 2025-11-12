/**
 * API Client for GeoCode
 * Auto-generated client for geo Code table
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface GeoCode {
  id: string
  // TODO: Add fields based on schema
}

export interface CreateGeoCodeDto {
  // TODO: Add fields
}

export interface UpdateGeoCodeDto {
  // TODO: Add fields
}

class GeoCodeApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/geo-code`
  }

  // TODO: Implement API methods
}

export const geoCodeApi = new GeoCodeApiClient()
