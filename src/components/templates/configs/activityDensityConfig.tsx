/**
 * Activity Density Table Configuration
 */

import { ListDetailTemplateConfig } from '../types'
import { activityDensityApi, ActivityDensity } from '@/lib/api/activityDensity'

const activityDensityApiClient = {
  getPaginated: async (params: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters?: Record<string, any>
  }) => {
    const result = await activityDensityApi.getPaginated({
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
    return await activityDensityApi.getById(id)
  },
  create: async (data: Partial<ActivityDensity>) => {
    return await activityDensityApi.create(data as any)
  },
  update: async (id: string, data: Partial<ActivityDensity>) => {
    return await activityDensityApi.update(id, data as any)
  },
  delete: async (id: string) => {
    await activityDensityApi.delete(id)
  },
}

export const activityDensityConfig: ListDetailTemplateConfig<ActivityDensity> = {
  entityName: 'Activity Density',
  entityNamePlural: 'Activity Densities',
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
      key: 'Status',
      label: 'Status',
      type: 'select',
      options: ['Active', 'Inactive'],
      defaultValue: 'Active',
    },
  ],

  panel: {
    titleKey: 'Name',
    sections: [
      {
        id: 'general',
        title: 'General Information',
        fields: ['Name', 'Status'],
        collapsible: false,
      },
    ],
    actions: {
      delete: {
        label: 'Delete',
        confirmMessage: 'Are you sure you want to delete this Activity Density record?',
      },
    },
  },

  apiClient: activityDensityApiClient,
}

