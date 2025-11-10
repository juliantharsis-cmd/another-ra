/**
 * Generic Logical Type System
 * 
 * This module defines vendor-agnostic logical field types that can be
 * mapped to/from any persistence layer (Airtable, PostgreSQL, etc.)
 */

export type LogicalType =
  | StringType
  | NumberType
  | BooleanType
  | DateType
  | EnumType
  | JsonType
  | ArrayType
  | ForeignKeyType
  | AttachmentType
  | ComputedType;

export interface StringType {
  kind: 'string';
  maxLength?: number;
  format?: 'email' | 'url' | 'phone' | 'richtext';
}

export interface NumberType {
  kind: 'number';
  precision?: number;
  scale?: number;
  signed?: boolean;
}

export interface BooleanType {
  kind: 'boolean';
}

export interface DateType {
  kind: 'date';
  timezone?: 'naive' | 'utc';
  format?: 'date' | 'datetime';
}

export interface EnumType {
  kind: 'enum';
  options: string[];
  multi?: boolean;
}

export interface JsonType {
  kind: 'json';
}

export interface ArrayType {
  kind: 'array';
  items: LogicalSubType;
}

export interface ForeignKeyType {
  kind: 'foreign_key';
  refTable: string;
  refField?: string;
  cardinality?: 'one' | 'many';
}

export interface AttachmentType {
  kind: 'attachment';
  multiple?: boolean;
  constraints?: {
    maxSizeMB?: number;
    mimeTypes?: string[];
  };
}

export interface ComputedType {
  kind: 'computed';
  expression?: string;
  sourceType?: LogicalType;
  readOnly: true;
}

export type LogicalSubType = Exclude<LogicalType, ComputedType | ForeignKeyType | AttachmentType>;

/**
 * LogicalField represents a field in a logical schema
 */
export interface LogicalField {
  name: string;
  logicalType: LogicalType;
  nullable?: boolean; // default true
  defaultValue?: any;
  description?: string;
  metadata?: Record<string, any>; // escape hatch for adapter-specific notes
}

/**
 * LogicalSchema represents a complete table schema
 */
export interface LogicalSchema {
  tableName: string;
  fields: LogicalField[];
}

/**
 * Change operation types for schema synchronization
 */
export type ChangeOperation =
  | { type: 'add'; field: LogicalField }
  | { type: 'modify'; field: LogicalField; previous: LogicalField }
  | { type: 'remove'; fieldName: string; previous: LogicalField }
  | { type: 'no_change'; field: LogicalField };

/**
 * Change plan for synchronizing schemas
 */
export interface ChangePlan {
  tableName: string;
  operations: ChangeOperation[];
  breaking: boolean; // true if any operation is potentially destructive
  warnings: string[];
}

/**
 * Safety level of a change operation
 */
export type SafetyLevel = 'safe' | 'breaking' | 'warning';

