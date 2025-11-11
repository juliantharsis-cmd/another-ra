/**
 * Secure Integration Storage
 * 
 * Handles storage and retrieval of AI integration configurations
 * with encryption and masking for sensitive data
 */

import { AIIntegration, IntegrationConfig } from './types'

const STORAGE_PREFIX = 'ai_integration_'
const INTEGRATIONS_LIST_KEY = 'ai_integrations_list'

/**
 * Simple encryption/decryption (for demo - use proper encryption in production)
 * In production, consider using Web Crypto API or backend storage
 */
function encrypt(text: string): string {
  // Simple base64 encoding for demo (NOT secure for production)
  // In production, use proper encryption or store on backend
  if (typeof window === 'undefined') return text
  return btoa(text)
}

function decrypt(encrypted: string): string {
  if (typeof window === 'undefined') return encrypted
  try {
    return atob(encrypted)
  } catch {
    return encrypted
  }
}

/**
 * Mask API key for display (show only last 4 characters)
 */
export function maskApiKey(key: string): string {
  if (!key || key.length <= 4) return '****'
  return `****${key.slice(-4)}`
}

/**
 * Save integration to localStorage
 */
export function saveIntegration(integration: AIIntegration): void {
  if (typeof window === 'undefined') return

  try {
    const encrypted = {
      ...integration,
      apiKey: encrypt(integration.apiKey),
    }
    
    // Save individual integration
    localStorage.setItem(`${STORAGE_PREFIX}${integration.id}`, JSON.stringify(encrypted))
    
    // Update integrations list
    const list = getIntegrationsList()
    if (!list.includes(integration.id)) {
      list.push(integration.id)
      localStorage.setItem(INTEGRATIONS_LIST_KEY, JSON.stringify(list))
    }
  } catch (error) {
    console.error('Error saving integration:', error)
    throw new Error('Failed to save integration')
  }
}

/**
 * Get integration by ID
 */
export function getIntegration(id: string): AIIntegration | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${id}`)
    if (!stored) return null

    const integration = JSON.parse(stored)
    return {
      ...integration,
      apiKey: decrypt(integration.apiKey),
      createdAt: new Date(integration.createdAt),
      updatedAt: new Date(integration.updatedAt),
      lastUsed: integration.lastUsed ? new Date(integration.lastUsed) : undefined,
    }
  } catch (error) {
    console.error('Error loading integration:', error)
    return null
  }
}

/**
 * Get all integrations
 */
export function getAllIntegrations(): AIIntegration[] {
  if (typeof window === 'undefined') return []

  try {
    const list = getIntegrationsList()
    return list
      .map(id => getIntegration(id))
      .filter((integration): integration is AIIntegration => integration !== null)
  } catch (error) {
    console.error('Error loading integrations:', error)
    return []
  }
}

/**
 * Get integrations list from localStorage
 */
function getIntegrationsList(): string[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(INTEGRATIONS_LIST_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Delete integration
 */
export function deleteIntegration(id: string): void {
  if (typeof window === 'undefined') return

  try {
    // Remove individual integration
    localStorage.removeItem(`${STORAGE_PREFIX}${id}`)
    
    // Update list
    const list = getIntegrationsList()
    const updatedList = list.filter(integrationId => integrationId !== id)
    localStorage.setItem(INTEGRATIONS_LIST_KEY, JSON.stringify(updatedList))
  } catch (error) {
    console.error('Error deleting integration:', error)
    throw new Error('Failed to delete integration')
  }
}

/**
 * Create new integration from config
 */
export function createIntegration(config: IntegrationConfig, providerName: string): AIIntegration {
  const id = `integration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const now = new Date()

  return {
    id,
    providerId: config.providerId,
    providerName,
    apiKey: config.apiKey,
    apiKeyType: config.apiKeyType || 'api_key',
    baseUrl: config.baseUrl,
    model: config.model,
    enabled: config.enabled !== false,
    createdAt: now,
    updatedAt: now,
    metadata: config.metadata,
  }
}

/**
 * Update existing integration
 */
export function updateIntegration(id: string, updates: Partial<IntegrationConfig>): AIIntegration | null {
  const existing = getIntegration(id)
  if (!existing) return null

  const updated: AIIntegration = {
    ...existing,
    ...updates,
    apiKey: updates.apiKey !== undefined ? updates.apiKey : existing.apiKey,
    updatedAt: new Date(),
  }

  saveIntegration(updated)
  return updated
}

