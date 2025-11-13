/**
 * ListDetailTemplate Configuration for geo Code
 * Auto-generated config
 */

import { ListDetailTemplateConfig } from '../types'
import { geoCodeApi, GeoCode } from '@/lib/api/geoCode'

const geoCodeApiClient = {
  getPaginated: async (params: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters?: Record<string, any>
  }) => {
    const limit = params.limit || 25
    const page = params.page || 1
    const offset = (page - 1) * limit
    
    const result = await geoCodeApi.getPaginated({
      pageSize: limit,
      offset: String(offset),
      filterByFormula: params.filters?.status ? `{Status} = "${params.filters.status}"` : undefined,
      sort: params.sortBy ? [{
        field: params.sortBy,
        direction: params.sortOrder || 'asc',
      }] : undefined,
    })
    
    return {
      data: result.data,
      pagination: {
        total: result.count,
        page,
        limit,
        hasMore: offset + limit < result.count,
      },
    }
  },
  getById: async (id: string) => {
    return await geoCodeApi.getById(id)
  },
  create: async (data: Partial<GeoCode>) => {
    return await geoCodeApi.create(data as any)
  },
  update: async (id: string, data: Partial<GeoCode>) => {
    return await geoCodeApi.update(id, data as any)
  },
  delete: async (id: string) => {
    await geoCodeApi.delete(id)
  },
}

export const geoCodeConfig: ListDetailTemplateConfig<GeoCode> = {
  entityName: 'geo Code',
  entityNamePlural: 'geo Code',
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
      key: 'Notes',
      label: 'Notes',
      sortable: true,
      align: 'left',
      render: (value: string) => (
        <span className="text-sm font-medium text-neutral-900">
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'Assignee',
      label: 'Assignee',
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
      key: 'Ref',
      label: 'Ref',
      sortable: true,
      align: 'left',
      render: (value: string) => (
        <span className="text-sm font-medium text-neutral-900">
          {value || '—'}
        </span>
      ),
    },
  ],


  filters: [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: ['Active', 'Inactive'],
    },
  ],

  fields: [
    {
      key: 'Name',
      label: 'Name',
      type: 'text',
      required: true,
    },
    {
      key: 'Notes',
      label: 'Notes',
      type: 'text',
      required: false,
    },
    {
      key: 'Assignee',
      label: 'Assignee',
      type: 'text',
      required: false,
    },
    {
      key: 'Status',
      label: 'Status',
      type: 'select',
      options: ['Active', 'Inactive'],
      defaultValue: 'Active',
    },
    {
      key: 'Ref',
      label: 'Ref',
      type: 'text',
      required: false,
    },
    {
      key: 'Region',
      label: 'Region',
      type: 'text',
      required: false,
    },
    {
      key: 'Geography 🌍',
      label: 'Geography 🌍',
      type: 'text',
      required: false,
    },
  ],

  panel: {
    titleKey: 'Name',
    sections: [
      {
        id: 'general',
        title: 'General Information',
        fields: ['Name', 'Notes', 'Assignee', 'Status', 'Ref', 'Region', 'Geography 🌍'],
        collapsible: false,
      },
    ],
    actions: {
      delete: {
        label: 'Delete',
        confirmMessage: 'Are you sure you want to delete this geo Code record?',
      },
    },
  },

  apiClient: geoCodeApiClient,
}
