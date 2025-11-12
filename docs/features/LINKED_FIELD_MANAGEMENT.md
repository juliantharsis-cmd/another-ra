# Linked Field Management Guide

## Overview

This document outlines the strategy for identifying and managing linked record fields (relationships) when creating new tables from Airtable. Linked fields should be managed as editable `choiceList` fields that connect to their related tables, similar to how the Users table manages Company, User Roles, and Modules.

## Field Validation Script

Before implementing a new table, **always run the field validation script** to ensure all Airtable fields are mapped:

```bash
npx tsx server/src/scripts/validateTableFields.ts "Table Name"
```

This script will:
- List all fields in the Airtable table
- Compare with fields in the application type file
- Identify missing fields
- Provide recommendations for field types

## Identification Process

### Step 1: Check Airtable Field Types

Before implementing a new table, check the Airtable schema to identify linked record fields:

```typescript
// Use this script to check field types
import Airtable from 'airtable'
const base = Airtable.base(BASE_ID)
const records = await base('Table Name').select({ maxRecords: 1 }).firstPage()
if (records.length > 0) {
  const fields = records[0].fields
  Object.keys(fields).forEach(key => {
    const value = fields[key]
    console.log(`${key}: ${typeof value} ${Array.isArray(value) ? '(array)' : ''}`)
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string' && value[0].startsWith('rec')) {
      console.log(`  → Linked record field (IDs: ${value.join(', ')})`)
    }
  })
}
```

### Step 2: Identify Linked Record Fields

A linked record field will:
- Be an array of strings
- Contain values that start with `'rec'` (Airtable record IDs)
- Reference records from another table

**Example:**
- `'Unit to convert': ['recr0Vg6UV7H5gBxX']` → Linked to Unit table
- `'Normalized unit': ['recr0Vg6UV7H5gBxX']` → Linked to Unit table
- `'Scope': ['rec02mjFUCTbysAMm']` → Linked to Scope table

## Implementation Checklist

When implementing a new table with linked fields, follow this checklist:

### Backend Implementation

- [ ] **Types (`types/EntityName.ts`)**
  - Add `FieldName?: string | string[]` for the linked field (stores IDs)
  - Add `FieldName Name?: string | string[]` for resolved names
  - Update DTOs to accept `string | string[]` for linked fields

- [ ] **Service (`services/EntityNameAirtableService.ts`)**
  - In `mapAirtableToEntity`, resolve linked records using `relationshipResolver.resolveLinkedRecords()`
  - Add resolved names to the returned object: `'FieldName Name': resolvedNames.map(r => r.name)`
  - In `mapEntityToAirtable`, handle linked fields as arrays:
    ```typescript
    if (dto['FieldName'] !== undefined) {
      fields['FieldName'] = Array.isArray(dto['FieldName']) 
        ? dto['FieldName'] 
        : [dto['FieldName']]
    }
    ```

### Frontend Implementation

- [ ] **API Client (`lib/api/entityName.ts`)**
  - Update interface to include both ID field and Name field
  - Example: `'FieldName'?: string | string[]` and `'FieldName Name'?: string | string[]`

- [ ] **Config (`components/templates/configs/entityNameConfig.tsx`)**
  - **Columns**: Display `'FieldName Name'` (resolved names) with badge rendering
  - **Fields**: Make `'FieldName'` a `choiceList` type with:
    - `editable: true`
    - `searchable: true`
    - `options` function that fetches from the related table API
    - Format options as `"Name|ID"` strings

- [ ] **ListDetailTemplate Mappings**
  - Add to `linkedRecordFieldMap` in `ListDetailTemplate.tsx`:
    ```typescript
    'FieldName': 'FieldName Name'
    ```
  - Add to column resolution logic:
    ```typescript
    column.key === 'FieldName' ? 'FieldName Name' : null
    ```

## Pattern Examples

### Example 1: Unit Conversion → Unit

**Backend:**
```typescript
// In mapAirtableToUnitConversion
const unitToConvertNames = fields['Unit to convert']
  ? await this.relationshipResolver.resolveLinkedRecords(fields['Unit to convert'], 'Unit', 'Name')
  : []

return {
  ...
  'Unit to convert': fields['Unit to convert'] || undefined,
  'Unit to convert Name': unitToConvertNames.map(r => r.name),
  ...
}
```

