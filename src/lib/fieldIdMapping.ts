/**
 * Field ID Mapping System
 * 
 * This system uses Airtable Field IDs (immutable) instead of field names (mutable)
 * for storing table preferences. This ensures configurations remain stable even
 * when field names change in Airtable.
 * 
 * Field IDs are fetched from Airtable Metadata API and cached locally.
 */

export interface FieldIdMapping {
  /** Airtable Field ID (immutable) */
  fieldId: string
  /** Internal field key used in the app (e.g., "Email", "First Name") */
  fieldKey: string
  /** Original Airtable field name (for reference) */
  fieldName: string
  /** Field type */
  fieldType?: string
}

export interface TableFieldMapping {
  tableId: string
  tableName: string
  /** Base ID for Airtable */
  baseId?: string
  /** Airtable table ID */
  airtableTableId?: string
  /** Map of field key -> field ID */
  fieldKeyToId: Record<string, string>
  /** Map of field ID -> field key */
  fieldIdToKey: Record<string, string>
  /** Full field mappings */
  fields: FieldIdMapping[]
  /** Last time mapping was fetched/updated */
  lastUpdated: string
}

const STORAGE_PREFIX = 'field_id_mapping_'
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

/**
 * Get field mapping for a table
 */
export function getFieldMapping(tableId: string): TableFieldMapping | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${tableId}`)
    if (!stored) return null
    
    const mapping = JSON.parse(stored) as TableFieldMapping
    
    // Check if cache is expired
    const lastUpdated = new Date(mapping.lastUpdated).getTime()
    const now = Date.now()
    if (now - lastUpdated > CACHE_DURATION) {
      // Cache expired, but return it anyway (will be refreshed on next fetch)
      return mapping
    }
    
    return mapping
  } catch (error) {
    console.error('Error loading field mapping:', error)
    return null
  }
}

/**
 * Save field mapping for a table
 */
export function saveFieldMapping(tableId: string, mapping: TableFieldMapping): void {
  try {
    mapping.lastUpdated = new Date().toISOString()
    localStorage.setItem(`${STORAGE_PREFIX}${tableId}`, JSON.stringify(mapping))
  } catch (error) {
    console.error('Error saving field mapping:', error)
  }
}

/**
 * Fetch field IDs from backend API
 */
export async function fetchFieldMapping(
  tableId: string,
  baseId?: string,
  airtableTableId?: string
): Promise<TableFieldMapping | null> {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
    const response = await fetch(`${API_BASE_URL}/tables/${tableId}/field-mapping`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        // Field mapping not found - will be created on first use
        return null
      }
      throw new Error(`Failed to fetch field mapping: ${response.statusText}`)
    }

    const mapping = await response.json() as TableFieldMapping
    saveFieldMapping(tableId, mapping)
    return mapping
  } catch (error) {
    console.error('Error fetching field mapping:', error)
    return null
  }
}

/**
 * Convert field key to field ID
 */
export function getFieldId(tableId: string, fieldKey: string): string | null {
  const mapping = getFieldMapping(tableId)
  if (!mapping) return null
  return mapping.fieldKeyToId[fieldKey] || null
}

/**
 * Convert field ID to field key
 */
export function getFieldKey(tableId: string, fieldId: string): string | null {
  const mapping = getFieldMapping(tableId)
  if (!mapping) return null
  return mapping.fieldIdToKey[fieldId] || null
}

/**
 * Convert preferences using field names to preferences using field IDs
 */
export function convertPreferencesToFieldIds(
  tableId: string,
  preferences: {
    columnVisibility?: Record<string, boolean>
    columnOrder?: string[]
    defaultSort?: { field: string; order: 'asc' | 'desc' }
  }
): {
  columnVisibility?: Record<string, boolean>
  columnOrder?: string[]
  defaultSort?: { field: string; order: 'asc' | 'desc' }
} {
  const mapping = getFieldMapping(tableId)
  if (!mapping) {
    // No mapping available - return as-is (fallback to field names)
    return preferences
  }

  const converted: typeof preferences = {}

  // Convert column visibility
  if (preferences.columnVisibility) {
    converted.columnVisibility = {}
    for (const [fieldKey, visible] of Object.entries(preferences.columnVisibility)) {
      const fieldId = mapping.fieldKeyToId[fieldKey]
      if (fieldId) {
        converted.columnVisibility[fieldId] = visible
      } else {
        // Field not in mapping - keep original key (might be a computed field)
        converted.columnVisibility[fieldKey] = visible
      }
    }
  }

  // Convert column order
  if (preferences.columnOrder) {
    converted.columnOrder = preferences.columnOrder.map(fieldKey => {
      const fieldId = mapping.fieldKeyToId[fieldKey]
      return fieldId || fieldKey // Fallback to original if no mapping
    })
  }

  // Convert default sort field
  if (preferences.defaultSort) {
    const fieldId = mapping.fieldKeyToId[preferences.defaultSort.field]
    converted.defaultSort = {
      field: fieldId || preferences.defaultSort.field,
      order: preferences.defaultSort.order,
    }
  }

  return converted
}

/**
 * Convert preferences using field IDs back to field names (for display)
 */
export function convertPreferencesFromFieldIds(
  tableId: string,
  preferences: {
    columnVisibility?: Record<string, boolean>
    columnOrder?: string[]
    defaultSort?: { field: string; order: 'asc' | 'desc' }
  }
): {
  columnVisibility?: Record<string, boolean>
  columnOrder?: string[]
  defaultSort?: { field: string; order: 'asc' | 'desc' }
} {
  const mapping = getFieldMapping(tableId)
  if (!mapping) {
    // No mapping available - return as-is
    return preferences
  }

  const converted: typeof preferences = {}

  // Convert column visibility
  if (preferences.columnVisibility) {
    converted.columnVisibility = {}
    for (const [fieldId, visible] of Object.entries(preferences.columnVisibility)) {
      const fieldKey = mapping.fieldIdToKey[fieldId]
      if (fieldKey) {
        converted.columnVisibility[fieldKey] = visible
      } else {
        // Field ID not in mapping - keep original (might be a computed field)
        converted.columnVisibility[fieldId] = visible
      }
    }
  }

  // Convert column order
  if (preferences.columnOrder) {
    converted.columnOrder = preferences.columnOrder.map(fieldId => {
      const fieldKey = mapping.fieldIdToKey[fieldId]
      return fieldKey || fieldId // Fallback to original if no mapping
    })
  }

  // Convert default sort field
  if (preferences.defaultSort) {
    const fieldKey = mapping.fieldIdToKey[preferences.defaultSort.field]
    converted.defaultSort = {
      field: fieldKey || preferences.defaultSort.field,
      order: preferences.defaultSort.order,
    }
  }

  return converted
}

/**
 * Check if a field key is a computed/virtual field (not from Airtable)
 */
export function isComputedField(fieldKey: string): boolean {
  // Computed fields typically end with "Name" or are special fields
  return fieldKey.endsWith('Name') || 
         fieldKey === 'id' || 
         fieldKey === 'createdAt' || 
         fieldKey === 'updatedAt' ||
         fieldKey === 'createdBy' ||
         fieldKey === 'lastModifiedBy'
}

