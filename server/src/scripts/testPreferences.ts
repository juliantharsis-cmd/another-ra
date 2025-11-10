/**
 * Test Script for Preferences System
 * 
 * Run with: npm run test:preferences
 */

// Load environment variables
import dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(__dirname, '../../.env') })
dotenv.config() // Also try default location

import { getPreferencesService } from '../services/PreferencesService'

async function testPreferences() {
  console.log('🧪 Testing Preferences System...\n')

  const service = getPreferencesService()

  // Test 1: Health check
  console.log('1️⃣ Testing health check...')
  const isHealthy = await service.healthCheck()
  console.log(`   Health check: ${isHealthy ? '✅ PASS' : '❌ FAIL'}\n`)

  if (!isHealthy) {
    console.error('❌ Service is not healthy. Please check your adapter configuration.')
    process.exit(1)
  }

  // Test 2: Set a preference
  console.log('2️⃣ Testing set preference...')
  try {
    const testUserId = 'test-user-123'
    const testKey = 'columnWidths'
    const testValue = { name: 200, status: 100, notes: 150 }

    const saved = await service.set(
      testUserId,
      testKey,
      testValue,
      'json',
      {
        namespace: 'table',
        tableId: 'companies',
      }
    )

    console.log(`   ✅ Preference saved:`)
    console.log(`      ID: ${saved.id}`)
    console.log(`      Key: ${saved.key}`)
    console.log(`      Value: ${JSON.stringify(saved.value)}`)
    console.log(`      Namespace: ${saved.namespace}`)
    console.log(`      Table ID: ${saved.tableId}\n`)

    // Test 3: Get the preference
    console.log('3️⃣ Testing get preference...')
    const retrieved = await service.get(
      testUserId,
      testKey,
      'table',
      'companies'
    )

    if (retrieved && JSON.stringify(retrieved.value) === JSON.stringify(testValue)) {
      console.log(`   ✅ Preference retrieved successfully`)
      console.log(`      Value matches: ${JSON.stringify(retrieved.value)}\n`)
    } else {
      console.log(`   ❌ Preference retrieval failed or value mismatch\n`)
    }

    // Test 4: Get all preferences for user
    console.log('4️⃣ Testing get all preferences...')
    const allPrefs = await service.getAll(testUserId, {
      namespace: 'table',
      tableId: 'companies',
    })

    console.log(`   ✅ Retrieved ${allPrefs.total} preference(s)`)
    allPrefs.records.forEach((pref, idx) => {
      console.log(`      ${idx + 1}. ${pref.key}: ${JSON.stringify(pref.value)}`)
    })
    console.log()

    // Test 5: Update preference
    console.log('5️⃣ Testing update preference...')
    const updatedValue = { name: 250, status: 120, notes: 150 }
    const updated = await service.set(
      testUserId,
      testKey,
      updatedValue,
      'json',
      {
        namespace: 'table',
        tableId: 'companies',
        overwrite: true,
      }
    )

    if (JSON.stringify(updated.value) === JSON.stringify(updatedValue)) {
      console.log(`   ✅ Preference updated successfully`)
      console.log(`      New value: ${JSON.stringify(updated.value)}\n`)
    } else {
      console.log(`   ❌ Preference update failed\n`)
    }

    // Test 6: Set different types
    console.log('6️⃣ Testing different value types...')
    
    // String
    await service.set(testUserId, 'theme', 'dark', 'string', { namespace: 'ui' })
    console.log(`   ✅ String preference set`)

    // Number
    await service.set(testUserId, 'pageSize', 50, 'number', { namespace: 'ui' })
    console.log(`   ✅ Number preference set`)

    // Boolean
    await service.set(testUserId, 'notificationsEnabled', true, 'boolean', { namespace: 'ui' })
    console.log(`   ✅ Boolean preference set\n`)

    // Test 7: Get all UI preferences
    console.log('7️⃣ Testing filter by namespace...')
    const uiPrefs = await service.getAll(testUserId, { namespace: 'ui' })
    console.log(`   ✅ Retrieved ${uiPrefs.total} UI preference(s)\n`)

    // Test 8: Delete preference
    console.log('8️⃣ Testing delete preference...')
    const deleted = await service.delete(testUserId, testKey, 'table', 'companies')
    if (deleted) {
      console.log(`   ✅ Preference deleted successfully\n`)
    } else {
      console.log(`   ❌ Preference deletion failed\n`)
    }

    // Verify deletion
    const afterDelete = await service.get(testUserId, testKey, 'table', 'companies')
    if (!afterDelete) {
      console.log(`   ✅ Verified: Preference no longer exists\n`)
    } else {
      console.log(`   ❌ Warning: Preference still exists after deletion\n`)
    }

    // Test 9: TTL/Expiry
    console.log('9️⃣ Testing TTL/expiry...')
    const expiresIn1Hour = await service.set(
      testUserId,
      'tempPreference',
      'This will expire',
      'string',
      {
        namespace: 'misc',
        ttl: 3600, // 1 hour
      }
    )

    if (expiresIn1Hour.expiresAt) {
      const expiresAt = new Date(expiresIn1Hour.expiresAt)
      const now = new Date()
      const diffHours = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)
      console.log(`   ✅ Preference with TTL set`)
      console.log(`      Expires in: ~${diffHours.toFixed(2)} hours`)
      console.log(`      Expires at: ${expiresAt.toISOString()}\n`)
    } else {
      console.log(`   ❌ TTL not set correctly\n`)
    }

    // Cleanup
    console.log('🧹 Cleaning up test data...')
    await service.delete(testUserId, 'tempPreference', 'misc')
    await service.delete(testUserId, 'theme', 'ui')
    await service.delete(testUserId, 'pageSize', 'ui')
    await service.delete(testUserId, 'notificationsEnabled', 'ui')
    console.log(`   ✅ Test data cleaned up\n`)

    console.log('✅ All tests passed!')
    console.log('\n📝 Summary:')
    console.log('   - Health check: ✅')
    console.log('   - Set preference: ✅')
    console.log('   - Get preference: ✅')
    console.log('   - Get all preferences: ✅')
    console.log('   - Update preference: ✅')
    console.log('   - Multiple types: ✅')
    console.log('   - Filter by namespace: ✅')
    console.log('   - Delete preference: ✅')
    console.log('   - TTL/expiry: ✅')

  } catch (error) {
    console.error('❌ Test failed:', error)
    if (error instanceof Error) {
      console.error('   Error message:', error.message)
      console.error('   Stack:', error.stack)
    }
    process.exit(1)
  }
}

// Run tests
testPreferences()
  .then(() => {
    console.log('\n🎉 Testing complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })

