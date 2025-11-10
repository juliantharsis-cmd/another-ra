# Relationship Reconciliation Implementation Guide

## Overview

This guide explains how to apply relationship reconciliation to all tables in Another RA. The framework automatically resolves linked record IDs to their display names, ensuring a better user experience.

## Architecture

### Core Components

1. **RelationshipResolver** (`server/src/services/RelationshipResolver.ts`)
   - Generic service for resolving linked record IDs to names
   - Caching (5-minute TTL) for performance
   - Supports one-to-many and many-to-many relationships

2. **Service Pattern**
   - Each AirtableService includes a `relationshipResolver` instance
   - `resolveLinkedRecordNames()` method resolves all relationships for a batch of records
   - All CRUD methods call resolution after fetching/updating

3. **Frontend Integration**
   - API types include both ID fields (`Company`) and resolved name fields (`CompanyName`)
   - Table configs display resolved names in list view
   - Detail panels use `choiceList` for editing linked records

## Implementation Steps

### Step 1: Add RelationshipResolver to Service

```typescript
import { RelationshipResolver } from './RelationshipResolver'

export class YourTableAirtableService {
  private relationshipResolver: RelationshipResolver | null = null

  constructor() {
    // ... existing initialization
    const baseId = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 'appGtLbKhmNkkTLVL'
    const apiKey = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY
    this.relationshipResolver = new RelationshipResolver(baseId, apiKey)
  }
}
```

### Step 2: Create Resolution Method

```typescript
/**
 * Resolve linked record names for YourTable relationships
 */
private async resolveLinkedRecordNames(records: any[]): Promise<void> {
  if (!this.relationshipResolver || records.length === 0) {
    return
  }

  try {
    // Collect all unique IDs for each relationship type
    const relatedTableIds = new Set<string>()

    records.forEach(record => {
      if (record['Related Field']) {
        const ids = Array.isArray(record['Related Field']) 
          ? record['Related Field'] 
          : [record['Related Field']]
        ids.forEach((id: string) => id && relatedTableIds.add(id))
      }
    })

    // Resolve relationships in parallel
    const resolved = await this.relationshipResolver.resolveLinkedRecords(
      Array.from(relatedTableIds),
      'Target Table Name',
      'Name' // Display field in target table
    )

    // Create lookup map
    const nameMap = new Map(resolved.map(r => [r.id, r.name]))

    // Update records with resolved names
    records.forEach(record => {
      if (record['Related Field']) {
        if (Array.isArray(record['Related Field'])) {
          record['Related Field Name'] = record['Related Field']
            .map((id: string) => nameMap.get(id) || id)
            .filter(Boolean)
        } else {
          record['Related Field Name'] = nameMap.get(record['Related Field']) || record['Related Field']
        }
      }
    })
  } catch (error) {
    console.error('Error resolving linked record names:', error)
    // Don't throw - continue without resolved names
  }
}
```

### Step 3: Update CRUD Methods

Update all methods that return records:

```typescript
async findById(id: string): Promise<any | null> {
  const record = await this.base(this.tableName).find(id)
  const mapped = this.mapAirtableToYourTable(record)
  await this.resolveLinkedRecordNames([mapped])
  return mapped
}

async findAll(): Promise<any[]> {
  const records = await this.base(this.tableName).select({}).all()
  const mapped = records.map(record => this.mapAirtableToYourTable(record))
  await this.resolveLinkedRecordNames(mapped)
  return mapped
}

async findPaginated(...): Promise<{ records: any[], total: number }> {
  // ... fetch records
  const mapped = records.map(record => this.mapAirtableToYourTable(record))
  await this.resolveLinkedRecordNames(mapped)
  return { records: mapped, total }
}

async create(fields: Record<string, any>): Promise<any> {
  const record = await this.base(this.tableName).create(airtableFields)
  const mapped = this.mapAirtableToYourTable(record)
  await this.resolveLinkedRecordNames([mapped])
  return mapped
}

async update(id: string, fields: Record<string, any>): Promise<any> {
  const record = await this.base(this.tableName).update(id, airtableFields)
  const mapped = this.mapAirtableToYourTable(record)
  await this.resolveLinkedRecordNames([mapped])
  return mapped
}
```

