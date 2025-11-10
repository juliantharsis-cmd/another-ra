import Airtable from 'airtable'
import * as fs from 'fs'
import * as path from 'path'
import { TableSchema, TableField, CreateTableFieldDto, UpdateTableFieldDto } from '../types/TableSchema'

/**
 * Table Schema Airtable Service
 * 
 * Handles all Airtable API interactions for Table Schema storage.
 * Stores schema in a dedicated "Table Schemas" table in Airtable.
 * Supports bi-directional synchronization with Airtable Metadata API.
 */
export class TableSchemaAirtableService {
  private base: Airtable.Base
  private schemaTableName: string
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
    
    // Use a dedicated table for storing schemas
    this.schemaTableName = process.env.AIRTABLE_SCHEMA_TABLE_NAME || 
                          'Table Schemas'
    
    Airtable.configure({ apiKey: this.apiKey })
    this.base = Airtable.base(this.baseId)

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
   * Fetch schema from Airtable Metadata API
   * Note: Requires Personal Access Token with 'schema.bases:read' scope
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
          console.warn(
            `⚠️  Airtable Metadata API access denied for table ${airtableTableId}. ` +
            `This requires a Personal Access Token with 'schema.bases:read' scope. ` +
            `Schema will be created from current fields instead. ` +
            `Error: ${errorData.error || response.statusText}`
          )
        } else {
          console.warn(`Failed to fetch Airtable schema for table ${airtableTableId}: ${response.statusText}`)
        }
        return null
      }

      const data = await response.json()
      
      return {
        fields: data.fields || [],
        tableName: data.name || '',
      }
    } catch (error: any) {
      console.warn(`Error fetching Airtable schema: ${error.message}. Schema will be created from current fields.`)
      return null
    }
  }

  /**
   * Map Airtable field type to our FieldType
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
      'multipleAttachments': 'attachment',
      'createdTime': 'createdTime',
      'lastModifiedTime': 'lastModifiedTime',
      'createdBy': 'createdBy',
      'lastModifiedBy': 'lastModifiedBy',
      'formula': 'formula',
      'rating': 'rating',
      'duration': 'duration',
    }
    return mapping[airtableType] || 'singleLineText'
  }

  /**
   * Get table schema by table ID
   * If schema doesn't exist, fetch from Airtable and create it
   */
  async getSchema(tableId: string): Promise<TableSchema | null> {
    try {
      const records = await this.base(this.schemaTableName)
        .select({
          filterByFormula: `{Table ID} = '${tableId}'`,
          maxRecords: 1,
        })
        .all()

      if (records.length === 0) {
        // Schema doesn't exist - try to fetch from Airtable (optional, will gracefully fail if not authorized)
        const airtableInfo = this.getAirtableTableInfo(tableId)
        if (airtableInfo) {
          const airtableSchema = await this.fetchAirtableSchema(airtableInfo.tableId)
          if (airtableSchema) {
            // Create schema from Airtable
            const fields: TableField[] = airtableSchema.fields.map((field: any, index: number) => ({
              id: `field-${field.id}`,
              name: field.name, // Use Airtable field name by default
              type: this.mapAirtableFieldType(field.type) as any,
              order: index,
              required: false,
              unique: false,
              airtableFieldId: field.id,
              airtableFieldName: field.name,
              syncedWithAirtable: true,
            }))

            const newSchema: TableSchema = {
              tableId,
              tableName: airtableSchema.tableName,
              fields,
              airtableBaseId: this.baseId,
              airtableTableId: airtableInfo.tableId,
              airtableTableName: airtableInfo.tableName,
              lastSyncedAt: new Date().toISOString(),
            }

            // Save to our schema table
            await this.saveSchema(newSchema)
            return newSchema
          } else {
            // Metadata API fetch failed (likely due to permissions) - return null
            // Frontend will create schema from current fields
            console.log(`Schema not found for ${tableId}. Will be created from current fields when configured.`)
            return null
          }
        }
        // No Airtable mapping found - return null, frontend will create schema
        return null
      }

      const record = records[0]
      const fields = record.fields['Fields'] ? JSON.parse(record.fields['Fields'] as string) : []
      const metadata = record.fields['Metadata'] ? JSON.parse(record.fields['Metadata'] as string) : {}

      return {
        tableId: record.fields['Table ID'] as string,
        tableName: record.fields['Table Name'] as string,
        fields: fields,
        createdAt: this.formatDate(record._rawJson.createdTime),
        updatedAt: this.formatDate(record._rawJson.lastModifiedTime),
        airtableBaseId: metadata.airtableBaseId,
        airtableTableId: metadata.airtableTableId,
        airtableTableName: metadata.airtableTableName,
        lastSyncedAt: metadata.lastSyncedAt,
      }
    } catch (error: any) {
      if (error.statusCode === 404 || error.error === 'NOT_FOUND') {
        return null
      }
      throw new Error(`Failed to fetch schema: ${error.error || error.message || 'Unknown error'}`)
    }
  }

  /**
   * Create or update table schema
   * Also attempts to sync field name changes to Airtable if applicable
   */
  async saveSchema(schema: TableSchema): Promise<TableSchema> {
    try {
      // Check if schema exists
      const existing = await this.getSchema(schema.tableId)

      // Attempt to sync field name changes to Airtable
      if (schema.airtableTableId && existing) {
        await this.syncFieldNamesToAirtable(schema, existing)
      }

      const fieldsData: any = {
        'Table ID': schema.tableId,
        'Table Name': schema.tableName,
        'Fields': JSON.stringify(schema.fields),
        'Metadata': JSON.stringify({
          airtableBaseId: schema.airtableBaseId,
          airtableTableId: schema.airtableTableId,
          airtableTableName: schema.airtableTableName,
          lastSyncedAt: schema.lastSyncedAt || new Date().toISOString(),
        }),
      }

      if (existing) {
        // Update existing
        const records = await this.base(this.schemaTableName)
          .select({
            filterByFormula: `{Table ID} = '${schema.tableId}'`,
            maxRecords: 1,
          })
          .all()

        if (records.length > 0) {
          await this.base(this.schemaTableName).update(records[0].id, fieldsData)
        }
      } else {
        // Create new
        await this.base(this.schemaTableName).create(fieldsData)
      }

      return schema
    } catch (error: any) {
      throw new Error(`Failed to save schema: ${error.error || error.message || 'Unknown error'}`)
    }
  }

  /**
   * Sync field name changes to Airtable
   * Note: Airtable Metadata API has limitations - field names can only be updated via the UI
   * This method attempts to update via API but will gracefully fail if not supported
   */
  private async syncFieldNamesToAirtable(newSchema: TableSchema, existingSchema: TableSchema): Promise<void> {
    if (!newSchema.airtableTableId) {
      return
    }

    try {
      // Find fields that have changed names
      const nameChanges: Array<{ fieldId: string; oldName: string; newName: string }> = []
      
      for (const newField of newSchema.fields) {
        if (!newField.airtableFieldId) continue
        
        const existingField = existingSchema.fields.find(f => f.airtableFieldId === newField.airtableFieldId)
        if (existingField && existingField.name !== newField.name) {
          nameChanges.push({
            fieldId: newField.airtableFieldId,
            oldName: existingField.name,
            newName: newField.name,
          })
        }
      }

      if (nameChanges.length === 0) {
        return
      }

      // Attempt to update field names via Airtable Metadata API
      // Note: This may not be supported by Airtable's API - field names typically need to be changed via UI
      for (const change of nameChanges) {
        try {
          const response = await fetch(
            `https://api.airtable.com/v0/meta/bases/${this.baseId}/tables/${newSchema.airtableTableId}/fields/${change.fieldId}`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: change.newName,
              }),
            }
          )

          if (!response.ok) {
            // Field name updates may not be supported - this is expected
            console.warn(
              `Could not update Airtable field name for ${change.fieldId}: ${response.statusText}. ` +
              `Field names may need to be updated manually in Airtable UI.`
            )
          } else {
            console.log(`Successfully synced field name: ${change.oldName} → ${change.newName}`)
            // Update the field's airtableFieldName to reflect the change
            const field = newSchema.fields.find(f => f.airtableFieldId === change.fieldId)
            if (field) {
              field.airtableFieldName = change.newName
            }
          }
        } catch (error: any) {
          console.warn(`Error syncing field name for ${change.fieldId}: ${error.message}`)
        }
      }

      // Update lastSyncedAt
      newSchema.lastSyncedAt = new Date().toISOString()
    } catch (error: any) {
      // Don't throw - field name sync is optional
      console.warn(`Error during field name sync: ${error.message}`)
    }
  }

  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toISOString()
  }
}

// Lazy singleton instance
let tableSchemaAirtableServiceInstance: TableSchemaAirtableService | null = null

export const getTableSchemaAirtableService = (): TableSchemaAirtableService => {
  if (!tableSchemaAirtableServiceInstance) {
    tableSchemaAirtableServiceInstance = new TableSchemaAirtableService()
  }
  return tableSchemaAirtableServiceInstance
}

