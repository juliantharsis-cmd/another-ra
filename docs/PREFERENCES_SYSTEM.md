# User Preferences System

A database-agnostic user preferences system with support for Airtable, PostgreSQL, and in-memory storage.

## Architecture

The system uses an **adapter pattern** to support multiple storage backends:

- **Airtable** (default) - Stores preferences in Airtable "User Preferences" table
- **PostgreSQL** (stub) - Placeholder for future PostgreSQL implementation
- **Memory** - In-memory storage for testing and development

## Airtable Table Setup

### Table Name: **User Preferences**

Create this table in your **System configuration** base.

### Fields

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| User Id | Single line text | ✅ Yes | User identifier |
| Namespace | Single select | ✅ Yes | `ui`, `table`, `filters`, `featureFlags`, `misc` |
| Key | Single line text | ✅ Yes | Preference key (e.g., "columnWidths") |
| Table Id | Single line text | ❌ No | Table-specific preference (e.g., "companies") |
| Scope Id | Single line text | ❌ No | Scope-specific preference (e.g., view ID) |
| Type | Single select | ✅ Yes | `string`, `number`, `boolean`, `json` |
| Value (text) | Long text | ❌ No | String/JSON values |
| Value (number) | Number | ❌ No | Numeric values |
| Value (boolean) | Checkbox | ❌ No | Boolean values |
| Visibility | Single select | ❌ No | `private`, `org`, `global` (default: `private`) |
| Expires At | Date (date/time) | ❌ No | Expiration timestamp |
| Unique Key | Formula | ✅ Yes | `CONCATENATE({User Id}, '::', {Namespace}, '::', {Table Id}, '::', {Scope Id}, '::', {Key})` |
| Created At | Created time | ✅ Yes | Auto-generated |
| Last Modified | Last modified time | ✅ Yes | Auto-generated |
| Checksum | Formula | ❌ No | `SHA256(CONCATENATE({Type}, '::', {Value (text)}, '::', {Value (number)}, '::', {Value (boolean)}))` |

### Airtable Scripting App

Run this script in Airtable **Scripting** to create the table:

```javascript
// Create "User Preferences" table in the System configuration base
const tableName = "User Preferences";

const baseTables = base.tables.map(t => t.name);

if (baseTables.includes(tableName)) {
  output.markdown(`✅ Table **${tableName}** already exists.`);
} else {
  output.markdown(`🔧 Creating table **${tableName}**...`);
  
  const tbl = await base.createTableAsync(tableName, [
    { name: "User Id", type: "singleLineText" },
    { 
      name: "Namespace", 
      type: "singleSelect", 
      options: { 
        choices: [
          { name: "ui" }, 
          { name: "table" }, 
          { name: "filters" }, 
          { name: "featureFlags" }, 
          { name: "misc" }
        ] 
      } 
    },
    { name: "Key", type: "singleLineText" },
    { name: "Table Id", type: "singleLineText" },
    { name: "Scope Id", type: "singleLineText" },
    { 
      name: "Type", 
      type: "singleSelect", 
      options: { 
        choices: [
          { name: "string" }, 
          { name: "number" }, 
          { name: "boolean" }, 
          { name: "json" }
        ] 
      } 
    },
    { name: "Value (text)", type: "multilineText" },
    { name: "Value (number)", type: "number", options: { precision: 3 } },
    { 
      name: "Value (boolean)", 
      type: "checkbox", 
      options: { color: "greenBright", icon: "check" } 
    },
    { 
      name: "Visibility", 
      type: "singleSelect", 
      options: { 
        choices: [
          { name: "private" }, 
          { name: "org" }, 
          { name: "global" }
        ] 
      } 
    },
    { 
      name: "Expires At", 
      type: "dateTime", 
      options: { 
        timeZone: "utc", 
        dateFormat: { name: "iso" }, 
        timeFormat: { name: "24hour" } 
      } 
    },
    { name: "Unique Key", type: "singleLineText" },
    { name: "Created At", type: "createdTime" },
    { name: "Last Modified", type: "lastModifiedTime" },
    { name: "Checksum", type: "singleLineText" },
  ]);

  // Update formula fields after creation
  await tbl.updateFieldsAsync([
    {
      id: tbl.getField("Unique Key").id,
      type: "formula",
      options: { 
        formula: "CONCATENATE({User Id}, '::', {Namespace}, '::', IF({Table Id}, {Table Id}, ''), '::', IF({Scope Id}, {Scope Id}, ''), '::', {Key})" 
      }
    },
    {
      id: tbl.getField("Checksum").id,
      type: "formula",
      options: { 
        formula: "SHA256(CONCATENATE({Type}, '::', IF({Value (text)}, {Value (text)}, ''), '::', IF({Value (number)}, {Value (number)}, ''), '::', IF({Value (boolean)}, 'true', 'false')))" 
      }
    }
  ]);

  output.markdown(`✅ Created **${tableName}** with standard fields.`);
}
```

**Note:** After creating the table, you may need to manually set the "Unique Key" field to be a formula field in the Airtable UI if the scripting API doesn't support formula updates.

## Configuration

Set the adapter type via environment variable:

```bash
PREFERENCES_ADAPTER=airtable  # Options: airtable, postgres, memory
```

Default: `airtable`

## API Endpoints

### Get All Preferences
```
GET /api/preferences/:userId?namespace=table&tableId=companies
```

### Get Single Preference
```
GET /api/preferences/:userId/:namespace/:key?tableId=companies&scopeId=view1
```

### Set Preference
```
PUT /api/preferences/:userId/:namespace/:key
POST /api/preferences

Body:
{
  "userId": "user123",
  "namespace": "table",
  "key": "columnWidths",
  "value": { "name": 200, "status": 100 },
  "type": "json",
  "tableId": "companies",
  "visibility": "private",
  "ttl": 3600  // Optional: expires in 1 hour
}
```

### Delete Preference
```
DELETE /api/preferences/:userId/:namespace/:key?tableId=companies
```

### Delete All Preferences
```
DELETE /api/preferences/:userId?namespace=table&tableId=companies
```

## Usage Examples

### Backend (Service)

```typescript
import { getPreferencesService } from './services/PreferencesService'

const service = getPreferencesService()

// Get a preference
const columnWidths = await service.get('user123', 'columnWidths', 'table', 'companies')

// Set a preference
await service.set(
  'user123',
  'columnWidths',
  { name: 200, status: 100 },
  'json',
  { namespace: 'table', tableId: 'companies', ttl: 3600 }
)

// Get all table preferences
const allPrefs = await service.getAll('user123', { namespace: 'table', tableId: 'companies' })
```

### Frontend (React Hook)

```typescript
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
  return <div>Column widths: {JSON.stringify(value)}</div>
}
```

### Frontend (API Client)

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

## Features

- ✅ **Database-agnostic** - Switch between Airtable, PostgreSQL, or Memory
- ✅ **Validation** - Type-safe preference values
- ✅ **Caching** - In-memory cache with TTL (5 minutes default)
- ✅ **TTL/Expiry** - Support for expiring preferences
- ✅ **Namespaces** - Organize preferences by category
- ✅ **Scoping** - Table-specific and scope-specific preferences
- ✅ **Idempotency** - Unique keys prevent duplicates
- ✅ **React Hooks** - Easy frontend integration

## Future Enhancements

- [ ] Full PostgreSQL adapter implementation
- [ ] Preference versioning/history
- [ ] Bulk operations
- [ ] Preference inheritance (org/global visibility)
- [ ] Migration tools for moving between adapters

