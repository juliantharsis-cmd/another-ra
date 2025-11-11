/**
 * Script to add Status field to "Scope & categorisation" table
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

const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch')

interface AirtableTable {
  id: string
  name: string
  fields: Array<{ id: string; name: string; type: string }>
}

async function getTables(): Promise<AirtableTable[]> {
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
}

async function addStatusField(tableId: string, tableName: string): Promise<void> {
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
      console.log(`   ⚠️  Status field already exists in "${tableName}"`)
      return
    }
    throw new Error(`Failed to add Status field: ${response.status} ${response.statusText} - ${errorText}`)
  }

  console.log(`   ✅ Status field added to "${tableName}"`)
}

async function main() {
  console.log('🚀 Adding Status field to "Scope & categorisation" table...\n')
  console.log(`   Base ID: ${BASE_ID}\n`)

  try {
    const tables = await getTables()
    
    // Find the table - try different name variations
    const tableNames = [
      'Scope & categorisation',
      'Scope & Categorisation',
      'Scope and categorisation',
      'scope & categorisation',
    ]
    
    let targetTable: AirtableTable | null = null
    for (const name of tableNames) {
      targetTable = tables.find(t => t.name === name) || null
      if (targetTable) {
        console.log(`📋 Found table: "${targetTable.name}" (ID: ${targetTable.id})\n`)
        break
      }
    }

    if (!targetTable) {
      console.log('❌ Table not found. Available tables with "scope" or "categorisation" in name:')
      tables
        .filter(t => t.name.toLowerCase().includes('scope') || t.name.toLowerCase().includes('categorisation'))
        .forEach(t => console.log(`   - "${t.name}"`))
      return
    }

    // Check if Status field already exists
    const hasStatus = targetTable.fields.some(f => f.name === 'Status')
    if (hasStatus) {
      console.log('   ✅ Status field already exists\n')
      return
    }

    // Add Status field
    console.log('📝 Adding Status field...')
    await addStatusField(targetTable.id, targetTable.name)
    console.log('\n🎉 Status field added successfully!')
  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)

