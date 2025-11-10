/**
 * Table Preferences Store
 * 
 * Manages user preferences for table configurations:
 * - Column visibility
 * - Column order
 * - Default sort
 * 
 * NOTE: This module now uses Airtable Field IDs internally for stability.
 * The public API still accepts/returns field keys for backward compatibility.
 */

import {
  getFieldMapping,
  fetchFieldMapping,
  convertPreferencesToFieldIds,
  convertPreferencesFromFieldIds,
  isComputedField,
} from './fieldIdMapping'

export type ListMode = 'compact' | 'comfortable' | 'spacious'

export interface TablePreferences {
  columnVisibility: Record<string, boolean>
  columnOrder: string[]
  columnWidths?: Record<string, number>
  columnWidthsByMode?: Record<string, Record<string, number>> // mode -> columnKey -> width
  defaultSort?: {
    field: string
    order: 'asc' | 'desc'
  }
  listMode?: ListMode
  pageSize?: number // Per-table page size override (overrides user default)
  activeFilters?: Record<string, string | string[]> // Persistent filter state per user
  // Internal: Track if preferences are using Field IDs
  _usingFieldIds?: boolean
}

const STORAGE_PREFIX = 'table_prefs_'
const STORAGE_PREFIX_LEGACY = 'table_prefs_legacy_' // For migration tracking

/**
 * Get preferences for a specific table
 * Returns preferences with field keys (converted from Field IDs if needed)
 */
