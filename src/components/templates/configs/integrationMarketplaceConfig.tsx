/**
 * Integration Marketplace Table Configuration
 * 
 * This configuration defines how the Integration Marketplace entity should be displayed
 * and edited using the ListDetailTemplate.
 */

import { ListDetailTemplateConfig } from '../types'
import { integrationMarketplaceApi } from '@/lib/api/integrationMarketplace'
import { IntegrationMarketplaceProvider } from '@/lib/api/integrationMarketplace'

// Create API client adapter
const integrationMarketplaceApiClient = {
  getPaginated: async (params: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters?: Record<string, any>
  }) => {
    // For now, fetch all providers and implement client-side pagination
    // In production, implement server-side pagination
    const allProviders = await integrationMarketplaceApi.getAllProviders()
    
    // Apply search filter
    let filtered = allProviders
    if (params.search) {
      const searchLower = params.search.toLowerCase()
      filtered = allProviders.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.providerId.toLowerCase().includes(searchLower)
      )
    }

    // Apply filters
    if (params.filters?.enabled !== undefined) {
      filtered = filtered.filter(p => p.enabled === params.filters.enabled)
    }
    if (params.filters?.category) {
      filtered = filtered.filter(p => p.category === params.filters.category)
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
        limit,
        offset,
        hasMore: offset + limit < filtered.length,
      },
    }
  },
  getById: async (id: string) => {
    return await integrationMarketplaceApi.getProviderById(id)
  },
  create: async (data: Partial<IntegrationMarketplaceProvider>) => {
    // Service handles array-to-string conversion automatically
    return await integrationMarketplaceApi.createProvider(data as any)
  },
  update: async (id: string, data: Partial<IntegrationMarketplaceProvider>) => {
    // Service handles array-to-string conversion automatically
    return await integrationMarketplaceApi.updateProvider(id, data as any)
  },
  delete: async (id: string) => {
    await integrationMarketplaceApi.deleteProvider(id)
  },
  getFilterValues: async (field: string, limit?: number) => {
    const allProviders = await integrationMarketplaceApi.getAllProviders()
    const values = new Set<string>()
    
    allProviders.forEach(provider => {
      const value = (provider as any)[field]
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => values.add(String(v)))
        } else {
          values.add(String(value))
        }
      }
    })
    
    return Array.from(values).slice(0, limit || 100)
  },
  bulkImport: async (providers: Partial<IntegrationMarketplaceProvider>[]) => {
    const results = []
    for (const provider of providers) {
      try {
        const created = await integrationMarketplaceApi.createProvider(provider as any)
        results.push(created)
      } catch (error) {
        console.error('Error importing provider:', error)
      }
    }
    return results
  },
}