### Step 4: Update Frontend API Types

Add resolved name fields to the TypeScript interface:

```typescript
export interface YourTable {
  id: string
  // ... other fields
  RelatedField?: string | string[]
  RelatedFieldName?: string | string[] // Resolved names
}
```

### Step 5: Update Frontend Config

Add columns for resolved names in list view:

```typescript
columns: [
  // ... other columns
  {
    key: 'RelatedFieldName',
    label: 'Related Field',
    sortable: false,
    render: (value: string | string[] | undefined, item: YourTable) => {
      let displayNames: string | undefined
      if (value) {
        displayNames = Array.isArray(value) ? value.filter(Boolean).join(', ') : value
      } else if (item.RelatedFieldName) {
        displayNames = Array.isArray(item.RelatedFieldName) 
          ? item.RelatedFieldName.filter(Boolean).join(', ') 
          : item.RelatedFieldName
      }
      
      if (!displayNames && item.RelatedField) {
        return <span className="text-sm text-neutral-400 italic">Loading...</span>
      }
      
      return <span className="text-sm text-neutral-700">{displayNames || '—'}</span>
    },
  },
]
```

Update detail panel fields to use `choiceList`:

```typescript
fields: [
  // ... other fields
  {
    key: 'RelatedField',
    label: 'Related Field',
    type: 'choiceList',
    editable: true,
    options: async () => {
      // Fetch options from target table API
      const result = await targetTableApi.getPaginated({ page: 1, limit: 1000 })
      return result.data.map(item => `${item.Name}|${item.id}`)
    },
    section: 'relationships',
  },
]
```

## Helper Script

Use the relationship detection script to automatically detect relationships:

```bash
node scripts/detect-relationships.mjs "Table Name" [baseId]
```

This script will:
1. Fetch the Airtable schema for the table
2. Detect all linked record fields
3. Generate the resolution code automatically

## Completed Implementations

### ✅ EF GWP
- Relationships: `greenHouseGas` → GHG Type, `protocol` → Protocol, `efDetailedG` → EF/Detailed G
- Status: Fully implemented with name resolution

### ✅ User Table
- Relationships: `Company` → Companies, `User Roles` → User Roles, `Organization Scope` → Organization Scope, `Modules` → Modules
- Status: Fully implemented with name resolution

## Tables Pending Implementation

### Emission Factor Version
- Potential relationships: `Emission Factor Set`, `Std Emission factors`
- Status: Needs schema verification

### Geography
- Potential relationships: Check Airtable schema
- Status: Needs investigation

### GHG Type
- Potential relationships: Reverse relationships from EF GWP
- Status: May not need resolution (source table)

## Best Practices

1. **Always resolve after updates**: After creating or updating a record, fetch the full resolved record to ensure names are current
2. **Handle missing relationships gracefully**: If a linked record doesn't exist, show the ID as fallback
3. **Cache aggressively**: RelationshipResolver uses caching, but you can add additional caching at the service level
4. **Parallel resolution**: Resolve all relationships in parallel using `Promise.all()` for better performance
5. **Error handling**: Never throw errors in resolution methods - log and continue without resolved names

## Testing

After implementing relationship reconciliation:

1. **List View**: Verify resolved names appear instead of IDs
2. **Detail View**: Verify resolved names are displayed and editable
3. **Update Flow**: Change a linked record and verify the list updates immediately with new names
4. **Create Flow**: Create a new record with linked records and verify names resolve correctly

## Troubleshooting

### Names not appearing
- Check that `resolveLinkedRecordNames()` is called after mapping
- Verify the target table name matches exactly (case-sensitive)
- Check that the display field name is correct (usually "Name")
- Verify the relationship resolver is initialized

### Performance issues
- Ensure relationships are resolved in parallel
- Check that RelationshipResolver caching is working
- Consider batch size limits for very large datasets

### Type errors
- Ensure API types include both ID and Name fields
- Check that frontend configs use the correct field names
- Verify TypeScript interfaces match the actual data structure

