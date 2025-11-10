'use client'

import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react'
import React from 'react'
import { ListDetailTemplateConfig, ApiClient, SortDirection } from './types'
import { EyeIcon, ArrowPathIcon } from '../icons'
import DetailPanel from '../panels/DetailPanel'
import PanelHeader from '../panels/PanelHeader'
import DetailPanelContent from './DetailPanelContent'
import TableConfigurationPanel from '../tables/TableConfigurationPanel'
import { UpdateTableSchemaDto } from '@/lib/api/tableConfiguration'
import { tableConfigurationApi } from '@/lib/api/tableConfiguration'
import TableHeaderActions, { TableHeaderAction } from '../tables/TableHeaderActions'
import ConfigureTableModal from '../tables/ConfigureTableModal'
import { isFeatureEnabled } from '@/lib/featureFlags'
import { getTablePreferences, saveTablePreferences, TablePreferences, getColumnWidths, updateColumnWidths, updateColumnWidthsForMode, getListMode, setListMode, ListMode, getPageSize, updatePageSize } from '@/lib/tablePreferences'
import { trackEvent } from '@/lib/telemetry'
import { useResizableColumns } from '@/hooks/useResizableColumns'
import { useResizableColumnsV2, ColumnInfo, calculateAutoWidth } from '@/hooks/useResizableColumnsV2'
import ColumnResizer from '../tables/ColumnResizer'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { OptimizedTableCell } from '../tables/OptimizedTableCell'
import { TableSkeleton } from '../tables/TableSkeleton'
import { FixedSizeList } from 'react-window'
import { useTableDataCache } from '@/hooks/useTableDataCache'
import { enhanceWithCachedRelationships } from '@/lib/utils/enhanceWithCachedRelationships'

interface ListDetailTemplateProps<T = any> {
  config: ListDetailTemplateConfig<T>
}

