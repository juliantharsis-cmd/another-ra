import Airtable from 'airtable'

/**
 * Field Mapping Service
 * 
 * Fetches Airtable Field IDs from the Metadata API and creates mappings
 * between field IDs (immutable) and field keys (used in the app).
 */

export interface FieldIdMapping {
  fieldId: string
  fieldKey: string
  fieldName: string
  fieldType?: string
}

export interface TableFieldMapping {
  tableId: string
  tableName: string
  baseId?: string
  airtableTableId?: string
  fieldKeyToId: Record<string, string>
  fieldIdToKey: Record<string, string>
  fields: FieldIdMapping[]
  lastUpdated: string
}

export interface CreateFieldMappingDto {
  baseId?: string
  airtableTableId?: string
  fields: Array<{
    fieldId: string
    fieldKey: string
    fieldName: string
    fieldType?: string
  }>
}

export class FieldMappingService {
  private apiKey: string
  private baseId: string

  constructor() {
    this.apiKey = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || ''
    this.baseId = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || ''
    
    if (!this.apiKey) {
      console.warn('⚠️ [FieldMappingService] AIRTABLE_PERSONAL_ACCESS_TOKEN not set')
    }
    if (!this.baseId) {
      console.warn('⚠️ [FieldMappingService] AIRTABLE_SYSTEM_CONFIG_BASE_ID not set')
    }
  }

  /**
   * Get field mapping for a table
   * If not found, attempts to fetch from Airtable Metadata API
   */
  async getFieldMapping(tableId: string): Promise<TableFieldMapping | null> {
    console.log(`🔍 [FieldMappingService] Getting field mapping for table: ${tableId}`)
    
    // Get table info from our table mapping
    const tableInfo = this.getTableInfo(tableId)
    if (!tableInfo) {
      console.warn(`⚠️ [FieldMappingService] No Airtable mapping found for table: ${tableId}`)
      console.warn(`   Available environment variables:`)
      console.warn(`   - AIRTABLE_USER_TABLE_TABLE_ID: ${process.env.AIRTABLE_USER_TABLE_TABLE_ID || 'NOT SET'}`)
      console.warn(`   - AIRTABLE_USER_TABLE_TABLE_NAME: ${process.env.AIRTABLE_USER_TABLE_TABLE_NAME || 'NOT SET'}`)
      console.warn(`   - AIRTABLE_COMPANY_TABLE_ID: ${process.env.AIRTABLE_COMPANY_TABLE_ID || 'NOT SET'}`)
      console.warn(`   - AIRTABLE_USER_ROLES_TABLE_ID: ${process.env.AIRTABLE_USER_ROLES_TABLE_ID || 'NOT SET'}`)
      console.warn(`   - AIRTABLE_USER_ROLES_TABLE_NAME: ${process.env.AIRTABLE_USER_ROLES_TABLE_NAME || 'NOT SET'}`)
      console.warn(`   - AIRTABLE_INDUSTRY_CLASSIFICATION_TABLE_ID: ${process.env.AIRTABLE_INDUSTRY_CLASSIFICATION_TABLE_ID || 'NOT SET'}`)
      console.warn(`   - AIRTABLE_INDUSTRY_CLASSIFICATION_TABLE_NAME: ${process.env.AIRTABLE_INDUSTRY_CLASSIFICATION_TABLE_NAME || 'NOT SET'}`)
      return null
    }
    
    console.log(`✅ [FieldMappingService] Found table info: ${tableInfo.airtableTableName} (${tableInfo.airtableTableId})`)

    try {
      // Fetch schema from Airtable Metadata API
      console.log(`📥 [FieldMappingService] Fetching schema from Airtable Metadata API...`)
      const airtableSchema = await this.fetchAirtableSchema(tableInfo.airtableTableId)
      if (!airtableSchema) {
        console.warn(`⚠️ [FieldMappingService] Failed to fetch schema from Airtable`)
        return null
      }
      
      console.log(`✅ [FieldMappingService] Fetched ${airtableSchema.fields.length} fields from Airtable`)

      // Create field mappings
      const fields: FieldIdMapping[] = airtableSchema.fields.map((field: any) => {
        // Map Airtable field name to our field key
        // This mapping should come from the table configuration
        const fieldKey = this.mapAirtableFieldNameToKey(field.name, tableId)
        
        return {
          fieldId: field.id,
          fieldKey: fieldKey || field.name, // Fallback to field name if no mapping
          fieldName: field.name,
          fieldType: field.type,
        }
      })

      // Build bidirectional maps
      const fieldKeyToId: Record<string, string> = {}
      const fieldIdToKey: Record<string, string> = {}

      fields.forEach(field => {
        fieldKeyToId[field.fieldKey] = field.fieldId
        fieldIdToKey[field.fieldId] = field.fieldKey
      })

      const mapping = {
        tableId,
        tableName: airtableSchema.tableName,
        baseId: this.baseId,
        airtableTableId: airtableSchema.tableId, // Use the actual table ID from API
        fieldKeyToId,
        fieldIdToKey,
        fields,
        lastUpdated: new Date().toISOString(),
      }
      
      console.log(`✅ [FieldMappingService] Created mapping with ${fields.length} fields`)
      console.log(`   Example mappings: Email -> ${fieldKeyToId['Email'] || 'NOT FOUND'}`)
      
      return mapping
    } catch (error: any) {
      console.error(`❌ [FieldMappingService] Error fetching field mapping for ${tableId}:`, error)
      console.error(`   Error message: ${error.message}`)
      console.error(`   Stack: ${error.stack}`)
      return null
    }
  }

