#!/usr/bin/env node

/**
 * Relationship Detection Script
 * 
 * Detects linked record relationships in Airtable tables and generates
 * relationship resolution code for services.
 * 
 * Usage: node scripts/detect-relationships.mjs <tableName> [baseId]
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env file
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env')
    const envContent = readFileSync(envPath, 'utf-8')
    const env = {}
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
        }
      }
    })
    return env
  } catch (error) {
    console.warn('⚠️  Could not load .env file:', error.message)
    return {}
  }
}

const env = loadEnv()

const API_KEY = env.AIRTABLE_PERSONAL_ACCESS_TOKEN || env.AIRTABLE_API_KEY
const SYSTEM_CONFIG_BASE_ID = env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 'appGtLbKhmNkkTLVL'
const EMISSION_BASE_ID = env.AIRTABLE_EMISSION_BASE_ID
const BASE_ID = env.AIRTABLE_BASE_ID || SYSTEM_CONFIG_BASE_ID

// Table name mappings to base IDs
const TABLE_BASE_MAP = {
  'Companies': SYSTEM_CONFIG_BASE_ID,
  'Geography': SYSTEM_CONFIG_BASE_ID,
  'GHG Type': SYSTEM_CONFIG_BASE_ID,
  'EF GWP': EMISSION_BASE_ID || BASE_ID,
  'Emission Factor Version': SYSTEM_CONFIG_BASE_ID,
  'user table': SYSTEM_CONFIG_BASE_ID,
  'Application List': SYSTEM_CONFIG_BASE_ID,
}

async function fetchTableSchema(tableName, baseId) {
  if (!API_KEY) {
    throw new Error('AIRTABLE_PERSONAL_ACCESS_TOKEN or AIRTABLE_API_KEY must be set in .env')
  }

  const url = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to fetch tables: ${error.error?.message || response.statusText}`)
    }

    const data = await response.json()
    const table = data.tables.find(t => t.name === tableName || t.id === tableName)
    
    if (!table) {
      throw new Error(`Table "${tableName}" not found in base ${baseId}`)
    }

    // Fetch detailed schema for the table
    const tableUrl = `https://api.airtable.com/v0/meta/bases/${baseId}/tables/${table.id}`
    const tableResponse = await fetch(tableUrl, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!tableResponse.ok) {
      const error = await tableResponse.json()
      throw new Error(`Failed to fetch table schema: ${error.error?.message || tableResponse.statusText}`)
    }

    return await tableResponse.json()
  } catch (error) {
    console.error('❌ Error fetching schema:', error.message)
    throw error
  }
}

function detectRelationships(schema) {
  const relationships = []
  
  schema.fields.forEach(field => {
    if (field.type === 'multipleRecordLinks') {
      relationships.push({
        fieldName: field.name,
        targetTable: field.options.linkedTableId ? 
          schema.tables?.find(t => t.id === field.options.linkedTableId)?.name || field.options.linkedTableId :
          'Unknown',
        targetDisplayField: field.options.inverseLinkFieldDisplayName || 'Name',
        isMultiple: true,
        inverseLinkField: field.options.inverseLinkFieldName,
      })
    } else if (field.type === 'singleCollaborator') {
      // User fields - might want to resolve these too
      relationships.push({
        fieldName: field.name,
        targetTable: 'Users',
        targetDisplayField: 'Name',
        isMultiple: false,
        type: 'collaborator',
      })
    }
  })
  
  return relationships
}

function generateResolutionCode(tableName, relationships) {
  if (relationships.length === 0) {
    return `// No linked record relationships detected for ${tableName}`
  }

  const className = tableName.replace(/\s+/g, '') + 'AirtableService'
  const varName = tableName.toLowerCase().replace(/\s+/g, '') + 'Records'
  
  let code = `  /**
   * Resolve linked record names for ${tableName} relationships
   */
  private async resolveLinkedRecordNames(${varName}: any[]): Promise<void> {
    if (!this.relationshipResolver || ${varName}.length === 0) {
      return
    }

    try {
`

  // Collect IDs for each relationship
  relationships.forEach((rel, idx) => {
    const idsVar = `${rel.fieldName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}Ids`
    code += `      // Collect ${rel.fieldName} IDs
      const ${idsVar} = new Set<string>()
      ${varName}.forEach(record => {
        if (record['${rel.fieldName}']) {
          const ids = Array.isArray(record['${rel.fieldName}']) ? record['${rel.fieldName}'] : [record['${rel.fieldName}']]
          ids.forEach((id: string) => id && ${idsVar}.add(id))
        }
      })
`
  })

  code += `\n      // Resolve all relationships in parallel
      const [`

  relationships.forEach((rel, idx) => {
    const idsVar = `${rel.fieldName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}Ids`
    const namesVar = `${rel.fieldName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}Names`
    code += `${namesVar}`
    if (idx < relationships.length - 1) code += `, `
  })

  code += `] = await Promise.all([
`

  relationships.forEach((rel, idx) => {
    const idsVar = `${rel.fieldName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}Ids`
    const namesVar = `${rel.fieldName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}Names`
    code += `        ${idsVar}.size > 0 ? this.relationshipResolver.resolveLinkedRecords(Array.from(${idsVar}), '${rel.targetTable}', '${rel.targetDisplayField}') : Promise.resolve([])`
    if (idx < relationships.length - 1) code += `,\n`
  })

  code += `
      ])

      // Create lookup maps
`

  relationships.forEach((rel) => {
    const namesVar = `${rel.fieldName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}Names`
    const mapVar = `${rel.fieldName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}Map`
    code += `      const ${mapVar} = new Map(${namesVar}.map(r => [r.id, r.name]))
`
  })

  code += `
      // Update records with resolved names
      ${varName}.forEach(record => {
`

  relationships.forEach((rel) => {
    const mapVar = `${rel.fieldName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}Map`
    const nameField = `${rel.fieldName}Name`
    code += `        // Resolve ${rel.fieldName} names
        if (record['${rel.fieldName}']) {
          if (Array.isArray(record['${rel.fieldName}'])) {
            record['${nameField}'] = record['${rel.fieldName}'].map((id: string) => ${mapVar}.get(id) || id).filter(Boolean)
          } else {
            record['${nameField}'] = ${mapVar}.get(record['${rel.fieldName}']) || record['${rel.fieldName}']
          }
        }
`
  })

  code += `      })
    } catch (error) {
      console.error('Error resolving linked record names for ${tableName}:', error)
      // Don't throw - continue without resolved names
    }
  }
