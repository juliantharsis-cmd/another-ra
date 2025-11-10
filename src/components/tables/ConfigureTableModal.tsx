'use client'

import { useState, useEffect, useMemo } from 'react'
import { XMarkIcon, Bars3Icon } from '../icons'
import {
  getTablePreferences,
  saveTablePreferences,
  updateColumnVisibility,
  updateColumnOrder,
  updateDefaultSort,
  TablePreferences,
} from '@/lib/tablePreferences'
import { trackEvent } from '@/lib/telemetry'
import { tableConfigurationApi, TableSchema, TableField } from '@/lib/api/tableConfiguration'
import { isFeatureEnabled } from '@/lib/featureFlags'

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
}

interface ConfigureTableModalProps {
  isOpen: boolean
  onClose: () => void
  tableId: string
  columns: TableColumn[]
  allFields?: TableColumn[] // All fields from config (including those not in list mode)
  currentSort?: {
    field: string
    order: 'asc' | 'desc'
  }
  onPreferencesChange?: (preferences: TablePreferences) => void
  onAutoSizeColumns?: () => void // Callback for auto-sizing all columns
}

/**
 * Configure Table Modal
 * 
 * Allows users to:
 * - Toggle column visibility
 * - Reorder columns via drag-and-drop
 * - Set default sort
 */