  /**
   * Create or update field mapping
   */
  async createOrUpdateFieldMapping(
    tableId: string,
    dto: CreateFieldMappingDto
  ): Promise<TableFieldMapping> {
    const fieldKeyToId: Record<string, string> = {}
    const fieldIdToKey: Record<string, string> = {}

    dto.fields.forEach(field => {
      fieldKeyToId[field.fieldKey] = field.fieldId
      fieldIdToKey[field.fieldId] = field.fieldKey
    })

    return {
      tableId,
      tableName: '', // Will be filled from Airtable if available
      baseId: dto.baseId,
      airtableTableId: dto.airtableTableId,
      fieldKeyToId,
      fieldIdToKey,
      fields: dto.fields,
      lastUpdated: new Date().toISOString(),
    }
  }

  /**
   * Fetch schema from Airtable Metadata API
   * Handles both table IDs (starting with 'tbl') and table names
   */
  private async fetchAirtableSchema(airtableTableIdOrName: string): Promise<{ fields: any[]; tableName: string; tableId: string } | null> {
    try {
      // First, fetch all tables to find the table by ID or name
      const tablesResponse = await fetch(`https://api.airtable.com/v0/meta/bases/${this.baseId}/tables`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!tablesResponse.ok) {
        if (tablesResponse.status === 401 || tablesResponse.status === 403) {
          console.warn('Airtable Metadata API access denied. Field ID mapping requires "schema.bases:read" scope.')
          return null
        }
        throw new Error(`Failed to fetch Airtable tables: ${tablesResponse.statusText}`)
      }

      const tablesData = await tablesResponse.json()
      const tables = tablesData.tables || []

      // Find table by ID or name
      let table = tables.find((t: any) => 
        t.id === airtableTableIdOrName || 
        t.name.toLowerCase() === airtableTableIdOrName.toLowerCase()
      )

      if (!table) {
        console.warn(`Airtable table not found: ${airtableTableIdOrName}`)
        return null
      }

      return {
        fields: table.fields || [],
        tableName: table.name || '',
        tableId: table.id,
      }
    } catch (error: any) {
      if (error.message?.includes('401') || error.message?.includes('403')) {
        console.warn('Airtable Metadata API access denied.')
        return null
      }
      throw error
    }
  }

