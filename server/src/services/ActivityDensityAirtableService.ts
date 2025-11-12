import Airtable from 'airtable'
import { RelationshipResolver } from './RelationshipResolver'

/**
 * ActivityDensity Airtable Service
 * 
 * Handles all Airtable API interactions for Activity Density table
 */
export interface ActivityDensity {
  id: string
  Name?: string
  Status?: 'Active' | 'Inactive' | string
  [key: string]: any // Allow additional fields from Airtable
}

export interface CreateActivityDensityDto {
  Name?: string
  Status?: 'Active' | 'Inactive' | string
  [key: string]: any
}

export interface UpdateActivityDensityDto {
  Name?: string
  Status?: 'Active' | 'Inactive' | string
  [key: string]: any
}

export class ActivityDensityAirtableService {
  private base: Airtable.Base
  private tableName: string
  private relationshipResolver: RelationshipResolver

  constructor() {
    const apiKey = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || 
                   process.env.AIRTABLE_API_KEY
    
    if (!apiKey) {
      throw new Error('Airtable API token is required')
    }
    
    const baseId = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 
                   'appGtLbKhmNkkTLVL'
    
    this.tableName = 'Activity Density'
    
    Airtable.configure({ apiKey })
    this.base = Airtable.base(baseId)
    this.relationshipResolver = new RelationshipResolver(baseId, apiKey)
  }

  /**
   * Get all Activity Density records with pagination, filtering, and sorting
   */
  async getAll(params: {
    offset?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    search?: string
    status?: string
  }): Promise<{ data: ActivityDensity[]; total: number }> {
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
          FIND("${searchTerm}", LOWER({Name})) > 0
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
        const countSelectOptions: Airtable.SelectOptions<any> = {
          fields: ['Name'],
        }
        if (formula) {
          countSelectOptions.filterByFormula = formula
        }
        const countRecords = await this.base(this.tableName)
          .select(countSelectOptions)
          .all()
        total = countRecords.length
      }

      // Map records to ActivityDensity format
      const data = await Promise.all(
        records.map(async (record) => {
          const fields = record.fields
          const activityDensity: ActivityDensity = {
            id: record.id,
            Name: fields.Name as string,
            Status: fields.Status as string,
          }

          // Resolve linked records if needed
          // Add any additional field mappings here based on your Airtable schema

          return activityDensity
        })
      )

      return { data, total }
    } catch (error: any) {
      console.error('Error in ActivityDensityAirtableService.getAll:', error)
      throw new Error(error.message || 'Failed to fetch Activity Density records')
    }
  }

  /**
   * Get a single Activity Density record by ID
   */
  async getById(id: string): Promise<ActivityDensity | null> {
    try {
      const record = await this.base(this.tableName).find(id)
      
      if (!record) {
        return null
      }

      const fields = record.fields
      const activityDensity: ActivityDensity = {
        id: record.id,
        Name: fields.Name as string,
        Status: fields.Status as string,
      }

      // Resolve linked records if needed
      // Add any additional field mappings here

      return activityDensity
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null
      }
      console.error('Error in ActivityDensityAirtableService.getById:', error)
      throw new Error(error.message || 'Failed to fetch Activity Density record')
    }
  }

  /**
   * Create a new Activity Density record
   */
  async create(dto: CreateActivityDensityDto): Promise<ActivityDensity> {
    try {
      const fields: any = {}

      if (dto.Name !== undefined) fields.Name = dto.Name
      if (dto.Status !== undefined) fields.Status = dto.Status

      // Add any additional field mappings here

      const records = await this.base(this.tableName).create([{ fields }])
      const record = records[0]

      return {
        id: record.id,
        Name: record.fields.Name as string,
        Status: record.fields.Status as string,
      }
    } catch (error: any) {
      console.error('Error in ActivityDensityAirtableService.create:', error)
      throw new Error(error.message || 'Failed to create Activity Density record')
    }
  }

  /**
   * Update an Activity Density record
   */
  async update(id: string, dto: UpdateActivityDensityDto): Promise<ActivityDensity> {
    try {
      const fields: any = {}

      if (dto.Name !== undefined) fields.Name = dto.Name
      if (dto.Status !== undefined) fields.Status = dto.Status

      // Add any additional field mappings here

      const record = await this.base(this.tableName).update(id, fields)

      return {
        id: record.id,
        Name: record.fields.Name as string,
        Status: record.fields.Status as string,
      }
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new Error('Activity Density record not found')
      }
      console.error('Error in ActivityDensityAirtableService.update:', error)
      throw new Error(error.message || 'Failed to update Activity Density record')
    }
  }

  /**
   * Delete an Activity Density record
   */
  async delete(id: string): Promise<void> {
    try {
      await this.base(this.tableName).destroy(id)
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new Error('Activity Density record not found')
      }
      console.error('Error in ActivityDensityAirtableService.delete:', error)
      throw new Error(error.message || 'Failed to delete Activity Density record')
    }
  }

  /**
   * Map frontend field names to Airtable field names
   */
  private mapFieldNameToAirtable(fieldName: string): string {
    const fieldMap: Record<string, string> = {
      name: 'Name',
      status: 'Status',
    }
    return fieldMap[fieldName.toLowerCase()] || fieldName
  }
}
