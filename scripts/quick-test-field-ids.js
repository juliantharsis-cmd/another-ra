/**
 * Quick Test Script - Copy and paste into browser console
 * 
 * This tests the Field ID mapping system quickly
 */

(async function quickTest() {
  console.clear()
  console.log('🧪 Quick Field ID Test\n')
  console.log('='.repeat(50) + '\n')

  try {
    // Import
    const { fetchFieldMapping, getFieldId } = await import('/src/lib/fieldIdMapping.ts')
    const { getTablePreferences, saveTablePreferences } = await import('/src/lib/tablePreferences.ts')
    
    // Step 1: Fetch mapping
    console.log('📥 Step 1: Fetching field mapping...')
    const mapping = await fetchFieldMapping('Users')
    console.log(`✅ Fetched ${mapping.fields.length} fields`)
    console.log(`   Email Field ID: ${mapping.fieldKeyToId['Email']}\n`)

    // Step 2: Test save
    console.log('💾 Step 2: Saving test preferences...')
    const testPrefs = {
      columnVisibility: { 'Email': true, 'First Name': false, 'Last Name': true },
      columnOrder: ['Email', 'First Name', 'Last Name'],
      defaultSort: { field: 'Email', order: 'asc' }
    }
    saveTablePreferences('Users', testPrefs)
    console.log('✅ Preferences saved\n')

    // Step 3: Check what was saved
    console.log('🔍 Step 3: Checking saved data...')
    const saved = JSON.parse(localStorage.getItem('table_prefs_Users') || '{}')
    console.log(`   Using Field IDs? ${saved._usingFieldIds ? '✅ YES' : '❌ NO'}`)
    console.log(`   Visibility keys:`, Object.keys(saved.columnVisibility || {}))
    const emailId = getFieldId('Users', 'Email')
    console.log(`   Email visibility (using ID): ${saved.columnVisibility?.[emailId]}\n`)

    // Step 4: Load back
    console.log('📥 Step 4: Loading preferences back...')
    const loaded = getTablePreferences('Users')
    console.log(`   Loaded successfully: ${loaded ? '✅' : '❌'}`)
    console.log(`   Visibility keys (should be field names):`, Object.keys(loaded?.columnVisibility || {}))
    console.log(`   Email visible: ${loaded?.columnVisibility?.['Email']}\n`)

    // Summary
    console.log('='.repeat(50))
    console.log('📊 Test Results:')
    console.log(`   ✅ Field mapping: Working`)
    console.log(`   ✅ Save with Field IDs: ${saved._usingFieldIds ? 'YES' : 'NO'}`)
    console.log(`   ✅ Load with field names: ${loaded?.columnVisibility?.['Email'] !== undefined ? 'YES' : 'NO'}`)
    console.log('\n🎉 Test complete! Now test in UI (Step 3)')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
})()

