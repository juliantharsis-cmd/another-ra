/**
 * Users Table Configuration
 * 
 * This configuration defines how the Users entity should be displayed
 * and edited using the ListDetailTemplate.
 * 
 * Based on actual Airtable "user table" schema:
 * - Email, First Name, Last Name, User Name, UID
 * - Status (Active, Inactive, Submitted)
 * - Company, User Roles, Modules (linked records)
 * Note: Organization Scope removed - table doesn't exist
 * - Profile Name, Activity Scope, Notes
 * - Attachments
 */

import { ListDetailTemplateConfig } from '../types'
import { userTableApi } from '@/lib/api/userTable'
import type { UserTable } from '@/lib/api/userTable'

// Create API client adapter
const userTableApiClient = {
  getPaginated: async (params: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters?: Record<string, any>
  }) => {
    const result = await userTableApi.getPaginated({
      page: params.page || 1,
      limit: params.limit || 25,
      search: params.search,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      status: params.filters?.status || params.filters?.Status,
    })
    return {
      data: result.data,
      pagination: {
        total: result.pagination.total,
        page: params.page || 1,
        limit: result.pagination.limit,
        hasMore: result.pagination.hasMore,
      },
    }
  },
  getById: async (id: string) => {
    return await userTableApi.getById(id)
  },
  create: async (data: Partial<UserTable>) => {
    return await userTableApi.create(data as any)
  },
  update: async (id: string, data: Partial<UserTable>) => {
    return await userTableApi.update(id, data as any)
  },
  delete: async (id: string) => {
    await userTableApi.delete(id)
  },
  getFilterValues: async (field: string, limit?: number) => {
    return await userTableApi.getFilterValues(field as 'status', limit)
  },
  bulkImport: async (userTables: Partial<UserTable>[]) => {
    return await userTableApi.bulkImport(userTables as any[])
  },
}

