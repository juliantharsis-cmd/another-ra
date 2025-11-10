# Companies API - Database-Ready Architecture

## Overview

The Companies API has been rebuilt with a **database abstraction layer** that allows seamless switching between different database backends without changing any business logic or API endpoints.

## Architecture

```
┌─────────────────────────────────────────┐
│         API Endpoints                   │
│    GET/POST/PUT/DELETE /api/companies   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      CompanyController                  │
│   (Request/Response Handling)           │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      CompanyRepository                   │
│   (Business Logic Layer)                 │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         IDatabase Interface              │
│      (Database Contract)                 │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
┌──────▼──────┐  ┌─────▼──────┐  ┌──────────────┐
│ Airtable    │  │ PostgreSQL  │  │ Mock         │
│ Adapter     │  │ Adapter     │  │ Adapter      │
└─────────────┘  └────────────┘  └──────────────┘
```

## Key Features

### ✅ Database Abstraction
- **IDatabase Interface**: Defines contract for all database implementations
- **Multiple Adapters**: Airtable, PostgreSQL (placeholder), Mock
- **Easy Switching**: Change database via environment variable

### ✅ Advanced Querying
- **Pagination**: Limit/offset support
- **Sorting**: Sort by any field, ascending/descending
- **Filtering**: Filter by status, industry, activity, etc.
- **Search**: Full-text search across company fields

### ✅ Type Safety
- Full TypeScript support
- Type-safe interfaces throughout
- Compile-time error checking

### ✅ Error Handling
- Consistent error responses
- Database-agnostic error handling
- Health check endpoints

## API Endpoints

### GET /api/companies
Retrieve all companies with optional query parameters.

**Query Parameters:**
- `limit` (number): Max records to return
- `offset` (number): Records to skip
- `sortBy` (string): Field to sort by
- `sortOrder` (string): 'asc' or 'desc'
- `search` (string): Full-text search
- `status` (string): Filter by status
- `primaryIndustry` (string): Filter by industry
- `primaryActivity` (string): Filter by activity
- `paginated` (boolean): Return paginated result

**Example:**
```
GET /api/companies?limit=10&offset=0&sortBy=companyName&sortOrder=asc&status=Active
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 10
}
```

**Paginated Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 14937,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

### GET /api/companies/:id
Retrieve a single company by ID.

### POST /api/companies
Create a new company.

**Request Body:**
```json
{
  "isinCode": "US1234567890",
  "companyName": "Example Corp",
  "name": "Example Corp",
  "status": "Active",
  "primarySector": "Technology",
  "primaryActivity": "Software",
  "primaryIndustry": "Services",
  "notes": "Optional notes"
}
```

### PUT /api/companies/:id
Update an existing company.

### DELETE /api/companies/:id
Delete a company.

### GET /api/status
Get database connection status and configuration.

**Response:**
```json
{
  "status": "ok",
  "database": {
    "type": "airtable",
    "adapter": "Airtable",
    "healthy": true
  },
  "airtable": {
    "configured": true,
    "baseId": "appGtLbKhmNkkTLVL",
    "tableId": "tbl82H6ezrakMSkV1"
  },
  "postgresql": {
    "configured": false
  }
}
```

## Switching Databases

### Using Airtable (Current)
```env
DATABASE_TYPE=airtable
AIRTABLE_PERSONAL_ACCESS_TOKEN=your_token
AIRTABLE_SYSTEM_CONFIG_BASE_ID=your_base_id
AIRTABLE_COMPANY_TABLE_ID=your_table_id
```

### Using PostgreSQL (Future)
```env
DATABASE_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=another_ra
DB_USER=postgres
DB_PASSWORD=your_password
```

### Using Mock (Testing)
```env
DATABASE_TYPE=mock
```

## Database Adapters

### 1. AirtableAdapter ✅
- **Status**: Fully implemented
- **Features**: Full CRUD, search, filtering, sorting, pagination
- **Location**: `src/database/adapters/AirtableAdapter.ts`

### 2. PostgreSQLAdapter 🚧
- **Status**: Placeholder (ready for implementation)
- **Location**: `src/database/adapters/PostgreSQLAdapter.ts`
- **TODO**: Implement PostgreSQL connection and queries

### 3. MockAdapter ✅
- **Status**: Fully implemented
- **Purpose**: Development, testing, fallback
- **Location**: `src/database/adapters/MockAdapter.ts`

## Implementation Guide for PostgreSQL

1. **Install dependencies:**
```bash
npm install pg
npm install --save-dev @types/pg
```

2. **Update PostgreSQLAdapter.ts:**
   - Initialize connection pool in constructor
   - Implement all IDatabase interface methods
   - Map database rows to Company interface

3. **Create database schema:**
```sql
CREATE TABLE companies (
  id VARCHAR(255) PRIMARY KEY,
  isin_code VARCHAR(50) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  status VARCHAR(20) NOT NULL,
  primary_sector TEXT,
  primary_activity TEXT,
  primary_industry TEXT,
  notes TEXT,
  created_by VARCHAR(255),
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified_by VARCHAR(255),
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

4. **Set environment variable:**
```env
DATABASE_TYPE=postgresql
```

## Benefits

1. **Database Agnostic**: Switch databases without code changes
2. **Easy Testing**: Use MockAdapter for unit tests
3. **Flexible**: Add new database adapters easily
4. **Type Safe**: TypeScript ensures interface compliance
5. **Maintainable**: Clear separation of concerns
6. **Scalable**: Ready for production database migration

## File Structure

```
server/
├── src/
│   ├── database/
│   │   ├── interfaces/
│   │   │   └── IDatabase.ts          # Database interface
│   │   ├── adapters/
│   │   │   ├── AirtableAdapter.ts    # Airtable implementation
│   │   │   ├── PostgreSQLAdapter.ts  # PostgreSQL placeholder
│   │   │   └── MockAdapter.ts        # Mock implementation
│   │   ├── DatabaseFactory.ts        # Factory for creating adapters
│   │   └── README.md                  # Database layer docs
│   ├── data/
│   │   └── CompanyRepository.ts      # Business logic layer
│   ├── controllers/
│   │   └── CompanyController.ts      # API endpoints
│   ├── services/
│   │   └── AirtableService.ts        # Airtable API client
│   └── types/
│       └── Company.ts                 # TypeScript interfaces
└── API_ARCHITECTURE.md                # This file
```

## Next Steps

1. ✅ Database abstraction layer created
2. ✅ Airtable adapter implemented
3. ✅ Mock adapter implemented
4. ✅ Query options (pagination, filtering, sorting) added
5. ⏳ Implement PostgreSQL adapter (when ready)
6. ⏳ Add database migrations
7. ⏳ Add connection pooling configuration
8. ⏳ Add caching layer

## Testing

Test the API with different database types:

```bash
# Test with Airtable
DATABASE_TYPE=airtable npm run dev

# Test with Mock
DATABASE_TYPE=mock npm run dev

# Test with PostgreSQL (when implemented)
DATABASE_TYPE=postgresql npm run dev
```

## Migration Path

When ready to migrate from Airtable to PostgreSQL:

1. Implement PostgreSQLAdapter
2. Set up PostgreSQL database
3. Migrate data from Airtable to PostgreSQL
4. Change `DATABASE_TYPE=postgresql` in environment
5. Restart API server
6. No frontend changes needed! 🎉

