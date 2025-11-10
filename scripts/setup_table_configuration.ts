/**
 * Script to verify and help set up the "Table Configuration" table in Airtable
 * 
 * This script verifies the table structure and provides setup instructions.
 * Run with: npx tsx scripts/setup_table_configuration.ts
 */

import Airtable from 'airtable'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../server/.env') })
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const apiKey = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY
const baseId = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 'appGtLbKhmNkkTLVL'

if (!apiKey) {
  console.error('❌ Error: AIRTABLE_PERSONAL_ACCESS_TOKEN or AIRTABLE_API_KEY not found in environment variables')
  console.error('   Please set it in server/.env file')
  process.exit(1)
}

Airtable.configure({ apiKey })
const base = Airtable.base(baseId)

const TABLE_NAME = 'Table Configuration'

// Required field definitions
const REQUIRED_FIELDS = [
  { name: 'Table Name', type: 'singleLineText' },
  { name: 'Field Name (Original)', type: 'singleLineText' },
  { name: 'Field Name (Custom)', type: 'singleLineText' },
  { name: 'Field Type', type: 'singleSelect' },
  { name: 'Format Preferences', type: 'multilineText' },
  { name: 'Is Active', type: 'checkbox' },
  { name: 'Description', type: 'multilineText' },
  { name: 'Default Value', type: 'singleLineText' },
]

const FIELD_TYPE_OPTIONS = [
  'Single line text',
  'Long text',
  'Attachment',
  'Checkbox',
  'Multiple select',
  'Single select',
  'User',
  'Date',
  'Phone number',
  'Email',
  'URL',
  'Number',
  'Currency',
  'Percent',
  'Duration',
  'Rating',
  'Formula',
  'Multiple record links',
  'Single record link',
  'Created time',
  'Last modified time',
  'Created by',
  'Last modified by',
]

async function verifyTableConfiguration() {
  try {
    console.log('🔍 Verifying Table Configuration setup...')
    console.log(`📊 Base ID: ${baseId}`)
    console.log('')

    // Try to access the table
    let tableExists = false
    let existingFields: string[] = []

    try {
      const table = base(TABLE_NAME)
      const records = await table.select({ maxRecords: 1 }).all()
      tableExists = true
      
      if (records.length > 0) {
        existingFields = Object.keys(records[0].fields)
      } else {
        // Table exists but is empty - get fields from metadata if possible
        console.log('✅ Table exists but is empty')
      }
      
      console.log(`✅ Table "${TABLE_NAME}" exists!`)
      console.log('')
      
      // Check for required fields
      const missingFields = REQUIRED_FIELDS.filter(
        field => !existingFields.includes(field.name)
      )
      
      if (missingFields.length > 0) {
        console.log('⚠️  Missing required fields:')
        missingFields.forEach(field => {
          console.log(`   - ${field.name} (${field.type})`)
        })
        console.log('')
        console.log('Please add these fields in Airtable.')
      } else {
        console.log('✅ All required fields are present!')
        console.log('')
        console.log('📋 Current fields:')
        REQUIRED_FIELDS.forEach(field => {
          const exists = existingFields.includes(field.name)
          console.log(`   ${exists ? '✅' : '❌'} ${field.name} (${field.type})`)
        })
      }
      
    } catch (error: any) {
      if (error.error === 'NOT_FOUND' || error.statusCode === 404) {
        tableExists = false
      } else {
        throw error
      }
    }

    if (!tableExists) {
      console.log(`❌ Table "${TABLE_NAME}" does not exist yet.`)
      console.log('')
      console.log('📝 Setup Instructions:')
      console.log('')
      console.log(`1. Go to your Airtable base: https://airtable.com/${baseId}`)
      console.log(`2. Create a new table named "${TABLE_NAME}"`)
      console.log('3. Add the following fields:')
      console.log('')
      
      REQUIRED_FIELDS.forEach((field, index) => {
        console.log(`   ${index + 1}. ${field.name}`)
        console.log(`      Type: ${field.type}`)
        if (field.name === 'Field Type') {
          console.log(`      Options: ${FIELD_TYPE_OPTIONS.join(', ')}`)
          console.log('      Note: Create as Single select with all the options above')
        }
        console.log('')
      })
      
      console.log('4. After creating the table, run this script again to verify.')
      console.log('')
      console.log('💡 Tip: You can copy the field names from the list above.')
    } else {
      console.log('')
      console.log('🎉 Table Configuration table is ready to use!')
      console.log('')
      console.log('Next steps:')
      console.log('1. Open "Configure Table" in Another Resource Advisor')
      console.log('2. The system will automatically create configuration records')
      console.log('3. Customize field names and types as needed')
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    if (error.error) {
      console.error('   Details:', JSON.stringify(error.error, null, 2))
    }
    if (error.statusCode) {
      console.error(`   Status Code: ${error.statusCode}`)
    }
    process.exit(1)
  }
}

// Run the script
verifyTableConfiguration()
  .then(() => {
    console.log('')
    console.log('✅ Verification completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })

