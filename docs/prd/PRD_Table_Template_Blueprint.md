# Product Requirements Document: Table Template Blueprint

## Document Information

**Document Title:** Table Template Blueprint System  
**Version:** 1.0  
**Date:** January 2025  
**Author:** Product Team  
**Status:** Approved  
**Domain:** architecture, developer-experience, ui-framework  
**Project Naming:** another-ra-ui, another-ra-api

---

## 1. Executive Summary

### 1.1. Problem Statement

Currently, each new table requires manual implementation of navigation patterns, configurations, search criteria, linked record handling, detailed views, filters, and all navigation-related features. This leads to:
- Inconsistent implementations across tables
- Duplication of code and patterns
- Time-consuming development for each new table
- Difficulty maintaining and updating features across all tables

### 1.2. Solution Overview

Create a comprehensive blueprint/template system based on the user table implementation that serves as the standard template for all new tables. This blueprint will define:
- Navigation patterns (list/detail view, panel interactions)
- Configuration structure (columns, fields, filters, sections)
- Search and filtering patterns
- Linked record handling and relationship resolution
- Detailed view structure and validation
- Actions and buttons (CRUD operations)
- Auto-generated filter system
- Persistent filtering
- Column configuration and resizing
- Export/import capabilities

### 1.3. Business Value

**Developer Productivity:** Reduce table implementation time by 70-80%  
**Consistency:** Ensure all tables follow the same patterns and UX  
**Maintainability:** Single source of truth for table features  
**Quality:** Proven patterns from user table ensure reliability  
**Scalability:** Easy to add new tables following the blueprint

---

## 2. Blueprint Components

### 2.1. Configuration Structure

The blueprint defines a standard `ListDetailTemplateConfig` structure:

```typescript
interface ListDetailTemplateConfig<T> {
  // Entity identification
  entityName: string              // Singular: 'User', 'Company'
  entityNamePlural: string        // Plural: 'Users', 'Companies'
  
  // Table display
  columns: ColumnConfig[]          // List view columns
  defaultSort?: { field: string; order: 'asc' | 'desc' }
  defaultPageSize?: number
  pageSizeOptions?: number[]
  
  // Detail panel
  fields: FieldConfig[]           // Detail view fields
  panel: PanelConfig              // Panel sections and actions
  
  // Filtering
  filters?: FilterConfig[]         // Filter definitions (auto-generated + manual)
  
  // API integration
  apiClient: ApiClient<T>         // API client adapter
  
  // Features
  showImportExport?: boolean
  headerActions?: React.ReactNode
  emptyStateMessage?: string
  loadingMessage?: string
}
```

### 2.2. Column Configuration Pattern

**Standard Column Types:**
- Text fields: Standard text display with left alignment
- Status/Select fields: Badge/pill display with color coding
- Linked records: Green badge display with resolved names
- Attachments: Thumbnail display (up to 3) with document icon fallback
- Dates: Formatted date display
- Numbers: Right-aligned with appropriate formatting

**Column Features:**
- Sortable columns (text, numbers, dates, status)
- Filterable columns (auto-generated for non-text fields)
- Resizable columns (with min/max/default widths)
- Custom render functions for special formatting
- Linked record name resolution (never show IDs)

### 2.3. Field Configuration Pattern

**Field Types:**
- `text`: Single-line text input
- `textarea`: Multi-line text input
- `select`: Single-select dropdown (with async options)
- `choiceList`: Multi-select with search (for linked records)
- `readonly`: Display-only field
- `date`: Date picker
- `number`: Number input
- `attachment`: File upload/display

**Field Features:**
- Required field validation
- Editable/readonly states
- Async options loading (for linked records)
- Search-enabled options (for large datasets)
- Section grouping (collapsible sections)

### 2.4. Filter Configuration Pattern

**Auto-Generated Filters:**
- All non-text, non-textarea fields automatically get filters
- Linked records use optimized filter values (only relevant options)
- Select fields use distinct values from data
- Multi-select support for all filter types

**Manual Filters:**
- Can override auto-generated filters
- Can add additional filters
- Support for custom filter logic

**Filter Features:**
- Multi-select support (OR logic within criterion, AND between criteria)
- Search/type-ahead for large option lists
- Persistent filtering (per user, per table)
- Optimized filter options (only show relevant values)

### 2.5. Linked Record Handling Pattern

**Backend Resolution:**
- Backend resolves linked record IDs to names
- Returns both ID field and resolved name field (e.g., `Company` and `CompanyName`)
- Handles permission errors gracefully
- Caches resolved names for performance

**Frontend Display:**
- Always display resolved names (never show IDs)
- Show "Loading..." state if IDs exist but names not yet resolved
- Display as green badges/pills in both list and detail views
- Support search-based fetching for large linked record datasets

