/**
 * Test script to list all accessible Airtable bases/apps
 * 
 * This will help us understand what data is available for the table creation workflow
 */

import dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') })
dotenv.config()

const API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY

if (!API_KEY) {
  console.error('❌ AIRTABLE_PERSONAL_ACCESS_TOKEN or AIRTABLE_API_KEY is required')
  process.exit(1)
}

async function listBases() {
  console.log('🔍 Fetching all accessible Airtable bases/apps...\n')

  try {
    const response = await fetch('https://api.airtable.com/v0/meta/bases', {
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
      throw new Error(`Failed to fetch bases: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const bases = data.bases || []

    console.log(`✅ Found ${bases.length} accessible base(s)/app(s):\n`)
    
    bases.forEach((base: any, index: number) => {
      console.log(`${index + 1}. ${base.name || 'Unnamed'}`)
      console.log(`   ID: ${base.id}`)
      if (base.permissionLevel) {
        console.log(`   Permission: ${base.permissionLevel}`)
      }
      console.log('')
    })

    // Check if we can see workspace information
    if (data.workspaces) {
      console.log('\n📋 Workspace Information:')
      console.log(JSON.stringify(data.workspaces, null, 2))
    }

    // Show full response structure for debugging
    console.log('\n📋 Full API Response Structure:')
    console.log(JSON.stringify(data, null, 2))

  } catch (error: any) {
    console.error('❌ Error fetching bases:', error.message)
    process.exit(1)
  }
}

listBases()

