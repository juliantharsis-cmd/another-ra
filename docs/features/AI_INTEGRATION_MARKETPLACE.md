# AI Integration Marketplace

You are a **senior full-stack engineer**. Implement an **AI Integration Marketplace** that enables users to connect and configure third-party AI services, with **secure API key management** and **Personal Access Token (PAT) support** for sharing integrations with AI tools.

# Goals

1) **Create Integration Management System** - Build a marketplace-style interface for AI providers
   - Display available AI providers as cards with icons/logos
   - Show connection status (connected/disconnected)
   - Click provider card to open configuration modal
   - Support for multiple AI providers simultaneously

2) **Implement Secure API Key Storage** - Store and manage API keys securely
   - Encrypted storage in localStorage (client-side) or backend (server-side)
   - Support for API keys, Personal Access Tokens (PATs), and OAuth tokens
   - Mask sensitive keys in UI (show only last 4 characters)
   - Ability to test connection before saving

3) **Build Provider Configuration Interface** - Modal for configuring AI integrations
   - Input fields for API key/PAT
   - Provider-specific configuration options
   - Connection test functionality
   - Save/update/delete integration settings
   - Display connection status and last used timestamp

4) **Create API Client Utilities** - Helper functions for making AI service calls
   - Generic API client that uses stored credentials
   - Provider-specific adapters (OpenAI, Anthropic, etc.)
   - Error handling and retry logic
   - Request/response logging for debugging

# Database Schema

## Integration Storage (localStorage/Backend)

```typescript
interface AIIntegration {
  id: string // UUID
  providerId: string // 'openai' | 'anthropic' | 'google' | 'custom'
  providerName: string // Display name
  apiKey: string // Encrypted/masked
  apiKeyType: 'api_key' | 'pat' | 'oauth'
  baseUrl?: string // Custom endpoint URL
  model?: string // Default model to use
  enabled: boolean
  lastUsed?: Date
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, any> // Provider-specific config
}

interface AIProvider {
  id: string
  name: string
  description: string
  icon: string // URL or icon component name
  category: 'llm' | 'vision' | 'speech' | 'custom'
  authType: 'api_key' | 'pat' | 'oauth' | 'custom'
  baseUrl: string
  documentationUrl?: string
  supportedModels?: string[]
  defaultModel?: string
  features: string[] // ['chat', 'embeddings', 'vision', etc.]
}
```

# API Endpoints

## Integration Management

```typescript
// Save/Update integration
POST /api/integrations
PUT /api/integrations/:id
DELETE /api/integrations/:id
GET /api/integrations
GET /api/integrations/:id

// Test connection
POST /api/integrations/:id/test

// Make AI call (proxy through backend for security)
POST /api/ai/chat
POST /api/ai/embeddings
POST /api/ai/vision
```

# Implementation

## Component Structure

```typescript
// Main Integration Marketplace Component
<IntegrationMarketplace>
  <ProviderCard provider={provider} />
  <AIProviderConfigModal provider={provider} />
</IntegrationMarketplace>

// Provider Card Component
interface ProviderCardProps {
  provider: AIProvider
  integration?: AIIntegration
  onConfigure: (provider: AIProvider) => void
  onTest: (integrationId: string) => void
}

// Configuration Modal
interface AIProviderConfigModalProps {
  isOpen: boolean
  provider: AIProvider
  integration?: AIIntegration
  onClose: () => void
  onSave: (config: IntegrationConfig) => void
  onTest: (config: IntegrationConfig) => Promise<boolean>
}
```

## API Key Management

```typescript
// Secure storage utility
class IntegrationStorage {
  static save(integration: AIIntegration): void {
    // Encrypt API key before storing
    const encrypted = encrypt(integration.apiKey)
    localStorage.setItem(`integration:${integration.id}`, JSON.stringify({
      ...integration,
      apiKey: encrypted
    }))
  }
  
  static get(id: string): AIIntegration | null {
    const stored = localStorage.getItem(`integration:${id}`)
    if (!stored) return null
    const integration = JSON.parse(stored)
    return {
      ...integration,
      apiKey: decrypt(integration.apiKey)
    }
  }
  
  static maskApiKey(key: string): string {
    if (key.length <= 4) return '****'
    return `****${key.slice(-4)}`
  }
}
```

## AI Client Utility

```typescript
// Generic AI client
class AIClient {
  constructor(private integration: AIIntegration) {}
  
  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Integration-Id': this.integration.id
      },
      body: JSON.stringify({ messages, options })
    })
    return response.json()
  }
  
  async embeddings(text: string[]): Promise<EmbeddingResponse> {
    // Similar implementation
  }
}

// Provider-specific adapters
class OpenAIAdapter extends AIClient {
  // OpenAI-specific implementation
}

class AnthropicAdapter extends AIClient {
  // Anthropic-specific implementation
}
```

# UI/UX Specifications

## Marketplace Layout

- Grid layout with provider cards (3-4 columns on desktop)
- Each card shows:
  - Provider logo/icon
  - Provider name
  - Connection status badge (Connected/Not Connected)
  - Quick action button (Configure/Connect)
  - Last used timestamp (if connected)

## Configuration Modal

- Tabbed interface:
  - **Credentials**: API key/PAT input, connection test
  - **Settings**: Model selection, custom endpoints, advanced options
  - **Usage**: Statistics, last used, API call history
- Form validation:
  - Required fields marked with *
  - API key format validation
  - Connection test before save
- Security:
  - Mask API keys in display
  - Show/hide toggle for sensitive fields
  - Clear warning about key security

# Predefined AI Providers

```typescript
const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-3.5, and other OpenAI models',
    icon: 'openai-icon',
    category: 'llm',
    authType: 'api_key',
    baseUrl: 'https://api.openai.com/v1',
    supportedModels: ['gpt-4', 'gpt-3.5-turbo', 'text-embedding-ada-002'],
    features: ['chat', 'embeddings', 'vision']
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Claude AI models for advanced reasoning',
    icon: 'anthropic-icon',
    category: 'llm',
    authType: 'api_key',
    baseUrl: 'https://api.anthropic.com/v1',
    supportedModels: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    features: ['chat', 'embeddings']
  },
  {
    id: 'google',
    name: 'Google Gemini',
    description: 'Google\'s Gemini AI models',
    icon: 'google-icon',
    category: 'llm',
    authType: 'api_key',
    baseUrl: 'https://generativelanguage.googleapis.com/v1',
    supportedModels: ['gemini-pro', 'gemini-pro-vision'],
    features: ['chat', 'vision']
  },
  {
    id: 'custom',
    name: 'Custom AI Provider',
    description: 'Connect to a custom AI service endpoint',
    icon: 'custom-icon',
    category: 'custom',
    authType: 'custom',
    baseUrl: '',
    features: ['chat']
  }
]
```

# Security Considerations

- **API Key Encryption**: Encrypt keys before storing in localStorage
- **Backend Proxy**: Optionally proxy AI calls through backend to hide keys
- **PAT Support**: Personal Access Tokens can be shared with external tools
- **Access Control**: Only authenticated users can manage integrations
- **Audit Logging**: Log integration usage and configuration changes
- **Key Rotation**: Support for updating/rotating API keys
- **Environment Variables**: Support for server-side API keys via env vars

# Notes

- **localStorage Limitation**: For production, consider backend storage for API keys
- **Rate Limiting**: Implement rate limiting for AI API calls
- **Error Handling**: Graceful degradation when integrations fail
- **Testing**: Mock AI providers for development/testing
- **Documentation**: Link to provider documentation from configuration modal
- **Extensibility**: Easy to add new providers via configuration

