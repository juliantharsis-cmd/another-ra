'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { FieldConfig } from './types'
import PanelSection from '../panels/PanelSection'
import PanelField from '../panels/PanelField'
import ChoiceList from '../panels/ChoiceList'
import React from 'react'

interface DetailPanelContentProps<T = any> {
  item: T
  fields: FieldConfig[]
  sections: Array<{ id: string; title: string; fields: string[] }>
  onUpdate: (id: string, data: Partial<T>) => Promise<void>
}

export default function DetailPanelContent<T extends { id: string }>({
  item,
  fields,
  sections,
  onUpdate,
}: DetailPanelContentProps<T>) {
  // Local optimistic state - immediately updated when user types
  const [localItem, setLocalItem] = useState<T>(item)
  
  // Track the last known good value for Company field to prevent it from disappearing
  const getInitialCompanyValue = () => {
    const initialCompany = (item as any)?.Company
    if (initialCompany) {
      if (Array.isArray(initialCompany)) {
        return initialCompany.filter(v => v != null && v !== '').map(v => String(v))
      }
      return [String(initialCompany)]
    }
    return null
  }
  const lastKnownCompanyValue = useRef<any>(getInitialCompanyValue())
  
  // Sync local state with prop when item changes (e.g., from server)
  // BUT: Don't overwrite local changes that haven't been saved yet
  useEffect(() => {
    // Always run the effect, even if item is null/undefined
    if (!item || !fields || fields.length === 0) {
      // If no item or fields, ensure localItem is set to empty state
      if (!item) {
        setLocalItem({} as T)
      }
      return
    }
    
    // Check if we have pending updates - if so, merge server response with local changes
    const hasPendingUpdates = Object.keys(pendingUpdates.current).length > 0
    
    // Normalize multiple selection fields when syncing from server
    const normalizedItem = { ...item } as T
    fields.forEach(field => {
        if (field.type === 'choiceList') {
          const isMultipleField = field.key === 'Company' || 
                                 field.key === 'User Roles' || 
                                 field.key === 'Organization Scope' || 
                                 field.key === 'Modules' ||
                                 field.key === 'greenHouseGas' || 
                                 field.key === 'protocol' || 
                                 field.key === 'efDetailedG'
          
          if (isMultipleField) {
            const rawValue = (item as any)?.[field.key]
            
            // If we have pending updates for this field, preserve the local value
            const pendingValueForField = hasPendingUpdates ? (pendingUpdates.current as any)[field.key] : undefined
            if (pendingValueForField !== undefined) {
              // Keep the pending update value instead of overwriting with server response
              (normalizedItem as any)[field.key] = pendingValueForField
              // Update last known value
              if (field.key === 'Company') {
                lastKnownCompanyValue.current = pendingValueForField
              }
              return
            }
            
            // Special handling for Company field: preserve last known value if server response is empty
            if (field.key === 'Company') {
              const serverValue = rawValue === null || rawValue === undefined || rawValue === '' 
                ? [] 
                : Array.isArray(rawValue) 
                  ? rawValue.filter(v => v != null && v !== '').map(v => String(v))
                  : [String(rawValue)]
              
              // If server value is empty but we have a last known value, preserve it
              if (serverValue.length === 0 && lastKnownCompanyValue.current && lastKnownCompanyValue.current.length > 0) {
                console.log('⚠️ Company field empty in server response, preserving last known value:', lastKnownCompanyValue.current)
                ;(normalizedItem as any)[field.key] = lastKnownCompanyValue.current
              } else {
                ;(normalizedItem as any)[field.key] = serverValue
                // Update last known value if server has a valid value
                if (serverValue.length > 0) {
                  lastKnownCompanyValue.current = serverValue
                }
              }
              return
            }
            
            if (rawValue === null || rawValue === undefined || rawValue === '') {
              (normalizedItem as any)[field.key] = []
            } else if (Array.isArray(rawValue)) {
              // Filter out empty/null values and ensure all are strings
              // IMPORTANT: Keep record IDs as-is (they should start with 'rec')
              (normalizedItem as any)[field.key] = rawValue.filter(v => v != null && v !== '').map(v => String(v))
            } else {
              // Convert single value to array
              (normalizedItem as any)[field.key] = [String(rawValue)]
            }
          }
        }
      })
    
    // Merge with any pending updates to preserve unsaved local changes
    if (hasPendingUpdates) {
      Object.keys(pendingUpdates.current).forEach(key => {
        const pendingValue = (pendingUpdates.current as any)[key]
        if (pendingValue !== undefined) {
          (normalizedItem as any)[key] = pendingValue
          // Update last known value for Company
          if (key === 'Company') {
            lastKnownCompanyValue.current = pendingValue
          }
        }
      })
    }
    
    setLocalItem(normalizedItem)
  }, [item?.id, fields]) // Sync when item ID changes or fields change

  // Debounce timer ref for the item
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const pendingUpdates = useRef<Partial<T>>({})

  // Get field config by key
  const getFieldConfig = (key: string): FieldConfig | undefined => {
    return fields.find(f => f.key === key)
  }

  // Check if this is a new item (no id)
  const isNewItem = !localItem || !(localItem as any).id
  const itemId = (localItem as any)?.id || ''

  // Debounced update function with immediate optimistic UI update
  const debouncedUpdate = useCallback((id: string, fieldKey: string, value: any) => {
      // Immediately update local state for instant UI feedback
      // Normalize multiple selection fields when updating
      const normalizedValue = (() => {
        const isMultipleField = fieldKey === 'Company' || 
                               fieldKey === 'User Roles' || 
                               fieldKey === 'Organization Scope' || 
                               fieldKey === 'Modules' ||
                               fieldKey === 'greenHouseGas' || 
                               fieldKey === 'protocol' || 
                               fieldKey === 'efDetailedG'
        
        if (isMultipleField) {
          if (value === null || value === undefined || value === '') {
            return []
          }
          if (Array.isArray(value)) {
            return value.filter(v => v != null && v !== '').map(v => String(v))
          }
          return [String(value)]
        }
        return value
      })()
      
      setLocalItem(prev => ({
        ...prev,
        [fieldKey]: normalizedValue,
      } as T))
      
      // Update last known value for Company field
      if (fieldKey === 'Company') {
        lastKnownCompanyValue.current = normalizedValue
      }

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Store pending update (already normalized above)
    pendingUpdates.current = {
      ...pendingUpdates.current,
      [fieldKey]: normalizedValue,
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      // Get all pending updates
      const updates = { ...pendingUpdates.current }
      pendingUpdates.current = {}

      // Call onUpdate with merged updates (parent will handle optimistic update too)
      onUpdate(id, updates).catch(err => {
        console.error(`Error updating field ${fieldKey}:`, err)
        // On error, revert local state to prop value
        setLocalItem(item)
      })

      // Clear timer
      debounceTimer.current = null
    }, 800) // 800ms debounce - good balance between responsiveness and API calls
  }, [onUpdate, item])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
        debounceTimer.current = null
      }
      pendingUpdates.current = {}
    }
  }, [])

  // Detect field type for special rendering
  const detectFieldType = useCallback((field: FieldConfig, value: any): 'attachment' | 'url' | 'status' | 'default' => {
    // CRITICAL: If field type is explicitly set, use it (don't auto-detect)
    if (field.type === 'attachment') {
      return 'attachment'
    }
    // Note: 'url' and 'status' are not in FieldConfig.type, so we detect them by key/label
    
    // CRITICAL: "Profile Name" must always be treated as text, never as attachment
    const key = field.key.toLowerCase()
    const label = field.label.toLowerCase()
    
    // Explicitly exclude "Profile Name" from attachment detection
    if (key === 'profile name' || label === 'profile name') {
      return 'default' // Always treat as text
    }
    
    // Check for attachment fields (but exclude Profile Name)
    if ((key.includes('attachment') || label.includes('attachment') || 
        key.includes('image') || label.includes('image') ||
        key.includes('file') || label.includes('file')) &&
        key !== 'profile name' && label !== 'profile name') {
      return 'attachment'
    }
    
    // Check for URL fields
    if (key.includes('url') || label.includes('url') || 
        key.includes('link') || label.includes('link')) {
      return 'url'
    }
    
    // Check for status fields
    if (key === 'status' || label === 'status') {
      return 'status'
    }
    
    return 'default'
  }, [])

  // Normalize value for multiple selection fields
  const normalizeMultipleValue = useCallback((field: FieldConfig, value: any): any => {
    // Check if this is a multiple selection field
    const isMultipleField = field.key === 'Company' || 
                           field.key === 'User Roles' || 
                           field.key === 'Modules' ||
                           // Organization Scope removed
                           field.key === 'greenHouseGas' || 
                           field.key === 'protocol' || 
                           field.key === 'efDetailedG'
    
    if (isMultipleField) {
      // Always normalize to array for multiple selection fields
      if (value === null || value === undefined || value === '') {
        return []
      }
      if (Array.isArray(value)) {
        // Filter out empty/null values and ensure all are strings
        return value.filter(v => v != null && v !== '').map(v => String(v))
      }
      // Convert single value to array
      return [String(value)]
    }
    return value
  }, [])

  // Render a single field
  const renderField = useCallback((field: FieldConfig) => {
    const rawValue = (localItem as any)?.[field.key]
    let value = normalizeMultipleValue(field, rawValue)
    
    // CRITICAL: "Profile Name" must never contain filenames or attachment data
    if (field.key === 'Profile Name' || field.key === 'profile name' || field.key === 'profileName') {
      // If value looks like a filename (ends with image extension), treat as empty
      if (typeof value === 'string' && (value.endsWith('.png') || value.endsWith('.jpg') || value.endsWith('.jpeg') || value.endsWith('.gif') || value.endsWith('.pdf'))) {
        console.warn(`⚠️ Profile Name contains filename "${value}" - treating as empty. This should be a text field.`)
        value = ''
      }
      // If value is an array or object (attachment data), treat as empty
      if (Array.isArray(value) || (value && typeof value === 'object' && (value.filename || value.url || value.name))) {
        console.warn(`⚠️ Profile Name contains attachment data - treating as empty. This should be a text field.`)
        value = ''
      }
    }
    
    const fieldType = detectFieldType(field, value)

    if (field.type === 'choiceList') {
      return (
        <AsyncChoiceList
          key={field.key}
          field={field}
          value={value}
          item={localItem}
          onUpdate={(newValue) => {
            // Normalize the new value to ensure consistency
            const normalizedNewValue = normalizeMultipleValue(field, newValue)
            
            if (isNewItem) {
              // For new items, update immediately (no debounce)
              setLocalItem(prev => ({ ...prev, [field.key]: normalizedNewValue } as T))
              onUpdate('', { [field.key]: normalizedNewValue } as Partial<T>)
            } else {
              // For existing items, use debounced update with immediate UI feedback
              debouncedUpdate((localItem as any).id, field.key, normalizedNewValue)
            }
          }}
        />
      )
    }

    // Special rendering for attachments
    if (fieldType === 'attachment') {
      return (
        <PanelField
          key={field.key}
          label={field.label}
          value={value}
          type="attachment"
          readOnly={!field.editable || (isNewItem && field.type === 'readonly')}
          onChange={(newValue) => {
            if (isNewItem) {
              setLocalItem(prev => ({ ...prev, [field.key]: newValue } as T))
              onUpdate('', { [field.key]: newValue } as Partial<T>)
            } else {
              debouncedUpdate((localItem as any).id, field.key, newValue)
            }
          }}
        />
      )
    }

    // Special rendering for URLs
    if (fieldType === 'url') {
      return (
        <PanelField
          key={field.key}
          label={field.label}
          value={value}
          type="url"
          readOnly={!field.editable || (isNewItem && field.type === 'readonly')}
          onChange={(newValue) => {
            if (isNewItem) {
              setLocalItem(prev => ({ ...prev, [field.key]: newValue } as T))
              onUpdate('', { [field.key]: newValue } as Partial<T>)
            } else {
              debouncedUpdate((localItem as any).id, field.key, newValue)
            }
          }}
        />
      )
    }

    // Special rendering for select fields (including Status)
    if (field.type === 'select') {
      return (
        <SelectField
          key={field.key}
          field={field}
          value={value}
          isNewItem={isNewItem}
          localItem={localItem}
          setLocalItem={setLocalItem}
          onUpdate={onUpdate}
          debouncedUpdate={debouncedUpdate}
        />
      )
    }

    // Special rendering for status (fallback for fields detected as status but not explicitly select type)
    if (fieldType === 'status' && field.type !== 'select') {
      return (
        <PanelField
          key={field.key}
          label={field.label}
          value={value}
          type="status"
          readOnly={!field.editable || (isNewItem && field.type === 'readonly')}
          onChange={(newValue) => {
            if (isNewItem) {
              setLocalItem(prev => ({ ...prev, [field.key]: newValue } as T))
              onUpdate('', { [field.key]: newValue } as Partial<T>)
            } else {
              debouncedUpdate((localItem as any).id, field.key, newValue)
            }
          }}
        />
      )
    }

    return (
      <PanelField
        key={field.key}
        label={field.label}
        value={value}
        type={field.type === 'readonly' ? 'readonly' : field.type === 'textarea' ? 'textarea' : 'text'}
        readOnly={!field.editable || (isNewItem && field.type === 'readonly')}
        onChange={(newValue) => {
          if (isNewItem) {
            // For new items, update immediately (no debounce)
            setLocalItem(prev => ({ ...prev, [field.key]: newValue } as T))
            onUpdate('', { [field.key]: newValue } as Partial<T>)
          } else {
            // For existing items, use debounced update with immediate UI feedback
            debouncedUpdate((localItem as any).id, field.key, newValue)
          }
        }}
      />
    )
  }, [localItem, onUpdate, isNewItem, debouncedUpdate, detectFieldType])

  return (
    <>
      {sections.map(section => {
        const sectionFields = section.fields
          .map(key => getFieldConfig(key))
          .filter(Boolean) as FieldConfig[]

        if (sectionFields.length === 0) return null

        return (
          <PanelSection key={section.id} title={section.title}>
            {sectionFields.map(field => renderField(field))}
          </PanelSection>
        )
      })}
    </>
  )
}

