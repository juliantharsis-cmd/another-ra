/**
 * API Client for Table Schema Configuration
 * Handles all HTTP requests to the table schema API
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
  airtableFieldId?: string // Airtable field ID
  airtableFieldName?: string // Original Airtable field name
  syncedWithAirtable?: boolean // Whether this field is synced with Airtable
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
}

export interface UpdateTableSchemaDto {
  tableName?: string
  fields?: (CreateTableFieldDto | UpdateTableFieldDto)[]
}

/**
 * API Client for Table Schema
 */
class TableSchemaApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/tables`
  }

  /**
   * Get table schema
   */
  async getSchema(tableId: string): Promise<TableSchema> {
    const response = await fetch(`${this.baseUrl}/${tableId}/schema`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch table schema: ${response.statusText}`)
    }

    const result: ApiResponse<TableSchema> = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch table schema')
    }

    return result.data
  }

  /**
   * Update table schema
   */
  async updateSchema(tableId: string, schema: UpdateTableSchemaDto): Promise<TableSchema> {
    try {
      const response = await fetch(`${this.baseUrl}/${tableId}/schema`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schema),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || `Failed to update table schema: ${response.statusText}`)
      }

      const result: ApiResponse<TableSchema> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || result.message || 'Failed to update table schema')
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
export const tableSchemaApi = new TableSchemaApiClient()

