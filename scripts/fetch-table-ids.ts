/**
 * Fetch Table IDs from Airtable and Update .env File
 * 
 * This script:
 * 1. Connects to Airtable using credentials from server/.env
 * 2. Fetches all tables from the System Configuration base
 * 3. Finds relevant tables and their IDs
 * 4. Updates server/.env with the table IDs
 */

import * as fs from 'fs'
import * as path from 'path'

// Simple .env parser
function parseEnvFile(content: string): Record<string, string> {
  const env: Record<string, string> = {}
  const lines = content.split('\n')
  
  for (const line of lines) {
    const trimmed = line.trim()
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) continue
    
    // Parse KEY=VALUE
    const match = trimmed.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      let value = match[2].trim()
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      env[key] = value
    }
  }
  
  return env
}

// Load environment variables
const envPath = path.join(__dirname, '../server/.env')
const envExamplePath = path.join(__dirname, '../server/env.example')

// Check if .env exists, if not, use env.example as template
let envContent = ''
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf-8')
} else if (fs.existsSync(envExamplePath)) {
  envContent = fs.readFileSync(envExamplePath, 'utf-8')
} else {
  console.error('❌ No .env or env.example file found!')
  console.error(`   Looking for: ${envPath}`)
  process.exit(1)
}

// Parse .env file
const envVars = parseEnvFile(envContent)

const API_KEY = envVars.AIRTABLE_PERSONAL_ACCESS_TOKEN
const BASE_ID = envVars.AIRTABLE_SYSTEM_CONFIG_BASE_ID

if (!API_KEY || API_KEY === 'your_airtable_token_here') {
  console.error('❌ AIRTABLE_PERSONAL_ACCESS_TOKEN not set or is placeholder!')
  console.error('   Please set it in server/.env')
  process.exit(1)
}

if (!BASE_ID || BASE_ID === 'your_base_id_here') {
  console.error('❌ AIRTABLE_SYSTEM_CONFIG_BASE_ID not set or is placeholder!')
  console.error('   Please set it in server/.env')
  process.exit(1)
}

interface TableInfo {
  id: string
  name: string
}

