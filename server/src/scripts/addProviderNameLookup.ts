/**
 * Script to add Provider Name lookup field to AI Model Registry
 * 
 * This creates a lookup field that automatically pulls the provider name
 * from the linked Integration Marketplace record.
 * 
 * Run with: npm run add:provider-name-lookup
 * or: tsx src/scripts/addProviderNameLookup.ts
 */

import * as dotenv from 'dotenv'
import { resolve } from 'path'
import Airtable from 'airtable'

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

Airtable.configure({ apiKey: API_KEY })
const base = Airtable.base(BASE_ID)

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
 * Get field ID by name using Airtable client
 */
async function getFieldId(tableName: string, fieldName: string): Promise<string | null> {
  try {
    // Use Airtable client to get table schema
    const table = base(tableName)
    // Fetch one record to get the schema (fields are in the response)
    const records = await table.select({ maxRecords: 1 }).firstPage()
    
    if (records.length > 0) {
      const record = records[0]
      const fields = Object.keys(record.fields)
      // Check if field exists
      if (fields.includes(fieldName)) {
        // For Airtable client, we need to use Metadata API to get field ID
        // But we can at least verify the field exists
        // Return a placeholder - we'll use the field name in the formula
        return fieldName // Use field name directly in formula
      }
    }
    return null
  } catch (error) {
    console.error(`Error checking field ${fieldName}:`, error)
    return null
  }
}

/**
 * Check if field exists
 */
async function fieldExists(tableId: string, fieldName: string): Promise<boolean> {
  const fieldId = await getFieldId(tableId, fieldName)
  return fieldId !== null
}

/**
 * Add Provider Name lookup field
 */
async function addProviderNameLookup(
  modelRegistryTableId: string,
  integrationMarketplaceTableId: string
): Promise<void> {
  console.log(`\n📋 Adding "Provider Name" lookup field to "${MODEL_REGISTRY_TABLE_NAME}"...`)

  const fieldName = 'Provider Name'
  const fieldExistsCheck = await fieldExists(modelRegistryTableId, fieldName)

  if (fieldExistsCheck) {
    console.log(`   ✅ Field "${fieldName}" already exists`)
    return
  }

  // Check if Provider field exists using Airtable client
  let providerFieldName = 'Provider'
  try {
    const table = base(MODEL_REGISTRY_TABLE_NAME)
    const records = await table.select({ maxRecords: 1 }).firstPage()
    if (records.length > 0) {
      const fields = Object.keys(records[0].fields)
      if (!fields.includes('Provider')) {
        // Try alternative names
        if (fields.includes('Provider Link')) {
          providerFieldName = 'Provider Link'
        } else {
          console.log(`   Available fields: ${fields.join(', ')}`)
          throw new Error('Provider link field not found. Please run add:model-registry-relationship first.')
        }
      }
      console.log(`   ✅ Found Provider field: "${providerFieldName}"`)
    }
  } catch (error: any) {
    console.error(`   ❌ Error checking Provider field: ${error.message}`)
    throw new Error('Provider link field not found. Please run add:model-registry-relationship first.')
  }

  // Verify Name field exists in Integration Marketplace
  try {
    const table = base(INTEGRATION_MARKETPLACE_TABLE_NAME)
    const records = await table.select({ maxRecords: 1 }).firstPage()
    if (records.length > 0) {
      const fields = Object.keys(records[0].fields)
      if (!fields.includes('Name')) {
        throw new Error('Name field not found in Integration Marketplace table.')
      }
      console.log(`   ✅ Found Name field in Integration Marketplace`)
    }
  } catch (error: any) {
    console.error(`   ❌ Error checking Name field: ${error.message}`)
    throw new Error('Name field not found in Integration Marketplace table.')
  }

  const url = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables/${modelRegistryTableId}/fields`
  const payload = {
    name: fieldName,
    type: 'formula',
    description: 'Provider name automatically pulled from linked Integration Marketplace record',
    options: {
      formula: `IF({${providerFieldName}}, {${providerFieldName}}.Name, "")`,
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
      throw new Error(`Failed to add lookup field: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json() as { id: string; name: string }
    console.log(`   ✅ Field "${fieldName}" added successfully! ID: ${result.id}`)
    console.log(`   💡 This field will automatically update when provider names change in Integration Marketplace`)
  } catch (error: any) {
    console.error(`   ❌ Error adding lookup field: ${error.message}`)
    throw error
  }
}

async function main() {
  console.log('🔗 Adding Provider Name lookup field to AI Model Registry...')
  console.log(`   Base ID: ${BASE_ID}`)

  // Get table IDs
  console.log(`\n📋 Fetching table IDs...`)
  const modelRegistryTableId = await getTableId(MODEL_REGISTRY_TABLE_NAME)
  const integrationMarketplaceTableId = await getTableId(INTEGRATION_MARKETPLACE_TABLE_NAME)

  if (!modelRegistryTableId) {
    console.error(`❌ Error: Table "${MODEL_REGISTRY_TABLE_NAME}" not found`)
    process.exit(1)
  }

  if (!integrationMarketplaceTableId) {
    console.error(`❌ Error: Table "${INTEGRATION_MARKETPLACE_TABLE_NAME}" not found`)
    process.exit(1)
  }

  console.log(`   ✅ "${MODEL_REGISTRY_TABLE_NAME}" ID: ${modelRegistryTableId}`)
  console.log(`   ✅ "${INTEGRATION_MARKETPLACE_TABLE_NAME}" ID: ${integrationMarketplaceTableId}`)

  try {
    await addProviderNameLookup(modelRegistryTableId, integrationMarketplaceTableId)

    console.log(`\n✅ Successfully created lookup field!`)
    console.log('\n💡 How it works:')
    console.log('   - "Provider Name" is a formula field that looks up the Name from the linked Provider record')
    console.log('   - When you change a provider name in Integration Marketplace, it automatically updates in AI Model Registry')
    console.log('   - No manual updates needed!')
  } catch (error: any) {
    console.error(`\n❌ Failed to create lookup field: ${error.message}`)
    process.exit(1)
  }
}

main().catch(console.error)

