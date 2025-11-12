/**
 * API Client for Protocol
 * Auto-generated client for Protocol table
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface Protocol {
  id: string
  // TODO: Add fields based on schema
}

export interface CreateProtocolDto {
  // TODO: Add fields
}

export interface UpdateProtocolDto {
  // TODO: Add fields
}

class ProtocolApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/protocol`
  }

  // TODO: Implement API methods
}

export const protocolApi = new ProtocolApiClient()
