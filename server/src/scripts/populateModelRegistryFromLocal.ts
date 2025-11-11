/**
 * Script to populate AI Model Registry with local model definitions
 * 
 * This script reads the local provider definitions and populates the Airtable
 * AI Model Registry table with the models, linking them to their providers.
 * 
 * Run with: npm run populate:model-registry
 * or: tsx src/scripts/populateModelRegistryFromLocal.ts
 */

import * as dotenv from 'dotenv'
import { resolve } from 'path'
import Airtable from 'airtable'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') })

const BASE_ID = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || process.env.AIRTABLE_BASE_ID
const API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY

if (!BASE_ID || !API_KEY) {
  console.error('❌ Error: AIRTABLE_SYSTEM_CONFIG_BASE_ID and AIRTABLE_PERSONAL_ACCESS_TOKEN must be set')
  process.exit(1)
}

Airtable.configure({ apiKey: API_KEY })
const base = Airtable.base(BASE_ID)

const MODEL_REGISTRY_TABLE = 'AI Model Registry'
const INTEGRATION_MARKETPLACE_TABLE = 'Integration Marketplace'

// Local provider definitions (from src/lib/integrations/providers.ts)
const LOCAL_PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    supportedModels: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'text-embedding-ada-002', 'gpt-4-vision-preview'],
    defaultModel: 'gpt-3.5-turbo',
    features: ['chat', 'embeddings', 'vision'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    supportedModels: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    defaultModel: 'claude-3-sonnet-20240229',
    features: ['chat', 'embeddings'],
  },
  {
    id: 'google',
    name: 'Google Gemini',
    supportedModels: ['gemini-1.5-pro-latest', 'gemini-1.5-flash-latest', 'gemini-pro', 'gemini-pro-vision'],
    defaultModel: 'gemini-1.5-flash-latest',
    features: ['chat', 'vision'],
  },
]

/**
 * Get provider record ID from Integration Marketplace by Provider ID
 */
async function getProviderRecordId(providerId: string): Promise<string | null> {
  try {
    const records = await base(INTEGRATION_MARKETPLACE_TABLE)
      .select({
        filterByFormula: `{Provider ID} = '${providerId}'`,
        maxRecords: 1,
      })
      .firstPage()

    return records.length > 0 ? records[0].id : null
  } catch (error) {
    console.error(`Error fetching provider ${providerId}:`, error)
    return null
  }
}

/**
 * Get all provider record IDs
 */
async function getAllProviderRecordIds(): Promise<Map<string, string>> {
  const providerMap = new Map<string, string>()
  
  for (const provider of LOCAL_PROVIDERS) {
    const recordId = await getProviderRecordId(provider.id)
    if (recordId) {
      providerMap.set(provider.id, recordId)
      console.log(`   ✅ Found provider "${provider.name}" (${provider.id}): ${recordId}`)
    } else {
      console.warn(`   ⚠️  Provider "${provider.name}" (${provider.id}) not found in Integration Marketplace`)
    }
  }
  
  return providerMap
}

/**
 * Check if model already exists
 */
async function modelExists(providerId: string, modelId: string): Promise<string | null> {
  try {
    const records = await base(MODEL_REGISTRY_TABLE)
      .select({
        filterByFormula: `AND({Provider ID} = '${providerId}', {Model ID} = '${modelId}')`,
        maxRecords: 1,
      })
      .firstPage()

    return records.length > 0 ? records[0].id : null
  } catch (error) {
    console.error(`Error checking if model exists:`, error)
    return null
  }
}

/**
 * Format model name for display
 */
