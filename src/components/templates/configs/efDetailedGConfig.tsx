/**
 * EF/Detailed G Table Configuration
 */

import { ListDetailTemplateConfig } from '../types'
import { efDetailedGApi, EFDetailedG } from '@/lib/api/efDetailedG'

const efDetailedGApiClient = {
  getPaginated: async (params: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters?: Record<string, any>
  }) => {
    const result = await efDetailedGApi.getPaginated({
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
    return await efDetailedGApi.getById(id)
  },
  create: async (data: Partial<EFDetailedG>) => {
    return await efDetailedGApi.create(data as any)
  },
  update: async (id: string, data: Partial<EFDetailedG>) => {
    return await efDetailedGApi.update(id, data as any)
  },
  delete: async (id: string) => {
    await efDetailedGApi.delete(id)
  },
  getFilterValues: async (field: string, limit?: number) => {
    return await efDetailedGApi.getFilterValues(field as 'status', limit)
  },
}

export const efDetailedGConfig: ListDetailTemplateConfig<EFDetailedG> = {
  entityName: 'EF/Detailed G',
  entityNamePlural: 'EF/Detailed G',
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
      key: 'EF GWP Name',
      label: 'EF GWP',
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
        return await efDetailedGApi.getFilterValues('status', 100)
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
        return await efDetailedGApi.getFilterValues('status', 100)
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
      key: 'EF GWP Name',
      label: 'EF GWP',
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
      key: 'Std Emission factors Name',
      label: 'Standard Emission Factors',
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
        fields: ['Name', 'Status', 'Description'],
        collapsible: false,
      },
      {
        id: 'relationships',
        title: 'Relationships',
        fields: ['EF GWP Name', 'GHG TYPE Name', 'Std Emission factors Name'],
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
        confirmMessage: 'Are you sure you want to delete this EF/Detailed G record?',
      },
    },
  },

  apiClient: efDetailedGApiClient,
}

