import Airtable from 'airtable'
import { ScopeCategorisation, CreateScopeCategorisationDto, UpdateScopeCategorisationDto } from '../types/ScopeCategorisation'
import { RelationshipResolver } from './RelationshipResolver'

/**
 * Scope & Categorisation Airtable Service
 */
export class ScopeCategorisationAirtableService {
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
    
    this.tableName = process.env.AIRTABLE_SCOPE_CATEGORISATION_TABLE_ID || 
                     process.env.AIRTABLE_SCOPE_CATEGORISATION_TABLE_NAME || 
                     'scope & categorisation'
    
    Airtable.configure({ apiKey })
    this.base = Airtable.base(baseId)
    this.relationshipResolver = new RelationshipResolver(baseId, apiKey)
    
    console.log(`🌿 ScopeCategorisationAirtableService initialized:`)
    console.log(`   Base ID: ${baseId}`)
    console.log(`   Table: ${this.tableName}`)
  }

  async getAll(params: {
    offset?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    search?: string
    status?: string
  }): Promise<{ data: ScopeCategorisation[]; total: number }> {
    try {
      let formula = ''
      const conditions: string[] = []

      if (params.status) {
        conditions.push(`{Status} = "${params.status}"`)
      }

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

      const selectOptions: Airtable.SelectOptions<any> = {
        // Explicitly include Status field to ensure it's always fetched
        fields: ['Name', 'Description', 'Status', 'Scope'],
      }
      if (formula) {
        selectOptions.filterByFormula = formula
      }

      if (params.sortBy) {
        const sortField = this.mapFieldNameToAirtable(params.sortBy)
        selectOptions.sort = [{
          field: sortField,
          direction: params.sortOrder === 'desc' ? 'desc' : 'asc',
        }]
      } else {
        selectOptions.sort = [{ field: 'Name', direction: 'asc' }]
      }

      if (params.limit) {
        selectOptions.maxRecords = params.limit
      }
      if (params.offset) {
        selectOptions.pageSize = params.limit || 100
      }

      const records = await this.base(this.tableName)
        .select(selectOptions)
        .all()

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

      const data = await Promise.all(
        records.map(record => this.mapAirtableToScopeCategorisation(record))
      )

      return { data, total }
    } catch (error: any) {
      console.error('Error fetching Scope & Categorisations:', error)
      throw new Error(`Failed to fetch Scope & Categorisations: ${error.message}`)
    }
  }

  async getById(id: string): Promise<ScopeCategorisation | null> {
    try {
      const record = await this.base(this.tableName).find(id)
      return await this.mapAirtableToScopeCategorisation(record)
    } catch (error: any) {
      if (error.error === 'NOT_FOUND') {
        return null
      }
      console.error('Error fetching Scope & Categorisation by ID:', error)
      throw new Error(`Failed to fetch Scope & Categorisation: ${error.message}`)
    }
  }

  async create(dto: CreateScopeCategorisationDto): Promise<ScopeCategorisation> {
    try {
      const fields = this.mapScopeCategorisationToAirtable(dto)
      const records = await this.base(this.tableName).create([{ fields }])
      return await this.mapAirtableToScopeCategorisation(records[0])
    } catch (error: any) {
      console.error('Error creating Scope & Categorisation:', error)
      throw new Error(`Failed to create Scope & Categorisation: ${error.message}`)
    }
  }

  async update(id: string, dto: UpdateScopeCategorisationDto): Promise<ScopeCategorisation> {
    try {
      // Get current record to preserve Status if not provided in update
      let currentRecord: Airtable.Record<any> | null = null
      try {
        const records = await this.base(this.tableName).find(id)
        currentRecord = records
      } catch (error) {
        // Record not found, will create new one
      }

      const fields = this.mapScopeCategorisationToAirtable(dto)
      
      // If Status is not explicitly provided in update, preserve existing value or default to Active
      if (dto.Status === undefined && currentRecord) {
        const currentStatus = currentRecord.fields['Status']
        if (currentStatus && (currentStatus === 'Active' || currentStatus === 'Inactive')) {
          fields['Status'] = currentStatus
        } else {
          fields['Status'] = 'Active' // Default if current is invalid/undefined
        }
      }
      
      const record = await this.base(this.tableName).update([{ id, fields }])
      return await this.mapAirtableToScopeCategorisation(record[0])
    } catch (error: any) {
      console.error('Error updating Scope & Categorisation:', error)
      throw new Error(`Failed to update Scope & Categorisation: ${error.message}`)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.base(this.tableName).destroy([id])
    } catch (error: any) {
      console.error('Error deleting Scope & Categorisation:', error)
      throw new Error(`Failed to delete Scope & Categorisation: ${error.message}`)
    }
  }

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

  private async mapAirtableToScopeCategorisation(record: Airtable.Record<any>): Promise<ScopeCategorisation> {
    const fields = record.fields
    
    // Resolve Scope relationship
    const scopeNames = fields['Scope']
      ? await this.relationshipResolver.resolveLinkedRecords(fields['Scope'], 'Scope', 'Name')
      : []

    // Handle Status field - ensure it's always a valid value
    let status: 'Active' | 'Inactive' = 'Active'
    if (fields['Status']) {
      const statusValue = String(fields['Status']).trim()
      if (statusValue === 'Active' || statusValue === 'Inactive') {
        status = statusValue as 'Active' | 'Inactive'
      }
    }

    return {
      id: record.id,
      Name: fields['Name'] || '',
      Description: fields['Description'] || '',
      Status: status,
      Scope: fields['Scope'] || undefined,
      ScopeName: scopeNames.map(r => r.name),
      Notes: fields['Notes'] || '',
      createdAt: this.formatDate(record._rawJson.createdTime),
      updatedAt: this.formatDate(record._rawJson.lastModifiedTime),
      createdBy: this.getCreatedBy(fields),
      lastModifiedBy: this.getLastModifiedBy(fields),
    }
  }

  private mapScopeCategorisationToAirtable(dto: CreateScopeCategorisationDto | UpdateScopeCategorisationDto): Record<string, any> {
    const fields: Record<string, any> = {}
    
    if (dto.Name !== undefined && dto.Name !== null && String(dto.Name).trim() !== '') {
      fields['Name'] = String(dto.Name).trim()
    }
    if (dto.Description !== undefined && dto.Description !== null && String(dto.Description).trim() !== '') {
      fields['Description'] = String(dto.Description).trim()
    }
    // Always set Status - ensure it's synchronized
    if (dto.Status !== undefined && dto.Status !== null) {
      const statusValue = String(dto.Status).trim()
      // Validate status value matches Airtable select options
      if (statusValue === 'Active' || statusValue === 'Inactive') {
        fields['Status'] = statusValue
      } else {
        // Default to Active if invalid value
        fields['Status'] = 'Active'
      }
    } else {
      // Default to Active if not provided
      fields['Status'] = 'Active'
    }
    if (dto.Scope !== undefined) {
      fields['Scope'] = Array.isArray(dto.Scope) ? dto.Scope : [dto.Scope]
    }
    if (dto.Notes !== undefined && dto.Notes !== null && String(dto.Notes).trim() !== '') {
      fields['Notes'] = String(dto.Notes).trim()
    }
    
    return fields
  }

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

  private formatDate(dateString?: string): string | undefined {
    if (!dateString) return undefined
    return new Date(dateString).toISOString()
  }

  private getCreatedBy(fields: any): string | undefined {
    if (fields['Created By']) {
      const createdBy = Array.isArray(fields['Created By']) ? fields['Created By'][0] : fields['Created By']
      return typeof createdBy === 'object' && createdBy?.email ? createdBy.email : String(createdBy)
    }
    return undefined
  }

  private getLastModifiedBy(fields: any): string | undefined {
    if (fields['Last Modified By']) {
      const lastModifiedBy = Array.isArray(fields['Last Modified By']) ? fields['Last Modified By'][0] : fields['Last Modified By']
      return typeof lastModifiedBy === 'object' && lastModifiedBy?.email ? lastModifiedBy.email : String(lastModifiedBy)
    }
    return undefined
  }
}

