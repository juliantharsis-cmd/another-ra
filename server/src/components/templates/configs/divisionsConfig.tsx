/**
 * ListDetailTemplate Configuration for Divisions
 * Auto-generated config
 */

import { ListDetailTemplateConfig } from '../types'
import { divisionsApi, Divisions } from '@/lib/api/divisions'

// Create API client adapter
const divisionsApiClient = {
  getPaginated: async (params: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters?: Record<string, any>
  }) => {
    const result = await divisionsApi.getPaginated({
      page: params.page || 1,
      limit: params.limit || 25,
      search: params.search,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      ...params.filters,
    })
    return {
      data: result.data,
      pagination: result.pagination,
    }
  },
  getById: async (id: string) => {
    return await divisionsApi.getById(id)
  },
  create: async (data: Partial<Divisions>) => {
    return await divisionsApi.create(data as any)
  },
  update: async (id: string, data: Partial<Divisions>) => {
    return await divisionsApi.update(id, data as any)
  },
  delete: async (id: string) => {
    await divisionsApi.delete(id)
  },
  getFilterValues: async (field: string, limit?: number) => {
    return await divisionsApi.getFilterValues(field as any, limit)
  },
  bulkImport: async (items: Partial<Divisions>[]) => {
    await divisionsApi.bulkImport(items as any[])
  },
}

export const divisionsConfig: ListDetailTemplateConfig<Divisions> = {
  entityName: 'Divisions',
  entityNamePlural: 'Divisionss',
  description: 'This table contains divisions records with 12 fields. Manage and view divisions data here.',
  defaultSort: {
    field: 'id',
    order: 'asc',
  },
  defaultPageSize: 25,
  pageSizeOptions: [10, 25, 50, 100],
  showImportExport: true,

  columns: [
    // TODO: Configure columns based on schema
    // Example:
    // {
    //   key: 'name',
    //   label: 'Name',
    //   sortable: true,
    //   align: 'left',
    // },
  ],

  fields: [
    // TODO: Configure fields for detail panel
    // Example:
    // {
    //   key: 'name',
    //   label: 'Name',
    //   type: 'text',
    //   required: true,
    //   editable: true,
    //   section: 'main',
    // },
  ],

  panel: {
    titleKey: 'id',
    sections: [
      {
        id: 'main',
        title: 'Main information',
        fields: [],
        collapsible: false,
      },
    ],
    actions: {
      delete: {
        label: 'Delete',
        confirmMessage: 'Are you sure you want to delete this Divisions record?',
      },
    },
  },

  apiClient: divisionsApiClient,
}
