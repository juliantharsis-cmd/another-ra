/**
 * Script to check Unit Conversion fields in Airtable
 */

import * as dotenv from 'dotenv'
import { config } from 'dotenv'
import Airtable from 'airtable'

config({ path: '.env' })

const API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY
const BASE_ID = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 'appGtLbKhmNkkTLVL'
const TABLE_NAME = 'Unit Conversion'

if (!API_KEY) {
  console.error('❌ Error: AIRTABLE_PERSONAL_ACCESS_TOKEN must be set')
  process.exit(1)
}

Airtable.configure({ apiKey: API_KEY })
const base = Airtable.base(BASE_ID)

async function checkFields() {
  console.log('🔍 Checking Unit Conversion fields in Airtable...\n')
  
  try {
    const records = await base(TABLE_NAME).select({ maxRecords: 3 }).firstPage()
    
    if (records.length === 0) {
      console.log('No records found')
      return
    }
    
    console.log(`Found ${records.length} record(s):\n`)
    
    const allFields = new Set<string>()
    records.forEach(record => {
      Object.keys(record.fields).forEach(key => allFields.add(key))
    })
    
    console.log('All fields in Airtable:')
    Array.from(allFields).sort().forEach(field => {
      const sampleRecord = records[0]
      const value = sampleRecord.fields[field]
      const type = Array.isArray(value) ? 'array' : typeof value
      const sample = Array.isArray(value) 
        ? (value.length > 0 ? `[${value.length} items]` : 'empty array')
        : (typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : value)
      
      console.log(`  - ${field}`)
      console.log(`    Type: ${type}`)
      console.log(`    Sample: ${JSON.stringify(sample)}`)
      console.log()
    })
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
}

checkFields().catch(console.error)

