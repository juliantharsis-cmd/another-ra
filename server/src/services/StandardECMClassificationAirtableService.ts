import Airtable from 'airtable'
import { StandardECMClassification, CreateStandardECMClassificationDto, UpdateStandardECMClassificationDto } from '../types/StandardECMClassification'
import { RelationshipResolver } from './RelationshipResolver'

/**
 * Standard ECM Classification Airtable Service
 */
export class StandardECMClassificationAirtableService {
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
    
    this.tableName = process.env.AIRTABLE_STANDARD_ECM_CLASSIFICATION_TABLE_ID || 
                     process.env.AIRTABLE_STANDARD_ECM_CLASSIFICATION_TABLE_NAME || 
                     'Standard ECM Classification'
    
    Airtable.configure({ apiKey })
    this.base = Airtable.base(baseId)
    this.relationshipResolver = new RelationshipResolver(baseId, apiKey)
    
    console.log(`🌿 StandardECMClassificationAirtableService initialized:`)
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
  }): Promise<{ data: StandardECMClassification[]; total: number }> {
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

      const selectOptions: Airtable.SelectOptions<any> = {}
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
        records.map(record => this.mapAirtableToStandardECMClassification(record))
      )

      return { data, total }
    } catch (error: any) {
      console.error('Error fetching Standard ECM Classifications:', error)
      throw new Error(`Failed to fetch Standard ECM Classifications: ${error.message}`)
    }
  }

  async getById(id: string): Promise<StandardECMClassification | null> {
    try {
      const record = await this.base(this.tableName).find(id)
      return await this.mapAirtableToStandardECMClassification(record)
    } catch (error: any) {
      if (error.error === 'NOT_FOUND') {
        return null
      }
      console.error('Error fetching Standard ECM Classification by ID:', error)
      throw new Error(`Failed to fetch Standard ECM Classification: ${error.message}`)
    }
  }

  async create(dto: CreateStandardECMClassificationDto): Promise<StandardECMClassification> {
    try {
      const fields = this.mapStandardECMClassificationToAirtable(dto)
      const records = await this.base(this.tableName).create([{ fields }])
      return await this.mapAirtableToStandardECMClassification(records[0])
    } catch (error: any) {
      console.error('Error creating Standard ECM Classification:', error)
      throw new Error(`Failed to create Standard ECM Classification: ${error.message}`)
    }
  }

  async update(id: string, dto: UpdateStandardECMClassificationDto): Promise<StandardECMClassification> {
    try {
      const fields = this.mapStandardECMClassificationToAirtable(dto)
      const record = await this.base(this.tableName).update([{ id, fields }])
      return await this.mapAirtableToStandardECMClassification(record[0])
    } catch (error: any) {
      console.error('Error updating Standard ECM Classification:', error)
      throw new Error(`Failed to update Standard ECM Classification: ${error.message}`)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.base(this.tableName).destroy([id])
    } catch (error: any) {
      console.error('Error deleting Standard ECM Classification:', error)
      throw new Error(`Failed to delete Standard ECM Classification: ${error.message}`)
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

  private async mapAirtableToStandardECMClassification(record: Airtable.Record<any>): Promise<StandardECMClassification> {
    const fields = record.fields
    
    // Resolve Standard ECM catalog relationship
    const catalogNames = fields['Standard ECM catalog']
      ? await this.relationshipResolver.resolveLinkedRecords(fields['Standard ECM catalog'], 'Standard ECM catalog', 'Name')
      : []

    return {
      id: record.id,
      Name: fields['Name'] || '',
      Description: fields['Description'] || '',
      Status: fields['Status'] || 'Active',
      'Standard ECM catalog': fields['Standard ECM catalog'] || undefined,
      'Standard ECM catalog Name': catalogNames.map(r => r.name),
      Notes: fields['Notes'] || '',
      createdAt: this.formatDate(record._rawJson.createdTime),
      updatedAt: this.formatDate(record._rawJson.lastModifiedTime),
      createdBy: this.getCreatedBy(fields),
      lastModifiedBy: this.getLastModifiedBy(fields),
    }
  }

  private mapStandardECMClassificationToAirtable(dto: CreateStandardECMClassificationDto | UpdateStandardECMClassificationDto): Record<string, any> {
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
      fields['Status'] = 'Active'
    }
    if (dto['Standard ECM catalog'] !== undefined) {
      fields['Standard ECM catalog'] = Array.isArray(dto['Standard ECM catalog']) 
        ? dto['Standard ECM catalog'] 
        : [dto['Standard ECM catalog']]
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

