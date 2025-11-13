import Airtable from 'airtable'
import { RelationshipResolver } from './RelationshipResolver'

/**
 * GeoCode Airtable Service
 * 
 * Handles all Airtable API interactions for geo Code table
 */
export interface GeoCode {
  id: string
  Name?: string
  Notes?: string
  Assignee?: string
  Status?: string
  Ref?: string
  Region?: string
  'Geography 🌍'?: string
  [key: string]: any // Allow additional fields from Airtable
}

export interface CreateGeoCodeDto {
  Name?: string
  Notes?: string
  Assignee?: string
  Status?: string
  Ref?: string
  Region?: string
  'Geography 🌍'?: string
  [key: string]: any
}

export interface UpdateGeoCodeDto {
  Name?: string
  Notes?: string
  Assignee?: string
  Status?: string
  Ref?: string
  Region?: string
  'Geography 🌍'?: string
  [key: string]: any
}

export class GeoCodeAirtableService {
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
    
    this.tableName = 'geo Code'
    
    Airtable.configure({ apiKey })
    this.base = Airtable.base(baseId)
    this.relationshipResolver = new RelationshipResolver(baseId, apiKey)
  }

  /**
   * Get all GeoCode records with pagination, filtering, and sorting
   */
  async getAll(params: {
    offset?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    search?: string
    status?: string
  }): Promise<{ data: GeoCode[]; total: number }> {
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
        conditions.push(`FIND("${searchTerm}", LOWER({Name})) > 0`)
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

      const records: GeoCode[] = []

      await this.base(this.tableName).select(selectOptions).eachPage((pageRecords, fetchNextPage) => {
        pageRecords.forEach((record) => {
          records.push(this.mapRecordToGeoCode(record))
        })
        fetchNextPage()
      })

      // Get total count (separate query for accuracy)
      const countOptions: Airtable.SelectOptions<any> = {
        fields: ['Name'], // Only fetch one field for counting
      }
      if (formula) {
        countOptions.filterByFormula = formula
      }
      
      let totalCount = 0
      await this.base(this.tableName).select(countOptions).eachPage((pageRecords, fetchNextPage) => {
        totalCount += pageRecords.length
        fetchNextPage()
      })

      return {
        data: records,
        total: totalCount,
      }
    } catch (error: any) {
      console.error('Error fetching geo Code:', error)
      throw new Error(`Failed to fetch geo Code: ${error.message}`)
    }
  }

  /**
   * Get a single GeoCode record by ID
   */
  async getById(id: string): Promise<GeoCode | null> {
    try {
      const record = await this.base(this.tableName).find(id)
      return this.mapRecordToGeoCode(record)
    } catch (error: any) {
      if (error.error === 'NOT_FOUND') {
        return null
      }
      console.error('Error fetching GeoCode:', error)
      throw new Error(`Failed to fetch GeoCode: ${error.message}`)
    }
  }

  /**
   * Create a new GeoCode record
   */
  async create(dto: CreateGeoCodeDto): Promise<GeoCode> {
    try {
      const fields: any = {}

      if (dto.Name !== undefined) fields['Name'] = dto.Name
      if (dto.Notes !== undefined) fields['Notes'] = dto.Notes
      if (dto.Assignee !== undefined) fields['Assignee'] = dto.Assignee
      if (dto.Status !== undefined) fields['Status'] = dto.Status
      if (dto.Ref !== undefined) fields['Ref'] = dto.Ref
      if (dto.Region !== undefined) fields['Region'] = dto.Region
      if (dto['Geography 🌍'] !== undefined) fields['Geography 🌍'] = dto['Geography 🌍']

      const records = await this.base(this.tableName).create([{ fields }])
      const record = records[0]

      return this.mapRecordToGeoCode(record)
    } catch (error: any) {
      console.error('Error creating GeoCode:', error)
      throw new Error(`Failed to create GeoCode: ${error.message}`)
    }
  }

  /**
   * Update a GeoCode record
   */
  async update(id: string, dto: UpdateGeoCodeDto): Promise<GeoCode> {
    try {
      const fields: any = {}

      if (dto.Name !== undefined) fields['Name'] = dto.Name
      if (dto.Notes !== undefined) fields['Notes'] = dto.Notes
      if (dto.Assignee !== undefined) fields['Assignee'] = dto.Assignee
      if (dto.Status !== undefined) fields['Status'] = dto.Status
      if (dto.Ref !== undefined) fields['Ref'] = dto.Ref
      if (dto.Region !== undefined) fields['Region'] = dto.Region
      if (dto['Geography 🌍'] !== undefined) fields['Geography 🌍'] = dto['Geography 🌍']

      const record = await this.base(this.tableName).update(id, fields)

      return this.mapRecordToGeoCode(record)
    } catch (error: any) {
      if (error.error === 'NOT_FOUND') {
        throw new Error('GeoCode record not found')
      }
      console.error('Error updating GeoCode:', error)
      throw new Error(`Failed to update GeoCode: ${error.message}`)
    }
  }

  /**
   * Delete a GeoCode record
   */
  async delete(id: string): Promise<void> {
    try {
      await this.base(this.tableName).destroy(id)
    } catch (error: any) {
      if (error.error === 'NOT_FOUND') {
        throw new Error('GeoCode record not found')
      }
      console.error('Error deleting GeoCode:', error)
      throw new Error(`Failed to delete GeoCode: ${error.message}`)
    }
  }

  /**
   * Map Airtable record to GeoCode interface
   */
  private mapRecordToGeoCode(record: Airtable.Record<any>): GeoCode {
    const fields = record.fields
    return {
      id: record.id,
      Name: fields.Name as string,
      Notes: fields.Notes as string,
      Assignee: fields.Assignee as string,
      Status: fields.Status as string,
      Ref: fields.Ref as string,
      Region: fields.Region as string,
      'Geography 🌍': fields['Geography 🌍'] as string,
    }
  }

  /**
   * Map frontend field names to Airtable field names
   */
  private mapFieldNameToAirtable(fieldName: string): string {
    const fieldMap: Record<string, string> = {
      'name': 'Name',
      'notes': 'Notes',
      'assignee': 'Assignee',
      'status': 'Status',
      'ref': 'Ref',
      'region': 'Region',
      'geography 🌍': 'Geography 🌍',
    }
    return fieldMap[fieldName.toLowerCase()] || fieldName
  }
}
