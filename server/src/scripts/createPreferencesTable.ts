/**
 * Create User Preferences Table in Airtable
 * 
 * Uses Airtable Metadata API to create the table programmatically
 * 
 * Run with: npm run create:preferences-table
 */

// Load environment variables
import dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(__dirname, '../../.env') })
dotenv.config() // Also try default location

// Use the same pattern as create_table_configuration_table.ts
const API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY
const BASE_ID = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 'appGtLbKhmNkkTLVL' // System configuration base
const TABLE_NAME = 'User Preferences'

if (!API_KEY) {
  console.error('❌ AIRTABLE_PERSONAL_ACCESS_TOKEN or AIRTABLE_API_KEY is required')
  console.error('   Please set it in your server/.env file')
  process.exit(1)
}

// BASE_ID has a default fallback, but log if using default
if (!process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID) {
  console.log('⚠️  Using default BASE_ID (appGtLbKhmNkkTLVL)')
  console.log('   Set AIRTABLE_SYSTEM_CONFIG_BASE_ID in .env to use a different base\n')
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

const FIELD_DEFINITIONS = [
  {
    name: 'User Id',
    type: 'singleLineText',
    description: 'User identifier',
  },
  {
    name: 'Namespace',
    type: 'singleSelect',
    options: {
      choices: [
        { name: 'ui', color: 'blueLight2' },
        { name: 'table', color: 'greenLight2' },
        { name: 'filters', color: 'yellowLight2' },
        { name: 'featureFlags', color: 'orangeLight2' },
        { name: 'misc', color: 'grayLight2' },
      ],
    },
    description: 'Preference namespace category',
  },
  {
    name: 'Key',
    type: 'singleLineText',
    description: 'Preference key (e.g., "columnWidths", "defaultSort")',
  },
  {
    name: 'Table Id',
    type: 'singleLineText',
    description: 'Table-specific preference (e.g., "companies")',
  },
  {
    name: 'Scope Id',
    type: 'singleLineText',
    description: 'Scope-specific preference (e.g., view ID)',
  },
  {
    name: 'Type',
    type: 'singleSelect',
    options: {
      choices: [
        { name: 'string', color: 'blueLight2' },
        { name: 'number', color: 'greenLight2' },
        { name: 'boolean', color: 'yellowLight2' },
        { name: 'json', color: 'orangeLight2' },
      ],
    },
    description: 'Value type',
  },
  {
    name: 'Value (text)',
    type: 'multilineText',
    description: 'String or JSON values',
  },
  {
    name: 'Value (number)',
    type: 'number',
    options: {
      precision: 3,
    },
    description: 'Numeric values',
  },
  {
    name: 'Value (boolean)',
    type: 'checkbox',
    options: {
      icon: 'check',
      color: 'greenBright',
    },
    description: 'Boolean values',
  },
  {
    name: 'Visibility',
    type: 'singleSelect',
    options: {
      choices: [
        { name: 'private', color: 'grayLight2' },
        { name: 'org', color: 'blueLight2' },
        { name: 'global', color: 'greenLight2' },
      ],
    },
    description: 'Preference visibility level',
  },
  {
    name: 'Expires At',
    type: 'dateTime',
    options: {
      timeZone: 'utc',
      dateFormat: { name: 'iso' },
      timeFormat: { name: '24hour' },
    },
    description: 'Expiration timestamp',
  },
      {
        name: 'Unique Key',
        type: 'singleLineText', // Will be converted to formula after creation
        description: 'Unique key for idempotency (will be formula field)',
      },
      // Note: Created At and Last Modified are auto-added by Airtable
      // We'll add them manually or they'll be available automatically
      {
        name: 'Checksum',
        type: 'singleLineText', // Will be converted to formula after creation
        description: 'Checksum for change detection (will be formula field)',
      },
]

async function createPreferencesTable() {
  try {
    console.log('🚀 Creating "User Preferences" table in Airtable...')
    console.log(`   Base ID: ${BASE_ID}`)
    console.log(`   Table Name: ${TABLE_NAME}`)
    console.log('')

    // Step 1: Check if table already exists
    console.log('📋 Step 1: Checking if table exists...')
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

    const tablesData = await listResponse.json()
    const existingTable = tablesData.tables?.find((t: any) => t.name === TABLE_NAME)

    if (existingTable) {
      console.log(`✅ Table "${TABLE_NAME}" already exists!`)
      console.log(`   Table ID: ${existingTable.id}`)
      console.log(`   Fields: ${existingTable.fields?.length || 0}`)
      console.log('')
      console.log('   Skipping creation.')
      console.log('   If you want to recreate it, delete the table in Airtable UI first.')
      return
    }

    console.log(`   Table "${TABLE_NAME}" not found. Creating...`)
    console.log('')

    // Step 2: Create the table
    console.log('📋 Step 2: Creating table with fields...')
    const createTableUrl = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`
    const createTablePayload = {
      name: TABLE_NAME,
      description: 'User preferences storage with namespace, scoping, and TTL support',
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

        // Add options for checkbox
        if (field.type === 'checkbox' && field.options) {
          fieldDef.options = field.options
        }

        // Add options for number
        if (field.type === 'number' && field.options) {
          fieldDef.options = field.options
        }

        // Add options for dateTime
        if (field.type === 'dateTime' && field.options) {
          fieldDef.options = field.options
        }

        // Add options for formula
        if (field.type === 'formula' && field.options) {
          fieldDef.options = field.options
        }

        return fieldDef
      }),
    }

    const createResponse = await fetchFn(createTableUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createTablePayload),
    })

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      let errorMessage = `Failed to create table: ${createResponse.status} ${errorText}`

      // Check if it's a permissions issue
      if (createResponse.status === 401 || createResponse.status === 403) {
        errorMessage += '\n\n⚠️  Note: Creating tables via Metadata API requires specific permissions.'
        errorMessage += '\n   Your Personal Access Token may need the "schema.bases:write" scope.'
        errorMessage += '\n   Check your token permissions in Airtable account settings.'
        errorMessage += '\n   Alternatively, you can create the table manually in Airtable UI using the script in scripts/create-preferences-table.js'
      } else if (createResponse.status === 404) {
        errorMessage += '\n\n⚠️  Base not found. Check your AIRTABLE_SYSTEM_CONFIG_BASE_ID.'
      }

      throw new Error(errorMessage)
    }

    const createdTable = await createResponse.json()
    console.log(`✅ Table "${TABLE_NAME}" created successfully!`)
    console.log(`   Table ID: ${createdTable.id}`)
    console.log(`   Fields created: ${createdTable.fields?.length || FIELD_DEFINITIONS.length}`)
    console.log('')

    // Step 3: Try to convert formula fields (if API supports field updates)
    console.log('📋 Step 3: Converting formula fields...')
    try {
      const tableId = createdTable.id
      const tableDetailsUrl = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables/${tableId}`
      
      // Get table details to find field IDs
      const tableDetailsResponse = await fetchFn(tableDetailsUrl, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      })

      if (tableDetailsResponse.ok) {
        const tableDetails = await tableDetailsResponse.json()
        const fields = tableDetails.fields || []

        // Find Unique Key and Checksum fields
        const uniqueKeyField = fields.find((f: any) => f.name === 'Unique Key')
        const checksumField = fields.find((f: any) => f.name === 'Checksum')

        // Try to update Unique Key to formula
        if (uniqueKeyField) {
          try {
            const updateFieldUrl = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables/${tableId}/fields/${uniqueKeyField.id}`
            const updateResponse = await fetchFn(updateFieldUrl, {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'formula',
                options: {
                  formula: "CONCATENATE({User Id}, '::', {Namespace}, '::', IF({Table Id}, {Table Id}, ''), '::', IF({Scope Id}, {Scope Id}, ''), '::', {Key})",
                },
              }),
            })

            if (updateResponse.ok) {
              console.log('   ✅ "Unique Key" converted to formula field')
            } else {
              console.log('   ⚠️  Could not convert "Unique Key" to formula (API limitation)')
            }
          } catch (e) {
            console.log('   ⚠️  Could not convert "Unique Key" to formula')
          }
        }

        // Try to update Checksum to formula
        if (checksumField) {
          try {
            const updateFieldUrl = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables/${tableId}/fields/${checksumField.id}`
            const updateResponse = await fetchFn(updateFieldUrl, {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'formula',
                options: {
                  formula: "SHA256(CONCATENATE({Type}, '::', IF({Value (text)}, {Value (text)}, ''), '::', IF({Value (number)}, {Value (number)}, ''), '::', IF({Value (boolean)}, 'true', 'false')))",
                },
              }),
            })

            if (updateResponse.ok) {
              console.log('   ✅ "Checksum" converted to formula field')
            } else {
              console.log('   ⚠️  Could not convert "Checksum" to formula (API limitation)')
            }
          } catch (e) {
            console.log('   ⚠️  Could not convert "Checksum" to formula')
          }
        }
      }
    } catch (error) {
      console.log('   ⚠️  Could not update formula fields via API')
    }

    console.log('')

    // Step 4: Verify and provide next steps
    console.log('📋 Step 4: Verification and next steps...')
    console.log('')
    console.log('⚠️  Manual steps required in Airtable UI:')
    console.log('   1. Add "Created At" field (type: Created time) - Airtable may add this automatically')
    console.log('   2. Add "Last Modified" field (type: Last modified time) - Airtable may add this automatically')
    console.log('   3. Convert "Unique Key" to formula field:')
    console.log('      Formula: CONCATENATE({User Id}, \'::\', {Namespace}, \'::\', IF({Table Id}, {Table Id}, \'\'), \'::\', IF({Scope Id}, {Scope Id}, \'\'), \'::\', {Key})')
    console.log('   4. Convert "Checksum" to formula field (optional):')
    console.log('      Formula: SHA256(CONCATENATE({Type}, \'::\', IF({Value (text)}, {Value (text)}, \'\'), \'::\', IF({Value (number)}, {Value (number)}, \'\'), \'::\', IF({Value (boolean)}, \'true\', \'false\')))')
    console.log('   5. Set "User Id" field as required')
    console.log('   6. Set "Key" field as required')
    console.log('   7. Set "Visibility" default value to "private"')
    console.log('')
    console.log('✅ Setup complete!')
    console.log('')
    console.log('📝 Next steps:')
    console.log('   1. Complete manual steps above in Airtable UI')
    console.log('   2. Run: npm run test:preferences')
    console.log('   3. Start using the preferences system!')
    console.log('')

  } catch (error) {
    console.error('❌ Error creating table:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
      
      // Provide helpful error messages
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        console.error('\n   💡 Check your AIRTABLE_PERSONAL_ACCESS_TOKEN')
        console.error('   💡 Ensure token has "schema.bases:write" scope')
      } else if (error.message.includes('404') || error.message.includes('Not found')) {
        console.error('\n   💡 Check your AIRTABLE_SYSTEM_CONFIG_BASE_ID')
      } else if (error.message.includes('INVALID_REQUEST')) {
        console.error('\n   💡 The Metadata API might not be available for your base')
        console.error('   💡 Try creating the table manually using the script in scripts/create-preferences-table.js')
      }
    }
    process.exit(1)
  }
}

// Run the script
createPreferencesTable()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })
