# Relationship Framework for Linked Data

## Overview

This framework provides a generic, reusable system for handling linked record relationships between tables in Another RA. It automatically detects relationships from Airtable schema, resolves linked record IDs to display names, and supports bidirectional relationships.

## Architecture

### Core Components

1. **RelationshipResolver** (`server/src/services/RelationshipResolver.ts`)
   - Generic service for resolving linked record IDs to names
   - Caching for performance
   - Automatic schema detection from Airtable Metadata API

2. **Relationship Configuration**
   - Defined per table in service files
   - Supports one-to-many and many-to-many relationships
   - Bidirectional relationship support

3. **Frontend Integration**
   - Automatic name resolution in table configs
   - Relationship display in detail panels
   - Filter support for linked records

## Usage

### Backend: Define Relationships

```typescript
// In your AirtableService (e.g., EFGWPAirtableService.ts)
import { RelationshipResolver } from './RelationshipResolver'

export class EFGWPAirtableService {
  private relationshipResolver: RelationshipResolver

  constructor() {
    // ... existing initialization
    this.relationshipResolver = new RelationshipResolver(baseId, apiKey)
  }

  async mapAirtableToEFGWP(record: Airtable.Record<any>): Promise<EFGWP> {
    const fields = record.fields
    
    // Extract linked record IDs
    const greenHouseGasIds = fields['Green House Gas'] || []
    
    // Resolve to names
    const resolvedGHG = await this.relationshipResolver.resolveLinkedRecords(
      greenHouseGasIds,
      'GHG Type',
      'Name'
    )
    
    return {
      id: record.id,
      // ... other fields
      greenHouseGas: greenHouseGasIds.map(r => r.id || r),
      greenHouseGasName: resolvedGHG.map(r => r.name),
    }
  }
}
```

### Frontend: Display Relationships

```typescript
// In your table config (e.g., efGwpConfig.tsx)
{
  key: 'greenHouseGasName',
  label: 'GHG Type',
  sortable: false,
  filterable: true,
  render: (value: string | string[] | undefined, item: EFGWP) => {
    const names = Array.isArray(value) ? value : (value ? [value] : [])
    return (
      <div className="flex flex-wrap gap-1">
        {names.map((name, idx) => (
          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
            {name}
          </span>
        ))}
      </div>
    )
  },
}
```

## Relationship Types

### One-to-Many (1:N)
- Example: GHG Type → EF GWP
- One GHG Type can have many EF GWP records
- EF GWP has a "Green House Gas" field linking to GHG Type

### Many-to-Many (N:N)
- Example: Protocol ↔ EF GWP
- Protocols can have multiple EF GWP records
- EF GWP records can belong to multiple protocols

### Bidirectional
- When both tables have linked record fields pointing to each other
- Automatically detected from Airtable schema
- Both directions are resolved and displayed

## Schema Detection

The framework automatically detects relationships by:
1. Fetching table schema from Airtable Metadata API
2. Identifying fields of type `multipleRecordLinks`
3. Extracting `linkedTableId` and `linkedTableName`
4. Building relationship configuration

## Caching

- Relationship names are cached for 5 minutes
- Cache is automatically invalidated on updates
- Per-table cache clearing supported

## Future Enhancements

- [ ] Relationship graph visualization
- [ ] Relationship filtering in queries
- [ ] Relationship editing (add/remove links)
- [ ] Relationship validation
- [ ] Relationship analytics

