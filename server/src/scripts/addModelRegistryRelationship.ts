/**
 * Script to add relationship field between AI Model Registry and Integration Marketplace
 * 
 * Run with: npm run add:model-registry-relationship
 * or: tsx src/scripts/addModelRegistryRelationship.ts
 */

import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') })

const BASE_ID = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || process.env.AIRTABLE_BASE_ID
const API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY
const MODEL_REGISTRY_TABLE_NAME = 'AI Model Registry'
const INTEGRATION_MARKETPLACE_TABLE_NAME = 'Integration Marketplace'

if (!BASE_ID || !API_KEY) {
  console.error('❌ Error: AIRTABLE_SYSTEM_CONFIG_BASE_ID and AIRTABLE_PERSONAL_ACCESS_TOKEN must be set')
  process.exit(1)
}

const fetchFn = globalThis.fetch || require('node-fetch')

/**
 * Get table ID by name
 */
async function getTableId(tableName: string): Promise<string | null> {
  try {
    const url = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`
    const response = await fetchFn(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json() as { tables?: Array<{ id: string; name: string }> }
      const tables = data.tables || []
      const table = tables.find((t: any) => t.name === tableName)
      return table?.id || null
    }
    return null
  } catch (error) {
    console.error(`Error fetching table ID for ${tableName}:`, error)
    return null
  }
}

/**
 * Check if field exists in table
 */
async function fieldExists(tableId: string, fieldName: string): Promise<boolean> {
  try {
    const url = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables/${tableId}`
    const response = await fetchFn(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json() as { fields?: Array<{ name: string }> }
      const fields = data.fields || []
      return fields.some((f: any) => f.name === fieldName)
    }
    return false
  } catch (error) {
    console.error(`Error checking if field exists:`, error)
    return false
  }
}

/**
 * Add relationship field to AI Model Registry table
 */
async function addRelationshipField(
  modelRegistryTableId: string,
  integrationMarketplaceTableId: string
): Promise<void> {
  console.log(`\n📋 Adding relationship field to "${MODEL_REGISTRY_TABLE_NAME}"...`)

  const fieldName = 'Provider'
  const fieldExistsCheck = await fieldExists(modelRegistryTableId, fieldName)

  if (fieldExistsCheck) {
    console.log(`   ✅ Field "${fieldName}" already exists`)
    // Still try to create reverse relationship
    return
  }

  const url = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables/${modelRegistryTableId}/fields`
  const payload = {
    name: fieldName,
    type: 'multipleRecordLinks',
    description: 'Link to the Integration Marketplace provider this model belongs to',
    options: {
      linkedTableId: integrationMarketplaceTableId,
    },
  }

  try {
    const response = await fetchFn(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to add field: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json() as { id: string; name: string }
    console.log(`   ✅ Field "${fieldName}" added successfully! ID: ${result.id}`)
  } catch (error: any) {
    console.error(`   ❌ Error adding field: ${error.message}`)
    throw error
  }
}

/**
 * Add reverse relationship field to Integration Marketplace table (optional - for viewing models from provider)
 */
async function addReverseRelationshipField(
  integrationMarketplaceTableId: string,
  modelRegistryTableId: string
): Promise<void> {
  console.log(`\n📋 Adding reverse relationship field to "${INTEGRATION_MARKETPLACE_TABLE_NAME}"...`)

  const fieldName = 'Models'
  const fieldExistsCheck = await fieldExists(integrationMarketplaceTableId, fieldName)

  if (fieldExistsCheck) {
    console.log(`   ✅ Field "${fieldName}" already exists`)
    return
  }

  // First, get the forward link field ID
  const modelRegistryTableUrl = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables/${modelRegistryTableId}`
  const tableResponse = await fetchFn(modelRegistryTableUrl, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
  })

  if (!tableResponse.ok) {
    const errorText = await tableResponse.text().catch(() => 'Unknown error')
    throw new Error(`Failed to fetch model registry table details: ${tableResponse.status} ${tableResponse.statusText} - ${errorText}`)
  }

  const tableData = await tableResponse.json() as { fields?: Array<{ id: string; name: string; type: string; options?: any }> }
  const providerField = tableData.fields?.find((f: any) => f.name === 'Provider' && f.type === 'multipleRecordLinks')

  if (!providerField) {
    console.log(`   ⚠️  Forward link field not found, skipping reverse field creation`)
    return
  }

  const url = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables/${integrationMarketplaceTableId}/fields`
  const payload = {
    name: fieldName,
    type: 'multipleRecordLinks',
    description: 'AI models available for this provider (from AI Model Registry)',
    options: {
      linkedTableId: modelRegistryTableId,
      isReversed: true,
      prefersSingleRecordLink: false, // Multiple models per provider
      inverseLinkFieldId: providerField.id,
    },
  }

  try {
    const response = await fetchFn(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      // If it's because the reverse field already exists, that's okay
      if (errorText.includes('already exists') || errorText.includes('inverse')) {
        console.log(`   ℹ️  Reverse relationship already configured`)
        return
      }
      throw new Error(`Failed to add reverse field: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json() as { id: string; name: string }
    console.log(`   ✅ Reverse field "${fieldName}" added successfully! ID: ${result.id}`)
  } catch (error: any) {
    console.warn(`   ⚠️  Could not add reverse field (this is optional): ${error.message}`)
    // Don't throw - reverse field is optional
  }
}

