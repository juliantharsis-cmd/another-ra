/**
 * Script to fetch and display the schema of the "user table" from Airtable
 * This helps us understand what fields exist before configuring the frontend
 */

import Airtable from 'airtable'

// Get environment variables (assumes they're set in the environment or .env is loaded)
const API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY
const SYSTEM_CONFIG_BASE_ID = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 'appGtLbKhmNkkTLVL'
const TABLE_NAME = 'user table'

if (!API_KEY) {
  console.error('❌ Airtable API token is required. Set AIRTABLE_PERSONAL_ACCESS_TOKEN in .env file')
  process.exit(1)
}

Airtable.configure({ apiKey: API_KEY })
const base = Airtable.base(SYSTEM_CONFIG_BASE_ID)

async function fetchTableSchema() {
  try {
    console.log('🔍 Fetching schema for "user table"...')
    console.log(`   Base ID: ${SYSTEM_CONFIG_BASE_ID}`)
    console.log(`   Table: ${TABLE_NAME}`)
    console.log('')

    // Try to use Metadata API first (if available)
    try {
      const metadataUrl = `https://api.airtable.com/v0/meta/bases/${SYSTEM_CONFIG_BASE_ID}/tables`
      const response = await fetch(metadataUrl, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const metadata = await response.json()
        const table = metadata.tables?.find((t: any) => 
          t.name.toLowerCase() === TABLE_NAME.toLowerCase()
        )

        if (table) {
          console.log(`✅ Found table: ${table.name} (ID: ${table.id})`)
          console.log('')
          console.log('📋 Fields:')
          console.log('─'.repeat(80))
          
          table.fields.forEach((field: any, index: number) => {
            console.log(`${index + 1}. ${field.name}`)
            console.log(`   Type: ${field.type}`)
            if (field.options) {
              console.log(`   Options: ${JSON.stringify(field.options, null, 2)}`)
            }
            if (field.description) {
              console.log(`   Description: ${field.description}`)
            }
            console.log('')
          })
          
          console.log('─'.repeat(80))
          console.log(`Total fields: ${table.fields.length}`)
          return
        } else {
          console.log('⚠️  Table not found in metadata, trying to fetch a sample record...')
        }
      }
    } catch (metadataError) {
      console.log('⚠️  Metadata API not available, fetching a sample record instead...')
    }

    // Fallback: Fetch a sample record to see what fields exist
    console.log('📥 Fetching a sample record to determine fields...')
    const records = await base(TABLE_NAME)
      .select({
        maxRecords: 1,
      })
      .firstPage()

    if (records.length === 0) {
      console.log('⚠️  No records found in the table. Cannot determine schema.')
      console.log('   Please add at least one record to the "user table" in Airtable.')
      return
    }

    const sampleRecord = records[0]
    const fields = sampleRecord.fields

    console.log('')
    console.log('✅ Found fields in sample record:')
    console.log('─'.repeat(80))
    
    Object.keys(fields).forEach((fieldName, index) => {
      const value = fields[fieldName]
      const valueType = Array.isArray(value) 
        ? `Array[${value.length}]` 
        : typeof value
      const sampleValue = Array.isArray(value) && value.length > 0
        ? (typeof value[0] === 'object' ? `[Linked Record: ${value[0].id}]` : JSON.stringify(value))
        : value
      
      console.log(`${index + 1}. ${fieldName}`)
      console.log(`   Type: ${valueType}`)
      console.log(`   Sample value: ${sampleValue}`)
      console.log('')
    })
    
    console.log('─'.repeat(80))
    console.log(`Total fields: ${Object.keys(fields).length}`)
    console.log('')
    console.log('💡 Note: Field types are inferred from sample data.')
    console.log('   For accurate types, use the Airtable Metadata API or check the Airtable UI.')

  } catch (error: any) {
    console.error('❌ Error fetching table schema:', error.message)
    if (error.error) {
      console.error(`   Airtable error: ${error.error}`)
    }
    if (error.statusCode) {
      console.error(`   Status code: ${error.statusCode}`)
    }
    process.exit(1)
  }
}

// Run the script
fetchTableSchema()
  .then(() => {
    console.log('')
    console.log('✅ Schema fetch complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })

