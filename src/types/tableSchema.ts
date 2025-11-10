/**
 * Table Schema Types
 * Defines the structure for table configuration
 */

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
  // Number/Currency/Percent formats
  precision?: number
  symbol?: string // Currency symbol
  // Date formats
  dateFormat?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MMM DD, YYYY'
  timeFormat?: '12h' | '24h'
  // Select formats
  options?: string[] // For single/multiple select
  // Rating format
  maxRating?: number // For rating field
  // Duration format
  durationFormat?: 'h:mm:ss' | 'h:mm' | 'mm:ss'
}

export interface TableField {
  id: string
  name: string
  type: FieldType
  format?: FieldFormat
  required?: boolean
  unique?: boolean
  description?: string
  order: number
}

export interface TableSchema {
  tableId: string
  tableName: string
  fields: TableField[]
  createdAt?: string
  updatedAt?: string
}

export interface CreateTableFieldDto {
  name: string
  type: FieldType
  format?: FieldFormat
  required?: boolean
  unique?: boolean
  description?: string
}

export interface UpdateTableFieldDto {
  name?: string
  type?: FieldType
  format?: FieldFormat
  required?: boolean
  unique?: boolean
  description?: string
  order?: number
}

export interface UpdateTableSchemaDto {
  tableName?: string
  fields?: (CreateTableFieldDto | UpdateTableFieldDto)[]
}

