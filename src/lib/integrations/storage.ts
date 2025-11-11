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
 * Get integration by provider ID (returns the most recent one if duplicates exist)
 */
export function getIntegrationByProviderId(providerId: string): AIIntegration | null {
  if (typeof window === 'undefined') return null

  const allIntegrations = getAllIntegrations()
  const providerIntegrations = allIntegrations.filter(i => i.providerId === providerId && i.enabled)
  
  if (providerIntegrations.length === 0) return null
  
  // Return the most recently updated one
  return providerIntegrations.reduce((latest, current) => {
    const latestDate = latest.updatedAt ? new Date(latest.updatedAt).getTime() : 0
    const currentDate = current.updatedAt ? new Date(current.updatedAt).getTime() : 0
    return currentDate > latestDate ? current : latest
  })
}

/**
 * Create new integration from config
 * If an integration for this provider already exists, it will be updated instead
 */
export function createIntegration(config: IntegrationConfig, providerName: string): AIIntegration {
  // Check if integration for this provider already exists
  const existing = getIntegrationByProviderId(config.providerId)
  
  if (existing) {
    // Update existing integration instead of creating duplicate
    return updateIntegration(existing.id, config) || existing
  }
  
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

  // Ensure providerId is valid (not an Airtable record ID)
  // Valid providerIds are: 'openai', 'anthropic', 'google', 'custom'
  const validProviderIds = ['openai', 'anthropic', 'google', 'custom']
  let providerId = updates.providerId || existing.providerId
  
  // If providerId looks like an Airtable record ID (starts with 'rec'), try to fix it
  if (providerId && providerId.startsWith('rec') && !validProviderIds.includes(providerId)) {
    console.warn(`Invalid providerId detected (Airtable record ID): ${providerId}. This should be fixed.`)
    // Don't update providerId if it's invalid - keep existing one
    providerId = existing.providerId
  }

  const updated: AIIntegration = {
    ...existing,
    ...updates,
    providerId: providerId, // Use validated providerId
    apiKey: updates.apiKey !== undefined ? updates.apiKey : existing.apiKey,
    updatedAt: new Date(),
  }

  saveIntegration(updated)
  return updated
}

/**
 * Update last used timestamp for an integration
 */
export function updateLastUsed(id: string): void {
  const existing = getIntegration(id)
  if (!existing) return

  const updated: AIIntegration = {
    ...existing,
    lastUsed: new Date(),
    updatedAt: new Date(),
  }

  saveIntegration(updated)
}

/**
 * Clean up duplicate integrations - keeps only the most recent one per provider
 * Returns the number of duplicates removed
 */
export function cleanupDuplicateIntegrations(): number {
  if (typeof window === 'undefined') return 0

  try {
    const allIntegrations = getAllIntegrations()
    const providerMap = new Map<string, AIIntegration[]>()
    
    // Group integrations by providerId
    allIntegrations.forEach(integration => {
      const existing = providerMap.get(integration.providerId) || []
      existing.push(integration)
      providerMap.set(integration.providerId, existing)
    })
    
    let removedCount = 0
    
    // For each provider, keep only the most recent integration
    providerMap.forEach((integrations, providerId) => {
      if (integrations.length > 1) {
        // Sort by updatedAt (most recent first)
        integrations.sort((a, b) => {
          const aDate = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
          const bDate = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
          return bDate - aDate
        })
        
        // Keep the first (most recent), delete the rest
        const toKeep = integrations[0]
        const toRemove = integrations.slice(1)
        
        toRemove.forEach(integration => {
          deleteIntegration(integration.id)
          removedCount++
        })
      }
    })
    
    return removedCount
  } catch (error) {
    console.error('Error cleaning up duplicate integrations:', error)
    return 0
  }
}

