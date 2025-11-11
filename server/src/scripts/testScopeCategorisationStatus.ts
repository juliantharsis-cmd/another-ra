/**
 * Test script to verify Status field in Scope & categorisation
 */

import * as dotenv from 'dotenv'
import { config } from 'dotenv'
import Airtable from 'airtable'

config({ path: '.env' })

const API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY
const BASE_ID = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 'appGtLbKhmNkkTLVL'
const TABLE_NAME = 'scope & categorisation'

if (!API_KEY) {
  console.error('❌ Error: AIRTABLE_PERSONAL_ACCESS_TOKEN must be set')
  process.exit(1)
}

Airtable.configure({ apiKey: API_KEY })
const base = Airtable.base(BASE_ID)

async function testStatusField() {
  console.log('🔍 Testing Status field in Scope & categorisation table...\n')
  
  try {
    const records = await base(TABLE_NAME).select({
      fields: ['Name', 'Status'],
      maxRecords: 5,
    }).firstPage()
    
    console.log(`Found ${records.length} record(s):\n`)
    
    records.forEach((record, index) => {
      console.log(`Record ${index + 1} (ID: ${record.id}):`)
      console.log(`  Name: ${record.fields['Name'] || 'N/A'}`)
      console.log(`  Status: ${record.fields['Status'] || 'undefined (will default to Active)'}`)
      console.log()
    })
    
    if (records.length > 0) {
      const firstRecord = records[0]
      const statusValue = firstRecord.fields['Status']
      if (statusValue === undefined || statusValue === null) {
        console.log('  ⚠️  Status field exists but is not set for this record')
        console.log('  ✅ Service will default to "Active" when reading')
      } else {
        console.log(`  ✅ Status field is working: "${statusValue}"`)
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    if (error.error) {
      console.error('   Error code:', error.error)
    }
  }
}

testStatusField().catch(console.error)

