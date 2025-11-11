'use client'

import { useState, useEffect } from 'react'
import { AIIntegration } from '@/lib/integrations/types'
import { IntegrationMarketplaceProvider } from '@/lib/api/integrationMarketplace'
import { integrationMarketplaceApi } from '@/lib/api/integrationMarketplace'
import { getAllIntegrations, maskApiKey } from '@/lib/integrations/storage'
import AIProviderConfigModal from './AIProviderConfigModal'

export default function IntegrationMarketplace() {
  const [providers, setProviders] = useState<IntegrationMarketplaceProvider[]>([])
  const [integrations, setIntegrations] = useState<AIIntegration[]>([])
  const [selectedProvider, setSelectedProvider] = useState<IntegrationMarketplaceProvider | null>(null)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Load providers from Airtable
      const fetchedProviders = await integrationMarketplaceApi.getProviders()
      setProviders(fetchedProviders)
      
      // Load user's saved integrations
      const allIntegrations = getAllIntegrations()
      setIntegrations(allIntegrations)
    } catch (error) {
      console.error('Error loading integration marketplace data:', error)
      // Fallback to hardcoded providers if API fails
      const { AI_PROVIDERS } = await import('@/lib/integrations/providers')
      setProviders(AI_PROVIDERS.map(p => ({
        id: p.id,
        name: p.name,
        providerId: p.id,
        description: p.description,
        icon: p.icon,
        category: p.category,
        authType: p.authType,
        baseUrl: p.baseUrl,
        documentationUrl: p.documentationUrl,
        supportedModels: p.supportedModels,
        defaultModel: p.defaultModel,
        features: p.features,
        enabled: true,
      })))
    } finally {
      setIsLoading(false)
    }
  }

  const handleProviderClick = (provider: IntegrationMarketplaceProvider) => {
    setSelectedProvider(provider)
    setIsConfigModalOpen(true)
  }

  const handleConfigClose = () => {
    setIsConfigModalOpen(false)
    setSelectedProvider(null)
    loadData() // Reload after changes
  }

  const getIntegrationForProvider = (providerId: string): AIIntegration | undefined => {
    return integrations.find(i => i.providerId === providerId && i.enabled)
  }

  const getProviderAttachment = (provider: IntegrationMarketplaceProvider) => {
    // Get the first attachment from the provider
    if (provider.Attachment && Array.isArray(provider.Attachment) && provider.Attachment.length > 0) {
      return provider.Attachment[0]
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-900">
          AI Integration Marketplace
        </h3>
        <p className="text-sm text-neutral-500 mt-1">
          Connect and configure third-party AI services. Manage API keys and Personal Access Tokens (PATs) for AI integrations.
        </p>
      </div>

      {/* Provider Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-neutral-500">Loading providers...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((provider) => {
          const integration = getIntegrationForProvider(provider.providerId)
          const isConnected = !!integration

          return (
            <div
              key={provider.id}
              onClick={() => handleProviderClick(provider)}
              className="relative p-0 border-2 border-neutral-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all cursor-pointer bg-white overflow-hidden"
            >
              {/* Connection Badge */}
              {isConnected && (
                <div className="absolute top-2 right-2 z-10">
                  <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 rounded-full">
                    Connected
                  </span>
                </div>
              )}

              {/* Provider Attachment Image - Full Width */}
              {(() => {
                const attachment = getProviderAttachment(provider)
                const imageUrl = attachment?.url || attachment?.thumbnails?.large?.url || attachment?.thumbnails?.small?.url
                
                return imageUrl ? (
                  <div className="w-full h-32 bg-neutral-100 overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={attachment?.filename || provider.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Hide image and show placeholder on error
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-32 bg-neutral-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )
              })()}

              {/* Card Content */}
              <div className="p-4">

              {/* Provider Info */}
              <h4 className="text-sm font-semibold text-neutral-900 mb-1.5">
                {provider.name}
              </h4>
              <p className="text-xs text-neutral-600 mb-3 line-clamp-2">
                {provider.description}
              </p>

              {/* Features */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {provider.features.slice(0, 3).map((feature) => (
                  <span
                    key={feature}
                    className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-neutral-100 text-neutral-700 rounded"
                  >
                    {feature}
                  </span>
                ))}
                {provider.features.length > 3 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-neutral-100 text-neutral-700 rounded">
                    +{provider.features.length - 3}
                  </span>
                )}
              </div>

              {/* Connection Info */}
              {isConnected && integration && (
                <div className="pt-2 border-t border-neutral-200 mb-3">
                  <div className="flex items-center justify-between text-[10px] text-neutral-500">
                    <span>API Key: {maskApiKey(integration.apiKey)}</span>
                    {integration.lastUsed && (
                      <span>
                        Used {new Date(integration.lastUsed).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleProviderClick(provider)
                  }}
                  className={`w-full px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isConnected
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {isConnected ? 'Configure' : 'Connect'}
                </button>
              </div>
              </div>
            </div>
          )
        })}
        </div>
      )}

      {/* Configuration Modal */}
      {selectedProvider && (
        <AIProviderConfigModal
          isOpen={isConfigModalOpen}
          provider={selectedProvider}
          integration={getIntegrationForProvider(selectedProvider.providerId)}
          onClose={handleConfigClose}
          onSave={loadData}
        />
      )}
    </div>
  )
}

