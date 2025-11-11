# Field ID System Verification

This document verifies that the Field ID system is working correctly for the User table as a proof of concept.

## System Overview

The Field ID system uses Airtable's immutable Field IDs instead of field names for storing table preferences. This ensures configurations remain stable even when field names change in Airtable.

## Integration Points

### 1. Backend API
- **Endpoint**: `GET /api/tables/:tableId/field-mapping`
- **Service**: `FieldMappingService` in `server/src/services/FieldMappingService.ts`
- **Status**: ✅ Implemented

### 2. Frontend Mapping
- **Module**: `src/lib/fieldIdMapping.ts`
- **Functions**: 
  - `fetchFieldMapping()` - Fetches mapping from API
  - `getFieldMapping()` - Gets cached mapping
  - `getFieldId()` - Converts field key to Field ID
  - `getFieldKey()` - Converts Field ID to field key
- **Status**: ✅ Implemented

### 3. Preferences Storage
- **Module**: `src/lib/tablePreferences.ts`
- **Functions**:
  - `getTablePreferences()` - Loads preferences (converts IDs to keys)
  - `saveTablePreferences()` - Saves preferences (converts keys to IDs)
- **Status**: ✅ Implemented

### 4. User Table Config
- **File**: `src/components/templates/configs/userTableConfig.tsx`
- **Status**: ✅ No changes needed - uses field keys, conversion happens automatically

## Verification Steps

### Step 1: Verify Backend API

```bash
# Test the field mapping API
curl http://localhost:3001/api/tables/users/field-mapping
```

Expected response:
```json
{
  "success": true,
  "data": {
    "tableId": "users",
    "tableName": "Users",
    "airtableTableId": "...",
    "fieldKeyToId": {
      "Email": "fld...",
      "First Name": "fld...",
      ...
    },
    "fields": [...]
  }
}
```

### Step 2: Verify Frontend Mapping

Open browser console and run:
```javascript
// Import the functions (adjust path if needed)
const { fetchFieldMapping, getFieldId, getFieldKey } = await import('/src/lib/fieldIdMapping.ts')

// Fetch mapping for Users table
const mapping = await fetchFieldMapping('Users')
console.log('Mapping:', mapping)

// Test conversion
const emailId = getFieldId('Users', 'Email')
console.log('Email Field ID:', emailId)

const emailKey = getFieldKey('Users', emailId)
console.log('Email Key (should be "Email"):', emailKey)
```

### Step 3: Verify Preferences Storage

Open browser console and run:
```javascript
const { saveTablePreferences, getTablePreferences } = await import('/src/lib/tablePreferences.ts')

// Save preferences with field keys
const prefs = {
  columnVisibility: { 'Email': true, 'First Name': false },
  columnOrder: ['Email', 'First Name'],
  defaultSort: { field: 'Email', order: 'asc' }
}

saveTablePreferences('Users', prefs)

// Check localStorage - should see Field IDs
const stored = JSON.parse(localStorage.getItem('table_prefs_Users'))
console.log('Stored preferences (with Field IDs):', stored)
console.log('Using Field IDs:', stored._usingFieldIds)

// Load preferences - should get field keys back
const loaded = getTablePreferences('Users')
console.log('Loaded preferences (with field keys):', loaded)
console.log('Email visible:', loaded.columnVisibility['Email'])
```

### Step 4: Verify UI Integration

1. Open the Users table
2. Open "Configure Table" modal
3. Change column visibility and order
4. Save changes
5. Refresh the page
6. Verify preferences persist correctly

## Expected Behavior

1. **Field Mapping**: Field keys (e.g., "Email") are automatically converted to Field IDs (e.g., "fld...") when saving preferences
2. **Backward Compatibility**: Field IDs are converted back to field keys when loading preferences
3. **Computed Fields**: Computed fields (e.g., "CompanyName") remain as keys (not converted to IDs)
4. **Migration**: Old preferences using field names are automatically migrated on first save

## Troubleshooting

### Field Mapping Not Found
- Check that backend API is running
- Verify `AIRTABLE_PERSONAL_ACCESS_TOKEN` and `AIRTABLE_SYSTEM_CONFIG_BASE_ID` are set
- Check browser console for errors

### Preferences Not Persisting
- Check browser localStorage
- Verify `_usingFieldIds` flag is set to `true`
- Check for errors in browser console

### Field Names Changed in Airtable
- Preferences should still work because they use Field IDs
- Field keys in the config may need updating if field names changed

## Test Results

Run the automated test script:
```bash
# In browser console
await testFieldIdMapping()
```

Or use the test script:
```bash
node scripts/test-field-id-mapping.js
```

