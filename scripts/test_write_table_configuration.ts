/**
 * Test script to write test data to Table Configuration table in Airtable
 */

const path = require('path')
const fs = require('fs')
const Airtable = require('airtable')

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

if (!API_KEY) {
  console.error('❌ Error: AIRTABLE_PERSONAL_ACCESS_TOKEN not found in .env file')
  process.exit(1)
}

Airtable.configure({ apiKey: API_KEY })
const base = Airtable.base(BASE_ID)

async function writeTestData() {
  try {
    console.log('🧪 Testing write to Table Configuration table...')
    console.log(`   Base ID: ${BASE_ID}`)
    console.log(`   Table Name: ${TABLE_NAME}`)
    console.log('')

    // Test record data
    const testRecord = {
      'Table Name': 'Test Table',
      'Field Name (Original)': 'Test Original Field',
      'Field Name (Custom)': 'Test Custom Field',
      'Field Type': 'Single line text',
      'Is Active': true,
      'Description': 'This is a test record created by the test script',
      'Default Value': 'test default',
    }

    console.log('📝 Test record to create:')
    console.log(JSON.stringify(testRecord, null, 2))
    console.log('')

    // Create the record (Airtable requires fields to be wrapped)
    console.log('⏳ Creating record in Airtable...')
    const records = await base(TABLE_NAME).create([
      {
        fields: testRecord
      }
    ])
    
    console.log('✅ Successfully created test record!')
    console.log('')
    console.log('📋 Created record details:')
    console.log(`   Record ID: ${records[0].id}`)
    console.log(`   Fields:`, JSON.stringify(records[0].fields, null, 2))
    console.log('')

    // Verify by reading it back
    console.log('🔍 Verifying by reading the record back...')
    const readRecord = await base(TABLE_NAME).find(records[0].id)
    console.log('✅ Record verified!')
    console.log(`   Table Name: ${readRecord.fields['Table Name']}`)
    console.log(`   Field Name (Original): ${readRecord.fields['Field Name (Original)']}`)
    console.log(`   Field Name (Custom): ${readRecord.fields['Field Name (Custom)']}`)
    console.log('')

    console.log('✨ Test completed successfully!')
    console.log('')
    console.log('💡 You can now delete this test record from Airtable if needed.')
    console.log(`   Record ID to delete: ${records[0].id}`)

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    if (error.error) {
      console.error('   Airtable error:', JSON.stringify(error.error, null, 2))
    }
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

writeTestData()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

