/**
 * Test script to check Status field synchronization
 */

import * as dotenv from 'dotenv'
import { config } from 'dotenv'
import Airtable from 'airtable'

config({ path: '.env' })

const API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY
const BASE_ID = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 'appGtLbKhmNkkTLVL'
const TABLE_NAME = 'Scope'

if (!API_KEY) {
  console.error('❌ Error: AIRTABLE_PERSONAL_ACCESS_TOKEN must be set')
  process.exit(1)
}

Airtable.configure({ apiKey: API_KEY })
const base = Airtable.base(BASE_ID)

async function testStatusField() {
  console.log('🔍 Testing Status field in Scope table...\n')
  
  try {
    // Get a few records
    const records = await base(TABLE_NAME).select({
      maxRecords: 5,
    }).firstPage()
    
    console.log(`Found ${records.length} record(s):\n`)
    
    records.forEach((record, index) => {
      console.log(`Record ${index + 1} (ID: ${record.id}):`)
      console.log(`  Name: ${record.fields['Name'] || 'N/A'}`)
      console.log(`  Status (raw):`, record.fields['Status'])
      console.log(`  Status (type):`, typeof record.fields['Status'])
      console.log(`  All fields:`, Object.keys(record.fields))
      console.log()
    })
    
    // Check if Status field exists in schema
    console.log('Checking field structure...')
    const firstRecord = records[0]
    if (firstRecord) {
      const statusValue = firstRecord.fields['Status']
      if (statusValue === undefined) {
        console.log('  ⚠️  Status field is undefined in record')
      } else if (statusValue === null) {
        console.log('  ⚠️  Status field is null in record')
      } else {
        console.log(`  ✅ Status field exists: "${statusValue}" (${typeof statusValue})`)
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

