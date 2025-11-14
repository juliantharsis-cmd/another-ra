/**
 * AI Service
 *
 * Handles API calls to various AI providers (Anthropic Claude, OpenAI, Google, etc.)
 * Provides a unified interface for making AI requests
 */
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
export interface ChatCompletionRequest {
    providerId: string;
    apiKey: string;
    baseUrl?: string;
    model: string;
    messages: ChatMessage[];
    maxTokens?: number;
    temperature?: number;
    stream?: boolean;
    userId?: string;
}
export interface ChatCompletionResponse {
    success: boolean;
    content?: string;
    error?: string;
    model?: string;
    usage?: {
        inputTokens?: number;
        outputTokens?: number;
        totalTokens?: number;
    };
}
export interface TestConnectionRequest {
    providerId: string;
    apiKey: string;
    baseUrl?: string;
    model?: string;
}
export interface TestConnectionResponse {
    success: boolean;
    message?: string;
    error?: string;
    availableModels?: string[];
    verifiedModel?: string;
}
export interface ModelDiscoveryResponse {
    success: boolean;
    models?: Array<{
        id: string;
        name: string;
        supportsGenerateContent?: boolean;
    }>;
    error?: string;
}
export declare class AIService {
    private modelCache;
    private cacheTTL;
    private registryService;
    private agentProfileService;
    /**
     * Lazy-load AIModelRegistryService to avoid errors if Airtable is not configured
     */
    private getRegistryService;
    /**
     * Lazy-load AIAgentProfileService to avoid errors if Preferences system is not configured
     */
    private getAgentProfileService;
    /**
     * Inject user's AI Agent Profile into system prompt
     * Merges user preferences with existing system message
     */
    private injectUserProfile;
    /**
     * Discover available models for a provider
     */
    discoverModels(providerId: string, apiKey: string, baseUrl?: string): Promise<ModelDiscoveryResponse>;
    /**
     * Discover available Google Gemini models
     */
    private discoverGoogleModels;
    /**
     * Discover available OpenAI models
     */
    private discoverOpenAIModels;
    /**
     * Discover available Anthropic models
     * Note: Anthropic doesn't have a public models endpoint, so we return known models
     */
    private discoverAnthropicModels;
    /**
     * Get cached models or discover fresh ones (Hybrid Approach)
     * Priority: 1. In-memory cache, 2. Airtable registry, 3. API discovery
     */
    getAvailableModels(providerId: string, apiKey: string, baseUrl?: string, forceRefresh?: boolean): Promise<string[]>;
    /**
     * Validate and find a working model with fallback (Hybrid Approach)
     */
    findWorkingModel(providerId: string, apiKey: string, preferredModel?: string, baseUrl?: string): Promise<{
        model: string;
        availableModels: string[];
    } | null>;
    /**
     * Fallback to hardcoded models if discovery fails
     */
    private findWorkingModelFallback;
    /**
     * Validate if a specific model works
     */
    private validateModel;
    /**
     * Make a chat completion request to Anthropic Claude
     */
    chatAnthropic(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
    /**
     * Make a chat completion request to Google Gemini
     */
    chatGoogle(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
    /**
     * Make a chat completion request to OpenAI
     */
    chatOpenAI(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
    /**
     * Make a chat completion request (routes to appropriate provider)
     */
    chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
    /**
     * Test connection to an AI provider and discover available models
     */
    testConnection(request: TestConnectionRequest): Promise<TestConnectionResponse>;
}
//# sourceMappingURL=AIService.d.ts.map