export default function ConfigureTableModal({
  isOpen,
  onClose,
  tableId,
  columns,
  allFields,
  currentSort,
  onPreferencesChange,
  onAutoSizeColumns,
}: ConfigureTableModalProps) {
  const [activeTab, setActiveTab] = useState<'display' | 'fields'>('display')
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
  const [columnOrder, setColumnOrder] = useState<string[]>([])
  const [defaultSortField, setDefaultSortField] = useState<string>('')
  const [defaultSortOrder, setDefaultSortOrder] = useState<'asc' | 'desc'>('asc')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  
  // Field renaming state (only used if table configuration feature is enabled)
  const isTableConfigurationEnabled = isFeatureEnabled('tableConfiguration')
  const [tableSchema, setTableSchema] = useState<TableSchema | null>(null)
  const [isLoadingSchema, setIsLoadingSchema] = useState(false)
  const [isSavingSchema, setIsSavingSchema] = useState(false)
  const [fieldNames, setFieldNames] = useState<Record<string, string>>({})
  const [hasTableConfiguration, setHasTableConfiguration] = useState(false)

  // Helper function to normalize field names for matching (same as ListDetailTemplate)
  const normalizeFieldName = (name: string): string => {
    return name.toLowerCase().replace(/[_\s-]/g, '')
  }

  // Load table configuration (only if feature is enabled)
  const loadTableConfiguration = async () => {
    if (!isTableConfigurationEnabled) {
      setHasTableConfiguration(false)
      return
    }
    
    try {
      setIsLoadingSchema(true)
      const config = await tableConfigurationApi.getConfiguration(tableId)
      setTableSchema(config)
      setHasTableConfiguration(true)
      
      // Initialize field names from configuration
      // Match columns to configuration fields by:
      // 1. Exact match on column key
      // 2. Normalized match on column key
      // 3. Exact match on column label
      // 4. Normalized match on column label
      // 5. Match by airtableFieldName
      const names: Record<string, string> = {}
      
      columns.forEach((column) => {
        // Try to find matching field in configuration
        let matchedField = config.fields?.find((field) => {
          // Match by field id (if it matches column key)
          if (field.id === column.key) return true
          
          // Match by normalized field id
          if (normalizeFieldName(field.id) === normalizeFieldName(column.key)) return true
          
          // Match by field name (custom name)
          if (field.name === column.label) return true
          
          // Match by normalized field name
          if (normalizeFieldName(field.name) === normalizeFieldName(column.label)) return true
          
          // Match by airtableFieldName (original Airtable name)
          if (field.airtableFieldName === column.label) return true
          
          // Match by normalized airtableFieldName
          if (field.airtableFieldName && normalizeFieldName(field.airtableFieldName) === normalizeFieldName(column.label)) return true
          
          // Match by normalized airtableFieldName to column key
          if (field.airtableFieldName && normalizeFieldName(field.airtableFieldName) === normalizeFieldName(column.key)) return true
          
          return false
        })
        
        if (matchedField) {
          // Use the custom name from configuration
          names[column.key] = matchedField.name
        } else {
          // No match found, use current column label as default
          names[column.key] = column.label
        }
      })
      
      setFieldNames(names)
    } catch (error) {
      console.warn('Table configuration not available (this is OK - display settings will still work):', error)
      setHasTableConfiguration(false)
      // Initialize with current column labels as fallback
      const names: Record<string, string> = {}
      columns.forEach(col => {
        names[col.key] = col.label
      })
      setFieldNames(names)
    } finally {
      setIsLoadingSchema(false)
    }
  }

  // Load preferences on mount
  useEffect(() => {
    if (isOpen) {
      const prefs = getTablePreferences(tableId)
      const defaultOrder = columns.map(col => col.key)
      
      setColumnVisibility(
        prefs?.columnVisibility ||
        columns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {})
      )
      setColumnOrder(prefs?.columnOrder || defaultOrder)
      setDefaultSortField(prefs?.defaultSort?.field || currentSort?.field || '')
      setDefaultSortOrder(prefs?.defaultSort?.order || currentSort?.order || 'asc')
      
      // Reset to display tab if fields tab is selected but table configuration is not available
      if (activeTab === 'fields' && !isTableConfigurationEnabled) {
        setActiveTab('display')
      }
      
      // Load table configuration for field renaming (optional - won't block if unavailable)
      loadTableConfiguration().catch(err => {
        console.warn('Could not load table configuration (display settings will still work):', err)
      })
    }
  }, [isOpen, tableId, columns, currentSort, isTableConfigurationEnabled, activeTab])
  
  // Reset to display tab if table configuration becomes unavailable
  useEffect(() => {
    if (activeTab === 'fields' && !hasTableConfiguration) {
      setActiveTab('display')
    }
  }, [hasTableConfiguration, activeTab])

  // Update field name
  const updateFieldName = (columnKey: string, newName: string) => {
    // Allow empty string - don't filter it out
    setFieldNames(prev => ({
      ...prev,
      [columnKey]: newName, // Can be empty string - user can clear the field
    }))
    console.log(`✏️ Updated field name for "${columnKey}": "${newName}"`)
  }

  // Save field names
  const saveFieldNames = async () => {
    try {
      setIsSavingSchema(true)
      
      // Build updated fields array
      const updatedFields: any[] = []
      
      columns.forEach((column, index) => {
        // Get custom name - allow empty string, but default to column label if undefined
        const customName = fieldNames[column.key] !== undefined ? fieldNames[column.key] : column.label
        
        // Try to find existing field in schema
        // Priority: Match by ID first (most reliable), then by airtableFieldName (original name), then by name
        let existingField = tableSchema?.fields?.find((field) => {
          // Priority 1: Match by field id (record ID from Airtable)
          if (field.id && column.key && field.id === column.key) return true
          
          // Priority 2: Match by normalized field id
          if (field.id && column.key && normalizeFieldName(field.id) === normalizeFieldName(column.key)) return true
          
          // Priority 3: Match by airtableFieldName (original Airtable field name) - this is the most important for preserving original
          if (field.airtableFieldName && field.airtableFieldName === column.label) return true
          
          // Priority 4: Match by normalized airtableFieldName
          if (field.airtableFieldName && normalizeFieldName(field.airtableFieldName) === normalizeFieldName(column.label)) return true
          
          // Priority 5: Match by normalized airtableFieldName to column key
          if (field.airtableFieldName && column.key && normalizeFieldName(field.airtableFieldName) === normalizeFieldName(column.key)) return true
          
          // Priority 6: Match by field name (custom name) - less reliable as it can change
          if (field.name === column.label) return true
          
          // Priority 7: Match by normalized field name
          if (normalizeFieldName(field.name) === normalizeFieldName(column.label)) return true
          
          return false
        })
        
        if (existingField) {
          // Update existing field with new custom name
          // CRITICAL: The column.label from the config file IS the original Airtable field name
          // We should ALWAYS use column.label as the source of truth for the original name
          // Only trust existingField.airtableFieldName if it matches column.label (hasn't been corrupted)
          const existingOriginal = existingField.airtableFieldName
          const configOriginal = column.label // This is the TRUE original from the config file
          
          // Use configOriginal as the source of truth, but if existingOriginal matches it, that's good
          // If they don't match, it means the existing data was corrupted, so fix it
          const preservedOriginalName = (existingOriginal && existingOriginal === configOriginal) 
            ? existingOriginal 
            : configOriginal // Always fall back to config file's original
          
          updatedFields.push({
            name: customName || preservedOriginalName, // If empty, use original name
            type: existingField.type,
            format: existingField.format,
            required: existingField.required,
            unique: existingField.unique,
            description: existingField.description,
            defaultValue: existingField.defaultValue,
            order: existingField.order !== undefined ? existingField.order : index,
            airtableFieldName: preservedOriginalName, // ALWAYS use config file's original - never use custom name
          })
          
          console.log(`💾 Saving field:`, {
            columnKey: column.key,
            columnLabel: column.label,
            existingOriginal: existingOriginal,
            preservedOriginal: preservedOriginalName,
            customName: customName,
            wasCorrupted: existingOriginal && existingOriginal !== configOriginal
          })
        } else {
          // Create new field entry
          // Use column label as the original Airtable field name (first time saving)
          const originalName = column.label
          
          updatedFields.push({
            name: customName || originalName, // If empty, use original name
            type: 'singleLineText', // Default type, can be updated later
            order: index,
            required: false,
            unique: false,
            airtableFieldName: originalName, // Store original column label as Airtable field name
          })
          
          console.log(`💾 Creating new field: original="${originalName}", custom="${customName}"`)
        }
      })
      
      // Update configuration in Airtable
      const updateDto = {
        fields: updatedFields,
      }
      
      console.log('💾 Saving field names to Airtable...', {
        tableId,
        updateDto,
        fieldNames
      })
      
      const updatedSchema = await tableConfigurationApi.updateConfiguration(tableId, updateDto)
      
      console.log('✅ Field names saved successfully:', updatedSchema)
      console.log('📋 Saved fields:', updatedSchema.fields?.map((f: any) => ({
        id: f.id,
        name: f.name,
        airtableFieldName: f.airtableFieldName
      })))
      
      setTableSchema(updatedSchema)
      
      trackEvent({
        type: 'table.configure',
        tableId,
        changes: {
          fieldNames: fieldNames,
        },
      })
      
      // Reload configuration to ensure we have the latest data
      await loadTableConfiguration()
      
      console.log('🔄 Configuration reloaded after save')
    } catch (error) {
      console.error('Failed to save field names:', error)
      alert(`Failed to save field names: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
    } finally {
      setIsSavingSchema(false)
    }
  }

  // Handle drag start
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  // Handle drop
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null) return

    // Get the column keys from orderedColumns (visible columns in display order)
    const visibleColumnKeys = orderedColumns.map(col => col.key)
    
    // Get the dragged and drop column keys
    const draggedKey = visibleColumnKeys[draggedIndex]
    const dropKey = visibleColumnKeys[dropIndex]
    
    // If dragging to the same position, do nothing
    if (draggedKey === dropKey) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }
    
    // Create new order array
    const newOrder = [...columnOrder]
    
    // Remove the dragged item from its current position
    const draggedIndexInOrder = newOrder.indexOf(draggedKey)
    if (draggedIndexInOrder !== -1) {
      newOrder.splice(draggedIndexInOrder, 1)
    }
    
    // Find the drop position in the full columnOrder array
    const dropIndexInOrder = newOrder.indexOf(dropKey)
    
    if (dropIndexInOrder !== -1) {
      // Insert at the drop position
      // If dragging down (forward), insert after the drop target
      // If dragging up (backward), insert before the drop target
      const insertIndex = draggedIndex < dropIndex ? dropIndexInOrder + 1 : dropIndexInOrder
      newOrder.splice(insertIndex, 0, draggedKey)
    } else {
      // Drop target not found in columnOrder (shouldn't happen, but handle gracefully)
      // Just append it
      newOrder.push(draggedKey)
    }

    setColumnOrder(newOrder)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // Check if field names have been modified
  const hasFieldNameChanges = () => {
    if (!tableSchema) return false
    
    return columns.some((column) => {
      const currentName = fieldNames[column.key] || column.label
      const originalName = column.label
      
      // Check if name differs from original
      if (currentName !== originalName) return true
      
      // Check if name differs from what's in schema
      const field = tableSchema.fields?.find((f) => {
        if (f.id === column.key) return true
        if (normalizeFieldName(f.id) === normalizeFieldName(column.key)) return true
        if (f.name === column.label) return true
        if (normalizeFieldName(f.name) === normalizeFieldName(column.label)) return true
        if (f.airtableFieldName === column.label) return true
        if (f.airtableFieldName && normalizeFieldName(f.airtableFieldName) === normalizeFieldName(column.label)) return true
        if (f.airtableFieldName && normalizeFieldName(f.airtableFieldName) === normalizeFieldName(column.key)) return true
        return false
      })
      
      if (field && currentName !== field.name) return true
      
      return false
    })
  }

  // Handle save
  const handleSave = async () => {
    // Map visibility preferences: convert original field keys to resolved field keys
    const mappedVisibility: Record<string, boolean> = {}
    Object.entries(columnVisibility).forEach(([key, value]) => {
      // If this is an original field key, map it to resolved key
      const resolvedKey = linkedRecordFieldMap[key] || key
      // Only set if not already set (resolved key takes precedence)
      if (!(resolvedKey in mappedVisibility)) {
        mappedVisibility[resolvedKey] = value
      }
      // Also keep original key if it's not a linked record field
      if (!linkedRecordFieldMap[key]) {
        mappedVisibility[key] = value
      }
    })
    
    // Map column order: convert original field keys to resolved field keys
    const mappedOrder = columnOrder.map(key => {
      const resolvedKey = linkedRecordFieldMap[key] || key
      return resolvedKey
    }).filter((key, index, arr) => arr.indexOf(key) === index) // Remove duplicates
    
    // Save display preferences
    const preferences: TablePreferences = {
      columnVisibility: mappedVisibility,
      columnOrder: mappedOrder,
      defaultSort: defaultSortField
        ? { field: defaultSortField, order: defaultSortOrder }
        : undefined,
    }

    saveTablePreferences(tableId, preferences)
    
    // Save field names if they've been modified AND table configuration is available
    if (hasTableConfiguration && hasFieldNameChanges()) {
      console.log('💾 Field names have changed, saving...')
      try {
        await saveFieldNames()
        console.log('✅ Field names saved, waiting for reload...')
        // Wait a bit more to ensure backend has processed
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error) {
        console.warn('Could not save field names (display settings were still saved):', error)
        // Continue anyway - display settings are already saved
      }
    }
    
    // Track telemetry
    trackEvent({
      type: 'table.configure',
      tableId,
      changes: {
        columnVisibility,
        columnOrder,
        defaultSort: preferences.defaultSort,
        fieldNames: hasFieldNameChanges() ? fieldNames : undefined,
      },
    })

    // Notify parent BEFORE closing - this triggers the reload
    if (onPreferencesChange) {
      console.log('📢 Notifying parent component of preferences change...')
      onPreferencesChange(preferences)
      // Wait a moment for the parent to start reloading
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    console.log('🚪 Closing modal...')
    onClose()
  }

  // Map linked record fields to their resolved name fields (same as ListDetailTemplate)
  const linkedRecordFieldMap: Record<string, string> = {
    'Company': 'CompanyName',
    'User Roles': 'User Roles Name',
    'Modules': 'ModulesName',
    // Add other linked record mappings as needed
  }

  // Merge columns and allFields, removing duplicates
  // This allows users to hide/show fields that aren't in the list view
  const allAvailableFields = useMemo(() => {
    const fieldMap = new Map<string, TableColumn>()
    // First add all columns (list view fields)
    columns.forEach(col => fieldMap.set(col.key, col))
    // Then add allFields (detail view fields) if provided
    if (allFields) {
      allFields.forEach(field => {
        // Check if this is a linked record field that should map to resolved field
        const resolvedFieldKey = linkedRecordFieldMap[field.key] || field.key
        
        // Skip if the resolved field column already exists in columns
        if (linkedRecordFieldMap[field.key] && fieldMap.has(resolvedFieldKey)) {
          // Don't add the original field if resolved field exists
          return
        }
        
        // Skip if field already exists (by original key)
        if (!fieldMap.has(field.key)) {
          fieldMap.set(field.key, field)
        }
      })
    }
    return Array.from(fieldMap.values())
  }, [columns, allFields])

  // Get ordered columns - include all visible fields from allAvailableFields, not just list view columns
  const orderedColumns = useMemo(() => {
    // Get all visible fields from allAvailableFields
    // Check visibility for both original and resolved keys
    const visibleFields = allAvailableFields.filter(field => {
      const resolvedKey = linkedRecordFieldMap[field.key] || field.key
      // Check visibility of resolved key or original key
      return columnVisibility[resolvedKey] !== false || columnVisibility[field.key] !== false
    })
    
    // Create a map for quick lookup (by both original and resolved keys)
    const fieldMap = new Map<string, TableColumn>()
    allAvailableFields.forEach(field => {
      fieldMap.set(field.key, field)
      const resolvedKey = linkedRecordFieldMap[field.key]
      if (resolvedKey && resolvedKey !== field.key) {
        // Also map resolved key to the field (for lookup by resolved key)
        if (!fieldMap.has(resolvedKey)) {
          fieldMap.set(resolvedKey, field)
        }
      }
    })
    
    // Build ordered list: first use saved order, then add any visible fields not in order
    const ordered: TableColumn[] = []
    const seenKeys = new Set<string>()
    
    // First, add visible fields in the saved order
    columnOrder.forEach(key => {
      // Try to get field by key (could be original or resolved)
      let field = fieldMap.get(key)
      
      // If not found, check if it's a resolved key that maps to an original field
      if (!field) {
        const originalKey = Object.keys(linkedRecordFieldMap).find(
          origKey => linkedRecordFieldMap[origKey] === key
        )
        if (originalKey) {
          field = fieldMap.get(originalKey)
        }
      }
      
      if (field) {
        const resolvedKey = linkedRecordFieldMap[field.key] || field.key
        const isVisible = columnVisibility[resolvedKey] !== false || columnVisibility[field.key] !== false
        if (isVisible) {
          ordered.push(field)
          seenKeys.add(field.key)
          if (resolvedKey !== field.key) {
            seenKeys.add(resolvedKey)
          }
        }
      }
    })
    
    // Then, add any visible fields that weren't in the saved order
    visibleFields.forEach(field => {
      if (!seenKeys.has(field.key)) {
        const resolvedKey = linkedRecordFieldMap[field.key] || field.key
        if (!seenKeys.has(resolvedKey)) {
          ordered.push(field)
          seenKeys.add(field.key)
          if (resolvedKey !== field.key) {
            seenKeys.add(resolvedKey)
          }
        }
      }
    })
    
    return ordered
  }, [columnOrder, allAvailableFields, columnVisibility])

  // Initialize column visibility for all fields if not already set
  useEffect(() => {
    if (isOpen) {
      const prefs = getTablePreferences(tableId)
      const currentVisibility = prefs?.columnVisibility || {}
      
      // Map visibility: check both original and resolved keys, migrate old preferences
      const updatedVisibility: Record<string, boolean> = { ...currentVisibility }
      allAvailableFields.forEach(field => {
        const resolvedKey = linkedRecordFieldMap[field.key] || field.key
        
        // Check if visibility is set for resolved key or original key
        const hasResolvedVisibility = resolvedKey in updatedVisibility
        const hasOriginalVisibility = field.key in updatedVisibility
        
        // If neither is set, set default
        if (!hasResolvedVisibility && !hasOriginalVisibility) {
          // If it's in columns (list view), default to visible
          // If it's only in allFields (detail view), default to hidden
          const isInColumns = columns.some(col => col.key === field.key || col.key === resolvedKey)
          updatedVisibility[resolvedKey] = isInColumns
        } else if (hasOriginalVisibility && !hasResolvedVisibility) {
          // Migrate original key visibility to resolved key
          updatedVisibility[resolvedKey] = updatedVisibility[field.key]
          delete updatedVisibility[field.key] // Remove original to prevent duplicates
        }
      })
      
      setColumnVisibility(updatedVisibility)
      
      // Update column order to include all fields, mapping original keys to resolved keys
      const currentOrder = (prefs?.columnOrder || columns.map(col => col.key)).map(key => {
        // Map original keys to resolved keys
        return linkedRecordFieldMap[key] || key
      }).filter((key, index, arr) => arr.indexOf(key) === index) // Remove duplicates
      
      const missingFields = allAvailableFields
        .filter(field => {
          const resolvedKey = linkedRecordFieldMap[field.key] || field.key
          return !currentOrder.includes(resolvedKey)
        })
        .map(field => {
          const resolvedKey = linkedRecordFieldMap[field.key] || field.key
          return resolvedKey
        })
        .filter((key, index, arr) => arr.indexOf(key) === index) // Remove duplicates
      
      if (missingFields.length > 0) {
        setColumnOrder([...currentOrder, ...missingFields])
      } else {
        setColumnOrder(currentOrder)
      }
    }
  }, [isOpen, tableId, columns, allAvailableFields])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900 bg-opacity-30 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <h2 className="text-xl font-semibold text-neutral-900">
              Configure Table
            </h2>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-neutral-200">
            <button
              onClick={() => setActiveTab('display')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'display'
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              Display Settings
            </button>
            {hasTableConfiguration && (
              <button
                onClick={() => setActiveTab('fields')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'fields'
                    ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                Field Names
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'display' ? (
              <>
            {/* Column Visibility */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-neutral-900">
                  Column Visibility
                </h3>
                {onAutoSizeColumns && (
                  <button
                    onClick={(e) => {
                      onAutoSizeColumns()
                      // Show a brief success message
                      const button = e.currentTarget
                      const originalText = button.textContent
                      button.textContent = '✓ Auto-sized!'
                      button.classList.add('bg-green-100', 'border-green-300')
                      setTimeout(() => {
                        button.textContent = originalText
                        button.classList.remove('bg-green-100', 'border-green-300')
                      }, 1500)
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-medium px-3 py-1.5 rounded-md border border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300 transition-colors"
                    title="Auto-size all visible columns based on content"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    <span>Auto-size Columns</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-neutral-500 mb-3">
                Toggle visibility for columns in list view. Fields not in list view can also be hidden from detail panel.
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {allAvailableFields.map((field) => {
                  const isInListView = columns.some(col => col.key === field.key)
                  return (
                    <label
                      key={field.key}
                      className={`flex items-center gap-3 p-2 hover:bg-neutral-50 rounded cursor-pointer ${
                        !isInListView ? 'opacity-75' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={(() => {
                          // For linked record fields, check visibility of resolved field
                          const resolvedKey = linkedRecordFieldMap[field.key] || field.key
                          return columnVisibility[resolvedKey] ?? columnVisibility[field.key] ?? (isInListView ? true : false)
                        })()}
                        onChange={(e) => {
                          // For linked record fields, use resolved field key
                          const resolvedKey = linkedRecordFieldMap[field.key] || field.key
                          const keyToUse = resolvedKey !== field.key ? resolvedKey : field.key
                          
                          const newVisibility = {
                            ...columnVisibility,
                            [keyToUse]: e.target.checked,
                          }
                          
                          // Also remove/set the original field key to prevent duplicates
                          if (resolvedKey !== field.key) {
                            // Remove original field key visibility
                            delete newVisibility[field.key]
                          }
                          
                          setColumnVisibility(newVisibility)
                          
                          // If making field visible, add it to column order if not already there
                          if (e.target.checked && !columnOrder.includes(keyToUse)) {
                            setColumnOrder(prev => {
                              // Remove original key if it exists
                              const filtered = prev.filter(k => k !== field.key)
                              // Add resolved key
                              return [...filtered, keyToUse]
                            })
                          } else if (!e.target.checked) {
                            // Remove from order when hiding
                            setColumnOrder(prev => prev.filter(k => k !== keyToUse && k !== field.key))
                          }
                        }}
                        className="w-4 h-4 text-green-600 border-neutral-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-neutral-700 flex-1">{field.label}</span>
                      {!isInListView && (
                        <span className="text-xs text-neutral-400 italic">(Detail only)</span>
                      )}
                    </label>
                  )
                })}
              </div>
            </section>

            {/* Column Order */}
            <section>
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">
                Column Order
              </h3>
              <p className="text-xs text-neutral-500 mb-3">
                Drag and drop to reorder columns
              </p>
              <div className="space-y-2">
                {orderedColumns.map((column, index) => (
                  <div
                    key={column.key}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 p-3 border rounded-md cursor-move transition-colors ${
                      draggedIndex === index
                        ? 'opacity-50 bg-neutral-100'
                        : dragOverIndex === index
                        ? 'border-green-500 bg-green-50'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <Bars3Icon className="w-5 h-5 text-neutral-400" />
                    <span className="text-sm text-neutral-700 flex-1">
                      {column.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Default Sort */}
            <section>
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">
                Default Sort
              </h3>
              <div className="flex items-center gap-3">
                <select
                  value={defaultSortField}
                  onChange={(e) => setDefaultSortField(e.target.value)}
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">None</option>
                  {columns
                    .filter(col => col.sortable !== false)
                    .map((column) => (
                      <option key={column.key} value={column.key}>
                        {column.label}
                      </option>
                    ))}
                </select>
                {defaultSortField && (
                  <select
                    value={defaultSortOrder}
                    onChange={(e) =>
                      setDefaultSortOrder(e.target.value as 'asc' | 'desc')
                    }
                    className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                )}
              </div>
            </section>
              </>
            ) : hasTableConfiguration ? (
              <>
                {/* Field Names */}
                <section>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-3">
                    Rename Fields
                  </h3>
                  <p className="text-xs text-neutral-500 mb-4">
                    Customize field names displayed in the table. Original Airtable field names are preserved.
                  </p>
                  {isLoadingSchema ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orderedColumns.map((column) => {
                        // Find matching field in configuration
                        const field = tableSchema?.fields?.find((f) => {
                          // Match by field id
                          if (f.id === column.key) return true
                          
                          // Match by normalized field id
                          if (normalizeFieldName(f.id) === normalizeFieldName(column.key)) return true
                          
                          // Match by field name
                          if (f.name === column.label) return true
                          
                          // Match by normalized field name
                          if (normalizeFieldName(f.name) === normalizeFieldName(column.label)) return true
                          
                          // Match by airtableFieldName
                          if (f.airtableFieldName === column.label) return true
                          
                          // Match by normalized airtableFieldName
                          if (f.airtableFieldName && normalizeFieldName(f.airtableFieldName) === normalizeFieldName(column.label)) return true
                          
                          // Match by normalized airtableFieldName to column key
                          if (f.airtableFieldName && normalizeFieldName(f.airtableFieldName) === normalizeFieldName(column.key)) return true
                          
                          return false
                        })
                        
                        // Original Airtable field name (preserved in configuration)
                        // Always use the original airtableFieldName, never the current column label
                        const originalName = field?.airtableFieldName || column.label
                        // Current custom name (from fieldNames state) - allow empty string
                        const currentName = fieldNames[column.key] !== undefined ? fieldNames[column.key] : (field?.name || column.label)
                        // Whether name has been customized
                        const isCustomized = originalName !== currentName && currentName !== ''
                        
                        return (
                          <div key={column.key} className="space-y-1">
                            <label className="block text-xs font-medium text-neutral-700">
                              {originalName}
                              {isCustomized && (
                                <span className="ml-2 text-xs text-green-600 font-normal">
                                  → {currentName}
                                </span>
                              )}
                            </label>
                            <input
                              type="text"
                              value={currentName}
                              onChange={(e) => updateFieldName(column.key, e.target.value)}
                              onKeyDown={(e) => {
                                // Allow all key presses including delete/backspace
                                e.stopPropagation()
                              }}
                              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                              placeholder={`Enter custom name (original: ${originalName})`}
                            />
                            {field && (
                              <p className="text-xs text-neutral-500 mt-1">
                                Stored in Table Configuration table in Airtable
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>
              </>
            ) : null}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSavingSchema}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingSchema ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

