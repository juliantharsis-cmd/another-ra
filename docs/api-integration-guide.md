# API Integration Guide

This guide explains how to integrate the API server with the frontend and how to migrate from mock data to PostgreSQL.

## Architecture Overview

```
Frontend (Next.js)          API Server (Express)          Data Layer
     │                              │                          │
     │  HTTP Requests               │                          │
     ├─────────────────────────────>│                          │
     │                              │  Repository Methods      │
     │                              ├─────────────────────────>│
     │                              │                          │
     │  JSON Responses              │  Data                    │
     │<─────────────────────────────┤<─────────────────────────┤
```

## API Endpoints

### Base URL
- Development: `http://localhost:3001/api`
- Production: Set via `NEXT_PUBLIC_API_URL` environment variable

### Companies Endpoints

#### GET /api/companies
Retrieve all companies.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "isinCode": "KR7004730002",
      "companyName": "SK Inc., SK Trichem",
      "name": "SK Inc., SK Trichem",
      "status": "Active",
      "primarySector": "IT & software development, Chemicals",
      "primaryActivity": "IT services, Specialty chemicals",
      "primaryIndustry": "Services, Materials",
      "notes": "",
      "createdBy": "Julian THARSIS",
      "created": "2/16/2025 6:40pm",
      "lastModifiedBy": "Julian THARSIS",
      "lastModified": "10/18/2025 10:38am"
    }
  ],
  "count": 8
}
```

#### GET /api/companies/:id
Retrieve a single company by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "isinCode": "KR7004730002",
    "companyName": "SK Inc., SK Trichem",
    ...
  }
}
```

#### POST /api/companies
Create a new company.

**Request Body:**
```json
{
  "isinCode": "US1234567890",
  "companyName": "New Company Inc.",
  "name": "New Company Inc.",
  "status": "Active",
  "primaryIndustry": "Manufacturing",
  "primarySector": "Electronics",
  "primaryActivity": "Electronic components",
  "notes": "Optional notes"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "company-1234567890",
    "isinCode": "US1234567890",
    "companyName": "New Company Inc.",
    ...
    "createdBy": "System",
    "created": "12/20/2024 3:45pm",
    "lastModifiedBy": "System",
    "lastModified": "12/20/2024 3:45pm"
  },
  "message": "Company created successfully"
}
```

#### PUT /api/companies/:id
Update an existing company.

**Request Body:**
```json
{
  "companyName": "Updated Company Name",
  "status": "Closed",
  "notes": "Updated notes"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "companyName": "Updated Company Name",
    "status": "Closed",
    ...
    "lastModifiedBy": "System",
    "lastModified": "12/20/2024 4:00pm"
  },
  "message": "Company updated successfully"
}
```

#### DELETE /api/companies/:id
Delete a company.

**Response:**
```json
{
  "success": true,
  "message": "Company deleted successfully"
}
```

## Running the API Server

### Development

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

### Production

1. Build the TypeScript code:
   ```bash
   npm run build
   ```

2. Start the server:
   ```bash
   npm start
   ```

## Frontend Integration

The frontend uses the `companiesApi` client from `src/lib/api/companies.ts`. This client handles all HTTP requests to the API.

### Usage Example

```typescript
import { companiesApi } from '@/lib/api/companies'

// Get all companies
const companies = await companiesApi.getAll()

// Get a single company
const company = await companiesApi.getById('1')

// Create a company
const newCompany = await companiesApi.create({
  isinCode: 'US1234567890',
  companyName: 'New Company',
  status: 'Active',
})

// Update a company
const updated = await companiesApi.update('1', {
  companyName: 'Updated Name',
})

// Delete a company
await companiesApi.delete('1')
```

## Environment Variables

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Backend (server/.env)

```env
PORT=3001
NODE_ENV=development
```

## Migrating to PostgreSQL

### Step 1: Install Dependencies

```bash
cd server
npm install pg @types/pg
```

### Step 2: Create Database Schema

```sql
CREATE TABLE companies (
  id VARCHAR(255) PRIMARY KEY,
  isin_code VARCHAR(50) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  status VARCHAR(20) NOT NULL CHECK (status IN ('Active', 'Closed')),
  primary_sector TEXT,
  primary_activity TEXT,
  primary_industry TEXT,
  notes TEXT,
  created_by VARCHAR(255) NOT NULL,
  created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_modified_by VARCHAR(255) NOT NULL,
  last_modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_primary_industry ON companies(primary_industry);
```

### Step 3: Update CompanyRepository

Replace `server/src/data/CompanyRepository.ts` with PostgreSQL implementation:

```typescript
import { Pool } from 'pg'
import { Company, CreateCompanyDto, UpdateCompanyDto } from '../types/Company'

export class CompanyRepository {
  private pool: Pool

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  }

  async findAll(): Promise<Company[]> {
    const result = await this.pool.query('SELECT * FROM companies ORDER BY created DESC')
    return result.rows.map(this.mapRowToCompany)
  }

  async findById(id: string): Promise<Company | null> {
    const result = await this.pool.query('SELECT * FROM companies WHERE id = $1', [id])
    return result.rows.length > 0 ? this.mapRowToCompany(result.rows[0]) : null
  }

  async create(dto: CreateCompanyDto, userId: string): Promise<Company> {
    const id = `company-${Date.now()}`
    const now = new Date()
    
    const result = await this.pool.query(
      `INSERT INTO companies (
        id, isin_code, company_name, name, status, 
        primary_sector, primary_activity, primary_industry, notes,
        created_by, created, last_modified_by, last_modified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        id, dto.isinCode, dto.companyName, dto.name || dto.companyName,
        dto.status, dto.primarySector || '', dto.primaryActivity || '',
        dto.primaryIndustry || '', dto.notes || '',
        userId, now, userId, now
      ]
    )
    
    return this.mapRowToCompany(result.rows[0])
  }

  async update(id: string, dto: UpdateCompanyDto, userId: string): Promise<Company | null> {
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    if (dto.isinCode !== undefined) {
      updates.push(`isin_code = $${paramCount++}`)
      values.push(dto.isinCode)
    }
    if (dto.companyName !== undefined) {
      updates.push(`company_name = $${paramCount++}`)
      values.push(dto.companyName)
    }
    // ... add other fields

    updates.push(`last_modified_by = $${paramCount++}`)
    values.push(userId)
    updates.push(`last_modified = $${paramCount++}`)
    values.push(new Date())

    values.push(id)

    const result = await this.pool.query(
      `UPDATE companies SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    )

    return result.rows.length > 0 ? this.mapRowToCompany(result.rows[0]) : null
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM companies WHERE id = $1', [id])
    return result.rowCount > 0
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.pool.query('SELECT 1 FROM companies WHERE id = $1', [id])
    return result.rows.length > 0
  }

  private mapRowToCompany(row: any): Company {
    return {
      id: row.id,
      isinCode: row.isin_code,
      companyName: row.company_name,
      name: row.name,
      status: row.status,
      primarySector: row.primary_sector,
      primaryActivity: row.primary_activity,
      primaryIndustry: row.primary_industry,
      notes: row.notes,
      createdBy: row.created_by,
      created: row.created.toLocaleString(),
      lastModifiedBy: row.last_modified_by,
      lastModified: row.last_modified.toLocaleString(),
    }
  }
}
```

### Step 4: Update Environment Variables

Add to `server/.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/another_ra
```

## Testing the API

### Using curl

```bash
# Get all companies
curl http://localhost:3001/api/companies

# Get a single company
curl http://localhost:3001/api/companies/1

# Create a company
curl -X POST http://localhost:3001/api/companies \
  -H "Content-Type: application/json" \
  -H "X-User-Id: Julian THARSIS" \
  -d '{
    "isinCode": "US1234567890",
    "companyName": "Test Company",
    "status": "Active"
  }'

# Update a company
curl -X PUT http://localhost:3001/api/companies/1 \
  -H "Content-Type: application/json" \
  -H "X-User-Id: Julian THARSIS" \
  -d '{
    "companyName": "Updated Name"
  }'

# Delete a company
curl -X DELETE http://localhost:3001/api/companies/1
```

## Error Handling

All API responses follow this structure:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error message (in development)"
}
```

## Next Steps

1. Add authentication/authorization
2. Add request validation middleware
3. Add rate limiting
4. Add API documentation (Swagger/OpenAPI)
5. Add unit and integration tests
6. Set up CI/CD pipeline

