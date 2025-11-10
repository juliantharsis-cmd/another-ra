/**
 * Table Schema Types
 */

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

