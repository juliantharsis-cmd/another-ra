import Airtable from 'airtable'
import { StandardECMCatalog, CreateStandardECMCatalogDto, UpdateStandardECMCatalogDto } from '../types/StandardECMCatalog'
import { RelationshipResolver } from './RelationshipResolver'

/**
 * Standard ECM Catalog Airtable Service
 */
export class StandardECMCatalogAirtableService {
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
    
    this.tableName = process.env.AIRTABLE_STANDARD_ECM_CATALOG_TABLE_ID || 
                     process.env.AIRTABLE_STANDARD_ECM_CATALOG_TABLE_NAME || 
                     'Standard ECM catalog'
    
    Airtable.configure({ apiKey })
    this.base = Airtable.base(baseId)
    this.relationshipResolver = new RelationshipResolver(baseId, apiKey)
    
    console.log(`🌿 StandardECMCatalogAirtableService initialized:`)
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
  }): Promise<{ data: StandardECMCatalog[]; total: number }> {
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
        records.map(record => this.mapAirtableToStandardECMCatalog(record))
      )

      return { data, total }
    } catch (error: any) {
      console.error('Error fetching Standard ECM Catalogs:', error)
      throw new Error(`Failed to fetch Standard ECM Catalogs: ${error.message}`)
    }
  }

  async getById(id: string): Promise<StandardECMCatalog | null> {
    try {
      const record = await this.base(this.tableName).find(id)
      return await this.mapAirtableToStandardECMCatalog(record)
    } catch (error: any) {
      if (error.error === 'NOT_FOUND') {
        return null
      }
      console.error('Error fetching Standard ECM Catalog by ID:', error)
      throw new Error(`Failed to fetch Standard ECM Catalog: ${error.message}`)
    }
  }

  async create(dto: CreateStandardECMCatalogDto): Promise<StandardECMCatalog> {
    try {
      const fields = this.mapStandardECMCatalogToAirtable(dto)
      const records = await this.base(this.tableName).create([{ fields }])
      return await this.mapAirtableToStandardECMCatalog(records[0])
    } catch (error: any) {
      console.error('Error creating Standard ECM Catalog:', error)
      throw new Error(`Failed to create Standard ECM Catalog: ${error.message}`)
    }
  }

  async update(id: string, dto: UpdateStandardECMCatalogDto): Promise<StandardECMCatalog> {
    try {
      const fields = this.mapStandardECMCatalogToAirtable(dto)
      const record = await this.base(this.tableName).update([{ id, fields }])
      return await this.mapAirtableToStandardECMCatalog(record[0])
    } catch (error: any) {
      console.error('Error updating Standard ECM Catalog:', error)
      throw new Error(`Failed to update Standard ECM Catalog: ${error.message}`)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.base(this.tableName).destroy([id])
    } catch (error: any) {
      console.error('Error deleting Standard ECM Catalog:', error)
      throw new Error(`Failed to delete Standard ECM Catalog: ${error.message}`)
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

  private async mapAirtableToStandardECMCatalog(record: Airtable.Record<any>): Promise<StandardECMCatalog> {
    const fields = record.fields
    
    // Resolve Standard ECM Classification relationship
    const classificationNames = fields['Standard ECM Classification']
      ? await this.relationshipResolver.resolveLinkedRecords(fields['Standard ECM Classification'], 'Standard ECM Classification', 'Name')
      : []

    return {
      id: record.id,
      Name: fields['Name'] || '',
      Description: fields['Description'] || '',
      Status: fields['Status'] || 'Active',
      'Standard ECM Classification': fields['Standard ECM Classification'] || undefined,
      'Standard ECM Classification Name': classificationNames.map(r => r.name),
      Notes: fields['Notes'] || '',
      createdAt: this.formatDate(record._rawJson.createdTime),
      updatedAt: this.formatDate(record._rawJson.lastModifiedTime),
      createdBy: this.getCreatedBy(fields),
      lastModifiedBy: this.getLastModifiedBy(fields),
    }
  }

  private mapStandardECMCatalogToAirtable(dto: CreateStandardECMCatalogDto | UpdateStandardECMCatalogDto): Record<string, any> {
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
    if (dto['Standard ECM Classification'] !== undefined) {
      fields['Standard ECM Classification'] = Array.isArray(dto['Standard ECM Classification']) 
        ? dto['Standard ECM Classification'] 
        : [dto['Standard ECM Classification']]
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