  /**
   * Get table info from our table mapping
   * This should match the logic in other services
   */
  private getTableInfo(tableId: string): { airtableTableId: string; airtableTableName: string } | null {
    // Map of table IDs to Airtable table info
    // Uses same environment variable pattern as other services
    const tableMapping: Record<string, { tableId: string | undefined; tableName: string | undefined }> = {
      'users': {
        tableId: process.env.AIRTABLE_USER_TABLE_TABLE_ID,
        tableName: process.env.AIRTABLE_USER_TABLE_TABLE_NAME || 'user table',
      },
      'user-table': {
        tableId: process.env.AIRTABLE_USER_TABLE_TABLE_ID,
        tableName: process.env.AIRTABLE_USER_TABLE_TABLE_NAME || 'user table',
      },
      'companies': {
        tableId: process.env.AIRTABLE_COMPANY_TABLE_ID,
        tableName: process.env.AIRTABLE_COMPANY_TABLE_NAME || 'Companies',
      },
      'user roles': {
        tableId: process.env.AIRTABLE_USER_ROLES_TABLE_ID,
        tableName: process.env.AIRTABLE_USER_ROLES_TABLE_NAME || 'User Roles',
      },
      'user-roles': {
        tableId: process.env.AIRTABLE_USER_ROLES_TABLE_ID,
        tableName: process.env.AIRTABLE_USER_ROLES_TABLE_NAME || 'User Roles',
      },
      'industry classifications': {
        tableId: process.env.AIRTABLE_INDUSTRY_CLASSIFICATION_TABLE_ID,
        tableName: process.env.AIRTABLE_INDUSTRY_CLASSIFICATION_TABLE_NAME || 'Industry Classification & Emission Factors',
      },
      'industry-classification': {
        tableId: process.env.AIRTABLE_INDUSTRY_CLASSIFICATION_TABLE_ID,
        tableName: process.env.AIRTABLE_INDUSTRY_CLASSIFICATION_TABLE_NAME || 'Industry Classification & Emission Factors',
      },
      // Add more table mappings as needed
    }

    const mapping = tableMapping[tableId.toLowerCase()]
    if (mapping) {
      // Use table ID if available, otherwise use table name
      const airtableTableId = mapping.tableId || mapping.tableName
      if (airtableTableId) {
        return {
          airtableTableId,
          airtableTableName: mapping.tableName || airtableTableId,
        }
      }
    }

    return null
  }

  /**
   * Map Airtable field name to our internal field key
   * This should match the field names in your table configurations
   */
  private mapAirtableFieldNameToKey(airtableFieldName: string, tableId: string): string | null {
    // For now, return the field name as-is
    // In the future, this could use a configuration file or database
    // to map Airtable field names to our internal field keys
    
    // Example mappings for user table
    if (tableId === 'users' || tableId === 'user-table') {
      const mapping: Record<string, string> = {
        'User Name': 'User Name',
        'Email': 'Email',
        'First Name': 'First Name',
        'Last Name': 'Last Name',
        'Status': 'Status',
        'Company': 'Company',
        'User Roles': 'User Roles',
        'Modules': 'Modules',
        'Profile Name': 'Profile Name',
        'Attachments': 'Attachment',
        // Add more mappings as needed
      }
      return mapping[airtableFieldName] || airtableFieldName
    }

    // Mappings for User Roles table
    if (tableId === 'user roles' || tableId === 'user-roles') {
      const mapping: Record<string, string> = {
        'Name': 'Name',
        'Description': 'Description',
        // Add more mappings as needed
      }
      return mapping[airtableFieldName] || airtableFieldName
    }

    // Mappings for Industry Classification table
    if (tableId === 'industry classifications' || tableId === 'industry-classification') {
      const mapping: Record<string, string> = {
        'Name': 'Name',
        'Description': 'Description',
        'Status': 'Status',
        'Attachment': 'Attachment',
        'Attachments': 'Attachment', // Handle plural form
        // Add more mappings as needed
      }
      return mapping[airtableFieldName] || airtableFieldName
    }

    // Default: use Airtable field name as key
    return airtableFieldName
  }
}

