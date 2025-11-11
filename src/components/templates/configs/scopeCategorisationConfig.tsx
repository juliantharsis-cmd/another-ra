/**
 * Scope & Categorisation Table Configuration
 */

import { ListDetailTemplateConfig } from '../types'
import { scopeCategorisationApi, ScopeCategorisation } from '@/lib/api/scopeCategorisation'

const scopeCategorisationApiClient = {
  getPaginated: async (params: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters?: Record<string, any>
  }) => {
    const result = await scopeCategorisationApi.getPaginated({
      page: params.page || 1,
      limit: params.limit || 25,
      search: params.search,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      status: params.filters?.status,
    })
    return {
      data: result.data,
      pagination: {
        ...result.pagination,
        page: params.page || 1,
      },
    }
  },
  getById: async (id: string) => {
    return await scopeCategorisationApi.getById(id)
  },
  create: async (data: Partial<ScopeCategorisation>) => {
    return await scopeCategorisationApi.create(data as any)
  },
  update: async (id: string, data: Partial<ScopeCategorisation>) => {
    return await scopeCategorisationApi.update(id, data as any)
  },
  delete: async (id: string) => {
    await scopeCategorisationApi.delete(id)
  },
  getFilterValues: async (field: string, limit?: number) => {
    return await scopeCategorisationApi.getFilterValues(field as 'status', limit)
  },
}

export const scopeCategorisationConfig: ListDetailTemplateConfig<ScopeCategorisation> = {
  entityName: 'Scope & Categorisation',
  entityNamePlural: 'Scope & Categorisations',
  defaultSort: {
    field: 'Name',
    order: 'asc',
  },
  pageSizeOptions: [10, 25, 50, 100],
  showImportExport: true,

  columns: [
    {
      key: 'Name',
      label: 'Name',
      sortable: true,
      align: 'left',
      render: (value: string) => (
        <span className="text-sm font-medium text-neutral-900">
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'Description',
      label: 'Description',
      sortable: false,
      align: 'left',
      width: 'w-64',
      render: (value: string) => (
        <span className="text-sm text-neutral-700 line-clamp-2">
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
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            value === 'Active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-neutral-100 text-neutral-800'
          }`}>
            {value || '—'}
          </span>
        )
      },
    },
    {
      key: 'ScopeName',
      label: 'Scope',
      sortable: false,
      align: 'left',
      width: 'w-32',
      render: (value: string | string[] | undefined, item: ScopeCategorisation) => {
        // Always use ScopeName (resolved names) - never show Scope IDs
        let namesArray: string[] = []
        
        // First check the value parameter (which is ScopeName from the column key)
        if (value) {
          if (Array.isArray(value)) {
            namesArray = value.filter(Boolean).filter((n: string) => n && !n.startsWith('rec'))
          } else if (typeof value === 'string' && value !== '' && !value.startsWith('rec')) {
            namesArray = [value]
          }
        }
        
        // If no names from value, check item.ScopeName directly
        if (namesArray.length === 0 && item.ScopeName) {
          if (Array.isArray(item.ScopeName)) {
            namesArray = item.ScopeName.filter(Boolean).filter((n: string) => n && !n.startsWith('rec'))
          } else if (typeof item.ScopeName === 'string' && item.ScopeName !== '' && !item.ScopeName.startsWith('rec')) {
            namesArray = [item.ScopeName]
          }
        }
        
        // CRITICAL: If we have Scope IDs but no ScopeName, show loading state
        // NEVER show the Scope IDs directly
        if (namesArray.length === 0) {
          // Check if we have Scope IDs
          const hasIds = item.Scope && (
            Array.isArray(item.Scope) 
              ? item.Scope.length > 0 && item.Scope.some((id: string) => id && typeof id === 'string' && id.startsWith('rec'))
              : typeof item.Scope === 'string' && item.Scope.startsWith('rec')
          )
          
          if (hasIds) {
            return (
              <span className="text-sm text-neutral-400 italic">
                Loading...
              </span>
            )
          }
          
          // No scope assigned
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
      key: 'Status',
      label: 'Status',
      type: 'select',
      options: async () => {
        return await scopeCategorisationApi.getFilterValues('status', 100)
      },
      placeholder: 'All Status',
    },
  ],

  fields: [
    {
      key: 'Name',
      label: 'Name',
      type: 'text',
      required: true,
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
        return await scopeCategorisationApi.getFilterValues('status', 100)
      },
      section: 'general',
    },
    {
      key: 'Description',
      label: 'Description',
      type: 'textarea',
      editable: true,
      placeholder: 'Enter description...',
      section: 'general',
    },
    {
      key: 'Scope',
      label: 'Scope',
      type: 'choiceList',
      editable: true,
      options: async (searchQuery?: string, signal?: AbortSignal) => {
        // Fetch Scope records from backend
        try {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
          
          // Build query with search if provided
          const queryParams = new URLSearchParams()
          queryParams.append('paginated', 'true')
          
          if (searchQuery && searchQuery.trim()) {
            // If search query provided, use search parameter (more efficient - searches all records)
            queryParams.append('search', searchQuery.trim())
            queryParams.append('limit', '100') // Limit results when searching
          } else {
            // Initial load: fetch first page only (optimized - fast initial load)
            queryParams.append('limit', '50')
            queryParams.append('offset', '0')
            queryParams.append('sortBy', 'Name') // Sort for consistent initial view
            queryParams.append('sortOrder', 'asc')
          }
          
          // Use provided abort signal or create a timeout signal
          const abortSignal = signal || AbortSignal.timeout(10000)
          
          const response = await fetch(`${API_BASE_URL}/scope?${queryParams.toString()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: abortSignal, // Use the abort signal for cancellation
          })
          
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data) {
              return result.data.map((scope: any) => {
                const name = scope.Name || scope.name || scope.id
                return `${name}|${scope.id}`
              })
            }
          }
        } catch (err: any) {
          // Re-throw abort errors so they can be handled by AsyncChoiceList
          if (err.name === 'AbortError' || err.name === 'TimeoutError') {
            throw err // Let AsyncChoiceList handle abort gracefully
          }
          console.error('Error fetching Scope records:', err)
        }
        return []
      },
      searchable: true, // Enable search-based fetching for all Scope records
      section: 'relationships',
    },
    {
      key: 'Notes',
      label: 'Notes & Comments',
      type: 'textarea',
      editable: true,
      placeholder: 'Add notes or comments...',
      section: 'notes',
    },
  ],

  panel: {
    titleKey: 'Name',
    sections: [
      {
        id: 'general',
        title: 'General Information',
        fields: ['Name', 'Status', 'Description'],
        collapsible: false,
      },
      {
        id: 'relationships',
        title: 'Relationships',
        fields: ['Scope'],
        collapsible: true,
      },
      {
        id: 'notes',
        title: 'Notes & Comments',
        fields: ['Notes'],
        collapsible: false,
      },
    ],
    actions: {
      delete: {
        label: 'Delete',
        confirmMessage: 'Are you sure you want to delete this Scope & Categorisation record?',
      },
    },
  },

  apiClient: scopeCategorisationApiClient,
}

