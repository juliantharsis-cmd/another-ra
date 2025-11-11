/**
 * Create Integration Marketplace Table Script
 * 
 * Uses Airtable Metadata API to create the table programmatically
 * 
 * Run with: npm run create:integration-marketplace-table
 */

// Load environment variables
import dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(__dirname, '../../.env') })
dotenv.config()

// Use the same pattern as createPreferencesTable.ts
const API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY
const BASE_ID = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || process.env.AIRTABLE_BASE_ID || 'appGtLbKhmNkkTLVL'
const TABLE_NAME = 'Integration Marketplace'

if (!API_KEY) {
  console.error('❌ AIRTABLE_PERSONAL_ACCESS_TOKEN or AIRTABLE_API_KEY is required')
  console.error('   Please set it in your server/.env file')
  process.exit(1)
}

// Use native fetch (Node 18+) or try to import node-fetch
let fetchFn: typeof fetch
try {
  if (typeof globalThis.fetch !== 'undefined') {
    fetchFn = globalThis.fetch
  } else {
    // Try to use node-fetch if available
    const nodeFetch = require('node-fetch')
    fetchFn = nodeFetch.default || nodeFetch
  }
} catch {
  console.error('❌ Fetch is not available. Please use Node.js 18+ or install node-fetch')
  process.exit(1)
}

interface FieldDefinition {
  name: string
  type: string
  options?: any
}

const FIELD_DEFINITIONS = [
  {
    name: 'Name',
    type: 'singleLineText',
    description: 'Display name of the AI provider',
  },
  {
    name: 'Provider ID',
    type: 'singleLineText',
    description: 'Unique identifier (e.g., "openai", "anthropic")',
  },
  {
    name: 'Description',
    type: 'multilineText',
    description: 'Description of the provider and its capabilities',
  },
  {
    name: 'Icon',
    type: 'singleLineText',
    description: 'Icon identifier or emoji',
  },
  {
    name: 'Category',
    type: 'singleSelect',
    options: {
      choices: [
        { name: 'llm', color: 'blueLight2' },
        { name: 'vision', color: 'greenLight2' },
        { name: 'speech', color: 'yellowLight2' },
        { name: 'custom', color: 'grayLight2' },
      ],
    },
    description: 'Provider category',
  },
  {
    name: 'Auth Type',
    type: 'singleSelect',
    options: {
      choices: [
        { name: 'api_key', color: 'blueLight2' },
        { name: 'pat', color: 'greenLight2' },
        { name: 'oauth', color: 'yellowLight2' },
        { name: 'custom', color: 'grayLight2' },
      ],
    },
    description: 'Authentication type',
  },
  {
    name: 'Base URL',
    type: 'url',
    description: 'Default API endpoint URL',
  },
  {
    name: 'Documentation URL',
    type: 'url',
    description: 'Link to provider documentation',
  },
  {
    name: 'Supported Models',
    type: 'multilineText',
    description: 'Comma-separated list of supported models',
  },
  {
    name: 'Default Model',
    type: 'singleLineText',
    description: 'Default model to use if none specified',
  },
  {
    name: 'Features',
    type: 'multilineText',
    description: 'Comma-separated list of features (chat, embeddings, vision, etc.)',
  },
  {
    name: 'Enabled',
    type: 'checkbox',
    options: {
      icon: 'check',
      color: 'greenBright',
    },
    description: 'Whether this provider is available in the marketplace',
  },
  {
    name: 'Sort Order',
    type: 'number',
    options: {
      precision: 0, // Integer
    },
    description: 'Display order in marketplace (lower numbers appear first)',
  },
  {
    name: 'Attachments',
    type: 'multipleAttachments',
    description: 'Provider logos, documentation files, or other attachments',
  },
]

const INITIAL_RECORDS = [
  {
    'Name': 'OpenAI',
    'Provider ID': 'openai',
    'Description': 'GPT-4, GPT-3.5, and other OpenAI models for chat, embeddings, and vision',
    'Icon': 'openai',
    'Category': 'llm',
    'Auth Type': 'api_key',
    'Base URL': 'https://api.openai.com/v1',
    'Documentation URL': 'https://platform.openai.com/docs',
    'Supported Models': 'gpt-4, gpt-4-turbo, gpt-3.5-turbo, text-embedding-ada-002, gpt-4-vision-preview',
    'Default Model': 'gpt-3.5-turbo',
    'Features': 'chat, embeddings, vision',
    'Enabled': true,
    'Sort Order': 1,
  },
  {
    'Name': 'Anthropic Claude',
    'Provider ID': 'anthropic',
    'Description': 'Claude AI models for advanced reasoning and long-context conversations',
    'Icon': 'anthropic',
    'Category': 'llm',
    'Auth Type': 'api_key',
    'Base URL': 'https://api.anthropic.com/v1',
    'Documentation URL': 'https://docs.anthropic.com',
    'Supported Models': 'claude-3-opus-20240229, claude-3-sonnet-20240229, claude-3-haiku-20240307',
    'Default Model': 'claude-3-sonnet-20240229',
    'Features': 'chat, embeddings',
    'Enabled': true,
    'Sort Order': 2,
  },
  {
    'Name': 'Google Gemini',
    'Provider ID': 'google',
    'Description': 'Google\'s Gemini AI models for multimodal understanding',
    'Icon': 'google',
    'Category': 'llm',
    'Auth Type': 'api_key',
    'Base URL': 'https://generativelanguage.googleapis.com/v1',
    'Documentation URL': 'https://ai.google.dev/docs',
    'Supported Models': 'gemini-pro, gemini-pro-vision',
    'Default Model': 'gemini-pro',
    'Features': 'chat, vision',
    'Enabled': true,
    'Sort Order': 3,
  },
  {
    'Name': 'Custom AI Provider',
    'Provider ID': 'custom',
    'Description': 'Connect to a custom AI service endpoint with your own API key',
    'Icon': 'custom',
    'Category': 'custom',
    'Auth Type': 'custom',
    'Base URL': '',
    'Documentation URL': '',
    'Supported Models': '',
    'Default Model': '',
    'Features': 'chat',
    'Enabled': true,
    'Sort Order': 99,
  },
]

async function createTableWithMetadataAPI() {
  console.log(`\n📋 Creating table "${TABLE_NAME}" using Metadata API...`)

  // First, check if table already exists
  const listTablesUrl = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`
  const listResponse = await fetchFn(listTablesUrl, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
  })

  if (listResponse.ok) {
    const tablesData = await listResponse.json() as { tables?: Array<{ id: string; name: string }> }
    const existingTable = tablesData.tables?.find((t: any) => t.name === TABLE_NAME)

    if (existingTable) {
      console.log(`✅ Table "${TABLE_NAME}" already exists!`)
      console.log(`   Table ID: ${existingTable.id}`)
      return existingTable.id
    }
  }

  // Create the table
  const createTableUrl = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`
  const createTablePayload = {
    name: TABLE_NAME,
    description: 'AI provider configurations for the Integration Marketplace',
    fields: FIELD_DEFINITIONS.map((field) => {
      const fieldDef: any = {
        name: field.name,
        type: field.type,
      }

      // Add description if provided
      if ((field as any).description) {
        fieldDef.description = (field as any).description
      }

      // Add options for singleSelect
      if (field.type === 'singleSelect' && field.options) {
        fieldDef.options = field.options
      }

      // Add options for checkbox (required by API)
      if (field.type === 'checkbox') {
        fieldDef.options = field.options || {
          icon: 'check',
          color: 'greenBright',
        }
      }

      // Add options for number (required by API)
      if (field.type === 'number') {
        fieldDef.options = field.options || {
          precision: 0,
        }
      }

      // Add options for url
      if (field.type === 'url' && field.options) {
        fieldDef.options = field.options
      }

      return fieldDef
    }),
  }

  try {
    const response = await fetchFn(createTableUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createTablePayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.error?.message || errorMessage
      } catch {
        errorMessage = errorText || errorMessage
      }

      if (response.status === 404) {
        throw new Error(`Base not found. Check that BASE_ID (${BASE_ID}) is correct and your API key has access.`)
      }
      
      if (response.status === 403) {
        throw new Error(`Permission denied. Your API key needs 'schema.bases:write' scope to create tables.`)
      }

      throw new Error(errorMessage)
    }

    const result = await response.json() as { id: string; fields?: Array<any> }
    console.log(`✅ Table "${TABLE_NAME}" created successfully!`)
    console.log(`   Table ID: ${result.id}`)
    console.log(`   Fields created: ${result.fields?.length || FIELD_DEFINITIONS.length}`)
    return result.id
  } catch (error: any) {
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log(`⚠️  Table "${TABLE_NAME}" may already exist. Continuing...`)
      return null
    }
    throw error
  }
}

async function addAttachmentsFieldIfMissing(tableId: string): Promise<void> {
  console.log(`\n🔍 Checking if "Attachments" field exists...`)
  
  try {
    // Get table details to check existing fields
    const tableDetailsUrl = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables/${tableId}`
    const tableDetailsResponse = await fetchFn(tableDetailsUrl, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (tableDetailsResponse.ok) {
      const tableDetails = await tableDetailsResponse.json() as { fields?: Array<{ name: string }> }
      const existingFields = tableDetails.fields || []
      const hasAttachmentsField = existingFields.some((f: any) => 
        f.name === 'Attachments' || f.name === 'Attachment'
      )

      if (hasAttachmentsField) {
        console.log(`   ✅ "Attachments" field already exists`)
        return
      }

      // Add the Attachments field
      console.log(`   📝 Adding "Attachments" field...`)
      const addFieldUrl = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables/${tableId}/fields`
      const fieldPayload = {
        name: 'Attachments',
        type: 'multipleAttachments',
        description: 'Provider logos, documentation files, or other attachments',
      }

      const addFieldResponse = await fetchFn(addFieldUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fieldPayload),
      })

      if (addFieldResponse.ok) {
        console.log(`   ✅ "Attachments" field added successfully`)
      } else {
        const errorText = await addFieldResponse.text()
        console.log(`   ⚠️  Could not add "Attachments" field: ${errorText}`)
        console.log(`   📋 Please add it manually in Airtable:`)
        console.log(`      - Field name: "Attachments"`)
        console.log(`      - Field type: "Multiple attachments"`)
      }
    }
  } catch (error: any) {
    console.log(`   ⚠️  Could not check/add "Attachments" field: ${error.message}`)
    console.log(`   📋 Please add it manually in Airtable:`)
    console.log(`      - Field name: "Attachments"`)
    console.log(`      - Field type: "Multiple attachments"`)
  }
}

async function createInitialRecords(tableId: string) {
  console.log(`\n📝 Creating initial records...`)
  
  const Airtable = require('airtable')
  Airtable.configure({ apiKey: API_KEY })
  const base = Airtable.base(BASE_ID)
  const tableName = TABLE_NAME

  const records = []
  for (const recordData of INITIAL_RECORDS) {
    try {
      // Check if record already exists (by Provider ID)
      const existing = await base(tableName)
        .select({
          filterByFormula: `{Provider ID} = "${recordData['Provider ID']}"`,
          maxRecords: 1,
        })
        .firstPage()

      if (existing.length > 0) {
        console.log(`   ⏭️  Skipping "${recordData.Name}" - already exists`)
        continue
      }

      const record = await base(tableName).create(recordData)
      records.push(record)
      console.log(`   ✅ Created "${recordData.Name}" (ID: ${record.id})`)
    } catch (error: any) {
      console.error(`   ❌ Error creating "${recordData.Name}":`, error.message)
    }
  }

  return records
}

async function main() {
  console.log('🚀 Integration Marketplace Table Setup Script\n')
  console.log('='.repeat(60))

  console.log(`\n✅ Environment variables found`)
  console.log(`   Base ID: ${BASE_ID}`)
  console.log(`   Table Name: ${TABLE_NAME}`)

  // Check if table already exists
  console.log(`\n🔍 Checking if table "${TABLE_NAME}" already exists...`)
  
  const Airtable = require('airtable')
  Airtable.configure({ apiKey: API_KEY })
  const base = Airtable.base(BASE_ID)

  let tableExists = false
  try {
    await base(TABLE_NAME).select({ maxRecords: 1 }).firstPage()
    tableExists = true
    console.log(`✅ Table "${TABLE_NAME}" already exists!`)
  } catch (error: any) {
    if (error.error === 'NOT_FOUND' || error.message?.includes('does not exist')) {
      console.log(`⚠️  Table "${TABLE_NAME}" does not exist. Creating it...`)
      tableExists = false
    } else {
      // Might be a different error (permissions, etc.)
      console.log(`⚠️  Could not verify table existence. Attempting to create...`)
      tableExists = false
    }
  }

  // Create table if it doesn't exist
  let tableId: string | null = null
  if (!tableExists) {
    try {
      tableId = await createTableWithMetadataAPI()
      if (tableId) {
        console.log(`\n✅ Table created successfully!`)
      } else {
        // Table might already exist, try to proceed
        console.log(`\n⚠️  Table creation returned null. Assuming table exists.`)
      }
    } catch (error: any) {
      console.error(`\n❌ Error creating table:`, error.message)
      console.error(`\n📋 If table creation failed, you can create it manually:`)
      console.error(`   1. Go to Airtable base: ${BASE_ID}`)
      console.error(`   2. Create table: "${TABLE_NAME}"`)
      console.error(`   3. Add fields as specified in docs/airtable/INTEGRATION_MARKETPLACE_SETUP.md`)
      console.error(`   4. Run this script again to create initial records`)
      process.exit(1)
    }
  } else {
    // Table exists - get its ID to add missing fields
    try {
      const listTablesUrl = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`
      const listResponse = await fetchFn(listTablesUrl, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      })
      if (listResponse.ok) {
        const tablesData = await listResponse.json() as { tables?: Array<{ id: string; name: string }> }
        const existingTable = tablesData.tables?.find((t: any) => t.name === TABLE_NAME)
        if (existingTable) {
          tableId = existingTable.id
        }
      }
    } catch (error) {
      // Ignore errors, will use table name instead
    }
  }

  // Add Attachments field if it doesn't exist
  if (tableId) {
    await addAttachmentsFieldIfMissing(tableId)
  }

  // Create initial records
  const createdRecords = await createInitialRecords(tableId || TABLE_NAME)

  console.log(`\n✅ Setup complete!`)
  console.log(`   Created ${createdRecords.length} new records`)
  console.log(`   Total records: ${INITIAL_RECORDS.length}`)
  console.log(`\n🎉 Integration Marketplace table is ready to use!`)
  console.log(`\n   Next steps:`)
  console.log(`   1. Verify records in Airtable`)
  console.log(`   2. Create views: "Active Integrations" and "All Integrations"`)
  console.log(`   3. Test the Integration Marketplace UI`)
}

// Run the script
main().catch((error) => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})

