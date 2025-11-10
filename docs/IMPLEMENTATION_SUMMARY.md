# Field Cleanup & Relationship Framework Implementation Summary

## Overview

This implementation addresses two key requirements:
1. **Field Cleanup**: Remove default fields that don't exist in Airtable when creating new tables
2. **Relationship Framework**: Build a generic framework for handling linked data relationships

## What Was Implemented

### 1. Field Cleanup System

#### Scripts Created

1. **`scripts/fetch-airtable-schema.mjs`**
   - Fetches actual schema from Airtable Metadata API
   - Displays all fields with types and relationships
   - Outputs JSON schema for programmatic use
   - Usage: `node scripts/fetch-airtable-schema.mjs "Table Name"`

2. **Updated `scripts/generate-table.mjs`**
   - Now fetches actual Airtable schema before generating code
   - Only includes fields that exist in Airtable
   - Maps Airtable field types to TypeScript types correctly
   - Handles system fields (Created Time, etc.) as optional metadata only if they exist
   - Automatically detects linked record fields

#### Key Features

- **Automatic Schema Fetching**: Script queries Airtable Metadata API to get real field definitions
- **Type Mapping**: Correctly maps Airtable types (number, checkbox, date, linked records, etc.) to TypeScript
- **System Field Handling**: Only adds `createdAt`, `updatedAt`, `createdBy`, `lastModifiedBy` if they exist in Airtable
- **Relationship Detection**: Automatically identifies linked record fields

### 2. Relationship Framework

#### Core Service

**`server/src/services/RelationshipResolver.ts`**
- Generic service for resolving linked record IDs to display names
- Caching (5-minute TTL) for performance
- Automatic schema detection from Airtable Metadata API
- Supports one-to-many and many-to-many relationships
- Bidirectional relationship support

#### Key Methods

- `resolveLinkedRecords()`: Resolves linked record IDs to names
- `getRelationshipConfig()`: Fetches relationship configuration from Airtable schema
- `clearCache()`: Clears relationship cache
- `clearCacheForTable()`: Clears cache for specific table

#### Documentation

- **`docs/RELATIONSHIP_FRAMEWORK.md`**: Complete guide on using the relationship framework
- **`docs/FIELD_CLEANUP_GUIDE.md`**: Guide for cleaning up existing tables

## How It Works

### Field Cleanup Flow

1. **Schema Fetching**
   ```
   generate-table.mjs → fetchAirtableSchema() → Airtable Metadata API
   ```

2. **Field Mapping**
   ```
   Airtable Schema → TypeScript Interface
   - number/percent/currency → number
   - checkbox → boolean
   - date/dateTime → string
   - multipleRecordLinks → string | string[]
   - multipleAttachments → any[]
   ```

3. **System Fields**
   ```
   Check if exists in Airtable → Add as optional metadata
   - Created Time → createdAt?: string
   - Last Modified Time → updatedAt?: string
   - Created By → createdBy?: string
   - Last Modified By → lastModifiedBy?: string
   ```

### Relationship Resolution Flow

1. **Detection**
   ```
   Airtable Schema → Identify multipleRecordLinks fields
   → Extract linkedTableId and linkedTableName
   ```

2. **Resolution**
   ```
   Linked Record IDs → RelationshipResolver.resolveLinkedRecords()
   → Fetch names from target table
   → Cache results (5 min TTL)
   ```

3. **Display**
   ```
   Resolved Names → Frontend Table Config
   → Display in list view and detail panel
   ```

## Usage Examples

### Generate Table with Schema Fetching

```bash
node scripts/generate-table.mjs "Table Name"
```

The script will:
- ✅ Fetch actual schema from Airtable
- ✅ Generate TypeScript interfaces with only existing fields
- ✅ Map field types correctly
- ✅ Detect relationships automatically

### Check Schema Before Generating

```bash
node scripts/fetch-airtable-schema.mjs "Table Name"
```

Output:
- All fields with types
- Linked table information
- JSON schema

### Use Relationship Resolver

```typescript
// In your AirtableService
import { RelationshipResolver } from './RelationshipResolver'

const resolver = new RelationshipResolver(baseId, apiKey)

// Resolve linked record IDs to names
const resolved = await resolver.resolveLinkedRecords(
  recordIds,
  'Target Table',
  'Name'
)
```

## Benefits

### Field Cleanup
- ✅ **No phantom fields**: Only fields that exist in Airtable are included
- ✅ **Type safety**: Correct TypeScript types based on Airtable types
- ✅ **Less maintenance**: Automatic schema detection reduces manual updates
- ✅ **Consistency**: All tables follow the same pattern

### Relationship Framework
- ✅ **Generic**: Works for any table relationship
- ✅ **Performant**: Caching reduces API calls
- ✅ **Automatic**: Detects relationships from schema
- ✅ **Bidirectional**: Supports relationships in both directions
- ✅ **Extensible**: Easy to add new relationship types

## Next Steps

### For Existing Tables

1. **Check schema**:
   ```bash
   node scripts/fetch-airtable-schema.mjs "Table Name"
   ```

2. **Update TypeScript interface**:
   - Remove non-existent fields
   - Add missing fields
   - Correct field types

3. **Update service mapping**:
   - Remove mappings for non-existent fields
   - Add mappings for missing fields
   - Only add metadata if it exists

4. **Update frontend config**:
   - Remove columns for non-existent fields
   - Add columns for missing fields

### For New Tables

1. **Generate with schema**:
   ```bash
   node scripts/generate-table.mjs "Table Name"
   ```

2. **Review generated code**:
   - Check TypeScript interface
   - Verify service mappings
   - Update frontend config if needed

3. **Add relationships**:
   - Use RelationshipResolver in service
   - Update frontend config to display relationships
   - Add filters for linked records

## Files Created/Modified

### Created
- `scripts/fetch-airtable-schema.mjs`
- `server/src/services/RelationshipResolver.ts`
- `docs/RELATIONSHIP_FRAMEWORK.md`
- `docs/FIELD_CLEANUP_GUIDE.md`
- `docs/IMPLEMENTATION_SUMMARY.md`

### Modified
- `scripts/generate-table.mjs` (added schema fetching and field mapping)

## Testing

### Test Schema Fetching
```bash
node scripts/fetch-airtable-schema.mjs "EF GWP"
```

### Test Table Generation
```bash
node scripts/generate-table.mjs "Test Table"
```

### Test Relationship Resolver
```typescript
// In a service file
const resolver = new RelationshipResolver(baseId, apiKey)
const resolved = await resolver.resolveLinkedRecords(
  ['rec123', 'rec456'],
  'GHG Type',
  'Name'
)
console.log(resolved) // [{ id: 'rec123', name: 'CO2' }, ...]
```

## Future Enhancements

- [ ] Auto-update existing tables with schema changes
- [ ] Relationship graph visualization
- [ ] Relationship editing (add/remove links)
- [ ] Relationship validation
- [ ] Batch relationship resolution
- [ ] Relationship analytics

