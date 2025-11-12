/**
 * Unit Conversion Table Configuration
 */

import { ListDetailTemplateConfig } from '../types'
import { unitConversionApi, UnitConversion } from '@/lib/api/unitConversion'

const unitConversionApiClient = {
  getPaginated: async (params: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters?: Record<string, any>
  }) => {
    const result = await unitConversionApi.getPaginated({
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
    return await unitConversionApi.getById(id)
  },
  create: async (data: Partial<UnitConversion>) => {
    return await unitConversionApi.create(data as any)
  },
  update: async (id: string, data: Partial<UnitConversion>) => {
    return await unitConversionApi.update(id, data as any)
  },
  delete: async (id: string) => {
    await unitConversionApi.delete(id)
  },
  getFilterValues: async (field: string, limit?: number) => {
    return await unitConversionApi.getFilterValues(field as 'status', limit)
  },
}

export const unitConversionConfig: ListDetailTemplateConfig<UnitConversion> = {
  entityName: 'Unit Conversion',
  entityNamePlural: 'Unit Conversions',
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
      key: 'Unit to convert Name',
      label: 'Unit to Convert',
      sortable: false,
      align: 'left',
      width: 'w-32',
      render: (value: string | string[] | undefined, item: UnitConversion) => {
        // Always use Unit to convert Name (resolved names) - never show IDs
        let namesArray: string[] = []
        
        if (value) {
          if (Array.isArray(value)) {
            namesArray = value.filter(Boolean).filter((n: string) => n && !n.startsWith('rec'))
          } else if (typeof value === 'string' && value !== '' && !value.startsWith('rec')) {
            namesArray = [value]
          }
        }
        
        if (namesArray.length === 0 && item['Unit to convert Name']) {
          if (Array.isArray(item['Unit to convert Name'])) {
            namesArray = item['Unit to convert Name'].filter(Boolean).filter((n: string) => n && !n.startsWith('rec'))
          } else if (typeof item['Unit to convert Name'] === 'string' && item['Unit to convert Name'] !== '' && !item['Unit to convert Name'].startsWith('rec')) {
            namesArray = [item['Unit to convert Name']]
          }
        }
        
        if (namesArray.length === 0) {
          const hasIds = item['Unit to convert'] && (
            Array.isArray(item['Unit to convert']) 
              ? item['Unit to convert'].length > 0 && item['Unit to convert'].some((id: string) => id && typeof id === 'string' && id.startsWith('rec'))
              : typeof item['Unit to convert'] === 'string' && item['Unit to convert'].startsWith('rec')
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
      key: 'Normalized unit Name',
      label: 'Normalized Unit',
      sortable: false,
      align: 'left',
      width: 'w-32',
      render: (value: string | string[] | undefined, item: UnitConversion) => {
        // Always use Normalized unit Name (resolved names) - never show IDs
        let namesArray: string[] = []
        
        if (value) {
          if (Array.isArray(value)) {
            namesArray = value.filter(Boolean).filter((n: string) => n && !n.startsWith('rec'))
          } else if (typeof value === 'string' && value !== '' && !value.startsWith('rec')) {
            namesArray = [value]
          }
        }
        
        if (namesArray.length === 0 && item['Normalized unit Name']) {
          if (Array.isArray(item['Normalized unit Name'])) {
            namesArray = item['Normalized unit Name'].filter(Boolean).filter((n: string) => n && !n.startsWith('rec'))
          } else if (typeof item['Normalized unit Name'] === 'string' && item['Normalized unit Name'] !== '' && !item['Normalized unit Name'].startsWith('rec')) {
            namesArray = [item['Normalized unit Name']]
          }
        }
        
        if (namesArray.length === 0) {
          const hasIds = item['Normalized unit'] && (
            Array.isArray(item['Normalized unit']) 
              ? item['Normalized unit'].length > 0 && item['Normalized unit'].some((id: string) => id && typeof id === 'string' && id.startsWith('rec'))
              : typeof item['Normalized unit'] === 'string' && item['Normalized unit'].startsWith('rec')
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
      key: 'Value',
      label: 'Value',
      sortable: true,
      align: 'right',
      width: 'w-24',
      render: (value: number) => (
        <span className="text-sm text-neutral-700">
          {value !== undefined && value !== null ? value.toFixed(4) : '—'}
        </span>
      ),
    },
    {
      key: 'Conversion value',
      label: 'Conversion Value',
      sortable: true,
      align: 'right',
      width: 'w-32',
      render: (value: number) => (
        <span className="text-sm text-neutral-700">
          {value !== undefined && value !== null ? value.toFixed(4) : '—'}
        </span>
      ),
    },
    {
      key: 'Type',
      label: 'Type',
      sortable: true,
      align: 'left',
      width: 'w-24',
      render: (value: string) => (
        <span className="text-sm text-neutral-700">
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
  ],

  filters: [
    {
      key: 'Status',
      label: 'Status',
      type: 'select',
      options: async () => {
        return await unitConversionApi.getFilterValues('status', 100)
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
      key: 'Unit to convert',
      label: 'Unit to Convert',
      type: 'choiceList',
      editable: true,
      options: async (searchQuery?: string, signal?: AbortSignal) => {
        // Fetch Unit records from backend
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
              return result.data.map((unit: any) => {
                const name = unit.Name || unit.name || unit.id
                return `${name}|${unit.id}`
              })
            }
          }
        } catch (err: any) {
          if (err.name === 'AbortError' || err.name === 'TimeoutError') {
            throw err
          }
          console.error('Error fetching Unit records:', err)
        }
        return []
      },
      searchable: true,
      section: 'general',
    },
    {
      key: 'Normalized unit',
      label: 'Normalized Unit',
      type: 'choiceList',
      editable: true,
      options: async (searchQuery?: string, signal?: AbortSignal) => {
        // Fetch Unit records from backend
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
              return result.data.map((unit: any) => {
                const name = unit.Name || unit.name || unit.id
                return `${name}|${unit.id}`
              })
            }
          }
        } catch (err: any) {
          if (err.name === 'AbortError' || err.name === 'TimeoutError') {
            throw err
          }
          console.error('Error fetching Unit records:', err)
        }
        return []
      },
      searchable: true,
      section: 'general',
    },
    {
      key: 'Dimension (from Unit to convert)',
      label: 'Dimension (from Unit to convert)',
      type: 'readonly',
      editable: false,
      section: 'general',
    },
    {
      key: 'Dimension (from Normalized unit)',
      label: 'Dimension (from Normalized unit)',
      type: 'readonly',
      editable: false,
      section: 'general',
    },
    {
      key: 'Value',
      label: 'Value',
      type: 'number',
      editable: true,
      placeholder: 'Enter value...',
      section: 'general',
    },
    {
      key: 'Conversion value',
      label: 'Conversion Value',
      type: 'number',
      editable: true,
      placeholder: 'Enter conversion value...',
      section: 'general',
    },
    {
      key: 'Type',
      label: 'Type',
      type: 'text',
      editable: true,
      placeholder: 'Enter type...',
      section: 'general',
    },
    {
      key: 'Status',
      label: 'Status',
      type: 'select',
      required: true,
      editable: true,
      options: async () => {
        return await unitConversionApi.getFilterValues('status', 100)
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
      key: 'Activity Density Name',
      label: 'Activity Density',
      type: 'readonly',
      editable: false,
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
        fields: ['Name', 'Unit to convert', 'Dimension (from Unit to convert)', 'Normalized unit', 'Dimension (from Normalized unit)', 'Value', 'Conversion value', 'Type', 'Status', 'Description'],
        collapsible: false,
      },
      {
        id: 'relationships',
        title: 'Relationships',
        fields: ['Activity Density Name'],
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
        confirmMessage: 'Are you sure you want to delete this Unit Conversion record?',
      },
    },
  },

  apiClient: unitConversionApiClient,
}

