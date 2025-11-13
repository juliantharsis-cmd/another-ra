/**
 * ListDetailTemplate Configuration for Thermal Criteria
 * Auto-generated config
 */

import { ListDetailTemplateConfig } from '../types'
import { thermalCriteriaApi, ThermalCriteria } from '@/lib/api/thermalCriteria'

const thermalCriteriaApiClient = {
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
    
    const result = await thermalCriteriaApi.getPaginated({
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
    return await thermalCriteriaApi.getById(id)
  },
  create: async (data: Partial<ThermalCriteria>) => {
    return await thermalCriteriaApi.create(data as any)
  },
  update: async (id: string, data: Partial<ThermalCriteria>) => {
    return await thermalCriteriaApi.update(id, data as any)
  },
  delete: async (id: string) => {
    await thermalCriteriaApi.delete(id)
  },
}

export const thermalCriteriaConfig: ListDetailTemplateConfig<ThermalCriteria> = {
  entityName: 'Thermal Criteria',
  entityNamePlural: 'Thermal Criteria',
  description: 'Manage thermal criteria and thresholds used for energy efficiency assessments and building performance evaluations.',
  defaultSort: {
    field: 'Name',
    order: 'asc',
  },
  pageSizeOptions: [10, 25, 50, 100],
  showImportExport: true,

  columns: [
    {
      key: 'Zone',
      label: 'Zone',
      sortable: true,
      align: 'left',
      render: (value: string) => (
        <span className="text-sm font-medium text-neutral-900">
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'Thermal Criteria',
      label: 'Thermal Criteria',
      sortable: true,
      align: 'left',
      render: (value: string) => (
        <span className="text-sm font-medium text-neutral-900">
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'Pasted field 1',
      label: 'Pasted field 1',
      sortable: true,
      align: 'left',
      render: (value: string) => (
        <span className="text-sm font-medium text-neutral-900">
          {value || '—'}
        </span>
      ),
    },
  ],

  filters: [],

  fields: [
    {
      key: 'Zone',
      label: 'Zone',
      type: 'text',
      required: false,
    },
    {
      key: 'Thermal Criteria',
      label: 'Thermal Criteria',
      type: 'text',
      required: false,
    },
    {
      key: 'Pasted field 1',
      label: 'Pasted field 1',
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
        fields: ['Zone', 'Thermal Criteria', 'Pasted field 1'],
        collapsible: false,
      },
    ],
    actions: {
      delete: {
        label: 'Delete',
        confirmMessage: 'Are you sure you want to delete this Thermal Criteria record?',
      },
    },
  },

  apiClient: thermalCriteriaApiClient,
}
