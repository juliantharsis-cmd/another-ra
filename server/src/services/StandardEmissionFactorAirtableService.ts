import Airtable from 'airtable'
import { StandardEmissionFactor, CreateStandardEmissionFactorDto, UpdateStandardEmissionFactorDto } from '../types/StandardEmissionFactor'
import { RelationshipResolver } from './RelationshipResolver'

/**
 * Standard Emission Factor Airtable Service
 * 
 * Handles all Airtable API interactions for Standard Emission Factor table.
 */
export class StandardEmissionFactorAirtableService {
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
    
    this.tableName = process.env.AIRTABLE_STANDARD_EMISSION_FACTOR_TABLE_ID || 
                     process.env.AIRTABLE_STANDARD_EMISSION_FACTOR_TABLE_NAME || 
                     'Standard Emission factors'
    
    Airtable.configure({ apiKey })
    this.base = Airtable.base(baseId)
    this.relationshipResolver = new RelationshipResolver(baseId, apiKey)
    
    console.log(`🌿 StandardEmissionFactorAirtableService initialized:`)
    console.log(`   Base ID: ${baseId}`)
    console.log(`   Table: ${this.tableName}`)
  }

  /**
   * Get all Standard Emission Factors with pagination, filtering, and sorting
   */
  async getAll(params: {
    offset?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    search?: string
    status?: string
  }): Promise<{ data: StandardEmissionFactor[]; total: number }> {
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

      const selectOptions: Airtable.SelectOptions<any> = {
        // Explicitly include all fields that exist in Airtable
        fields: [
          'Name',
          'Status',
          'Emission Factors Dataset',
          'Emission Factor (CO2e)',
          'Type of EF',
          'GHG Unit (CO2e)',
          'Created',
          'Last Modified',
          'Industry Classification & Emission Factors',
          'Version',
          'Publication Date',
          'Normalized activity',
          'Ref.IC',
          'Industry Classification',
          'Source UOM',
          'Scope',
          'Availability ',
          'code (from Industry Classification  🏭)',
          'Name copy',
          'ID',
          'Activity Default UOM',
          'EF/Detailed G',
          'Dimension (from Source UOM)',
          'Status (from Version)',
        ],
      }
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

      // Get total count (for pagination) - optimize by doing it in parallel with mapping
      let total = records.length
      const totalCountPromise = (params.limit || params.offset) 
        ? (async () => {
            const countSelectOptions: Airtable.SelectOptions<any> = {
              fields: ['Name'], // Minimal fields for count
            }
            if (formula) {
              countSelectOptions.filterByFormula = formula
            }
            const countRecords = await this.base(this.tableName)
              .select(countSelectOptions)
              .all()
            return countRecords.length
          })()
        : Promise.resolve(records.length)

      // Batch resolve all linked records across all records to minimize API calls
      // Collect all unique IDs per table first
      const linkedRecordIdsByTable: Record<string, Set<string>> = {}
      records.forEach(record => {
        const fields = record.fields
        const tableNameMap: Record<string, string> = {
          'GHG Unit (CO2e)': 'Unit',
          'Source UOM': 'Unit',
          'Activity Default UOM': 'Unit',
          'Normalized activity': 'Normalized Activities',
        }
        const getTableName = (fieldName: string): string => tableNameMap[fieldName] || fieldName
        
        // Collect IDs for each linked field
        const linkedFields = [
          { field: 'Emission Factors Dataset', table: getTableName('Emission Factors Dataset') },
          { field: 'GHG Unit (CO2e)', table: getTableName('GHG Unit (CO2e)') },
          { field: 'Industry Classification & Emission Factors', table: getTableName('Industry Classification & Emission Factors') },
          { field: 'Version', table: getTableName('Version') },
          { field: 'Normalized activity', table: getTableName('Normalized activity') },
          { field: 'Industry Classification', table: getTableName('Industry Classification') },
          { field: 'Source UOM', table: getTableName('Source UOM') },
          { field: 'Scope', table: getTableName('Scope') },
          { field: 'Activity Default UOM', table: getTableName('Activity Default UOM') },
          { field: 'EF/Detailed G', table: getTableName('EF/Detailed G') },
        ]
        
        linkedFields.forEach(({ field, table }) => {
          const ids = fields[field]
          if (ids) {
            const idArray = Array.isArray(ids) ? ids : [ids]
            if (!linkedRecordIdsByTable[table]) {
              linkedRecordIdsByTable[table] = new Set()
            }
            idArray.forEach(id => linkedRecordIdsByTable[table].add(id))
          }
        })
      })

      // Batch resolve all unique IDs per table in parallel
      const batchResolutions = await Promise.all(
        Object.entries(linkedRecordIdsByTable).map(async ([table, ids]) => {
          if (ids.size === 0) return { table, resolved: new Map<string, string>() }
          try {
            const resolved = await this.relationshipResolver.resolveLinkedRecords(
              Array.from(ids),
              table,
              'Name'
            )
            const idToNameMap = new Map<string, string>()
            resolved.forEach(r => idToNameMap.set(r.id, r.name))
            return { table, resolved: idToNameMap }
          } catch (error) {
            console.warn(`Error batch resolving ${table}:`, error)
            return { table, resolved: new Map<string, string>() }
          }
        })
      )

      // Create lookup map for fast access
      const resolutionMap = new Map<string, Map<string, string>>()
      batchResolutions.forEach(({ table, resolved }) => {
        resolutionMap.set(table, resolved)
      })

      // Map records using pre-resolved names (much faster)
      const data = await Promise.all(
        records.map(record => this.mapAirtableToStandardEmissionFactorWithResolutions(record, resolutionMap))
      )

      // Get total count
      total = await totalCountPromise

      return { data, total }
    } catch (error: any) {
      console.error('Error fetching Standard Emission Factors:', error)
      throw new Error(`Failed to fetch Standard Emission Factors: ${error.message}`)
    }
  }

  /**
   * Get a single Standard Emission Factor by ID
   */
  async getById(id: string): Promise<StandardEmissionFactor | null> {
    try {
      const record = await this.base(this.tableName).find(id)
      return await this.mapAirtableToStandardEmissionFactor(record)
    } catch (error: any) {
      if (error.error === 'NOT_FOUND') {
        return null
      }
      console.error('Error fetching Standard Emission Factor by ID:', error)
      throw new Error(`Failed to fetch Standard Emission Factor: ${error.message}`)
    }
  }

  /**
   * Create a new Standard Emission Factor
   */
  async create(dto: CreateStandardEmissionFactorDto): Promise<StandardEmissionFactor> {
    try {
      const fields = this.mapStandardEmissionFactorToAirtable(dto)
      
      const records = await this.base(this.tableName).create([{ fields }])
      const record = records[0]
      
      return await this.mapAirtableToStandardEmissionFactor(record)
    } catch (error: any) {
      console.error('Error creating Standard Emission Factor:', error)
      throw new Error(`Failed to create Standard Emission Factor: ${error.message}`)
    }
  }

  /**
   * Update an existing Standard Emission Factor
   */
  async update(id: string, dto: UpdateStandardEmissionFactorDto): Promise<StandardEmissionFactor> {
    try {
      const fields = this.mapStandardEmissionFactorToAirtable(dto)
      
      const record = await this.base(this.tableName).update([{ id, fields }])
      
      return await this.mapAirtableToStandardEmissionFactor(record[0])
    } catch (error: any) {
      console.error('Error updating Standard Emission Factor:', error)
      throw new Error(`Failed to update Standard Emission Factor: ${error.message}`)
    }
  }

  /**
   * Delete a Standard Emission Factor
   */
  async delete(id: string): Promise<void> {
    try {
      await this.base(this.tableName).destroy([id])
    } catch (error: any) {
      console.error('Error deleting Standard Emission Factor:', error)
      throw new Error(`Failed to delete Standard Emission Factor: ${error.message}`)
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
   * Map Airtable record to StandardEmissionFactor interface with pre-resolved relationships
   * This is faster than resolving relationships one-by-one
   */
  private mapAirtableToStandardEmissionFactorWithResolutions(
    record: Airtable.Record<any>,
    resolutionMap: Map<string, Map<string, string>>
  ): StandardEmissionFactor {
    const fields = record.fields
    
    // Map field names to actual Airtable table names
    const tableNameMap: Record<string, string> = {
      'GHG Unit (CO2e)': 'Unit',
      'Source UOM': 'Unit',
      'Activity Default UOM': 'Unit',
      'Normalized activity': 'Normalized Activities',
    }
    
    const getTableName = (fieldName: string): string => tableNameMap[fieldName] || fieldName
    
    // Helper to resolve names from pre-resolved map
    const resolveNames = (fieldName: string, ids: string | string[]): string[] => {
      if (!ids) return []
      const table = getTableName(fieldName)
      const idArray = Array.isArray(ids) ? ids : [ids]
      const tableMap = resolutionMap.get(table)
      if (!tableMap) return []
      return idArray.map(id => tableMap.get(id) || id).filter(Boolean)
    }

    return {
      id: record.id,
      Name: fields['Name'] || '',
      Status: fields['Status'] || undefined,
      'Emission Factors Dataset': fields['Emission Factors Dataset'] || undefined,
      'Emission Factors Dataset Name': resolveNames('Emission Factors Dataset', fields['Emission Factors Dataset']),
      'Emission Factor (CO2e)': fields['Emission Factor (CO2e)'] !== undefined && fields['Emission Factor (CO2e)'] !== null ? Number(fields['Emission Factor (CO2e)']) : undefined,
      'Type of EF': fields['Type of EF'] || undefined,
      'GHG Unit (CO2e)': fields['GHG Unit (CO2e)'] || undefined,
      'GHG Unit (CO2e) Name': resolveNames('GHG Unit (CO2e)', fields['GHG Unit (CO2e)']),
      Created: fields['Created'] || undefined,
      'Last Modified': fields['Last Modified'] || undefined,
      'Industry Classification & Emission Factors': fields['Industry Classification & Emission Factors'] || undefined,
      'Industry Classification & Emission Factors Name': resolveNames('Industry Classification & Emission Factors', fields['Industry Classification & Emission Factors']),
      Version: fields['Version'] || undefined,
      'Version Name': resolveNames('Version', fields['Version']),
      'Publication Date': fields['Publication Date'] || undefined,
      'Normalized activity': fields['Normalized activity'] || undefined,
      'Normalized activity Name': resolveNames('Normalized activity', fields['Normalized activity']),
      'Ref.IC': Array.isArray(fields['Ref.IC']) ? fields['Ref.IC'] : (fields['Ref.IC'] ? [fields['Ref.IC']] : undefined),
      'Industry Classification': fields['Industry Classification'] || undefined,
      'Industry Classification Name': resolveNames('Industry Classification', fields['Industry Classification']),
      'Source UOM': fields['Source UOM'] || undefined,
      'Source UOM Name': resolveNames('Source UOM', fields['Source UOM']),
      Scope: fields['Scope'] || undefined,
      'Scope Name': resolveNames('Scope', fields['Scope']),
      'Availability ': fields['Availability '] || undefined,
      'code (from Industry Classification  🏭)': Array.isArray(fields['code (from Industry Classification  🏭)']) 
        ? fields['code (from Industry Classification  🏭)'].join(', ') 
        : (fields['code (from Industry Classification  🏭)'] || undefined),
      'Name copy': fields['Name copy'] || undefined,
      ID: fields['ID'] !== undefined && fields['ID'] !== null ? Number(fields['ID']) : undefined,
      'Activity Default UOM': fields['Activity Default UOM'] || undefined,
      'Activity Default UOM Name': resolveNames('Activity Default UOM', fields['Activity Default UOM']),
      'EF/Detailed G': fields['EF/Detailed G'] || undefined,
      'EF/Detailed G Name': resolveNames('EF/Detailed G', fields['EF/Detailed G']),
      'Dimension (from Source UOM)': Array.isArray(fields['Dimension (from Source UOM)']) 
        ? fields['Dimension (from Source UOM)'].join(', ') 
        : (fields['Dimension (from Source UOM)'] || undefined),
      'Status (from Version)': Array.isArray(fields['Status (from Version)']) 
        ? fields['Status (from Version)'].join(', ') 
        : (fields['Status (from Version)'] || undefined),
      // Optional fields
      Description: fields['Description'] || undefined,
      Notes: fields['Notes'] || undefined,
      createdAt: this.formatDate(record._rawJson.createdTime),
      updatedAt: this.formatDate(record._rawJson.lastModifiedTime),
      createdBy: this.getCreatedBy(fields),
      lastModifiedBy: this.getLastModifiedBy(fields),
    }
  }

  /**
   * Map Airtable record to StandardEmissionFactor interface
   * Used for single record fetches (getById)
   */
  private async mapAirtableToStandardEmissionFactor(record: Airtable.Record<any>): Promise<StandardEmissionFactor> {
    const fields = record.fields
    
    // Map field names to actual Airtable table names
    // Some fields link to tables with different names than the field name
    const tableNameMap: Record<string, string> = {
      'GHG Unit (CO2e)': 'Unit', // Links to Unit table
      'Source UOM': 'Unit', // Links to Unit table
      'Activity Default UOM': 'Unit', // Links to Unit table
      'Normalized activity': 'Normalized Activities', // Links to Normalized Activities table (plural)
      // For tables that don't exist yet or have different names, we'll try the field name first
      // and let the RelationshipResolver handle the error gracefully
    }
    
    // Helper function to get the correct table name
    const getTableName = (fieldName: string): string => {
      return tableNameMap[fieldName] || fieldName
    }
    
    // Resolve all linked record names in parallel
    const [
      emissionFactorsDatasetNames,
      ghgUnitNames,
      industryClassificationNames,
      versionNames,
      normalizedActivityNames,
      industryClassification2Names,
      sourceUOMNames,
      scopeNames,
      activityDefaultUOMNames,
      efDetailedGNames,
    ] = await Promise.all([
      fields['Emission Factors Dataset']
        ? this.relationshipResolver.resolveLinkedRecords(fields['Emission Factors Dataset'], getTableName('Emission Factors Dataset'), 'Name')
        : Promise.resolve([]),
      fields['GHG Unit (CO2e)']
        ? this.relationshipResolver.resolveLinkedRecords(fields['GHG Unit (CO2e)'], getTableName('GHG Unit (CO2e)'), 'Name')
        : Promise.resolve([]),
      fields['Industry Classification & Emission Factors']
        ? this.relationshipResolver.resolveLinkedRecords(fields['Industry Classification & Emission Factors'], getTableName('Industry Classification & Emission Factors'), 'Name')
        : Promise.resolve([]),
      fields['Version']
        ? this.relationshipResolver.resolveLinkedRecords(fields['Version'], getTableName('Version'), 'Name')
        : Promise.resolve([]),
      fields['Normalized activity']
        ? this.relationshipResolver.resolveLinkedRecords(fields['Normalized activity'], getTableName('Normalized activity'), 'Name')
        : Promise.resolve([]),
      fields['Industry Classification']
        ? this.relationshipResolver.resolveLinkedRecords(fields['Industry Classification'], getTableName('Industry Classification'), 'Name')
        : Promise.resolve([]),
      fields['Source UOM']
        ? this.relationshipResolver.resolveLinkedRecords(fields['Source UOM'], getTableName('Source UOM'), 'Name')
        : Promise.resolve([]),
      fields['Scope']
        ? this.relationshipResolver.resolveLinkedRecords(fields['Scope'], getTableName('Scope'), 'Name')
        : Promise.resolve([]),
      fields['Activity Default UOM']
        ? this.relationshipResolver.resolveLinkedRecords(fields['Activity Default UOM'], getTableName('Activity Default UOM'), 'Name')
        : Promise.resolve([]),
      fields['EF/Detailed G']
        ? this.relationshipResolver.resolveLinkedRecords(fields['EF/Detailed G'], getTableName('EF/Detailed G'), 'Name')
        : Promise.resolve([]),
    ])

    return {
      id: record.id,
      Name: fields['Name'] || '',
      Status: fields['Status'] || undefined,
      'Emission Factors Dataset': fields['Emission Factors Dataset'] || undefined,
      'Emission Factors Dataset Name': emissionFactorsDatasetNames.map(r => r.name),
      'Emission Factor (CO2e)': fields['Emission Factor (CO2e)'] !== undefined && fields['Emission Factor (CO2e)'] !== null ? Number(fields['Emission Factor (CO2e)']) : undefined,
      'Type of EF': fields['Type of EF'] || undefined,
      'GHG Unit (CO2e)': fields['GHG Unit (CO2e)'] || undefined,
      'GHG Unit (CO2e) Name': ghgUnitNames.map(r => r.name),
      Created: fields['Created'] || undefined,
      'Last Modified': fields['Last Modified'] || undefined,
      'Industry Classification & Emission Factors': fields['Industry Classification & Emission Factors'] || undefined,
      'Industry Classification & Emission Factors Name': industryClassificationNames.map(r => r.name),
      Version: fields['Version'] || undefined,
      'Version Name': versionNames.map(r => r.name),
      'Publication Date': fields['Publication Date'] || undefined,
      'Normalized activity': fields['Normalized activity'] || undefined,
      'Normalized activity Name': normalizedActivityNames.map(r => r.name),
      'Ref.IC': Array.isArray(fields['Ref.IC']) ? fields['Ref.IC'] : (fields['Ref.IC'] ? [fields['Ref.IC']] : undefined),
      'Industry Classification': fields['Industry Classification'] || undefined,
      'Industry Classification Name': industryClassification2Names.map(r => r.name),
      'Source UOM': fields['Source UOM'] || undefined,
      'Source UOM Name': sourceUOMNames.map(r => r.name),
      Scope: fields['Scope'] || undefined,
      'Scope Name': scopeNames.map(r => r.name),
      'Availability ': fields['Availability '] || undefined,
      'code (from Industry Classification  🏭)': Array.isArray(fields['code (from Industry Classification  🏭)']) 
        ? fields['code (from Industry Classification  🏭)'].join(', ') 
        : (fields['code (from Industry Classification  🏭)'] || undefined),
      'Name copy': fields['Name copy'] || undefined,
      ID: fields['ID'] !== undefined && fields['ID'] !== null ? Number(fields['ID']) : undefined,
      'Activity Default UOM': fields['Activity Default UOM'] || undefined,
      'Activity Default UOM Name': activityDefaultUOMNames.map(r => r.name),
      'EF/Detailed G': fields['EF/Detailed G'] || undefined,
      'EF/Detailed G Name': efDetailedGNames.map(r => r.name),
      'Dimension (from Source UOM)': Array.isArray(fields['Dimension (from Source UOM)']) 
        ? fields['Dimension (from Source UOM)'].join(', ') 
        : (fields['Dimension (from Source UOM)'] || undefined),
      'Status (from Version)': Array.isArray(fields['Status (from Version)']) 
        ? fields['Status (from Version)'].join(', ') 
        : (fields['Status (from Version)'] || undefined),
      // Optional fields that may not exist in all bases
      Description: fields['Description'] || undefined,
      Notes: fields['Notes'] || undefined,
      createdAt: this.formatDate(record._rawJson.createdTime),
      updatedAt: this.formatDate(record._rawJson.lastModifiedTime),
      createdBy: this.getCreatedBy(fields),
      lastModifiedBy: this.getLastModifiedBy(fields),
    }
  }

  /**
   * Map StandardEmissionFactor DTO to Airtable fields
   */
  private mapStandardEmissionFactorToAirtable(dto: CreateStandardEmissionFactorDto | UpdateStandardEmissionFactorDto): Record<string, any> {
    const fields: Record<string, any> = {}
    
    if (dto.Name !== undefined && dto.Name !== null && String(dto.Name).trim() !== '') {
      fields['Name'] = String(dto.Name).trim()
    }
    if (dto.Status !== undefined && dto.Status !== null) {
      fields['Status'] = String(dto.Status).trim()
    }
    if (dto['Emission Factors Dataset'] !== undefined) {
      fields['Emission Factors Dataset'] = Array.isArray(dto['Emission Factors Dataset']) 
        ? dto['Emission Factors Dataset'] 
        : [dto['Emission Factors Dataset']]
    }
    if (dto['Emission Factor (CO2e)'] !== undefined && dto['Emission Factor (CO2e)'] !== null) {
      fields['Emission Factor (CO2e)'] = Number(dto['Emission Factor (CO2e)'])
    }
    if (dto['Type of EF'] !== undefined && dto['Type of EF'] !== null && String(dto['Type of EF']).trim() !== '') {
      fields['Type of EF'] = String(dto['Type of EF']).trim()
    }
    if (dto['GHG Unit (CO2e)'] !== undefined) {
      fields['GHG Unit (CO2e)'] = Array.isArray(dto['GHG Unit (CO2e)']) 
        ? dto['GHG Unit (CO2e)'] 
        : [dto['GHG Unit (CO2e)']]
    }
    if (dto['Industry Classification & Emission Factors'] !== undefined) {
      fields['Industry Classification & Emission Factors'] = Array.isArray(dto['Industry Classification & Emission Factors']) 
        ? dto['Industry Classification & Emission Factors'] 
        : [dto['Industry Classification & Emission Factors']]
    }
    if (dto.Version !== undefined) {
      fields['Version'] = Array.isArray(dto.Version) 
        ? dto.Version 
        : [dto.Version]
    }
    if (dto['Publication Date'] !== undefined && dto['Publication Date'] !== null && String(dto['Publication Date']).trim() !== '') {
      fields['Publication Date'] = String(dto['Publication Date']).trim()
    }
    if (dto['Normalized activity'] !== undefined) {
      fields['Normalized activity'] = Array.isArray(dto['Normalized activity']) 
        ? dto['Normalized activity'] 
        : [dto['Normalized activity']]
    }
    if (dto['Ref.IC'] !== undefined) {
      fields['Ref.IC'] = Array.isArray(dto['Ref.IC']) 
        ? dto['Ref.IC'] 
        : [dto['Ref.IC']]
    }
    if (dto['Industry Classification'] !== undefined) {
      fields['Industry Classification'] = Array.isArray(dto['Industry Classification']) 
        ? dto['Industry Classification'] 
        : [dto['Industry Classification']]
    }
    if (dto['Source UOM'] !== undefined) {
      fields['Source UOM'] = Array.isArray(dto['Source UOM']) 
        ? dto['Source UOM'] 
        : [dto['Source UOM']]
    }
    if (dto.Scope !== undefined) {
      fields['Scope'] = Array.isArray(dto.Scope) 
        ? dto.Scope 
        : [dto.Scope]
    }
    if (dto['Availability '] !== undefined && dto['Availability '] !== null && String(dto['Availability ']).trim() !== '') {
      fields['Availability '] = String(dto['Availability ']).trim()
    }
    if (dto['Name copy'] !== undefined && dto['Name copy'] !== null && String(dto['Name copy']).trim() !== '') {
      fields['Name copy'] = String(dto['Name copy']).trim()
    }
    if (dto.ID !== undefined && dto.ID !== null) {
      fields['ID'] = Number(dto.ID)
    }
    if (dto['Activity Default UOM'] !== undefined) {
      fields['Activity Default UOM'] = Array.isArray(dto['Activity Default UOM']) 
        ? dto['Activity Default UOM'] 
        : [dto['Activity Default UOM']]
    }
    if (dto['EF/Detailed G'] !== undefined) {
      fields['EF/Detailed G'] = Array.isArray(dto['EF/Detailed G']) 
        ? dto['EF/Detailed G'] 
        : [dto['EF/Detailed G']]
    }
    // Lookup fields are read-only, so we don't write them
    // Optional fields that may not exist in all bases
    if (dto.Description !== undefined && dto.Description !== null && String(dto.Description).trim() !== '') {
      fields['Description'] = String(dto.Description).trim()
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

