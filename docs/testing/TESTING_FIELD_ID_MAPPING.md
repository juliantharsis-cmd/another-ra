# Testing Guide: Field ID Mapping System

This guide helps you test the Field ID mapping system thoroughly to ensure configurations remain stable even when Airtable field names change.

## Prerequisites

1. **Backend server running** on port 3001
2. **Frontend server running** on port 3000
3. **Airtable credentials configured** in `server/.env`
4. **Access to Airtable Metadata API** (requires `schema.bases:read` scope)

## Test Plan Overview

1. ✅ Backend API Endpoints
2. ✅ Field Mapping Library
3. ✅ Table Preferences Integration
4. ✅ Migration from Field Names
5. ✅ End-to-End User Flow
6. ✅ Edge Cases

---

## 1. Test Backend API Endpoints

### Test 1.1: Fetch Field Mapping for User Table

**Steps:**
```bash
# In terminal
curl http://localhost:3001/api/tables/users/field-mapping
```

**Expected Result:**
- Returns JSON with field mappings
- Contains `fieldKeyToId` and `fieldIdToKey` maps
- Each field has `fieldId`, `fieldKey`, `fieldName`

**Verify:**
- Field IDs are present (e.g., `fldXXX...`)
- Field keys match your table config (e.g., "Email", "First Name")
- Field names match Airtable (e.g., "Email", "First Name")

### Test 1.2: Test with Non-Existent Table

**Steps:**
```bash
curl http://localhost:3001/api/tables/nonexistent/field-mapping
```

**Expected Result:**
- Returns 404 error
- Error message indicates table not found

### Test 1.3: Test with Invalid Table ID

**Steps:**
```bash
curl http://localhost:3001/api/tables/invalid-table-id/field-mapping
```

**Expected Result:**
- Returns 404 or appropriate error
- Handles gracefully

---

## 2. Test Field Mapping Library

### Test 2.1: Fetch and Cache Field Mapping

**Steps:**
1. Open browser console (F12)
2. Run:
```javascript
// Import the function (adjust path if needed)
import { fetchFieldMapping, getFieldMapping } from '@/lib/fieldIdMapping'

// Fetch mapping for users table
const mapping = await fetchFieldMapping('users')
console.log('Fetched mapping:', mapping)

// Check if cached
const cached = getFieldMapping('users')
console.log('Cached mapping:', cached)
```

**Expected Result:**
- Mapping is fetched successfully
- Mapping is cached in localStorage
- Cached mapping matches fetched mapping

**Verify:**
- Check localStorage: `field_id_mapping_users`
- Contains all expected fields
- `lastUpdated` timestamp is recent

### Test 2.2: Convert Field Keys to Field IDs

**Steps:**
```javascript
import { getFieldId, convertPreferencesToFieldIds } from '@/lib/fieldIdMapping'

// Test single field
const emailFieldId = getFieldId('users', 'Email')
console.log('Email Field ID:', emailFieldId)

// Test conversion
const prefs = {
  columnVisibility: { 'Email': true, 'First Name': false },
  columnOrder: ['Email', 'First Name', 'Last Name'],
  defaultSort: { field: 'Email', order: 'asc' }
}

const converted = convertPreferencesToFieldIds('users', prefs)
console.log('Converted preferences:', converted)
```

**Expected Result:**
- Field keys are converted to Field IDs
- Computed fields (ending with "Name") remain as keys
- Structure is preserved

### Test 2.3: Convert Field IDs Back to Field Keys

**Steps:**
```javascript
import { getFieldKey, convertPreferencesFromFieldIds } from '@/lib/fieldIdMapping'

// Get a field ID first
const emailFieldId = getFieldId('users', 'Email')

// Convert back
const emailKey = getFieldKey('users', emailFieldId)
console.log('Email Key:', emailKey) // Should be "Email"

// Test full conversion
const prefsWithIds = {
  columnVisibility: { [emailFieldId]: true },
  columnOrder: [emailFieldId, 'First Name'],
  defaultSort: { field: emailFieldId, order: 'asc' }
}

const converted = convertPreferencesFromFieldIds('users', prefsWithIds)
console.log('Converted back:', converted)
```

**Expected Result:**
- Field IDs are converted back to field keys
- Original structure is restored
- Computed fields remain unchanged

---

## 3. Test Table Preferences Integration

### Test 3.1: Save Preferences with Field IDs

**Steps:**
1. Open browser console
2. Run:
```javascript
import { saveTablePreferences, getTablePreferences } from '@/lib/tablePreferences'

// Save preferences (should convert to Field IDs internally)
const prefs = {
  columnVisibility: { 'Email': true, 'First Name': true },
  columnOrder: ['Email', 'First Name'],
  defaultSort: { field: 'Email', order: 'asc' }
}

saveTablePreferences('users', prefs)

// Check what was actually saved
const saved = localStorage.getItem('table_prefs_users')
console.log('Saved preferences:', JSON.parse(saved))
```

**Expected Result:**
- Preferences are saved
- Field keys are converted to Field IDs in storage
- `_usingFieldIds: true` flag is set
- Legacy backup is created

