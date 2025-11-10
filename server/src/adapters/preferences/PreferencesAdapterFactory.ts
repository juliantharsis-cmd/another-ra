/**
 * Preferences Adapter Factory
 * 
 * Creates and manages preference storage adapters (Airtable, PostgreSQL, Memory)
 */

import { IPreferencesAdapter } from '../../types/Preferences'
import { AirtablePreferencesAdapter } from './AirtablePreferencesAdapter'
import { MemoryPreferencesAdapter } from './MemoryPreferencesAdapter'
import { PostgresPreferencesAdapter } from './PostgresPreferencesAdapter'

let adapterInstance: IPreferencesAdapter | null = null

/**
 * Get the configured preferences adapter
 */
export function getPreferencesAdapter(): IPreferencesAdapter {
  if (adapterInstance) {
    return adapterInstance
  }

  const adapterType = process.env.PREFERENCES_ADAPTER || 'airtable'

  switch (adapterType.toLowerCase()) {
    case 'airtable':
      adapterInstance = new AirtablePreferencesAdapter()
      break
    case 'memory':
      adapterInstance = new MemoryPreferencesAdapter()
      break
    case 'postgres':
    case 'postgresql':
      adapterInstance = new PostgresPreferencesAdapter()
      break
    default:
      console.warn(`⚠️  Unknown preferences adapter type: ${adapterType}, falling back to memory`)
      adapterInstance = new MemoryPreferencesAdapter()
  }

  console.log(`✅ Using preferences adapter: ${adapterInstance.getName()}`)
  return adapterInstance
}

/**
 * Reset adapter instance (useful for testing)
 */
export function resetPreferencesAdapter(): void {
  adapterInstance = null
}

