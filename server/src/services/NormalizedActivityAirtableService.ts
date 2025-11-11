import Airtable from 'airtable'
import { NormalizedActivity, CreateNormalizedActivityDto, UpdateNormalizedActivityDto } from '../types/NormalizedActivity'
import { RelationshipResolver } from './RelationshipResolver'

/**
 * Normalized Activity Airtable Service
 * 
 * Handles all Airtable API interactions for Normalized Activity table.
 */
export class NormalizedActivityAirtableService {
  private base: Airtable.Base
  private tableName: string
  private relationshipResolver: RelationshipResolver

  constructor() {
    const apiKey = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || 
                   process.env.AIRTABLE_API_KEY
    
    if (!apiKey) {
      throw new Error('Airtable API token is required. Set AIRTABLE_PERSONAL_ACCESS_TOKEN in .env file')
    }
    
    const baseId = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 
                   'appGtLbKhmNkkTLVL'
    
    this.tableName = process.env.AIRTABLE_NORMALIZED_ACTIVITY_TABLE_ID || 
                     process.env.AIRTABLE_NORMALIZED_ACTIVITY_TABLE_NAME || 
                     'Normalized Activities'
    
    Airtable.configure({ apiKey })
    this.base = Airtable.base(baseId)
    this.relationshipResolver = new RelationshipResolver(baseId, apiKey)
    
    console.log(`🌿 NormalizedActivityAirtableService initialized:`)
    console.log(`   Base ID: ${baseId}`)
    console.log(`   Table: ${this.tableName}`)
  }

  /**
   * Get all Normalized Activities with pagination, filtering, and sorting
   */
  async getAll(params: {
    offset?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    search?: string
    status?: string
  }): Promise<{ data: NormalizedActivity[]; total: number }> {
    try {
      let formula = ''
      const conditions: string[] = []

      // Status filter
      if (params.status) {
        conditions.push(`{Status} = "${params.status}"`)
      }

      // Search filter
      if (params.search) {
        const searchTerm = params.search.trim().replace(/"/g, '\\"')
        conditions.push(`OR(
          FIND("${searchTerm}", LOWER({Name})) > 0,
          FIND("${searchTerm}", LOWER({Description})) > 0
        )`)
      }

      if (conditions.length > 0) {
        formula = `AND(${conditions.join(', ')})`
      }

      const selectOptions: Airtable.SelectOptions<any> = {}
      if (formula) {
        selectOptions.filterByFormula = formula
      }

      // Sorting
      if (params.sortBy) {
        const sortField = this.mapFieldNameToAirtable(params.sortBy)
        selectOptions.sort = [{
          field: sortField,
          direction: params.sortOrder === 'desc' ? 'desc' : 'asc',
        }]
      } else {
        // Default sort by Name
        selectOptions.sort = [{ field: 'Name', direction: 'asc' }]
      }

      // Pagination
      if (params.limit) {
        selectOptions.maxRecords = params.limit
      }
      if (params.offset) {
        selectOptions.pageSize = params.limit || 100
      }

      const records = await this.base(this.tableName)
        .select(selectOptions)
        .all()

      // Get total count (for pagination)
      let total = records.length
      if (params.limit || params.offset) {
        // Need to get total count separately for accurate pagination
        const countSelectOptions: Airtable.SelectOptions<any> = {
          fields: ['Name'], // Minimal fields for count
        }
        if (formula) {
          countSelectOptions.filterByFormula = formula
        }
        const countRecords = await this.base(this.tableName)
          .select(countSelectOptions)
          .all()
        total = countRecords.length
      }

      // Map records
      const data = await Promise.all(
        records.map(record => this.mapAirtableToNormalizedActivity(record))
      )

      return { data, total }
    } catch (error: any) {
      console.error('Error fetching Normalized Activities:', error)
      throw new Error(`Failed to fetch Normalized Activities: ${error.message}`)
    }
  }

  /**
   * Get a single Normalized Activity by ID
   */
  async getById(id: string): Promise<NormalizedActivity | null> {
    try {
      const record = await this.base(this.tableName).find(id)
      return await this.mapAirtableToNormalizedActivity(record)
    } catch (error: any) {
      if (error.error === 'NOT_FOUND') {
        return null
      }
      console.error('Error fetching Normalized Activity by ID:', error)
      throw new Error(`Failed to fetch Normalized Activity: ${error.message}`)
    }
  }

  /**
   * Create a new Normalized Activity
   */
  async create(dto: CreateNormalizedActivityDto): Promise<NormalizedActivity> {
    try {
      const fields = this.mapNormalizedActivityToAirtable(dto)
      
      const records = await this.base(this.tableName).create([{ fields }])
      const record = records[0]
      
      return await this.mapAirtableToNormalizedActivity(record)
    } catch (error: any) {
      console.error('Error creating Normalized Activity:', error)
      throw new Error(`Failed to create Normalized Activity: ${error.message}`)
    }
  }

  /**
   * Update an existing Normalized Activity
   */
  async update(id: string, dto: UpdateNormalizedActivityDto): Promise<NormalizedActivity> {
    try {
      const fields = this.mapNormalizedActivityToAirtable(dto)
      
      const record = await this.base(this.tableName).update([{ id, fields }])
      
      return await this.mapAirtableToNormalizedActivity(record[0])
    } catch (error: any) {
      console.error('Error updating Normalized Activity:', error)
      throw new Error(`Failed to update Normalized Activity: ${error.message}`)
    }
  }

  /**
   * Delete a Normalized Activity
   */
  async delete(id: string): Promise<void> {
    try {
      await this.base(this.tableName).destroy([id])
    } catch (error: any) {
      console.error('Error deleting Normalized Activity:', error)
      throw new Error(`Failed to delete Normalized Activity: ${error.message}`)
    }
  }

  /**
   * Get distinct values for a filter field
   */
  async getFilterValues(field: string, limit: number = 1000): Promise<string[]> {
    try {
      const airtableFieldName = this.mapFieldNameToAirtable(field)
      const records = await this.base(this.tableName)
        .select({
          fields: [airtableFieldName],
          maxRecords: limit,
        })
        .all()

      const values = new Set<string>()
      records.forEach(record => {
        const value = record.fields[airtableFieldName]
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => values.add(String(v)))
          } else {
            values.add(String(value))
          }
        }
      })

