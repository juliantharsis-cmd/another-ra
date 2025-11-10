/**
 * GHG Type Table Configuration
 * 
 * This configuration defines how the GHG Type entity should be displayed
 * and edited using the ListDetailTemplate.
 */

import { ListDetailTemplateConfig } from '../types'
import { ghgTypeApi, GHGType } from '@/lib/api/ghgType'
import { efGwpApi } from '@/lib/api/efGwp'

// Create API client adapter
const ghgTypeApiClient = {
  getPaginated: async (params: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters?: Record<string, any>
  }) => {
    const result = await ghgTypeApi.getPaginated({
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
    return await ghgTypeApi.getById(id)
  },
  create: async (data: Partial<GHGType>) => {
    return await ghgTypeApi.create(data as any)
  },
  update: async (id: string, data: Partial<GHGType>) => {
    return await ghgTypeApi.update(id, data as any)
  },
  delete: async (id: string) => {
    await ghgTypeApi.delete(id)
  },
  getFilterValues: async (field: string, limit?: number) => {
    return await ghgTypeApi.getFilterValues(field as 'status' | 'category', limit)
  },
  bulkImport: async (ghgTypes: Partial<GHGType>[]) => {
    return await ghgTypeApi.bulkImport(ghgTypes as any[])
  },
}

export const ghgTypeConfig: ListDetailTemplateConfig<GHGType> = {
  entityName: 'GHG Type',
  entityNamePlural: 'GHG Types',
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
        return await ghgTypeApi.getFilterValues('status', 100)
      },
      placeholder: 'All Status',
    },
    {
      key: 'Category',
      label: 'Category',
      type: 'select',
      options: async () => {
        return await ghgTypeApi.getFilterValues('category', 100)
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
        return await ghgTypeApi.getFilterValues('status', 100)
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
        return await ghgTypeApi.getFilterValues('category', 100)
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
    // Related EF GWP (read-only, for display)
    {
      key: 'efGwpCount',
      label: 'Related EF GWP Records',
      type: 'readonly',
      editable: false,
      render: (value: number | undefined, item: GHGType) => {
        const count = value || item.efGwpCount || 0
        return (
          <div className="text-sm text-neutral-700">
            {count > 0 ? (
              <span className="font-medium">{count} EF GWP record{count !== 1 ? 's' : ''} linked</span>
            ) : (
              <span className="text-neutral-400">No EF GWP records linked</span>
            )}
          </div>
        )
      },
      section: 'relationships',
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
      {
        id: 'relationships',
        title: 'Relationships',
        fields: ['efGwpCount'],
        collapsible: true,
      },
    ],
    actions: {
      delete: {
        label: 'Delete',
        confirmMessage: 'Are you sure you want to delete this GHG Type record?',
      },
    },
  },

  apiClient: ghgTypeApiClient,
}

