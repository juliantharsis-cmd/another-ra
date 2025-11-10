/**
 * Template Configuration Types
 * 
 * These types define the structure for configuring the ListDetailTemplate
 * to work with any entity type (Companies, Users, Projects, etc.)
 */

export type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'select' 
  | 'choiceList' 
  | 'readonly' 
  | 'date' 
  | 'number'
  | 'attachment'

export type SortDirection = 'asc' | 'desc'

export type ColumnType = 'text' | 'number' | 'currency' | 'date' | 'boolean' | 'icon'

export interface ColumnConfig {
  /** Unique key for the column (matches data field name) */
  key: string
  /** Display label for the column header */
  label: string
  /** Whether this column is sortable */
  sortable?: boolean
  /** Whether this column is filterable */
  filterable?: boolean
  /** Text alignment: 'left', 'center', 'right' (auto-determined by type if not specified) */
  align?: 'left' | 'center' | 'right'
  /** Column data type (used for auto-alignment and auto-sizing) */
  type?: ColumnType
  /** Custom render function for cell content */
  render?: (value: any, record: any) => React.ReactNode
  /** Width class (e.g., 'w-32', 'w-48') - legacy, use resizable columns instead */
  width?: string
  /** Minimum column width in pixels (for resizing) */
  minWidth?: number
  /** Maximum column width in pixels (for resizing) */
  maxWidth?: number
  /** Default column width in pixels (for resizing) */
  defaultWidth?: number
}

export interface FieldConfig {
  /** Unique key for the field (matches data field name) */
  key: string
  /** Display label for the field */
  label: string
  /** Field type */
  type: FieldType
  /** Whether field is required */
  required?: boolean
  /** Whether field is editable */
  editable?: boolean
  /** Options for select/choiceList fields - can be array, async function, or search-enabled async function */
  options?: string[] | (() => Promise<string[]>) | ((searchQuery?: string, signal?: AbortSignal) => Promise<string[]>)
  /** Whether this field supports search-based fetching (for large datasets) */
  searchable?: boolean
  /** Placeholder text */
  placeholder?: string
  /** Validation function */
  validate?: (value: any) => string | null
  /** Default value */
  defaultValue?: any
  /** Section this field belongs to */
  section?: string
}

export interface FilterConfig {
  /** Field key to filter by */
  key: string
  /** Display label */
  label: string
  /** Filter type: 'select' (single) or 'multiselect' (multiple) */
  type: 'select' | 'multiselect'
  /** Options for the filter (can be async function) */
  options: string[] | (() => Promise<string[]>)
  /** Placeholder text */
  placeholder?: string
}

export interface SectionConfig {
  /** Section identifier */
  id: string
  /** Section title */
  title: string
  /** Field keys that belong to this section */
  fields: string[]
  /** Whether section is collapsible */
  collapsible?: boolean
  /** Default collapsed state */
  defaultCollapsed?: boolean
}

export interface PanelConfig {
  /** Panel title field key (e.g., 'companyName', 'userName') */
  titleKey: string
  /** Sections configuration */
  sections: SectionConfig[]
  /** Actions available in panel header */
  actions?: {
    delete?: {
      label: string
      confirmMessage?: string
    }
    edit?: {
      label: string
    }
  }
}

export interface ApiClient<T = any> {
  /** Get paginated list of items */
  getPaginated: (params: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: SortDirection
    filters?: Record<string, any>
  }) => Promise<{
    data: T[]
    pagination: {
      total: number
      page: number
      limit: number
      hasMore: boolean
    }
  }>
  
  /** Get a single item by ID */
  getById: (id: string) => Promise<T>
  
  /** Create a new item */
  create: (data: Partial<T>) => Promise<T>
  
  /** Update an existing item */
  update: (id: string, data: Partial<T>) => Promise<T>
  
  /** Delete an item */
  delete: (id: string) => Promise<void>
  
  /** Get distinct values for a filter field */
  getFilterValues?: (field: string, limit?: number) => Promise<string[]>
  
  /** Bulk import items */
  bulkImport?: (items: Partial<T>[]) => Promise<{ success: number; failed: number; errors: string[] }>
  
  /** Export items */
  export?: (params?: { filters?: Record<string, any>; sortBy?: string; sortOrder?: SortDirection }) => Promise<Blob>
}

export interface ListDetailTemplateConfig<T = any> {
  /** Entity name (singular, e.g., 'Company', 'User') */
  entityName: string
  /** Entity name (plural, e.g., 'Companies', 'Users') */
  entityNamePlural: string
  /** Table columns configuration */
  columns: ColumnConfig[]
  /** Detail panel fields configuration */
  fields: FieldConfig[]
  /** Filter configuration */
  filters?: FilterConfig[]
  /** Panel configuration */
  panel: PanelConfig
  /** API client instance */
  apiClient: ApiClient<T>
  /** Default sort field */
  defaultSort?: {
    field: string
    order: SortDirection
  }
  /** Default page size */
  defaultPageSize?: number
  /** Page size options */
  pageSizeOptions?: number[]
  /** Whether to show import/export buttons */
  showImportExport?: boolean
  /** Custom header actions */
  headerActions?: React.ReactNode
  /** Custom empty state message */
  emptyStateMessage?: string
  /** Custom loading message */
  loadingMessage?: string
}


