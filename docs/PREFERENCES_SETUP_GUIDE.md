# User Preferences Setup Guide

Step-by-step guide to set up and test the User Preferences system.

## Step 1: Create Airtable Table

### Option A: Using Airtable Scripting (Recommended)

1. Open your **System configuration** base in Airtable
2. Go to **Extensions** → **Scripting**
3. Create a new script
4. Copy the script from `scripts/create-preferences-table.js`
5. Paste and run the script
6. Follow the instructions in the output to manually set formula fields if needed

### Option B: Manual Creation

1. Create a new table named **"User Preferences"** in your System configuration base
2. Add the following fields:

| Field Name | Type | Options/Notes |
|------------|------|---------------|
| User Id | Single line text | Required |
| Namespace | Single select | Options: `ui`, `table`, `filters`, `featureFlags`, `misc` |
| Key | Single line text | Required |
| Table Id | Single line text | Optional |
| Scope Id | Single line text | Optional |
| Type | Single select | Options: `string`, `number`, `boolean`, `json` |
| Value (text) | Long text | For string/JSON values |
| Value (number) | Number | For numeric values |
| Value (boolean) | Checkbox | For boolean values |
| Visibility | Single select | Options: `private`, `org`, `global` (default: `private`) |
| Expires At | Date (date/time) | Optional, UTC timezone |
| Unique Key | Formula | `CONCATENATE({User Id}, '::', {Namespace}, '::', IF({Table Id}, {Table Id}, ''), '::', IF({Scope Id}, {Scope Id}, ''), '::', {Key})` |
| Created At | Created time | Auto-generated |
| Last Modified | Last modified time | Auto-generated |
| Checksum | Formula (optional) | `SHA256(CONCATENATE({Type}, '::', IF({Value (text)}, {Value (text)}, ''), '::', IF({Value (number)}, {Value (number)}, ''), '::', IF({Value (boolean)}, 'true', 'false')))` |

3. Set **User Id** and **Key** as required fields
4. Set default value for **Visibility** to `private`

## Step 2: Configure Environment

### Backend Configuration

Add to `server/.env`:

```bash
# Preferences Adapter (optional, defaults to 'airtable')
PREFERENCES_ADAPTER=airtable

# Airtable Configuration (required if using Airtable adapter)
AIRTABLE_PERSONAL_ACCESS_TOKEN=your_token_here
AIRTABLE_SYSTEM_CONFIG_BASE_ID=your_base_id_here
```

### Frontend Configuration

The frontend uses the same `NEXT_PUBLIC_API_URL` environment variable:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Step 3: Test Backend

### Run Test Script

```bash
cd server
npx ts-node src/scripts/testPreferences.ts
```

Expected output:
```
🧪 Testing Preferences System...

1️⃣ Testing health check...
   Health check: ✅ PASS

2️⃣ Testing set preference...
   ✅ Preference saved:
      ID: rec...
      Key: columnWidths
      Value: {"name":200,"status":100,"notes":150}
      Namespace: table
      Table ID: companies

3️⃣ Testing get preference...
   ✅ Preference retrieved successfully
      Value matches: {"name":200,"status":100,"notes":150}

[... more tests ...]

✅ All tests passed!
```

### Manual Backend Test

```typescript
import { getPreferencesService } from './services/PreferencesService'

const service = getPreferencesService()

// Set a preference
await service.set(
  'user123',
  'columnWidths',
  { name: 200, status: 100 },
  'json',
  {
    namespace: 'table',
    tableId: 'companies',
  }
)

// Get a preference
const pref = await service.get('user123', 'columnWidths', 'table', 'companies')
console.log(pref?.value) // { name: 200, status: 100 }
```

## Step 4: Test Frontend

### Option A: Using Test Component

1. Create a test page or add to an existing page:

```tsx
import PreferencesTest from '@/components/test/PreferencesTest'

export default function TestPage() {
  return <PreferencesTest />
}
```

2. Navigate to the test page in your browser
3. Click "Run Tests" button
4. Verify all tests pass

### Option B: Using React Hook

```tsx
import { usePreference } from '@/hooks/usePreferences'

function MyComponent() {
  const { value, update, loading } = usePreference<Record<string, number>>(
    'columnWidths',
    'table',
    'companies'
  )

  const handleResize = async (column: string, width: number) => {
    await update({ ...value, [column]: width })
  }

  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      <p>Column widths: {JSON.stringify(value)}</p>
      <button onClick={() => handleResize('name', 250)}>
        Resize Name Column
      </button>
    </div>
  )
}
```

### Option C: Using API Client Directly

```typescript
import { preferencesApi } from '@/lib/api/preferences'

// Get preference
const pref = await preferencesApi.get('columnWidths', 'table', undefined, 'companies')

// Set preference
await preferencesApi.set(
  'columnWidths',
  { name: 200, status: 100 },
  'json',
  { namespace: 'table', tableId: 'companies' }
)
```

## Step 5: Verify API Endpoints

### Test with curl

```bash
# Get all preferences
curl http://localhost:3001/api/preferences/user123

# Get single preference
curl http://localhost:3001/api/preferences/user123/table/columnWidths?tableId=companies

# Set preference
curl -X PUT http://localhost:3001/api/preferences/user123/table/columnWidths \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user123" \
  -d '{
    "value": {"name": 200, "status": 100},
    "type": "json",
    "tableId": "companies"
  }'

# Delete preference
curl -X DELETE http://localhost:3001/api/preferences/user123/table/columnWidths?tableId=companies
```

## Troubleshooting

### Backend Issues

**Error: "AIRTABLE_PERSONAL_ACCESS_TOKEN is required"**
- Solution: Add `AIRTABLE_PERSONAL_ACCESS_TOKEN` to `server/.env`

**Error: "AIRTABLE_SYSTEM_CONFIG_BASE_ID is required"**
- Solution: Add `AIRTABLE_SYSTEM_CONFIG_BASE_ID` to `server/.env`

**Error: "Table 'User Preferences' not found"**
- Solution: Create the table in Airtable (see Step 1)

**Health check fails**
- Check Airtable API token permissions
- Verify base ID is correct
- Ensure table exists and is accessible

### Frontend Issues

**Error: "Failed to fetch"**
- Solution: Ensure backend server is running on port 3001
- Check `NEXT_PUBLIC_API_URL` is set correctly

**Preferences not loading**
- Check browser console for errors
- Verify user ID is set (check localStorage/sessionStorage)
- Test API endpoint directly with curl

### Common Issues

**Formula fields not working**
- Airtable Scripting may not support formula updates
- Manually set formula fields in Airtable UI
- Use the formulas provided in Step 1

**Unique Key conflicts**
- Ensure formula correctly handles empty Table Id and Scope Id
- Check for duplicate preferences with same key components

## Next Steps

Once setup is complete:

1. ✅ Table created in Airtable
2. ✅ Backend tests passing
3. ✅ Frontend hooks working
4. ✅ API endpoints responding

You can now use the preferences system throughout your application!

## Example Use Cases

- **Table column widths**: Store user-specific column widths per table
- **Default sort**: Remember user's preferred sort order
- **Filter presets**: Save commonly used filter combinations
- **UI preferences**: Theme, language, page size
- **Feature flags**: User-specific feature toggles

