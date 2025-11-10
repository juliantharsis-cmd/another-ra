/**
 * Update User Preferences Table Schema
 * 
 * Adds all UserPreferences fields as columns to the existing "User Preferences" table
 * This creates a 1:1 mapping between the Another RA UI and Airtable table
 * 
 * Run with: npm run update:user-preferences-schema
 */

// Load environment variables
import dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(__dirname, '../../.env') })
dotenv.config() // Also try default location

const API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY
const BASE_ID = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 'appGtLbKhmNkkTLVL' // System configuration base
const TABLE_NAME = 'User Preferences'

if (!API_KEY) {
  console.error('❌ AIRTABLE_PERSONAL_ACCESS_TOKEN or AIRTABLE_API_KEY is required')
  console.error('   Please set it in your server/.env file')
  process.exit(1)
}

// Use native fetch (Node 18+) or try to import node-fetch
async function getFetchFn(): Promise<typeof fetch> {
  if (typeof globalThis.fetch !== 'undefined') {
    return globalThis.fetch
  }
  try {
    const { default: fetch } = await import('node-fetch')
    return fetch as any
  } catch {
    throw new Error('fetch is not available. Use Node.js 18+ or install node-fetch')
  }
}

/**
 * Field definitions for UserPreferences fields
 * Each field in the Another RA user preferences page maps to a column here
 */
const USER_PREFERENCES_FIELDS = [
  {
    name: 'User Id',
    type: 'singleLineText',
    description: 'Unique user identifier (required)',
    options: {
      // This will be set as required manually in Airtable UI
    },
  },
  {
    name: 'Language',
    type: 'singleSelect',
    description: 'ISO 639-1 language code (e.g., en, fr, de)',
    options: {
      choices: [
        { name: 'en', color: 'blueLight2' },
        { name: 'fr', color: 'blueLight2' },
        { name: 'de', color: 'blueLight2' },
        { name: 'es', color: 'blueLight2' },
        { name: 'it', color: 'blueLight2' },
        { name: 'pt', color: 'blueLight2' },
        { name: 'zh', color: 'blueLight2' },
        { name: 'ja', color: 'blueLight2' },
      ],
    },
  },
  {
    name: 'Date Format',
    type: 'singleSelect',
    description: 'Preferred date format',
    options: {
      choices: [
        { name: 'DD/MM/YYYY', color: 'greenLight2' },
        { name: 'MM/DD/YYYY', color: 'greenLight2' },
        { name: 'YYYY-MM-DD', color: 'greenLight2' },
      ],
    },
  },
  {
    name: 'Time Format',
    type: 'singleSelect',
    description: 'Preferred time format',
    options: {
      choices: [
        { name: '12h', color: 'orangeLight2' },
        { name: '24h', color: 'orangeLight2' },
      ],
    },
  },
  {
    name: 'Time Zone',
    type: 'singleLineText',
    description: 'IANA timezone (e.g., America/New_York, Europe/Paris)',
  },
  {
    name: 'Theme',
    type: 'singleSelect',
    description: 'UI theme preference',
    options: {
      choices: [
        { name: 'light', color: 'yellowLight2' },
        { name: 'dark', color: 'grayLight2' },
        { name: 'system', color: 'blueLight2' },
      ],
    },
  },
  {
    name: 'Use Schneider Colors',
    type: 'checkbox',
    description: 'Use Schneider Electric color palette',
    options: {
      icon: 'check',
      color: 'greenBright',
    },
  },
  {
    name: 'Email Notifications',
    type: 'checkbox',
    description: 'Enable email notifications',
    options: {
      icon: 'check',
      color: 'blueBright',
    },
  },
  {
    name: 'In App Alerts',
    type: 'checkbox',
    description: 'Enable in-app alerts',
    options: {
      icon: 'check',
      color: 'orangeBright',
    },
  },
  {
    name: 'Default Page Size',
    type: 'number',
    description: 'Default rows per page (10, 25, 50, 100)',
    options: {
      precision: 0,
    },
  },
  {
    name: 'Default Sort Field',
    type: 'singleLineText',
    description: 'Default field to sort by (optional)',
  },
  {
    name: 'Default Sort Order',
    type: 'singleSelect',
    description: 'Default sort order',
    options: {
      choices: [
        { name: 'asc', color: 'greenLight2' },
        { name: 'desc', color: 'redLight2' },
      ],
    },
  },
]

