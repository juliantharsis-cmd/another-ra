/**
 * EF GWP Table Configuration
 * 
 * This configuration defines how the EF GWP (Emission Factor Global Warming Potential) entity should be displayed
 * and edited using the ListDetailTemplate.
 */

import { ListDetailTemplateConfig } from '../types'
import { efGwpApi, EFGWP } from '@/lib/api/efGwp'
import { ghgTypeApi } from '@/lib/api/ghgType'

// Create API client adapter
const efGwpApiClient = {
  getPaginated: async (params: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters?: Record<string, any>
  }) => {
    const result = await efGwpApi.getPaginated({
      page: params.page || 1,
      limit: params.limit || 25,
      search: params.search,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      status: params.filters?.status,
      greenHouseGas: params.filters?.greenHouseGas,
    })
    return {
      data: result.data,
      pagination: result.pagination,
    }
  },
  getById: async (id: string) => {
    return await efGwpApi.getById(id)
  },
  create: async (data: Partial<EFGWP>) => {
    return await efGwpApi.create(data as any)
  },
  update: async (id: string, data: Partial<EFGWP>) => {
    return await efGwpApi.update(id, data as any)
  },
  delete: async (id: string) => {
    await efGwpApi.delete(id)
  },
  getFilterValues: async (field: string, limit?: number) => {
    return await efGwpApi.getFilterValues(field as 'status', limit)
  },
}

