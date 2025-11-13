/**
 * Company Table Configuration
 * 
 * This configuration defines how the Company entity should be displayed
 * and edited using the ListDetailTemplate.
 */

import { ListDetailTemplateConfig } from '../types'
import { companiesApi } from '@/lib/api/companies'
import { Company } from '@/lib/mockData'
import { getTagColor } from '@/lib/mockData'

// Create API client adapter
const companyApiClient = {
  getPaginated: async (params: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters?: Record<string, any>
  }) => {
    const result = await companiesApi.getPaginated({
      page: params.page || 1,
      limit: params.limit || 25,
      search: params.search,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      status: params.filters?.status,
      primaryIndustry: params.filters?.primaryIndustry,
      primaryActivity: params.filters?.primaryActivity,
    })
    return {
      data: result.data,
      pagination: result.pagination,
    }
  },
  getById: async (id: string) => {
    return await companiesApi.getById(id)
  },
  create: async (data: Partial<Company>) => {
    return await companiesApi.create(data as any)
  },
  update: async (id: string, data: Partial<Company>) => {
    return await companiesApi.update(id, data as any)
  },
  delete: async (id: string) => {
    await companiesApi.delete(id)
  },
  getFilterValues: async (field: string, limit?: number) => {
    return await companiesApi.getFilterValues(field as any, limit)
  },
  bulkImport: async (companies: Partial<Company>[]) => {
    return await companiesApi.bulkImport(companies as any[])
  },
}

export const companyConfig: ListDetailTemplateConfig<Company> = {
  entityName: 'Company',
  entityNamePlural: 'Companies',
  description: 'Manage company records and organizational information. Track company details, industry classifications, activities, and operational status.',
  defaultSort: {
    field: 'companyName',
    order: 'asc',
  },
  // defaultPageSize will be taken from user preferences
  pageSizeOptions: [10, 25, 50, 100],
  showImportExport: true,
  
  columns: [
    {
      key: 'isinCode',
      label: 'ISIN Code',
      sortable: true,
      align: 'left',
      width: 'w-32',
    },
    {
      key: 'companyName',
      label: 'Company Name',
      sortable: true,
      align: 'left',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      align: 'center',
      width: 'w-24',
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          value === 'Active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-neutral-100 text-neutral-800'
        }`}>
          {value}
        </span>
      ),
    },
    {
      key: 'primaryIndustry',
      label: 'Primary Industry',
      sortable: true,
      filterable: true,
      align: 'center',
      render: (value: string) => value ? (
        <span 
          className="inline-flex px-2 py-1 text-xs font-medium rounded-full"
          style={{ 
            backgroundColor: getTagColor(value).bg, 
            color: getTagColor(value).text 
          }}
        >
          {value}
        </span>
      ) : <span className="text-neutral-400">—</span>,
    },
    {
      key: 'primarySector',
      label: 'Primary Sector',
      sortable: true,
      align: 'center',
      render: (value: string) => value ? (
        <span 
          className="inline-flex px-2 py-1 text-xs font-medium rounded-full"
          style={{ 
            backgroundColor: getTagColor(value).bg, 
            color: getTagColor(value).text 
          }}
        >
          {value}
        </span>
      ) : <span className="text-neutral-400">—</span>,
    },
    {
      key: 'primaryActivity',
      label: 'Primary Activity',
      sortable: true,
      filterable: true,
      align: 'center',
      render: (value: string) => value ? (
        <span 
          className="inline-flex px-2 py-1 text-xs font-medium rounded-full"
          style={{ 
            backgroundColor: getTagColor(value).bg, 
            color: getTagColor(value).text 
          }}
        >
          {value}
        </span>
      ) : <span className="text-neutral-400">—</span>,
    },
  ],

  filters: [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: async () => {
        return await companyApiClient.getFilterValues!('status', 100)
      },
      placeholder: 'All Statuses',
    },
    {
      key: 'primaryIndustry',
      label: 'Primary Industry',
      type: 'select',
      options: async () => {
        return await companyApiClient.getFilterValues!('primaryIndustry', 100)
      },
      placeholder: 'All Industries',
    },
    {
      key: 'primaryActivity',
      label: 'Primary Activity',
      type: 'select',
      options: async () => {
        return await companyApiClient.getFilterValues!('primaryActivity', 100)
      },
      placeholder: 'All Activities',
    },
  ],

  fields: [
    {
      key: 'isinCode',
      label: 'ISIN Code',
      type: 'text',
      editable: true,
      required: true,
      section: 'general',
    },
    {
      key: 'companyName',
      label: 'Company Name',
      type: 'text',
      editable: true,
      required: true,
      section: 'general',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'choiceList',
      editable: true,
      options: async () => {
        return await companyApiClient.getFilterValues!('status', 100)
      },
      section: 'general',
    },
    {
      key: 'primaryIndustry',
      label: 'Primary Industry',
      type: 'choiceList',
      editable: true,
      options: async () => {
        return await companyApiClient.getFilterValues!('primaryIndustry', 100)
      },
      section: 'classification',
    },
    {
      key: 'primarySector',
      label: 'Primary Sector',
      type: 'choiceList',
      editable: true,
      options: async () => {
        return await companyApiClient.getFilterValues!('primarySector', 100)
      },
      section: 'classification',
    },
    {
      key: 'primaryActivity',
      label: 'Primary Activity',
      type: 'choiceList',
      editable: true,
      options: async () => {
        return await companyApiClient.getFilterValues!('primaryActivity', 100)
      },
      section: 'classification',
    },
    {
      key: 'notes',
      label: 'Notes',
      type: 'textarea',
      editable: true,
      section: 'notes',
    },
  ],

  panel: {
    titleKey: 'companyName',
    sections: [
      {
        id: 'general',
        title: 'General Information',
        fields: ['isinCode', 'companyName', 'status'],
      },
      {
        id: 'classification',
        title: 'Classification',
        fields: ['primaryIndustry', 'primarySector', 'primaryActivity'],
      },
      {
        id: 'notes',
        title: 'Notes & Comments',
        fields: ['notes'],
      },
    ],
    actions: {
      delete: {
        label: 'Delete',
        confirmMessage: 'Are you sure you want to delete this company?',
      },
    },
  },

  apiClient: companyApiClient,
}