export const integrationMarketplaceConfig: ListDetailTemplateConfig<IntegrationMarketplaceProvider> = {
  entityName: 'Integration Provider',
  entityNamePlural: 'Integrations',
  defaultSort: {
    field: 'sortOrder',
    order: 'asc',
  },
  pageSizeOptions: [10, 25, 50, 100],
  showImportExport: true,
  
  columns: [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      align: 'left',
    },
    {
      key: 'providerId',
      label: 'Provider ID',
      sortable: true,
      align: 'left',
      width: 'w-32',
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      filterable: true,
      align: 'center',
      width: 'w-24',
      render: (value: string) => (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {value}
        </span>
      ),
    },
    {
      key: 'authType',
      label: 'Auth Type',
      sortable: true,
      align: 'center',
      width: 'w-24',
      render: (value: string) => (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-neutral-100 text-neutral-800">
          {value}
        </span>
      ),
    },
    {
      key: 'enabled',
      label: 'Enabled',
      sortable: true,
      filterable: true,
      align: 'center',
      width: 'w-20',
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
      key: 'sortOrder',
      label: 'Sort Order',
      sortable: true,
      align: 'center',
      width: 'w-24',
    },
    {
      key: 'Attachment',
      label: 'Attachments',
      sortable: false,
      align: 'left',
      width: 'w-32',
      render: (value: any) => {
        if (!value) return <span className="text-neutral-400 text-xs">—</span>
        const attachments = Array.isArray(value) ? value : [value]
        const validAttachments = attachments.filter((att: any) => 
          att && (att.url || att.thumbnails?.large?.url || att.thumbnails?.small?.url)
        )
        if (validAttachments.length === 0) return <span className="text-neutral-400 text-xs">—</span>
        return (
          <div className="flex items-center gap-1">
            {validAttachments.slice(0, 3).map((attachment: any, idx: number) => {
              const url = attachment.url || attachment.thumbnails?.large?.url || attachment.thumbnails?.small?.url
              const filename = attachment.filename || attachment.name || `attachment-${idx + 1}`
              const isImage = attachment.type?.startsWith('image/') || 
                             filename.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
              
              if (!url) return null
              
              return (
                <div key={idx} className="relative group">
                  {isImage ? (
                    <img
                      src={url}
                      alt={filename}
                      className="w-8 h-8 object-cover rounded border border-neutral-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center bg-neutral-100 rounded border border-neutral-200">
                      <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {validAttachments.length > 3 && idx === 2 && (
                    <div className="absolute -top-1 -right-1 bg-green-600 text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                      +{validAttachments.length - 3}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      },
    },
  ],

  filters: [
    {
      key: 'enabled',
      label: 'Enabled',
      type: 'select',
      options: async () => {
        return [
          { value: 'true', label: 'Enabled' },
          { value: 'false', label: 'Disabled' },
        ]
      },
      placeholder: 'All Statuses',
    },
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      options: async () => {
        return await integrationMarketplaceApiClient.getFilterValues!('category', 100)
      },
      placeholder: 'All Categories',
    },
  ],

  fields: [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      editable: true,
      required: true,
      section: 'general',
    },
    {
      key: 'providerId',
      label: 'Provider ID',
      type: 'text',
      editable: true,
      required: true,
      section: 'general',
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea',
      editable: true,
      required: true,
      section: 'general',
    },
    {
      key: 'icon',
      label: 'Icon',
      type: 'text',
      editable: true,
      section: 'general',
    },
    {
      key: 'category',
      label: 'Category',
      type: 'choiceList',
      editable: true,
      options: async () => {
        return ['llm', 'vision', 'speech', 'custom']
      },
      section: 'configuration',
    },
    {
      key: 'authType',
      label: 'Auth Type',
      type: 'choiceList',
      editable: true,
      options: async () => {
        return ['api_key', 'pat', 'oauth', 'custom']
      },
      section: 'configuration',
    },
    {
      key: 'baseUrl',
      label: 'Base URL',
      type: 'text',
      editable: true,
      section: 'configuration',
    },
    {
      key: 'documentationUrl',
      label: 'Documentation URL',
      type: 'text',
      editable: true,
      section: 'configuration',
    },
    {
      key: 'supportedModels',
      label: 'Supported Models',
      type: 'textarea',
      editable: true,
      section: 'configuration',
      description: 'Comma-separated list of supported models (e.g., "gpt-4, gpt-3.5-turbo")',
    },
    {
      key: 'defaultModel',
      label: 'Default Model',
      type: 'text',
      editable: true,
      section: 'configuration',
    },
    {
      key: 'features',
      label: 'Features',
      type: 'textarea',
      editable: true,
      section: 'configuration',
      description: 'Comma-separated list of features (e.g., "chat, embeddings, vision")',
    },
    {
      key: 'enabled',
      label: 'Enabled',
      type: 'checkbox',
      editable: true,
      section: 'configuration',
    },
    {
      key: 'sortOrder',
      label: 'Sort Order',
      type: 'number',
      editable: true,
      section: 'configuration',
    },
    {
      key: 'Attachment',
      label: 'Attachments',
      type: 'attachment',
      editable: true,
      section: 'general',
      description: 'Provider logos, documentation files, or other attachments',
    },
  ],

  panel: {
    titleKey: 'name',
    sections: [
      {
        id: 'general',
        title: 'General Information',
        fields: ['name', 'providerId', 'description', 'icon', 'Attachment'],
      },
      {
        id: 'configuration',
        title: 'Configuration',
        fields: ['category', 'authType', 'baseUrl', 'documentationUrl', 'supportedModels', 'defaultModel', 'features', 'enabled', 'sortOrder'],
      },
    ],
    actions: {
      delete: {
        label: 'Delete',
        confirmMessage: 'Are you sure you want to delete this integration provider?',
      },
    },
  },

  apiClient: integrationMarketplaceApiClient,
}

