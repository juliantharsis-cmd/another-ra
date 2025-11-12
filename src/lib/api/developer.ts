/**
 * Developer API Client
 * 
 * Handles API calls for developer tools, including table creation workflow
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface AirtableBase {
  id: string
  name: string
  permissionLevel?: string
}

export interface AirtableTable {
  id: string
  name: string
  fields?: Array<{
    id: string
    name: string
    type: string
  }>
}

export interface TableSchema {
  tableId: string
  tableName: string
  fields: Array<{
    id: string
    name: string
    type: string
  }>
}

export interface TableCreationJob {
  id: string
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  progress: number
  currentStep?: string
  error?: string
  result?: {
    tableName: string
    tablePath: string
  }
}

export interface CreateTableRequest {
  source: 'airtable'
  baseId: string
  tableId: string
  tableName?: string // Optional: table name from frontend
  targetSection?: string
}

class DeveloperApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/developer`
  }

  /**
   * List all accessible Airtable bases/apps
   */
  async listBases(): Promise<AirtableBase[]> {
    const response = await fetch(`${this.baseUrl}/tables/bases`)
    if (!response.ok) {
      throw new Error(`Failed to fetch bases: ${response.statusText}`)
    }
    const data = await response.json()
    return data.bases || []
  }

  /**
   * List all tables in a specific Airtable base/app
   */
  async listTables(baseId: string): Promise<AirtableTable[]> {
    const response = await fetch(`${this.baseUrl}/tables/bases/${baseId}/tables`)
    if (!response.ok) {
      throw new Error(`Failed to fetch tables: ${response.statusText}`)
    }
    const data = await response.json()
    return data.tables || []
  }

  /**
   * Get table schema from Airtable
   */
  async getTableSchema(baseId: string, tableId: string): Promise<TableSchema> {
    const response = await fetch(`${this.baseUrl}/tables/bases/${baseId}/tables/${tableId}/schema`)
    if (!response.ok) {
      throw new Error(`Failed to fetch table schema: ${response.statusText}`)
    }
    return response.json()
  }

  /**
   * Create a table from Airtable (async job)
   */
  async createTable(request: CreateTableRequest): Promise<TableCreationJob> {
    const response = await fetch(`${this.baseUrl}/tables/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || `Failed to create table: ${response.statusText}`)
    }
    return response.json()
  }

  /**
   * Get job status
   */
  /**
   * Verify if table files were created (useful when job record is lost)
   */
  async verifyTableFiles(tableName: string): Promise<{
    success: boolean
    tableName: string
    filesCreated: {
      service: boolean
      api: boolean
      route: boolean
      config: boolean
    }
    allCreated: boolean
    paths: {
      service: string
      api: string
      route: string
      config: string
    }
  }> {
    const response = await fetch(`${this.baseUrl}/tables/verify/${encodeURIComponent(tableName)}`)
    if (!response.ok) {
      throw new Error(`Failed to verify table files: ${response.statusText}`)
    }
    return response.json()
  }

  async getJobStatus(jobId: string): Promise<TableCreationJob> {
    const response = await fetch(`${this.baseUrl}/tables/jobs/${jobId}`)
    if (!response.ok) {
      if (response.status === 404) {
        // Job not found - might have been cleaned up or server restarted
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Job not found. It may have been completed, cleaned up, or the server was restarted.')
      }
      throw new Error(`Failed to fetch job status: ${response.statusText}`)
    }
    const job = await response.json()
    
    // Ensure we have a valid job object
    if (!job || !job.status) {
      throw new Error('Invalid job status response')
    }
    
    return job
  }
}

export const developerApi = new DeveloperApiClient()

