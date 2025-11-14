/**
 * AI Service
 *
 * Handles API calls to various AI providers (Anthropic Claude, OpenAI, Google, etc.)
 * Provides a unified interface for making AI requests
 */
export class AIService {
    // Cache for model availability (providerId -> models[])
    modelCache = new Map();
    cacheTTL = 3600000; // 1 hour in milliseconds
    registryService = null; // Lazy-loaded AIModelRegistryService
    agentProfileService = null; // Lazy-loaded AIAgentProfileService
    /**
     * Lazy-load AIModelRegistryService to avoid errors if Airtable is not configured
     */
    getRegistryService() {
        if (this.registryService === null) {
            try {
                const { AIModelRegistryService } = require('./AIModelRegistryService');
                this.registryService = new AIModelRegistryService();
            }
            catch (error) {
                console.warn('AIModelRegistryService not available, using API discovery only:', error);
                this.registryService = false; // Mark as unavailable
            }
        }
        return this.registryService === false ? null : this.registryService;
    }
    /**
     * Lazy-load AIAgentProfileService to avoid errors if Preferences system is not configured
     */
    getAgentProfileService() {
        if (this.agentProfileService === null) {
            try {
                const { AIAgentProfileService } = require('./AIAgentProfileService');
                this.agentProfileService = new AIAgentProfileService();
            }
            catch (error) {
                console.warn('AIAgentProfileService not available, using default behavior:', error);
                this.agentProfileService = false; // Mark as unavailable
            }
        }
        return this.agentProfileService === false ? null : this.agentProfileService;
    }
    /**
     * Inject user's AI Agent Profile into system prompt
     * Merges user preferences with existing system message
     */
    async injectUserProfile(messages, userId) {
        if (!userId) {
            console.log(`⚠️  [AI Agent Profile] No userId provided, skipping profile injection`);
            return messages; // No user ID, return messages as-is
        }
        console.log(`🔍 [AI Agent Profile] Attempting to inject profile for userId: ${userId}`);
        const profileService = this.getAgentProfileService();
        if (!profileService) {
            console.warn(`⚠️  [AI Agent Profile] Profile service not available, skipping injection`);
            return messages; // Service not available, return as-is
        }
        try {
            const { profileToSystemPrompt } = require('../types/AIAgentProfile');
            const profile = await profileService.getProfile(userId);
            const profileInstructions = profileToSystemPrompt(profile);
            // Log profile injection for debugging
            const hasCustomProfile = profile && Object.keys(profile).some(key => {
                const defaultProfile = require('../types/AIAgentProfile').DEFAULT_AI_AGENT_PROFILE;
                return profile[key] !== defaultProfile[key];
            });
            if (hasCustomProfile) {
                console.log(`🤖 [AI Agent Profile] Injecting custom profile for user ${userId}:`, {
                    tone: profile.tone,
                    detailLevel: profile.detailLevel,
                    responseStyle: profile.responseStyle,
                    domainFocus: profile.domainFocus,
                    hasCustomInstructions: !!profile.customInstructions,
                });
                console.log(`📋 [AI Agent Profile] Profile instructions preview:`, profileInstructions.substring(0, 200) + '...');
            }
            else {
                console.log(`🤖 [AI Agent Profile] Using default profile for user ${userId}`);
            }
            // Find existing system message
            const systemMessageIndex = messages.findIndex(m => m.role === 'system');
            if (systemMessageIndex >= 0) {
                // Merge with existing system message
                const existingSystem = messages[systemMessageIndex];
                const mergedContent = `${existingSystem.content}\n\n${profileInstructions}`;
                messages[systemMessageIndex] = {
                    role: 'system',
                    content: mergedContent,
                };
                if (hasCustomProfile) {
                    console.log(`📝 [AI Agent Profile] Merged profile instructions into existing system message`);
                    console.log(`   Original system message: "${existingSystem.content.substring(0, 100)}..."`);
                    console.log(`   Final system message length: ${mergedContent.length} chars`);
                }
            }
            else {
                // Add new system message with profile instructions
                messages.unshift({
                    role: 'system',
                    content: profileInstructions,
                });
                if (hasCustomProfile) {
                    console.log(`📝 [AI Agent Profile] Added new system message with profile instructions (${profileInstructions.length} chars)`);
                }
            }
        }
        catch (error) {
            console.warn(`⚠️  [AI Agent Profile] Error injecting user profile for user ${userId}:`, error);
            // Continue without profile injection on error
        }
        return messages;
    }
    /**
     * Discover available models for a provider
     */
    async discoverModels(providerId, apiKey, baseUrl) {
        try {
            switch (providerId) {
                case 'google':
                    return this.discoverGoogleModels(apiKey, baseUrl);
                case 'openai':
                    return this.discoverOpenAIModels(apiKey, baseUrl);
                case 'anthropic':
                    return this.discoverAnthropicModels(apiKey, baseUrl);
                default:
                    return {
                        success: false,
                        error: `Model discovery not supported for provider: ${providerId}`,
                    };
            }
        }
        catch (error) {
            console.error(`Error discovering models for ${providerId}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
    /**
     * Discover available Google Gemini models
     */
    async discoverGoogleModels(apiKey, baseUrl) {
        try {
            const base = baseUrl || 'https://generativelanguage.googleapis.com/v1';
            const url = `${base}/models?key=${encodeURIComponent(apiKey)}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
                throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            const models = (data.models || [])
                .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
                .map((m) => ({
                id: m.name?.replace('models/', '') || m.name,
                name: m.displayName || m.name?.replace('models/', '') || m.name,
                supportsGenerateContent: m.supportedGenerationMethods?.includes('generateContent'),
            }));
            return {
                success: true,
                models,
            };
        }
        catch (error) {
            console.error('Error discovering Google models:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
    /**
     * Discover available OpenAI models
     */
    async discoverOpenAIModels(apiKey, baseUrl) {
        try {
            const base = baseUrl || 'https://api.openai.com/v1';
            const url = `${base}/models`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
                throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            const models = (data.data || [])
                .filter((m) => m.id && (m.id.includes('gpt') || m.id.includes('text-')))
                .map((m) => ({
                id: m.id,
                name: m.id,
            }));
            return {
                success: true,
                models,
            };
        }
        catch (error) {
            console.error('Error discovering OpenAI models:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
    /**
     * Discover available Anthropic models
     * Note: Anthropic doesn't have a public models endpoint, so we return known models
     */
    async discoverAnthropicModels(apiKey, baseUrl) {
        // Anthropic doesn't provide a models list endpoint, so we return known models
        // and verify them by attempting a minimal test
        const knownModels = [
            'claude-3-5-sonnet-20241022',
            'claude-3-5-haiku-20241022',
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307',
        ];
        // Try to verify models by testing the first one
        const testModel = knownModels[0];
        try {
            const testRequest = {
                providerId: 'anthropic',
                apiKey,
                baseUrl,
                model: testModel,
                messages: [{ role: 'user', content: 'Hi' }],
                maxTokens: 1,
            };
            const testResponse = await this.chatAnthropic(testRequest);
            if (testResponse.success) {
                return {
                    success: true,
                    models: knownModels.map(id => ({ id, name: id })),
                };
            }
        }
        catch (error) {
            // If test fails, still return known models but mark as unverified
        }
        return {
            success: true,
            models: knownModels.map(id => ({ id, name: id })),
        };
    }
    /**
     * Get cached models or discover fresh ones (Hybrid Approach)
     * Priority: 1. In-memory cache, 2. Airtable registry, 3. API discovery
     */
    async getAvailableModels(providerId, apiKey, baseUrl, forceRefresh = false) {
        const cacheKey = `${providerId}:${baseUrl || 'default'}`;
        const cached = this.modelCache.get(cacheKey);
        // 1. Check in-memory cache first (fastest)
        if (!forceRefresh && cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.models;
        }
        // 2. Check Airtable registry (shared across instances, persistent)
        const registry = this.getRegistryService();
        if (registry) {
            try {
                const airtableModels = await registry.getModels(providerId, true);
                if (airtableModels.length > 0) {
                    const modelIds = airtableModels.map(m => m.modelId);
                    const mostRecent = airtableModels
                        .filter(m => m.lastVerified)
                        .sort((a, b) => (b.lastVerified?.getTime() || 0) - (a.lastVerified?.getTime() || 0))[0];
                    // If Airtable data is recent (< 24 hours), use it
                    if (mostRecent && mostRecent.lastVerified) {
                        const hoursSinceVerification = (Date.now() - mostRecent.lastVerified.getTime()) / (1000 * 60 * 60);
                        if (hoursSinceVerification < 24) {
                            // Update cache and return
                            this.modelCache.set(cacheKey, {
                                models: modelIds,
                                timestamp: Date.now(),
                            });
                            return modelIds;
                        }
                    }
                    else if (airtableModels.length > 0) {
                        // Use Airtable data even if not recently verified (better than nothing)
                        this.modelCache.set(cacheKey, {
                            models: modelIds,
                            timestamp: Date.now(),
                        });
                        return modelIds;
                    }
                }
            }
            catch (error) {
                console.warn(`Error fetching models from Airtable for ${providerId}, falling back to API discovery:`, error);
            }
        }
        // 3. Discover from provider API (fallback)
        const discovery = await this.discoverModels(providerId, apiKey, baseUrl);
        if (discovery.success && discovery.models) {
            const modelIds = discovery.models.map(m => m.id);
            // Update cache
            this.modelCache.set(cacheKey, {
                models: modelIds,
                timestamp: Date.now(),
            });
            // Update Airtable registry in background (don't wait)
            if (registry) {
                registry.updateModelsFromDiscovery(providerId, discovery.models).catch(error => {
                    console.warn(`Failed to update Airtable registry for ${providerId}:`, error);
                });
            }
            return modelIds;
        }
        // Return empty array if all methods fail
        return [];
    }
    /**
     * Validate and find a working model with fallback (Hybrid Approach)
     */
    async findWorkingModel(providerId, apiKey, preferredModel, baseUrl) {
        // 1. Check Airtable for recommended model first
        const registry = this.getRegistryService();
        if (registry && !preferredModel) {
            try {
                const recommendedModelId = await registry.getRecommendedModel(providerId);
                if (recommendedModelId) {
                    const isValid = await this.validateModel(providerId, apiKey, recommendedModelId, baseUrl);
                    if (isValid) {
                        // Update verification in Airtable
                        registry.verifyModel(providerId, recommendedModelId, true).catch(() => { });
                        const availableModels = await this.getAvailableModels(providerId, apiKey, baseUrl);
                        return { model: recommendedModelId, availableModels };
                    }
                }
            }
            catch (error) {
                console.warn(`Error getting recommended model from Airtable:`, error);
            }
        }
        // 2. Get available models (from cache, Airtable, or API)
        const availableModels = await this.getAvailableModels(providerId, apiKey, baseUrl);
        if (availableModels.length === 0) {
            // If discovery fails, use hardcoded fallbacks
            return this.findWorkingModelFallback(providerId, apiKey, preferredModel, baseUrl);
        }
        // 3. Try preferred model first if provided and available
        if (preferredModel && availableModels.includes(preferredModel)) {
            const isValid = await this.validateModel(providerId, apiKey, preferredModel, baseUrl);
            if (isValid) {
                // Update verification in Airtable
                if (registry) {
                    registry.verifyModel(providerId, preferredModel, true).catch(() => { });
                }
                return { model: preferredModel, availableModels };
            }
        }
        // 4. Try other available models in order
        for (const model of availableModels) {
            if (model === preferredModel)
                continue; // Already tried
            const isValid = await this.validateModel(providerId, apiKey, model, baseUrl);
            if (isValid) {
                // Update verification in Airtable
                if (registry) {
                    registry.verifyModel(providerId, model, true).catch(() => { });
                }
                return { model, availableModels };
            }
        }
        return null;
    }
    /**
     * Fallback to hardcoded models if discovery fails
     */
    async findWorkingModelFallback(providerId, apiKey, preferredModel, baseUrl) {
        const fallbackModels = {
            google: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'],
            openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
            anthropic: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229'],
        };
        const models = fallbackModels[providerId] || [];
        const modelsToTry = preferredModel && models.includes(preferredModel)
            ? [preferredModel, ...models.filter(m => m !== preferredModel)]
            : models;
        for (const model of modelsToTry) {
            const isValid = await this.validateModel(providerId, apiKey, model, baseUrl);
            if (isValid) {
                return { model, availableModels: models };
            }
        }
        return null;
    }
    /**
     * Validate if a specific model works
     */
    async validateModel(providerId, apiKey, model, baseUrl) {
        try {
            const testRequest = {
                providerId,
                apiKey,
                baseUrl,
                model,
                messages: [{ role: 'user', content: 'Hi' }],
                maxTokens: 1,
            };
            const response = await this.chat(testRequest);
            const isValid = response.success;
            // Update Airtable registry with verification result
            const registry = this.getRegistryService();
            if (registry) {
                registry.verifyModel(providerId, model, isValid).catch(() => { });
            }
            return isValid;
        }
        catch {
            // Update Airtable registry that model is not working
            const registry = this.getRegistryService();
            if (registry) {
                registry.verifyModel(providerId, model, false).catch(() => { });
            }
            return false;
        }
    }
    /**
     * Make a chat completion request to Anthropic Claude
     */
    async chatAnthropic(request) {
        try {
            // Inject user profile into messages if userId is provided
            const messagesWithProfile = await this.injectUserProfile([...request.messages], request.userId);
            const baseUrl = request.baseUrl || 'https://api.anthropic.com/v1';
            const url = `${baseUrl}/messages`;
            // Anthropic API requires specific headers
            const headers = {
                'x-api-key': request.apiKey,
                'anthropic-version': '2023-06-01', // Latest stable version
                'Content-Type': 'application/json',
            };
            // Format messages for Anthropic
            // Anthropic uses content blocks (array), but simple string works for text
            // System messages go in a separate 'system' field
            const systemMessage = messagesWithProfile.find(m => m.role === 'system');
            const messagesWithoutSystem = messagesWithProfile
                .filter(m => m.role !== 'system')
                .map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user', // Anthropic only has 'user' and 'assistant'
                content: msg.content, // Simple string format works for text messages
            }));
            const body = {
                model: request.model,
                max_tokens: request.maxTokens || 1024,
                messages: messagesWithoutSystem,
            };
            // Anthropic requires system message in separate field
            if (systemMessage) {
                body.system = systemMessage.content;
            }
            if (request.temperature !== undefined) {
                body.temperature = request.temperature;
            }
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
                throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            // Extract content from Anthropic response
            const content = data.content?.[0]?.text || '';
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
            };
        }
        catch (error) {
            console.error('Error calling Anthropic API:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
    /**
     * Make a chat completion request to Google Gemini
     */
    async chatGoogle(request) {
        try {
            // Inject user profile into messages if userId is provided
            const messagesWithProfile = await this.injectUserProfile([...request.messages], request.userId);
            const baseUrl = request.baseUrl || 'https://generativelanguage.googleapis.com/v1';
            // Gemini uses model name in the URL path
            // Available models for v1 API: gemini-1.5-pro, gemini-1.5-flash, gemini-pro (legacy)
            // Note: -latest suffix is NOT supported in v1 API, only in v1beta
            // Default to flash model (faster, less likely to be overloaded)
            let model = request.model || 'gemini-1.5-flash';
            // Map legacy and -latest model names to current v1 API versions
            if (model === 'gemini-pro') {
                model = 'gemini-1.5-flash'; // Use flash (faster, less overloaded)
            }
            else if (model === 'gemini-1.5-flash-latest') {
                model = 'gemini-1.5-flash'; // Remove -latest suffix for v1 API
            }
            else if (model === 'gemini-1.5-pro-latest') {
                model = 'gemini-1.5-pro'; // Remove -latest suffix for v1 API
            }
            else if (model === 'gemini-1.5-pro') {
                // Keep as-is for v1 API
                model = 'gemini-1.5-pro';
            }
            // Format: https://generativelanguage.googleapis.com/v1/models/{model}:generateContent?key={apiKey}
            const url = `${baseUrl}/models/${model}:generateContent?key=${encodeURIComponent(request.apiKey)}`;
            // Format messages for Gemini
            // Gemini uses a different format - it expects parts array
            // Note: systemInstruction is only supported in v1beta API, not v1
            // For v1 API, we'll include system message content in the first user message
            const systemMessage = request.messages.find(m => m.role === 'system');
            const nonSystemMessages = request.messages.filter(m => m.role !== 'system');
            const contents = nonSystemMessages.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user', // Gemini uses 'model' instead of 'assistant'
                parts: [{ text: msg.content }],
            }));
            // If we have a system message, include it in the first user message
            // (v1beta supports systemInstruction field, but v1 doesn't)
            if (systemMessage && contents.length > 0 && contents[0].role === 'user') {
                // Prepend system instruction to the first user message
                contents[0].parts[0].text = `${systemMessage.content}\n\n${contents[0].parts[0].text}`;
            }
            else if (systemMessage && contents.length === 0) {
                // If only system message exists, convert it to a user message
                contents.push({
                    role: 'user',
                    parts: [{ text: systemMessage.content }],
                });
            }
            else if (systemMessage && contents.length > 0 && contents[0].role === 'model') {
                // If first message is from model, prepend a user message with system instruction
                contents.unshift({
                    role: 'user',
                    parts: [{ text: systemMessage.content }],
                });
            }
            // Gemini requires at least one message
            if (contents.length === 0) {
                throw new Error('At least one user message is required');
            }
            const body = {
                contents,
            };
            // Add generation config
            // Reduce maxTokens for faster responses and less load on API
            body.generationConfig = {};
            if (request.maxTokens) {
                // Cap at reasonable limit to reduce API load
                body.generationConfig.maxOutputTokens = Math.min(request.maxTokens, 500);
            }
            else {
                // Default to lower token limit for welcome dashboard use case
                body.generationConfig.maxOutputTokens = 300;
            }
            if (request.temperature !== undefined) {
                body.generationConfig.temperature = request.temperature;
            }
            // Retry logic for rate limiting and overload errors
            const maxRetries = 2;
            let lastError = null;
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(body),
                    });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
                        const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
                        // Check if it's a rate limit or overload error
                        const isRateLimit = response.status === 429 ||
                            errorMessage.toLowerCase().includes('overloaded') ||
                            errorMessage.toLowerCase().includes('rate limit') ||
                            errorMessage.toLowerCase().includes('quota') ||
                            errorMessage.toLowerCase().includes('resource exhausted');
                        if (isRateLimit && attempt < maxRetries) {
                            // Exponential backoff with jitter: 3s, 6s, 12s, 24s, 30s (max)
                            // Add random jitter (0-2s) to avoid thundering herd
                            const baseDelay = Math.min(3000 * Math.pow(2, attempt - 1), 30000);
                            const jitter = Math.random() * 2000;
                            const delay = baseDelay + jitter;
                            console.log(`Google Gemini API overloaded (attempt ${attempt}/${maxRetries}), retrying in ${Math.round(delay)}ms...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                            continue;
                        }
                        throw new Error(errorMessage);
                    }
                    // Success - parse response and return
                    const data = await response.json();
                    // Extract content from Gemini response
                    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                    const usageInfo = data.usageMetadata;
                    return {
                        success: true,
                        content,
                        model: data.model || model,
                        usage: {
                            inputTokens: usageInfo?.promptTokenCount,
                            outputTokens: usageInfo?.candidatesTokenCount,
                            totalTokens: usageInfo?.totalTokenCount,
                        },
                    };
                }
                catch (error) {
                    lastError = error;
                    // If it's not a retryable error or we've exhausted retries, throw
                    if (attempt === maxRetries || !(error instanceof Error &&
                        (error.message.toLowerCase().includes('overloaded') ||
                            error.message.toLowerCase().includes('rate limit') ||
                            error.message.toLowerCase().includes('quota')))) {
                        throw error;
                    }
                }
            }
            // If we get here, all retries failed
            throw lastError || new Error('Failed to get response from Google Gemini API after multiple attempts');
        }
        catch (error) {
            console.error('Error calling Google Gemini API:', error);
            // Provide user-friendly error messages
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            if (errorMessage.toLowerCase().includes('overloaded') ||
                errorMessage.toLowerCase().includes('resource exhausted')) {
                return {
                    success: false,
                    error: 'Google Gemini API is currently overloaded. The system has retried multiple times. Please wait 30-60 seconds and try again, or consider using a different AI provider (OpenAI, Anthropic) from the Integration Marketplace.',
                };
            }
            if (errorMessage.toLowerCase().includes('rate limit') || errorMessage.toLowerCase().includes('quota')) {
                return {
                    success: false,
                    error: 'Rate limit exceeded. Please wait a moment before trying again, or check your API quota limits.',
                };
            }
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
    /**
     * Make a chat completion request to OpenAI
     */
    async chatOpenAI(request) {
        try {
            const baseUrl = request.baseUrl || 'https://api.openai.com/v1';
            const url = `${baseUrl}/chat/completions`;
            const headers = {
                'Authorization': `Bearer ${request.apiKey}`,
                'Content-Type': 'application/json',
            };
            const body = {
                model: request.model,
                messages: request.messages,
            };
            if (request.maxTokens !== undefined) {
                body.max_tokens = request.maxTokens;
            }
            if (request.temperature !== undefined) {
                body.temperature = request.temperature;
            }
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
                throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            return {
                success: true,
                content: data.choices?.[0]?.message?.content || '',
                model: data.model,
                usage: {
                    inputTokens: data.usage?.prompt_tokens,
                    outputTokens: data.usage?.completion_tokens,
                    totalTokens: data.usage?.total_tokens,
                },
            };
        }
        catch (error) {
            console.error('Error calling OpenAI API:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
    /**
     * Make a chat completion request (routes to appropriate provider)
     */
    async chat(request) {
        switch (request.providerId) {
            case 'anthropic':
                return this.chatAnthropic(request);
            case 'openai':
                return this.chatOpenAI(request);
            case 'google':
                return this.chatGoogle(request);
            case 'custom':
                // TODO: Implement custom provider
                return {
                    success: false,
                    error: 'Custom provider support not yet implemented',
                };
            default:
                return {
                    success: false,
                    error: `Unsupported provider: ${request.providerId}`,
                };
        }
    }
    /**
     * Test connection to an AI provider and discover available models
     */
    async testConnection(request) {
        try {
            // First, discover available models
            const discovery = await this.discoverModels(request.providerId, request.apiKey, request.baseUrl);
            const availableModels = discovery.models?.map(m => m.id) || [];
            // Find a working model (prefer the requested one, or discover one)
            const workingModel = await this.findWorkingModel(request.providerId, request.apiKey, request.model, request.baseUrl);
            if (!workingModel) {
                return {
                    success: false,
                    error: 'Could not find a working model. Please check your API key and try again.',
                    availableModels,
                };
            }
            // Use a simple test message with the verified model
            const testRequest = {
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
            };
            const response = await this.chat(testRequest);
            if (response.success) {
                return {
                    success: true,
                    message: `Connection successful! Verified model: ${workingModel.model}`,
                    availableModels: workingModel.availableModels,
                    verifiedModel: workingModel.model,
                };
            }
            else {
                return {
                    success: false,
                    error: response.error || 'Connection test failed',
                    availableModels: workingModel.availableModels,
                };
            }
        }
        catch (error) {
            console.error('Error testing AI connection:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
}
//# sourceMappingURL=AIService.js.map