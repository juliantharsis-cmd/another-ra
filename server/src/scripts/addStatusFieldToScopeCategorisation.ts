/**
 * Script to add "Status" field specifically to "Scope & categorisation" table
 * 
 * Usage: npm run add:status-field-scope-categorisation
 */

import * as dotenv from 'dotenv'
import { config } from 'dotenv'

config({ path: '.env' })

const BASE_ID = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 
                process.env.AIRTABLE_BASE_ID || 
                'appGtLbKhmNkkTLVL'
const API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY

if (!API_KEY) {
  console.error('❌ Error: AIRTABLE_PERSONAL_ACCESS_TOKEN must be set')
  process.exit(1)
}

const TABLE_NAME = 'scope & categorisation' // Lowercase as used in service

const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch')

interface AirtableTable {
  id: string
  name: string
  fields: Array<{ id: string; name: string; type: string }>
}

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
      if (response.status === 422 && errorText.includes('DUPLICATE_OR_EMPTY_FIELD_NAME')) {
        console.log(`   ✅ Status field already exists in "${tableName}"`)
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

async function main() {
  console.log('🚀 Adding Status field to "Scope & categorisation" table...\n')
  console.log(`   Base ID: ${BASE_ID}\n`)

  try {
    const tables = await getTables()
    
    // Find table by name (case-insensitive)
    const table = tables.find(t => 
      t.name.toLowerCase() === TABLE_NAME.toLowerCase() ||
      t.name.toLowerCase() === 'scope & categorisation' ||
      t.name.toLowerCase() === 'scope and categorisation'
    )

    if (!table) {
      console.log('❌ Table not found. Available tables:')
      tables.forEach(t => console.log(`   - ${t.name}`))
      return
    }

    console.log(`📋 Found table: "${table.name}" (ID: ${table.id})\n`)

    // Check if Status field exists
    const hasStatusField = table.fields.some(f => f.name === 'Status')
    
    if (hasStatusField) {
      console.log('✅ Status field already exists in this table')
      return
    }

    console.log('📝 Adding Status field...\n')
    await addStatusField(table.id, table.name)

    console.log('\n🎉 Status field added successfully!')
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Unhandled error:', error)
  process.exit(1)
})

