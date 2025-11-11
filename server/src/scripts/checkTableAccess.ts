/**
 * Diagnostic script to check Airtable table access and names
 * 
 * Usage: npm run check:table-access
 */

import * as dotenv from 'dotenv'
import { config } from 'dotenv'
import Airtable from 'airtable'

// Load environment variables
config({ path: '.env' })

const API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY
const BASE_ID = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 'appGtLbKhmNkkTLVL'

if (!API_KEY) {
  console.error('❌ Error: AIRTABLE_PERSONAL_ACCESS_TOKEN must be set')
  process.exit(1)
}

Airtable.configure({ apiKey: API_KEY })
const base = Airtable.base(BASE_ID)

// Table names to check
const TABLES_TO_CHECK = [
  'Standard Emission factors',
  'Std Emission factors',
  'Standard Emission Factors',
  'Standard emission factors',
]

async function checkTableAccess(tableName: string): Promise<boolean> {
  try {
    const records = await base(tableName).select({
      maxRecords: 1,
      fields: ['Name'],
    }).firstPage()
    
    console.log(`   ✅ Access granted - Found ${records.length} record(s)`)
    return true
  } catch (error: any) {
    if (error.error === 'NOT_AUTHORIZED') {
      console.log(`   ❌ NOT_AUTHORIZED - No access to this table`)
    } else if (error.error === 'UNKNOWN_TABLE_NAME') {
      console.log(`   ⚠️  UNKNOWN_TABLE_NAME - Table doesn't exist with this name`)
    } else {
      console.log(`   ❌ Error: ${error.error} - ${error.message}`)
    }
    return false
  }
}

async function listAllTables(): Promise<void> {
  try {
    console.log('\n📋 Listing all tables in base...\n')
    
    // Try to get table schema by attempting to read from common table names
    const commonNames = [
      'Scope',
      'Unit',
      'Standard Emission factors',
      'Std Emission factors',
      'Standard Emission Factors',
    ]
    
    for (const name of commonNames) {
      try {
        await base(name).select({ maxRecords: 1 }).firstPage()
        console.log(`   ✅ Found table: "${name}"`)
      } catch (error: any) {
        // Table doesn't exist or no access
      }
    }
  } catch (error: any) {
    console.error('Error listing tables:', error.message)
  }
}

async function main() {
  console.log('🔍 Checking Airtable table access...\n')
  console.log(`   Base ID: ${BASE_ID}`)
  console.log(`   API Key: ${API_KEY.substring(0, 10)}...\n`)

  // Check each possible table name
  console.log('Testing table name variations:\n')
  for (const tableName of TABLES_TO_CHECK) {
    console.log(`Testing: "${tableName}"`)
    await checkTableAccess(tableName)
    console.log()
  }

  // List accessible tables
  await listAllTables()

  console.log('\n💡 Tips:')
  console.log('   - If all tables show NOT_AUTHORIZED, check API key permissions')
  console.log('   - If tables show UNKNOWN_TABLE_NAME, verify the exact table name in Airtable')
  console.log('   - Make sure the API key has access to the base: ' + BASE_ID)
}

main().catch(error => {
  console.error('Unhandled error:', error)
  process.exit(1)
})

