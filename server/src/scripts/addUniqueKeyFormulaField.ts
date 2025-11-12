/**
 * Script to add "Unique Key" formula field to User Preferences table in Airtable
 * 
 * This script adds the "Unique Key" formula field which is used for efficient lookups.
 * 
 * Run with: npx tsx server/src/scripts/addUniqueKeyFormulaField.ts
 */

import dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') })
dotenv.config()

async function addUniqueKeyFormulaField() {
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

  const tableName = 'User Preferences'

  try {
    console.log('🔍 Checking User Preferences table...')

    // Get table metadata using Metadata API
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
      process.exit(1)
    }

    // Check if Unique Key field already exists
    const uniqueKeyField = preferencesTable.fields.find((f: any) => 
      f.name === 'Unique Key' || f.name === 'uniqueKey' || f.name.toLowerCase() === 'unique key'
    )

    if (uniqueKeyField) {
      console.log('✅ "Unique Key" formula field already exists')
      return
    }

    console.log('➕ Adding "Unique Key" formula field...')

    // Get field IDs for the formula
    const userIdField = preferencesTable.fields.find((f: any) => f.name === 'User Id')
    const namespaceField = preferencesTable.fields.find((f: any) => f.name === 'Namespace')
    const tableIdField = preferencesTable.fields.find((f: any) => f.name === 'Table Id')
    const scopeIdField = preferencesTable.fields.find((f: any) => f.name === 'Scope Id')
    const keyField = preferencesTable.fields.find((f: any) => f.name === 'Key')

    if (!userIdField || !namespaceField || !keyField) {
      console.error('❌ Error: Required fields (User Id, Namespace, Key) not found')
      process.exit(1)
    }

    // Build the formula
    // CONCATENATE({User Id}, "::", {Namespace}, "::", IF({Table Id}, {Table Id}, ""), "::", IF({Scope Id}, {Scope Id}, ""), "::", {Key})
    const formula = `CONCATENATE(
      {${userIdField.name}}, 
      "::", 
      {${namespaceField.name}}, 
      "::", 
      IF({${tableIdField?.name || 'Table Id'}}, {${tableIdField?.name || 'Table Id'}}, ""), 
      "::", 
      IF({${scopeIdField?.name || 'Scope Id'}}, {${scopeIdField?.name || 'Scope Id'}}, ""), 
      "::", 
      {${keyField.name}}
    )`

    // Add the formula field
    const addFieldUrl = `https://api.airtable.com/v0/meta/bases/${baseId}/tables/${preferencesTable.id}/fields`
    const addResponse = await fetch(addFieldUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Unique Key',
        type: 'formula',
        options: {
          formula: formula.replace(/\s+/g, ' ').trim(),
          referencedFieldIds: [
            userIdField.id,
            namespaceField.id,
            tableIdField?.id,
            scopeIdField?.id,
            keyField.id,
          ].filter(Boolean),
        },
      }),
    })

    if (!addResponse.ok) {
      const errorData = await addResponse.json().catch(() => ({}))
      console.error('❌ Failed to add Unique Key field:', errorData)
      
      // If formula field creation fails, provide manual instructions
      console.log('\n💡 Manual creation required:')
      console.log('   1. In Airtable, go to the "User Preferences" table')
      console.log('   2. Click "+ Add field" → "Formula"')
      console.log('   3. Name it "Unique Key"')
      console.log('   4. Use this formula:')
      console.log(`      CONCATENATE({User Id}, "::", {Namespace}, "::", IF({Table Id}, {Table Id}, ""), "::", IF({Scope Id}, {Scope Id}, ""), "::", {Key})`)
      
      throw new Error(`Failed to add Unique Key field: ${addResponse.statusText} - ${JSON.stringify(errorData)}`)
    }

    console.log('✅ Successfully added "Unique Key" formula field!')

  } catch (error) {
    console.error('❌ Error adding Unique Key field:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
    }
    process.exit(1)
  }
}

// Run the script
addUniqueKeyFormulaField()
  .then(() => {
    console.log('\n✨ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })

