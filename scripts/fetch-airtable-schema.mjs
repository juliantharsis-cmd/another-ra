#!/usr/bin/env node

/**
 * Fetch Airtable Schema Script
 * 
 * Fetches the actual schema from Airtable for a given table and outputs
 * only the fields that exist in Airtable (no default/assumed fields).
 * 
 * Usage: node scripts/fetch-airtable-schema.mjs "Table Name"
 */

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables manually
try {
  const envPath = join(__dirname, '..', '.env')
  const envFile = readFileSync(envPath, 'utf8')
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim()
    }
  })
} catch (error) {
  // .env file not found, use existing environment variables
}

const API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || 
                process.env.AIRTABLE_API_KEY
const BASE_ID = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 
                 process.env.AIRTABLE_EMISSION_BASE_ID || 
                 process.env.AIRTABLE_BASE_ID ||
                 'appGtLbKhmNkkTLVL' // Default System Config base ID

if (!API_KEY || !BASE_ID) {
  console.error('❌ Error: AIRTABLE_PERSONAL_ACCESS_TOKEN and AIRTABLE_BASE_ID must be set in .env')
  process.exit(1)
}

const tableName = process.argv[2]

if (!tableName) {
  console.error('❌ Error: Table name is required')
  console.log('Usage: node scripts/fetch-airtable-schema.mjs "Table Name"')
  process.exit(1)
}

async function fetchTableSchema() {
  try {
    console.log(`\n🔍 Fetching schema for table: "${tableName}"`)
    console.log(`   Base ID: ${BASE_ID}\n`)

    // Fetch base schema
    const baseUrl = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`
    const response = await fetch(baseUrl, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch base schema: ${response.status} ${errorText}`)
    }

    const baseData = await response.json()
    
    // Find the table
    const table = baseData.tables?.find((t) => 
      t.name.toLowerCase() === tableName.toLowerCase()
    )

    if (!table) {
      console.error(`❌ Table "${tableName}" not found in base`)
      console.log('\nAvailable tables:')
      baseData.tables?.forEach((t) => {
        console.log(`   - ${t.name}`)
      })
      process.exit(1)
    }

    console.log(`✅ Found table: ${table.name} (ID: ${table.id})\n`)
    console.log('📋 Fields in Airtable:\n')

    // Display all fields
    const fields = table.fields || []
    
    if (fields.length === 0) {
      console.log('   ⚠️  No fields found in table')
    } else {
      fields.forEach((field, index) => {
        const type = field.type || 'unknown'
        const options = field.options ? ` (${JSON.stringify(field.options).substring(0, 50)}...)` : ''
        const linkedTable = field.options?.linkedTableId ? ` → Linked to table ID: ${field.options.linkedTableId}` : ''
        
        console.log(`   ${index + 1}. ${field.name}`)
        console.log(`      Type: ${type}${options}${linkedTable}`)
        if (field.description) {
          console.log(`      Description: ${field.description}`)
        }
        console.log('')
      })
    }

    // Output JSON for programmatic use
    console.log('\n📄 JSON Schema:\n')
    console.log(JSON.stringify({
      tableName: table.name,
      tableId: table.id,
      fields: fields.map((f) => ({
        name: f.name,
        type: f.type,
        id: f.id,
        description: f.description || undefined,
        options: f.options ? {
          linkedTableId: f.options.linkedTableId,
          linkedTableName: f.options.linkedTableName,
          // Only include relevant options based on type
        } : undefined,
      })),
    }, null, 2))

    console.log('\n✅ Schema fetch complete!\n')

  } catch (error) {
    console.error('❌ Error fetching schema:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

fetchTableSchema()