      return Array.from(values).sort()
    } catch (error: any) {
      console.error(`Error getting filter values for ${field}:`, error)
      return []
    }
  }

  /**
   * Map Airtable record to NormalizedActivity interface
   */
  private async mapAirtableToNormalizedActivity(record: Airtable.Record<any>): Promise<NormalizedActivity> {
    const fields = record.fields

    return {
      id: record.id,
      Name: fields['Name'] || '',
      Description: fields['Description'] || '',
      Status: fields['Status'] || 'Active',
      Notes: fields['Notes'] || '',
      createdAt: this.formatDate(record._rawJson.createdTime),
      updatedAt: this.formatDate(record._rawJson.lastModifiedTime),
      createdBy: this.getCreatedBy(fields),
      lastModifiedBy: this.getLastModifiedBy(fields),
    }
  }

  /**
   * Map NormalizedActivity DTO to Airtable fields
   */
  private mapNormalizedActivityToAirtable(dto: CreateNormalizedActivityDto | UpdateNormalizedActivityDto): Record<string, any> {
    const fields: Record<string, any> = {}
    
    if (dto.Name !== undefined && dto.Name !== null && String(dto.Name).trim() !== '') {
      fields['Name'] = String(dto.Name).trim()
    }
    if (dto.Description !== undefined && dto.Description !== null && String(dto.Description).trim() !== '') {
      fields['Description'] = String(dto.Description).trim()
    }
    if (dto.Status !== undefined && dto.Status !== null) {
      fields['Status'] = String(dto.Status).trim()
    } else if (!('Status' in dto)) {
      fields['Status'] = 'Active' // Default
    }
    if (dto.Notes !== undefined && dto.Notes !== null && String(dto.Notes).trim() !== '') {
      fields['Notes'] = String(dto.Notes).trim()
    }
    
    return fields
  }

  /**
   * Map field name to Airtable field name
   */
  private mapFieldNameToAirtable(fieldName: string): string {
    const mapping: Record<string, string> = {
      'Name': 'Name',
      'name': 'Name',
      'Description': 'Description',
      'description': 'Description',
      'Status': 'Status',
      'status': 'Status',
    }
    return mapping[fieldName] || fieldName
  }

  /**
   * Format date from Airtable timestamp
   */
  private formatDate(dateString?: string): string | undefined {
    if (!dateString) return undefined
    return new Date(dateString).toISOString()
  }

  /**
   * Get created by user
   */
  private getCreatedBy(fields: any): string | undefined {
    if (fields['Created By']) {
      const createdBy = Array.isArray(fields['Created By']) ? fields['Created By'][0] : fields['Created By']
      return typeof createdBy === 'object' && createdBy?.email ? createdBy.email : String(createdBy)
    }
    return undefined
  }

  /**
   * Get last modified by user
   */
  private getLastModifiedBy(fields: any): string | undefined {
    if (fields['Last Modified By']) {
      const lastModifiedBy = Array.isArray(fields['Last Modified By']) ? fields['Last Modified By'][0] : fields['Last Modified By']
      return typeof lastModifiedBy === 'object' && lastModifiedBy?.email ? lastModifiedBy.email : String(lastModifiedBy)
    }
    return undefined
  }
}

