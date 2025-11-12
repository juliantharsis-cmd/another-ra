/**
 * Script to add Preferences system fields to User Preferences table in Airtable
 * 
 * This script adds the required fields for the Preferences system to work:
 * - Namespace (singleSelect with options: ui, table, filters, featureFlags, misc, ai)
 * - Key (singleLineText)
 * - Table Id (singleLineText, optional)
 * - Scope Id (singleLineText, optional)
 * - Type (singleSelect with options: string, number, boolean, json)
 * - Value (text) (multilineText)
 * - Value (number) (number)
 * - Value (boolean) (checkbox)
 * - Visibility (singleSelect with options: private, org, global)
 * - Expires At (dateTime)
 * - Unique Key (formula field)
 * 
 * Run with: npx tsx server/src/scripts/addPreferencesFieldsToTable.ts
 */

import dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') })
dotenv.config()

async function addPreferencesFields() {
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
      console.log('💡 Please create the table first')
      process.exit(1)
    }

    console.log(`✅ Found table "${tableName}"`)
    console.log(`📋 Current fields: ${preferencesTable.fields.map((f: any) => f.name).join(', ')}`)

    const existingFieldNames = preferencesTable.fields.map((f: any) => f.name)
    const fieldsToAdd = []

    // Define all fields that need to be added
    const requiredFields = [
      {
        name: 'Namespace',
        type: 'singleSelect',
        options: {
          choices: [
            { name: 'ui', color: 'blueLight2' },
            { name: 'table', color: 'greenLight2' },
            { name: 'filters', color: 'orangeLight2' },
            { name: 'featureFlags', color: 'purpleLight2' },
            { name: 'misc', color: 'grayLight2' },
            { name: 'ai', color: 'purpleLight2' },
          ],
        },
      },
      {
        name: 'Key',
        type: 'singleLineText',
      },
      {
        name: 'Table Id',
        type: 'singleLineText',
      },
      {
        name: 'Scope Id',
        type: 'singleLineText',
      },
      {
        name: 'Type',
        type: 'singleSelect',
        options: {
          choices: [
            { name: 'string', color: 'blueLight2' },
            { name: 'number', color: 'greenLight2' },
            { name: 'boolean', color: 'orangeLight2' },
            { name: 'json', color: 'purpleLight2' },
          ],
        },
      },
      {
        name: 'Value (text)',
        type: 'multilineText',
      },
      {
        name: 'Value (number)',
        type: 'number',
        options: {
          precision: 3,
        },
      },
      {
        name: 'Value (boolean)',
        type: 'checkbox',
        options: {
          color: 'greenBright',
          icon: 'check',
        },
      },
      {
        name: 'Visibility',
        type: 'singleSelect',
        options: {
          choices: [
            { name: 'private', color: 'grayLight2' },
            { name: 'org', color: 'blueLight2' },
            { name: 'global', color: 'greenLight2' },
          ],
        },
      },
      {
        name: 'Expires At',
        type: 'dateTime',
        options: {
          timeZone: 'utc',
          dateFormat: { name: 'iso' },
          timeFormat: { name: '24hour' },
        },
      },
    ]

    // Check which fields need to be added
    for (const field of requiredFields) {
      if (!existingFieldNames.includes(field.name)) {
        fieldsToAdd.push(field)
        console.log(`➕ Will add field: ${field.name} (${field.type})`)
      } else {
        console.log(`✅ Field already exists: ${field.name}`)
      }
    }

    if (fieldsToAdd.length === 0) {
      console.log('\n✅ All required fields already exist!')
      
      // Check if Unique Key formula field exists
      const uniqueKeyField = preferencesTable.fields.find((f: any) => 
        f.name === 'Unique Key' || f.name === 'uniqueKey' || f.name.toLowerCase() === 'unique key'
      )
      
      if (!uniqueKeyField) {
        console.log('\n⚠️  Note: "Unique Key" formula field is missing.')
        console.log('💡 You can create it manually in Airtable with this formula:')
        console.log('   CONCATENATE({User Id}, "::", {Namespace}, "::", IF({Table Id}, {Table Id}, ""), "::", IF({Scope Id}, {Scope Id}, ""), "::", {Key})')
      } else {
        console.log('✅ Unique Key formula field exists')
      }
      
      return
    }

    console.log(`\n📝 Adding ${fieldsToAdd.length} field(s)...`)

    // Add fields one by one (Airtable API requires individual requests)
    for (const field of fieldsToAdd) {
      const addFieldUrl = `https://api.airtable.com/v0/meta/bases/${baseId}/tables/${preferencesTable.id}/fields`
      const addResponse = await fetch(addFieldUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(field),
      })

      if (!addResponse.ok) {
        const errorData = await addResponse.json().catch(() => ({}))
        console.error(`❌ Failed to add field "${field.name}":`, errorData)
        throw new Error(`Failed to add field "${field.name}": ${addResponse.statusText} - ${JSON.stringify(errorData)}`)
      }

      console.log(`✅ Added field: ${field.name}`)
    }

    console.log('\n✅ Successfully added all required fields!')
    console.log('\n💡 Next steps:')
    console.log('   1. In Airtable, create a "Unique Key" formula field with:')
    console.log('      CONCATENATE({User Id}, "::", {Namespace}, "::", IF({Table Id}, {Table Id}, ""), "::", IF({Scope Id}, {Scope Id}, ""), "::", {Key})')
    console.log('   2. Set "User Id" and "Key" fields as required (if not already)')
    console.log('   3. Set default value for "Visibility" to "private" (optional)')

  } catch (error) {
    console.error('❌ Error adding fields:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
    }
    process.exit(1)
  }
}

// Run the script
addPreferencesFields()
  .then(() => {
    console.log('\n✨ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })

