/**
 * AI Service
 * 
 * Handles API calls to various AI providers (Anthropic Claude, OpenAI, Google, etc.)
 * Provides a unified interface for making AI requests
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatCompletionRequest {
  providerId: string
  apiKey: string
  baseUrl?: string
  model: string
  messages: ChatMessage[]
  maxTokens?: number
  temperature?: number
  stream?: boolean
}

export interface ChatCompletionResponse {
  success: boolean
  content?: string
  error?: string
  model?: string
  usage?: {
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
  }
}

export interface TestConnectionRequest {
  providerId: string
  apiKey: string
  baseUrl?: string
  model?: string
}

export interface TestConnectionResponse {
  success: boolean
  message?: string
  error?: string
  availableModels?: string[]
  verifiedModel?: string
}

export interface ModelDiscoveryResponse {
  success: boolean
  models?: Array<{
    id: string
    name: string
    supportsGenerateContent?: boolean
  }>
  error?: string
}

export class AIService {
  // Cache for model availability (providerId -> models[])
  private modelCache: Map<string, { models: string[], timestamp: number }> = new Map()
  private cacheTTL = 3600000 // 1 hour in milliseconds
  private registryService: any = null // Lazy-loaded AIModelRegistryService

  /**
   * Lazy-load AIModelRegistryService to avoid errors if Airtable is not configured
   */
  private getRegistryService(): any {
    if (this.registryService === null) {
      try {
        const { AIModelRegistryService } = require('./AIModelRegistryService')
        this.registryService = new AIModelRegistryService()
      } catch (error) {
        console.warn('AIModelRegistryService not available, using API discovery only:', error)
        this.registryService = false // Mark as unavailable
      }
    }
    return this.registryService === false ? null : this.registryService
  }

  /**
   * Discover available models for a provider
   */
  async discoverModels(providerId: string, apiKey: string, baseUrl?: string): Promise<ModelDiscoveryResponse> {
    try {
      switch (providerId) {
        case 'google':
          return this.discoverGoogleModels(apiKey, baseUrl)
        case 'openai':
          return this.discoverOpenAIModels(apiKey, baseUrl)
        case 'anthropic':
          return this.discoverAnthropicModels(apiKey, baseUrl)
        default:
          return {
            success: false,
            error: `Model discovery not supported for provider: ${providerId}`,
          }
      }
    } catch (error) {
      console.error(`Error discovering models for ${providerId}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Discover available Google Gemini models
   */
  private async discoverGoogleModels(apiKey: string, baseUrl?: string): Promise<ModelDiscoveryResponse> {
    try {
      const base = baseUrl || 'https://generativelanguage.googleapis.com/v1'
      const url = `${base}/models?key=${encodeURIComponent(apiKey)}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }))
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const models = (data.models || [])
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => ({
          id: m.name?.replace('models/', '') || m.name,
          name: m.displayName || m.name?.replace('models/', '') || m.name,
          supportsGenerateContent: m.supportedGenerationMethods?.includes('generateContent'),
        }))

      return {
        success: true,
        models,
      }
    } catch (error) {
      console.error('Error discovering Google models:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Discover available OpenAI models
   */
  private async discoverOpenAIModels(apiKey: string, baseUrl?: string): Promise<ModelDiscoveryResponse> {
    try {
      const base = baseUrl || 'https://api.openai.com/v1'
      const url = `${base}/models`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }))
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const models = (data.data || [])
        .filter((m: any) => m.id && (m.id.includes('gpt') || m.id.includes('text-')))
        .map((m: any) => ({
          id: m.id,
          name: m.id,
        }))

      return {
        success: true,
        models,
      }
    } catch (error) {
      console.error('Error discovering OpenAI models:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Discover available Anthropic models
   * Note: Anthropic doesn't have a public models endpoint, so we return known models
   */
  private async discoverAnthropicModels(apiKey: string, baseUrl?: string): Promise<ModelDiscoveryResponse> {
    // Anthropic doesn't provide a models list endpoint, so we return known models
    // and verify them by attempting a minimal test
    const knownModels = [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ]

    // Try to verify models by testing the first one
    const testModel = knownModels[0]
    try {
      const testRequest: ChatCompletionRequest = {
        providerId: 'anthropic',
        apiKey,
        baseUrl,
        model: testModel,
        messages: [{ role: 'user', content: 'Hi' }],
        maxTokens: 1,
      }

      const testResponse = await this.chatAnthropic(testRequest)
      if (testResponse.success) {
        return {
          success: true,
          models: knownModels.map(id => ({ id, name: id })),
        }
      }
    } catch (error) {
      // If test fails, still return known models but mark as unverified
    }

    return {
      success: true,
      models: knownModels.map(id => ({ id, name: id })),
    }
  }

  /**
   * Get cached models or discover fresh ones (Hybrid Approach)
   * Priority: 1. In-memory cache, 2. Airtable registry, 3. API discovery
   */
  async getAvailableModels(providerId: string, apiKey: string, baseUrl?: string, forceRefresh = false): Promise<string[]> {
    const cacheKey = `${providerId}:${baseUrl || 'default'}`
    const cached = this.modelCache.get(cacheKey)

    // 1. Check in-memory cache first (fastest)
    if (!forceRefresh && cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.models
    }

    // 2. Check Airtable registry (shared across instances, persistent)
    const registry = this.getRegistryService()
    if (registry) {
      try {
        const airtableModels = await registry.getModels(providerId, true)
        if (airtableModels.length > 0) {
          const modelIds = airtableModels.map(m => m.modelId)
          const mostRecent = airtableModels
            .filter(m => m.lastVerified)
            .sort((a, b) => (b.lastVerified?.getTime() || 0) - (a.lastVerified?.getTime() || 0))[0]

          // If Airtable data is recent (< 24 hours), use it
          if (mostRecent && mostRecent.lastVerified) {
            const hoursSinceVerification = (Date.now() - mostRecent.lastVerified.getTime()) / (1000 * 60 * 60)
            if (hoursSinceVerification < 24) {
              // Update cache and return
              this.modelCache.set(cacheKey, {
                models: modelIds,
                timestamp: Date.now(),
              })
              return modelIds
            }
          } else if (airtableModels.length > 0) {
            // Use Airtable data even if not recently verified (better than nothing)
            this.modelCache.set(cacheKey, {
              models: modelIds,
              timestamp: Date.now(),
            })
            return modelIds
          }
        }
      } catch (error) {
        console.warn(`Error fetching models from Airtable for ${providerId}, falling back to API discovery:`, error)
      }
    }

    // 3. Discover from provider API (fallback)
    const discovery = await this.discoverModels(providerId, apiKey, baseUrl)
    if (discovery.success && discovery.models) {
      const modelIds = discovery.models.map(m => m.id)
      
      // Update cache
      this.modelCache.set(cacheKey, {
        models: modelIds,
        timestamp: Date.now(),
      })

      // Update Airtable registry in background (don't wait)
      if (registry) {
        registry.updateModelsFromDiscovery(providerId, discovery.models).catch(error => {
          console.warn(`Failed to update Airtable registry for ${providerId}:`, error)
        })
      }

      return modelIds
    }

    // Return empty array if all methods fail
    return []
  }

  /**
   * Validate and find a working model with fallback (Hybrid Approach)
   */
  async findWorkingModel(
    providerId: string,
    apiKey: string,
    preferredModel?: string,
    baseUrl?: string
  ): Promise<{ model: string; availableModels: string[] } | null> {
    // 1. Check Airtable for recommended model first
    const registry = this.getRegistryService()
    if (registry && !preferredModel) {
      try {
        const recommendedModelId = await registry.getRecommendedModel(providerId)
        if (recommendedModelId) {
          const isValid = await this.validateModel(providerId, apiKey, recommendedModelId, baseUrl)
          if (isValid) {
            // Update verification in Airtable
            registry.verifyModel(providerId, recommendedModelId, true).catch(() => {})
            const availableModels = await this.getAvailableModels(providerId, apiKey, baseUrl)
            return { model: recommendedModelId, availableModels }
          }
        }
      } catch (error) {
        console.warn(`Error getting recommended model from Airtable:`, error)
      }
    }

    // 2. Get available models (from cache, Airtable, or API)
    const availableModels = await this.getAvailableModels(providerId, apiKey, baseUrl)

    if (availableModels.length === 0) {
      // If discovery fails, use hardcoded fallbacks
      return this.findWorkingModelFallback(providerId, apiKey, preferredModel, baseUrl)
    }

    // 3. Try preferred model first if provided and available
    if (preferredModel && availableModels.includes(preferredModel)) {
      const isValid = await this.validateModel(providerId, apiKey, preferredModel, baseUrl)
      if (isValid) {
        // Update verification in Airtable
        if (registry) {
          registry.verifyModel(providerId, preferredModel, true).catch(() => {})
        }
        return { model: preferredModel, availableModels }
      }
    }

    // 4. Try other available models in order
    for (const model of availableModels) {
      if (model === preferredModel) continue // Already tried
      const isValid = await this.validateModel(providerId, apiKey, model, baseUrl)
      if (isValid) {
        // Update verification in Airtable
        if (registry) {
          registry.verifyModel(providerId, model, true).catch(() => {})
        }
        return { model, availableModels }
      }
    }

    return null
  }

  /**
   * Fallback to hardcoded models if discovery fails
   */
  private async findWorkingModelFallback(
    providerId: string,
    apiKey: string,
    preferredModel?: string,
    baseUrl?: string
  ): Promise<{ model: string; availableModels: string[] } | null> {
    const fallbackModels: Record<string, string[]> = {
      google: ['gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-pro'],
      openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
      anthropic: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229'],
    }

    const models = fallbackModels[providerId] || []
    const modelsToTry = preferredModel && models.includes(preferredModel)
      ? [preferredModel, ...models.filter(m => m !== preferredModel)]
      : models

    for (const model of modelsToTry) {
      const isValid = await this.validateModel(providerId, apiKey, model, baseUrl)
      if (isValid) {
        return { model, availableModels: models }
      }
    }

    return null
  }

  /**
   * Validate if a specific model works
   */
  private async validateModel(
    providerId: string,
    apiKey: string,
    model: string,
    baseUrl?: string
  ): Promise<boolean> {
    try {
      const testRequest: ChatCompletionRequest = {
        providerId,
        apiKey,
        baseUrl,
        model,
        messages: [{ role: 'user', content: 'Hi' }],
        maxTokens: 1,
      }

      const response = await this.chat(testRequest)
      const isValid = response.success

      // Update Airtable registry with verification result
      const registry = this.getRegistryService()
      if (registry) {
        registry.verifyModel(providerId, model, isValid).catch(() => {})
      }

      return isValid
    } catch {
      // Update Airtable registry that model is not working
      const registry = this.getRegistryService()
      if (registry) {
        registry.verifyModel(providerId, model, false).catch(() => {})
      }
      return false
    }
  }

  /**
   * Make a chat completion request to Anthropic Claude
   */
  async chatAnthropic(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const baseUrl = request.baseUrl || 'https://api.anthropic.com/v1'
      const url = `${baseUrl}/messages`

      // Anthropic API requires specific headers
      const headers: Record<string, string> = {
        'x-api-key': request.apiKey,
        'anthropic-version': '2023-06-01', // Latest stable version
        'Content-Type': 'application/json',
      }

      // Format messages for Anthropic
      // Anthropic uses content blocks (array), but simple string works for text
      // System messages go in a separate 'system' field
      const systemMessage = request.messages.find(m => m.role === 'system')
      const messagesWithoutSystem = request.messages
        .filter(m => m.role !== 'system')
        .map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user', // Anthropic only has 'user' and 'assistant'
          content: msg.content, // Simple string format works for text messages
        }))

      const body: any = {
        model: request.model,
        max_tokens: request.maxTokens || 1024,
        messages: messagesWithoutSystem,
      }

      // Anthropic requires system message in separate field
      if (systemMessage) {
        body.system = systemMessage.content
      }

      if (request.temperature !== undefined) {
        body.temperature = request.temperature
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }))
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Extract content from Anthropic response
      const content = data.content?.[0]?.text || ''

      return {
        success: true,
        content,
        model: data.model,
        usage: {
          inputTokens: data.usage?.input_tokens,
          outputTokens: data.usage?.output_tokens,
          totalTokens: data.usage?.input_tokens && data.usage?.output_tokens
            ? data.usage.input_tokens + data.usage.output_tokens
            : undefined,
        },
      }
    } catch (error) {
      console.error('Error calling Anthropic API:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Make a chat completion request to Google Gemini
   */
  async chatGoogle(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const baseUrl = request.baseUrl || 'https://generativelanguage.googleapis.com/v1'
      // Gemini uses model name in the URL path
      // Available models: gemini-1.5-pro-latest, gemini-1.5-flash-latest, gemini-pro (legacy)
      // Use -latest suffix for latest stable versions
      let model = request.model || 'gemini-1.5-flash-latest'
      // Map legacy model names to current versions
      if (model === 'gemini-pro') {
        model = 'gemini-1.5-flash-latest' // Use newer model as fallback
      } else if (model === 'gemini-1.5-flash') {
        model = 'gemini-1.5-flash-latest'
      } else if (model === 'gemini-1.5-pro') {
        model = 'gemini-1.5-pro-latest'
      }
      // Format: https://generativelanguage.googleapis.com/v1/models/{model}:generateContent?key={apiKey}
      const url = `${baseUrl}/models/${model}:generateContent?key=${encodeURIComponent(request.apiKey)}`

      // Format messages for Gemini
      // Gemini uses a different format - it expects parts array
      const contents = request.messages
        .filter(m => m.role !== 'system') // System messages handled separately
        .map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user', // Gemini uses 'model' instead of 'assistant'
          parts: [{ text: msg.content }],
        }))

      // Gemini requires at least one message
      if (contents.length === 0) {
        throw new Error('At least one user message is required')
      }

      // Get system instruction if present
      const systemMessage = request.messages.find(m => m.role === 'system')

      const body: any = {
        contents,
      }

      // Gemini supports system instruction in generationConfig
      if (systemMessage) {
        body.systemInstruction = {
          parts: [{ text: systemMessage.content }],
        }
      }

      // Add generation config
      body.generationConfig = {}
      if (request.maxTokens) {
        body.generationConfig.maxOutputTokens = request.maxTokens
      }
      if (request.temperature !== undefined) {
        body.generationConfig.temperature = request.temperature
      }

      // Retry logic for rate limiting and overload errors
      const maxRetries = 3
      let lastError: Error | null = null
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }))
            const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
            
            // Check if it's a rate limit or overload error
            const isRateLimit = response.status === 429 || 
                                errorMessage.toLowerCase().includes('overloaded') ||
                                errorMessage.toLowerCase().includes('rate limit') ||
                                errorMessage.toLowerCase().includes('quota')
            
            if (isRateLimit && attempt < maxRetries) {
              // Exponential backoff: 2s, 4s, 8s
              const delay = Math.min(2000 * Math.pow(2, attempt - 1), 10000)
              console.log(`Google Gemini API overloaded (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`)
              await new Promise(resolve => setTimeout(resolve, delay))
              continue
            }
            
            throw new Error(errorMessage)
          }
          
          // Success - parse response and return
          const data = await response.json()
          
          // Extract content from Gemini response
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
          const usageInfo = data.usageMetadata

          return {
            success: true,
            content,
            model: data.model || model,
            usage: {
              inputTokens: usageInfo?.promptTokenCount,
              outputTokens: usageInfo?.candidatesTokenCount,
              totalTokens: usageInfo?.totalTokenCount,
            },
          }
        } catch (error) {
          lastError = error as Error
          
          // If it's not a retryable error or we've exhausted retries, throw
          if (attempt === maxRetries || !(error instanceof Error && 
              (error.message.toLowerCase().includes('overloaded') ||
               error.message.toLowerCase().includes('rate limit') ||
               error.message.toLowerCase().includes('quota')))) {
            throw error
          }
        }
      }
      
      // If we get here, all retries failed
      throw lastError || new Error('Failed to get response from Google Gemini API after multiple attempts')
    } catch (error) {
      console.error('Error calling Google Gemini API:', error)
      
      // Provide user-friendly error messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      if (errorMessage.toLowerCase().includes('overloaded')) {
        return {
          success: false,
          error: 'Google Gemini API is currently overloaded. Please try again in a few moments. The system will automatically retry on your next request.',
        }
      }
      
      if (errorMessage.toLowerCase().includes('rate limit') || errorMessage.toLowerCase().includes('quota')) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please wait a moment before trying again, or check your API quota limits.',
        }
      }
      
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Make a chat completion request to OpenAI
   */
  async chatOpenAI(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const baseUrl = request.baseUrl || 'https://api.openai.com/v1'
      const url = `${baseUrl}/chat/completions`

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${request.apiKey}`,
        'Content-Type': 'application/json',
      }

      const body: any = {
        model: request.model,
        messages: request.messages,
      }

      if (request.maxTokens !== undefined) {
        body.max_tokens = request.maxTokens
      }

      if (request.temperature !== undefined) {
        body.temperature = request.temperature
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }))
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        success: true,
        content: data.choices?.[0]?.message?.content || '',
        model: data.model,
        usage: {
          inputTokens: data.usage?.prompt_tokens,
          outputTokens: data.usage?.completion_tokens,
          totalTokens: data.usage?.total_tokens,
        },
      }
    } catch (error) {
      console.error('Error calling OpenAI API:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Make a chat completion request (routes to appropriate provider)
   */
  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    switch (request.providerId) {
      case 'anthropic':
        return this.chatAnthropic(request)
      case 'openai':
        return this.chatOpenAI(request)
      case 'google':
        return this.chatGoogle(request)
      case 'custom':
        // TODO: Implement custom provider
        return {
          success: false,
          error: 'Custom provider support not yet implemented',
        }
      default:
        return {
          success: false,
          error: `Unsupported provider: ${request.providerId}`,
        }
    }
  }

  /**
   * Test connection to an AI provider and discover available models
   */
  async testConnection(request: TestConnectionRequest): Promise<TestConnectionResponse> {
    try {
      // First, discover available models
      const discovery = await this.discoverModels(request.providerId, request.apiKey, request.baseUrl)
      const availableModels = discovery.models?.map(m => m.id) || []

      // Find a working model (prefer the requested one, or discover one)
      const workingModel = await this.findWorkingModel(
        request.providerId,
        request.apiKey,
        request.model,
        request.baseUrl
      )

      if (!workingModel) {
        return {
          success: false,
          error: 'Could not find a working model. Please check your API key and try again.',
          availableModels,
        }
      }

      // Use a simple test message with the verified model
      const testRequest: ChatCompletionRequest = {
        providerId: request.providerId,
        apiKey: request.apiKey,
        baseUrl: request.baseUrl,
        model: workingModel.model,
        messages: [
          {
            role: 'user',
            content: 'Hello',
          },
        ],
        maxTokens: 10, // Minimal tokens for test
      }

      const response = await this.chat(testRequest)

      if (response.success) {
        return {
          success: true,
          message: `Connection successful! Verified model: ${workingModel.model}`,
          availableModels: workingModel.availableModels,
          verifiedModel: workingModel.model,
        }
      } else {
        return {
          success: false,
          error: response.error || 'Connection test failed',
          availableModels: workingModel.availableModels,
        }
      }
    } catch (error) {
      console.error('Error testing AI connection:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }
}

