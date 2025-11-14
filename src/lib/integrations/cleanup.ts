/**
 * Integration Cleanup Utilities
 * 
 * Provides functions to clean up and manage integrations
 */

import { getAllIntegrations, deleteIntegration, cleanupDuplicateIntegrations } from './storage'
import { AIIntegration } from './types'

/**
 * Clean all historical/duplicate integrations
 * Keeps only the most recent valid integration per provider
 */
export function cleanHistoricalIntegrations(): {
  removed: number
  kept: AIIntegration[]
} {
  const removed = cleanupDuplicateIntegrations()
  const kept = getAllIntegrations().filter(i => i.enabled)
  
  return {
    removed,
    kept,
  }
}

/**
 * Remove all integrations for specific providers
 */
export function deleteIntegrationsByProvider(providerIds: string[]): number {
  const integrations = getAllIntegrations()
  const toRemove = integrations.filter(i => providerIds.includes(i.providerId))
  
  toRemove.forEach(integration => {
    deleteIntegration(integration.id)
  })
  
  // Dispatch event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('integrations-cleaned', { 
      detail: { removedCount: toRemove.length } 
    }))
  }
  
  return toRemove.length
}

/**
 * Remove all integrations for a specific provider
 */
export function removeProviderIntegrations(providerId: string): number {
  return deleteIntegrationsByProvider([providerId])
}

/**
 * Get integration statistics
 */
export function getIntegrationStats(): {
  total: number
  byProvider: Record<string, number>
  duplicates: number
  invalid: number
} {
  const all = getAllIntegrations()
  const validProviderIds = ['openai', 'anthropic', 'google', 'custom']
  
  const byProvider: Record<string, number> = {}
  let invalid = 0
  
  all.forEach(integration => {
    // Count by provider
    byProvider[integration.providerId] = (byProvider[integration.providerId] || 0) + 1
    
    // Count invalid
    if (!integration.apiKey || !validProviderIds.includes(integration.providerId)) {
      invalid++
    }
  })
  
  // Count duplicates (more than one per provider)
  const duplicates = Object.values(byProvider).reduce((sum, count) => {
    return sum + Math.max(0, count - 1)
  }, 0)
  
  return {
    total: all.length,
    byProvider,
    duplicates,
    invalid,
  }
}
