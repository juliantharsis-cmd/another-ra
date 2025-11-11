/**
 * Cleanup Utilities for AI Integrations
 * 
 * Helper functions to clear/delete integrations
 */

import { getAllIntegrations, deleteIntegration } from './storage'

/**
 * Delete all integrations for specific providers
 */
export function deleteIntegrationsByProvider(providerIds: string[]): number {
  if (typeof window === 'undefined') return 0

  try {
    const allIntegrations = getAllIntegrations()
    let deletedCount = 0

    allIntegrations.forEach(integration => {
      if (providerIds.includes(integration.providerId)) {
        deleteIntegration(integration.id)
        deletedCount++
      }
    })

    return deletedCount
  } catch (error) {
    console.error('Error deleting integrations:', error)
    return 0
  }
}

/**
 * Delete all integrations
 */
export function deleteAllIntegrations(): number {
  if (typeof window === 'undefined') return 0

  try {
    const allIntegrations = getAllIntegrations()
    let deletedCount = 0

    allIntegrations.forEach(integration => {
      deleteIntegration(integration.id)
      deletedCount++
    })

    return deletedCount
  } catch (error) {
    console.error('Error deleting all integrations:', error)
    return 0
  }
}

/**
 * Clear all integration data from localStorage
 * This is a more aggressive cleanup that removes everything
 */
export function clearAllIntegrationData(): void {
  if (typeof window === 'undefined') return

  try {
    // Get all localStorage keys related to integrations
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('ai_integration_') || key === 'ai_integrations_list')) {
        keysToRemove.push(key)
      }
    }

    // Remove all integration-related keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })

    console.log(`Cleared ${keysToRemove.length} integration-related items from localStorage`)
  } catch (error) {
    console.error('Error clearing integration data:', error)
  }
}