async function fetchTableIds(): Promise<TableInfo[]> {
  console.log('🔍 Fetching tables from Airtable...')
  console.log(`   Base ID: ${BASE_ID}\n`)

  try {
    const response = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.error('❌ Airtable API access denied!')
        console.error('   Your token needs "schema.bases:read" scope.')
        console.error('   Update your Personal Access Token in Airtable.')
        process.exit(1)
      }
      throw new Error(`Failed to fetch tables: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const tables: TableInfo[] = data.tables || []

    console.log(`✅ Found ${tables.length} tables in base\n`)
    return tables
  } catch (error: any) {
    console.error('❌ Error fetching tables:', error.message)
    process.exit(1)
  }
}

function findTable(tables: TableInfo[], searchNames: string[]): TableInfo | null {
  for (const table of tables) {
    const tableNameLower = table.name.toLowerCase()
    for (const searchName of searchNames) {
      if (tableNameLower === searchName.toLowerCase() || 
          tableNameLower.includes(searchName.toLowerCase())) {
        return table
      }
    }
  }
  return null
}

function updateEnvFile(tables: TableInfo[]): void {
  console.log('📝 Updating server/.env file...\n')

  // Find relevant tables
  const userTable = findTable(tables, ['user table', 'users', 'user'])
  const companiesTable = findTable(tables, ['companies', 'company'])
  const applicationListTable = findTable(tables, ['application list', 'applications', 'application'])
  const userRolesTable = findTable(tables, ['user roles', 'user role', 'roles'])
  const modulesTable = findTable(tables, ['modules', 'module', 'application list'])

  // Display found tables
  console.log('📋 Found Tables:')
  if (userTable) {
    console.log(`   ✅ User Table: "${userTable.name}" (ID: ${userTable.id})`)
  } else {
    console.log(`   ⚠️  User Table: NOT FOUND (searched for: user table, users, user)`)
  }

  if (companiesTable) {
    console.log(`   ✅ Companies: "${companiesTable.name}" (ID: ${companiesTable.id})`)
  } else {
    console.log(`   ⚠️  Companies: NOT FOUND (searched for: companies, company)`)
  }

  if (applicationListTable) {
    console.log(`   ✅ Application List: "${applicationListTable.name}" (ID: ${applicationListTable.id})`)
  } else {
    console.log(`   ⚠️  Application List: NOT FOUND`)
  }

  if (userRolesTable) {
    console.log(`   ✅ User Roles: "${userRolesTable.name}" (ID: ${userRolesTable.id})`)
  } else {
    console.log(`   ⚠️  User Roles: NOT FOUND`)
  }

  if (modulesTable) {
    console.log(`   ✅ Modules: "${modulesTable.name}" (ID: ${modulesTable.id})`)
  } else {
    console.log(`   ⚠️  Modules: NOT FOUND`)
  }

  console.log('\n📋 All Available Tables:')
  tables.forEach((table, index) => {
    console.log(`   ${index + 1}. "${table.name}" (ID: ${table.id})`)
  })

  // Update .env content
  let updatedContent = envContent

  // Update User Table
  if (userTable) {
    // Update or add AIRTABLE_USER_TABLE_TABLE_ID
    if (updatedContent.includes('AIRTABLE_USER_TABLE_TABLE_ID=')) {
      updatedContent = updatedContent.replace(
        /AIRTABLE_USER_TABLE_TABLE_ID=.*/,
        `AIRTABLE_USER_TABLE_TABLE_ID=${userTable.id}`
      )
    } else {
      // Add after AIRTABLE_SYSTEM_CONFIG_BASE_ID
      updatedContent = updatedContent.replace(
        /(AIRTABLE_SYSTEM_CONFIG_BASE_ID=.*)/,
        `$1\nAIRTABLE_USER_TABLE_TABLE_ID=${userTable.id}`
      )
    }

    // Update or add AIRTABLE_USER_TABLE_TABLE_NAME
    if (updatedContent.includes('AIRTABLE_USER_TABLE_TABLE_NAME=')) {
      updatedContent = updatedContent.replace(
        /AIRTABLE_USER_TABLE_TABLE_NAME=.*/,
        `AIRTABLE_USER_TABLE_TABLE_NAME=${userTable.name}`
      )
    } else {
      updatedContent = updatedContent.replace(
        /(AIRTABLE_USER_TABLE_TABLE_ID=.*)/,
        `$1\nAIRTABLE_USER_TABLE_TABLE_NAME=${userTable.name}`
      )
    }
  }

  // Update Companies Table
  if (companiesTable) {
    if (updatedContent.includes('AIRTABLE_COMPANY_TABLE_ID=')) {
      updatedContent = updatedContent.replace(
        /AIRTABLE_COMPANY_TABLE_ID=.*/,
        `AIRTABLE_COMPANY_TABLE_ID=${companiesTable.id}`
      )
    } else {
      updatedContent = updatedContent.replace(
        /(AIRTABLE_USER_TABLE_TABLE_NAME=.*)/,
        `$1\nAIRTABLE_COMPANY_TABLE_ID=${companiesTable.id}`
      )
    }

    if (updatedContent.includes('AIRTABLE_COMPANY_TABLE_NAME=')) {
      updatedContent = updatedContent.replace(
        /AIRTABLE_COMPANY_TABLE_NAME=.*/,
        `AIRTABLE_COMPANY_TABLE_NAME=${companiesTable.name}`
      )
    } else {
      updatedContent = updatedContent.replace(
        /(AIRTABLE_COMPANY_TABLE_ID=.*)/,
        `$1\nAIRTABLE_COMPANY_TABLE_NAME=${companiesTable.name}`
      )
    }
  }

  // Update Application List Table
  if (applicationListTable) {
    if (updatedContent.includes('AIRTABLE_APPLICATION_LIST_TABLE_ID=')) {
      updatedContent = updatedContent.replace(
        /AIRTABLE_APPLICATION_LIST_TABLE_ID=.*/,
        `AIRTABLE_APPLICATION_LIST_TABLE_ID=${applicationListTable.id}`
      )
    } else {
      updatedContent += `\nAIRTABLE_APPLICATION_LIST_TABLE_ID=${applicationListTable.id}`
    }

    if (updatedContent.includes('AIRTABLE_APPLICATION_LIST_TABLE_NAME=')) {
      updatedContent = updatedContent.replace(
        /AIRTABLE_APPLICATION_LIST_TABLE_NAME=.*/,
        `AIRTABLE_APPLICATION_LIST_TABLE_NAME=${applicationListTable.name}`
      )
    } else {
      updatedContent += `\nAIRTABLE_APPLICATION_LIST_TABLE_NAME=${applicationListTable.name}`
    }
  }

  // Update User Roles Table
  if (userRolesTable) {
    if (updatedContent.includes('AIRTABLE_USER_ROLES_TABLE_ID=')) {
      updatedContent = updatedContent.replace(
        /AIRTABLE_USER_ROLES_TABLE_ID=.*/,
        `AIRTABLE_USER_ROLES_TABLE_ID=${userRolesTable.id}`
      )
    } else {
      updatedContent += `\nAIRTABLE_USER_ROLES_TABLE_ID=${userRolesTable.id}`
    }

    if (updatedContent.includes('AIRTABLE_USER_ROLES_TABLE_NAME=')) {
      updatedContent = updatedContent.replace(
        /AIRTABLE_USER_ROLES_TABLE_NAME=.*/,
        `AIRTABLE_USER_ROLES_TABLE_NAME=${userRolesTable.name}`
      )
    } else {
      updatedContent += `\nAIRTABLE_USER_ROLES_TABLE_NAME=${userRolesTable.name}`
    }
  }

  // Update Modules Table (usually same as Application List)
  if (modulesTable) {
    if (updatedContent.includes('AIRTABLE_MODULES_TABLE_ID=')) {
      updatedContent = updatedContent.replace(
        /AIRTABLE_MODULES_TABLE_ID=.*/,
        `AIRTABLE_MODULES_TABLE_ID=${modulesTable.id}`
      )
    } else {
      updatedContent += `\nAIRTABLE_MODULES_TABLE_ID=${modulesTable.id}`
    }

    if (updatedContent.includes('AIRTABLE_MODULES_TABLE_NAME=')) {
      updatedContent = updatedContent.replace(
        /AIRTABLE_MODULES_TABLE_NAME=.*/,
        `AIRTABLE_MODULES_TABLE_NAME=${modulesTable.name}`
      )
    } else {
      updatedContent += `\nAIRTABLE_MODULES_TABLE_NAME=${modulesTable.name}`
    }
  }

  // Write updated content
  fs.writeFileSync(envPath, updatedContent, 'utf-8')
  console.log('\n✅ Updated server/.env file successfully!')
  console.log('\n📋 Next steps:')
  console.log('   1. Review the updated server/.env file')
  console.log('   2. Restart your backend server')
  console.log('   3. Test: curl http://localhost:3001/api/tables/users/field-mapping')
}

async function main() {
  console.log('🚀 Fetching Table IDs from Airtable\n')
  console.log('='.repeat(60) + '\n')

  const tables = await fetchTableIds()
  updateEnvFile(tables)

  console.log('\n' + '='.repeat(60))
  console.log('✅ Done!')
}

main().catch(console.error)