async function updateUserPreferencesTableSchema() {
  try {
    const fetchFn = await getFetchFn()
    
    console.log('🚀 Updating "User Preferences" table schema in Airtable...')
    console.log(`   Base ID: ${BASE_ID}`)
    console.log(`   Table Name: ${TABLE_NAME}\n`)

    // Step 1: Get table ID and schema
    console.log('📋 Step 1: Finding table and getting schema...')
    const listTablesUrl = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`
    const listResponse = await fetchFn(listTablesUrl, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!listResponse.ok) {
      const errorText = await listResponse.text()
      throw new Error(`Failed to list tables: ${listResponse.status} ${errorText}`)
    }

    const tablesData = await listResponse.json() as { tables: Array<{ id: string; name: string; fields?: Array<{ name: string }> }> }
    const table = tablesData.tables.find(t => t.name === TABLE_NAME)

    if (!table) {
      throw new Error(`Table "${TABLE_NAME}" not found. Run npm run create:preferences-table first.`)
    }

    console.log(`   ✅ Found table: ${TABLE_NAME} (ID: ${table.id})\n`)

    // Step 2: Get existing fields
    console.log('📋 Step 2: Checking existing fields...')
    const existingFieldNames = new Set<string>()
    
    // Get fields from the table in the response
    if (table.fields) {
      table.fields.forEach(f => existingFieldNames.add(f.name))
      console.log(`   Found ${table.fields.length} existing field(s)`)
    } else {
      console.log('   ⚠️  Could not determine existing fields, will check before adding')
    }
    console.log('')

    // Step 3: Add missing fields
    console.log('📋 Step 3: Adding missing fields...')
    const fieldsToAdd = USER_PREFERENCES_FIELDS.filter(field => !existingFieldNames.has(field.name))

    if (fieldsToAdd.length === 0) {
      console.log('   ✅ All fields already exist. No changes needed.\n')
    } else {
      console.log(`   Adding ${fieldsToAdd.length} new field(s)...`)

      // Add fields in batches (Airtable allows multiple fields per request)
      const addFieldsUrl = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables/${table.id}/fields`
      
      for (const field of fieldsToAdd) {
        try {
          const fieldPayload: any = {
            name: field.name,
            type: field.type,
            description: field.description,
          }

          // Add options if present
          if (field.options) {
            fieldPayload.options = field.options
          }

          const addResponse = await fetchFn(addFieldsUrl, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(fieldPayload),
          })

          if (addResponse.ok) {
            console.log(`   ✅ Added field: ${field.name}`)
          } else {
            const errorText = await addResponse.text()
            console.log(`   ⚠️  Failed to add field "${field.name}": ${errorText}`)
          }
        } catch (error) {
          console.log(`   ⚠️  Error adding field "${field.name}":`, error instanceof Error ? error.message : error)
        }
      }
      console.log('')
    }

    // Step 4: Summary
    console.log('📋 Step 4: Summary...')
    console.log('')
    console.log('✅ Schema update complete!')
    console.log('')
    console.log('📝 Next steps:')
    console.log('   1. In Airtable UI, set "User Id" as required field')
    console.log('   2. Set default values if needed (e.g., Default Page Size = 25)')
    console.log('   3. Test the user preferences page in Another RA')
    console.log('')

  } catch (error) {
    console.error('❌ Error updating table schema:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
    }
    process.exit(1)
  }
}

// Run the script
updateUserPreferencesTableSchema()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })

