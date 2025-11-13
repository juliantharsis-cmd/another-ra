/**
 * Application List Table Configuration
 * 
 * This configuration defines how the Application List entity should be displayed
 * and edited using the ListDetailTemplate.
 */

import { ListDetailTemplateConfig } from '../types'
import { applicationListApi, ApplicationList } from '@/lib/api/applicationList'

// Create API client adapter
const applicationListApiClient = {
  getPaginated: async (params: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters?: Record<string, any>
  }) => {
    const result = await applicationListApi.getPaginated({
      page: params.page || 1,
      limit: params.limit || 25,
      search: params.search,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      status: params.filters?.status,
    })
    return {
      data: result.data,
      pagination: result.pagination,
    }
  },
  getById: async (id: string) => {
    return await applicationListApi.getById(id)
  },
  create: async (data: Partial<ApplicationList>) => {
    return await applicationListApi.create(data as any)
  },
  update: async (id: string, data: Partial<ApplicationList>) => {
    return await applicationListApi.update(id, data as any)
  },
  delete: async (id: string) => {
    await applicationListApi.delete(id)
  },
  getFilterValues: async (field: string, limit?: number) => {
    return await applicationListApi.getFilterValues(field as 'status', limit)
  },
  bulkImport: async (applicationLists: Partial<ApplicationList>[]) => {
    return await applicationListApi.bulkImport(applicationLists as any[])
  },
}

export const applicationListConfig: ListDetailTemplateConfig<ApplicationList> = {
  entityName: 'Application List',
  entityNamePlural: 'Application Lists',
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
      key: 'Order',
      label: 'Order',
      sortable: true,
      filterable: false,
      align: 'right',
      type: 'number',
      render: (value: number) => (
        <span className="text-sm text-neutral-700">
          {value !== undefined && value !== null ? value : '—'}
        </span>
      ),
    },
    {
      key: 'Alt URL',
      label: 'Alt URL',
      sortable: false,
      filterable: false,
      align: 'left',
      render: (value: string) => {
        if (!value) return <span className="text-sm text-neutral-400">—</span>
        return (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            {value}
          </a>
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
        return await applicationListApi.getFilterValues('status', 100)
      },
      placeholder: 'All Status',
    },
  ],

  fields: [
    // Main Information Section
    {
      key: 'Name',
      label: 'Name',
      type: 'text',
      required: true,
      editable: true,
      section: 'main',
    },
    {
      key: 'Description',
      label: 'Description',
      type: 'textarea',
      editable: true,
      placeholder: 'Enter description...',
      section: 'main',
    },
    {
      key: 'Attachment',
      label: 'Attachments',
      type: 'readonly', // Attachments are handled specially by PanelField
      editable: false,
      section: 'main',
    },
    {
      key: 'Status',
      label: 'Status',
      type: 'select',
      required: true,
      editable: true,
      options: async () => {
        return await applicationListApi.getFilterValues('status', 100)
      },
      section: 'main',
    },
    {
      key: 'Order',
      label: 'Order',
      type: 'number',
      editable: true,
      placeholder: 'Enter order number...',
      section: 'main',
    },
    {
      key: 'Alt URL',
      label: 'Alt URL',
      type: 'text',
      editable: true,
      required: false,
      placeholder: 'e.g., /spaces/system-config/companies or https://example.com',
      section: 'main',
    },
  ],

  panel: {
    titleKey: 'Name',
    sections: [
      {
        id: 'main',
        title: 'Main information',
        fields: ['Name', 'Description', 'Alt URL', 'Attachment', 'Status', 'Order'],
        collapsible: false,
      },
    ],
    actions: {
      delete: {
        label: 'Delete',
        confirmMessage: 'Are you sure you want to delete this Application List record?',
      },
    },
  },

  apiClient: applicationListApiClient,
}

