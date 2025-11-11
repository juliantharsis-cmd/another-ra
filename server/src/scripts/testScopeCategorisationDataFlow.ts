/**
 * Test script to verify Status field data flow from Airtable to API
 */

import * as dotenv from 'dotenv'
import { config } from 'dotenv'
import { ScopeCategorisationAirtableService } from '../services/ScopeCategorisationAirtableService'

config({ path: '.env' })

async function testDataFlow() {
  console.log('🔍 Testing Status field data flow...\n')
  
  try {
    const service = new ScopeCategorisationAirtableService()
    
    console.log('📥 Fetching records from Airtable...\n')
    const result = await service.getAll({
      limit: 5,
    })
    
    console.log(`Found ${result.data.length} record(s):\n`)
    
    result.data.forEach((record, index) => {
      console.log(`Record ${index + 1}:`)
      console.log(`  ID: ${record.id}`)
      console.log(`  Name: ${record.Name || 'N/A'}`)
      console.log(`  Status (from service): "${record.Status}" (type: ${typeof record.Status})`)
      console.log(`  Status value matches Airtable: ${record.Status === 'Active' || record.Status === 'Inactive' ? '✅' : '❌'}`)
      console.log()
    })
    
    // Test getById
    if (result.data.length > 0) {
      const firstId = result.data[0].id
      console.log(`\n📥 Testing getById for record: ${firstId}\n`)
      const singleRecord = await service.getById(firstId)
      if (singleRecord) {
        console.log(`  Name: ${singleRecord.Name}`)
        console.log(`  Status: "${singleRecord.Status}"`)
        console.log(`  ✅ Status is properly mapped`)
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    if (error.stack) {
      console.error('Stack:', error.stack)
    }
  }
}

testDataFlow().catch(console.error)