**Detail View Editing:**
- Use `AsyncChoiceList` component for linked record fields
- Support search within linked record options
- Display resolved names in selected state
- Handle multiple selections correctly

### 2.6. Navigation Patterns

**List View:**
- Click row to open detail panel
- Search bar for global text search
- Filter button with active filter count
- Sort by clicking column headers
- Pagination controls
- Page size selector
- Export button (respects visible columns and filters)

**Detail View:**
- Slide-in panel from right
- Sections with collapsible groups
- Save button (with validation)
- Delete button (with confirmation)
- Close button
- Auto-save on field blur (debounced)

**State Management:**
- Selected item state
- Panel open/close state
- Loading states (initial load, refresh, save)
- Error states (with user-friendly messages)

### 2.7. Validation Pattern

**Field-Level Validation:**
- Required field checks
- Custom validation functions
- Real-time validation feedback
- Error messages displayed inline

**Form-Level Validation:**
- Validate all required fields before save
- Show summary of errors
- Prevent save if validation fails

**Backend Validation:**
- API returns validation errors
- Display API errors in UI
- Handle network errors gracefully

### 2.8. Actions and Buttons

**Standard Actions:**
- **Create**: Add new record (if supported)
- **Edit**: Modify existing record
- **Delete**: Remove record (with confirmation)
- **Save**: Persist changes (with validation)
- **Cancel**: Discard changes and close panel
- **Export**: Export visible data to CSV
- **Import**: Bulk import from CSV (if supported)

**Action Placement:**
- Header actions: Export, Import, Custom actions
- Panel header: Save, Delete, Close
- Row actions: (Future enhancement)

### 2.9. API Client Pattern

**Required Methods:**
```typescript
interface ApiClient<T> {
  getPaginated: (params) => Promise<{ data: T[], pagination }>
  getById: (id: string) => Promise<T>
  create: (data: Partial<T>) => Promise<T>
  update: (id: string, data: Partial<T>) => Promise<T>
  delete: (id: string) => Promise<void>
  getFilterValues?: (field: string, limit?: number) => Promise<string[]>
  bulkImport?: (items: Partial<T>[]) => Promise<{ success, failed, errors }>
  export?: (params) => Promise<Blob>
}
```

**API Client Adapter:**
- Wraps backend API calls
- Handles error cases
- Transforms data format if needed
- Provides consistent interface

### 2.10. Performance Optimizations

**Data Fetching:**
- Pagination for large datasets
- Debounced search (300ms)
- Debounced filter changes (200ms)
- Data caching (stale-while-revalidate)
- Prefetching for next page

**Linked Record Resolution:**
- Backend resolves names in single query
- Frontend caches resolved names
- Optimized filter options (only relevant values)
- In-memory filtering for linked records

**Rendering:**
- Virtual scrolling for large lists (optional)
- Optimized cell rendering
- Lazy loading of detail panel
- Memoized components

---

## 3. Implementation Guide

### 3.1. Step-by-Step Table Creation

**Step 1: Create Backend API**
1. Create entity type interface
2. Create Airtable service (with linked record resolution)
3. Create repository
4. Create controller
5. Create routes
6. Add to main router

**Step 2: Create Frontend API Client**
1. Create API client file (`src/lib/api/{tableName}.ts`)
2. Implement all required methods
3. Handle errors gracefully

**Step 3: Create Configuration File**
1. Create config file (`src/components/templates/configs/{tableName}Config.tsx`)
2. Define fields array
3. Define columns array
4. Define filters (auto-generate + manual)
5. Define panel sections
6. Create API client adapter
7. Export configuration

**Step 4: Create Route/Page**
1. Import configuration
2. Import `ListDetailTemplate`
3. Pass configuration as prop
4. Add route to router

### 3.2. Configuration Template

