'use client'

import { useState, useEffect } from 'react'
import { AIIntegration } from '@/lib/integrations/types'
import { IntegrationMarketplaceProvider } from '@/lib/api/integrationMarketplace'
import { integrationMarketplaceApi } from '@/lib/api/integrationMarketplace'
import { getAllIntegrations, maskApiKey, cleanupDuplicateIntegrations } from '@/lib/integrations/storage'
import { deleteIntegrationsByProvider } from '@/lib/integrations/cleanup'
import { createPortal } from 'react-dom'
import AIProviderConfigModal from './AIProviderConfigModal'
import AIChatInterface from './AIChatInterface'

export default function IntegrationMarketplace() {
  const [providers, setProviders] = useState<IntegrationMarketplaceProvider[]>([])
  const [integrations, setIntegrations] = useState<AIIntegration[]>([])
  const [selectedProvider, setSelectedProvider] = useState<IntegrationMarketplaceProvider | null>(null)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Clean up any duplicate integrations first
      cleanupDuplicateIntegrations()
      
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

  const connectedIntegrations = integrations.filter(i => i.enabled)
  const hasConnectedIntegrations = connectedIntegrations.length > 0

  const handleClearIntegrations = () => {
    if (confirm('Are you sure you want to delete all API keys for Anthropic and Google Gemini? This action cannot be undone.')) {
      const deletedCount = deleteIntegrationsByProvider(['anthropic', 'google'])
      if (deletedCount > 0) {
        alert(`Deleted ${deletedCount} integration(s).`)
        loadData()
        // Dispatch a custom event to notify other components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('integrations-cleared'))
        }
        // Force a page refresh to clear any cached state
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        alert('No integrations found to delete.')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">
            AI Integration Marketplace
          </h3>
          <p className="text-sm text-neutral-500 mt-1">
            Connect and configure third-party AI services. Manage API keys and Personal Access Tokens (PATs) for AI integrations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(integrations.some(i => i.providerId === 'anthropic' || i.providerId === 'google')) && (
            <button
              onClick={handleClearIntegrations}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap border border-red-200"
              title="Delete Anthropic and Google Gemini API keys"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear API Keys
            </button>
          )}
          {hasConnectedIntegrations && (
            <button
              onClick={() => setIsChatOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Try AI Chat
            </button>
          )}
        </div>
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
              className={`relative p-0 border-2 rounded-lg hover:shadow-md transition-all cursor-pointer bg-white overflow-hidden ${
                isConnected 
                  ? 'border-green-500 shadow-sm' 
                  : 'border-neutral-200 hover:border-green-500'
              }`}
            >
              {/* Disabled Overlay - Grey filter when integration exists but is disabled */}
              {integration && !integration.enabled && (
                <div className="absolute inset-0 bg-neutral-900 bg-opacity-40 z-20 flex items-center justify-center rounded-lg">
                  <div className="bg-white rounded-lg px-4 py-2 shadow-lg border border-neutral-200">
                    <p className="text-xs font-medium text-neutral-700">Integration Disabled</p>
                  </div>
                </div>
              )}

              {/* Visual Completion Indicator - Green border accent */}
              {isConnected && integration?.enabled && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-green-500 z-10"></div>
              )}

              {/* Connection Badge */}
              {isConnected && (
                <div className="absolute top-2 right-2 z-30">
                  {integration?.enabled ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-neutral-200 text-neutral-600 rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                      </svg>
                      Disabled
                    </span>
                  )}
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
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {maskApiKey(integration.apiKey)}
                    </span>
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

      {/* AI Chat Interface Modal */}
      {mounted && isChatOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
            <AIChatInterface
              integration={connectedIntegrations[0]}
              onClose={() => setIsChatOpen(false)}
              className="flex-1"
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

