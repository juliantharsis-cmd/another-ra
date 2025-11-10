import Airtable from 'airtable'

const SYSTEM_CONFIG_BASE_ID = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 'appGtLbKhmNkkTLVL'
const API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY

if (!API_KEY) {
  console.error('❌ Error: AIRTABLE_PERSONAL_ACCESS_TOKEN or AIRTABLE_API_KEY must be set')
  process.exit(1)
}

Airtable.configure({ apiKey: API_KEY })
const base = Airtable.base(SYSTEM_CONFIG_BASE_ID)

async function getUserManagementSchema() {
  try {
    console.log('🔍 Fetching User Management table schema from Airtable...')
    console.log(`Base ID: ${SYSTEM_CONFIG_BASE_ID}\n`)

    // Try to get schema using Metadata API
    const response = await fetch(`https://api.airtable.com/v0/meta/bases/${SYSTEM_CONFIG_BASE_ID}/tables`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const userTable = data.tables.find((t: any) => 
      t.name && (t.name.toLowerCase().includes('user') || t.name.toLowerCase().includes('management'))
    )

    if (!userTable) {
      console.log('⚠️  User Management table not found in schema. Trying to fetch a sample record...')
      
      // Try to fetch a sample record to get field names
      const records = await base('User Management').select({ maxRecords: 1 }).all()
      if (records.length > 0) {
        console.log('\n📋 Fields found in User Management table (from sample record):')
        console.log('Fields:', Object.keys(records[0].fields).join(', '))
        console.log('\n📝 Field details:')
        Object.entries(records[0].fields).forEach(([key, value]) => {
          console.log(`  - ${key}: ${typeof value} ${Array.isArray(value) ? `(array of ${value.length})` : ''}`)
        })
      } else {
        console.log('⚠️  No records found in User Management table')
      }
      return
    }

    console.log(`\n✅ Found table: ${userTable.name}`)
    console.log(`   Table ID: ${userTable.id}`)
    console.log(`   Primary Field: ${userTable.primaryFieldId}`)
    console.log(`\n📋 Fields (${userTable.fields.length}):`)
    console.log('='.repeat(80))
    
    userTable.fields.forEach((field: any) => {
      console.log(`\n${field.name}`)
      console.log(`  Type: ${field.type}`)
      if (field.options) {
        if (field.options.choices) {
          console.log(`  Options: ${field.options.choices.map((c: any) => c.name).join(', ')}`)
        }
        if (field.options.linkedTableId) {
          console.log(`  Linked Table ID: ${field.options.linkedTableId}`)
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Error fetching schema:', error.message)
    
    // Fallback: try to get field names from a sample record
    try {
      console.log('\n🔄 Trying fallback: fetching sample record...')
      const records = await base('User Management').select({ maxRecords: 1 }).all()
      if (records.length > 0) {
        console.log('\n📋 Fields found in User Management table:')
        Object.keys(records[0].fields).forEach(field => {
          console.log(`  - ${field}`)
        })
      }
    } catch (fallbackError: any) {
      console.error('❌ Fallback also failed:', fallbackError.message)
    }
  }
}

getUserManagementSchema()

