/**
 * Geography Table Configuration
 * 
 * This configuration defines how the Geography entity should be displayed
 * and edited using the ListDetailTemplate.
 */

import { ListDetailTemplateConfig } from '../types'
import { geographyApi, Geography } from '@/lib/api/geography'

// Create API client adapter
const geographyApiClient = {
  getPaginated: async (params: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters?: Record<string, any>
  }) => {
    const result = await geographyApi.getPaginated({
      page: params.page || 1,
      limit: params.limit || 25,
      search: params.search,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      status: params.filters?.status,
      country: params.filters?.country,
    })
    return {
      data: result.data,
      pagination: result.pagination,
    }
  },
  getById: async (id: string) => {
    return await geographyApi.getById(id)
  },
  create: async (data: Partial<Geography>) => {
    return await geographyApi.create(data as any)
  },
  update: async (id: string, data: Partial<Geography>) => {
    return await geographyApi.update(id, data as any)
  },
  delete: async (id: string) => {
    await geographyApi.delete(id)
  },
  getFilterValues: async (field: string, limit?: number) => {
    return await geographyApi.getFilterValues(field as 'status' | 'country', limit)
  },
  bulkImport: async (geographies: Partial<Geography>[]) => {
    return await geographyApi.bulkImport(geographies as any[])
  },
}

export const geographyConfig: ListDetailTemplateConfig<Geography> = {
  entityName: 'Geography',
  entityNamePlural: 'Geography',
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
      render: (value: string, item: any) => (
        <span className="text-sm font-medium text-neutral-900">
          {value || item.regionName || '—'}
        </span>
      ),
    },
    {
      key: 'CODE',
      label: 'CODE',
      sortable: true,
      filterable: true,
      align: 'left',
      render: (value: string, item: any) => (
        <span className="text-sm text-neutral-700">
          {value || item.country || '—'}
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
      render: (value: string, item: any) => {
        const status = value || item.status
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            status === 'Active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-neutral-100 text-neutral-800'
          }`}>
            {status}
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
        return await geographyApiClient.getFilterValues!('status', 100)
      },
      placeholder: 'All Statuses',
    },
    {
      key: 'CODE',
      label: 'CODE',
      type: 'select',
      options: async () => {
        return await geographyApiClient.getFilterValues!('country', 100)
      },
      placeholder: 'All Countries',
    },
  ],

  fields: [
    {
      key: 'Name',
      label: 'Name',
      type: 'text',
      editable: true,
      required: true,
      section: 'general',
    },
    {
      key: 'CODE',
      label: 'CODE',
      type: 'text',
      editable: true,
      required: true,
      section: 'general',
    },
    {
      key: 'Status',
      label: 'Status',
      type: 'choiceList',
      editable: true,
      options: async () => {
        return await geographyApiClient.getFilterValues!('status', 100)
      },
      section: 'general',
    },
    {
      key: 'Notes',
      label: 'Notes',
      type: 'textarea',
      editable: true,
      section: 'notes',
    },
    {
      key: 'createdAt',
      label: 'Created At',
      type: 'readonly',
      section: 'activity',
    },
    {
      key: 'updatedAt',
      label: 'Updated At',
      type: 'readonly',
      section: 'activity',
    },
    {
      key: 'createdBy',
      label: 'Created By',
      type: 'readonly',
      section: 'activity',
    },
    {
      key: 'lastModifiedBy',
      label: 'Last Modified By',
      type: 'readonly',
      section: 'activity',
    },
  ],

  panel: {
    titleKey: 'Name',
    sections: [
      {
        id: 'general',
        title: 'General Information',
        fields: ['Name', 'CODE', 'Status'],
      },
      {
        id: 'notes',
        title: 'Notes & Comments',
        fields: ['Notes'],
      },
      {
        id: 'activity',
        title: 'Activity Log',
        fields: ['createdAt', 'updatedAt', 'createdBy', 'lastModifiedBy'],
      },
    ],
    actions: {
      delete: {
        label: 'Delete',
        confirmMessage: 'Are you sure you want to delete this geography record?',
      },
    },
  },

  apiClient: geographyApiClient,
}

