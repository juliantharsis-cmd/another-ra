/**
 * Script to validate that all Airtable fields are mapped in the application
 * 
 * Usage: npx tsx src/scripts/validateTableFields.ts <table-name>
 * Example: npx tsx src/scripts/validateTableFields.ts "Unit Conversion"
 */

import * as dotenv from 'dotenv'
import { config } from 'dotenv'
import Airtable from 'airtable'
import * as fs from 'fs'
import * as path from 'path'

config({ path: '.env' })

const API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY
const BASE_ID = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 'appGtLbKhmNkkTLVL'

if (!API_KEY) {
  console.error('❌ Error: AIRTABLE_PERSONAL_ACCESS_TOKEN must be set')
  process.exit(1)
}

const TABLE_NAME = process.argv[2]

if (!TABLE_NAME) {
  console.error('❌ Error: Table name is required')
  console.log('Usage: npx tsx src/scripts/validateTableFields.ts <table-name>')
  process.exit(1)
}

Airtable.configure({ apiKey: API_KEY })
const base = Airtable.base(BASE_ID)

interface FieldInfo {
  name: string
  type: string
  sample: any
  isLinked: boolean
  isLookup: boolean
}

async function getAirtableFields(): Promise<FieldInfo[]> {
  console.log(`🔍 Fetching fields from Airtable table "${TABLE_NAME}"...\n`)
  
  try {
    const records = await base(TABLE_NAME).select({ maxRecords: 3 }).firstPage()
    
    if (records.length === 0) {
      console.log('⚠️  No records found in table')
      return []
    }
    
    const allFields = new Map<string, FieldInfo>()
    
    records.forEach(record => {
      Object.keys(record.fields).forEach(fieldName => {
        if (!allFields.has(fieldName)) {
          const value = record.fields[fieldName]
          const isArray = Array.isArray(value)
          const isLinked = isArray && value.length > 0 && typeof value[0] === 'string' && value[0].startsWith('rec')
          const isLookup = fieldName.includes('(from ') || fieldName.includes('(lookup')
          
          allFields.set(fieldName, {
            name: fieldName,
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
    
    return Array.from(allFields.values())
  } catch (error: any) {
    console.error(`❌ Error fetching fields: ${error.message}`)
    return []
  }
}

function findTypeFile(): string | null {
  const possiblePaths = [
    path.join(__dirname, '../types', `${TABLE_NAME.replace(/\s+/g, '')}.ts`),
    path.join(__dirname, '../types', `${TABLE_NAME.replace(/\s+/g, '').toLowerCase()}.ts`),
    path.join(__dirname, '../types', `${TABLE_NAME.replace(/\s+/g, '-').toLowerCase()}.ts`),
  ]
  
  for (const typePath of possiblePaths) {
    if (fs.existsSync(typePath)) {
      return typePath
    }
  }
  
  return null
}

function extractFieldsFromTypeFile(typeFilePath: string): Set<string> {
  const content = fs.readFileSync(typeFilePath, 'utf-8')
  const fields = new Set<string>()
  
  // Extract field names from interface - handle both quoted and unquoted field names
  const interfaceMatch = content.match(/export interface \w+\s*\{([^}]+)\}/s)
  if (interfaceMatch) {
    const interfaceBody = interfaceMatch[1]
    // Match field names: either quoted strings like 'Unit to convert' or unquoted identifiers
    const fieldRegex = /(?:['"]([^'"]+)['"]|([a-zA-Z_][a-zA-Z0-9_]*))\s*\?:/g
    let match
    while ((match = fieldRegex.exec(interfaceBody)) !== null) {
      const fieldName = (match[1] || match[2]).trim()
      if (fieldName && 
          fieldName !== 'id' && 
          !fieldName.startsWith('id') && 
          fieldName !== 'createdAt' && 
          fieldName !== 'updatedAt' && 
          fieldName !== 'createdBy' && 
          fieldName !== 'lastModifiedBy') {
        fields.add(fieldName)
      }
    }
  }
  
  return fields
}

async function validateFields() {
  console.log(`📋 Validating fields for table: "${TABLE_NAME}"\n`)
  console.log('=' .repeat(60) + '\n')
  
  const airtableFields = await getAirtableFields()
  
  if (airtableFields.length === 0) {
    console.log('❌ No fields found in Airtable')
    return
  }
  
  console.log(`✅ Found ${airtableFields.length} fields in Airtable:\n`)
  airtableFields.forEach(field => {
    const typeLabel = field.isLinked ? 'linked record' : field.isLookup ? 'lookup' : field.type
    console.log(`  - ${field.name}`)
    console.log(`    Type: ${typeLabel}`)
    console.log(`    Sample: ${JSON.stringify(field.sample).substring(0, 60)}`)
    console.log()
  })
  
  const typeFilePath = findTypeFile()
  
  if (!typeFilePath) {
    console.log('⚠️  Type file not found. Cannot compare with application types.')
    console.log('   Searched paths:')
    const possiblePaths = [
      path.join(__dirname, '../types', `${TABLE_NAME.replace(/\s+/g, '')}.ts`),
      path.join(__dirname, '../types', `${TABLE_NAME.replace(/\s+/g, '').toLowerCase()}.ts`),
    ]
    possiblePaths.forEach(p => console.log(`     - ${p}`))
    return
  }
  
  console.log(`✅ Found type file: ${typeFilePath}\n`)
  
  const appFields = extractFieldsFromTypeFile(typeFilePath)
  
  console.log(`✅ Found ${appFields.size} fields in application type:\n`)
  Array.from(appFields).sort().forEach(field => {
    console.log(`  - ${field}`)
  })
  console.log()
  
  // Compare
  const airtableFieldNames = new Set(airtableFields.map(f => f.name))
  const missingInApp: string[] = []
  const missingInAirtable: string[] = []
  
  airtableFields.forEach(field => {
    // Check if field exists (exact match or with " Name" suffix for linked records)
    const hasExact = appFields.has(field.name)
    const hasNameSuffix = appFields.has(`${field.name} Name`)
    const hasWithoutSpaces = appFields.has(field.name.replace(/\s+/g, ''))
    
    if (!hasExact && !hasNameSuffix && !hasWithoutSpaces) {
      missingInApp.push(field.name)
    }
  })
  
  appFields.forEach(field => {
    // Skip metadata fields and Name suffixes
    if (field.endsWith(' Name') || field === 'id') {
      return
    }
    
    // Check if it exists in Airtable (exact match or similar)
    const hasExact = airtableFieldNames.has(field)
    const hasWithSpaces = airtableFieldNames.has(field.replace(/([A-Z])/g, ' $1').trim())
    
    if (!hasExact && !hasWithSpaces) {
      // Check if it's a computed field (like "Name" for linked records)
      const baseField = field.replace(/\s+/g, ' ')
      if (!airtableFieldNames.has(baseField)) {
        missingInAirtable.push(field)
      }
    }
  })
  
  console.log('=' .repeat(60) + '\n')
  console.log('📊 VALIDATION RESULTS:\n')
  
  if (missingInApp.length === 0 && missingInAirtable.length === 0) {
    console.log('✅ All fields are properly mapped!\n')
  } else {
    if (missingInApp.length > 0) {
      console.log(`❌ Missing in Application (${missingInApp.length}):\n`)
      missingInApp.forEach(field => {
        const fieldInfo = airtableFields.find(f => f.name === field)
        const typeLabel = fieldInfo?.isLinked ? 'linked record' : fieldInfo?.isLookup ? 'lookup' : fieldInfo?.type || 'unknown'
        console.log(`  - ${field} (${typeLabel})`)
      })
      console.log()
    }
    
    if (missingInAirtable.length > 0) {
      console.log(`⚠️  In Application but not in Airtable (${missingInAirtable.length}):\n`)
      missingInAirtable.forEach(field => {
        console.log(`  - ${field}`)
      })
      console.log()
    }
  }
  
  // Generate recommendations
  if (missingInApp.length > 0) {
    console.log('💡 RECOMMENDATIONS:\n')
    missingInApp.forEach(field => {
      const fieldInfo = airtableFields.find(f => f.name === field)
      if (fieldInfo?.isLinked) {
        console.log(`  - Add "${field}" as linked record field (string | string[])`)
        console.log(`    Add "${field} Name" for resolved names (string | string[])`)
      } else if (fieldInfo?.isLookup) {
        console.log(`  - Add "${field}" as readonly lookup field (string)`)
      } else {
        const tsType = fieldInfo?.type === 'number' ? 'number' : fieldInfo?.type === 'array' ? 'string[]' : 'string'
        console.log(`  - Add "${field}" as ${tsType} field`)
      }
    })
    console.log()
  }
}

validateFields().catch(console.error)