async function main() {
  console.log('🔗 Adding relationship between Integration Marketplace and AI Model Registry...')
  console.log(`   Base ID: ${BASE_ID}`)

  // Get table IDs
  console.log(`\n📋 Fetching table IDs...`)
  const modelRegistryTableId = await getTableId(MODEL_REGISTRY_TABLE_NAME)
  const integrationMarketplaceTableId = await getTableId(INTEGRATION_MARKETPLACE_TABLE_NAME)

  if (!modelRegistryTableId) {
    console.error(`❌ Error: Table "${MODEL_REGISTRY_TABLE_NAME}" not found`)
    console.log(`   Please run: npm run create:ai-model-registry-table`)
    process.exit(1)
  }

  if (!integrationMarketplaceTableId) {
    console.error(`❌ Error: Table "${INTEGRATION_MARKETPLACE_TABLE_NAME}" not found`)
    console.log(`   Please run: npm run create:integration-marketplace-table`)
    process.exit(1)
  }

  console.log(`   ✅ "${MODEL_REGISTRY_TABLE_NAME}" ID: ${modelRegistryTableId}`)
  console.log(`   ✅ "${INTEGRATION_MARKETPLACE_TABLE_NAME}" ID: ${integrationMarketplaceTableId}`)

  try {
    // Add forward relationship (Model Registry -> Integration Marketplace)
    // This may already exist, so we handle it gracefully
    try {
      await addRelationshipField(modelRegistryTableId, integrationMarketplaceTableId)
    } catch (error: any) {
      if (error.message.includes('DUPLICATE')) {
        console.log(`   ℹ️  Forward relationship field already exists`)
      } else {
        throw error
      }
    }

    // Add reverse relationship (Integration Marketplace -> Model Registry)
    // Note: Airtable may auto-create this, so we catch errors gracefully
    try {
      await addReverseRelationshipField(integrationMarketplaceTableId, modelRegistryTableId)
    } catch (error: any) {
      console.log(`   ℹ️  Reverse field may have been auto-created by Airtable`)
      // Check if it exists now
      const reverseFieldExists = await fieldExists(integrationMarketplaceTableId, 'Models')
      if (reverseFieldExists) {
        console.log(`   ✅ Reverse field "Models" already exists in Integration Marketplace`)
      }
    }

    console.log(`\n✅ Successfully created relationship between tables!`)
    console.log('\n📝 Relationship structure:')
    console.log(`   - "${MODEL_REGISTRY_TABLE_NAME}" has "Provider" field (links to Integration Marketplace)`)
    console.log(`   - "${INTEGRATION_MARKETPLACE_TABLE_NAME}" has "Models" field (shows linked models)`)
    console.log('\n💡 Usage:')
    console.log('   - When creating/updating models, link them to their provider')
    console.log('   - View all models for a provider from the Integration Marketplace table')
  } catch (error: any) {
    console.error(`\n❌ Failed to create relationship: ${error.message}`)
    process.exit(1)
  }
}

main().catch(console.error)

