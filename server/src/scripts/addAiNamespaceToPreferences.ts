/**
 * Script to add 'ai' namespace option to User Preferences table in Airtable
 * 
 * This script updates the "Namespace" field in the "User Preferences" table
 * to include 'ai' as a valid option for AI Agent Profiles.
 * 
 * Run with: npx tsx server/src/scripts/addAiNamespaceToPreferences.ts
 */

import Airtable from 'airtable'
import dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') })
dotenv.config()

async function addAiNamespace() {
  const apiKey = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY
  const baseId = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID

  if (!apiKey) {
    console.error('❌ Error: AIRTABLE_PERSONAL_ACCESS_TOKEN or AIRTABLE_API_KEY is required')
    process.exit(1)
  }

  if (!baseId) {
    console.error('❌ Error: AIRTABLE_SYSTEM_CONFIG_BASE_ID is required')
    process.exit(1)
  }

  Airtable.configure({ apiKey })
  const base = Airtable.base(baseId)
  const tableName = 'User Preferences'

  try {
    console.log('🔍 Checking User Preferences table...')

    // Get the table
    const table = base(tableName)

    // Get table schema using Metadata API
    const metadataUrl = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`
    const response = await fetch(metadataUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch table metadata: ${response.statusText}`)
    }

    const metadata = await response.json()
    const preferencesTable = metadata.tables.find((t: any) => t.name === tableName)

    if (!preferencesTable) {
      console.error(`❌ Error: Table "${tableName}" not found in base`)
      console.log('💡 Please create the table first using the create-preferences-table.js script')
      console.log('\n📋 Available tables in base:')
      metadata.tables.forEach((t: any) => console.log(`   - ${t.name}`))
      process.exit(1)
    }

    console.log(`✅ Found table "${tableName}"`)
    console.log(`📋 Available fields in "${tableName}":`)
    preferencesTable.fields.forEach((f: any) => {
      console.log(`   - ${f.name} (${f.type})`)
    })

    // Find the Namespace field (try different possible names)
    let namespaceField = preferencesTable.fields.find((f: any) => 
      f.name === 'Namespace' || 
      f.name === 'namespace' || 
      f.name.toLowerCase() === 'namespace'
    )

    if (!namespaceField) {
      console.error('\n❌ Error: "Namespace" field not found in User Preferences table')
      console.log('💡 Please check the field name in Airtable. It should be named "Namespace"')
      console.log('\n📋 Available fields:')
      preferencesTable.fields.forEach((f: any) => {
        console.log(`   - ${f.name} (${f.type})`)
      })
      process.exit(1)
    }

    console.log(`✅ Found "Namespace" field: ${namespaceField.name}`)

    if (namespaceField.type !== 'singleSelect') {
      console.error('❌ Error: "Namespace" field is not a singleSelect field')
      process.exit(1)
    }

    // Check if 'ai' option already exists
    const existingOptions = namespaceField.options.choices.map((c: any) => c.name)
    if (existingOptions.includes('ai')) {
      console.log('✅ "ai" namespace option already exists in the Namespace field')
      return
    }

    console.log('📝 Current namespace options:', existingOptions)
    console.log('➕ Adding "ai" option to Namespace field...')

    // Add 'ai' option to the field
    const updatedChoices = [
      ...namespaceField.options.choices,
      { name: 'ai', color: 'purpleLight2' },
    ]

    // Update the field using Metadata API
    const updateUrl = `https://api.airtable.com/v0/meta/bases/${baseId}/tables/${preferencesTable.id}/fields/${namespaceField.id}`
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        options: {
          choices: updatedChoices,
        },
      }),
    })

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json().catch(() => ({}))
      throw new Error(`Failed to update field: ${updateResponse.statusText} - ${JSON.stringify(errorData)}`)
    }

    console.log('✅ Successfully added "ai" namespace option to User Preferences table')
    console.log('📋 Updated namespace options:', [...existingOptions, 'ai'])

  } catch (error) {
    console.error('❌ Error updating Namespace field:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
    }
    process.exit(1)
  }
}

// Run the script
addAiNamespace()
  .then(() => {
    console.log('✨ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })

