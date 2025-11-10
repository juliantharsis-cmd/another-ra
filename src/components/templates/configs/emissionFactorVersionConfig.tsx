/**
 * Emission Factor Version Table Configuration
 * 
 * This configuration defines how the Emission Factor Version entity should be displayed
 * and edited using the ListDetailTemplate.
 */

import { ListDetailTemplateConfig } from '../types'
import { emissionFactorVersionApi, EmissionFactorVersion } from '@/lib/api/emissionFactorVersion'

// Create API client adapter
const emissionFactorVersionApiClient = {
  getPaginated: async (params: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters?: Record<string, any>
  }) => {
    const result = await emissionFactorVersionApi.getPaginated({
      page: params.page || 1,
      limit: params.limit || 25,
      search: params.search,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      status: params.filters?.status,
      category: params.filters?.category,
    })
    return {
      data: result.data,
      pagination: result.pagination,
    }
  },
  getById: async (id: string) => {
    return await emissionFactorVersionApi.getById(id)
  },
  create: async (data: Partial<EmissionFactorVersion>) => {
    return await emissionFactorVersionApi.create(data as any)
  },
  update: async (id: string, data: Partial<EmissionFactorVersion>) => {
    return await emissionFactorVersionApi.update(id, data as any)
  },
  delete: async (id: string) => {
    await emissionFactorVersionApi.delete(id)
  },
  getFilterValues: async (field: string, limit?: number) => {
    return await emissionFactorVersionApi.getFilterValues(field as 'status' | 'category', limit)
  },
  bulkImport: async (emissionFactorVersions: Partial<EmissionFactorVersion>[]) => {
    return await emissionFactorVersionApi.bulkImport(emissionFactorVersions as any[])
  },
}

export const emissionFactorVersionConfig: ListDetailTemplateConfig<EmissionFactorVersion> = {
  entityName: 'Emission Factor Version',
  entityNamePlural: 'Emission Factor Versions',
  defaultSort: {
    field: 'Name',
    order: 'asc',
  },
  // defaultPageSize will be taken from user preferences
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
      key: 'Short code',
      label: 'Short Code',
      sortable: true,
      filterable: false,
      align: 'left',
      render: (value: string) => (
        <span className="text-sm text-neutral-700 font-mono">
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'Category',
      label: 'Category',
      sortable: true,
      filterable: true,
      align: 'left',
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
        return await emissionFactorVersionApi.getFilterValues('status', 100)
      },
      placeholder: 'All Status',
    },
    {
      key: 'Category',
      label: 'Category',
      type: 'select',
      options: async () => {
        return await emissionFactorVersionApi.getFilterValues('category', 100)
      },
      placeholder: 'All Categories',
    },
  ],

  fields: [
    // General Info Section
    {
      key: 'Name',
      label: 'Name',
      type: 'text',
      required: true,
      editable: true,
      section: 'general',
    },
    {
      key: 'Short code',
      label: 'Short Code',
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
        return await emissionFactorVersionApi.getFilterValues('status', 100)
      },
      section: 'general',
    },
    // Details Section
    {
      key: 'Description',
      label: 'Description',
      type: 'textarea',
      editable: true,
      placeholder: 'Enter description...',
      section: 'details',
    },
    {
      key: 'Formula',
      label: 'Formula',
      type: 'text',
      editable: true,
      placeholder: 'Enter formula...',
      section: 'details',
    },
    {
      key: 'Category',
      label: 'Category',
      type: 'select',
      editable: true,
      options: async () => {
        return await emissionFactorVersionApi.getFilterValues('category', 100)
      },
      section: 'details',
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
        fields: ['Name', 'Short code', 'Status'],
        collapsible: false,
      },
      {
        id: 'details',
        title: 'Details',
        fields: ['Description', 'Formula', 'Category'],
        collapsible: false,
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
        confirmMessage: 'Are you sure you want to delete this Emission Factor Version record?',
      },
    },
  },

  apiClient: emissionFactorVersionApiClient,
}

