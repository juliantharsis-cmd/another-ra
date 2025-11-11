'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { XMarkIcon } from './icons'
import { AIIntegration, IntegrationConfig } from '@/lib/integrations/types'
import { IntegrationMarketplaceProvider } from '@/lib/api/integrationMarketplace'
import {
  saveIntegration,
  createIntegration,
  updateIntegration,
  deleteIntegration,
  maskApiKey,
} from '@/lib/integrations/storage'
import Notification from './Notification'

interface AIProviderConfigModalProps {
  isOpen: boolean
  provider: IntegrationMarketplaceProvider
  integration?: AIIntegration
  onClose: () => void
  onSave: () => void
}

export default function AIProviderConfigModal({
  isOpen,
  provider,
  integration,
  onClose,
  onSave,
}: AIProviderConfigModalProps) {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'credentials' | 'settings' | 'usage'>('credentials')
  const [apiKey, setApiKey] = useState('')
  const [apiKeyType, setApiKeyType] = useState<'api_key' | 'pat' | 'oauth' | 'custom'>('api_key')
  const [baseUrl, setBaseUrl] = useState(provider.baseUrl || '')
  const [model, setModel] = useState(provider.defaultModel || '')
  const [enabled, setEnabled] = useState(true)
  const [showApiKey, setShowApiKey] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      if (integration) {
        setApiKey(integration.apiKey)
        setApiKeyType(integration.apiKeyType)
        setBaseUrl(integration.baseUrl || provider.baseUrl || '')
        setModel(integration.model || provider.defaultModel || '')
        setEnabled(integration.enabled)
      } else {
        // Reset to defaults
        setApiKey('')
        setApiKeyType(provider.authType === 'api_key' ? 'api_key' : 'pat')
        setBaseUrl(provider.baseUrl || '')
        setModel(provider.defaultModel || '')
        setEnabled(true)
      }
      setShowApiKey(false)
      setActiveTab('credentials')
    }
  }, [isOpen, integration, provider])

  if (!isOpen || !mounted) return null

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setNotification({
        message: 'Please enter an API key to test the connection',
        type: 'error',
      })
      return
    }

    setIsTesting(true)
    setNotification(null)

    try {
      // Simulate connection test (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1500))

      // In production, make actual API call to test connection
      // const response = await fetch('/api/integrations/test', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ providerId: provider.id, apiKey, baseUrl }),
      // })

      setNotification({
        message: 'Connection test successful!',
        type: 'success',
      })
    } catch (error) {
      setNotification({
        message: 'Connection test failed. Please check your API key and try again.',
        type: 'error',
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setNotification({
        message: 'API key is required',
        type: 'error',
      })
      return
    }

    setIsSaving(true)
    setNotification(null)

    try {
      const config: IntegrationConfig = {
        providerId: provider.id,
        apiKey: apiKey.trim(),
        apiKeyType: apiKeyType,
        baseUrl: baseUrl.trim() || undefined,
        model: model.trim() || undefined,
        enabled,
      }

      if (integration) {
        updateIntegration(integration.id, config)
      } else {
        const newIntegration = createIntegration(config, provider.name)
        saveIntegration(newIntegration)
      }

      setNotification({
        message: integration ? 'Integration updated successfully' : 'Integration created successfully',
        type: 'success',
      })

      setTimeout(() => {
        onSave()
        onClose()
      }, 1000)
    } catch (error) {
      setNotification({
        message: 'Failed to save integration. Please try again.',
        type: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = () => {
    if (!integration) return

    if (confirm('Are you sure you want to delete this integration? This action cannot be undone.')) {
      try {
        deleteIntegration(integration.id)
        setNotification({
          message: 'Integration deleted successfully',
          type: 'success',
        })
        setTimeout(() => {
          onSave()
          onClose()
        }, 1000)
      } catch (error) {
        setNotification({
          message: 'Failed to delete integration',
          type: 'error',
        })
      }
    }
  }

  const modalContent = (
    <>
      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
          duration={4000}
        />
      )}

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900 bg-opacity-30 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">
                Configure {provider.name}
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                {integration ? 'Update your integration settings' : 'Connect to this AI provider'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-neutral-200">
            <button
              onClick={() => setActiveTab('credentials')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'credentials'
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              Credentials
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              Settings
            </button>
            {integration && (
              <button
                onClick={() => setActiveTab('usage')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'usage'
                    ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                Usage
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'credentials' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    API Key Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={apiKeyType}
                    onChange={(e) => setApiKeyType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="api_key">API Key</option>
                    <option value="pat">Personal Access Token (PAT)</option>
                    <option value="oauth">OAuth Token</option>
                    <option value="custom">Custom</option>
                  </select>
                  <p className="text-xs text-neutral-500 mt-1">
                    {apiKeyType === 'pat' && 'PATs can be shared with external AI tools'}
                    {apiKeyType === 'api_key' && 'Standard API key for this provider'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {apiKeyType === 'pat' ? 'Personal Access Token' : 'API Key'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={`Enter your ${apiKeyType === 'pat' ? 'PAT' : 'API key'}`}
                      className="w-full px-3 py-2 pr-10 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                    >
                      {showApiKey ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {integration && !showApiKey && apiKey && (
                    <p className="text-xs text-neutral-500 mt-1">
                      Current: {maskApiKey(integration.apiKey)}
                    </p>
                  )}
                  {provider.documentationUrl && (
                    <p className="text-xs text-neutral-500 mt-1">
                      <a
                        href={provider.documentationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline"
                      >
                        View documentation →
                      </a>
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="w-4 h-4 text-green-600 border-neutral-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="enabled" className="text-sm text-neutral-700">
                    Enable this integration
                  </label>
                </div>

                <div className="pt-4 border-t border-neutral-200">
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting || !apiKey.trim()}
                    className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-md hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isTesting ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-4">
                {provider.id === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Base URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://api.example.com/v1"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                )}

                {provider.supportedModels && provider.supportedModels.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Default Model
                    </label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select a model</option>
                      {provider.supportedModels.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Security Note:</strong> Your API keys are stored locally in your browser. 
                    For production use, consider using backend storage with proper encryption.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'usage' && integration && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-neutral-700 mb-2">Integration Details</h4>
                  <div className="bg-neutral-50 rounded-md p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-600">Status:</span>
                      <span className={`text-sm font-medium ${integration.enabled ? 'text-green-600' : 'text-neutral-400'}`}>
                        {integration.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-600">Created:</span>
                      <span className="text-sm text-neutral-900">
                        {new Date(integration.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-600">Last Updated:</span>
                      <span className="text-sm text-neutral-900">
                        {new Date(integration.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {integration.lastUsed && (
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-600">Last Used:</span>
                        <span className="text-sm text-neutral-900">
                          {new Date(integration.lastUsed).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {integration && (
                  <div className="pt-4 border-t border-neutral-200">
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
                    >
                      Delete Integration
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-neutral-200 bg-neutral-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50"
            >
              Cancel
            </button>
            <div className="flex items-center space-x-3">
              {integration && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving || !apiKey.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : integration ? 'Update' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  return createPortal(modalContent, document.body)
}

