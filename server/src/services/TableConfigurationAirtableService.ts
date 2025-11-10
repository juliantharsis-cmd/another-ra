import Airtable from 'airtable'
import { TableSchema, TableField, UpdateTableSchemaDto } from '../types/TableSchema'

/**
 * Table Configuration Airtable Service
 * 
 * Handles all Airtable API interactions for Table Configuration storage.
 * Uses a "Table Configuration" table that acts as a configuration layer
 * on top of existing tables without modifying the original Airtable schema.
 */
export class TableConfigurationAirtableService {
  private base: Airtable.Base
  private configTableName: string
  private apiKey: string
  private baseId: string

  // Mapping of tableId to Airtable table info
  private tableMapping: Map<string, { tableId: string; tableName: string }> = new Map()

  constructor() {
    this.apiKey = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || 
                   process.env.AIRTABLE_API_KEY
    
    if (!this.apiKey) {
      throw new Error('Airtable API token is required. Set AIRTABLE_PERSONAL_ACCESS_TOKEN in .env file')
    }
    
    this.baseId = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 
                   'appGtLbKhmNkkTLVL'
    
    // Use "Table Configuration" table for configuration layer
    this.configTableName = process.env.AIRTABLE_CONFIG_TABLE_NAME || 
                          'Table Configuration'
    
    Airtable.configure({ apiKey: this.apiKey })
    this.base = Airtable.base(this.baseId)
    
    // Log configuration for debugging
    console.log('TableConfigurationAirtableService initialized:')
    console.log(`  Base ID: ${this.baseId}`)
    console.log(`  Config Table Name: ${this.configTableName}`)
    console.log(`  API Key: ${this.apiKey ? 'Set' : 'Missing'}`)

    // Initialize table mapping
    this.initializeTableMapping()
  }

  /**
   * Initialize table mapping from environment variables
   */
  private initializeTableMapping(): void {
    // Companies table
    if (process.env.AIRTABLE_COMPANY_TABLE_ID) {
      this.tableMapping.set('companies', {
        tableId: process.env.AIRTABLE_COMPANY_TABLE_ID,
        tableName: process.env.AIRTABLE_COMPANY_TABLE_NAME || 'Companies',
      })
    }
    // Geography table
    if (process.env.AIRTABLE_GEOGRAPHY_TABLE_ID) {
      this.tableMapping.set('geography', {
        tableId: process.env.AIRTABLE_GEOGRAPHY_TABLE_ID,
        tableName: process.env.AIRTABLE_GEOGRAPHY_TABLE_NAME || 'Geography',
      })
    }
    // EF GWP table
    if (process.env.AIRTABLE_EMISSION_FACTOR_TABLE_ID) {
      this.tableMapping.set('emission-factors', {
        tableId: process.env.AIRTABLE_EMISSION_FACTOR_TABLE_ID,
        tableName: process.env.AIRTABLE_EMISSION_FACTOR_TABLE_NAME || 'EF GWP',
      })
    }
  }

  /**
   * Get Airtable table info for a given tableId
   */
  private getAirtableTableInfo(tableId: string): { tableId: string; tableName: string } | null {
    return this.tableMapping.get(tableId) || null
  }