export function getTablePreferences(tableId: string): TablePreferences | null {
  try {
    // Check for window to avoid SSR/hydration issues
    if (typeof window === 'undefined') {
      return null
    }
    
    // Sanitize table ID to prevent injection
    const sanitizedTableId = typeof tableId === 'string' ? tableId.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 100) : String(tableId)
    if (!sanitizedTableId) {
      console.error('Invalid table ID for loading preferences')
      return null
    }
    
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${sanitizedTableId}`)
    if (!stored) return null
    
    const prefs = JSON.parse(stored) as TablePreferences
    
    // Sanitize loaded preferences
    if (prefs.activeFilters) {
      prefs.activeFilters = sanitizeActiveFilters(prefs.activeFilters)
    }
    
    // If preferences are stored with Field IDs, convert them back to field keys
    if (prefs._usingFieldIds) {
      const converted = convertPreferencesFromFieldIds(tableId, {
        columnVisibility: prefs.columnVisibility,
        columnOrder: prefs.columnOrder,
        defaultSort: prefs.defaultSort,
      })
      
      return {
        ...prefs,
        columnVisibility: converted.columnVisibility || prefs.columnVisibility,
        columnOrder: converted.columnOrder || prefs.columnOrder,
        defaultSort: converted.defaultSort || prefs.defaultSort,
        _usingFieldIds: true, // Keep flag for saving
      }
    }
    
    // Legacy preferences (using field names) - return as-is for now
    // Migration will happen on next save
    return prefs
  } catch (error) {
    console.error('Error loading table preferences:', error)
    return null
  }
}

/**
 * Save preferences for a specific table
 * Converts field keys to Field IDs before saving (if mapping is available)
 * This is synchronous - mapping must be fetched beforehand if needed
 */
/**
 * Sanitize filter values to prevent XSS and ensure data integrity
 */
function sanitizeFilterValue(value: any): any {
  if (value === null || value === undefined) return value
  
  if (typeof value === 'string') {
    // Remove any script tags and limit length
    return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').slice(0, 500)
  }
  
  if (Array.isArray(value)) {
    return value.map(sanitizeFilterValue).filter(v => v !== null && v !== undefined)
  }
  
  return value
}

/**
 * Sanitize active filters before saving
 */
function sanitizeActiveFilters(filters: Record<string, string | string[]> | undefined): Record<string, string | string[]> | undefined {
  if (!filters) return undefined
  
  const sanitized: Record<string, string | string[]> = {}
  for (const [key, value] of Object.entries(filters)) {
    // Sanitize key (field name)
    const sanitizedKey = typeof key === 'string' ? key.replace(/[^a-zA-Z0-9_\- ]/g, '').slice(0, 100) : key
    if (sanitizedKey) {
      sanitized[sanitizedKey] = sanitizeFilterValue(value) as string | string[]
    }
  }
  return sanitized
}

export function saveTablePreferences(tableId: string, preferences: TablePreferences): void {
  try {
    // Sanitize table ID to prevent injection
    const sanitizedTableId = typeof tableId === 'string' ? tableId.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 100) : String(tableId)
    if (!sanitizedTableId) {
      console.error('Invalid table ID for saving preferences')
      return
    }
    
    // Sanitize active filters if present
    const sanitizedPrefs: TablePreferences = {
      ...preferences,
      activeFilters: sanitizeActiveFilters(preferences.activeFilters),
    }
    
    // Try to get field mapping (must be already loaded)
    const mapping = getFieldMapping(sanitizedTableId)
    
    if (mapping) {
      // Convert field keys to Field IDs before saving
      const converted = convertPreferencesToFieldIds(sanitizedTableId, {
        columnVisibility: sanitizedPrefs.columnVisibility,
        columnOrder: sanitizedPrefs.columnOrder,
        defaultSort: sanitizedPrefs.defaultSort,
      })
      
      const prefsToSave: TablePreferences = {
        ...sanitizedPrefs,
        columnVisibility: converted.columnVisibility || sanitizedPrefs.columnVisibility,
        columnOrder: converted.columnOrder || sanitizedPrefs.columnOrder,
        defaultSort: converted.defaultSort || sanitizedPrefs.defaultSort,
        _usingFieldIds: true, // Mark as using Field IDs
      }
      
      localStorage.setItem(`${STORAGE_PREFIX}${sanitizedTableId}`, JSON.stringify(prefsToSave))
      
      // Also save a backup of legacy format for migration reference (first time only)
      if (!localStorage.getItem(`${STORAGE_PREFIX_LEGACY}${sanitizedTableId}`)) {
        localStorage.setItem(`${STORAGE_PREFIX_LEGACY}${sanitizedTableId}`, JSON.stringify(sanitizedPrefs))
      }
    } else {
      // No mapping available - save as-is (will be migrated when mapping is available)
      localStorage.setItem(`${STORAGE_PREFIX}${sanitizedTableId}`, JSON.stringify(sanitizedPrefs))
      
      // Try to fetch mapping in background for next time (non-blocking)
      fetchFieldMapping(sanitizedTableId).catch(() => {
        // Silently fail - will try again on next save
      })
    }
  } catch (error) {
    console.error('Error saving table preferences:', error)
    // Don't throw - gracefully fail to prevent breaking the app
  }
}

/**
 * Get column visibility for a table
 */
export function getColumnVisibility(tableId: string, defaultColumns: string[]): Record<string, boolean> {
  const prefs = getTablePreferences(tableId)
  if (prefs?.columnVisibility) {
    // Merge with defaults to ensure all columns are present
    const visibility: Record<string, boolean> = {}
    defaultColumns.forEach(col => {
      visibility[col] = prefs.columnVisibility[col] ?? true
    })
    return visibility
  }
  
  // Default: all columns visible
  const visibility: Record<string, boolean> = {}
  defaultColumns.forEach(col => {
    visibility[col] = true
  })
  return visibility
}

/**
 * Get column order for a table
 */
export function getColumnOrder(tableId: string, defaultColumns: string[]): string[] {
  const prefs = getTablePreferences(tableId)
  if (prefs?.columnOrder && prefs.columnOrder.length === defaultColumns.length) {
    // Validate that all columns are present
    const hasAllColumns = defaultColumns.every(col => prefs.columnOrder.includes(col))
    if (hasAllColumns) {
      return prefs.columnOrder
    }
  }
  return defaultColumns
}

/**
 * Get default sort for a table
 */
export function getDefaultSort(tableId: string): { field: string; order: 'asc' | 'desc' } | undefined {
  const prefs = getTablePreferences(tableId)
  return prefs?.defaultSort
}

/**
 * Update column visibility
 */
export function updateColumnVisibility(
  tableId: string,
  columnKey: string,
  visible: boolean
): void {
  const prefs = getTablePreferences(tableId) || {
    columnVisibility: {},
    columnOrder: [],
  }
  
  const updated: TablePreferences = {
    ...prefs,
    columnVisibility: {
      ...prefs.columnVisibility,
      [columnKey]: visible,
    },
  }
  
  saveTablePreferences(tableId, updated)
}

/**
 * Update column order
 */
export function updateColumnOrder(tableId: string, columnOrder: string[]): void {
  const prefs = getTablePreferences(tableId) || {
    columnVisibility: {},
    columnOrder: [],
  }
  
  const updated: TablePreferences = {
    ...prefs,
    columnOrder,
  }
  
  saveTablePreferences(tableId, updated)
}

/**
 * Update column widths
 */
export function updateColumnWidths(
  tableId: string,
  columnWidths: Record<string, number>
): void {
  const prefs = getTablePreferences(tableId) || {
    columnVisibility: {},
    columnOrder: [],
  }
  
  const updated: TablePreferences = {
    ...prefs,
    columnWidths: {
      ...prefs.columnWidths,
      ...columnWidths,
    },
  }
  
  saveTablePreferences(tableId, updated)
}

/**
 * Get column widths for a table
 */
export function getColumnWidths(tableId: string, mode?: ListMode): Record<string, number> | undefined {
  const prefs = getTablePreferences(tableId)
  if (mode && prefs?.columnWidthsByMode?.[mode]) {
    return prefs.columnWidthsByMode[mode]
  }
  return prefs?.columnWidths
}

/**
 * Update column widths for a specific mode
 */
export function updateColumnWidthsForMode(
  tableId: string,
  mode: ListMode,
  columnWidths: Record<string, number>
): void {
  const prefs = getTablePreferences(tableId) || {
    columnVisibility: {},
    columnOrder: [],
  }
  
  const updated: TablePreferences = {
    ...prefs,
    columnWidthsByMode: {
      ...prefs.columnWidthsByMode,
      [mode]: {
        ...prefs.columnWidthsByMode?.[mode],
        ...columnWidths,
      },
    },
    listMode: mode,
  }
  
  saveTablePreferences(tableId, updated)
}

/**
 * Get list mode for a table
 */
export function getListMode(tableId: string): ListMode {
  const prefs = getTablePreferences(tableId)
  return prefs?.listMode || 'comfortable'
}

/**
 * Set list mode for a table
 */
export function setListMode(tableId: string, mode: ListMode): void {
  const prefs = getTablePreferences(tableId) || {
    columnVisibility: {},
    columnOrder: [],
  }
  
  const updated: TablePreferences = {
    ...prefs,
    listMode: mode,
  }
  
  saveTablePreferences(tableId, updated)
}

/**
 * Update default sort
 */
export function updateDefaultSort(
  tableId: string,
  field: string,
  order: 'asc' | 'desc'
): void {
  const prefs = getTablePreferences(tableId) || {
    columnVisibility: {},
    columnOrder: [],
  }
  
  const updated: TablePreferences = {
    ...prefs,
    defaultSort: { field, order },
  }
  
  saveTablePreferences(tableId, updated)
}

/**
 * Get page size for a table (with user default fallback)
 */
export function getPageSize(tableId: string, userDefaultPageSize: number = 25): number {
  const prefs = getTablePreferences(tableId)
  // Per-table override takes precedence, then user default
  return prefs?.pageSize ?? userDefaultPageSize
}

/**
 * Update page size for a table
 */
export function updatePageSize(tableId: string, pageSize: number): void {
  const prefs = getTablePreferences(tableId) || {
    columnVisibility: {},
    columnOrder: [],
  }
  
  const updated: TablePreferences = {
    ...prefs,
    pageSize,
  }
  
  saveTablePreferences(tableId, updated)
}