`

  return code
}

async function main() {
  const tableName = process.argv[2]
  const baseIdArg = process.argv[3]

  if (!tableName) {
    console.error('❌ Usage: node scripts/detect-relationships.mjs <tableName> [baseId]')
    process.exit(1)
  }

  const baseId = baseIdArg || TABLE_BASE_MAP[tableName] || SYSTEM_CONFIG_BASE_ID

  console.log(`🔍 Detecting relationships for table: "${tableName}"`)
  console.log(`   Base ID: ${baseId}\n`)

  try {
    const schema = await fetchTableSchema(tableName, baseId)
    const relationships = detectRelationships(schema)

    console.log(`📊 Found ${relationships.length} relationship(s):\n`)
    
    if (relationships.length === 0) {
      console.log('   No linked record relationships found.')
    } else {
      relationships.forEach((rel, idx) => {
        console.log(`   ${idx + 1}. ${rel.fieldName}`)
        console.log(`      → ${rel.targetTable} (${rel.targetDisplayField})`)
        console.log(`      Type: ${rel.isMultiple ? 'Many' : 'One'}-to-Many`)
        if (rel.inverseLinkField) {
          console.log(`      Inverse: ${rel.inverseLinkField}`)
        }
        console.log()
      })

      console.log('\n📝 Generated resolution code:\n')
      console.log('─'.repeat(80))
      const code = generateResolutionCode(tableName, relationships)
      console.log(code)
      console.log('─'.repeat(80))
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main()

