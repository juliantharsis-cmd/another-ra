/**
 * Script to add "Status" field to Airtable tables
 * 
 * Adds a select field with "Active" and "Inactive" options to tables that are missing it.
 * 
 * Usage: npm run add:status-field
 */

import * as dotenv from 'dotenv'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env' })

// Use System Configuration base ID (same as other system config tables)
const BASE_ID = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 
                process.env.AIRTABLE_BASE_ID || 
                'appGtLbKhmNkkTLVL'
const API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY

if (!API_KEY) {
  console.error('❌ Error: AIRTABLE_PERSONAL_ACCESS_TOKEN (or AIRTABLE_API_KEY) must be set in environment variables')
  process.exit(1)
}

// Tables that need the Status field
// Note: These names must match exactly the table names in Airtable
const TABLES_TO_UPDATE = [
  'Scope',
  'Normalized Activities',
  'EF/Detailed G',
  'Scope & categorisation',
  'Unit',
  'Unit Conversion',
  'Standard ECM catalog',
  'Standard ECM Classification',
  'Standard Emission factors',
]

const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch')

interface AirtableField {
  id: string
  name: string
  type: string
  options?: any
}

interface AirtableTable {
  id: string
  name: string
  fields: AirtableField[]
}

/**
 * Get all tables from the base
 */
async function getTables(): Promise<AirtableTable[]> {
  try {
    const url = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`
    const response = await fetchFn(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch tables: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json() as { tables: AirtableTable[] }
    return result.tables
  } catch (error: any) {
    console.error('❌ Error fetching tables:', error.message)
    throw error
  }
}

/**
 * Check if a field exists in a table
 */
function fieldExists(table: AirtableTable, fieldName: string): boolean {
  return table.fields.some(field => field.name === fieldName)
}

/**
 * Add Status field to a table
 */
async function addStatusField(tableId: string, tableName: string): Promise<void> {
  try {
    const url = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables/${tableId}/fields`
    
    const payload = {
      name: 'Status',
      type: 'singleSelect',
      options: {
        choices: [
          {
            name: 'Active',
            color: 'greenLight2',
          },
          {
            name: 'Inactive',
            color: 'grayLight2',
          },
        ],
      },
    }

    const response = await fetchFn(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      // Check if field already exists
      if (response.status === 422 && errorText.includes('DUPLICATE_OR_EMPTY_FIELD_NAME')) {
        console.log(`   ⚠️  Status field already exists in "${tableName}"`)
        return
      }
      throw new Error(`Failed to add Status field: ${response.status} ${response.statusText} - ${errorText}`)
    }

    console.log(`   ✅ Status field added to "${tableName}"`)
  } catch (error: any) {
    console.error(`   ❌ Error adding Status field to "${tableName}": ${error.message}`)
    throw error
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Adding Status field to Airtable tables...\n')
  console.log(`   Base ID: ${BASE_ID}\n`)

  try {
    // Get all tables
    console.log('📋 Fetching tables...')
    const tables = await getTables()
    console.log(`   Found ${tables.length} tables\n`)

    // Filter tables that need the Status field
    const tablesToUpdate = tables.filter(table => 
      TABLES_TO_UPDATE.includes(table.name)
    )

    if (tablesToUpdate.length === 0) {
      console.log('⚠️  No matching tables found. Tables to update:')
      TABLES_TO_UPDATE.forEach(name => console.log(`   - ${name}`))
      return
    }

    console.log(`📝 Found ${tablesToUpdate.length} tables to check:\n`)

    let addedCount = 0
    let skippedCount = 0
    let errorCount = 0

    // Process each table
    for (const table of tablesToUpdate) {
      console.log(`🔍 Checking "${table.name}"...`)
      
      if (fieldExists(table, 'Status')) {
        console.log(`   ✅ Status field already exists\n`)
        skippedCount++
        continue
      }

      try {
        await addStatusField(table.id, table.name)
        addedCount++
        console.log()
      } catch (error: any) {
        console.error(`   ❌ Failed: ${error.message}\n`)
        errorCount++
      }
    }

    // Summary
    console.log('='.repeat(60))
    console.log('SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Added: ${addedCount}`)
    console.log(`⏭️  Skipped (already exists): ${skippedCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log('='.repeat(60))

    if (errorCount === 0) {
      console.log('\n🎉 All Status fields added successfully!')
    } else {
      console.log(`\n⚠️  ${errorCount} error(s) occurred. Please review the output above.`)
      process.exit(1)
    }
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message)
    process.exit(1)
  }
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error)
  process.exit(1)
})