// Component to handle async choice list options
function AsyncChoiceList({ field, value, item, onUpdate }: { field: FieldConfig; value: any; item?: any; onUpdate: (value: any) => void }) {
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const currentSearchRef = useRef<string>('') // Track current search to prevent stale updates
  const selectedOptionsCache = useRef<Map<string, { value: string; label: string }>>(new Map()) // Cache selected options
  const currentValueRef = useRef<any>(value) // Track current value to avoid dependency issues

  // Update value ref whenever value changes
  useEffect(() => {
    currentValueRef.current = value
  }, [value])
  
  // For Company field, populate cache from item's CompanyName when available
  // This runs immediately when item/value changes to ensure names are available on first render
  useEffect(() => {
    if (field.key === 'Company' && item) {
      const companyValue = value || (item as any).Company
      const companyName = item.CompanyName
      
      if (companyValue && companyName) {
        const valueArray = Array.isArray(companyValue) ? companyValue : [companyValue]
        const nameArray = Array.isArray(companyName) ? companyName : [companyName]
        
        valueArray.forEach((val: string, index: number) => {
          if (val && val.startsWith('rec')) {
            const name = nameArray[index] || nameArray[0]
            if (name && !name.startsWith('rec') && name.trim() !== '') {
              // Update cache with resolved name from backend
              selectedOptionsCache.current.set(val, { value: val, label: name })
              console.log(`✅ Cached company name for ${val}: ${name}`)
            }
          }
        })
      }
    }
  }, [value, item, field.key])
  
  // Also populate cache on initial mount if item has CompanyName
  useEffect(() => {
    if (field.key === 'Company' && item) {
      const companyValue = value || (item as any).Company
      const companyName = item.CompanyName
      
      if (companyValue && companyName) {
        const valueArray = Array.isArray(companyValue) ? companyValue : [companyValue]
        const nameArray = Array.isArray(companyName) ? companyName : [companyName]
        
        valueArray.forEach((val: string, index: number) => {
          if (val && val.startsWith('rec')) {
            const name = nameArray[index] || nameArray[0]
            if (name && !name.startsWith('rec') && name.trim() !== '') {
              // Ensure cache is populated on mount
              if (!selectedOptionsCache.current.has(val)) {
                selectedOptionsCache.current.set(val, { value: val, label: name })
                console.log(`✅ Initial cache population for ${val}: ${name}`)
              }
            }
          }
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  // Check if field supports search-based fetching
  const isSearchable = field.searchable && typeof field.options === 'function'

  // Load options - supports both initial load and search-based fetching
  const loadOptions = useCallback(async (search?: string) => {
    if (typeof field.options === 'function') {
      const searchKey = search || ''
      
      // Skip if this search is no longer current (prevent stale updates)
      if (currentSearchRef.current !== searchKey && currentSearchRef.current !== '') {
        return
      }
      
      setIsLoading(true)
      
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()
      
      try {
        // Check if function accepts search query parameter and abort signal
        // Pass abort signal to allow cancellation
        const opts = await (field.options as (searchQuery?: string, signal?: AbortSignal) => Promise<string[]>)(search, abortControllerRef.current.signal)
        
        // Double-check search is still current before updating state
        if (currentSearchRef.current !== searchKey && currentSearchRef.current !== '') {
          return // Stale result, ignore
        }
        
        // Convert string array to { value, label } format for ChoiceList
        // Handle formatted options like "Name|ID" for relationship fields
        const formattedOptions = opts.map((opt: string) => {
          if (opt.includes('|')) {
            const [label, idValue] = opt.split('|')
            const option = { value: idValue, label }
            // Cache the option by its value (record ID)
            selectedOptionsCache.current.set(idValue, option)
            return option
          }
          const option = { value: opt, label: opt }
          selectedOptionsCache.current.set(opt, option)
          return option
        })
        
        // Ensure selected values are in the options list (even if not in current fetch)
        // Use ref to get current value to avoid dependency issues
        const currentValue = currentValueRef.current
        const valueArray = Array.isArray(currentValue) ? currentValue : (currentValue ? [currentValue] : [])
        valueArray.forEach((val: string) => {
          if (val && !formattedOptions.find(opt => opt.value === val)) {
            // Selected value not in current options - check cache or add placeholder
            const cached = selectedOptionsCache.current.get(val)
            if (cached) {
              formattedOptions.push(cached)
            } else if (val.startsWith('rec')) {
              // It's a record ID but we don't have the label - add placeholder
              formattedOptions.push({ value: val, label: `Loading... (${val.substring(0, 8)}...)` })
            }
          }
        })
        
        setOptions(formattedOptions)
      } catch (err: any) {
        // Ignore abort errors - don't clear options on abort
        if (err.name === 'AbortError' || err.name === 'TimeoutError') {
          // Request was cancelled, keep existing options
          return
        }
        console.error(`Error loading options for ${field.key}:`, err)
        // Only clear options on actual errors if we have no existing options
        setOptions(prev => prev.length > 0 ? prev : [])
      } finally {
        // Only update loading state if this is still the current search
        if (currentSearchRef.current === searchKey || currentSearchRef.current === '') {
          setIsLoading(false)
        }
        abortControllerRef.current = null
      }
    } else {
      // Convert string array to { value, label } format
      // Handle formatted options like "Name|ID" for relationship fields
      const formattedOptions = (field.options || []).map((opt: string) => {
        if (opt.includes('|')) {
          const [label, idValue] = opt.split('|')
          return { value: idValue, label }
        }
        return { value: opt, label: opt }
      })
      setOptions(formattedOptions)
    }
  }, [field.key, field.options]) // Don't include value to avoid infinite loops - use ref instead

  // Initial load - only load first page if searchable
  useEffect(() => {
    currentSearchRef.current = ''
    if (isSearchable) {
      // For searchable fields, load minimal initial data
      loadOptions('')
    } else {
      // For non-searchable fields, load all options
      loadOptions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field.key, field.options, isSearchable]) // loadOptions is stable due to useCallback deps

  // Handle search with debouncing for searchable fields
  useEffect(() => {
    // Always return cleanup function - no early returns in hooks
    if (!isSearchable) {
      // Return empty cleanup if not searchable
      return () => {}
    }

    // Update current search ref
    currentSearchRef.current = searchQuery

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Debounce search requests (300ms)
    searchTimeoutRef.current = setTimeout(() => {
      // Verify search is still current before loading
      if (currentSearchRef.current === searchQuery) {
        loadOptions(searchQuery || undefined)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, isSearchable]) // Removed loadOptions from deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Determine if this is a multiple selection field (check field key first, not value type)
  // MUST be defined before any hooks that use it
  const isMultiple = field.key === 'greenHouseGas' || 
                     field.key === 'protocol' || 
                     field.key === 'efDetailedG' || 
                     field.key === 'Company' || 
                     field.key === 'User Roles' || 
                     field.key === 'Organization Scope' || 
                     field.key === 'Modules'
  
  // Normalize value to array for multiple selection fields
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const normalizedValue = useMemo(() => {
    if (isMultiple) {
      if (value === null || value === undefined || value === '') {
        return []
      }
      if (Array.isArray(value)) {
        // Filter out empty/null values and ensure all are strings
        const normalized = value.filter(v => v != null && v !== '').map(v => String(v))
        
        // For Company field, ensure selected values are in options (add to cache if needed)
        if (field.key === 'Company' && normalized.length > 0) {
          normalized.forEach((val: string) => {
            if (val && val.startsWith('rec') && !options.find(opt => opt.value === val)) {
              // Selected company not in current options - ensure it's cached
              if (!selectedOptionsCache.current.has(val)) {
                // Try to get the company name from the item's CompanyName field
                // This is populated by the backend when it resolves relationships
                const companyName = item?.CompanyName
                
                if (companyName) {
                  // If we have the resolved name, use it
                  const nameArray = Array.isArray(companyName) ? companyName : [companyName]
                  const nameIndex = normalized.indexOf(val)
                  const name = nameIndex >= 0 && nameIndex < nameArray.length ? nameArray[nameIndex] : nameArray[0]
                  
                  if (name && !name.startsWith('rec')) {
                    selectedOptionsCache.current.set(val, { value: val, label: name })
                  } else {
                    selectedOptionsCache.current.set(val, { value: val, label: `Company (${val.substring(0, 8)}...)` })
                  }
                } else {
                  // No resolved name yet - add placeholder that will be updated when options load
                  selectedOptionsCache.current.set(val, { value: val, label: `Company (${val.substring(0, 8)}...)` })
                }
              }
            }
          })
        }
        
        return normalized
      }
      // Convert single value to array
      return [String(value)]
    }
    return value || ''
  }, [value, isMultiple, field.key, options])
  
  // Reset search when dropdown closes (if using search-based fetching)
  const handleDropdownToggle = useCallback((isOpen: boolean) => {
    if (!isOpen && isSearchable) {
      // When dropdown closes, reset search to show initial results next time
      setSearchQuery('')
      currentSearchRef.current = ''
      // Don't reload options immediately - only reload when dropdown reopens
      // This prevents unnecessary API calls that might interfere with updates
    }
  }, [isSearchable])

  // Merge cached selected options with current options to ensure selected values are always visible
  // MUST be called before any conditional returns to maintain hook order
  const mergedOptions = useMemo(() => {
    const optionsMap = new Map(options.map(opt => [opt.value, opt]))
    
    // For Company field, ALWAYS use CompanyName from item if available (highest priority)
    if (field.key === 'Company' && item) {
      // Get company value from normalizedValue or directly from item
      const companyValue = normalizedValue || (item as any).Company
      const companyName = item.CompanyName || (item as any)['Company Name']
      
      console.log(`🔍 [mergedOptions] Company field - value:`, companyValue, `CompanyName:`, companyName)
      
      if (companyValue && companyName) {
        const valueArray = Array.isArray(companyValue) ? companyValue : (companyValue ? [companyValue] : [])
        const nameArray = Array.isArray(companyName) ? companyName : (companyName ? [companyName] : [])
        
        valueArray.forEach((val: string, index: number) => {
          if (val && typeof val === 'string' && val.startsWith('rec')) {
            const name = nameArray[index] || nameArray[0]
            if (name && typeof name === 'string' && !name.startsWith('rec') && name.trim() !== '') {
              // ALWAYS use CompanyName from item - it's the source of truth from backend
              const option = { value: val, label: name }
              selectedOptionsCache.current.set(val, option)
              optionsMap.set(val, option)
              console.log(`✅ [mergedOptions] Using CompanyName for ${val}: ${name}`)
            } else if (val) {
              // If name is not valid, check cache as fallback
              const cached = selectedOptionsCache.current.get(val)
              if (cached && !cached.label.startsWith('Company (')) {
                optionsMap.set(val, cached)
                console.log(`⚠️ [mergedOptions] Using cached option for ${val}: ${cached.label}`)
              } else {
                console.log(`⚠️ [mergedOptions] No valid name found for ${val}, name was:`, name)
              }
            }
          }
        })
      } else {
        console.log(`⚠️ [mergedOptions] Missing companyValue or CompanyName:`, { companyValue, companyName })
      }
    }
    
    // Add any cached options that are in the selected value but not in current options
    const valueArray = Array.isArray(normalizedValue) ? normalizedValue : (normalizedValue ? [normalizedValue] : [])
    valueArray.forEach((val: string) => {
      if (val && !optionsMap.has(val)) {
        const cached = selectedOptionsCache.current.get(val)
        if (cached) {
          optionsMap.set(val, cached)
        }
      }
    })
    
    return Array.from(optionsMap.values())
  }, [options, normalizedValue, item, field.key])

  // Conditional rendering AFTER all hooks are called
  if (isLoading && options.length === 0) {
    return (
      <div className="py-3 border-b border-neutral-100">
        <label className="block text-sm font-medium text-neutral-700 mb-1">{field.label}</label>
        <p className="text-sm text-neutral-400">Loading options...</p>
      </div>
    )
  }

  return (
    <ChoiceList
      label={field.label}
      value={normalizedValue}
      options={mergedOptions}
      onChange={onUpdate}
      multiple={isMultiple}
      searchable={isSearchable}
      onSearch={isSearchable ? setSearchQuery : undefined}
      isLoading={isLoading}
      onToggle={handleDropdownToggle}
    />
  )
}

// Component to handle select fields with async options
function SelectField<T extends { id: string }>({
  field,
  value,
  isNewItem,
  localItem,
  setLocalItem,
  onUpdate,
  debouncedUpdate,
}: {
  field: FieldConfig
  value: any
  isNewItem: boolean
  localItem: T
  setLocalItem: React.Dispatch<React.SetStateAction<T>>
  onUpdate: (id: string, data: Partial<T>) => Promise<void>
  debouncedUpdate: (id: string, fieldKey: string, value: any) => void
}) {
  const [selectOptions, setSelectOptions] = useState<Array<{ value: string; label: string }>>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)

  useEffect(() => {
    if (field.options) {
      if (typeof field.options === 'function') {
        setIsLoadingOptions(true)
        ;(field.options as () => Promise<string[]>)().then(opts => {
            setSelectOptions(opts.map(opt => ({ value: opt, label: opt })))
            setIsLoadingOptions(false)
          })
          .catch(err => {
            console.error(`Error loading options for ${field.key}:`, err)
            setIsLoadingOptions(false)
          })
      } else if (Array.isArray(field.options)) {
        setSelectOptions(field.options.map(opt => ({ value: opt, label: opt })))
      }
    }
  }, [field.options, field.key])

  return (
    <PanelField
      label={field.label}
      value={value}
      type="select"
      options={selectOptions}
      readOnly={!field.editable || (isNewItem && field.type === 'readonly') || isLoadingOptions}
      onChange={(newValue) => {
        if (isNewItem) {
          setLocalItem(prev => ({ ...prev, [field.key]: newValue } as T))
          onUpdate('', { [field.key]: newValue } as Partial<T>)
        } else {
          debouncedUpdate((localItem as any).id, field.key, newValue)
        }
      }}
    />
  )
}

