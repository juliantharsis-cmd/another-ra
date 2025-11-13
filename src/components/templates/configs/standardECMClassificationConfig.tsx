/**
 * Standard ECM Classification Table Configuration
 */

import { ListDetailTemplateConfig } from '../types'
import { standardECMClassificationApi, StandardECMClassification } from '@/lib/api/standardECMClassification'

const standardECMClassificationApiClient = {
  getPaginated: async (params: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters?: Record<string, any>
  }) => {
    const result = await standardECMClassificationApi.getPaginated({
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
    return await standardECMClassificationApi.getById(id)
  },
  create: async (data: Partial<StandardECMClassification>) => {
    return await standardECMClassificationApi.create(data as any)
  },
  update: async (id: string, data: Partial<StandardECMClassification>) => {
    return await standardECMClassificationApi.update(id, data as any)
  },
  delete: async (id: string) => {
    await standardECMClassificationApi.delete(id)
  },
  getFilterValues: async (field: string, limit?: number) => {
    return await standardECMClassificationApi.getFilterValues(field as 'status', limit)
  },
}

export const standardECMClassificationConfig: ListDetailTemplateConfig<StandardECMClassification> = {
  entityName: 'Standard ECM Classification',
  entityNamePlural: 'Standard ECM Classifications',
  description: 'Manage classification schemes for Energy Conservation Measures (ECMs). Organize ECMs into categories and hierarchies for better management and reporting.',
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
      key: 'Standard ECM catalog Name',
      label: 'ECM Catalog',
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
  ],

  filters: [
    {
      key: 'Status',
      label: 'Status',
      type: 'select',
      options: async () => {
        return await standardECMClassificationApi.getFilterValues('status', 100)
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
        return await standardECMClassificationApi.getFilterValues('status', 100)
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
      key: 'Standard ECM catalog Name',
      label: 'Standard ECM Catalog',
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
        fields: ['Standard ECM catalog Name'],
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
        confirmMessage: 'Are you sure you want to delete this Standard ECM Classification record?',
      },
    },
  },

  apiClient: standardECMClassificationApiClient,
}

