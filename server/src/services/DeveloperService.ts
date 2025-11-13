/**
 * Developer Service
 * 
 * Handles developer tools operations, including table creation from Airtable
 */

import { TableCreationJobService, TableCreationJob } from './TableCreationJobService'
import { TableCreationService } from './TableCreationService'

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

export interface CreateTableRequest {
  source: 'airtable'
  baseId: string
  tableId: string
  tableName?: string // Optional: table name from frontend
  targetSection?: string
}

export class DeveloperService {
  private apiKey: string
  private jobService: TableCreationJobService
  private tableCreationService: TableCreationService

  constructor() {
    this.apiKey = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || 
                  process.env.AIRTABLE_API_KEY || ''
    
    if (!this.apiKey) {
      throw new Error('AIRTABLE_PERSONAL_ACCESS_TOKEN or AIRTABLE_API_KEY is required')
    }

    // Use singleton instance to ensure jobs persist across service recreations
    this.jobService = TableCreationJobService.getInstance()
    this.tableCreationService = new TableCreationService(this.jobService)
  }

  /**
   * List all accessible Airtable bases/apps
   */
  async listBases(): Promise<AirtableBase[]> {
    try {
      const response = await fetch('https://api.airtable.com/v0/meta/bases', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Airtable API access denied. Check your API token permissions.')
        }
        throw new Error(`Failed to fetch bases: ${response.statusText}`)
      }

      const data = await response.json() as { bases?: AirtableBase[] }
      return data.bases || []
    } catch (error: any) {
      console.error('Error listing Airtable bases:', error)
      throw new Error(error.message || 'Failed to list Airtable bases')
    }
  }

  /**
   * List all tables in a specific Airtable base/app
   */
  async listTables(baseId: string): Promise<AirtableTable[]> {
    try {
      console.log(`🔍 [DeveloperService] Fetching tables for base: ${baseId}`)
      const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Airtable API access denied. Check your API token permissions.')
        }
        const errorText = await response.text()
        console.error(`❌ [DeveloperService] Failed to fetch tables: ${response.status} ${response.statusText}`)
        console.error(`   Response: ${errorText}`)
        throw new Error(`Failed to fetch tables: ${response.statusText}`)
      }

      const data = await response.json() as { tables?: AirtableTable[] }
      const tables = data.tables || []
      console.log(`✅ [DeveloperService] Fetched ${tables.length} tables`)
      if (tables.length > 0) {
        console.log(`   Tables: ${tables.map(t => `${t.name} (${t.id})`).join(', ')}`)
      }
      return tables
    } catch (error: any) {
      console.error('❌ [DeveloperService] Error listing Airtable tables:', error)
      throw new Error(error.message || 'Failed to list Airtable tables')
    }
  }

  /**
   * Get table schema from Airtable
   */
  async getTableSchema(baseId: string, tableId: string): Promise<TableSchema> {
    try {
      const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables/${tableId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Airtable API access denied. Check your API token permissions.')
        }
        throw new Error(`Failed to fetch table schema: ${response.statusText}`)
      }

      const data = await response.json() as { id: string; name: string; fields?: Array<{ id: string; name: string; type: string }> }
      return {
        tableId: data.id,
        tableName: data.name,
        fields: (data.fields || []).map((field) => ({
          id: field.id,
          name: field.name,
          type: field.type,
        })),
      }
    } catch (error: any) {
      console.error('Error fetching table schema:', error)
      throw new Error(error.message || 'Failed to fetch table schema')
    }
  }

  /**
   * Create a table from Airtable (async job)
   */
  async createTable(request: CreateTableRequest) {
    // Start async job
    const job = await this.jobService.createJob(request)
    
    // Process job in background (don't await)
    this.processTableCreation(job.id, request).catch((error) => {
      console.error(`Error processing table creation job ${job.id}:`, error)
      this.jobService.updateJob(job.id, {
        status: 'failed',
        error: error.message || 'Failed to create table',
      })
    })

    return job
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<TableCreationJob | null> {
    const job = await this.jobService.getJob(jobId)
    if (!job) {
      // Don't log warning for every poll - jobs may be cleaned up or server restarted
      // Only log if it's a recent job (less than 1 hour old would be unexpected)
      const allJobs = this.jobService.getAllJobs()
      if (allJobs.length > 0) {
        // Job service is working, this job just doesn't exist
        console.debug(`[DeveloperService] Job ${jobId} not found (may have been cleaned up or server restarted)`)
      }
    }
    return job
  }

  /**
   * Process table creation (background task)
   */
  private async processTableCreation(jobId: string, request: CreateTableRequest) {
    try {
      console.log(`🔍 [DeveloperService] Processing table creation for table ID: ${request.tableId}`)
      console.log(`   Base ID: ${request.baseId}`)
      console.log(`   Table Name: ${request.tableName || '(not provided)'}`)
      
      // Validate table exists and get table name
      let tableName = request.tableName
      
      if (!tableName) {
        // If table name not provided, fetch from Airtable
        console.log(`📋 [DeveloperService] Table name not provided, fetching from Airtable...`)
        const tables = await this.listTables(request.baseId)
        console.log(`✅ [DeveloperService] Found ${tables.length} tables in base`)
        
        const selectedTable = tables.find(t => t.id === request.tableId)
        
        if (!selectedTable) {
          console.error(`❌ [DeveloperService] Table ${request.tableId} not found in base ${request.baseId}`)
          console.error(`   Available tables: ${tables.map(t => `${t.name} (${t.id})`).join(', ')}`)
          throw new Error(`Table with ID ${request.tableId} not found in base. Available tables: ${tables.map(t => t.name).join(', ')}`)
        }

        tableName = selectedTable.name
        console.log(`✅ [DeveloperService] Found table: ${tableName} (${request.tableId})`)
      } else {
        // Validate that the table exists (optional check)
        console.log(`📋 [DeveloperService] Validating table exists...`)
        try {
          const tables = await this.listTables(request.baseId)
          const selectedTable = tables.find(t => t.id === request.tableId)
          
          if (!selectedTable) {
            console.warn(`⚠️  [DeveloperService] Table ${request.tableId} not found in base, but proceeding with provided name: ${tableName}`)
            console.warn(`   This might indicate the table was moved or deleted.`)
          } else {
            console.log(`✅ [DeveloperService] Table validated: ${selectedTable.name} (${request.tableId})`)
            // Use the actual table name from Airtable if it differs
            if (selectedTable.name !== tableName) {
              console.log(`   ⚠️  Table name mismatch: provided "${tableName}" vs Airtable "${selectedTable.name}", using Airtable name`)
              tableName = selectedTable.name
            }
          }
        } catch (validationError) {
          console.warn(`⚠️  [DeveloperService] Could not validate table, proceeding with provided name: ${tableName}`)
        }
      }

      // Use TableCreationService to handle Phase 1 (file generation)
      await this.tableCreationService.generateFiles(jobId, {
        baseId: request.baseId,
        tableId: request.tableId,
        tableName,
        targetSection: request.targetSection,
      })
    } catch (error: any) {
      console.error(`❌ [DeveloperService] Error in processTableCreation:`, error)
      this.jobService.updateJob(jobId, {
        status: 'failed',
        error: error.message || 'Failed to create table',
      })
      throw error
    }
  }

  /**
   * Finalize table creation (Phase 2)
   */
  async finalizeTable(jobId: string, addSidebarEntry: boolean = false): Promise<void> {
    await this.tableCreationService.finalizeTable(jobId, addSidebarEntry)
  }

  /**
   * Cancel table creation and remove generated files
   */
  async cancelTableCreation(jobId: string): Promise<void> {
    await this.tableCreationService.cancelTableCreation(jobId)
  }
}