```typescript
// 1. Import dependencies
import { ListDetailTemplateConfig } from '../types'
import { tableApi } from '@/lib/api/{tableName}'
import type { TableEntity } from '@/lib/api/{tableName}'
import { autoGenerateFilters, mergeFilters } from '@/lib/autoGenerateFilters'

// 2. Create API client adapter
const tableApiClient = {
  getPaginated: async (params) => { /* ... */ },
  getById: async (id) => { /* ... */ },
  create: async (data) => { /* ... */ },
  update: async (id, data) => { /* ... */ },
  delete: async (id) => { /* ... */ },
  getFilterValues: async (field, limit) => { /* ... */ },
  bulkImport: async (items) => { /* ... */ },
}

// 3. Define fields
const tableFields = [
  {
    key: 'FieldName',
    label: 'Field Label',
    type: 'text' as const,
    required: true,
    editable: true,
    section: 'sectionName',
  },
  // ... more fields
]

// 4. Define manual filters (optional)
const manualFilters = [
  {
    key: 'status',
    label: 'Status',
    type: 'multiselect' as const,
    options: async () => await tableApi.getFilterValues('status', 100),
  },
]

// 5. Auto-generate filters
const autoGeneratedFilters = autoGenerateFilters(tableFields, tableApiClient, manualFilters)
const allFilters = mergeFilters(manualFilters, autoGeneratedFilters)

// 6. Define columns
const tableColumns = [
  {
    key: 'FieldName',
    label: 'Field Label',
    sortable: true,
    align: 'left',
    render: (value) => (/* custom render */),
  },
  // ... more columns
]

// 7. Export configuration
export const tableConfig: ListDetailTemplateConfig<TableEntity> = {
  entityName: 'Entity',
  entityNamePlural: 'Entities',
  defaultSort: { field: 'PrimaryField', order: 'asc' },
  pageSizeOptions: [10, 25, 50, 100],
  showImportExport: true,
  columns: tableColumns,
  filters: allFilters,
  fields: tableFields,
  panel: {
    titleKey: 'PrimaryField',
    sections: [
      {
        id: 'section1',
        title: 'Section Title',
        fields: ['Field1', 'Field2'],
        collapsible: false,
      },
    ],
    actions: {
      delete: {
        label: 'Delete',
        confirmMessage: 'Are you sure?',
      },
    },
  },
  apiClient: tableApiClient,
}
```

### 3.3. Linked Record Field Pattern