  /**
   * Fetch original schema from Airtable Metadata API (optional)
   * Returns null if not authorized or not available
   */
  async fetchAirtableSchema(airtableTableId: string): Promise<{ fields: any[]; tableName: string } | null> {
    try {
      const response = await fetch(`https://api.airtable.com/v0/meta/bases/${this.baseId}/tables/${airtableTableId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData: any = {}
        try {
          errorData = JSON.parse(errorText)
        } catch {
          // Not JSON, use text
        }

        if (response.status === 401 || response.status === 403) {
          console.warn(`Airtable Metadata API access denied. Schema sync requires 'schema.bases:read' scope.`)
          return null
        }

        if (response.status === 404 || errorData.error === 'NOT_FOUND') {
          console.warn(`Airtable table not found in Metadata API: ${airtableTableId}. This is normal if the table ID is not set or Metadata API is not available.`)
          return null
        }

        throw new Error(`Failed to fetch Airtable schema: ${errorData.error || errorText}`)
      }

      const data = await response.json()
      return {
        fields: data.fields || [],
        tableName: data.name || '',
      }
    } catch (error: any) {
      if (error.message?.includes('401') || error.message?.includes('403') || error.message?.includes('NOT_AUTHORIZED')) {
        console.warn('Airtable Metadata API access denied. Configuration will work without original schema.')
        return null
      }
      throw error
    }
  }

  /**
   * Map internal FieldType to Airtable display format
   */
  private mapInternalFieldTypeToAirtable(internalType: string): string {
    const mapping: Record<string, string> = {
      'singleLineText': 'Single line text',
      'longText': 'Long text',
      'attachment': 'Attachment',
      'checkbox': 'Checkbox',
      'multipleSelects': 'Multiple select',
      'singleSelect': 'Single select',
      'user': 'User',
      'date': 'Date',
      'phoneNumber': 'Phone number',
      'email': 'Email',
      'url': 'URL',
      'number': 'Number',
      'currency': 'Currency',
      'percent': 'Percent',
      'duration': 'Duration',
      'rating': 'Rating',
      'formula': 'Formula',
      'multipleRecordLinks': 'Multiple record links',
      'singleRecordLink': 'Single record link',
      'createdTime': 'Created time',
      'lastModifiedTime': 'Last modified time',
      'createdBy': 'Created by',
      'lastModifiedBy': 'Last modified by',
    }
    return mapping[internalType] || 'Single line text'
  }

  /**
   * Map Airtable display format back to internal FieldType
   */
  private mapAirtableDisplayToInternal(displayType: string): string {
    const mapping: Record<string, string> = {
      'Single line text': 'singleLineText',
      'Long text': 'longText',
      'Attachment': 'attachment',
      'Checkbox': 'checkbox',
      'Multiple select': 'multipleSelects',
      'Single select': 'singleSelect',
      'User': 'user',
      'Date': 'date',
      'Phone number': 'phoneNumber',
      'Email': 'email',
      'URL': 'url',
      'Number': 'number',
      'Currency': 'currency',
      'Percent': 'percent',
      'Duration': 'duration',
      'Rating': 'rating',
      'Formula': 'formula',
      'Multiple record links': 'multipleRecordLinks',
      'Single record link': 'singleRecordLink',
      'Created time': 'createdTime',
      'Last modified time': 'lastModifiedTime',
      'Created by': 'createdBy',
      'Last modified by': 'lastModifiedBy',
    }
    return mapping[displayType] || 'singleLineText'
  }

  /**
   * Map Airtable Metadata API field type to internal FieldType
   */
  private mapAirtableFieldType(airtableType: string): string {
    const mapping: Record<string, string> = {
      'singleLineText': 'singleLineText',
      'multilineText': 'longText',
      'email': 'email',
      'url': 'url',
      'phoneNumber': 'phoneNumber',
      'number': 'number',
      'currency': 'currency',
      'percent': 'percent',
      'date': 'date',
      'dateTime': 'date',
      'checkbox': 'checkbox',
      'singleSelect': 'singleSelect',
      'multipleSelects': 'multipleSelects',
      'multipleRecordLinks': 'multipleRecordLinks',
      'singleRecordLink': 'singleRecordLink',
      'formula': 'formula',
      'createdTime': 'createdTime',
      'lastModifiedTime': 'lastModifiedTime',
      'createdBy': 'createdBy',
      'lastModifiedBy': 'lastModifiedBy',
      'attachment': 'attachment',
      'rating': 'rating',
      'duration': 'duration',
    }

    return mapping[airtableType] || 'singleLineText'
  }

  /**
   * Get table configuration by table name
   * Fetches configuration from "Table Configuration" table
   */
  async getConfiguration(tableName: string): Promise<TableSchema | null> {
    try {
      // Decode URL-encoded table name if needed
      const decodedTableName = decodeURIComponent(tableName)
      
      // First, try to find the tableId from the mapping
      let tableId: string | null = null
      let airtableInfo: { tableId: string; tableName: string } | null = null
      
      for (const [id, info] of this.tableMapping.entries()) {
        if (info.tableName === decodedTableName || id === decodedTableName) {
          tableId = id
          airtableInfo = info
          break
        }
      }

      if (!tableId) {
        // Try using tableName as tableId
        tableId = decodedTableName
        airtableInfo = this.getAirtableTableInfo(decodedTableName)
      }

      // Fetch configuration records from "Table Configuration" table
      console.log(`Fetching configuration from table: "${this.configTableName}" in base: ${this.baseId}`)
      console.log(`Looking for records where Table Name = "${decodedTableName}"`)
      const records = await this.base(this.configTableName)
        .select({
          filterByFormula: `{Table Name} = '${decodedTableName.replace(/'/g, "\\'")}'`,
        })
        .all()
      console.log(`Found ${records.length} configuration record(s)`)

      if (records.length === 0) {
        // No configuration exists - try to create from Airtable schema if available
        if (airtableInfo && airtableInfo.tableId) {
          // Only try to fetch schema if we have a valid table ID (starts with 'tbl')
          if (airtableInfo.tableId.startsWith('tbl')) {
            try {
              const airtableSchema = await this.fetchAirtableSchema(airtableInfo.tableId)
              if (airtableSchema) {
                // Create initial configuration from Airtable schema
                return await this.createConfigurationFromAirtableSchema(
                  tableId,
                  decodedTableName,
                  airtableSchema,
                  airtableInfo
                )
              }
            } catch (schemaError: any) {
              // If schema fetch fails (e.g., Metadata API not available or table not found),
              // just log a warning and return null - configuration can be created manually
              console.warn(`Could not fetch Airtable schema for table "${decodedTableName}": ${schemaError.message}`)
              console.warn('Configuration will need to be created manually in the "Table Configuration" table.')
            }
          } else {
            console.warn(`Invalid table ID for "${decodedTableName}": ${airtableInfo.tableId}. Expected table ID starting with "tbl".`)
          }
        }
        return null
      }

      // Map configuration records to TableSchema
      const fields: TableField[] = []
      for (const record of records) {
        const fieldsData = record.fields as any
        
        // Only include active fields
        if (fieldsData['Is Active'] === true || fieldsData['Is Active'] === undefined) {
          // Format Preferences removed - no longer reading from Airtable
          // const formatPrefs = fieldsData['Format Preferences'] 
          //   ? JSON.parse(fieldsData['Format Preferences'] as string)
          //   : {}

          // Parse default value if present
          let defaultValue: string | number | boolean | undefined = undefined
          if (fieldsData['Default Value'] !== undefined) {
            const defaultVal = fieldsData['Default Value']
            // Try to parse as number or boolean
            if (typeof defaultVal === 'string') {
              if (defaultVal === 'true') defaultValue = true
              else if (defaultVal === 'false') defaultValue = false
              else if (!isNaN(Number(defaultVal)) && defaultVal.trim() !== '') {
                defaultValue = Number(defaultVal)
              } else {
                defaultValue = defaultVal
              }
            } else {
              defaultValue = defaultVal
            }
          }

          // Convert Airtable display format to internal format
          const displayType = fieldsData['Field Type'] || 'Single line text'
          const internalType = this.mapAirtableDisplayToInternal(displayType)

          fields.push({
            id: record.id,
            name: fieldsData['Field Name (Custom)'] || fieldsData['Field Name (Original)'] || '',
            type: internalType as any,
            format: {}, // Format Preferences removed - always use empty object
            required: false,
            unique: false,
            description: fieldsData['Description'] || undefined,
            defaultValue,
            order: fields.length,
            airtableFieldName: fieldsData['Field Name (Original)'] || '',
            syncedWithAirtable: !!fieldsData['Field Name (Original)'],
          })
        }
      }

      // Sort by order
      fields.sort((a, b) => a.order - b.order)

      return {
        tableId: tableId || decodedTableName,
        tableName: decodedTableName,
        fields,
        airtableBaseId: airtableInfo?.tableId ? this.baseId : undefined,
        airtableTableId: airtableInfo?.tableId,
        airtableTableName: airtableInfo?.tableName,
        lastSyncedAt: new Date().toISOString(),
      }
    } catch (error: any) {
      if (error.statusCode === 404 || error.error === 'NOT_FOUND') {
        return null
      }
      throw new Error(`Failed to fetch configuration: ${error.error || error.message || 'Unknown error'}`)
    }
  }

  /**
   * Create initial configuration from Airtable schema
   */
  private async createConfigurationFromAirtableSchema(
    tableId: string,
    tableName: string,
    airtableSchema: { fields: any[]; tableName: string },
    airtableInfo: { tableId: string; tableName: string }
  ): Promise<TableSchema> {
    const configurationRecords: any[] = []

    for (let index = 0; index < airtableSchema.fields.length; index++) {
      const field = airtableSchema.fields[index]
      // Convert Airtable Metadata API type -> internal type -> Airtable display format
      const internalType = this.mapAirtableFieldType(field.type)
      const displayType = this.mapInternalFieldTypeToAirtable(internalType)

      configurationRecords.push({
        'Table Name': tableName,
        'Field Name (Original)': field.name,
        'Field Name (Custom)': field.name, // Start with original name
        'Field Type': displayType, // Use display format for Airtable single select
        'Is Active': true,
        'Description': ' ',
        'Default Value': '',
      })
    }

    // Create all configuration records
    // Format: Airtable library expects fields to be wrapped in a 'fields' object
    if (configurationRecords.length > 0) {
      const formattedRecords = configurationRecords.map(record => ({
        fields: record
      }))
      await this.base(this.configTableName).create(formattedRecords)
    }

    // Return the created schema
    return await this.getConfiguration(tableName) as TableSchema
  }

  /**
   * Save table configuration
   * Updates or creates records in "Table Configuration" table
   */
  async saveConfiguration(tableName: string, schema: UpdateTableSchemaDto): Promise<TableSchema> {
    try {
      // Decode URL-encoded table name if needed
      const decodedTableName = decodeURIComponent(tableName)
      
      // Get existing configuration records
      console.log(`Saving configuration to table: "${this.configTableName}" in base: ${this.baseId}`)
      console.log(`Table Name in record: "${decodedTableName}"`)
      const existingRecords = await this.base(this.configTableName)
        .select({
          filterByFormula: `{Table Name} = '${decodedTableName.replace(/'/g, "\\'")}'`,
        })
        .all()
      console.log(`Found ${existingRecords.length} existing record(s) for this table`)

      // Create a map to find existing records
      // Key: "Field Name (Original)" (the preserved original name)
      // Also create a map by record ID for direct lookup
      const existingMap = new Map<string, any>()
      const existingByIdMap = new Map<string, any>()
      
      existingRecords.forEach(record => {
        const fieldsData = record.fields as any
        const originalName = fieldsData['Field Name (Original)'] || ''
        if (originalName) {
          existingMap.set(originalName, record)
        }
        // Also index by record ID for direct lookup
        existingByIdMap.set(record.id, record)
      })
      
      console.log(`📋 Existing records map:`, {
        byOriginalName: Array.from(existingMap.keys()),
        byId: Array.from(existingByIdMap.keys())
      })

      // Process each field in the schema
      const recordsToCreate: any[] = []
      const recordsToUpdate: Array<{ id: string; fields: any }> = []

      if (schema.fields) {
        for (let index = 0; index < schema.fields.length; index++) {
          const field = schema.fields[index]
          // CRITICAL: Use airtableFieldName as the original name - this should NEVER change
          const originalName = (field as any).airtableFieldName
          // The custom name is what the user wants to display
          const customName = field.name

          // Find existing record
          // Priority 1: Match by field ID (record ID) - most reliable
          let existing: any = null
          if (field.id) {
            existing = existingByIdMap.get(field.id)
            if (existing) {
              console.log(`✅ Found existing record by ID: ${field.id}`)
            }
          }
          
          // Priority 2: Match by original name (airtableFieldName)
          if (!existing && originalName) {
            existing = existingMap.get(originalName)
            if (existing) {
              console.log(`✅ Found existing record by original name: "${originalName}"`)
            }
          }
          
          // Priority 3: Try to find by custom name (fallback - less reliable)
          if (!existing && customName) {
            // Search through all records to find one with matching custom name
            // But only if we can verify the original name matches
            existing = existingRecords.find(r => {
              const rFields = r.fields as any
              return rFields['Field Name (Custom)'] === customName
            })
            if (existing) {
              console.log(`⚠️ Found existing record by custom name (fallback): "${customName}"`)
            }
          }

          if (existing) {
            // UPDATE EXISTING RECORD
            // CRITICAL: NEVER change "Field Name (Original)" - always preserve it from the existing record
            const existingFields = (existing.fields as any)
            const preservedOriginalName = existingFields['Field Name (Original)'] || originalName || customName
            
            console.log(`🔄 Updating existing field record:`, {
              recordId: existing.id,
              preservedOriginal: preservedOriginalName,
              newCustom: customName,
              fieldId: field.id
            })
            
            // Build update fields - preserve original name, only update custom name
            const updateFields: any = {
              'Field Name (Original)': preservedOriginalName, // NEVER CHANGE THIS
              'Field Name (Custom)': customName || preservedOriginalName, // Update custom name
              'Field Type': this.mapInternalFieldTypeToAirtable(field.type || 'singleLineText'),
              'Is Active': true,
            }
            
            // Preserve existing Description and Default Value if not provided
            if (field.description && field.description.trim()) {
              updateFields['Description'] = field.description.trim()
            } else if (existingFields['Description']) {
              updateFields['Description'] = existingFields['Description']
            } else {
              updateFields['Description'] = ' ' // Single space for multilineText
            }
            
            if ((field as any).defaultValue !== undefined && (field as any).defaultValue !== null) {
              updateFields['Default Value'] = String((field as any).defaultValue)
            } else if (existingFields['Default Value']) {
              updateFields['Default Value'] = existingFields['Default Value']
            } else {
              updateFields['Default Value'] = ''
            }
            
            recordsToUpdate.push({
              id: existing.id,
              fields: updateFields,
            })
            existingMap.delete(preservedOriginalName) // Mark as processed
          } else {
            // CREATE NEW RECORD
            // For new records, use the original name from airtableFieldName or fall back to custom name
            const newOriginalName = originalName || customName || ''
            
            console.log(`➕ Creating new field record:`, {
              original: newOriginalName,
              custom: customName || newOriginalName
            })
            
            const configRecord: any = {
              'Table Name': decodedTableName,
              'Field Name (Original)': newOriginalName, // Original Airtable field name
              'Field Name (Custom)': customName || newOriginalName, // Custom display name
              'Field Type': this.mapInternalFieldTypeToAirtable(field.type || 'singleLineText'),
              'Is Active': true,
              'Default Value': (field as any).defaultValue !== undefined && (field as any).defaultValue !== null 
                ? String((field as any).defaultValue) 
                : '',
            }
            
            // For multilineText (Description), Airtable might require it to be present
            if (field.description && field.description.trim()) {
              configRecord['Description'] = field.description.trim()
            } else {
              configRecord['Description'] = ' ' // Single space for multilineText
            }
            
            recordsToCreate.push(configRecord)
          }
        }
      }

      // Update existing records
      for (const update of recordsToUpdate) {
        try {
          await this.base(this.configTableName).update(update.id, update.fields)
        } catch (error: any) {
          console.error('Error updating record:', update.id, update.fields)
          console.error('Error details:', error)
          throw error
        }
      }

      // Create new records
      if (recordsToCreate.length > 0) {
        try {
          // Log what we're trying to create for debugging
          console.log(`Creating ${recordsToCreate.length} record(s) for table: ${decodedTableName}`)
          if (recordsToCreate.length > 0) {
            const sampleRecord = recordsToCreate[0]
            console.log('Sample record:', JSON.stringify(sampleRecord, null, 2))
            console.log('Sample record field names:', Object.keys(sampleRecord))
            console.log('Sample record field count:', Object.keys(sampleRecord).length)
            
            // Verify all expected fields are present (Format Preferences removed)
            const expectedFields = [
              'Table Name',
              'Field Name (Original)',
              'Field Name (Custom)',
              'Field Type',
              'Is Active',
              'Default Value'
            ]
            const missingFields = expectedFields.filter(field => !(field in sampleRecord))
            if (missingFields.length > 0) {
              console.error('Missing required fields:', missingFields)
            }
          }
          
          // Create records one at a time to better identify which one fails
          // Format: Airtable library expects fields to be wrapped in a 'fields' object
          for (let i = 0; i < recordsToCreate.length; i++) {
            try {
              console.log(`Creating record ${i + 1}/${recordsToCreate.length} in table: "${this.configTableName}"`)
              console.log(`Record data:`, JSON.stringify(recordsToCreate[i], null, 2))
              
              // Wrap fields in 'fields' object as required by Airtable API
              const recordToCreate = {
                fields: recordsToCreate[i]
              }
              
              await this.base(this.configTableName).create([recordToCreate])
              console.log(`✅ Successfully created record ${i + 1} in "${this.configTableName}"`)
            } catch (recordError: any) {
              console.error(`Error creating record ${i + 1}:`, JSON.stringify(recordsToCreate[i], null, 2))
              console.error('Record error details:', recordError.error || recordError.message || recordError)
              if (recordError.error) {
                console.error('Full Airtable error:', JSON.stringify(recordError.error, null, 2))
              }
              throw recordError
            }
          }
        } catch (error: any) {
          console.error('Error creating records:', error.error || error.message || error)
          if (recordsToCreate.length > 0) {
            console.error('Sample record that failed:', JSON.stringify(recordsToCreate[0], null, 2))
            console.error('All field names in record:', Object.keys(recordsToCreate[0]))
          }
          // Log full error details
          if (error.error) {
            console.error('Full Airtable error:', JSON.stringify(error.error, null, 2))
            throw new Error(`Airtable error: ${error.error.type} - ${error.error.message}`)
          }
          if (error.message) {
            console.error('Error message:', error.message)
          }
          throw error
        }
      }

      // Deactivate fields that are no longer in the schema
      for (const [originalName, record] of existingMap.entries()) {
        await this.base(this.configTableName).update(record.id, {
          'Is Active': false,
        })
      }

      // Return updated configuration (use decoded name)
      const updated = await this.getConfiguration(decodedTableName)
      if (!updated) {
        throw new Error('Failed to retrieve updated configuration')
      }

      return updated
    } catch (error: any) {
      throw new Error(`Failed to save configuration: ${error.error || error.message || 'Unknown error'}`)
    }
  }
}

// Singleton instance
let tableConfigurationService: TableConfigurationAirtableService | null = null

export function getTableConfigurationAirtableService(): TableConfigurationAirtableService {
  if (!tableConfigurationService) {
    tableConfigurationService = new TableConfigurationAirtableService()
  }
  return tableConfigurationService
}

