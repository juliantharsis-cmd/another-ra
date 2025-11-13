import Airtable from 'airtable'
import { RelationshipResolver } from './RelationshipResolver'

/**
 * ThermalCriteria Airtable Service
 * 
 * Handles all Airtable API interactions for Thermal Criteria table
 */
export interface ThermalCriteria {
  id: string
  Zone?: string
  'Thermal Criteria'?: string
  'Pasted field 1'?: string
  [key: string]: any // Allow additional fields from Airtable
}

export interface CreateThermalCriteriaDto {
  Zone?: string
  'Thermal Criteria'?: string
  'Pasted field 1'?: string
  [key: string]: any
}

export interface UpdateThermalCriteriaDto {
  Zone?: string
  'Thermal Criteria'?: string
  'Pasted field 1'?: string
  [key: string]: any
}

export class ThermalCriteriaAirtableService {
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
    
    this.tableName = 'Thermal Criteria'
    
    Airtable.configure({ apiKey })
    this.base = Airtable.base(baseId)
    this.relationshipResolver = new RelationshipResolver(baseId, apiKey)
  }

  /**
   * Get all ThermalCriteria records with pagination, filtering, and sorting
   */
  async getAll(params: {
    offset?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    search?: string
    status?: string
  }): Promise<{ data: ThermalCriteria[]; total: number }> {
    try {
      let formula = ''
      const conditions: string[] = []

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

      const records: ThermalCriteria[] = []

      await this.base(this.tableName).select(selectOptions).eachPage((pageRecords, fetchNextPage) => {
        pageRecords.forEach((record) => {
          records.push(this.mapRecordToThermalCriteria(record))
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
      console.error('Error fetching Thermal Criteria:', error)
      throw new Error(`Failed to fetch Thermal Criteria: ${error.message}`)
    }
  }

  /**
   * Get a single ThermalCriteria record by ID
   */
  async getById(id: string): Promise<ThermalCriteria | null> {
    try {
      const record = await this.base(this.tableName).find(id)
      return this.mapRecordToThermalCriteria(record)
    } catch (error: any) {
      if (error.error === 'NOT_FOUND') {
        return null
      }
      console.error('Error fetching ThermalCriteria:', error)
      throw new Error(`Failed to fetch ThermalCriteria: ${error.message}`)
    }
  }

  /**
   * Create a new ThermalCriteria record
   */
  async create(dto: CreateThermalCriteriaDto): Promise<ThermalCriteria> {
    try {
      const fields: any = {}

      if (dto.Zone !== undefined) fields['Zone'] = dto.Zone
      if (dto['Thermal Criteria'] !== undefined) fields['Thermal Criteria'] = dto['Thermal Criteria']
      if (dto['Pasted field 1'] !== undefined) fields['Pasted field 1'] = dto['Pasted field 1']

      const records = await this.base(this.tableName).create([{ fields }])
      const record = records[0]

      return this.mapRecordToThermalCriteria(record)
    } catch (error: any) {
      console.error('Error creating ThermalCriteria:', error)
      throw new Error(`Failed to create ThermalCriteria: ${error.message}`)
    }
  }

  /**
   * Update a ThermalCriteria record
   */
  async update(id: string, dto: UpdateThermalCriteriaDto): Promise<ThermalCriteria> {
    try {
      const fields: any = {}

      if (dto.Zone !== undefined) fields['Zone'] = dto.Zone
      if (dto['Thermal Criteria'] !== undefined) fields['Thermal Criteria'] = dto['Thermal Criteria']
      if (dto['Pasted field 1'] !== undefined) fields['Pasted field 1'] = dto['Pasted field 1']

      const record = await this.base(this.tableName).update(id, fields)

      return this.mapRecordToThermalCriteria(record)
    } catch (error: any) {
      if (error.error === 'NOT_FOUND') {
        throw new Error('ThermalCriteria record not found')
      }
      console.error('Error updating ThermalCriteria:', error)
      throw new Error(`Failed to update ThermalCriteria: ${error.message}`)
    }
  }

  /**
   * Delete a ThermalCriteria record
   */
  async delete(id: string): Promise<void> {
    try {
      await this.base(this.tableName).destroy(id)
    } catch (error: any) {
      if (error.error === 'NOT_FOUND') {
        throw new Error('ThermalCriteria record not found')
      }
      console.error('Error deleting ThermalCriteria:', error)
      throw new Error(`Failed to delete ThermalCriteria: ${error.message}`)
    }
  }

  /**
   * Map Airtable record to ThermalCriteria interface
   */
  private mapRecordToThermalCriteria(record: Airtable.Record<any>): ThermalCriteria {
    const fields = record.fields
    return {
      id: record.id,
      Zone: fields.Zone as string,
      'Thermal Criteria': fields['Thermal Criteria'] as string,
      'Pasted field 1': fields['Pasted field 1'] as string,
    }
  }

  /**
   * Map frontend field names to Airtable field names
   */
  private mapFieldNameToAirtable(fieldName: string): string {
    const fieldMap: Record<string, string> = {
      'zone': 'Zone',
      'thermal criteria': 'Thermal Criteria',
      'pasted field 1': 'Pasted field 1',
    }
    return fieldMap[fieldName.toLowerCase()] || fieldName
  }
}