```typescript
{
  key: 'LinkedField',
  label: 'Linked Field',
  type: 'choiceList' as const,
  editable: true,
  options: async (searchQuery?: string, signal?: AbortSignal) => {
    // Fetch linked records with search support
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
    const queryParams = new URLSearchParams()
    queryParams.append('paginated', 'true')
    
    if (searchQuery && searchQuery.trim()) {
      queryParams.append('search', searchQuery.trim())
      queryParams.append('limit', '100')
    } else {
      queryParams.append('limit', '50')
      queryParams.append('sortBy', 'name')
      queryParams.append('sortOrder', 'asc')
    }
    
    const response = await fetch(`${API_BASE_URL}/linked-table?${queryParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: signal || AbortSignal.timeout(10000),
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        return result.data.map((item: any) => {
          const name = item.name || item.id
          return `${name}|${item.id}`
        })
      }
    }
    return []
  },
  searchable: true, // Enable search-based fetching
  section: 'relationships',
}
```

### 3.4. Linked Record Column Pattern

```typescript
{
  key: 'LinkedFieldName', // Use resolved name field (e.g., 'CompanyName')
  label: 'Linked Field',
  sortable: false,
  filterable: false,
  align: 'left',
  render: (value: string | string[] | undefined, item: TableEntity) => {
    // Always use resolved names - never show IDs
    let namesArray: string[] = []
    
    if (value) {
      if (Array.isArray(value)) {
        namesArray = value.filter(Boolean).filter((n: string) => n && !n.startsWith('rec'))
      } else if (typeof value === 'string' && value !== '' && !value.startsWith('rec')) {
        namesArray = [value]
      }
    }
    
    // Check item directly if value is empty
    if (namesArray.length === 0 && item.LinkedFieldName) {
      if (Array.isArray(item.LinkedFieldName)) {
        namesArray = item.LinkedFieldName.filter(Boolean).filter((n: string) => n && !n.startsWith('rec'))
      } else if (typeof item.LinkedFieldName === 'string' && !item.LinkedFieldName.startsWith('rec')) {
        namesArray = [item.LinkedFieldName]
      }
    }
    
    // Show loading state if IDs exist but names not resolved
    if (namesArray.length === 0) {
      const hasIds = item.LinkedField && (
        Array.isArray(item.LinkedField) 
          ? item.LinkedField.length > 0 && item.LinkedField.some((id: string) => id && id.startsWith('rec'))
          : typeof item.LinkedField === 'string' && item.LinkedField.startsWith('rec')
      )
      
      if (hasIds) {
        return <span className="text-sm text-neutral-400 italic">Loading...</span>
      }
      
      return <span className="text-sm text-neutral-400">—</span>
    }
    
    // Display as green badges
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
  },
}
```

### 3.5. Status/Select Column Pattern

```typescript
{
  key: 'Status',
  label: 'Status',
  sortable: true,
  filterable: true,
  align: 'center',
  width: 'w-24',
  render: (value: string) => {
    const statusColors: Record<string, { bg: string; text: string }> = {
      'Active': { bg: 'bg-green-100', text: 'text-green-800' },
      'Inactive': { bg: 'bg-neutral-100', text: 'text-neutral-800' },
      'Submitted': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    }
    const colors = statusColors[value] || statusColors['Inactive']
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colors.bg} ${colors.text}`}>
        {value || '—'}
      </span>
    )
  },
}
```

### 3.6. Attachment Column Pattern

```typescript
{
  key: 'Attachment',
  label: 'Attachments',
  sortable: false,
  filterable: false,
  align: 'left',
  render: (value: any) => {
    // Handle attachment objects from Airtable
    if (!value) return <span className="text-sm text-neutral-400">—</span>
    
    const attachments = Array.isArray(value) ? value : [value]
    const validAttachments = attachments.filter((att: any) => att && att.url)
    
    if (validAttachments.length === 0) return <span className="text-sm text-neutral-400">—</span>
    
    // Show up to 3 thumbnails
    const displayAttachments = validAttachments.slice(0, 3)
    
    return (
      <div className="flex items-center gap-1.5">
        {displayAttachments.map((att: any, idx: number) => (
          <img
            key={idx}
            src={att.thumbnails?.small?.url || att.url}
            alt={att.filename || 'Attachment'}
            className="w-8 h-8 object-cover rounded border border-neutral-200"
            onError={(e) => {
              // Fallback to document icon
              e.currentTarget.style.display = 'none'
              const icon = e.currentTarget.nextElementSibling as HTMLElement
              if (icon) icon.style.display = 'block'
            }}
          />
        ))}
        {validAttachments.length > 3 && (
          <span className="text-xs text-neutral-500">+{validAttachments.length - 3}</span>
        )}
      </div>
    )
  },
}
```

---

## 4. Best Practices

### 4.1. Field Naming Conventions

- Use descriptive, consistent field names
- Linked record fields: Use original field name (e.g., `Company`)
- Resolved name fields: Use `{FieldName}Name` (e.g., `CompanyName`)
- Column keys: Use resolved name fields for display (e.g., `CompanyName`)

### 4.2. Section Organization

- Group related fields into logical sections
- Use collapsible sections for optional/advanced fields
- Keep primary fields in non-collapsible sections
- Order sections by importance/frequency of use

### 4.3. Filter Strategy

- Use auto-generated filters for standard fields
- Override with manual filters only when needed
- Use multi-select for status/select fields
- Optimize filter options for linked records

### 4.4. Error Handling

- Always handle API errors gracefully
- Show user-friendly error messages
- Log errors for debugging
- Provide fallback states (empty, loading, error)

### 4.5. Performance

- Use pagination for large datasets
- Debounce search and filter changes
- Cache resolved linked record names
- Optimize filter option fetching

---

## 5. Validation Checklist

When creating a new table, ensure:

- [ ] Backend API implemented with all required methods
- [ ] Linked record resolution working (IDs → names)
- [ ] Frontend API client created and tested
- [ ] Configuration file follows blueprint structure
- [ ] All fields defined with correct types
- [ ] All columns defined with appropriate render functions
- [ ] Filters auto-generated and working
- [ ] Panel sections organized logically
- [ ] Linked records display as green badges (never IDs)
- [ ] Search functionality working
- [ ] Filtering working (including linked records)
- [ ] Export respects visible columns and filters
- [ ] Validation working (required fields, custom validators)
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Empty states implemented

---

## 6. Examples

### 6.1. Simple Table (No Linked Records)

See: `src/components/templates/configs/companyConfig.tsx`

### 6.2. Complex Table (With Linked Records)

See: `src/components/templates/configs/userTableConfig.tsx` (Reference Implementation)

### 6.3. Table with Attachments

See: `src/components/templates/configs/applicationListConfig.tsx`

---

## 7. Future Enhancements

1. **Template Generator CLI**: Command-line tool to scaffold new table configurations
2. **Visual Configurator**: UI tool to create table configurations
3. **Configuration Validation**: TypeScript types and runtime validation
4. **Migration Tools**: Tools to migrate existing tables to blueprint
5. **Documentation Generator**: Auto-generate docs from configuration

---

## 8. References

- [User Table Config](./src/components/templates/configs/userTableConfig.tsx) - Reference Implementation
- [ListDetailTemplate](./src/components/templates/ListDetailTemplate.tsx) - Main Template Component
- [Types Definition](./src/components/templates/types.ts) - Configuration Types
- [Auto-Generated Filters](./src/lib/autoGenerateFilters.ts) - Filter Generation Utility
- [PRD: Auto-Generated Filters](./PRD_Auto_Generated_Filters.md)
- [PRD: Persistent Filtering](./PRD_Persistent_Filtering.md)
- [PRD: Filter Optimization Strategy](./PRD_Filter_Optimization_Strategy.md)