**Verify:**
- Check localStorage: `table_prefs_users`
- Field IDs are present (not field keys)
- Legacy backup exists: `table_prefs_legacy_users`

### Test 3.2: Load Preferences with Field IDs

**Steps:**
```javascript
import { getTablePreferences } from '@/lib/tablePreferences'

// Load preferences (should convert back to field keys)
const loaded = getTablePreferences('users')
console.log('Loaded preferences:', loaded)
```

**Expected Result:**
- Preferences are loaded
- Field IDs are converted back to field keys
- Structure matches original

**Verify:**
- `columnVisibility` uses field keys (e.g., "Email")
- `columnOrder` uses field keys
- `defaultSort.field` is a field key

### Test 3.3: Test Without Field Mapping

**Steps:**
1. Clear field mapping:
```javascript
localStorage.removeItem('field_id_mapping_users')
```

2. Save preferences:
```javascript
saveTablePreferences('users', {
  columnVisibility: { 'Email': true },
  columnOrder: ['Email']
})
```

3. Check saved data:
```javascript
const saved = JSON.parse(localStorage.getItem('table_prefs_users'))
console.log('Saved without mapping:', saved)
```

**Expected Result:**
- Preferences are saved as-is (field keys)
- No `_usingFieldIds` flag
- Background fetch is attempted

---

## 4. Test Migration from Field Names

### Test 4.1: Migrate Legacy Preferences

**Steps:**
1. Create legacy preferences manually:
```javascript
localStorage.setItem('table_prefs_users', JSON.stringify({
  columnVisibility: { 'Email': true, 'First Name': false },
  columnOrder: ['Email', 'First Name'],
  defaultSort: { field: 'Email', order: 'asc' }
  // No _usingFieldIds flag
}))
```

2. Ensure field mapping exists:
```javascript
import { fetchFieldMapping } from '@/lib/fieldIdMapping'
await fetchFieldMapping('users')
```

3. Load and re-save preferences:
```javascript
import { getTablePreferences, saveTablePreferences } from '@/lib/tablePreferences'

const legacy = getTablePreferences('users')
console.log('Legacy preferences:', legacy)

// Re-save (should migrate to Field IDs)
saveTablePreferences('users', legacy)

// Check migrated version
const migrated = JSON.parse(localStorage.getItem('table_prefs_users'))
console.log('Migrated preferences:', migrated)
```

**Expected Result:**
- Legacy preferences are loaded correctly
- On save, they're converted to Field IDs
- Legacy backup is preserved
- `_usingFieldIds: true` is set

---

## 5. Test End-to-End User Flow

### Test 5.1: Configure Table Modal

**Steps:**
1. Open the app and navigate to Users table
2. Click "Configure Table" button
3. Toggle column visibility (e.g., hide "First Name")
4. Reorder columns (drag "Email" to top)
5. Set default sort to "Email" ascending
6. Click "Save"

**Expected Result:**
- Changes are saved
- Preferences persist after page refresh
- Column visibility works correctly
- Column order is maintained
- Default sort is applied

**Verify in Console:**
```javascript
// Check what was saved
const saved = JSON.parse(localStorage.getItem('table_prefs_users'))
console.log('Saved preferences:', saved)

// Should show Field IDs, not field keys
```

### Test 5.2: Change Airtable Field Name

**Steps:**
1. In Airtable, rename a field (e.g., "First Name" → "Given Name")
2. Refresh the app
3. Check if preferences still work

**Expected Result:**
- Preferences still work correctly
- Column visibility is maintained
- Column order is maintained
- Default sort still works

**Why:** Field IDs don't change when field names change!

### Test 5.3: Add New Field in Airtable

**Steps:**
1. Add a new field in Airtable (e.g., "Middle Name")
2. Refresh the app
3. Fetch new field mapping:
```javascript
import { fetchFieldMapping } from '@/lib/fieldIdMapping'
await fetchFieldMapping('users')
```

4. Check if new field is in mapping:
```javascript
import { getFieldMapping } from '@/lib/fieldIdMapping'
const mapping = getFieldMapping('users')
console.log('New field in mapping:', mapping.fields.find(f => f.fieldName === 'Middle Name'))
```

**Expected Result:**
- New field is included in mapping
- Can be used in preferences
- Doesn't break existing preferences

---

## 6. Test Edge Cases

### Test 6.1: Computed Fields

**Steps:**
```javascript
import { isComputedField, convertPreferencesToFieldIds } from '@/lib/fieldIdMapping'

// Test computed field detection
console.log('CompanyName is computed:', isComputedField('CompanyName')) // true
console.log('Email is computed:', isComputedField('Email')) // false

// Test conversion with computed fields
const prefs = {
  columnVisibility: { 'Email': true, 'CompanyName': true },
  columnOrder: ['Email', 'CompanyName']
}

const converted = convertPreferencesToFieldIds('users', prefs)
console.log('With computed fields:', converted)
```

**Expected Result:**
- Computed fields are detected correctly
- Computed fields remain as keys (not converted to IDs)
- Regular fields are converted to IDs

### Test 6.2: Missing Field Mapping

