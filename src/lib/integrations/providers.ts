/**
 * Predefined AI Providers
 */

import { AIProvider } from './types'

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-3.5, and other OpenAI models for chat, embeddings, and vision',
    icon: 'openai',
    category: 'llm',
    authType: 'api_key',
    baseUrl: 'https://api.openai.com/v1',
    documentationUrl: 'https://platform.openai.com/docs',
    supportedModels: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'text-embedding-ada-002', 'gpt-4-vision-preview'],
    defaultModel: 'gpt-3.5-turbo',
    features: ['chat', 'embeddings', 'vision'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Claude AI models for advanced reasoning and long-context conversations',
    icon: 'anthropic',
    category: 'llm',
    authType: 'api_key',
    baseUrl: 'https://api.anthropic.com/v1',
    documentationUrl: 'https://docs.anthropic.com',
    supportedModels: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    defaultModel: 'claude-3-sonnet-20240229',
    features: ['chat', 'embeddings'],
  },
  {
    id: 'google',
    name: 'Google Gemini',
    description: 'Google\'s Gemini AI models for multimodal understanding',
    icon: 'google',
    category: 'llm',
    authType: 'api_key',
    baseUrl: 'https://generativelanguage.googleapis.com/v1',
    documentationUrl: 'https://ai.google.dev/docs',
    supportedModels: ['gemini-1.5-pro-latest', 'gemini-1.5-flash-latest', 'gemini-pro', 'gemini-pro-vision'],
    defaultModel: 'gemini-1.5-flash-latest',
    features: ['chat', 'vision'],
  },
  {
    id: 'custom',
    name: 'Custom AI Provider',
    description: 'Connect to a custom AI service endpoint with your own API key',
    icon: 'custom',
    category: 'custom',
    authType: 'custom',
    baseUrl: '',
    features: ['chat'],
  },
]

export function getProviderById(id: string): AIProvider | undefined {
  return AI_PROVIDERS.find(p => p.id === id)
}

export function getProviderIcon(providerId: string): string {
  const provider = getProviderById(providerId)
  return provider?.icon || 'custom'
}