**Frontend Config:**
```typescript
{
  key: 'Unit to convert',
  label: 'Unit to Convert',
  type: 'choiceList',
  editable: true,
  options: async (searchQuery?: string, signal?: AbortSignal) => {
    // Fetch from /api/unit
    const response = await fetch(`${API_BASE_URL}/unit?...`)
    const result = await response.json()
    return result.data.map((unit: any) => `${unit.Name}|${unit.id}`)
  },
  searchable: true,
}
```

### Example 2: Scope & Categorisation → Scope

**Backend:**
```typescript
const scopeNames = fields['Scope']
  ? await this.relationshipResolver.resolveLinkedRecords(fields['Scope'], 'Scope', 'Name')
  : []

return {
  ...
  Scope: fields['Scope'] || undefined,
  ScopeName: scopeNames.map(r => r.name),
  ...
}
```

**Frontend Config:**
```typescript
{
  key: 'Scope',
  label: 'Scope',
  type: 'choiceList',
  editable: true,
  options: async (searchQuery?: string, signal?: AbortSignal) => {
    // Fetch from /api/scope
    const response = await fetch(`${API_BASE_URL}/scope?...`)
    const result = await response.json()
    return result.data.map((scope: any) => `${scope.Name}|${scope.id}`)
  },
  searchable: true,
}
```

## Column Display Pattern

Linked fields should display resolved names as badges:

```typescript
{
  key: 'FieldName Name',
  label: 'Field Name',
  render: (value: string | string[] | undefined, item: Entity) => {
    let namesArray: string[] = []
    
    // Extract names from value or item
    if (value && Array.isArray(value)) {
      namesArray = value.filter(Boolean).filter((n: string) => n && !n.startsWith('rec'))
    } else if (item['FieldName Name']) {
      if (Array.isArray(item['FieldName Name'])) {
        namesArray = item['FieldName Name'].filter(Boolean).filter((n: string) => n && !n.startsWith('rec'))
      }
    }
    
    // Show loading if IDs exist but names don't
    if (namesArray.length === 0 && item['FieldName'] && /* has IDs */) {
      return <span className="text-sm text-neutral-400 italic">Loading...</span>
    }
    
    // Display as badges
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {namesArray.map((name, idx) => (
          <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
            {name}
          </span>
        ))}
      </div>
    )
  },
}
```

## Best Practices

1. **Always resolve linked records in the service layer** - Don't rely on Airtable lookup fields
2. **Use consistent naming** - `FieldName` for IDs, `FieldName Name` for resolved names
3. **Handle arrays properly** - Linked fields can be single or multiple records
4. **Never display record IDs** - Always show resolved names, with "Loading..." if names aren't available yet
5. **Make linked fields searchable** - Use `searchable: true` and implement search in the options function
6. **Add to ListDetailTemplate mappings** - Ensure the template knows about the relationship

## Future Table Creation Checklist

When creating a new table, use this checklist:

- [ ] **Run field validation script**: `npx tsx server/src/scripts/validateTableFields.ts "Table Name"`
- [ ] **Verify all Airtable fields are mapped** in types, service, and frontend config
- [ ] Identify all linked record fields in Airtable
- [ ] Identify all lookup fields (read-only, auto-resolved by Airtable)
- [ ] Update types to include both ID and Name fields for linked records
- [ ] Update types to include lookup fields as readonly strings
- [ ] Update service to resolve linked records
- [ ] Update service to handle lookup fields (read-only, no resolution needed)
- [ ] Update API client interface
- [ ] Configure linked fields as `choiceList` with proper options
- [ ] Configure lookup fields as `readonly` in frontend
- [ ] Configure columns to display resolved names as badges
- [ ] Add mappings to `ListDetailTemplate.tsx`
- [ ] **Re-run validation script** to verify all fields are mapped
- [ ] Test that linked fields are editable and display correctly

## Related Files

- `server/src/services/RelationshipResolver.ts` - Handles linked record resolution
- `src/components/templates/ListDetailTemplate.tsx` - Template with linked field support
- `src/components/templates/configs/userTableConfig.tsx` - Reference implementation
- `src/components/templates/configs/scopeCategorisationConfig.tsx` - Recent example
- `src/components/templates/configs/unitConversionConfig.tsx` - Current example