export default function ListDetailTemplate<T extends { id: string }>({
  config,
}: ListDetailTemplateProps<T>) {
  // ALL HOOKS MUST BE CALLED FIRST - no early returns before hooks!
  // Ensure config is always defined to prevent conditional code paths
  const safeConfig = config || {}
  
  // Get user preferences for default page size (call hook first)
  const { defaultPageSize: userDefaultPageSize, loading: prefsLoading } = useUserPreferences()
  
  // Use safe defaults if config is invalid (don't return early - causes hooks error)
  if (!config || !config.apiClient) {
    console.error('ListDetailTemplate: Invalid config or missing apiClient', config)
    // Continue with defaults to ensure all hooks are called
  }
  
  const {
    entityName = 'Item',
    entityNamePlural = 'Items',
    columns = [],
    fields = [],
    filters = [],
    panel = { titleKey: 'id', sections: [] },
    apiClient,
    defaultSort,
    defaultPageSize: configDefaultPageSize = 25,
    pageSizeOptions = [10, 25, 50, 100],
    showImportExport = true,
    headerActions,
    emptyStateMessage = `No items found`,
    loadingMessage = `Loading items...`,
  } = safeConfig
  
  // Data state - ALL hooks must be called unconditionally
  // Use consistent initial state to prevent hydration mismatches
  const [items, setItems] = useState<T[]>([])
  const [selectedItem, setSelectedItem] = useState<T | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  
  // Track mount state to prevent hydration mismatches
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Feature flags - declare early so they can be used in useEffect hooks
  const isTableConfigurationEnabled = isFeatureEnabled('tableConfiguration')
  const isDetailPanelLayoutEnabled = isFeatureEnabled('detailPanelLayout')
  const isLoadingProgressBarEnabled = isFeatureEnabled('loadingProgressBar')
  const isColumnAutoSizingEnabled = isFeatureEnabled('columnAutoSizing')
  
  // Delay showing loading indicator to avoid flash for quick loads (only if feature enabled)
  useEffect(() => {
    if (!isLoadingProgressBarEnabled) {
      setShowLoadingIndicator(false)
      return
    }
    
    let timeoutId: NodeJS.Timeout | null = null
    
    if (isLoading) {
      // Only show progress bar if loading takes longer than 600ms
      timeoutId = setTimeout(() => {
        setShowLoadingIndicator(true)
      }, 600)
    } else {
      // Reset immediately when loading completes
      setShowLoadingIndicator(false)
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [isLoading, isLoadingProgressBarEnabled])

  // Pagination state - use user default with per-table override support
  const effectiveDefaultPageSize = getPageSize(entityNamePlural, userDefaultPageSize || configDefaultPageSize || 25)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(effectiveDefaultPageSize)

  // Update pageSize when user preferences change (but not if user has set a per-table override)
  useEffect(() => {
    if (!prefsLoading && userDefaultPageSize) {
      const currentTablePageSize = getTablePreferences(entityNamePlural)?.pageSize
      // Only update if no per-table override exists
      if (!currentTablePageSize) {
        setPageSize(userDefaultPageSize)
      }
    }
  }, [prefsLoading, userDefaultPageSize, entityNamePlural])

  // Track when pageSize changes to force re-evaluation of reset icon visibility
  const [pageSizeChangeTrigger, setPageSizeChangeTrigger] = useState(0)
  
  // Compute whether to show reset icon (memoized to avoid unnecessary re-renders)
  const shouldShowResetIcon = useMemo(() => {
    const tablePrefs = getTablePreferences(entityNamePlural)
    const storedPageSize = tablePrefs?.pageSize
    const effectiveDefault = !prefsLoading && userDefaultPageSize 
      ? userDefaultPageSize 
      : (configDefaultPageSize || 25)
    
    // Show reset icon if:
    // 1. There's a stored override in localStorage (even if it matches current pageSize), OR
    // 2. Current pageSize differs from effective default
    const hasOverride = storedPageSize !== undefined
    const differsFromDefault = pageSize !== effectiveDefault
    return hasOverride || differsFromDefault
  }, [pageSize, prefsLoading, userDefaultPageSize, configDefaultPageSize, entityNamePlural, pageSizeChangeTrigger])
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  
  // Prefetch cache for next page
  const prefetchCacheRef = useRef<Map<string, T[]>>(new Map())
  
  // Virtual scrolling feature flag
  const isVirtualScrollingEnabled = isFeatureEnabled('tableVirtualScrolling')
  const isPrefetchingEnabled = isFeatureEnabled('tablePrefetching')
  const isDataCachingEnabled = isFeatureEnabled('tableDataCaching')
  
  // Virtual scrolling threshold (from env or default to 100)
  const virtualScrollThreshold = parseInt(
    process.env.NEXT_PUBLIC_TABLE_VIRTUAL_SCROLL_THRESHOLD || '100',
    10
  )
  
  // Data caching configuration
  const cacheStaleTime = parseInt(
    process.env.NEXT_PUBLIC_TABLE_CACHE_STALE_TIME || '300000', // 5 minutes
    10
  )

  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState<string>(defaultSort?.field || '')
  const [sortOrder, setSortOrder] = useState<SortDirection>(defaultSort?.order || 'asc')

  // Filter options state
  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({})
  const [isLoadingFilters, setIsLoadingFilters] = useState(true)

  // Search suggestions
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])

  // Feature flag check - must be defined before useState initializers that use it
  const isTableActionsV2Enabled = isFeatureEnabled('tableActionsV2')

  // Column visibility - load from preferences if feature enabled
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    if (isTableActionsV2Enabled) {
      const prefs = getTablePreferences(entityNamePlural)
      if (prefs?.columnVisibility) {
        // Merge with defaults
        const visibility: Record<string, boolean> = {}
        columns.forEach(col => {
          visibility[col.key] = prefs.columnVisibility[col.key] ?? true
        })
        return visibility
      }
    }
    const visibility: Record<string, boolean> = {}
    columns.forEach(col => {
      visibility[col.key] = true
    })
    return visibility
  })
  
  // Track column order changes to trigger re-render
  const [columnOrderKey, setColumnOrderKey] = useState(0)
  
  // Utility controls
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)

  // Table configuration state
  const [tableConfiguration, setTableConfiguration] = useState<any>(null)
  const [isLoadingConfiguration, setIsLoadingConfiguration] = useState(false)
  const [configRefreshKey, setConfigRefreshKey] = useState(0)

  // Hover state for eye icon
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  // Configure table modal state
  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false)

  // Load table configuration on mount and when entity changes (only if feature enabled)
  useEffect(() => {
    if (!isTableConfigurationEnabled) {
      setTableConfiguration(null)
      return
    }
    
    const loadConfiguration = async () => {
      try {
        setIsLoadingConfiguration(true)
        console.log(`🔄 Loading table configuration for: ${entityNamePlural}`)
        const config = await tableConfigurationApi.getConfiguration(entityNamePlural)
        if (config) {
          console.log(`✅ Loaded table configuration for ${entityNamePlural}:`, config)
          console.log('📋 Configuration fields:', config.fields?.map((f: any) => ({
            id: f.id,
            original: f.airtableFieldName,
            custom: f.name,
            hasOriginal: !!f.airtableFieldName,
            hasCustom: !!f.name
          })))
          // Create new object reference to trigger re-render
          setTableConfiguration({ ...config, _loadedAt: Date.now() })
          // Force refresh key update multiple times to ensure React processes it
          setConfigRefreshKey(prev => prev + 1)
          setTimeout(() => setConfigRefreshKey(prev => prev + 1), 100)
          setTimeout(() => setConfigRefreshKey(prev => prev + 1), 300)
        } else {
          console.log(`⚠️ No table configuration found for ${entityNamePlural}, using default config`)
          setTableConfiguration(null)
        }
      } catch (error) {
        // Configuration doesn't exist yet - that's okay, use default config
        console.log(`⚠️ No table configuration found for ${entityNamePlural}, using default config:`, error)
        setTableConfiguration(null)
      } finally {
        setIsLoadingConfiguration(false)
      }
    }
    loadConfiguration()
  }, [entityNamePlural, isTableConfigurationEnabled])

  // Helper function to normalize field names for matching
  const normalizeFieldName = (name: string): string => {
    return name.toLowerCase().replace(/[_\s-]/g, '')
  }

  // Apply configuration to columns and fields
  // NOTE: This now works completely independently of table configuration
  // Table configuration is only used for optional field name renaming
  const configuredColumns = useMemo(() => {
    console.log('🔄 Computing configuredColumns (independent of table config)...', {
      columnsCount: columns.length,
      detailFieldsCount: fields.length,
      columnOrderKey,
      columnLabels: columns.map(c => c.label),
      columnKeys: columns.map(c => c.key)
    })
    
    // Get column visibility and order preferences (stored in localStorage)
    const prefs = getTablePreferences(entityNamePlural)
    const visibility = prefs?.columnVisibility || {}
    
    // Start with all columns from config (list view)
    const allColumnsMap = new Map(columns.map(col => [col.key, col]))
    
    // Map linked record fields to their resolved name fields
    const linkedRecordFieldMap: Record<string, string> = {
      'Company': 'CompanyName',
      'User Roles': 'User Roles Name',
      'Modules': 'ModulesName',
      // Add other linked record mappings as needed
    }
    
    // Add visible fields from config.fields that aren't already in columns
    // These are fields that can be made visible in list view via configure modal
    fields.forEach(field => {
      // Check if this is a linked record field that should use resolved names
      const resolvedFieldKey = linkedRecordFieldMap[field.key] || field.key
      
      // Skip if the resolved field column already exists OR if the original field key already exists
      // This prevents duplicates when both the original field and resolved field are in columns
      if (allColumnsMap.has(resolvedFieldKey) || allColumnsMap.has(field.key)) {
        // If the resolved field already exists, ensure it's visible if the original field is visible
        if (allColumnsMap.has(resolvedFieldKey)) {
          const isVisible = visibility[field.key] !== false && visibility[field.key] !== undefined
            ? visibility[field.key]
            : false
          // The resolved column already exists, so we don't need to add it again
          // Just ensure visibility is handled correctly (done in visibility filter later)
          return
        }
        // If the original field key exists, skip (shouldn't happen for linked records, but safety check)
        return
      }
      
      // Check visibility - use original field key for visibility check
      const isVisible = visibility[field.key] !== false && visibility[field.key] !== undefined
        ? visibility[field.key]
        : false // Default to hidden for fields not originally in list view
      
      if (isVisible) {
        // Check if there's a column config for the resolved field (e.g., "User Roles Name")
        const resolvedColumn = columns.find(col => col.key === resolvedFieldKey)
        
        if (resolvedColumn) {
          // Use the resolved column config (has proper render function for badges)
          // But only if it's not already in the map (double-check)
          if (!allColumnsMap.has(resolvedFieldKey)) {
            allColumnsMap.set(resolvedFieldKey, resolvedColumn)
            console.log(`✅ Using resolved column "${resolvedFieldKey}" for field "${field.key}"`)
          }
        } else {
          // Create a column config from the field config
          // For linked records, try to use the resolved field key
          const columnKey = resolvedFieldKey !== field.key ? resolvedFieldKey : field.key
          
          // Double-check we're not adding a duplicate
          if (!allColumnsMap.has(columnKey)) {
            allColumnsMap.set(columnKey, {
              key: columnKey,
              label: field.label,
              sortable: false, // Fields from detail view are not sortable by default
              align: 'left',
              render: (value: any, item: any) => {
                // For linked records, try to get resolved names from item
                if (field.type === 'choiceList' && linkedRecordFieldMap[field.key]) {
                  const resolvedKey = linkedRecordFieldMap[field.key]
                  const resolvedValue = item[resolvedKey]
                  
                  // If we have resolved names, display as badges
                  if (resolvedValue) {
                    let namesArray: string[] = []
                    if (Array.isArray(resolvedValue)) {
                      namesArray = resolvedValue.filter(Boolean).filter((n: string) => n && !n.startsWith('rec'))
                    } else if (typeof resolvedValue === 'string' && resolvedValue !== '' && !resolvedValue.startsWith('rec')) {
                      namesArray = [resolvedValue]
                    }
                    
                    if (namesArray.length > 0) {
                      return (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {namesArray.map((name, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      )
                    }
                  }
                  
                  // If no resolved names but we have IDs, show loading
                  const hasIds = value && (
                    Array.isArray(value) 
                      ? value.length > 0 && value.some((id: string) => id && typeof id === 'string' && id.startsWith('rec'))
                      : typeof value === 'string' && value.startsWith('rec')
                  )
                  
                  if (hasIds) {
                    return (
                      <span className="text-sm text-neutral-400 italic">
                        Loading...
                      </span>
                    )
                  }
                }
                
                // Default rendering for non-linked fields
                return (
                  <span className="text-sm text-neutral-700">
                    {value || '—'}
                  </span>
                )
              },
            })
          }
        }
      }
    })
    
    // Get all available columns (original + newly visible fields)
    let allAvailableColumns = Array.from(allColumnsMap.values())
    
    // OPTIONAL: Apply custom field names from table configuration (if available)
    // This is completely optional and doesn't affect visibility or order
    if (tableConfiguration?.fields && tableConfiguration.fields.length > 0) {
      // Create a map: key is normalized original field name, value is custom name
      const configMap = new Map<string, string>()
      tableConfiguration.fields.forEach((field: any) => {
        const originalKey = field.airtableFieldName || field.name
        const customName = field.name
        
        if (originalKey && customName) {
          const normalizedOriginal = normalizeFieldName(originalKey)
          configMap.set(normalizedOriginal, customName)
          configMap.set(originalKey, customName)
          
          if (field.id) {
            configMap.set(normalizeFieldName(field.id), customName)
            configMap.set(field.id, customName)
          }
          
          if (field.name && field.name !== originalKey) {
            configMap.set(normalizeFieldName(field.name), customName)
            configMap.set(field.name, customName)
          }
        }
      })
      
      // Apply custom names (optional - only if table config exists)
      allAvailableColumns = allAvailableColumns.map(col => {
        let customName = configMap.get(col.label) ||
                        configMap.get(normalizeFieldName(col.label)) ||
                        configMap.get(col.key) ||
                        configMap.get(normalizeFieldName(col.key))
        
        if (customName && customName !== col.label) {
          return { ...col, label: customName }
        }
        return col
      })
    }
    
    // Apply column visibility filtering (filter out hidden columns)
    // Also check visibility for original field keys (e.g., "User Roles" visibility applies to "User Roles Name")
    // IMPORTANT: Hide original field columns if their resolved columns exist and are visible
    const visibleResult = allAvailableColumns.filter(col => {
      // If this is an original field key (e.g., "User Roles"), check if resolved column exists
      if (linkedRecordFieldMap[col.key]) {
        const resolvedKey = linkedRecordFieldMap[col.key]
        // If resolved column exists in allAvailableColumns, hide the original
        if (allAvailableColumns.some(c => c.key === resolvedKey)) {
          // Check if resolved column is visible
          const resolvedCol = allAvailableColumns.find(c => c.key === resolvedKey)
          if (resolvedCol) {
            const resolvedVisible = visibility[resolvedKey] !== false || 
                                   visibility[col.key] !== false
            if (resolvedVisible) {
              // Hide original, show resolved instead
              return false
            }
          }
        }
      }
      
      // Check direct visibility
      if (visibility[col.key] !== false) {
        return true
      }
      
      // Check if this is a resolved field and the original field is visible
      const originalFieldKey = Object.keys(linkedRecordFieldMap).find(
        key => linkedRecordFieldMap[key] === col.key
      )
      if (originalFieldKey && visibility[originalFieldKey] !== false) {
        return true
      }
      
      return false
    })
    
    // Apply column order from preferences (works independently of table config)
    if (prefs?.columnOrder && prefs.columnOrder.length > 0) {
      console.log('🔄 Applying column order from preferences:', {
        savedOrder: prefs.columnOrder,
        visibleColumns: visibleResult.map(col => col.key),
        entityName: entityNamePlural
      })
      
      // Create a map for quick lookup
      const columnMap = new Map(visibleResult.map(col => [col.key, col]))
      
      // Reorder columns based on saved order
      const orderedColumns: typeof visibleResult = []
      const seenKeys = new Set<string>()
      
      // First, add visible columns in the saved order
      prefs.columnOrder.forEach(key => {
        // Check if this is an original field key that should map to resolved field
        const resolvedKey = linkedRecordFieldMap[key] || key
        
        // Try to get column by resolved key first, then by original key
        let col = columnMap.get(resolvedKey)
        if (!col) {
          col = columnMap.get(key)
        }
        
        if (col) {
          // Check visibility (also check original field key visibility)
          const isVisible = visibility[col.key] !== false || 
                           (linkedRecordFieldMap[key] && visibility[key] !== false)
          
          if (isVisible) {
            orderedColumns.push(col)
            seenKeys.add(col.key)
            if (key !== col.key) {
              seenKeys.add(key) // Also mark original key as seen
            }
            console.log(`  ✅ Added column "${col.key}" (${col.label}) at position ${orderedColumns.length - 1}${key !== col.key ? ` (mapped from "${key}")` : ''}`)
          } else {
            console.log(`  ⚠️ Skipped column "${key}" -> "${col.key}" - not visible`)
          }
        } else {
          console.log(`  ⚠️ Column "${key}" not found in visible columns`)
        }
      })
      
      // Then, add any visible columns that weren't in the saved order (new columns)
      visibleResult.forEach(col => {
        if (!seenKeys.has(col.key)) {
          orderedColumns.push(col)
          console.log(`  ➕ Added new column "${col.key}" (${col.label}) at end`)
        }
      })
      
      console.log('✅ Configured columns result (after ordering):', orderedColumns.map((col, idx) => ({
        index: idx,
        key: col.key,
        label: col.label
      })))
      
      return orderedColumns
    }
    
    console.log('ℹ️ No column order in preferences, using default order')
    return visibleResult
  }, [columns, fields, columnOrderKey, entityNamePlural, columnVisibility, tableConfiguration?.fields, configRefreshKey])

  // Column resizing - check feature flag
  const isColumnResizeV2Enabled = isFeatureEnabled('columnResizeV2')
  
  // List mode for column width persistence
  const [listMode, setListModeState] = useState<ListMode>(() => {
    if (isColumnResizeV2Enabled) {
      return getListMode(entityNamePlural)
    }
    return 'comfortable'
  })

  // Column widths - load from preferences and manage resizing (after configuredColumns)
  const visibleColumnKeys = useMemo(() => 
    configuredColumns.filter(col => columnVisibility[col.key] !== false).map(col => col.key),
    [configuredColumns, columnVisibility]
  )

  // Determine column alignment based on type
  const getColumnAlignment = useCallback((column: any): 'left' | 'center' | 'right' => {
    // If explicit align is set, use it
    if (column.align) return column.align
    
    // Auto-determine based on type
    const type = column.type || 'text'
    switch (type) {
      case 'number':
      case 'currency':
        return 'right'
      case 'date':
        return 'right' // Default to end, can be overridden
      case 'boolean':
      case 'icon':
        return 'center'
      case 'text':
      default:
        return 'left'
    }
  }, [])

  // Prepare column info for resizing
  const columnInfo = useMemo<ColumnInfo[]>(() => {
    return configuredColumns
      .filter(col => columnVisibility[col.key] !== false)
      .map(col => ({
        key: col.key,
        minWidth: col.minWidth || 60,
        maxWidth: col.maxWidth || 800,
        defaultWidth: col.defaultWidth || 150,
        type: col.type || 'text',
      }))
  }, [configuredColumns, columnVisibility])

  // Use V2 resizing if enabled, otherwise fallback to V1
  const savedWidths = useMemo(() => {
    if (isColumnResizeV2Enabled) {
      return getColumnWidths(entityNamePlural, listMode) || {}
    } else if (isTableActionsV2Enabled) {
      return getColumnWidths(entityNamePlural) || {}
    }
    return {}
  }, [entityNamePlural, isTableActionsV2Enabled, isColumnResizeV2Enabled, listMode])

  const v2Resizing = useResizableColumnsV2(
    visibleColumnKeys,
    columnInfo,
    savedWidths,
    listMode,
    items.slice(0, 10) // Sample data for auto-sizing
  )

  const v1Resizing = useResizableColumns(visibleColumnKeys, savedWidths)

  // Use V2 if enabled, otherwise V1
  const resizing = isColumnResizeV2Enabled ? v2Resizing : v1Resizing
  const {
    columnWidths,
    setColumnWidths,
    resizingColumn,
    handleResizeStart,
    focusedResizer = null,
    setFocusedResizer = () => {},
    handleAutoSize = () => {},
    handleDoubleClick = () => {},
    handleKeyboardResize = () => {},
  } = resizing

  // Track if we've initialized widths to prevent re-initialization
  const widthsInitializedRef = useRef(false)
  
  // Sync column widths with saved widths on mount
  // Use useLayoutEffect to prevent layout shift by applying widths before paint
  // IMPORTANT: Always call useLayoutEffect to ensure consistent hook order
  useLayoutEffect(() => {
    // Only initialize once to prevent layout shifts
    if (!widthsInitializedRef.current && Object.keys(savedWidths).length > 0) {
      widthsInitializedRef.current = true
      setColumnWidths(prev => {
        // Merge saved widths with existing, only updating keys that exist in savedWidths
        const merged = { ...prev }
        Object.keys(savedWidths).forEach(key => {
          if (savedWidths[key] !== undefined && savedWidths[key] !== prev[key]) {
            merged[key] = savedWidths[key]
          }
        })
        return merged
      })
    }
  }, [setColumnWidths, savedWidths]) // Include deps to ensure consistent hook calls

  // Save column widths when they change
  useEffect(() => {
    if (isColumnResizeV2Enabled && Object.keys(columnWidths).length > 0) {
      updateColumnWidthsForMode(entityNamePlural, listMode, columnWidths)
    } else if (isTableActionsV2Enabled && Object.keys(columnWidths).length > 0) {
      updateColumnWidths(entityNamePlural, columnWidths)
    }
  }, [columnWidths, entityNamePlural, isTableActionsV2Enabled, isColumnResizeV2Enabled, listMode])

  const configuredFields = useMemo(() => {
    if (!tableConfiguration || !tableConfiguration.fields) {
      return fields
    }
    
    // Create a map: key is normalized original field name, value is custom name
    const configMap = new Map<string, string>()
    tableConfiguration.fields.forEach((field: any) => {
      const originalKey = field.airtableFieldName || field.name
      const customName = field.name
      if (originalKey && customName) {
        // Store by normalized original name for matching
        const normalizedOriginal = normalizeFieldName(originalKey)
        configMap.set(normalizedOriginal, customName)
        // Also store by exact original for exact matches
        configMap.set(originalKey, customName)
      }
    })
    
    // Apply custom names to fields
    return fields.map(field => {
      // Try matching by normalized field key
      let customName = configMap.get(normalizeFieldName(field.key))
      
      // If not found, try matching by normalized field label
      if (!customName) {
        customName = configMap.get(normalizeFieldName(field.label))
      }
      
      // If not found, try exact match on key
      if (!customName) {
        customName = configMap.get(field.key)
      }
      
      // If not found, try exact match on label
      if (!customName) {
        customName = configMap.get(field.label)
      }
      
      // Apply custom name if found and different
      if (customName && customName !== field.label) {
        return { ...field, label: customName }
      }
      return field
    })
  }, [fields, tableConfiguration])


  // Debounced search (300ms as per optimization spec)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])
  
  // Debounced filter changes (200ms as per optimization spec)
  const [debouncedFilters, setDebouncedFilters] = useState<Record<string, string>>({})
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(activeFilters)
      setCurrentPage(1)
      // Clear prefetch cache when filters change (to avoid stale data)
      if (isPrefetchingEnabled) {
        prefetchCacheRef.current.clear()
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [activeFilters, isPrefetchingEnabled])
  
  // Clear prefetch cache when search changes
  useEffect(() => {
    if (isPrefetchingEnabled && debouncedSearch) {
      // Only clear cache related to this search query
      const keysToDelete: string[] = []
      for (const key of prefetchCacheRef.current.keys()) {
        if (key.includes(debouncedSearch)) {
          keysToDelete.push(key)
        }
      }
      keysToDelete.forEach(key => prefetchCacheRef.current.delete(key))
    }
  }, [debouncedSearch, isPrefetchingEnabled])

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      setIsLoadingFilters(true)
      try {
        const options: Record<string, string[]> = {}
        
        for (const filter of filters) {
          if (typeof filter.options === 'function') {
            options[filter.key] = await filter.options()
          } else {
            options[filter.key] = filter.options
          }
        }
        
        setFilterOptions(options)
      } catch (err) {
        console.error('Error loading filter options:', err)
      } finally {
        setIsLoadingFilters(false)
      }
    }

    if (filters.length > 0) {
      loadFilterOptions()
    } else {
      setIsLoadingFilters(false)
    }
  }, [filters])

  // Create fetch function for data caching hook (returns just the data array)
  // Must be defined even if apiClient is missing to ensure hooks are called consistently
  const fetchItemsData = useCallback(async (): Promise<T[]> => {
    try {
      if (!apiClient || !apiClient.getPaginated) {
        console.error('API client is not available')
        return []
      }
      
      const result = await apiClient.getPaginated({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch || undefined,
        sortBy: sortBy || undefined,
        sortOrder: sortOrder || undefined,
        filters: Object.keys(debouncedFilters).length > 0 ? debouncedFilters : undefined,
      })
      
      // Update pagination info (side effect)
      if (result?.pagination) {
        setTotalCount(result.pagination.total)
        setHasMore(result.pagination.hasMore)
      }
      
      return result?.data || []
    } catch (err) {
      console.error('Error fetching items:', err)
      setError(err instanceof Error ? err.message : 'Failed to load items')
      return []
    }
  }, [currentPage, pageSize, debouncedSearch, sortBy, sortOrder, debouncedFilters, apiClient])
  
  // Use data caching hook if enabled (stale-while-revalidate pattern)
  // ALWAYS call the hook, even if apiClient is missing (pass safe fallback function)
  const cacheKey = `${entityNamePlural}-page-${currentPage}-${debouncedSearch}-${JSON.stringify(debouncedFilters)}-${sortBy}-${sortOrder}`
  const safeFetchFn = apiClient ? fetchItemsData : async () => []
  const { 
    data: cachedItemsData, 
    isLoading: isCacheLoading, 
    isRefreshing: isCacheRefreshing,
    invalidate: invalidateCache 
  } = useTableDataCache<T>(
    // Always call hook, but pass safe function if apiClient is missing
    isDataCachingEnabled ? safeFetchFn : async () => [],
    cacheKey,
    {
      staleTime: cacheStaleTime,
      cacheTime: cacheStaleTime * 2, // Cache time is double stale time
    }
  )
  
  // Update items when cached data changes (from data caching hook)
  useEffect(() => {
    if (isDataCachingEnabled && cachedItemsData.length > 0) {
      // Enhance with cached relationship names for better performance
      const enhanced = enhanceWithCachedRelationships(cachedItemsData as any[])
      setItems(enhanced as T[])
      setIsLoading(isCacheLoading)
      
      // Generate search suggestions from cached items
      const titleField = columns.find(col => col.key === panel.titleKey)
      if (titleField) {
        const suggestions = cachedItemsData
          .map(item => (item as any)[panel.titleKey])
          .filter(Boolean)
          .slice(0, 10)
        setSearchSuggestions(suggestions)
      }
    }
  }, [cachedItemsData, isCacheLoading, isDataCachingEnabled, columns, panel.titleKey])
  
  // Note: Cache invalidation is handled automatically by the hook when cacheKey changes
  // The cacheKey includes all relevant parameters, so changing them creates a new key
  // and the hook fetches fresh data. No manual invalidation needed for normal operation.
  
  // Load items (fallback when data caching is disabled)
  const loadItems = useCallback(async () => {
    // If data caching is enabled, the hook handles loading
    if (isDataCachingEnabled) {
      return
    }
    
    try {
      setIsLoading(true)
      setError(null)

      // Check prefetch cache first
      const cachedData = prefetchCacheRef.current.get(cacheKey)
      
      if (cachedData && isPrefetchingEnabled) {
        // Use cached data immediately for instant display (enhanced with relationship cache)
        const enhanced = enhanceWithCachedRelationships(cachedData as any[])
        setItems(enhanced as T[])
        setIsLoading(false)
        
        // Still fetch in background to get fresh data and pagination info
        apiClient.getPaginated({
          page: currentPage,
          limit: pageSize,
          search: debouncedSearch || undefined,
          sortBy: sortBy || undefined,
          sortOrder: sortOrder || undefined,
          filters: Object.keys(debouncedFilters).length > 0 ? debouncedFilters : undefined,
        })
          .then(result => {
            setTotalCount(result.pagination.total)
            setHasMore(result.pagination.hasMore)
            // Update cache and items with fresh data (enhanced with relationship cache)
            const enhanced = enhanceWithCachedRelationships(result.data as any[])
            prefetchCacheRef.current.set(cacheKey, enhanced)
            setItems(enhanced as T[])
          })
          .catch(err => {
            // If fetch fails, keep using cached data
            console.warn('Failed to refresh cached data:', err)
          })
        return
      }

      const result = await apiClient.getPaginated({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch || undefined,
        sortBy: sortBy || undefined,
        sortOrder: sortOrder || undefined,
        filters: Object.keys(debouncedFilters).length > 0 ? debouncedFilters : undefined,
      })

      // Enhance with cached relationship names for better performance
      const enhanced = enhanceWithCachedRelationships(result.data as any[])
      setItems(enhanced as T[])
      setTotalCount(result.pagination.total)
      setHasMore(result.pagination.hasMore)
      
      // Cache the result for future use (use enhanced data)
      if (isPrefetchingEnabled) {
        prefetchCacheRef.current.set(cacheKey, enhanced)
      }

      // Generate search suggestions from loaded items
      const titleField = columns.find(col => col.key === panel.titleKey)
      if (titleField) {
        const suggestions = result.data
          .map(item => (item as any)[panel.titleKey])
          .filter(Boolean)
          .slice(0, 10)
        setSearchSuggestions(suggestions)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to load ${entityNamePlural.toLowerCase()}`
      setError(errorMessage)
      console.error(`Error loading ${entityNamePlural.toLowerCase()}:`, err)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, debouncedSearch, sortBy, sortOrder, debouncedFilters, apiClient, columns, panel.titleKey, entityNamePlural, isPrefetchingEnabled])

  // Load items when dependencies change
  useEffect(() => {
    loadItems()
  }, [loadItems])
  
  // Prefetch next page if enabled and available
  useEffect(() => {
    if (!apiClient || !isPrefetchingEnabled || isLoading || !hasMore || currentPage >= Math.ceil(totalCount / pageSize)) {
      return
    }
    
    const nextPage = currentPage + 1
    const cacheKey = `${entityNamePlural}-page-${nextPage}-${debouncedSearch}-${JSON.stringify(debouncedFilters)}-${sortBy}-${sortOrder}`
    
    // Only prefetch if not already cached
    if (!prefetchCacheRef.current.has(cacheKey)) {
      // Prefetch in background (don't show loading state)
      apiClient.getPaginated({
        page: nextPage,
        limit: pageSize,
        search: debouncedSearch || undefined,
        sortBy: sortBy || undefined,
        sortOrder: sortOrder || undefined,
        filters: Object.keys(debouncedFilters).length > 0 ? debouncedFilters : undefined,
      })
        .then(result => {
          // Cache the prefetched data
          prefetchCacheRef.current.set(cacheKey, result.data)
        })
        .catch(error => {
          // Silently fail - prefetch is optional
          console.debug('Prefetch failed (non-critical):', error)
        })
    }
  }, [currentPage, hasMore, totalCount, pageSize, isPrefetchingEnabled, isLoading, debouncedSearch, debouncedFilters, sortBy, sortOrder, apiClient, entityNamePlural])

  // Handle item click with telemetry
  const handleItemClick = useCallback(async (item: T, event?: React.MouseEvent) => {
    // Prevent default browser behavior (navigation, link following, etc.)
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    
    try {
      // Fetch full item details (if apiClient is available)
      if (apiClient && apiClient.getById) {
        const fullItem = await apiClient.getById(item.id)
        setSelectedItem(fullItem)
      } else {
        // Fallback to item from list if apiClient is not available
        setSelectedItem(item)
      }
      setIsPanelOpen(true)
      // Track telemetry
      trackEvent({
        type: 'table.preview_opened',
        tableId: entityNamePlural,
        recordId: item.id,
      })
    } catch (err) {
      console.error(`Error loading ${entityName.toLowerCase()} details:`, err)
      // Fallback to item from list
      setSelectedItem(item)
      setIsPanelOpen(true)
      // Track telemetry even on error
      trackEvent({
        type: 'table.preview_opened',
        tableId: entityNamePlural,
        recordId: item.id,
      })
    }
  }, [apiClient, entityName, entityNamePlural])

  // Handle panel close
  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false)
    setSelectedItem(null)
  }, [])

  // Handle sort
  const handleSort = useCallback((field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }, [sortBy, sortOrder])

  // Handle filter change
  const handleFilterChange = useCallback((key: string, value: string) => {
    setActiveFilters(prev => {
      const updated = { ...prev }
      if (value) {
        updated[key] = value
      } else {
        delete updated[key]
      }
      return updated
    })
    setCurrentPage(1)
  }, [])

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setActiveFilters({})
    setSearchQuery('')
    setCurrentPage(1)
  }, [])

  // Handle delete
  const handleDelete = useCallback(async (id: string) => {
    if (!apiClient || !apiClient.delete) {
      alert(`Cannot delete: API client is not available`)
      return
    }
    
    if (!confirm(`Are you sure you want to delete this ${entityName.toLowerCase()}?`)) {
      return
    }

    try {
      await apiClient.delete(id)
      handleClosePanel()
      loadItems()
    } catch (err) {
      console.error(`Error deleting ${entityName.toLowerCase()}:`, err)
      alert(`Failed to delete ${entityName.toLowerCase()}`)
    }
  }, [apiClient, entityName, handleClosePanel, loadItems])

  // Optimistic update state
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, Partial<T>>>(new Map())
  const [updateErrors, setUpdateErrors] = useState<Map<string, Error>>(new Map())

  // Handle update (or create if id is empty) with optimistic updates
  const handleUpdate = useCallback(async (id: string, data: Partial<T>) => {
    if (!apiClient) {
      console.error('Cannot update: API client is not available')
      alert(`Cannot update: API client is not available`)
      return
    }
    
    try {
      if (!id || id === '') {
        // Create new item - no optimistic update for creates
        if (!apiClient.create) {
          alert(`Cannot create: API client does not support create operation`)
          return
        }
        const newItem = await apiClient.create(data)
        await loadItems()
        setSelectedItem(newItem)
        return
      }

      if (!apiClient.update) {
        alert(`Cannot update: API client does not support update operation`)
        return
      }

      // Optimistic update: immediately update UI
      const optimisticItem = { ...selectedItem, ...data } as T
      
      // For linked record fields (like greenHouseGas), clear the resolved name fields
      // so we don't show stale names. The resolved names will be set when we get the server response.
      const optimisticData = { ...data }
      if ('greenHouseGas' in data) {
        // Clear the resolved name so we don't show stale data
        optimisticData.greenHouseGasName = undefined
      }
      if ('protocol' in data) {
        optimisticData.protocolName = undefined
      }
      if ('efDetailedG' in data) {
        optimisticData.efDetailedGName = undefined
      }
      
      // Update selected item immediately
      if (selectedItem?.id === id) {
        setSelectedItem({ ...selectedItem, ...optimisticData } as T)
      }

      // Update items list immediately (with cleared resolved names to avoid showing stale data)
      setItems(prevItems => 
        prevItems.map(item => {
          if (item.id === id) {
            const updated = { ...item, ...optimisticData }
            return updated
          }
          return item
        })
      )

      // Clear any previous error for this item
      setUpdateErrors(prev => {
        const next = new Map(prev)
        next.delete(id)
        return next
      })

      // Track pending update
      setPendingUpdates(prev => {
        const next = new Map(prev)
        const existing = next.get(id) || {}
        next.set(id, { ...existing, ...data })
        return next
      })

      // Save to Airtable in background (don't await immediately)
      const savePromise = apiClient.update(id, data)
        .then(async (updated) => {
          console.log(`✅ Update successful for ${entityName} ${id}:`, Object.keys(data).join(', '))
          console.log(`   Updated record Company field:`, (updated as any)?.Company)
          
          // Merge the update response with the data we sent to ensure all fields are preserved
          // This is important because the update response might not include all fields
          const mergedResponse = { ...updated, ...data } as T
          
          // After update, fetch the full record with resolved relationships
          // Add a small delay to ensure Airtable has committed the changes
          let fullyResolved = mergedResponse
          try {
            // Wait a bit for Airtable to commit the changes
            await new Promise(resolve => setTimeout(resolve, 500))
            
            const resolved = await apiClient.getById(id)
            if (resolved) {
              console.log(`   Fetched record Company field:`, (resolved as any)?.Company)
              // CRITICAL: Merge our update data LAST to ensure Company field from update is preserved
              // The resolved data might be stale or missing the Company field, so prioritize our update data
              fullyResolved = { ...resolved, ...data } as T
              
              // Double-check: if Company was in our update but missing in resolved, ensure it's set
              if (data.Company !== undefined && (!(fullyResolved as any).Company || (fullyResolved as any).Company.length === 0)) {
                console.warn(`   ⚠️ Company field missing in resolved data, preserving from update:`, data.Company)
                ;(fullyResolved as any).Company = data.Company
              }
            }
          } catch (err) {
            console.warn('Could not fetch resolved record after update, using update response:', err)
            // Fall back to merged response if getById fails
            fullyResolved = mergedResponse
          }
          
          console.log(`   Final resolved Company field:`, (fullyResolved as any)?.Company)
          
          // On success, update with fully resolved server response
          if (selectedItem?.id === id) {
            setSelectedItem(fullyResolved)
          }
          
          // Update items list with fully resolved server response
          setItems(prevItems => 
            prevItems.map(item => 
              item.id === id ? fullyResolved : item
            )
          )

          // Remove from pending updates
          setPendingUpdates(prev => {
            const next = new Map(prev)
            next.delete(id)
            return next
          })
        })
        .catch((err) => {
          console.error(`Error updating ${entityName.toLowerCase()}:`, err)
          
          // Revert optimistic update on error
          if (selectedItem?.id === id) {
            // Revert to last known good state
            apiClient.getById(id).then(original => {
              setSelectedItem(original)
              setItems(prevItems => 
                prevItems.map(item => 
                  item.id === id ? original : item
                )
              )
            }).catch(() => {
              // If we can't fetch original, reload items
              loadItems()
            })
          } else {
            // Reload items to get correct state
            loadItems()
          }

          // Store error for display
          setUpdateErrors(prev => {
            const next = new Map(prev)
            next.set(id, err instanceof Error ? err : new Error('Update failed'))
            return next
          })

          // Remove from pending
          setPendingUpdates(prev => {
            const next = new Map(prev)
            next.delete(id)
            return next
          })

          throw err
        })

      // Don't await - let it run in background
      // But we can optionally await for critical updates
      return savePromise
    } catch (err) {
      console.error(`Error ${id ? 'updating' : 'creating'} ${entityName.toLowerCase()}:`, err)
      throw err
    }
  }, [apiClient, entityName, loadItems, selectedItem])

  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  // Configuration panel state
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false)

  // Handle configuration panel (legacy)
  const handleConfigureTable = useCallback(() => {
    if (isTableActionsV2Enabled) {
      setIsConfigureModalOpen(true)
      trackEvent({ type: 'table.configure_opened', tableId: entityNamePlural })
    } else {
      setIsConfigPanelOpen(true)
    }
  }, [isTableActionsV2Enabled, entityNamePlural])

  // Handle configure table preferences change
  const handlePreferencesChange = useCallback((preferences: TablePreferences) => {
    setColumnVisibility(preferences.columnVisibility)
    // Save preferences including column order
    saveTablePreferences(entityNamePlural, preferences)
    // Trigger a refresh of configuredColumns by updating configRefreshKey
    setConfigRefreshKey(prev => prev + 1)
    // Also trigger column order update
    setColumnOrderKey(prev => prev + 1)
    // Apply default sort if needed
    if (preferences.defaultSort) {
      setSortBy(preferences.defaultSort.field)
      setSortOrder(preferences.defaultSort.order)
    }
    
    // Reload table configuration to get updated field names
    // This ensures renamed fields are immediately reflected in the UI
    const reloadConfiguration = async () => {
      try {
        console.log('🔄 Reloading table configuration after field name change...', entityNamePlural)
        // Wait a bit longer to ensure backend has saved
        await new Promise(resolve => setTimeout(resolve, 800))
        
        // Try multiple times in case of timing issues
        let config = null
        let attempts = 0
        const maxAttempts = 3
        
        while (!config && attempts < maxAttempts) {
          try {
            config = await tableConfigurationApi.getConfiguration(entityNamePlural)
            if (config) break
          } catch (error) {
            console.log(`⚠️ Attempt ${attempts + 1} failed, retrying...`)
          }
          attempts++
          if (!config && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }
        
        if (config) {
          console.log('✅ Reloaded configuration:', config)
          console.log('📋 Updated fields:', config.fields?.map((f: any) => ({
            id: f.id,
            name: f.name,
            airtableFieldName: f.airtableFieldName
          })))
          
          // Force update - create a new object reference to trigger re-render
          setTableConfiguration({ ...config, _refresh: Date.now() })
          
          // Force a refresh by updating the key multiple times
          setConfigRefreshKey(prev => prev + 1)
          console.log('✅ Table configuration state updated - forcing re-render')
          
          // Force a delay and then update again to ensure React processes it
          await new Promise(resolve => setTimeout(resolve, 200))
          setConfigRefreshKey(prev => prev + 1)
          console.log('🔄 Forced second refresh')
          
          // One more time after another delay
          await new Promise(resolve => setTimeout(resolve, 200))
          setConfigRefreshKey(prev => prev + 1)
          console.log('🔄 Forced third refresh')
        } else {
          console.log('⚠️ No configuration returned from API after', maxAttempts, 'attempts')
        }
      } catch (error) {
        console.error('❌ Failed to reload table configuration:', error)
      }
    }
    reloadConfiguration()
  }, [entityNamePlural])

  const handleSaveConfiguration = useCallback(async (schema: UpdateTableSchemaDto) => {
    // Use table name for configuration API (it uses table name, not tableId)
    const savedConfig = await tableConfigurationApi.updateConfiguration(entityNamePlural, schema)
    // Reload configuration to get updated data
    setTableConfiguration(savedConfig)
    // Reload items to reflect changes
    await loadItems()
  }, [entityNamePlural, loadItems])

  // Handle import button click (opens modal)
  const handleImportClick = useCallback(() => {
    trackEvent({ type: 'table.import_clicked', tableId: entityNamePlural })
    if (!apiClient.bulkImport) {
      alert('Bulk import is not supported for this entity')
      return
    }
    setIsImportModalOpen(true)
  }, [apiClient, entityNamePlural])

  // Handle import completion (called from modal)
  const handleImportComplete = useCallback(async (itemsToImport: Partial<T>[]) => {
    if (!apiClient.bulkImport) {
      throw new Error('Bulk import is not supported for this entity')
    }
    const result = await apiClient.bulkImport(itemsToImport)
    loadItems()
    setIsImportModalOpen(false)
    return result
  }, [apiClient, loadItems])


  // Handle export
  const handleExport = useCallback(() => {
    trackEvent({ type: 'table.export_clicked', tableId: entityNamePlural })
    try {
      // Create CSV content
      const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return ''
        const str = String(value)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }

      const headers = configuredColumns.map(col => col.label)
      const rows = items.map((item) => 
        configuredColumns.map(column => {
          const value = (item as any)[column.key]
          return escapeCSV(column.render ? column.render(value, item) : value)
        })
      )
      
      const BOM = '\uFEFF'
      const csvContent = BOM + [headers.map(escapeCSV), ...rows].map((row) => row.join(',')).join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${entityNamePlural.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      alert(`Failed to export: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [items, configuredColumns, entityNamePlural])


  // Render cell content
  const renderCell = useCallback((column: typeof configuredColumns[0], item: T) => {
    if (column.render) {
      return column.render((item as any)[column.key], item)
    }
    
    const value = (item as any)[column.key]
    if (value === null || value === undefined || value === '') {
      return <span className="text-neutral-400">—</span>
    }
    
    // Default rendering matches CompanyTable styling
    return <span className="text-xs text-neutral-700">{String(value)}</span>
  }, [columns])

  // Get sort icon - always shows both up and down arrows stacked (thin outline style, grey)
  const getSortIcon = useCallback((field: string) => {
    const isActive = sortBy === field
    const arrowColor = isActive ? 'text-neutral-600' : 'text-neutral-400'
    const strokeWidth = 1.5 // Thinner outline style
    
    return (
      <span className="flex flex-col items-center justify-center ml-1.5" style={{ lineHeight: 0 }}>
        {/* Up arrow */}
        <svg 
          className={`w-3 h-3 ${arrowColor} ${isActive && sortOrder === 'asc' ? 'opacity-100' : 'opacity-60'}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style={{ strokeWidth }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
        {/* Down arrow */}
        <svg 
          className={`w-3 h-3 ${arrowColor} ${isActive && sortOrder === 'desc' ? 'opacity-100' : 'opacity-60'}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style={{ strokeWidth }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    )
  }, [sortBy, sortOrder])

  // Calculate pagination
  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalCount)
  const totalPages = Math.ceil(totalCount / pageSize)

  // Check for API client error AFTER all hooks are called
  if (!apiClient) {
    return (
      <div className="p-8 text-red-600">
        <h2 className="text-xl font-semibold mb-2">Configuration Error</h2>
        <p>API client is missing. Please check the configuration.</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col h-full relative">
      {/* Breadcrumb with Import/Export and Size Column */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-neutral-600">
            <span className="hover:text-green-600 cursor-pointer transition-colors">Organization structure</span>
            <span className="text-neutral-400">/</span>
            <span className="font-medium text-neutral-900">{entityNamePlural}</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-neutral-500">
            <span>
              Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)} - {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
            </span>
            <span className="text-neutral-300">•</span>
            <span>{totalCount} total</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {headerActions}
          {isTableActionsV2Enabled ? (
            <TableHeaderActions
              tableId={entityNamePlural}
              actions={[
                ...(showImportExport && apiClient.bulkImport ? [{
                  id: 'import',
                  label: 'Import',
                  onClick: handleImportClick,
                  shortcut: 'Shift+I',
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  ),
                }] : []),
                ...(showImportExport ? [{
                  id: 'export',
                  label: 'Export',
                  onClick: handleExport,
                  shortcut: 'Shift+E',
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                  ),
                }] : []),
                {
                  id: 'share',
                  label: 'Share',
                  onClick: () => {
                    // Share functionality - can be implemented later
                    trackEvent({ type: 'table.share_clicked', tableId: entityNamePlural })
                    // For now, just show a message or copy link
                    if (navigator.share) {
                      navigator.share({
                        title: `${entityNamePlural} - Another RA`,
                        url: window.location.href,
                      }).catch(() => {
                        // Fallback: copy to clipboard
                        navigator.clipboard.writeText(window.location.href)
                        alert('Link copied to clipboard!')
                      })
                    } else {
                      navigator.clipboard.writeText(window.location.href)
                      alert('Link copied to clipboard!')
                    }
                  },
                  shortcut: 'Shift+S',
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  ),
                },
                {
                  id: 'configure',
                  label: 'Configure Table',
                  onClick: handleConfigureTable,
                  shortcut: 'Shift+C',
                  divider: showImportExport,
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ),
                },
              ]}
            />
          ) : (
            <>
              <button
                onClick={handleConfigureTable}
                className="px-3 py-2 border border-neutral-300 rounded-lg text-sm text-neutral-700 bg-white hover:bg-neutral-50 transition-colors flex items-center space-x-2"
                aria-label="Configure table"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Configure Table</span>
              </button>
              {showImportExport && (
                <>
                  {apiClient.bulkImport && (
                    <button
                      onClick={handleImportClick}
                      className="px-3 py-2 border border-neutral-300 rounded-lg text-sm text-neutral-700 bg-white hover:bg-neutral-50 transition-colors flex items-center space-x-2"
                      aria-label="Import"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>Import</span>
                    </button>
                  )}
                  <button
                    onClick={handleExport}
                    className="px-3 py-2 border border-neutral-300 rounded-lg text-sm text-neutral-700 bg-white hover:bg-neutral-50 transition-colors flex items-center space-x-2"
                    aria-label="Export"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    <span>Export</span>
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  // Share functionality
                  trackEvent({ type: 'table.share_clicked', tableId: entityNamePlural })
                  if (navigator.share) {
                    navigator.share({
                      title: `${entityNamePlural} - Another RA`,
                      url: window.location.href,
                    }).catch(() => {
                      navigator.clipboard.writeText(window.location.href)
                      alert('Link copied to clipboard!')
                    })
                  } else {
                    navigator.clipboard.writeText(window.location.href)
                    alert('Link copied to clipboard!')
                  }
                }}
                className="px-3 py-2 border border-neutral-300 rounded-lg text-sm text-neutral-700 bg-white hover:bg-neutral-50 transition-colors flex items-center space-x-2"
                aria-label="Share"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>Share</span>
              </button>
            </>
          )}
          <button
            onClick={() => {
              // Open panel with empty item for creation
              setSelectedItem({} as T)
              setIsPanelOpen(true)
            }}
            className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors shadow-sm flex items-center space-x-2"
            aria-label={`Add ${entityName.toLowerCase()}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add {entityName.toLowerCase()}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-6 mb-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Global Search */}
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search by ${entityNamePlural.toLowerCase()}...`}
              className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              aria-label={`Search ${entityNamePlural.toLowerCase()}`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filters Button with Badge */}
          {filters.length > 0 && (
            <div className="relative sm:w-auto w-full">
              <button
                onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-all ${
                  isFilterPanelOpen || Object.values(activeFilters).some(v => v)
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-neutral-300 bg-white text-neutral-700 hover:border-green-500 hover:text-green-600'
                }`}
                aria-label="Toggle filters"
                aria-expanded={isFilterPanelOpen}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Filters</span>
                {Object.values(activeFilters).filter(v => v).length > 0 && (
                  <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-semibold rounded-full min-w-[20px] text-center">
                    {Object.values(activeFilters).filter(v => v).length}
                  </span>
                )}
                <svg
                  className={`w-4 h-4 transition-transform ${isFilterPanelOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Expandable Filter Panel */}
        {isFilterPanelOpen && filters.length > 0 && (
          <div className="mt-3 border border-neutral-200 rounded-lg bg-white shadow-sm">
            <div className="p-4 space-y-4">
              {/* Panel Header with Clear Button */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                <h3 className="text-sm font-semibold text-neutral-900">Filter Options</h3>
                {(searchQuery || Object.values(activeFilters).some(v => v)) && (
                  <button
                    onClick={handleClearFilters}
                    className="text-xs text-neutral-500 hover:text-green-600 transition-colors font-medium"
                  >
                    Clear all filters
                  </button>
                )}
              </div>

              {/* Filter Dropdowns - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filters.map(filter => (
                  <div key={filter.key} className="relative">
                    <select
                      value={activeFilters[filter.key] || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all appearance-none pr-8"
                    >
                      <option value="">All {filter.label}</option>
                      {(filterOptions[filter.key] || []).map(option => {
                        // Handle formatted options like "Name|ID" for relationship filters
                        const displayValue = option.includes('|') ? option.split('|')[0] : option
                        const filterValue = option.includes('|') ? option.split('|')[1] : option
                        return (
                          <option key={option} value={filterValue}>{displayValue}</option>
                        )
                      })}
                    </select>
                    <svg
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Utility Controls */}
      <div className="px-6 flex items-center justify-end mb-4">
        <div className="flex items-center space-x-3">
          {/* Auto-size Columns Button */}
          {isColumnResizeV2Enabled && isColumnAutoSizingEnabled && (
            <button
              onClick={() => {
                // Auto-size all visible columns
                const autoSizedWidths: Record<string, number> = {}
                visibleColumnKeys.forEach(key => {
                  const colInfo = columnInfo.find(c => c.key === key)
                  if (colInfo && resizing.handleAutoSize) {
                    // Use the hook's auto-size function
                    resizing.handleAutoSize(key)
                    // Calculate width for immediate update
                    const autoWidth = calculateAutoWidth(key, colInfo, items.slice(0, 10))
                    autoSizedWidths[key] = autoWidth
                  }
                })
                // Update all widths at once
                if (Object.keys(autoSizedWidths).length > 0) {
                  setColumnWidths(prev => ({ ...prev, ...autoSizedWidths }))
                }
              }}
              className="px-2 py-1.5 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 hover:border-green-300 transition-colors flex items-center gap-1"
              title="Auto-size all columns based on content"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              <span>Auto-size</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6">
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {isLoading && items.length === 0 && showLoadingIndicator ? (
          <div className="flex flex-col items-center justify-center h-64">
            {/* Progress bar */}
            <div className="w-full max-w-md mb-4 px-4">
              <div className="h-1 bg-neutral-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-600 rounded-full transition-all duration-300 ease-out"
                  style={{ 
                    width: '100%',
                    animation: 'progress 1.5s ease-in-out infinite'
                  }}
                />
              </div>
            </div>
            <p className="text-neutral-500">{loadingMessage}</p>
          </div>
        ) : isLoading && items.length === 0 && !showLoadingIndicator ? (
          <div className="p-6">
            <TableSkeleton 
              rows={configDefaultPageSize || 25} 
              columns={Math.max(columns.length || 0, 4)} 
              showHeader={true}
            />
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-neutral-500">{emptyStateMessage}</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto border border-neutral-200 rounded-lg bg-neutral-50 shadow-sm relative">
            <table className="w-full" style={{ tableLayout: 'auto', minWidth: '100%' }}>
              <thead 
                className="sticky top-0 z-20 border-b-2 border-neutral-300 shadow-sm"
                style={{ backgroundColor: '#FAFAFA' }}
              >
                <tr>
                  {configuredColumns.filter(col => columnVisibility[col.key] !== false).map((column, idx) => {
                    const isLastColumn = idx === configuredColumns.filter(col => columnVisibility[col.key] !== false).length - 1
                    // Use columnWidths (current state) first, then savedWidths (persisted), then default
                    // This ensures dynamic resizing is immediately visible
                    const currentWidth = columnWidths[column.key] || savedWidths[column.key]
                    const defaultWidth = (column.width && typeof column.width === 'string' ? column.width : undefined) || 'auto'
                    const width = currentWidth ? `${currentWidth}px` : defaultWidth
                    const isResizing = resizingColumn === column.key
                    const isFocused = focusedResizer === column.key
                    
                    // Get alignment (auto-determined if not set)
                    const alignment = getColumnAlignment(column)
                    const colInfo = columnInfo.find(c => c.key === column.key)
                    const minWidth = colInfo?.minWidth || column.minWidth || 60
                    const maxWidth = colInfo?.maxWidth || column.maxWidth || 800
                    
                    return (
                      <th
                        key={column.key}
                        style={{ 
                          width: currentWidth ? `${currentWidth}px` : (typeof defaultWidth === 'string' ? defaultWidth : 'auto'),
                          minWidth: `${minWidth}px`,
                          maxWidth: currentWidth ? `${currentWidth}px` : `${maxWidth}px`,
                          position: 'relative',
                          // Smooth transition only when not resizing
                          transition: isResizing ? 'none' : 'width 0.2s ease',
                        }}
                        className={`px-4 py-4 border-r border-neutral-200 ${
                          alignment === 'center' ? 'text-center' : 
                          alignment === 'right' ? 'text-right' : 'text-left'
                        } ${idx === 0 ? 'rounded-tl-lg' : ''} ${isLastColumn ? 'rounded-tr-lg border-r-0' : ''} ${
                          isResizing ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className={`flex items-center h-full ${
                          alignment === 'center' ? 'justify-center' : 
                          alignment === 'right' ? 'justify-end' : 'justify-start'
                        }`}>
                          {column.sortable ? (
                            <button
                              onClick={() => handleSort(column.key)}
                              className={`flex items-center gap-1.5 text-[11px] font-semibold text-neutral-700 uppercase tracking-wider hover:text-green-600 transition-colors ${
                                alignment === 'center' ? 'justify-center' : 
                                alignment === 'right' ? 'justify-end' : 'justify-start'
                              }`}
                              aria-label={`Sort by ${column.label}`}
                            >
                              <span className="whitespace-nowrap">
                                {column.label}
                              </span>
                              {getSortIcon(column.key)}
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap">
                              {column.label}
                            </span>
                          )}
                        </div>
                        {/* Column separator with resize handle */}
                        {!isLastColumn && (
                          <div
                            onMouseDown={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              if (isColumnResizeV2Enabled) {
                                handleResizeStart(column.key, e.clientX)
                              } else {
                                handleResizeStart(column.key, e.clientX)
                              }
                            }}
                            onDoubleClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              if (isColumnResizeV2Enabled && handleAutoSize) {
                                handleAutoSize(column.key)
                              }
                            }}
                            className={`
                              absolute top-0 right-0 h-full cursor-col-resize
                              transition-all duration-150
                              ${isResizing 
                                ? 'bg-blue-500 w-1' 
                                : 'bg-neutral-300 w-px hover:bg-blue-400 hover:w-0.5'
                              }
                            `}
                            style={{ 
                              zIndex: 10,
                              marginRight: '-1px',
                              userSelect: 'none',
                            }}
                            title="Click and drag to resize column"
                            role="separator"
                            aria-label={`Resize ${column.label} column`}
                          />
                        )}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {items.map((item, index) => {
                  const firstColumn = configuredColumns.filter(col => columnVisibility[col.key] !== false)[0]
                  const isHovered = hoveredRow === item.id
                  return (
                    <tr
                      key={item.id}
                      className={`group transition-all duration-200 cursor-pointer border-b border-neutral-100 hover:border-green-200 hover:shadow-sm ${
                        index % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'
                      } hover:bg-green-50/70`}
                      style={{ userSelect: 'none' }}
                      onMouseEnter={() => setHoveredRow(item.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      onMouseDown={(e) => {
                        // Only prevent text selection, but allow click to proceed
                        // Don't prevent default here as it will block onClick
                        if (e.button === 0) { // Left mouse button only
                          // Allow the click to proceed normally
                        }
                      }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleItemClick(item, e)
                        return false // Additional prevention
                      }}
                      onContextMenu={(e) => {
                        // Prevent right-click context menu that might trigger navigation
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          e.stopPropagation()
                          handleItemClick(item, e as any)
                        }
                        if (e.key === 'Escape' && isPanelOpen && selectedItem?.id === item.id) {
                          setIsPanelOpen(false)
                        }
                      }}
                      aria-label={`${entityName}: ${(item as any)[firstColumn?.key] || item.id}`}
                    >
                      {configuredColumns.filter(col => columnVisibility[col.key] !== false).map((column, colIdx) => {
                        const isFirstColumn = colIdx === 0
                        const recordName = (item as any)[firstColumn?.key] || item.id
                        // Use columnWidths (current state) first, then savedWidths (persisted)
                        const cellWidth = columnWidths[column.key] || savedWidths[column.key]
                        return (
                          <td
                            key={column.key}
                            style={{ 
                              width: cellWidth ? `${cellWidth}px` : undefined,
                              minWidth: cellWidth ? `${cellWidth}px` : undefined,
                              userSelect: 'none',
                            }}
                            className={`px-4 py-4 border-r border-neutral-200 ${
                              getColumnAlignment(column) === 'center' ? 'text-center' : 
                              getColumnAlignment(column) === 'right' ? 'text-right' : 'text-left'
                            } ${column.width || ''} ${
                              colIdx === configuredColumns.filter(col => columnVisibility[col.key] !== false).length - 1 ? 'border-r-0' : ''
                            }`}
                            onMouseDown={(e) => {
                              // Don't prevent default here - let the row handle it
                              // Just stop propagation to prevent bubbling
                              e.stopPropagation()
                            }}
                            onClick={(e) => {
                              // Prevent any navigation from cell clicks
                              e.preventDefault()
                              e.stopPropagation()
                              return false // Additional prevention
                            }}
                          >
                            {isFirstColumn ? (
                              <div 
                                className={`flex items-center space-x-3 ${
                                  getColumnAlignment(column) === 'center' ? 'justify-center' : 
                                  getColumnAlignment(column) === 'right' ? 'justify-end' : 'justify-start'
                                }`}
                                onClick={(e) => {
                                  // Don't prevent default here - let the row handle it
                                  e.stopPropagation()
                                }}
                              >
                                <span 
                                  className="text-base font-semibold text-neutral-900 group-hover:text-green-700 transition-colors leading-tight pointer-events-none"
                                >
                                  <OptimizedTableCell
                                    value={(item as any)[column.key]}
                                    column={column}
                                    item={item}
                                  />
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleItemClick(item)
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      handleItemClick(item)
                                    }
                                  }}
                                  className={`flex items-center justify-center text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full p-1.5 transition-all duration-200 ${
                                    isHovered
                                      ? 'opacity-100 scale-100'
                                      : 'opacity-0 scale-95 pointer-events-none'
                                  }`}
                                  aria-label={`Preview ${recordName}`}
                                  title="Preview"
                                  role="button"
                                  tabIndex={0}
                                >
                                  <EyeIcon className="w-5 h-5" />
                                </button>
                              </div>
                            ) : (
                              <div
                                className="pointer-events-none"
                                onClick={(e) => {
                                  // Don't prevent default - let the row handle it
                                  e.stopPropagation()
                                }}
                              >
                                <OptimizedTableCell
                                  value={(item as any)[column.key]}
                                  column={column}
                                  item={item}
                                />
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Loading overlay with progress bar - only show if loading takes longer than threshold */}
            {isLoading && items.length > 0 && showLoadingIndicator && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                {/* Progress bar */}
                <div className="w-full max-w-md mb-4 px-4">
                  <div className="h-1 bg-neutral-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-600 rounded-full transition-all duration-300 ease-out"
                      style={{ 
                        width: '100%',
                        animation: 'progress 1.5s ease-in-out infinite'
                      }}
                    />
                  </div>
                </div>
                <p className="text-sm text-neutral-500">Loading...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="mt-6 flex items-center justify-between border-t border-neutral-200 pt-4 px-6">
          <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label htmlFor="page-size" className="text-sm text-neutral-600">
                  Rows per page:
                </label>
                <select
                  id="page-size"
                  value={pageSize}
                  onChange={(e) => {
                    const newPageSize = Number(e.target.value)
                    setPageSize(newPageSize)
                    setCurrentPage(1)
                    // Save per-table override
                    updatePageSize(entityNamePlural, newPageSize)
                    // Trigger re-evaluation of reset icon visibility
                    setPageSizeChangeTrigger(prev => prev + 1)
                  }}
                  className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  aria-label="Select page size"
                >
                  {pageSizeOptions.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                {/* Reset to user default button - only show when there's a per-table override or pageSize differs from default */}
                {shouldShowResetIcon && (() => {
                  // Calculate effective default for the reset action
                  const effectiveDefault = !prefsLoading && userDefaultPageSize 
                    ? userDefaultPageSize 
                    : (configDefaultPageSize || 25)
                  
                  return (
                    <button
                      onClick={() => {
                        const defaultSize = !prefsLoading && userDefaultPageSize 
                          ? userDefaultPageSize 
                          : (configDefaultPageSize || 25)
                        setPageSize(defaultSize)
                        setCurrentPage(1)
                        // Remove per-table override from localStorage
                        const prefs = getTablePreferences(entityNamePlural) || {
                          columnVisibility: {},
                          columnOrder: [],
                        }
                        const { pageSize: _, ...rest } = prefs
                        saveTablePreferences(entityNamePlural, rest)
                        // Trigger re-evaluation of reset icon visibility
                        setPageSizeChangeTrigger(prev => prev + 1)
                      }}
                      className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors"
                      aria-label="Reset to user default page size"
                      title={`Reset to default (${effectiveDefault} rows)`}
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                    </button>
                  )
                })()}
              </div>
              <div className="text-sm text-neutral-600">
                Page {currentPage} of {totalPages}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || isLoading}
                className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="First page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || isLoading}
                className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={isLoading}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-300'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      aria-label={`Go to page ${pageNum}`}
                      aria-current={currentPage === pageNum ? 'page' : undefined}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || isLoading}
                className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || isLoading}
                className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Last page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedItem && (
        <DetailPanel
          isOpen={isPanelOpen}
          onClose={handleClosePanel}
          maxWidth={isTableActionsV2Enabled ? 'w-[720px]' : '800px'}
          header={
            <PanelHeader
              title={(selectedItem as any)?.[panel.titleKey] || (selectedItem && !(selectedItem as any).id ? `New ${entityName}` : `${entityName} Details`)}
              onClose={handleClosePanel}
              actions={
                panel.actions?.delete && selectedItem && (selectedItem as any).id && (
                  <button
                    onClick={() => handleDelete((selectedItem as any).id)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    {panel.actions.delete.label}
                  </button>
                )
              }
            />
          }
        >
          {/* Main Title Card */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 md:p-7 mb-4 md:mb-6">
            <h2 className="text-base md:text-lg font-bold text-neutral-900 break-words">
              {(selectedItem as any)?.[panel.titleKey] || (selectedItem && !(selectedItem as any).id ? `New ${entityName}` : entityName)}
            </h2>
          </div>

          <DetailPanelContent
            item={selectedItem}
            fields={configuredFields}
            sections={panel.sections}
            onUpdate={handleUpdate}
          />
        </DetailPanel>
      )}

      {/* Configure Table Modal (V2) */}
      {isTableActionsV2Enabled && (
        <ConfigureTableModal
          isOpen={isConfigureModalOpen}
          onClose={() => setIsConfigureModalOpen(false)}
          tableId={entityNamePlural}
          columns={configuredColumns.map(col => ({
            key: col.key,
            label: col.label,
            sortable: col.sortable !== false,
          }))}
          allFields={config.fields.map(field => ({
            key: field.key,
            label: field.label,
            sortable: false,
          }))}
          currentSort={sortBy ? { field: sortBy, order: sortOrder } : undefined}
          onPreferencesChange={handlePreferencesChange}
          onAutoSizeColumns={() => {
            // Auto-size all visible columns
            const autoSizedWidths: Record<string, number> = {}
            visibleColumnKeys.forEach(key => {
              const colInfo = columnInfo.find(c => c.key === key)
              if (colInfo && resizing.handleAutoSize) {
                // Use the hook's auto-size function
                resizing.handleAutoSize(key)
                // Calculate width for immediate update
                const autoWidth = calculateAutoWidth(key, colInfo, items.slice(0, 10))
                autoSizedWidths[key] = autoWidth
              }
            })
            // Update all widths at once
            if (Object.keys(autoSizedWidths).length > 0) {
              setColumnWidths(prev => ({ ...prev, ...autoSizedWidths }))
            }
          }}
        />
      )}

      {/* Configuration Panel (Legacy) */}
      {!isTableActionsV2Enabled && isConfigPanelOpen && (
        <TableConfigurationPanel
          tableId={entityNamePlural.toLowerCase().replace(/\s+/g, '-')}
          tableName={entityNamePlural}
          currentFields={configuredColumns.map(col => ({ key: col.key, label: col.label }))}
          onClose={() => setIsConfigPanelOpen(false)}
          onSave={handleSaveConfiguration}
        />
      )}
    </>
  )
}