export const efGwpConfig: ListDetailTemplateConfig<EFGWP> = {
  entityName: 'EF GWP',
  entityNamePlural: 'EF GWP',
  defaultSort: {
    field: 'factor_name',
    order: 'asc',
  },
  // defaultPageSize will be taken from user preferences
  pageSizeOptions: [10, 25, 50, 100],
  showImportExport: true,

  columns: [
    {
      key: 'factor_name',
      label: 'Factor Name',
      sortable: true,
      align: 'left',
      render: (value: string) => (
        <span className="text-sm font-medium text-neutral-900">
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'ars_version',
      label: 'ARS Version',
      sortable: true,
      filterable: false,
      align: 'left',
      render: (value: string) => (
        <span className="text-sm text-neutral-700">
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'greenHouseGasName',
      label: 'GHG Type',
      sortable: false,
      filterable: true,
      align: 'left',
      render: (value: string | string[] | undefined, item: EFGWP) => {
        // First try to use greenHouseGasName (resolved names)
        let displayNames: string | undefined
        if (value) {
          displayNames = Array.isArray(value) ? value.filter(Boolean).join(', ') : value
        } else if (item.greenHouseGasName) {
          displayNames = Array.isArray(item.greenHouseGasName) 
            ? item.greenHouseGasName.filter(Boolean).join(', ') 
            : item.greenHouseGasName
        }
        
        // If we still don't have names but have IDs, show a loading/placeholder
        // Don't show IDs - only show "Loading..." or resolved names
        if (!displayNames && item.greenHouseGas) {
          // Check if we have IDs but no names - this means names are being resolved
          const hasIds = Array.isArray(item.greenHouseGas) 
            ? item.greenHouseGas.length > 0 
            : !!item.greenHouseGas
          
          if (hasIds) {
            return (
              <span className="text-sm text-neutral-400 italic">
                Loading...
              </span>
            )
          }
        }
        
        return (
          <span className="text-sm text-neutral-700">
            {displayNames || '—'}
          </span>
        )
      },
    },
    {
      key: 'gwp_value',
      label: 'GWP Value',
      sortable: true,
      align: 'right',
      render: (value: number) => {
        // Note: We can't use hooks in render functions, so we'll format in the component
        // For now, use a default format that respects locale
        const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US'
        return (
          <span className="text-sm text-neutral-700">
            {value !== null && value !== undefined ? new Intl.NumberFormat(locale, { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 6,
              useGrouping: true
            }).format(value) : '—'}
          </span>
        )
      },
    },
    {
      key: 'protocolName',
      label: 'Protocol',
      sortable: false,
      filterable: false,
      align: 'left',
      render: (value: string | string[] | undefined, item: EFGWP) => {
        const displayNames = value 
          ? (Array.isArray(value) ? value.filter(Boolean).join(', ') : value)
          : (item.protocolName 
            ? (Array.isArray(item.protocolName) ? item.protocolName.filter(Boolean).join(', ') : item.protocolName)
            : '—')
        return (
          <span className="text-sm text-neutral-700">
            {displayNames || '—'}
          </span>
        )
      },
    },
    {
      key: 'status',
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
      key: 'status',
      label: 'Status',
      type: 'select',
      options: async () => {
        return await efGwpApi.getFilterValues('status')
      },
      placeholder: 'All Status',
    },
    {
      key: 'greenHouseGas',
      label: 'GHG Type',
      type: 'select',
      options: async () => {
        // Fetch all active GHG Types for the filter dropdown
        // Return formatted strings: "Name (ID)" so users see names but we can extract ID
        const result = await ghgTypeApi.getPaginated({ 
          page: 1, 
          limit: 1000,
          status: 'Active'
        })
        // Format as "Name|ID" so we can extract ID when filtering
        return result.data.map(ghg => {
          const name = ghg.Name || ghg['Short code'] || ghg.id
          return `${name}|${ghg.id}`
        })
      },
      placeholder: 'All GHG Types',
    },
  ],

  fields: [
    // General Info Section
    {
      key: 'factor_name',
      label: 'Factor Name',
      type: 'text',
      required: true,
      editable: true,
      section: 'general',
    },
    {
      key: 'ars_version',
      label: 'ARS Version',
      type: 'text',
      editable: true,
      placeholder: 'Enter ARS version',
      section: 'general',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      editable: true,
      options: ['Active', 'Inactive'],
      section: 'general',
    },
    {
      key: 'greenHouseGas',
      label: 'GHG Type',
      type: 'choiceList',
      editable: true,
      options: async () => {
        // Fetch all active GHG Types for the dropdown
        // Return format: "Name|ID" so we can extract ID when saving
        const result = await ghgTypeApi.getPaginated({ 
          page: 1, 
          limit: 1000,
          status: 'Active'
        })
        return result.data.map(ghg => {
          const name = ghg.Name || ghg['Short code'] || ghg.id
          return `${name}|${ghg.id}`
        })
      },
      section: 'general',
    },
    // GWP Details Section
    {
      key: 'gwp_value',
      label: 'GWP Value',
      type: 'number',
      required: true,
      editable: true,
      placeholder: 'Enter GWP value',
      section: 'gwp',
    },
    {
      key: 'protocol',
      label: 'Protocol',
      type: 'choiceList',
      editable: true,
      options: async () => {
        // Fetch Protocol records from backend
        try {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
          const response = await fetch(`${API_BASE_URL}/protocols?limit=1000&paginated=true`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          })
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data) {
              return result.data.map((protocol: any) => {
                const name = protocol.Name || protocol.name || protocol.id
                return `${name}|${protocol.id}`
              })
            }
          }
        } catch (err) {
          console.error('Error fetching Protocol records:', err)
        }
        return []
      },
      section: 'gwp',
    },
    {
      key: 'efDetailedG',
      label: 'EF/Detailed G',
      type: 'choiceList',
      editable: true,
      options: async () => {
        // Fetch EF/Detailed G records from backend
        try {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
          const response = await fetch(`${API_BASE_URL}/ef-detailed-g?limit=1000&paginated=true`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          })
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data) {
              return result.data.map((ef: any) => {
                const name = ef.Name || ef.name || ef.id
                return `${name}|${ef.id}`
              })
            }
          }
        } catch (err) {
          console.error('Error fetching EF/Detailed G records:', err)
        }
        return []
      },
      section: 'gwp',
    },
    // Notes Section
    {
      key: 'notes',
      label: 'Notes & Comments',
      type: 'textarea',
      editable: true,
      placeholder: 'Add notes or comments...',
      section: 'notes',
    },
  ],

  panel: {
    titleKey: 'factor_name',
    sections: [
      {
        id: 'general',
        title: 'General Info',
        fields: ['factor_name', 'ars_version', 'status', 'greenHouseGas'],
        collapsible: false,
      },
      {
        id: 'gwp',
        title: 'GWP Details',
        fields: ['gwp_value', 'protocol', 'efDetailedG'],
        collapsible: false,
      },
      {
        id: 'notes',
        title: 'Notes & Comments',
        fields: ['notes'],
        collapsible: false,
      },
    ],
    actions: {
      delete: {
        label: 'Delete',
        confirmMessage: 'Are you sure you want to delete this EF GWP record?',
      },
    },
  },

  apiClient: efGwpApiClient,
}

// Export alias for backward compatibility (deprecated)
export const emissionFactorConfig = efGwpConfig

