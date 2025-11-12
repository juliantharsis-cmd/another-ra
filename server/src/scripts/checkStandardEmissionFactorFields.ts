/**
 * Script to check Standard Emission Factor fields in Airtable
 */

import * as dotenv from 'dotenv'
import { config } from 'dotenv'
import Airtable from 'airtable'

config({ path: '.env' })

const API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY
const BASE_ID = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 'appGtLbKhmNkkTLVL'
const TABLE_NAME = 'Standard Emission factors'

if (!API_KEY) {
  console.error('❌ Error: AIRTABLE_PERSONAL_ACCESS_TOKEN must be set')
  process.exit(1)
}

Airtable.configure({ apiKey: API_KEY })
const base = Airtable.base(BASE_ID)

async function checkFields() {
  console.log('🔍 Checking Standard Emission Factor fields in Airtable...\n')
  
  try {
    const records = await base(TABLE_NAME).select({ maxRecords: 3 }).firstPage()
    
    if (records.length === 0) {
      console.log('No records found')
      return
    }
    
    console.log(`Found ${records.length} record(s):\n`)
    
    const allFields = new Map<string, { type: string; sample: any; isLinked: boolean; isLookup: boolean }>()
    records.forEach(record => {
      Object.keys(record.fields).forEach(fieldName => {
        if (!allFields.has(fieldName)) {
          const value = record.fields[fieldName]
          const isArray = Array.isArray(value)
          const isLinked = isArray && value.length > 0 && typeof value[0] === 'string' && value[0].startsWith('rec')
          const isLookup = fieldName.includes('(from ') || fieldName.includes('(lookup')
          
          allFields.set(fieldName, {
            type: isArray ? 'array' : typeof value,
            sample: isArray 
              ? (value.length > 0 ? value[0] : 'empty array')
              : (typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : value),
            isLinked,
            isLookup,
          })
        }
      })
    })
    
    console.log('All fields in Airtable:')
    Array.from(allFields.entries()).sort().forEach(([field, info]) => {
      const typeLabel = info.isLinked ? 'linked record' : info.isLookup ? 'lookup' : info.type
      console.log(`  - ${field}`)
      console.log(`    Type: ${typeLabel}`)
      console.log(`    Sample: ${JSON.stringify(info.sample).substring(0, 60)}`)
      console.log()
    })
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
}

checkFields().catch(console.error)