function formatModelName(modelId: string, providerName: string): string {
  // Convert model IDs to readable names
  const nameMap: Record<string, string> = {
    'gpt-4': 'GPT-4',
    'gpt-4-turbo': 'GPT-4 Turbo',
    'gpt-3.5-turbo': 'GPT-3.5 Turbo',
    'text-embedding-ada-002': 'Text Embedding Ada 002',
    'gpt-4-vision-preview': 'GPT-4 Vision Preview',
    'claude-3-opus-20240229': 'Claude 3 Opus',
    'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
    'claude-3-haiku-20240307': 'Claude 3 Haiku',
    'gemini-1.5-pro-latest': 'Gemini 1.5 Pro',
    'gemini-1.5-flash-latest': 'Gemini 1.5 Flash',
    'gemini-pro': 'Gemini Pro',
    'gemini-pro-vision': 'Gemini Pro Vision',
  }
  
  return nameMap[modelId] || modelId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * Determine model status based on model ID
 * Note: Must match the Status field options in Airtable: 'active', 'deprecated', 'beta', 'preview'
 */
function getModelStatus(modelId: string): 'active' | 'preview' | 'beta' | 'deprecated' {
  if (modelId.includes('preview') || modelId.includes('beta')) {
    return 'preview'
  }
  if (modelId.includes('deprecated')) {
    return 'deprecated'
  }
  return 'active' // Default to 'active' (not 'stable')
}

/**
 * Populate models for a provider
 */
async function populateProviderModels(
  provider: typeof LOCAL_PROVIDERS[0],
  providerRecordId: string
): Promise<{ created: number; updated: number }> {
  let created = 0
  let updated = 0

  console.log(`\n📝 Processing ${provider.name} (${provider.id})...`)

  for (let i = 0; i < provider.supportedModels.length; i++) {
    const modelId = provider.supportedModels[i]
    const isDefault = modelId === provider.defaultModel
    const modelName = formatModelName(modelId, provider.name)
    const status = getModelStatus(modelId)
    
    // Check if model already exists
    const existingRecordId = await modelExists(provider.id, modelId)
    
    const now = new Date().toISOString()
    const fields: any = {
      'Provider ID': provider.id,
      'Model ID': modelId,
      'Model Name': modelName,
      'Status': status,
      'Available': true,
      'Last Verified': now,
      'Discovery Method': 'manual',
      'Features': provider.features || [],
      'Regions': ['global'],
      'Recommended': isDefault,
      'Sort Order': i + 1,
      'Provider': [providerRecordId], // Link to provider
    }

    try {
      if (existingRecordId) {
        // Update existing model
        await base(MODEL_REGISTRY_TABLE).update([
          {
            id: existingRecordId,
            fields: {
              ...fields,
              // Don't overwrite some fields if they exist
              'Cost per 1K tokens': undefined,
              'Max Tokens': undefined,
            },
          },
        ])
        updated++
        console.log(`   ✅ Updated: ${modelName} (${modelId})`)
      } else {
        // Create new model
        await base(MODEL_REGISTRY_TABLE).create([{ fields }])
        created++
        console.log(`   ✅ Created: ${modelName} (${modelId})`)
      }
    } catch (error: any) {
      console.error(`   ❌ Error processing ${modelId}:`, error.message)
    }
  }

  return { created, updated }
}

async function main() {
  console.log('🚀 Populating AI Model Registry from local definitions...')
  console.log(`   Base ID: ${BASE_ID}`)
  console.log(`   Table: ${MODEL_REGISTRY_TABLE}`)

  // Get all provider record IDs
  console.log(`\n📋 Fetching provider records from Integration Marketplace...`)
  const providerRecordIds = await getAllProviderRecordIds()

  if (providerRecordIds.size === 0) {
    console.error('\n❌ No providers found in Integration Marketplace!')
    console.log('   Please ensure the Integration Marketplace table is populated first.')
    process.exit(1)
  }

  let totalCreated = 0
  let totalUpdated = 0

  // Process each provider
  for (const provider of LOCAL_PROVIDERS) {
    const providerRecordId = providerRecordIds.get(provider.id)
    if (!providerRecordId) {
      console.warn(`\n⚠️  Skipping ${provider.name} - not found in Integration Marketplace`)
      continue
    }

    const result = await populateProviderModels(provider, providerRecordId)
    totalCreated += result.created
    totalUpdated += result.updated
  }

  console.log(`\n✅ Population complete!`)
  console.log(`   Created: ${totalCreated} models`)
  console.log(`   Updated: ${totalUpdated} models`)
  console.log(`   Total: ${totalCreated + totalUpdated} models`)
  console.log('\n💡 Models are now linked to their providers in the Integration Marketplace')
}

main().catch(console.error)

