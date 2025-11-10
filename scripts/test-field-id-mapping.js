/**
 * Test Script for Field ID Mapping System
 * 
 * Run this in browser console or as a Node.js script to test the Field ID mapping system.
 * 
 * Usage in browser:
 * 1. Open browser console (F12)
 * 2. Copy and paste this entire script
 * 3. Run: await testFieldIdMapping()
 */

async function testFieldIdMapping() {
  console.log('🧪 Starting Field ID Mapping Tests...\n')
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  }
  
  function test(name, fn) {
    return async () => {
      try {
        console.log(`\n📋 Test: ${name}`)
        await fn()
        console.log(`✅ PASSED: ${name}`)
        results.passed++
        results.tests.push({ name, status: 'passed' })
      } catch (error) {
        console.error(`❌ FAILED: ${name}`, error)
        results.failed++
        results.tests.push({ name, status: 'failed', error: error.message })
      }
    }
  }
  
  // Import functions (adjust path based on your setup)
  // For browser: These should be available via imports
  // For Node.js: You'll need to import them differently
  
  // Test 1: Fetch Field Mapping
  await test('Fetch Field Mapping', async () => {
    const { fetchFieldMapping, getFieldMapping } = await import('/src/lib/fieldIdMapping.ts')
    
    const mapping = await fetchFieldMapping('users')
    if (!mapping) throw new Error('Mapping not fetched')
    if (!mapping.fieldKeyToId) throw new Error('fieldKeyToId missing')
    if (!mapping.fieldIdToKey) throw new Error('fieldIdToKey missing')
    if (mapping.fields.length === 0) throw new Error('No fields in mapping')
    
    console.log(`   Found ${mapping.fields.length} fields`)
    console.log(`   Example: Email -> ${mapping.fieldKeyToId['Email'] || 'NOT FOUND'}`)
  })()
  
  // Test 2: Cache Field Mapping
  await test('Cache Field Mapping', async () => {
    const { getFieldMapping } = await import('/src/lib/fieldIdMapping.ts')
    
    const cached = getFieldMapping('users')
    if (!cached) throw new Error('Mapping not cached')
    if (cached.fields.length === 0) throw new Error('Cached mapping has no fields')
    
    console.log(`   Cached mapping has ${cached.fields.length} fields`)
  })()
  
  // Test 3: Convert Field Keys to IDs
  await test('Convert Field Keys to IDs', async () => {
    const { getFieldId, convertPreferencesToFieldIds } = await import('/src/lib/fieldIdMapping.ts')
    
    const emailId = getFieldId('users', 'Email')
    if (!emailId) throw new Error('Email field ID not found')
    if (!emailId.startsWith('fld')) throw new Error('Field ID format incorrect')
    
    const prefs = {
      columnVisibility: { 'Email': true, 'First Name': false },
      columnOrder: ['Email', 'First Name'],
      defaultSort: { field: 'Email', order: 'asc' }
    }
    
    const converted = convertPreferencesToFieldIds('users', prefs)
    if (!converted.columnVisibility[emailId]) throw new Error('Email visibility not converted')
    if (!converted.columnOrder.includes(emailId)) throw new Error('Email order not converted')
    if (converted.defaultSort?.field !== emailId) throw new Error('Email sort not converted')
    
    console.log(`   Email converted to: ${emailId}`)
  })()
  
  // Test 4: Convert Field IDs Back to Keys
  await test('Convert Field IDs to Keys', async () => {
    const { getFieldId, getFieldKey, convertPreferencesFromFieldIds } = await import('/src/lib/fieldIdMapping.ts')
    
    const emailId = getFieldId('users', 'Email')
    if (!emailId) throw new Error('Email field ID not found')
    
    const emailKey = getFieldKey('users', emailId)
    if (emailKey !== 'Email') throw new Error(`Expected 'Email', got '${emailKey}'`)
    
    const prefsWithIds = {
      columnVisibility: { [emailId]: true },
      columnOrder: [emailId],
      defaultSort: { field: emailId, order: 'asc' }
    }
    
    const converted = convertPreferencesFromFieldIds('users', prefsWithIds)
    if (converted.columnVisibility['Email'] !== true) throw new Error('Email visibility not converted back')
    if (converted.columnOrder[0] !== 'Email') throw new Error('Email order not converted back')
    if (converted.defaultSort?.field !== 'Email') throw new Error('Email sort not converted back')
    
    console.log(`   ${emailId} converted back to: ${converted.columnOrder[0]}`)
  })()
  
  // Test 5: Save Preferences with Field IDs
  await test('Save Preferences with Field IDs', async () => {
    const { saveTablePreferences, getTablePreferences } = await import('/src/lib/tablePreferences.ts')
    
    const prefs = {
      columnVisibility: { 'Email': true, 'First Name': true },
      columnOrder: ['Email', 'First Name'],
      defaultSort: { field: 'Email', order: 'asc' }
    }
    
    saveTablePreferences('users', prefs)
    
    const saved = JSON.parse(localStorage.getItem('table_prefs_users') || '{}')
    if (!saved._usingFieldIds) throw new Error('_usingFieldIds flag not set')
    
    const loaded = getTablePreferences('users')
    if (!loaded) throw new Error('Preferences not loaded')
    if (loaded.columnVisibility['Email'] !== true) throw new Error('Email visibility not preserved')
    
    console.log(`   Preferences saved and loaded successfully`)
  })()
  
  // Test 6: Computed Fields
  await test('Handle Computed Fields', async () => {
    const { isComputedField, convertPreferencesToFieldIds } = await import('/src/lib/fieldIdMapping.ts')
    
    if (!isComputedField('CompanyName')) throw new Error('CompanyName should be computed')
    if (isComputedField('Email')) throw new Error('Email should not be computed')
    
    const prefs = {
      columnVisibility: { 'Email': true, 'CompanyName': true },
      columnOrder: ['Email', 'CompanyName']
    }
    
    const converted = convertPreferencesToFieldIds('users', prefs)
    if (!converted.columnVisibility['CompanyName']) throw new Error('CompanyName should remain as key')
    if (converted.columnOrder.includes('CompanyName')) {
      console.log(`   Computed field 'CompanyName' preserved as key`)
    }
  })()
  
  // Print Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Test Results Summary')
  console.log('='.repeat(50))
  console.log(`✅ Passed: ${results.passed}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`📋 Total:  ${results.passed + results.failed}`)
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:')
    results.tests
      .filter(t => t.status === 'failed')
      .forEach(t => console.log(`   - ${t.name}: ${t.error}`))
  }
  
  console.log('\n' + '='.repeat(50))
  
  return results
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testFieldIdMapping }
}

// Auto-run in browser console
if (typeof window !== 'undefined') {
  console.log('🧪 Field ID Mapping Test Script Loaded')
  console.log('Run: await testFieldIdMapping()')
}

