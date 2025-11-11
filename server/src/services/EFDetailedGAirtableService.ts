import Airtable from 'airtable'
import { EFDetailedG, CreateEFDetailedGDto, UpdateEFDetailedGDto } from '../types/EFDetailedG'
import { RelationshipResolver } from './RelationshipResolver'

/**
 * EF/Detailed G Airtable Service
 * 
 * Handles all Airtable API interactions for EF/Detailed G table.
 */
export class EFDetailedGAirtableService {
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
    
    this.tableName = process.env.AIRTABLE_EF_DETAILED_G_TABLE_ID || 
                     process.env.AIRTABLE_EF_DETAILED_G_TABLE_NAME || 
                     'EF/Detailed G'
    
    Airtable.configure({ apiKey })
    this.base = Airtable.base(baseId)
    this.relationshipResolver = new RelationshipResolver(baseId, apiKey)
    
    console.log(`🌿 EFDetailedGAirtableService initialized:`)
    console.log(`   Base ID: ${baseId}`)
    console.log(`   Table: ${this.tableName}`)
  }

  /**
   * Get all EF/Detailed G records with pagination, filtering, and sorting
   */
  async getAll(params: {
    offset?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    search?: string
    status?: string
  }): Promise<{ data: EFDetailedG[]; total: number }> {
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

      // Map records and resolve relationships
      const data = await Promise.all(
        records.map(record => this.mapAirtableToEFDetailedG(record))
      )

      return { data, total }
    } catch (error: any) {
      console.error('Error fetching EF/Detailed G records:', error)
      throw new Error(`Failed to fetch EF/Detailed G records: ${error.message}`)
    }
  }

  /**
   * Get a single EF/Detailed G record by ID
   */
  async getById(id: string): Promise<EFDetailedG | null> {
    try {
      const record = await this.base(this.tableName).find(id)
      return await this.mapAirtableToEFDetailedG(record)
    } catch (error: any) {
      if (error.error === 'NOT_FOUND') {
        return null
      }
      console.error('Error fetching EF/Detailed G by ID:', error)
      throw new Error(`Failed to fetch EF/Detailed G: ${error.message}`)
    }
  }

  /**
   * Create a new EF/Detailed G record
   */
  async create(dto: CreateEFDetailedGDto): Promise<EFDetailedG> {
    try {
      const fields = this.mapEFDetailedGToAirtable(dto)
      
      const records = await this.base(this.tableName).create([{ fields }])
      const record = records[0]
      
      return await this.mapAirtableToEFDetailedG(record)
    } catch (error: any) {
      console.error('Error creating EF/Detailed G:', error)
      throw new Error(`Failed to create EF/Detailed G: ${error.message}`)
    }
  }

  /**
   * Update an existing EF/Detailed G record
   */
  async update(id: string, dto: UpdateEFDetailedGDto): Promise<EFDetailedG> {
    try {
      const fields = this.mapEFDetailedGToAirtable(dto)
      
      const record = await this.base(this.tableName).update([{ id, fields }])
      
      return await this.mapAirtableToEFDetailedG(record[0])
    } catch (error: any) {
      console.error('Error updating EF/Detailed G:', error)
      throw new Error(`Failed to update EF/Detailed G: ${error.message}`)
    }
  }

  /**
   * Delete an EF/Detailed G record
   */
  async delete(id: string): Promise<void> {
    try {
      await this.base(this.tableName).destroy([id])
    } catch (error: any) {
      console.error('Error deleting EF/Detailed G:', error)
      throw new Error(`Failed to delete EF/Detailed G: ${error.message}`)
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
   * Map Airtable record to EFDetailedG interface
   */
  private async mapAirtableToEFDetailedG(record: Airtable.Record<any>): Promise<EFDetailedG> {
    const fields = record.fields
    
    // Resolve linked record names
    const [
      efGwpNames,
      ghgTypeNames,
      stdEmissionFactorNames,
    ] = await Promise.all([
      fields['EF GWP'] 
        ? this.relationshipResolver.resolveLinkedRecords(fields['EF GWP'], 'EF GWP', 'Name')
        : Promise.resolve([]),
      fields['GHG TYPE']
        ? this.relationshipResolver.resolveLinkedRecords(fields['GHG TYPE'], 'GHG TYPE', 'Name')
        : Promise.resolve([]),
      fields['Std Emission factors']
        ? this.relationshipResolver.resolveLinkedRecords(fields['Std Emission factors'], 'Std Emission factors', 'Name')
        : Promise.resolve([]),
    ])

    return {
      id: record.id,
      Name: fields['Name'] || '',
      Description: fields['Description'] || '',
      Status: fields['Status'] || 'Active',
      'EF GWP': fields['EF GWP'] || undefined,
      'EF GWP Name': efGwpNames.map(r => r.name),
      'GHG TYPE': fields['GHG TYPE'] || undefined,
      'GHG TYPE Name': ghgTypeNames.map(r => r.name),
      'Std Emission factors': fields['Std Emission factors'] || undefined,
      'Std Emission factors Name': stdEmissionFactorNames.map(r => r.name),
      Notes: fields['Notes'] || '',
      createdAt: this.formatDate(record._rawJson.createdTime),
      updatedAt: this.formatDate(record._rawJson.lastModifiedTime),
      createdBy: this.getCreatedBy(fields),
      lastModifiedBy: this.getLastModifiedBy(fields),
    }
  }

  /**
   * Map EFDetailedG DTO to Airtable fields
   */
  private mapEFDetailedGToAirtable(dto: CreateEFDetailedGDto | UpdateEFDetailedGDto): Record<string, any> {
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
    if (dto['EF GWP'] !== undefined) {
      fields['EF GWP'] = Array.isArray(dto['EF GWP']) 
        ? dto['EF GWP'] 
        : [dto['EF GWP']]
    }
    if (dto['GHG TYPE'] !== undefined) {
      fields['GHG TYPE'] = Array.isArray(dto['GHG TYPE']) 
        ? dto['GHG TYPE'] 
        : [dto['GHG TYPE']]
    }
    if (dto['Std Emission factors'] !== undefined) {
      fields['Std Emission factors'] = Array.isArray(dto['Std Emission factors']) 
        ? dto['Std Emission factors'] 
        : [dto['Std Emission factors']]
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

