/**
 * API Client for Table Configuration
 * Handles all HTTP requests to the table configuration API
 * Uses the "Table Configuration" table in Airtable as a configuration layer
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface TableSchema {
  tableId: string
  tableName: string
  fields: TableField[]
  createdAt?: string
  updatedAt?: string
  // Airtable sync metadata
  airtableBaseId?: string
  airtableTableId?: string
  airtableTableName?: string
  lastSyncedAt?: string
}

export interface TableField {
  id: string
  name: string
  type: FieldType
  format?: FieldFormat
  required?: boolean
  unique?: boolean
  description?: string
  defaultValue?: string | number | boolean
  order: number
  // Airtable sync fields
  airtableFieldId?: string
  airtableFieldName?: string // Original Airtable field name
  syncedWithAirtable?: boolean
}

export type FieldType =
  | 'singleLineText'
  | 'longText'
  | 'attachment'
  | 'checkbox'
  | 'multipleSelects'
  | 'singleSelect'
  | 'user'
  | 'date'
  | 'phoneNumber'
  | 'email'
  | 'url'
  | 'number'
  | 'currency'
  | 'percent'
  | 'duration'
  | 'rating'
  | 'formula'
  | 'multipleRecordLinks'
  | 'singleRecordLink'
  | 'createdTime'
  | 'lastModifiedTime'
  | 'createdBy'
  | 'lastModifiedBy'

export interface FieldFormat {
  precision?: number
  symbol?: string
  dateFormat?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MMM DD, YYYY'
  timeFormat?: '12h' | '24h'
  options?: string[]
  maxRating?: number
  durationFormat?: 'h:mm:ss' | 'h:mm' | 'mm:ss'
}

export interface CreateTableFieldDto {
  name: string
  type: FieldType
  format?: FieldFormat
  required?: boolean
  unique?: boolean
  description?: string
  defaultValue?: string | number | boolean
  airtableFieldName?: string
}

export interface UpdateTableFieldDto {
  name?: string
  type?: FieldType
  format?: FieldFormat
  required?: boolean
  unique?: boolean
  description?: string
  defaultValue?: string | number | boolean
  order?: number
  airtableFieldName?: string
}

export interface UpdateTableSchemaDto {
  tableName?: string
  fields?: (CreateTableFieldDto | UpdateTableFieldDto)[]
}

/**
 * API Client for Table Configuration
 * Uses /api/configurations/:tableName endpoints
 */
class TableConfigurationApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/configurations`
  }

  /**
   * Get table configuration
   */
  async getConfiguration(tableName: string): Promise<TableSchema> {
    const response = await fetch(`${this.baseUrl}/${encodeURIComponent(tableName)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Configuration for table "${tableName}" not found`)
      }
      throw new Error(`Failed to fetch table configuration: ${response.statusText}`)
    }

    const result: ApiResponse<TableSchema> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch table configuration')
    }

    return result.data
  }

  /**
   * Update table configuration
   */
  async updateConfiguration(tableName: string, schema: UpdateTableSchemaDto): Promise<TableSchema> {
    try {
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(tableName)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schema),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || `Failed to update table configuration: ${response.statusText}`)
      }

      const result: ApiResponse<TableSchema> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || result.message || 'Failed to update table configuration')
      }

      return result.data
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to the server. Please check if the API server is running on http://localhost:3001')
      }
      throw error
    }
  }
}

// Export singleton instance
export const tableConfigurationApi = new TableConfigurationApiClient()

