/**
 * Standard Emission Factor Table Configuration
 * 
 * This configuration defines how the Standard Emission Factor entity should be displayed
 * and edited using the ListDetailTemplate.
 */

import { ListDetailTemplateConfig } from '../types'
import { standardEmissionFactorApi, StandardEmissionFactor } from '@/lib/api/standardEmissionFactor'
import { unitApi } from '@/lib/api/unit'
import { scopeApi } from '@/lib/api/scope'
import { normalizedActivityApi } from '@/lib/api/normalizedActivity'
import { efDetailedGApi } from '@/lib/api/efDetailedG'

// Create API client adapter
const standardEmissionFactorApiClient = {
  getPaginated: async (params: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters?: Record<string, any>
  }) => {
    const result = await standardEmissionFactorApi.getPaginated({
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
    return await standardEmissionFactorApi.getById(id)
  },
  create: async (data: Partial<StandardEmissionFactor>) => {
    return await standardEmissionFactorApi.create(data as any)
  },
  update: async (id: string, data: Partial<StandardEmissionFactor>) => {
    return await standardEmissionFactorApi.update(id, data as any)
  },
  delete: async (id: string) => {
    await standardEmissionFactorApi.delete(id)
  },
  getFilterValues: async (field: string, limit?: number) => {
    return await standardEmissionFactorApi.getFilterValues(field as 'status', limit)
  },
}

export const standardEmissionFactorConfig: ListDetailTemplateConfig<StandardEmissionFactor> = {
  entityName: 'Standard Emission Factor',
  entityNamePlural: 'Standard Emission Factors',
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
      key: 'Emission Factor (CO2e)',
      label: 'Emission Factor (CO2e)',
      sortable: true,
      align: 'right',
      width: 'w-32',
      render: (value: number) => (
        <span className="text-sm text-neutral-700">
          {value !== undefined && value !== null ? value.toLocaleString('en-US', { maximumFractionDigits: 4 }) : '—'}
        </span>
      ),
    },
    {
      key: 'Type of EF',
      label: 'Type of EF',
      sortable: true,
      align: 'left',
      width: 'w-32',
      render: (value: string) => (
        <span className="text-sm text-neutral-700">
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'Scope Name',
      label: 'Scope',
      sortable: false,
      align: 'left',
      width: 'w-32',
      render: (value: string | string[] | undefined, item: StandardEmissionFactor) => {
        let namesArray: string[] = []
        
        if (value) {
          if (Array.isArray(value)) {
            namesArray = value.filter(Boolean).filter((n: string) => n && !n.startsWith('rec'))
          } else if (typeof value === 'string' && value !== '' && !value.startsWith('rec')) {
            namesArray = [value]
          }
        }
        
        if (namesArray.length === 0 && item['Scope Name']) {
          if (Array.isArray(item['Scope Name'])) {
            namesArray = item['Scope Name'].filter(Boolean).filter((n: string) => n && !n.startsWith('rec'))
          } else if (typeof item['Scope Name'] === 'string' && item['Scope Name'] !== '' && !item['Scope Name'].startsWith('rec')) {
            namesArray = [item['Scope Name']]
          }
        }
        
        if (namesArray.length === 0) {
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
          
          return <span className="text-sm text-neutral-400">—</span>
        }
        
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
      key: 'Normalized activity Name',
      label: 'Normalized Activity',
      sortable: false,
      align: 'left',
      width: 'w-48',
      render: (value: string | string[] | undefined, item: StandardEmissionFactor) => {
        let namesArray: string[] = []
        
        if (value) {
          if (Array.isArray(value)) {
            namesArray = value.filter(Boolean).filter((n: string) => n && !n.startsWith('rec'))
          } else if (typeof value === 'string' && value !== '' && !value.startsWith('rec')) {
            namesArray = [value]
          }
        }
        
        if (namesArray.length === 0 && item['Normalized activity Name']) {
          if (Array.isArray(item['Normalized activity Name'])) {
            namesArray = item['Normalized activity Name'].filter(Boolean).filter((n: string) => n && !n.startsWith('rec'))
          } else if (typeof item['Normalized activity Name'] === 'string' && item['Normalized activity Name'] !== '' && !item['Normalized activity Name'].startsWith('rec')) {
            namesArray = [item['Normalized activity Name']]
          }
        }
        
        if (namesArray.length === 0) {
          return <span className="text-sm text-neutral-400">—</span>
        }
        
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {namesArray.map((name, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200"
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
        return await standardEmissionFactorApi.getFilterValues('status', 100)
      },
      placeholder: 'All Status',
    },
  ],

  fields: [
    // General Information Section
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
        return await standardEmissionFactorApi.getFilterValues('status', 100)
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
      key: 'Emission Factor (CO2e)',
      label: 'Emission Factor (CO2e)',
      type: 'number',
      editable: true,
      section: 'general',
    },
    {
      key: 'Type of EF',
      label: 'Type of EF',
      type: 'text',
      editable: true,
      section: 'general',
    },
    {
      key: 'Publication Date',
      label: 'Publication Date',
      type: 'date',
      editable: true,
      section: 'general',
    },
    {
      key: 'Availability ',
      label: 'Availability',
      type: 'text',
      editable: true,
      section: 'general',
    },
    {
      key: 'Ref.IC',
      label: 'Ref.IC',
      type: 'text',
      editable: true,
      section: 'general',
    },
    {
      key: 'ID',
      label: 'ID',
      type: 'number',
      editable: true,
      section: 'general',
    },
    {
      key: 'Name copy',
      label: 'Name Copy',
      type: 'text',
      editable: true,
      section: 'general',
    },
    // Linked Records Section - Editable
    {
      key: 'Scope',
      label: 'Scope',
      type: 'choiceList',
      editable: true,
      searchable: true,
      options: async (searchQuery?: string, signal?: AbortSignal) => {
        try {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
          
          const queryParams = new URLSearchParams()
          queryParams.append('paginated', 'true')
          
          if (searchQuery && searchQuery.trim()) {
            queryParams.append('search', searchQuery.trim())
            queryParams.append('limit', '100')
          } else {
            queryParams.append('limit', '50')
            queryParams.append('offset', '0')
            queryParams.append('sortBy', 'Name')
            queryParams.append('sortOrder', 'asc')
          }
          
          const abortSignal = signal || AbortSignal.timeout(10000)
          
          const response = await fetch(`${API_BASE_URL}/scope?${queryParams.toString()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: abortSignal,
          })
          
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data) {
              return result.data.map((item: any) => ({
                value: item.id,
                label: item.Name || item.id,
              }))
            }
          }
          return []
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Error fetching Scope options:', error)
          }
          return []
        }
      },
      section: 'linkedRecords',
    },
    {
      key: 'Normalized activity',
      label: 'Normalized Activity',
      type: 'choiceList',
      editable: true,
      searchable: true,
      options: async (searchQuery?: string, signal?: AbortSignal) => {
        try {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
          
          const queryParams = new URLSearchParams()
          queryParams.append('paginated', 'true')
          
          if (searchQuery && searchQuery.trim()) {
            queryParams.append('search', searchQuery.trim())
            queryParams.append('limit', '100')
          } else {
            queryParams.append('limit', '50')
            queryParams.append('offset', '0')
            queryParams.append('sortBy', 'Name')
            queryParams.append('sortOrder', 'asc')
          }
          
          const abortSignal = signal || AbortSignal.timeout(10000)
          
          const response = await fetch(`${API_BASE_URL}/normalized-activities?${queryParams.toString()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: abortSignal,
          })
          
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data) {
              return result.data.map((item: any) => ({
                value: item.id,
                label: item.Name || item.id,
              }))
            }
          }
          return []
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Error fetching Normalized Activity options:', error)
          }
          return []
        }
      },
      section: 'linkedRecords',
    },
    {
      key: 'Source UOM',
      label: 'Source UOM',
      type: 'choiceList',
      editable: true,
      searchable: true,
      options: async (searchQuery?: string, signal?: AbortSignal) => {
        try {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
          
          const queryParams = new URLSearchParams()
          queryParams.append('paginated', 'true')
          
          if (searchQuery && searchQuery.trim()) {
            queryParams.append('search', searchQuery.trim())
            queryParams.append('limit', '100')
          } else {
            queryParams.append('limit', '50')
            queryParams.append('offset', '0')
            queryParams.append('sortBy', 'Name')
            queryParams.append('sortOrder', 'asc')
          }
          
          const abortSignal = signal || AbortSignal.timeout(10000)
          
          const response = await fetch(`${API_BASE_URL}/unit?${queryParams.toString()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: abortSignal,
          })
          
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data) {
              return result.data.map((item: any) => ({
                value: item.id,
                label: item.Name || item.id,
              }))
            }
          }
          return []
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Error fetching Unit options:', error)
          }
          return []
        }
      },
      section: 'linkedRecords',
    },
    {
      key: 'Activity Default UOM',
      label: 'Activity Default UOM',
      type: 'choiceList',
      editable: true,
      searchable: true,
      options: async (searchQuery?: string, signal?: AbortSignal) => {
        try {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
          
          const queryParams = new URLSearchParams()
          queryParams.append('paginated', 'true')
          
          if (searchQuery && searchQuery.trim()) {
            queryParams.append('search', searchQuery.trim())
            queryParams.append('limit', '100')
          } else {
            queryParams.append('limit', '50')
            queryParams.append('offset', '0')
            queryParams.append('sortBy', 'Name')
            queryParams.append('sortOrder', 'asc')
          }
          
          const abortSignal = signal || AbortSignal.timeout(10000)
          
          const response = await fetch(`${API_BASE_URL}/unit?${queryParams.toString()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: abortSignal,
          })
          
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data) {
              return result.data.map((item: any) => ({
                value: item.id,
                label: item.Name || item.id,
              }))
            }
          }
          return []
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Error fetching Unit options:', error)
          }
          return []
        }
      },
      section: 'linkedRecords',
    },
    {
      key: 'GHG Unit (CO2e)',
      label: 'GHG Unit (CO2e)',
      type: 'choiceList',
      editable: true,
      searchable: true,
      options: async (searchQuery?: string, signal?: AbortSignal) => {
        try {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
          
          const queryParams = new URLSearchParams()
          queryParams.append('paginated', 'true')
          
          if (searchQuery && searchQuery.trim()) {
            queryParams.append('search', searchQuery.trim())
            queryParams.append('limit', '100')
          } else {
            queryParams.append('limit', '50')
            queryParams.append('offset', '0')
            queryParams.append('sortBy', 'Name')
            queryParams.append('sortOrder', 'asc')
          }
          
          const abortSignal = signal || AbortSignal.timeout(10000)
          
          const response = await fetch(`${API_BASE_URL}/unit?${queryParams.toString()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: abortSignal,
          })
          
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data) {
              return result.data.map((item: any) => ({
                value: item.id,
                label: item.Name || item.id,
              }))
            }
          }
          return []
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Error fetching Unit options:', error)
          }
          return []
        }
      },
      section: 'linkedRecords',
    },
    {
      key: 'EF/Detailed G',
      label: 'EF/Detailed G',
      type: 'choiceList',
      editable: true,
      searchable: true,
      options: async (searchQuery?: string, signal?: AbortSignal) => {
        try {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
          
          const queryParams = new URLSearchParams()
          queryParams.append('paginated', 'true')
          
          if (searchQuery && searchQuery.trim()) {
            queryParams.append('search', searchQuery.trim())
            queryParams.append('limit', '100')
          } else {
            queryParams.append('limit', '50')
            queryParams.append('offset', '0')
            queryParams.append('sortBy', 'Name')
            queryParams.append('sortOrder', 'asc')
          }
          
          const abortSignal = signal || AbortSignal.timeout(10000)
          
          const response = await fetch(`${API_BASE_URL}/ef-detailed-g?${queryParams.toString()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: abortSignal,
          })
          
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data) {
              return result.data.map((item: any) => ({
                value: item.id,
                label: item.Name || item.id,
              }))
            }
          }
          return []
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Error fetching EF/Detailed G options:', error)
          }
          return []
        }
      },
      section: 'linkedRecords',
    },
    // Read-only Linked Record Names (for display)
    {
      key: 'Emission Factors Dataset Name',
      label: 'Emission Factors Dataset',
      type: 'readonly',
      editable: false,
      section: 'linkedRecords',
    },
    {
      key: 'Industry Classification & Emission Factors Name',
      label: 'Industry Classification & Emission Factors',
      type: 'readonly',
      editable: false,
      section: 'linkedRecords',
    },
    {
      key: 'Version Name',
      label: 'Version',
      type: 'readonly',
      editable: false,
      section: 'linkedRecords',
    },
    {
      key: 'Industry Classification Name',
      label: 'Industry Classification',
      type: 'readonly',
      editable: false,
      section: 'linkedRecords',
    },
    // Lookup Fields (read-only)
    {
      key: 'code (from Industry Classification  🏭)',
      label: 'Code (from Industry Classification)',
      type: 'readonly',
      editable: false,
      section: 'metadata',
    },
    {
      key: 'Dimension (from Source UOM)',
      label: 'Dimension (from Source UOM)',
      type: 'readonly',
      editable: false,
      section: 'metadata',
    },
    {
      key: 'Status (from Version)',
      label: 'Status (from Version)',
      type: 'readonly',
      editable: false,
      section: 'metadata',
    },
    // System Fields
    {
      key: 'Created',
      label: 'Created',
      type: 'readonly',
      editable: false,
      section: 'system',
    },
    {
      key: 'Last Modified',
      label: 'Last Modified',
      type: 'readonly',
      editable: false,
      section: 'system',
    },
    // Notes Section
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
        fields: [
          'Name',
          'Status',
          'Description',
          'Emission Factor (CO2e)',
          'Type of EF',
          'Publication Date',
          'Availability ',
          'Ref.IC',
          'ID',
          'Name copy',
        ],
        collapsible: false,
      },
      {
        id: 'linkedRecords',
        title: 'Linked Records',
        fields: [
          'Scope',
          'Normalized activity',
          'Source UOM',
          'Activity Default UOM',
          'GHG Unit (CO2e)',
          'EF/Detailed G',
          'Emission Factors Dataset Name',
          'Industry Classification & Emission Factors Name',
          'Version Name',
          'Industry Classification Name',
        ],
        collapsible: true,
      },
      {
        id: 'metadata',
        title: 'Metadata',
        fields: [
          'code (from Industry Classification  🏭)',
          'Dimension (from Source UOM)',
          'Status (from Version)',
        ],
        collapsible: true,
      },
      {
        id: 'system',
        title: 'System Information',
        fields: [
          'Created',
          'Last Modified',
        ],
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
        confirmMessage: 'Are you sure you want to delete this Standard Emission Factor record?',
      },
    },
  },

  apiClient: standardEmissionFactorApiClient,
}
