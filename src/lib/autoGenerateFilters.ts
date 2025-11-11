/**
 * Auto-Generate Filters Utility
 * 
 * Automatically generates filter configurations from field configurations.
 * 
 * Rules:
 * - Text fields (text, textarea) are searchable via global search (excluded from filters)
 * - Non-text fields (select, choiceList, date, number) are filterable by default
 * - Attachment fields are excluded from filters
 * - Readonly fields are excluded unless they're select/choiceList
 */

import { FieldConfig, FilterConfig, ApiClient } from '@/components/templates/types'

/**
 * Determine if a field should have a filter based on its type
 */
function shouldHaveFilter(field: FieldConfig): boolean {
  // Exclude text fields (handled by global search)
  if (field.type === 'text' || field.type === 'textarea') {
    return false
  }
  
  // Exclude attachment fields
  if (field.type === 'attachment') {
    return false
  }
  
  // Exclude readonly fields that aren't select/choiceList
  if (field.type === 'readonly') {
    return false
  }
  
  // Include select, choiceList, date, number fields
  return ['select', 'choiceList', 'date', 'number'].includes(field.type)
}

/**
 * Generate filter options function for a field
 */
function generateFilterOptions(
  field: FieldConfig,
  apiClient: ApiClient<any>,
  fieldKey: string
): () => Promise<string[]> {
  // For linked record fields (Company, User Roles, Modules), ALWAYS use optimized endpoint
  // This ensures we only get values actually used in the current table
  const linkedRecordFields = ['Company', 'User Roles', 'Modules']
  if (linkedRecordFields.includes(fieldKey) && apiClient.getFilterValues) {
    return async () => {
      try {
        // Use the optimized endpoint that only returns values from user table
        if (!apiClient.getFilterValues) return []
        const values = await apiClient.getFilterValues(fieldKey as any, 100)
        return values
      } catch (error) {
        console.warn(`Error fetching filter values for ${fieldKey}:`, error)
        return []
      }
    }
  }
  
  // For other fields, use field.options if available
  if (field.options) {
    if (typeof field.options === 'function') {
      // For async functions, call without search query to get all options
      return async () => {
        try {
          // Check if it's a search-enabled function (takes searchQuery parameter)
          const fn = field.options as any
          const result = await fn()
          
          // Handle array results
          if (Array.isArray(result)) {
            // For choiceList fields, results may be in "Name|ID" format
            // Return as-is for filters (they handle the format)
            return result
          }
          return []
        } catch (error) {
          console.warn(`Error fetching filter options for ${fieldKey}:`, error)
          return []
        }
      }
    } else if (Array.isArray(field.options)) {
      // Static array of options
      return async () => field.options as string[]
    }
  }
  
  // Fallback: Use API client's getFilterValues if available
  if (apiClient.getFilterValues) {
    return async () => {
      try {
        if (!apiClient.getFilterValues) return []
        const values = await apiClient.getFilterValues(fieldKey as any, 100)
        return values
      } catch (error) {
        console.warn(`Error fetching filter values for ${fieldKey}:`, error)
        return []
      }
    }
  }
  
  // No options available
  return async () => []
}

/**
 * Auto-generate filters from field configurations
 * 
 * @param fields - Array of field configurations
 * @param apiClient - API client instance (for getFilterValues fallback)
 * @param existingFilters - Existing manually configured filters (to avoid duplicates)
 * @returns Array of auto-generated filter configurations
 * 
 * @remarks
 * - Returns an empty array if no filterable fields exist (e.g., only text/textarea fields)
 * - This is expected behavior - text fields use global search instead of filters
 * - Empty array is safe to use and will be handled gracefully by ListDetailTemplate
 */
export function autoGenerateFilters(
  fields: FieldConfig[],
  apiClient: ApiClient<any>,
  existingFilters: FilterConfig[] = []
): FilterConfig[] {
  // Handle edge cases
  if (!fields || fields.length === 0) {
    return []
  }
  
  if (!apiClient) {
    console.warn('autoGenerateFilters: apiClient is required for filter generation')
    return []
  }
  
  const existingFilterKeys = new Set((existingFilters || []).map(f => f.key.toLowerCase()))
  const generatedFilters: FilterConfig[] = []
  
  for (const field of fields) {
    // Skip if filter already exists
    if (existingFilterKeys.has(field.key.toLowerCase())) {
      continue
    }
    
    // Check if field should have a filter
    if (!shouldHaveFilter(field)) {
      continue
    }
    
    // Determine filter type
    // choiceList fields support multiple selections, so use multiselect
    // Other fields use single select
    const filterType: 'select' | 'multiselect' = field.type === 'choiceList' ? 'multiselect' : 'select'
    
    // Generate filter options function
    const optionsFn = generateFilterOptions(field, apiClient, field.key)
    
    // Create filter configuration
    const filter: FilterConfig = {
      key: field.key,
      label: field.label,
      type: filterType,
      options: optionsFn,
      placeholder: `All ${field.label}`,
    }
    
    generatedFilters.push(filter)
  }
  
  // Return empty array if no filters generated (this is valid and expected)
  return generatedFilters
}

/**
 * Merge existing filters with auto-generated filters
 * Existing filters take precedence (appear first)
 * 
 * @param existingFilters - Manually configured filters (can be empty or undefined)
 * @param autoGeneratedFilters - Auto-generated filters (can be empty or undefined)
 * @returns Merged array of filters (always returns an array, even if empty)
 * 
 * @remarks
 * - Handles empty arrays gracefully
 * - Returns empty array if both inputs are empty/undefined
 * - Empty array is valid and safe to use
 */
export function mergeFilters(
  existingFilters: FilterConfig[] = [],
  autoGeneratedFilters: FilterConfig[] = []
): FilterConfig[] {
  // Normalize inputs to arrays
  const existing = Array.isArray(existingFilters) ? existingFilters : []
  const autoGenerated = Array.isArray(autoGeneratedFilters) ? autoGeneratedFilters : []
  
  // If both are empty, return empty array (valid state)
  if (existing.length === 0 && autoGenerated.length === 0) {
    return []
  }
  
  const existingKeys = new Set(existing.map(f => f.key.toLowerCase()))
  
  // Filter out auto-generated filters that conflict with existing ones
  const uniqueAutoFilters = autoGenerated.filter(
    f => !existingKeys.has(f.key.toLowerCase())
  )
  
  // Return existing filters first, then auto-generated ones
  return [...existing, ...uniqueAutoFilters]
}

