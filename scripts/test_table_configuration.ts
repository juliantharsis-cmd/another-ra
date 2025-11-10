/**
 * Test script to verify Table Configuration table structure and field names
 */

const path = require('path')
const fs = require('fs')

// Load environment variables
const envPath = path.resolve(__dirname, '../server/.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach((line: string) => {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      process.env[key] = value
    }
  })
}

const API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY
const BASE_ID = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 'appGtLbKhmNkkTLVL'
const TABLE_NAME = 'Table Configuration'

async function testTableStructure() {
  try {
    console.log('🔍 Testing Table Configuration table structure...')
    console.log(`   Base ID: ${BASE_ID}`)
    console.log(`   Table Name: ${TABLE_NAME}`)
    console.log('')

    // Fetch table schema from Metadata API
    const tableListUrl = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`
    const listResponse = await fetch(tableListUrl, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!listResponse.ok) {
      throw new Error(`Failed to list tables: ${listResponse.status}`)
    }

    const tablesData = await listResponse.json()
    const configTable = tablesData.tables?.find((t: any) => t.name === TABLE_NAME)

    if (!configTable) {
      console.log('❌ Table not found')
      return
    }

    console.log(`✅ Table found: ${configTable.name} (ID: ${configTable.id})`)
    console.log('')
    console.log('📋 Fields in the table:')
    console.log('')

    configTable.fields.forEach((field: any) => {
      console.log(`  - ${field.name}`)
      console.log(`    Type: ${field.type}`)
      if (field.options) {
        console.log(`    Options: ${JSON.stringify(field.options)}`)
      }
      console.log('')
    })

    // Try to read a sample record to see field names
    console.log('📝 Testing record creation with sample data...')
    const sampleRecord = {
      'Table Name': 'Test Table',
      'Field Name (Original)': 'Test Original',
      'Field Name (Custom)': 'Test Custom',
      'Field Type': 'Single line text',
      'Format Preferences': '{}',
      'Is Active': true,
      'Description': '',
      'Default Value': '',
    }

    console.log('Sample record structure:')
    console.log(JSON.stringify(sampleRecord, null, 2))

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
  }
}

testTableStructure()
  .then(() => {
    console.log('')
    console.log('✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

