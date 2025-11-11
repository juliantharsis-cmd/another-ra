/**
 * Script to create AI Model Registry table in Airtable
 * 
 * Run with: npm run create:ai-model-registry-table
 * or: tsx src/scripts/createAIModelRegistryTable.ts
 */

import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') })

const BASE_ID = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || process.env.AIRTABLE_BASE_ID
const API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY
const TABLE_NAME = 'AI Model Registry'

if (!BASE_ID || !API_KEY) {
  console.error('❌ Error: AIRTABLE_SYSTEM_CONFIG_BASE_ID and AIRTABLE_PERSONAL_ACCESS_TOKEN must be set')
  process.exit(1)
}

const fetchFn = globalThis.fetch || require('node-fetch')

interface FieldDefinition {
  name: string
  type: string
  description?: string
  options?: any
}

const FIELD_DEFINITIONS: FieldDefinition[] = [
  {
    name: 'Provider ID',
    type: 'singleLineText',
    description: 'Provider identifier (google, openai, anthropic, custom)',
  },
  {
    name: 'Model ID',
    type: 'singleLineText',
    description: 'Unique model identifier (e.g., gemini-1.5-flash-latest)',
  },
  {
    name: 'Model Name',
    type: 'singleLineText',
    description: 'Display name for the model',
  },
  {
    name: 'Status',
    type: 'singleSelect',
    options: {
      choices: [
        { name: 'active', color: 'greenLight2' },
        { name: 'deprecated', color: 'redLight2' },
        { name: 'beta', color: 'yellowLight2' },
        { name: 'preview', color: 'blueLight2' },
      ],
    },
    description: 'Model status',
  },
  {
    name: 'Available',
    type: 'checkbox',
    options: {
      icon: 'check',
      color: 'greenBright',
    },
    description: 'Whether model is currently available via API',
  },
  {
    name: 'Last Verified',
    type: 'dateTime',
    options: {
      timeZone: 'utc',
      dateFormat: { name: 'iso' },
      timeFormat: { name: '24hour' },
    },
    description: 'Last time model was verified',
  },
  {
    name: 'Discovery Method',
    type: 'singleSelect',
    options: {
      choices: [
        { name: 'api', color: 'blueLight2' },
        { name: 'manual', color: 'greenLight2' },
        { name: 'fallback', color: 'yellowLight2' },
      ],
    },
    description: 'How the model was discovered',
  },
  {
    name: 'Cost per 1K tokens',
    type: 'number',
    options: {
      precision: 6,
    },
    description: 'Pricing information (optional)',
  },
  {
    name: 'Max Tokens',
    type: 'number',
    options: {
      precision: 0,
    },
    description: 'Maximum context window',
  },
  {
    name: 'Features',
    type: 'multipleSelects',
    options: {
      choices: [
        { name: 'chat', color: 'blueLight2' },
        { name: 'vision', color: 'greenLight2' },
        { name: 'embeddings', color: 'yellowLight2' },
        { name: 'streaming', color: 'purpleLight2' },
        { name: 'function_calling', color: 'orangeLight2' },
      ],
    },
    description: 'Supported features',
  },
  {
    name: 'Regions',
    type: 'multipleSelects',
    options: {
      choices: [
        { name: 'us', color: 'blueLight2' },
        { name: 'eu', color: 'greenLight2' },
        { name: 'global', color: 'grayLight2' },
      ],
    },
    description: 'Available regions',
  },
  {
    name: 'Deprecation Date',
    type: 'date',
    options: {
      dateFormat: { name: 'iso' },
    },
    description: 'When model will be deprecated',
  },
  {
    name: 'Recommended',
    type: 'checkbox',
    options: {
      icon: 'star',
      color: 'yellowBright',
    },
    description: 'Recommended model for provider',
  },
  {
    name: 'Sort Order',
    type: 'number',
    options: {
      precision: 0,
    },
    description: 'Display order (lower = first)',
  },
  {
    name: 'Metadata',
    type: 'multilineText',
    description: 'JSON string with additional provider-specific data',
  },
]

async function createTableWithMetadataAPI(): Promise<string> {
  console.log(`\n📋 Creating table "${TABLE_NAME}" using Airtable Metadata API...`)

  const url = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`
  const payload = {
    name: TABLE_NAME,
    description: 'Centralized registry for AI model availability and metadata',
    fields: FIELD_DEFINITIONS.map(field => {
      const fieldDef: any = {
        name: field.name,
        type: field.type,
      }
      
      // Handle field-specific options requirements
      if (field.type === 'checkbox') {
        // Checkbox fields require icon and color
        fieldDef.options = field.options || {
          icon: 'check',
          color: 'greenBright',
        }
      } else if (field.type === 'date') {
        // Date fields require dateFormat
        fieldDef.options = field.options || {
          dateFormat: { name: 'iso' },
        }
      } else if (field.type === 'dateTime') {
        // DateTime fields require dateFormat and timeFormat
        fieldDef.options = field.options || {
          timeZone: 'utc',
          dateFormat: { name: 'iso' },
          timeFormat: { name: '24hour' },
        }
      } else if (field.type === 'number') {
        // Number fields require precision
        fieldDef.options = field.options || {
          precision: 0,
        }
      } else if (field.options) {
        // For other field types, use provided options
        fieldDef.options = field.options
      }
      
      if (field.description) {
        fieldDef.description = field.description
      }
      
      return fieldDef
    }),
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
      throw new Error(`Failed to create table: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json() as { id: string; name: string }
    console.log(`   ✅ Table created successfully! ID: ${result.id}`)
    return result.id
  } catch (error: any) {
    console.error(`   ❌ Error creating table: ${error.message}`)
    throw error
  }
}

async function checkTableExists(): Promise<boolean> {
  try {
    const url = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`
    const response = await fetchFn(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json() as { tables?: Array<{ name: string }> }
      const tables = data.tables || []
      return tables.some((t: any) => t.name === TABLE_NAME)
    }
    return false
  } catch (error) {
    console.warn('   ⚠️  Could not check if table exists:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Creating AI Model Registry table in Airtable...')
  console.log(`   Base ID: ${BASE_ID}`)
  console.log(`   Table Name: ${TABLE_NAME}`)

  const tableExists = await checkTableExists()

  if (tableExists) {
    console.log(`\n✅ Table "${TABLE_NAME}" already exists!`)
    console.log('   You can now use it in your application.')
    return
  }

  try {
    await createTableWithMetadataAPI()
    console.log(`\n✅ Successfully created "${TABLE_NAME}" table!`)
    console.log('\n📝 Next steps:')
    console.log('   1. The table is ready to use')
    console.log('   2. Models will be automatically discovered and added')
    console.log('   3. You can manually add/edit models in Airtable')
    console.log('   4. Mark models as "Recommended" to set defaults')
  } catch (error: any) {
    console.error(`\n❌ Failed to create table: ${error.message}`)
    console.log('\n📋 Manual creation steps:')
    console.log(`   1. Go to your Airtable base (ID: ${BASE_ID})`)
    console.log(`   2. Create a new table named "${TABLE_NAME}"`)
    console.log('   3. Add the following fields:')
    FIELD_DEFINITIONS.forEach(field => {
      console.log(`      - ${field.name} (${field.type})`)
    })
    process.exit(1)
  }
}

main().catch(console.error)