**Steps:**
1. Clear all field mappings:
```javascript
Object.keys(localStorage)
  .filter(k => k.startsWith('field_id_mapping_'))
  .forEach(k => localStorage.removeItem(k))
```

2. Try to save preferences:
```javascript
saveTablePreferences('users', {
  columnVisibility: { 'Email': true }
})
```

**Expected Result:**
- Preferences are saved as-is (field keys)
- No error is thrown
- Background fetch is attempted

### Test 6.3: Invalid Field Keys

**Steps:**
```javascript
import { convertPreferencesToFieldIds } from '@/lib/fieldIdMapping'

const prefs = {
  columnVisibility: { 'NonExistentField': true, 'Email': true },
  columnOrder: ['NonExistentField', 'Email']
}

const converted = convertPreferencesToFieldIds('users', prefs)
console.log('With invalid field:', converted)
```

**Expected Result:**
- Invalid fields remain as keys (not converted)
- Valid fields are converted to IDs
- No errors thrown

### Test 6.4: Cache Expiration

**Steps:**
1. Get current mapping:
```javascript
const mapping = getFieldMapping('users')
console.log('Current mapping:', mapping)
```

2. Manually expire cache:
```javascript
if (mapping) {
  mapping.lastUpdated = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() // 8 days ago
  localStorage.setItem('field_id_mapping_users', JSON.stringify(mapping))
}
```

3. Fetch fresh mapping:
```javascript
await fetchFieldMapping('users')
```

**Expected Result:**
- Expired cache is still returned (for backward compatibility)
- Fresh fetch updates the cache
- New `lastUpdated` timestamp is set

---

## 7. Performance Testing

### Test 7.1: Large Number of Fields

**Steps:**
1. Test with a table that has many fields (50+)
2. Fetch mapping:
```javascript
const start = performance.now()
await fetchFieldMapping('users')
const end = performance.now()
console.log(`Fetch time: ${end - start}ms`)
```

**Expected Result:**
- Fetch completes in reasonable time (< 2 seconds)
- Mapping is cached for subsequent uses
- No performance degradation

### Test 7.2: Multiple Tables

**Steps:**
```javascript
const tables = ['users', 'companies', 'geography']
const start = performance.now()

for (const table of tables) {
  await fetchFieldMapping(table)
}

const end = performance.now()
console.log(`Total time for ${tables.length} tables: ${end - start}ms`)
```

**Expected Result:**
- All mappings are fetched successfully
- Each is cached independently
- No conflicts between tables

---

## 8. Integration Testing

### Test 8.1: Full Workflow

**Steps:**
1. **Fresh start:** Clear all preferences and mappings
2. **Open Users table:** Navigate to `/spaces/system-config/users`
3. **Configure table:** Change visibility, order, sort
4. **Save:** Click "Save" in Configure Table modal
5. **Verify:** Check localStorage for Field IDs
6. **Refresh page:** Reload the page
7. **Verify:** Preferences are still applied correctly
8. **Rename field in Airtable:** Change "Email" to "Email Address"
9. **Refresh app:** Reload the page
10. **Verify:** Preferences still work (using Field IDs, not names)

**Expected Result:**
- All steps complete successfully
- Preferences persist across page refreshes
- Preferences survive field name changes

---

## Checklist

Use this checklist to track your testing progress:

- [ ] Backend API returns field mappings
- [ ] Field mapping is cached in localStorage
- [ ] Field keys convert to Field IDs
- [ ] Field IDs convert back to field keys
- [ ] Preferences save with Field IDs
- [ ] Preferences load with field keys
- [ ] Legacy preferences migrate correctly
- [ ] Configure Table modal works
- [ ] Column visibility persists
- [ ] Column order persists
- [ ] Default sort persists
- [ ] Preferences survive field name changes
- [ ] Computed fields handled correctly
- [ ] Missing mappings handled gracefully
- [ ] Invalid fields handled gracefully
- [ ] Performance is acceptable
- [ ] Multiple tables work independently

---

## Troubleshooting

### Issue: Field mapping not found

**Solution:**
1. Check backend is running
2. Verify Airtable credentials in `server/.env`
3. Check Airtable Metadata API access (requires `schema.bases:read` scope)
4. Check browser console for errors

### Issue: Preferences not saving

**Solution:**
1. Check browser console for errors
2. Verify field mapping exists: `getFieldMapping('users')`
3. Check localStorage: `localStorage.getItem('table_prefs_users')`
4. Verify no CORS errors

### Issue: Preferences not loading

**Solution:**
1. Check localStorage has preferences
2. Verify field mapping exists
3. Check for conversion errors in console
4. Try clearing cache and re-fetching mapping

---

## Next Steps After Testing

Once testing is complete:

1. **Update ConfigureTableModal** to fetch field mapping on mount
2. **Update ListDetailTemplate** to fetch field mapping on mount
3. **Create migration utility** for bulk migration
4. **Document the system** for other developers
5. **Deploy to production** (after thorough testing)

---

## Questions?

If you encounter issues during testing, check:
- Browser console for errors
- Network tab for API calls
- localStorage for stored data
- Backend logs for server errors

