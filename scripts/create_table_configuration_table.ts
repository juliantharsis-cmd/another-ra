/**
 * Script to create the "Table Configuration" table in Airtable
 * This script uses the Airtable Metadata API to create the table structure
 */

// Load environment variables from server/.env if available
const path = require('path')
const fs = require('fs')

// Try to load dotenv
let dotenv: any = null
try {
  dotenv = require('dotenv')
} catch (e) {
  // dotenv not available
}

// Load .env file from server directory
const envPath = path.resolve(__dirname, '../server/.env')
if (fs.existsSync(envPath) && dotenv) {
  dotenv.config({ path: envPath })
  console.log(`✅ Loaded environment from: ${envPath}`)
} else if (fs.existsSync(envPath)) {
  // Manual parsing if dotenv not available
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach((line: string) => {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      process.env[key] = value
    }
  })
  console.log(`✅ Loaded environment from: ${envPath} (manual parsing)`)
}

const API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY
const BASE_ID = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 'appGtLbKhmNkkTLVL'

if (!API_KEY) {
  console.error('❌ AIRTABLE_PERSONAL_ACCESS_TOKEN not found in environment variables!')
  process.exit(1)
}

const TABLE_NAME = 'Table Configuration'

// Field definitions for the Table Configuration table
const FIELD_DEFINITIONS = [
  {
    name: 'Table Name',
    type: 'singleLineText',
    description: 'Name of the table being configured (e.g., "Companies", "Geography", "EF GWP")',
  },
  {
    name: 'Field Name (Original)',
    type: 'singleLineText',
    description: 'Original field name from Airtable schema',
  },
  {
    name: 'Field Name (Custom)',
    type: 'singleLineText',
    description: 'Custom field name for Another Resource Advisor',
  },
  {
    name: 'Field Type',
    type: 'singleSelect',
    options: {
      choices: [
        { name: 'Single line text' },
        { name: 'Long text' },
        { name: 'Attachment' },
        { name: 'Checkbox' },
        { name: 'Multiple select' },
        { name: 'Single select' },
        { name: 'User' },
        { name: 'Date' },
        { name: 'Phone number' },
        { name: 'Email' },
        { name: 'URL' },
        { name: 'Number' },
        { name: 'Currency' },
        { name: 'Percent' },
        { name: 'Duration' },
        { name: 'Rating' },
        { name: 'Formula' },
        { name: 'Multiple record links' },
        { name: 'Single record link' },
        { name: 'Created time' },
        { name: 'Last modified time' },
        { name: 'Created by' },
        { name: 'Last modified by' },
      ],
    },
    description: 'Field type for Another Resource Advisor',
  },
  {
    name: 'Format Preferences',
    type: 'multilineText',
    description: 'JSON string containing format options (e.g., {"precision": 2, "symbol": "$"})',
  },
  {
    name: 'Is Active',
    type: 'checkbox',
    description: 'Whether this field is active/enabled (default: checked)',
  },
  {
    name: 'Description',
    type: 'multilineText',
    description: 'Optional field description',
  },
  {
    name: 'Default Value',
    type: 'singleLineText',
    description: 'Default value for the field',
  },
]

async function createTableConfiguration() {
  try {
    console.log('🚀 Creating "Table Configuration" table in Airtable...')
    console.log(`   Base ID: ${BASE_ID}`)
    console.log(`   Table Name: ${TABLE_NAME}`)
    console.log('')

    // Step 1: Check if table already exists
    console.log('📋 Step 1: Checking if table exists...')
    const listTablesUrl = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`
    const listResponse = await fetch(listTablesUrl, {
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
      console.log(`✅ Table "${TABLE_NAME}" already exists (ID: ${existingTable.id})`)
      console.log('   Checking fields...')

      // Check existing fields
      const tableDetailsUrl = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables/${existingTable.id}`
      const tableDetailsResponse = await fetch(tableDetailsUrl, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      })

      if (tableDetailsResponse.ok) {
        const tableDetails = await tableDetailsResponse.json()
        const existingFieldNames = tableDetails.fields?.map((f: any) => f.name) || []
        const requiredFieldNames = FIELD_DEFINITIONS.map((f) => f.name)

        const missingFields = requiredFieldNames.filter(
          (name) => !existingFieldNames.includes(name)
        )

        if (missingFields.length > 0) {
          console.log(`⚠️  Missing fields: ${missingFields.join(', ')}`)
          console.log('   Note: You may need to add these fields manually in Airtable UI')
          console.log('   The Metadata API has limitations on creating fields in existing tables.')
        } else {
          console.log('✅ All required fields are present!')
        }
      }

      console.log('')
      console.log('📝 Table Configuration table is ready to use!')
      return
    }

    // Step 2: Create the table
    console.log('📋 Step 2: Creating table...')
    const createTableUrl = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`
    const createTablePayload = {
      name: TABLE_NAME,
      description: 'Configuration layer for customizing table field names and types in Another Resource Advisor',
      fields: FIELD_DEFINITIONS.map((field) => {
        const fieldDef: any = {
          name: field.name,
          type: field.type,
        }

        // Add description if provided
        if (field.description) {
          fieldDef.description = field.description
        }

        // Add options for singleSelect
        if (field.type === 'singleSelect' && (field as any).options) {
          fieldDef.options = (field as any).options
        }

        // Checkbox fields need icon and color in options
        if (field.type === 'checkbox') {
          fieldDef.options = {
            icon: 'check',
            color: 'greenBright',
          }
        }

        return fieldDef
      }),
    }

    const createResponse = await fetch(createTableUrl, {
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
        errorMessage += '\n   Alternatively, you can create the table manually in Airtable UI.'
      }

      throw new Error(errorMessage)
    }

    const createdTable = await createResponse.json()
    console.log(`✅ Table "${TABLE_NAME}" created successfully!`)
    console.log(`   Table ID: ${createdTable.id}`)
    console.log('')
    console.log('📝 Table Configuration table is ready to use!')
    console.log('')
    console.log('Next steps:')
    console.log('1. Verify the table structure in Airtable UI')
    console.log('2. Test the configuration feature in Another Resource Advisor')
    console.log('3. Configure your first table (e.g., Companies)')
  } catch (error) {
    console.error('❌ Error creating table:', error)
    console.error('')
    console.error('💡 Alternative: Create the table manually in Airtable UI')
    console.error('   Follow the instructions in docs/TABLE_CONFIGURATION_SETUP.md')
    process.exit(1)
  }
}

// Run the script
createTableConfiguration()
  .then(() => {
    console.log('')
    console.log('✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
