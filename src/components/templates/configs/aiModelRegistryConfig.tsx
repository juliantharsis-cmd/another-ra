/**
 * AI Model Registry Table Configuration
 * 
 * This configuration defines how the AI Model Registry entity should be displayed
 * and edited using the ListDetailTemplate.
 */

import { ListDetailTemplateConfig } from '../types'
import { aiModelRegistryApi } from '@/lib/api/aiModelRegistry'
import { AIModel } from '@/lib/api/aiModelRegistry'

// Create API client adapter
const aiModelRegistryApiClient = {
  getPaginated: async (params: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters?: Record<string, any>
  }) => {
    // Fetch all models and implement client-side pagination
    let allModels: AIModel[] = []
    try {
      allModels = await aiModelRegistryApi.getModels(undefined, false)
    } catch (error) {
      console.error('Error fetching models:', error)
      allModels = []
    }
    
    // Ensure allModels is always an array
    if (!Array.isArray(allModels)) {
      allModels = []
    }
    
    // Apply search filter
    let filtered = allModels
    if (params.search) {
      const searchLower = params.search.toLowerCase()
      filtered = allModels.filter(m => 
        m.modelName.toLowerCase().includes(searchLower) ||
        m.modelId.toLowerCase().includes(searchLower) ||
        m.providerId.toLowerCase().includes(searchLower)
      )
    }

    // Apply filters
    const filters = params.filters || {}
    if (filters.providerId) {
      filtered = filtered.filter(m => m.providerId === filters.providerId)
    }
    if (filters.status) {
      filtered = filtered.filter(m => m.status === filters.status)
    }
    if (filters.available !== undefined) {
      filtered = filtered.filter(m => m.available === (filters.available === 'true' || filters.available === true))
    }
    if (filters.recommended !== undefined) {
      filtered = filtered.filter(m => m.recommended === (filters.recommended === 'true' || filters.recommended === true))
    }

    // Apply sorting
    if (params.sortBy) {
      filtered.sort((a, b) => {
        const aVal = (a as any)[params.sortBy!]
        const bVal = (b as any)[params.sortBy!]
        const order = params.sortOrder === 'desc' ? -1 : 1
        if (aVal < bVal) return -1 * order
        if (aVal > bVal) return 1 * order
        return 0
      })
    }

    // Apply pagination
    const page = params.page || 1
    const limit = params.limit || 25
    const offset = (page - 1) * limit
    const paginated = filtered.slice(offset, offset + limit)

    return {
      data: paginated,
      pagination: {
        total: filtered.length,
        page,
        limit,
        offset,
        hasMore: offset + limit < filtered.length,
      },
    }
  },
  getById: async (id: string): Promise<AIModel> => {
    // Need providerId to fetch by ID, so we'll search all models
    try {
      const allModels = await aiModelRegistryApi.getModels(undefined, false)
      if (!Array.isArray(allModels)) {
        throw new Error('Failed to fetch models')
      }
      const model = allModels.find(m => m.id === id)
      if (!model) {
        throw new Error(`Model with ID ${id} not found`)
      }
      return model
    } catch (error) {
      console.error('Error fetching model by ID:', error)
      throw error instanceof Error ? error : new Error('Failed to fetch model')
    }
  },
  getFilterValues: async (field: string, limit?: number) => {
    try {
      const allModels = await aiModelRegistryApi.getModels(undefined, false)
      if (!Array.isArray(allModels)) {
        return []
      }
      const values = new Set<string>()
      
      allModels.forEach(model => {
        const value = (model as any)[field]
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => values.add(String(v)))
          } else {
            values.add(String(value))
          }
        }
      })
      
      return Array.from(values).slice(0, limit || 100)
    } catch (error) {
      console.error('Error getting filter values:', error)
      return []
    }
  },
}

export const aiModelRegistryConfig: ListDetailTemplateConfig<AIModel> = {
  entityName: 'AI Model',
  entityNamePlural: 'AI Models',
  defaultSort: {
    field: 'sortOrder',
    order: 'asc',
  },
  pageSizeOptions: [10, 25, 50, 100],
  showImportExport: false, // Models are managed via API discovery
  
  columns: [
    {
      key: 'modelName',
      label: 'Model Name',
      sortable: true,
      align: 'left',
    },
    {
      key: 'modelId',
      label: 'Model ID',
      sortable: true,
      align: 'left',
      width: 'w-48',
    },
    {
      key: 'providerId',
      label: 'Provider',
      sortable: true,
      filterable: true,
      align: 'center',
      width: 'w-32',
      render: (value: string, record: AIModel) => {
        // Use provider name from metadata if available, otherwise use providerId
        const providerName = record.metadata?.providerName || value
        return (
          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            {providerName}
          </span>
        )
      },
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      align: 'center',
      width: 'w-24',
      render: (value: string) => {
        const colors: Record<string, { bg: string; text: string }> = {
          active: { bg: 'bg-green-100', text: 'text-green-800' },
          preview: { bg: 'bg-blue-100', text: 'text-blue-800' },
          beta: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
          deprecated: { bg: 'bg-red-100', text: 'text-red-800' },
        }
        const color = colors[value] || { bg: 'bg-neutral-100', text: 'text-neutral-800' }
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${color.bg} ${color.text}`}>
            {value}
          </span>
        )
      },
    },
    {
      key: 'available',
      label: 'Available',
      sortable: true,
      filterable: true,
      align: 'center',
      width: 'w-24',
      render: (value: boolean) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          value 
            ? 'bg-green-100 text-green-800' 
            : 'bg-neutral-100 text-neutral-800'
        }`}>
          {value ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'recommended',
      label: 'Recommended',
      sortable: true,
      filterable: true,
      align: 'center',
      width: 'w-28',
      render: (value: boolean) => (
        value ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Yes
          </span>
        ) : (
          <span className="text-neutral-400 text-xs">—</span>
        )
      ),
    },
    {
      key: 'features',
      label: 'Features',
      sortable: false,
      align: 'left',
      width: 'w-40',
      render: (value: string[]) => {
        if (!value || value.length === 0) return <span className="text-neutral-400 text-xs">—</span>
        return (
          <div className="flex flex-wrap gap-1">
            {value.slice(0, 3).map((feature, idx) => (
              <span key={idx} className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded bg-neutral-100 text-neutral-700">
                {feature}
              </span>
            ))}
            {value.length > 3 && (
              <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded bg-neutral-100 text-neutral-700">
                +{value.length - 3}
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'lastVerified',
      label: 'Last Verified',
      sortable: true,
      align: 'left',
      width: 'w-36',
      render: (value: string) => {
        if (!value) return <span className="text-neutral-400 text-xs">—</span>
        const date = new Date(value)
        return <span className="text-xs text-neutral-600">{date.toLocaleDateString()}</span>
      },
    },
    {
      key: 'sortOrder',
      label: 'Sort Order',
      sortable: true,
      align: 'center',
      width: 'w-24',
    },
  ],

  filters: [
    {
      key: 'providerId',
      label: 'Provider',
      type: 'select',
      options: async () => {
        return await aiModelRegistryApiClient.getFilterValues!('providerId', 100)
      },
      placeholder: 'All Providers',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: async () => {
        return ['active', 'preview', 'beta', 'deprecated']
      },
      placeholder: 'All Statuses',
    },
    {
      key: 'available',
      label: 'Available',
      type: 'select',
      options: async () => {
        return ['true', 'false']
      },
      placeholder: 'All',
    },
    {
      key: 'recommended',
      label: 'Recommended',
      type: 'select',
      options: async () => {
        return ['true', 'false']
      },
      placeholder: 'All',
    },
  ],

  fields: [
    {
      key: 'modelName',
      label: 'Model Name',
      type: 'text',
      required: true,
      editable: false, // Models are managed via API discovery
      section: 'general',
    },
    {
      key: 'modelId',
      label: 'Model ID',
      type: 'text',
      required: true,
      editable: false, // Model IDs shouldn't be changed
      section: 'general',
    },
    {
      key: 'providerId',
      label: 'Provider',
      type: 'text',
      required: true,
      editable: false, // Provider shouldn't be changed
      section: 'general',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'choiceList',
      options: ['active', 'preview', 'beta', 'deprecated'],
      required: true,
      editable: false, // Status is managed via API discovery
      section: 'general',
    },
    {
      key: 'available',
      label: 'Available',
      type: 'readonly', // Checkbox type not available, use readonly
      editable: false,
      section: 'general',
    },
    {
      key: 'recommended',
      label: 'Recommended',
      type: 'readonly', // Checkbox type not available, use readonly
      editable: false,
      section: 'general',
    },
    {
      key: 'features',
      label: 'Features',
      type: 'textarea',
      editable: false,
      section: 'general',
    },
    {
      key: 'costPer1KTokens',
      label: 'Cost per 1K Tokens',
      type: 'number',
      editable: false,
      section: 'metadata',
    },
    {
      key: 'maxTokens',
      label: 'Max Tokens',
      type: 'number',
      editable: false,
      section: 'metadata',
    },
    {
      key: 'sortOrder',
      label: 'Sort Order',
      type: 'number',
      editable: false,
      section: 'metadata',
    },
    {
      key: 'lastVerified',
      label: 'Last Verified',
      type: 'date',
      editable: false,
      section: 'metadata',
    },
    {
      key: 'discoveryMethod',
      label: 'Discovery Method',
      type: 'choiceList',
      options: ['api', 'manual', 'fallback'],
      editable: false,
      section: 'metadata',
    },
  ],

  panel: {
    titleKey: 'modelName',
    sections: [
      {
        id: 'general',
        title: 'General Information',
        fields: ['modelName', 'modelId', 'providerId', 'status', 'available', 'recommended', 'features'],
      },
      {
        id: 'metadata',
        title: 'Metadata',
        fields: ['costPer1KTokens', 'maxTokens', 'sortOrder', 'lastVerified', 'discoveryMethod'],
      },
    ],
  },

  apiClient: {
    ...aiModelRegistryApiClient,
    // Add stub methods for create/update/delete (models are managed via API discovery)
    create: async () => {
      throw new Error('Models are managed via API discovery. Use the Integration Marketplace to configure providers.')
    },
    update: async () => {
      throw new Error('Models are managed via API discovery. Use the Integration Marketplace to configure providers.')
    },
    delete: async () => {
      throw new Error('Models are managed via API discovery. Use the Integration Marketplace to configure providers.')
    },
  },
}

