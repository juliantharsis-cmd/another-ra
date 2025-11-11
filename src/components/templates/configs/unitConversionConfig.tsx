/**
 * Unit Conversion Table Configuration
 */

import { ListDetailTemplateConfig } from '../types'
import { unitConversionApi, UnitConversion } from '@/lib/api/unitConversion'

const unitConversionApiClient = {
  getPaginated: async (params: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters?: Record<string, any>
  }) => {
    const result = await unitConversionApi.getPaginated({
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
    return await unitConversionApi.getById(id)
  },
  create: async (data: Partial<UnitConversion>) => {
    return await unitConversionApi.create(data as any)
  },
  update: async (id: string, data: Partial<UnitConversion>) => {
    return await unitConversionApi.update(id, data as any)
  },
  delete: async (id: string) => {
    await unitConversionApi.delete(id)
  },
  getFilterValues: async (field: string, limit?: number) => {
    return await unitConversionApi.getFilterValues(field as 'status', limit)
  },
}

export const unitConversionConfig: ListDetailTemplateConfig<UnitConversion> = {
  entityName: 'Unit Conversion',
  entityNamePlural: 'Unit Conversions',
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
      key: 'Unit to convert',
      label: 'Unit to Convert',
      sortable: true,
      align: 'left',
      width: 'w-32',
      render: (value: string) => (
        <span className="text-sm text-neutral-700">
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'Normalized unit',
      label: 'Normalized Unit',
      sortable: true,
      align: 'left',
      width: 'w-32',
      render: (value: string) => (
        <span className="text-sm text-neutral-700">
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'Conversion factor',
      label: 'Conversion Factor',
      sortable: true,
      align: 'right',
      width: 'w-32',
      render: (value: number) => (
        <span className="text-sm text-neutral-700">
          {value !== undefined && value !== null ? value.toFixed(4) : '—'}
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
        return await unitConversionApi.getFilterValues('status', 100)
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
      key: 'Unit to convert',
      label: 'Unit to Convert',
      type: 'text',
      editable: true,
      placeholder: 'Enter unit to convert...',
      section: 'general',
    },
    {
      key: 'Normalized unit',
      label: 'Normalized Unit',
      type: 'text',
      editable: true,
      placeholder: 'Enter normalized unit...',
      section: 'general',
    },
    {
      key: 'Conversion factor',
      label: 'Conversion Factor',
      type: 'number',
      editable: true,
      placeholder: 'Enter conversion factor...',
      section: 'general',
    },
    {
      key: 'Status',
      label: 'Status',
      type: 'select',
      required: true,
      editable: true,
      options: async () => {
        return await unitConversionApi.getFilterValues('status', 100)
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
      key: 'Activity Density Name',
      label: 'Activity Density',
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
        fields: ['Name', 'Unit to convert', 'Normalized unit', 'Conversion factor', 'Status', 'Description'],
        collapsible: false,
      },
      {
        id: 'relationships',
        title: 'Relationships',
        fields: ['Activity Density Name'],
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
        confirmMessage: 'Are you sure you want to delete this Unit Conversion record?',
      },
    },
  },

  apiClient: unitConversionApiClient,
}

