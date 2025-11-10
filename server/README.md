# Another RA API Server

RESTful API server for the Another RA application, providing endpoints for managing companies.

## Features

- RESTful API endpoints for CRUD operations on companies
- **Airtable integration** - Connected to Airtable as data source
- **Automatic fallback** - Falls back to mock data if Airtable is unavailable
- **PostgreSQL-ready** - Easy to swap Airtable for PostgreSQL later
- TypeScript for type safety
- Express.js for the HTTP server
- CORS enabled for frontend integration

## API Endpoints

### Companies

- `GET /api/companies` - Get all companies
- `GET /api/companies/:id` - Get a single company by ID
- `POST /api/companies` - Create a new company
- `PUT /api/companies/:id` - Update a company
- `DELETE /api/companies/:id` - Delete a company

### Health Check

- `GET /health` - Server health status

## Installation

```bash
cd server
npm install
```

## Airtable Setup

1. Create a `.env` file in the `server` directory (see `env.example`)
2. Add your Airtable credentials:
   ```env
   AIRTABLE_PERSONAL_ACCESS_TOKEN=your_token_here
   AIRTABLE_SYSTEM_CONFIG_BASE_ID=your_base_id_here
   AIRTABLE_COMPANY_TABLE_NAME=Companies
   ```
3. See `AIRTABLE_SETUP.md` for detailed setup instructions

## Development

```bash
npm run dev
```

The API will run on `http://localhost:3001` (or the port specified in `.env`).

## Production Build

```bash
npm run build
npm start
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

## Data Source

The API currently uses **Airtable** as the data source. It automatically falls back to mock data if:
- Airtable credentials are not configured
- There's an error connecting to Airtable

### Switching to PostgreSQL

To switch from Airtable to PostgreSQL:

1. Install PostgreSQL dependencies:
   ```bash
   npm install pg @types/pg
   ```

2. Create a `PostgreSQLService` similar to `AirtableService`

3. Update `src/data/CompanyRepository.ts` to use PostgreSQL instead of Airtable

4. **The frontend integration remains unchanged** - the API interface stays the same

## Sample API Responses

### GET /api/companies

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

### POST /api/companies

Request body:
```json
{
  "isinCode": "US1234567890",
  "companyName": "New Company Inc.",
  "status": "Active",
  "primaryIndustry": "Manufacturing",
  "primarySector": "Electronics",
  "primaryActivity": "Electronic components"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "company-1234567890",
    "isinCode": "US1234567890",
    "companyName": "New Company Inc.",
    "name": "New Company Inc.",
    "status": "Active",
    "primarySector": "Electronics",
    "primaryActivity": "Electronic components",
    "primaryIndustry": "Manufacturing",
    "notes": "",
    "createdBy": "System",
    "created": "12/20/2024 3:45pm",
    "lastModifiedBy": "System",
    "lastModified": "12/20/2024 3:45pm"
  },
  "message": "Company created successfully"
}
```

