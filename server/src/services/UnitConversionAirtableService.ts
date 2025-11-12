import Airtable from 'airtable'
import { UnitConversion, CreateUnitConversionDto, UpdateUnitConversionDto } from '../types/UnitConversion'
import { RelationshipResolver } from './RelationshipResolver'

/**
 * Unit Conversion Airtable Service
 */
export class UnitConversionAirtableService {
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
    
    this.tableName = process.env.AIRTABLE_UNIT_CONVERSION_TABLE_ID || 
                     process.env.AIRTABLE_UNIT_CONVERSION_TABLE_NAME || 
                     'Unit Conversion'
    
    Airtable.configure({ apiKey })
    this.base = Airtable.base(baseId)
    this.relationshipResolver = new RelationshipResolver(baseId, apiKey)
    
    console.log(`🌿 UnitConversionAirtableService initialized:`)
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
  }): Promise<{ data: UnitConversion[]; total: number }> {
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
          FIND("${searchTerm}", LOWER({Description})) > 0,
          FIND("${searchTerm}", LOWER({Unit to convert})) > 0,
          FIND("${searchTerm}", LOWER({Normalized unit})) > 0
        )`)
      }

      if (conditions.length > 0) {
        formula = `AND(${conditions.join(', ')})`
      }

      const selectOptions: Airtable.SelectOptions<any> = {
        // Explicitly include all fields that exist in Airtable
        // Note: Description, Activity Density, Status, Notes are optional and may not exist in all bases
        fields: [
          'Name',
          'Unit to convert',
          'Dimension (from Unit to convert)',
          'Normalized unit',
          'Dimension (from Normalized unit)',
          'Value',
          'Conversion value',
          'Type',
        ],
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
        records.map(record => this.mapAirtableToUnitConversion(record))
      )

      return { data, total }
    } catch (error: any) {
      console.error('Error fetching Unit Conversions:', error)
      throw new Error(`Failed to fetch Unit Conversions: ${error.message}`)
    }
  }

  async getById(id: string): Promise<UnitConversion | null> {
    try {
      const record = await this.base(this.tableName).find(id)
      return await this.mapAirtableToUnitConversion(record)
    } catch (error: any) {
      if (error.error === 'NOT_FOUND') {
        return null
      }
      console.error('Error fetching Unit Conversion by ID:', error)
      throw new Error(`Failed to fetch Unit Conversion: ${error.message}`)
    }
  }

  async create(dto: CreateUnitConversionDto): Promise<UnitConversion> {
    try {
      const fields = this.mapUnitConversionToAirtable(dto)
      const records = await this.base(this.tableName).create([{ fields }])
      return await this.mapAirtableToUnitConversion(records[0])
    } catch (error: any) {
      console.error('Error creating Unit Conversion:', error)
      throw new Error(`Failed to create Unit Conversion: ${error.message}`)
    }
  }

  async update(id: string, dto: UpdateUnitConversionDto): Promise<UnitConversion> {
    try {
      const fields = this.mapUnitConversionToAirtable(dto)
      const record = await this.base(this.tableName).update([{ id, fields }])
      return await this.mapAirtableToUnitConversion(record[0])
    } catch (error: any) {
      console.error('Error updating Unit Conversion:', error)
      throw new Error(`Failed to update Unit Conversion: ${error.message}`)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.base(this.tableName).destroy([id])
    } catch (error: any) {
      console.error('Error deleting Unit Conversion:', error)
      throw new Error(`Failed to delete Unit Conversion: ${error.message}`)
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

  private async mapAirtableToUnitConversion(record: Airtable.Record<any>): Promise<UnitConversion> {
    const fields = record.fields
    
    // Resolve Unit to convert relationship (links to Unit table)
    const unitToConvertNames = fields['Unit to convert']
      ? await this.relationshipResolver.resolveLinkedRecords(fields['Unit to convert'], 'Unit', 'Name')
      : []
    
    // Resolve Normalized unit relationship (links to Unit table)
    const normalizedUnitNames = fields['Normalized unit']
      ? await this.relationshipResolver.resolveLinkedRecords(fields['Normalized unit'], 'Unit', 'Name')
      : []
    
    // Resolve Activity Density relationship (if exists)
    const activityDensityNames = fields['Activity Density']
      ? await this.relationshipResolver.resolveLinkedRecords(fields['Activity Density'], 'Activity Density', 'Name')
      : []

    return {
      id: record.id,
      Name: fields['Name'] || '',
      'Unit to convert': fields['Unit to convert'] || undefined,
      'Unit to convert Name': unitToConvertNames.map(r => r.name),
      'Dimension (from Unit to convert)': Array.isArray(fields['Dimension (from Unit to convert)']) 
        ? fields['Dimension (from Unit to convert)'].join(', ') 
        : (fields['Dimension (from Unit to convert)'] || undefined),
      'Normalized unit': fields['Normalized unit'] || undefined,
      'Normalized unit Name': normalizedUnitNames.map(r => r.name),
      'Dimension (from Normalized unit)': Array.isArray(fields['Dimension (from Normalized unit)']) 
        ? fields['Dimension (from Normalized unit)'].join(', ') 
        : (fields['Dimension (from Normalized unit)'] || undefined),
      Value: fields['Value'] !== undefined && fields['Value'] !== null ? Number(fields['Value']) : undefined,
      'Conversion value': fields['Conversion value'] !== undefined && fields['Conversion value'] !== null ? Number(fields['Conversion value']) : undefined,
      Type: fields['Type'] || undefined,
      // Optional fields that may not exist in all Airtable bases
      Description: fields['Description'] || undefined,
      'Activity Density': fields['Activity Density'] || undefined,
      'Activity Density Name': activityDensityNames.map(r => r.name),
      Status: fields['Status'] || undefined,
      Notes: fields['Notes'] || undefined,
      createdAt: this.formatDate(record._rawJson.createdTime),
      updatedAt: this.formatDate(record._rawJson.lastModifiedTime),
      createdBy: this.getCreatedBy(fields),
      lastModifiedBy: this.getLastModifiedBy(fields),
    }
  }

  private mapUnitConversionToAirtable(dto: CreateUnitConversionDto | UpdateUnitConversionDto): Record<string, any> {
    const fields: Record<string, any> = {}
    
    if (dto.Name !== undefined && dto.Name !== null && String(dto.Name).trim() !== '') {
      fields['Name'] = String(dto.Name).trim()
    }
    if (dto['Unit to convert'] !== undefined) {
      fields['Unit to convert'] = Array.isArray(dto['Unit to convert']) 
        ? dto['Unit to convert'] 
        : [dto['Unit to convert']]
    }
    // Dimension fields are lookup fields (read-only), so we don't write them
    if (dto['Normalized unit'] !== undefined) {
      fields['Normalized unit'] = Array.isArray(dto['Normalized unit']) 
        ? dto['Normalized unit'] 
        : [dto['Normalized unit']]
    }
    // Dimension fields are lookup fields (read-only), so we don't write them
    if (dto.Value !== undefined && dto.Value !== null) {
      fields['Value'] = Number(dto.Value)
    }
    if (dto['Conversion value'] !== undefined && dto['Conversion value'] !== null) {
      fields['Conversion value'] = Number(dto['Conversion value'])
    }
    if (dto.Type !== undefined && dto.Type !== null && String(dto.Type).trim() !== '') {
      fields['Type'] = String(dto.Type).trim()
    }
    if (dto.Description !== undefined && dto.Description !== null && String(dto.Description).trim() !== '') {
      fields['Description'] = String(dto.Description).trim()
    }
    if (dto.Status !== undefined && dto.Status !== null) {
      fields['Status'] = String(dto.Status).trim()
    }
    if (dto['Activity Density'] !== undefined) {
      fields['Activity Density'] = Array.isArray(dto['Activity Density']) 
        ? dto['Activity Density'] 
        : [dto['Activity Density']]
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

