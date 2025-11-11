/**
 * AI Integration Types and Interfaces
 */

export type AIProviderId = 'openai' | 'anthropic' | 'google' | 'custom'
export type AuthType = 'api_key' | 'pat' | 'oauth' | 'custom'
export type ProviderCategory = 'llm' | 'vision' | 'speech' | 'custom'

export interface AIIntegration {
  id: string // UUID
  providerId: AIProviderId
  providerName: string // Display name
  apiKey: string // Encrypted/masked
  apiKeyType: AuthType
  baseUrl?: string // Custom endpoint URL
  model?: string // Default model to use
  enabled: boolean
  lastUsed?: Date
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, any> // Provider-specific config
}

export interface AIProvider {
  id: AIProviderId
  name: string
  description: string
  icon: string // Icon component name or URL
  category: ProviderCategory
  authType: AuthType
  baseUrl: string
  documentationUrl?: string
  supportedModels?: string[]
  defaultModel?: string
  features: string[] // ['chat', 'embeddings', 'vision', etc.]
}

export interface IntegrationConfig {
  providerId: AIProviderId
  apiKey: string
  apiKeyType: AuthType
  baseUrl?: string
  model?: string
  enabled?: boolean
  metadata?: Record<string, any>
}

