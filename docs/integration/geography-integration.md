# Geography Table Integration

## Overview

The Geography table from Airtable has been integrated into the Another Resource Advisor platform using the `ListDetailTemplate` system. This provides a consistent list/detail view experience with pagination, filtering, sorting, and inline editing.

## Implementation

### Frontend

1. **API Client** (`src/lib/api/geography.ts`)
   - Handles all HTTP requests to the geography API
   - Supports pagination, filtering, sorting, and search
   - Includes retry logic for network errors

2. **Template Configuration** (`src/components/templates/configs/geographyConfig.tsx`)
   - Defines columns, fields, filters, and panel sections
   - Maps Geography entity to the template structure
   - Configures API client integration

3. **Page Component** (`src/app/spaces/system-config/geography/page.tsx`)
   - Simple page component using `ListDetailTemplate`
   - Minimal code - all logic handled by template

### Backend

1. **Airtable Service** (`server/src/services/GeographyAirtableService.ts`)
   - Handles direct Airtable API interactions
   - Maps Airtable fields to Geography interface
   - Supports pagination, filtering, and CRUD operations

2. **Repository** (`server/src/data/GeographyRepository.ts`)
   - Data access layer
   - Currently uses Airtable, can be swapped for PostgreSQL later

3. **Controller** (`server/src/controllers/GeographyController.ts`)
   - Handles HTTP requests
   - Validates input and returns JSON responses

4. **Routes** (`server/src/routes/geographyRoutes.ts`)
   - Defines API endpoints:
     - `GET /api/geography` - List all (with pagination/filters)
     - `GET /api/geography/:id` - Get single record
     - `POST /api/geography` - Create new record
     - `PUT /api/geography/:id` - Update record
     - `DELETE /api/geography/:id` - Delete record
     - `GET /api/geography/filters/values` - Get filter options

## Geography Fields

### List View Columns
- **Region Name** - Sortable, left-aligned
- **Country** - Sortable, filterable, left-aligned
- **Status** - Sortable, filterable, center-aligned (with badge styling)

### Detail Panel Sections

#### General Information
- **Region Name** (text, required, editable)
- **Country** (text, required, editable)
- **Status** (choiceList, editable)

#### Notes & Comments
- **Notes** (textarea, editable)

#### Activity Log
- **Created At** (readonly)
- **Updated At** (readonly)
- **Created By** (readonly)
- **Last Modified By** (readonly)

## API Endpoints

### GET /api/geography
Query parameters:
- `page` - Page number (1-based)
- `limit` - Records per page
- `offset` - Records to skip
- `sortBy` - Field to sort by (regionName, country, status)
- `sortOrder` - 'asc' or 'desc'
- `search` - Full-text search
- `status` - Filter by status
- `country` - Filter by country
- `paginated` - Set to 'true' for paginated response

### GET /api/geography/:id
Returns a single geography record by ID.

### POST /api/geography
Body:
```json
{
  "regionName": "Europe",
  "country": "France",
  "status": "Active",
  "notes": "Optional notes"
}
```

### PUT /api/geography/:id
Body (all fields optional):
```json
{
  "regionName": "Updated Region",
  "country": "Updated Country",
  "status": "Inactive",
  "notes": "Updated notes"
}
```

### DELETE /api/geography/:id
Deletes a geography record.

### GET /api/geography/filters/values
Query parameters:
- `field` - Field name ('status' or 'country')
- `limit` - Maximum number of values to return

## Airtable Configuration

### Environment Variables

Add to `server/.env`:
```env
AIRTABLE_GEOGRAPHY_TABLE_ID=tblXXXXXXXXXXXXX
# OR
AIRTABLE_GEOGRAPHY_TABLE_NAME=Geography
```

### Field Mapping

The service maps Airtable fields to the Geography interface:
- `Region Name` → `regionName`
- `Country` → `country`
- `Status` → `status`
- `Notes` → `notes`

If your Airtable table uses different field names, update the mapping in `GeographyAirtableService.mapAirtableToGeography()`.

## Usage

1. Navigate to `/spaces/system-config/geography`
2. View the list of geography records
3. Click a row or eye icon to open detail panel
4. Edit fields inline and save changes
5. Use filters to narrow down results
6. Sort by clicking column headers

## Future Enhancements

- [ ] Add import/export functionality
- [ ] Add bulk operations
- [ ] Add advanced filtering (date ranges, etc.)
- [ ] Add search within filters
- [ ] Add saved filter sets
- [ ] Migrate to PostgreSQL adapter when ready

## Migration to PostgreSQL

When ready to migrate from Airtable to PostgreSQL:

1. Create a `GeographyPostgreSQLAdapter` implementing `IDatabase`
2. Update `GeographyRepository` to use the adapter
3. No frontend changes needed - the template and API client remain the same

The API abstraction ensures the UI continues to work regardless of the data source.








