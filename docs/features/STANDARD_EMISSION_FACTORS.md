# Standard Emission Factors Feature

You are a senior full-stack engineer. Implement a **Standard Emission Factors** feature that provides a comprehensive interface for managing standard emission factor definitions from the Airtable database in the system configuration space, with **ListDetailTemplate integration** and **relationship resolution**.

# Goals

1) **Create Backend Service Layer** - Build Airtable service for Standard Emission factors
   - Connect to "Std Emission factors" table in System Configuration base
   - Support pagination, filtering, sorting, and search
   - Resolve linked relationships (Emission Factor Version, Emission Factor Set, GHG TYPE, EF GWP, EF/Detailed G)
   - Handle status filtering (Active/Inactive)

2) **Create API Endpoints** - RESTful API for Standard Emission factors
   - `GET /api/standard-emission-factors` - List with pagination, search, filters
   - `GET /api/standard-emission-factors/:id` - Get single record
   - `POST /api/standard-emission-factors` - Create new record
   - `PUT /api/standard-emission-factors/:id` - Update record
   - `DELETE /api/standard-emission-factors/:id` - Delete record
   - `GET /api/standard-emission-factors/filters/values` - Get filter options

3) **Create Frontend Integration** - ListDetailTemplate configuration
   - Table columns: Name, Description, Status, Emission Factor Version, Emission Factor Set, GHG TYPE
   - Detail panel with sections: General Information, Relationships, Notes
   - Filters: Status, Emission Factor Version, Emission Factor Set
   - Search across Name and Description fields
   - Support for creating, editing, and deleting records

# Database Schema

**Airtable Table:** "Std Emission factors" (`tblCelrEqu8rV486L`)

**Fields:**
- `Name` (singleLineText) - Primary field, required
- `Description` (multilineText) - Optional
- `Status` (singleSelect) - 'Active' | 'Inactive', required
- `Emission Factor Version` (multipleRecordLinks) - Links to Emission Factor Version table
- `Emission Factor Set` (multipleRecordLinks) - Links to Emission Factor Set table
- `GHG TYPE` (multipleRecordLinks) - Links to GHG TYPE table
- `EF GWP` (multipleRecordLinks) - Links to EF GWP table
- `EF/Detailed G` (multipleRecordLinks) - Links to EF/Detailed G table
- `Notes` (multilineText) - Optional
- `Created` (createdTime) - Auto-tracked
- `Last Modified` (lastModifiedTime) - Auto-tracked
- `Created By` (createdBy) - Auto-tracked
- `Last Modified By` (lastModifiedBy) - Auto-tracked

# TypeScript Interfaces

```typescript
export interface StandardEmissionFactor {
  id: string // Airtable record ID
  Name?: string
  Description?: string
  Status?: 'Active' | 'Inactive'
  'Emission Factor Version'?: string | string[] // Record ID(s)
  'Emission Factor Version Name'?: string | string[] // Resolved name(s)
  'Emission Factor Set'?: string | string[] // Record ID(s)
  'Emission Factor Set Name'?: string | string[] // Resolved name(s)
  'GHG TYPE'?: string | string[] // Record ID(s)
  'GHG TYPE Name'?: string | string[] // Resolved name(s)
  'EF GWP'?: string | string[] // Record ID(s)
  'EF GWP Name'?: string | string[] // Resolved name(s)
  'EF/Detailed G'?: string | string[] // Record ID(s)
  'EF/Detailed G Name'?: string | string[] // Resolved name(s)
  Notes?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  lastModifiedBy?: string
}
```

# Implementation

## Backend Service

Service should:
- Use Airtable client to query "Std Emission factors" table
- Resolve linked record names for display
- Support server-side pagination and filtering
- Cache relationship resolutions for performance

## Frontend Configuration

ListDetailTemplate config should:
- Display Name, Description, Status in table columns
- Show relationship fields in detail panel with resolved names
- Support filtering by Status and linked relationships
- Enable inline editing of all editable fields

## API Routes

Routes should follow RESTful conventions:
- Use Express router
- Handle errors gracefully
- Return consistent response format: `{ success: boolean, data?: T, error?: string, pagination?: {...} }`

> NOTE: Ensure relationship fields are properly resolved for display. Linked records may be single or multiple, so handle both cases. Status field is required and should default to 'Active' for new records.

