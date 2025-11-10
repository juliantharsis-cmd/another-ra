/**
 * User Preferences Core Types
 * 
 * Database-agnostic types for user preferences system.
 * Supports Airtable, PostgreSQL, and in-memory storage.
 */

export type PreferenceNamespace = 'ui' | 'table' | 'filters' | 'featureFlags' | 'misc'
export type PreferenceType = 'string' | 'number' | 'boolean' | 'json'
export type PreferenceVisibility = 'private' | 'org' | 'global'

/**
 * Core preference record structure
 */
export interface PreferenceRecord {
  id?: string
  userId: string
  namespace: PreferenceNamespace
  key: string
  tableId?: string
  scopeId?: string
  type: PreferenceType
  value: string | number | boolean | object
  visibility?: PreferenceVisibility
  expiresAt?: Date | string
  createdAt?: Date | string
  updatedAt?: Date | string
}

/**
 * Preference key components for building unique keys
 */
export interface PreferenceKey {
  userId: string
  namespace: PreferenceNamespace
  key: string
  tableId?: string
  scopeId?: string
}

/**
 * Options for setting preferences
 */
export interface SetPreferenceOptions {
  visibility?: PreferenceVisibility
  expiresAt?: Date | string
  ttl?: number // Time to live in seconds
  overwrite?: boolean // Default: true
}

/**
 * Filter options for getting preferences
 */
export interface PreferenceFilter {
  namespace?: PreferenceNamespace | PreferenceNamespace[]
  tableId?: string
  scopeId?: string
  key?: string | string[]
  visibility?: PreferenceVisibility | PreferenceVisibility[]
  expired?: boolean // Include expired preferences
}

/**
 * Preference query result
 */
export interface PreferenceQueryResult {
  records: PreferenceRecord[]
  total: number
}

/**
 * Adapter interface for different storage backends
 */
export interface IPreferencesAdapter {
  /**
   * Get a single preference by key components
   */
  get(key: PreferenceKey): Promise<PreferenceRecord | null>

  /**
   * Get multiple preferences matching filter
   */
  getAll(userId: string, filter?: PreferenceFilter): Promise<PreferenceQueryResult>

  /**
   * Set (create or update) a preference
   */
  set(record: PreferenceRecord, options?: SetPreferenceOptions): Promise<PreferenceRecord>

  /**
   * Delete a preference by key components
   */
  delete(key: PreferenceKey): Promise<boolean>

  /**
   * Delete multiple preferences matching filter
   */
  deleteAll(userId: string, filter?: PreferenceFilter): Promise<number>

  /**
   * Check if adapter is healthy/connected
   */
  healthCheck(): Promise<boolean>

  /**
   * Get adapter name for logging
   */
  getName(): string
}

/**
 * Validation error
 */
export class PreferenceValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'PreferenceValidationError'
  }
}

/**
 * Not found error
 */
export class PreferenceNotFoundError extends Error {
  constructor(key: PreferenceKey) {
    super(`Preference not found: ${JSON.stringify(key)}`)
    this.name = 'PreferenceNotFoundError'
  }
}

