# Field Cleanup Guide

## Problem

When creating new tables using the `generate-table` script, default fields like `createdAt`, `updatedAt`, `createdBy`, and `lastModifiedBy` were being added to TypeScript interfaces even if they don't exist in the Airtable table schema.

## Solution

The `generate-table` script now:
1. **Fetches actual Airtable schema** using the Metadata API
2. **Only includes fields that exist** in Airtable
3. **Maps Airtable field types** to TypeScript types correctly
4. **Handles system fields** (Created Time, Last Modified Time, etc.) as optional metadata

## How It Works

### 1. Schema Fetching

The script automatically fetches the table schema from Airtable:

```javascript
const airtableSchema = await fetchAirtableSchema(tableName)
```

### 2. Field Mapping

Fields are mapped from Airtable types to TypeScript:

- `number`, `percent`, `currency`, `rating` → `number`
- `checkbox` → `boolean`
- `date`, `dateTime` → `string` (ISO date string)
- `multipleRecordLinks` → `string | string[]` (linked record IDs)
- `multipleAttachments` → `any[]`
- `multipleSelects` → `string[]`
- Other text fields → `string`

### 3. System Fields

System fields (Created Time, Last Modified Time, Created By, Last Modified By) are:
- **Excluded** from the main interface fields
- **Added as optional metadata** only if they exist in Airtable:
  - `Created Time` → `createdAt?: string`
  - `Last Modified Time` → `updatedAt?: string`
  - `Created By` → `createdBy?: string`
  - `Last Modified By` → `lastModifiedBy?: string`

## Usage

### Generate Table with Schema Fetching

```bash
node scripts/generate-table.mjs "Table Name"
```

The script will:
1. Fetch the actual schema from Airtable
2. Generate TypeScript interfaces with only existing fields
3. Map field types correctly
4. Handle relationships (linked records)

### Manual Schema Check

To check what fields exist in Airtable before generating:

```bash
node scripts/fetch-airtable-schema.mjs "Table Name"
```

This will output:
- All fields in the table
- Field types
- Linked table information
- JSON schema for programmatic use

## Cleaning Up Existing Tables

For existing tables that have incorrect fields:

1. **Check actual Airtable schema:**
   ```bash
   node scripts/fetch-airtable-schema.mjs "Table Name"
   ```

2. **Update TypeScript interface** in `server/src/types/TableName.ts`:
   - Remove fields that don't exist in Airtable
   - Add fields that exist but are missing
   - Ensure field types match Airtable types

3. **Update service mapping** in `server/src/services/TableNameAirtableService.ts`:
   - Remove mappings for non-existent fields
   - Add mappings for missing fields
   - Only add metadata fields if they exist in Airtable

4. **Update frontend config** in `src/components/templates/configs/tableNameConfig.tsx`:
   - Remove columns for non-existent fields
   - Add columns for missing fields
   - Update detail panel fields

## Example: Cleaning Up a Table

### Before (Incorrect)
```typescript
export interface MyTable {
  id: string
  Name?: string
  Status?: string
  createdAt?: string      // ❌ Doesn't exist in Airtable
  updatedAt?: string      // ❌ Doesn't exist in Airtable
  createdBy?: string     // ❌ Doesn't exist in Airtable
  lastModifiedBy?: string // ❌ Doesn't exist in Airtable
}
```

### After (Correct)
```typescript
export interface MyTable {
  id: string
  Name?: string
  Status?: string
  // No metadata fields if they don't exist in Airtable
}
```

## Best Practices

1. **Always check schema first** before generating or updating tables
2. **Use the fetch script** to verify field names and types
3. **Only include fields that exist** in Airtable
4. **Handle system fields conditionally** - only add if they exist
5. **Map field types correctly** based on Airtable types
6. **Document relationships** for linked record fields

## Troubleshooting

### Schema Not Found

If the script can't find the table:
- Check the table name matches exactly (case-insensitive)
- Verify the base ID is correct in `.env`
- Ensure API key has access to the base

### Field Type Mismatch

If TypeScript types don't match Airtable:
- Check the field type in Airtable UI
- Update the mapping in `generateTypeInterface` function
- Manually correct the TypeScript interface if needed

### Missing Relationships

If linked records aren't working:
- Verify the linked record field exists in Airtable
- Check the linked table name matches
- Use the relationship framework (see `RELATIONSHIP_FRAMEWORK.md`)