export const userTableConfig: ListDetailTemplateConfig<UserTable> = {
  entityName: 'User',
  entityNamePlural: 'Users',
  // Sort by Email by default (most reliable identifier)
  defaultSort: {
    field: 'Email',
    order: 'asc',
  },
  // defaultPageSize will be taken from user preferences
  pageSizeOptions: [10, 25, 50, 100],
  showImportExport: true,

  columns: [
    {
      key: 'Email',
      label: 'Email',
      sortable: true,
      align: 'left',
      render: (value: string) => (
        <span className="text-sm font-medium text-neutral-900">
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'First Name',
      label: 'First Name',
      sortable: true,
      align: 'left',
      render: (value: string) => (
        <span className="text-sm text-neutral-700">
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'Last Name',
      label: 'Last Name',
      sortable: true,
      align: 'left',
      render: (value: string) => (
        <span className="text-sm text-neutral-700">
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'User Name',
      label: 'User Name',
      sortable: false,
      align: 'left',
      render: (value: string) => (
        <span className="text-sm text-neutral-600">
          {value || '—'}
        </span>
      ),
    },
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
    },
    {
      key: 'CompanyName',
      label: 'Company',
      sortable: false,
      filterable: false,
      align: 'left',
      render: (value: string | string[] | undefined, item: UserTable) => {
        // Always use CompanyName (resolved names) - never show Company IDs
        let namesArray: string[] = []
        
        // First check the value parameter (which is CompanyName from the column key)
        if (value) {
          if (Array.isArray(value)) {
            namesArray = value.filter(Boolean).filter((n: string) => n && !n.startsWith('rec'))
          } else if (typeof value === 'string' && value !== '' && !value.startsWith('rec')) {
            namesArray = [value]
          }
        }
        
        // If no names from value, check item.CompanyName directly
        if (namesArray.length === 0 && item.CompanyName) {
          if (Array.isArray(item.CompanyName)) {
            namesArray = item.CompanyName.filter(Boolean).filter((n: string) => n && !n.startsWith('rec'))
          } else if (typeof item.CompanyName === 'string' && item.CompanyName !== '' && !item.CompanyName.startsWith('rec')) {
            namesArray = [item.CompanyName]
          }
        }
        
        // CRITICAL: If we have Company IDs but no CompanyName, show loading state
        // NEVER show the Company IDs directly
        if (namesArray.length === 0) {
          // Check if we have Company IDs
          const hasIds = item.Company && (
            Array.isArray(item.Company) 
              ? item.Company.length > 0 && item.Company.some((id: string) => id && typeof id === 'string' && id.startsWith('rec'))
              : typeof item.Company === 'string' && item.Company.startsWith('rec')
          )
          
          if (hasIds) {
            return (
              <span className="text-sm text-neutral-400 italic">
                Loading...
              </span>
            )
          }
          
          // No company assigned
          return <span className="text-sm text-neutral-400">—</span>
        }
        
        // Show resolved names as badges (same format as detail view)
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
    },
    {
      key: 'User Roles Name',
      label: 'User Roles',
      sortable: false,
      filterable: false,
      align: 'left',
      render: (value: string | string[] | undefined, item: UserTable) => {
        // Always use User Roles Name (resolved names) - never show User Roles IDs
        let namesArray: string[] = []
        
        // First check the value parameter (which is User Roles Name from the column key)
        if (value) {
          if (Array.isArray(value)) {
            namesArray = value.filter(Boolean).filter((n: string) => n && !n.startsWith('rec'))
          } else if (typeof value === 'string' && value !== '' && !value.startsWith('rec')) {
            namesArray = [value]
          }
        }
        
        // If no names from value, check item['User Roles Name'] directly
        if (namesArray.length === 0 && item['User Roles Name']) {
          if (Array.isArray(item['User Roles Name'])) {
            namesArray = item['User Roles Name'].filter(Boolean).filter((n: string) => n && !n.startsWith('rec'))
          } else if (typeof item['User Roles Name'] === 'string' && item['User Roles Name'] !== '' && !item['User Roles Name'].startsWith('rec')) {
            namesArray = [item['User Roles Name']]
          }
        }
        
        // CRITICAL: If we have User Roles IDs but no User Roles Name, show loading state
        // NEVER show the User Roles IDs directly
        if (namesArray.length === 0) {
          // Check if we have User Roles IDs
          const hasIds = item['User Roles'] && (
            Array.isArray(item['User Roles']) 
              ? item['User Roles'].length > 0 && item['User Roles'].some((id: string) => id && typeof id === 'string' && id.startsWith('rec'))
              : typeof item['User Roles'] === 'string' && item['User Roles'].startsWith('rec')
          )
          
          if (hasIds) {
            return (
              <span className="text-sm text-neutral-400 italic">
                Loading...
              </span>
            )
          }
          
          // No roles assigned
          return <span className="text-sm text-neutral-400">—</span>
        }
        
        // Show resolved names as badges (same format as detail view)
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
    },
    {
      key: 'ModulesName',
      label: 'Modules',
      sortable: false,
      filterable: false,
      align: 'left',
      render: (value: string | string[] | undefined, item: UserTable) => {
        // Always use ModulesName (resolved names) - never show Modules IDs
        let namesArray: string[] = []
        
        // First check the value parameter (which is ModulesName from the column key)
        if (value) {
          if (Array.isArray(value)) {
            namesArray = value.filter(Boolean).filter((n: string) => n && !n.startsWith('rec'))
          } else if (typeof value === 'string' && value !== '' && !value.startsWith('rec')) {
            namesArray = [value]
          }
        }
        
        // If no names from value, check item.ModulesName directly
        if (namesArray.length === 0 && item.ModulesName) {
          if (Array.isArray(item.ModulesName)) {
            namesArray = item.ModulesName.filter(Boolean).filter((n: string) => n && !n.startsWith('rec'))
          } else if (typeof item.ModulesName === 'string' && item.ModulesName !== '' && !item.ModulesName.startsWith('rec')) {
            namesArray = [item.ModulesName]
          }
        }
        
        // CRITICAL: If we have Modules IDs but no ModulesName, show loading state
        // NEVER show the Modules IDs directly
        if (namesArray.length === 0) {
          // Check if we have Modules IDs
          const hasIds = item.Modules && (
            Array.isArray(item.Modules) 
              ? item.Modules.length > 0 && item.Modules.some((id: string) => id && typeof id === 'string' && id.startsWith('rec'))
              : typeof item.Modules === 'string' && item.Modules.startsWith('rec')
          )
          
          if (hasIds) {
            return (
              <span className="text-sm text-neutral-400 italic">
                Loading...
              </span>
            )
          }
          
          // No modules assigned
          return <span className="text-sm text-neutral-400">—</span>
        }
        
        // Show resolved names as badges (same format as detail view)
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
    },
  ],

  filters: [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: async () => {
        return await userTableApi.getFilterValues('status', 100)
      },
      placeholder: 'All Status',
    },
  ],

  fields: [
    // General Information
    {
      key: 'Email',
      label: 'Email',
      type: 'text',
      required: true,
      editable: true,
      section: 'general',
    },
    {
      key: 'First Name',
      label: 'First Name',
      type: 'text',
      editable: true,
      section: 'general',
    },
    {
      key: 'Last Name',
      label: 'Last Name',
      type: 'text',
      editable: true,
      section: 'general',
    },
    {
      key: 'User Name',
      label: 'User Name',
      type: 'text',
      editable: true,
      section: 'general',
    },
    {
      key: 'UID',
      label: 'UID',
      type: 'text',
      editable: true,
      section: 'general',
    },
    {
      key: 'Status',
      label: 'Status',
      type: 'select',
      required: true,
      editable: true,
      options: async () => {
        return await userTableApi.getFilterValues('status', 100)
      },
      section: 'general',
    },
    // Profile & Scope
    {
      key: 'Profile Name',
      label: 'Profile Name',
      type: 'text',
      editable: true,
      section: 'profile',
    },
    {
      key: 'Activity Scope',
      label: 'Activity Scope',
      type: 'text',
      editable: true,
      section: 'profile',
    },
    {
      key: 'Attachment',
      label: 'Profile Picture',
      type: 'attachment',
      editable: true,
      section: 'profile',
    },
    // Relationships (linked records - now editable with resolved names)
    // Note: Organization Scope removed - table doesn't exist
    {
      key: 'Company',
      label: 'Company',
      type: 'choiceList',
      editable: true,
      options: async (searchQuery?: string, signal?: AbortSignal) => {
        // Fetch companies with search support - optimized for large datasets
        try {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
          
          // Build query with search if provided
          const queryParams = new URLSearchParams()
          queryParams.append('paginated', 'true')
          
          if (searchQuery && searchQuery.trim()) {
            // If search query provided, use search parameter (more efficient - searches all records)
            queryParams.append('search', searchQuery.trim())
            queryParams.append('limit', '100') // Limit results when searching (enough for most cases)
          } else {
            // Initial load: fetch first page only (optimized - fast initial load)
            queryParams.append('limit', '50')
            queryParams.append('offset', '0')
            queryParams.append('sortBy', 'companyName') // Sort for consistent initial view
            queryParams.append('sortOrder', 'asc')
          }
          
          // Use provided abort signal or create a timeout signal
          const abortSignal = signal || AbortSignal.timeout(10000)
          
          const response = await fetch(`${API_BASE_URL}/companies?${queryParams.toString()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: abortSignal, // Use the abort signal for cancellation
          })
          
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data) {
              return result.data.map((company: any) => {
                const name = company.companyName || company.id
                return `${name}|${company.id}`
              })
            }
          }
        } catch (err: any) {
          // Re-throw abort errors so they can be handled by AsyncChoiceList
          if (err.name === 'AbortError' || err.name === 'TimeoutError') {
            throw err // Let AsyncChoiceList handle abort gracefully
          }
          console.error('Error fetching Companies:', err)
        }
        return []
      },
      searchable: true, // Enable search-based fetching for all companies
      section: 'relationships',
    },
    {
      key: 'User Roles',
      label: 'User Roles',
      type: 'choiceList',
      editable: true,
      options: async () => {
        // Fetch User Roles records from backend
        // NOTE: This endpoint doesn't exist yet - returning empty array gracefully
        try {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
          const response = await fetch(`${API_BASE_URL}/user-roles?limit=1000&paginated=true`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          })
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data) {
              return result.data.map((role: any) => {
                const name = role.Name || role.name || role.id
                return `${name}|${role.id}`
              })
            }
          } else if (response.status === 404) {
            // Endpoint doesn't exist yet - this is expected
            console.log('⚠️ User Roles API endpoint not available yet (404)')
            return []
          }
        } catch (err) {
          // Network error or endpoint doesn't exist - fail gracefully
          console.log('⚠️ User Roles API endpoint not available:', err instanceof Error ? err.message : 'Unknown error')
        }
        return []
      },
      section: 'relationships',
    },
    // Organization Scope removed - table doesn't exist
    {
      key: 'Modules',
      label: 'Modules',
      type: 'choiceList',
      editable: true,
      options: async () => {
        // Fetch Modules records from backend (uses Application List table)
        try {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
          const response = await fetch(`${API_BASE_URL}/application-list?limit=1000&paginated=true`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          })
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data) {
              return result.data.map((module: any) => {
                const name = module.Name || module.name || module.id
                return `${name}|${module.id}`
              })
            }
          } else if (response.status === 404) {
            console.log('⚠️ Application List API endpoint not available (404)')
            return []
          }
        } catch (err) {
          console.log('⚠️ Application List API endpoint error:', err instanceof Error ? err.message : 'Unknown error')
        }
        return []
      },
      section: 'relationships',
    },
    // Notes
    {
      key: 'Notes',
      label: 'Notes',
      type: 'textarea',
      editable: true,
      placeholder: 'Add notes...',
      section: 'notes',
    },
  ],

  panel: {
    titleKey: 'Email', // Use Email as the primary identifier
    sections: [
      {
        id: 'general',
        title: 'General Information',
        fields: ['Email', 'First Name', 'Last Name', 'User Name', 'UID', 'Status'],
        collapsible: false,
      },
      {
        id: 'profile',
        title: 'Profile & Scope',
        fields: ['Profile Name', 'Activity Scope', 'Attachment'],
        collapsible: false,
      },
      {
        id: 'relationships',
        title: 'Relationships',
        fields: ['Company', 'User Roles', 'Modules'],
        // Organization Scope removed
        collapsible: true,
      },
      {
        id: 'notes',
        title: 'Notes',
        fields: ['Notes'],
        collapsible: false,
      },
    ],
    actions: {
      delete: {
        label: 'Delete',
        confirmMessage: 'Are you sure you want to delete this user?',
      },
    },
  },

  apiClient: userTableApiClient,
}
