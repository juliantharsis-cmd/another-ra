/**
 * Standard Emission Factor Table Configuration
 * 
 * This configuration defines how the Standard Emission Factor entity should be displayed
 * and edited using the ListDetailTemplate.
 */

import { ListDetailTemplateConfig } from '../types'
import { standardEmissionFactorApi, StandardEmissionFactor } from '@/lib/api/standardEmissionFactor'

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
      key: 'Emission Factor Version Name',
      label: 'Emission Factor Version',
      sortable: false,
      align: 'left',
      width: 'w-48',
      render: (value: string | string[]) => {
        if (!value) return <span className="text-sm text-neutral-400">—</span>
        const names = Array.isArray(value) ? value : [value]
        return (
          <span className="text-sm text-neutral-700">
            {names.length > 0 ? names.join(', ') : '—'}
          </span>
        )
      },
    },
    {
      key: 'GHG TYPE Name',
      label: 'GHG TYPE',
      sortable: false,
      align: 'left',
      width: 'w-32',
      render: (value: string | string[]) => {
        if (!value) return <span className="text-sm text-neutral-400">—</span>
        const names = Array.isArray(value) ? value : [value]
        return (
          <span className="text-sm text-neutral-700">
            {names.length > 0 ? names.join(', ') : '—'}
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
    // Relationships Section
    {
      key: 'Emission Factor Version Name',
      label: 'Emission Factor Version',
      type: 'readonly',
      editable: false,
      section: 'relationships',
    },
    {
      key: 'Emission Factor Set Name',
      label: 'Emission Factor Set',
      type: 'readonly',
      editable: false,
      section: 'relationships',
    },
    {
      key: 'GHG TYPE Name',
      label: 'GHG TYPE',
      type: 'readonly',
      editable: false,
      section: 'relationships',
    },
    {
      key: 'EF GWP Name',
      label: 'EF GWP',
      type: 'readonly',
      editable: false,
      section: 'relationships',
    },
    {
      key: 'EF/Detailed G Name',
      label: 'EF/Detailed G',
      type: 'readonly',
      editable: false,
      section: 'relationships',
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
        fields: ['Name', 'Status', 'Description'],
        collapsible: false,
      },
      {
        id: 'relationships',
        title: 'Relationships',
        fields: ['Emission Factor Version Name', 'Emission Factor Set Name', 'GHG TYPE Name', 'EF GWP Name', 'EF/Detailed G Name'],
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

