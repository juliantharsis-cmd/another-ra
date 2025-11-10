# Company Table Schema Analysis

**Table ID:** `tbl82H6ezrakMSkV1`  
**Table Name:** Companies  
**Primary Field ID:** `fldAuRGuZlxKQs1Nh`  
**Base ID:** `appGtLbKhmNkkTLVL`

## Overview

The Company table is a core organizational entity in the System Configuration workspace. It represents parent companies and contains extensive metadata including company identification, status, industry classification, CDP scores, and relationships to divisions and other entities.

## Complete Field Schema

### Primary Field
- **Name** (`fldAuRGuZlxKQs1Nh`)
  - Type: `singleLineText`
  - Primary key field
  - Used as the main identifier for the company

### Company Identification Fields

1. **Company Name** (`fldAuRGuZlxKQs1Nh` - appears to be same as Name)
   - Type: `singleLineText`
   - Full company name

2. **ISIN Code** 
   - Type: `singleLineText`
   - International Securities Identification Number
   - Used for financial/stock market identification

3. **Anonymized Name**
   - Type: `singleLineText`
   - Anonymized version of company name (for privacy/data protection)

### Status & Classification Fields

4. **Status**
   - Type: `singleSelect`
   - Options:
     - `Active` (green)
     - `Closed` (gray)
   - Indicates whether the company is currently active

5. **Primary Activity**
   - Type: `singleSelect`
   - Extensive list of activity options (100+ options)
   - Examples: Asset managers, Specialty chemicals, Biotechnology, Software, etc.
   - Describes the primary business activity

6. **Primary Sector**
   - Type: `singleSelect`
   - Options include: Financial services, Chemicals, Biotech & pharma, IT & software development, etc.
   - Higher-level sector classification

7. **Primary Industry**
   - Type: `singleSelect`
   - Options: Services, Materials, Biotech/health care & pharma, Hospitality, Manufacturing, etc.
   - Highest-level industry classification

### CDP (Carbon Disclosure Project) Integration Fields

8. **CDP Climate score** (multipleRecordLinks)
   - Type: `multipleRecordLinks`
   - Linked Table: `tblit5mtSXNRRpS9H`
   - Links to CDP Climate score records
   - Relationship: Many-to-Many (company can have multiple CDP scores over time)

9. **CDP RESULTS** (multipleRecordLinks)
   - Type: `multipleRecordLinks`
   - Linked Table: `tbl5Om9wENHAVKQSK`
   - Links to CDP results records

10. **Upload CDP chapter 6.5part1** (multipleRecordLinks)
    - Type: `multipleRecordLinks`
    - Linked Table: `tblPwni5NFLXD7wi2`
    - Links to uploaded CDP documentation

11. **2023 Overall Score** (from CDP Climate score) (multipleLookupValues)
    - Type: `multipleLookupValues`
    - Lookup field pulling from linked CDP Climate score records
    - Shows 2023 overall CDP score

12. **Regional Score Average** (from CDP Climate score) (multipleLookupValues)
    - Type: `multipleLookupValues`
    - Average regional CDP score

13. **Sector Score Average** (from CDP Climate score) (multipleLookupValues)
    - Type: `multipleLookupValues`
    - Average sector CDP score

14. **2022 Score** (from CDP Climate score) (multipleLookupValues)
    - Type: `multipleLookupValues`
    - Historical 2022 CDP score

15. **2021 Score** (from CDP Climate score) (multipleLookupValues)
    - Type: `multipleLookupValues`
    - Historical 2021 CDP score

16. **2020 Score** (from CDP Climate score) (multipleLookupValues)
    - Type: `multipleLookupValues`
    - Historical 2020 CDP score

17. **Opportunity Disclosure** (from CDP Climate score) (multipleLookupValues)
    - Type: `multipleLookupValues`
    - Opportunity disclosure metrics from CDP

18. **Scope 1 & 2 emissions (incl. verification)** (from CDP Climate score) (multipleLookupValues)
    - Type: `multipleLookupValues`
    - Scope 1 and 2 emissions data with verification status

19. **Targets** (from CDP Climate score) (multipleLookupValues)
    - Type: `multipleLookupValues`
    - Climate targets from CDP

20. **Value chain engagement** (from CDP Climate score) (multipleLookupValues)
    - Type: `multipleLookupValues`
    - Value chain engagement metrics

21. **Business Strategy, Financial Planning & Scenario Analysis** (from CDP Climate score) (multipleLookupValues)
    - Type: `multipleLookupValues`
    - Business strategy metrics

22. **Emissions reduction initiatives and low carbon products** (from CDP Climate score) (multipleLookupValues)
    - Type: `multipleLookupValues`
    - Emissions reduction initiatives

23. **Energy** (from CDP Climate score) (multipleLookupValues)
    - Type: `multipleLookupValues`
    - Energy-related metrics

24. **Governance** (from CDP Climate score) (multipleLookupValues)
    - Type: `multipleLookupValues`
    - Governance metrics

### SBTi (Science Based Targets initiative) Integration

25. **SBTI DATA** (multipleRecordLinks)
    - Type: `multipleRecordLinks`
    - Linked Table: `tbl3od0OX5auIbhlB`
    - Links to Science Based Targets initiative data
    - Relationship: Many-to-Many

26. **company_name** (from SBTI DATA) (multipleLookupValues)
    - Type: `multipleLookupValues`
    - Lookup field from SBTI DATA records

### Administrative Fields

27. **Notes**
    - Type: `multilineText`
    - Free-form notes about the company

28. **Assignee**
    - Type: `singleCollaborator`
    - User assigned to manage/track this company record
    - References a user/collaborator

### Audit Trail Fields

29. **Last Modified By**
    - Type: `lastModifiedBy`
    - Automatically tracks who last modified the record
    - System-managed field

30. **Last Modified**
    - Type: `lastModifiedTime`
    - Automatically tracks when the record was last modified
    - System-managed field
    - Format: DateTime with local date format and 12-hour time format

## Relationships

### Outgoing Relationships (Company → Other Tables)

1. **Company → Division** (One-to-Many)
   - **Direction:** Company has many Divisions
   - **Implementation:** Division table has a "Parent Company" field that links to Company
   - **Field in Division table:** `Parent Company` (multipleRecordLinks)
   - **Relationship Type:** One-to-Many (one company, many divisions)
   - **Note:** This is the PRIMARY organizational relationship

2. **Company → CDP Climate score** (Many-to-Many)
   - **Field:** `CDP Climate score`
   - **Linked Table:** `tblit5mtSXNRRpS9H`
   - **Relationship Type:** Many-to-Many
   - **Purpose:** Track CDP scores over time (historical data)

3. **Company → CDP RESULTS** (Many-to-Many)
   - **Field:** `CDP RESULTS`
   - **Linked Table:** `tbl5Om9wENHAVKQSK`
   - **Relationship Type:** Many-to-Many

4. **Company → Upload CDP chapter 6.5part1** (Many-to-Many)
   - **Field:** `Upload CDP chapter 6.5part1`
   - **Linked Table:** `tblPwni5NFLXD7wi2`
   - **Relationship Type:** Many-to-Many

5. **Company → SBTI DATA** (Many-to-Many)
   - **Field:** `SBTI DATA`
   - **Linked Table:** `tbl3od0OX5auIbhlB`
   - **Relationship Type:** Many-to-Many

### Incoming Relationships (Other Tables → Company)

1. **Division → Company** (Many-to-One)
   - **Direction:** Division belongs to one Company
   - **Field in Division:** `Parent Company`
   - **Relationship Type:** Many-to-One (many divisions, one company)
   - **Inverse of:** Company → Division relationship

## SQL Database Mapping Strategy

### Recommended SQL Table Structure

```sql
CREATE TABLE companies (
    -- Primary Key
    id VARCHAR(50) PRIMARY KEY,  -- Airtable record ID (e.g., 'rec...')
    
    -- Company Identification
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    isin_code VARCHAR(50),
    anonymized_name VARCHAR(255),
    
    -- Status & Classification
    status VARCHAR(20) CHECK (status IN ('Active', 'Closed')),
    primary_activity VARCHAR(255),
    primary_sector VARCHAR(255),
    primary_industry VARCHAR(255),
    
    -- Notes & Assignment
    notes TEXT,
    assignee_id VARCHAR(50),  -- Reference to users/collaborators table
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    last_modified_by VARCHAR(50),
    
    -- Indexes
    INDEX idx_status (status),
    INDEX idx_primary_industry (primary_industry),
    INDEX idx_primary_sector (primary_sector)
);
```

### Relationship Tables (Junction Tables)

```sql
-- Company to CDP Climate Score (Many-to-Many)
CREATE TABLE company_cdp_climate_scores (
    company_id VARCHAR(50),
    cdp_climate_score_id VARCHAR(50),
    PRIMARY KEY (company_id, cdp_climate_score_id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (cdp_climate_score_id) REFERENCES cdp_climate_scores(id)
);

-- Company to CDP RESULTS (Many-to-Many)
CREATE TABLE company_cdp_results (
    company_id VARCHAR(50),
    cdp_result_id VARCHAR(50),
    PRIMARY KEY (company_id, cdp_result_id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (cdp_result_id) REFERENCES cdp_results(id)
);

-- Company to SBTI DATA (Many-to-Many)
CREATE TABLE company_sbti_data (
    company_id VARCHAR(50),
    sbti_data_id VARCHAR(50),
    PRIMARY KEY (company_id, sbti_data_id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (sbti_data_id) REFERENCES sbti_data(id)
);

-- Division to Company (Many-to-One) - handled in divisions table
CREATE TABLE divisions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_company_id VARCHAR(50),  -- Foreign key to companies
    ref VARCHAR(50),
    status VARCHAR(20),
    FOREIGN KEY (parent_company_id) REFERENCES companies(id),
    INDEX idx_parent_company (parent_company_id)
);
```

### Lookup Fields Handling

Lookup fields (multipleLookupValues) in Airtable are computed fields that pull values from linked records. In SQL, these should be:

1. **Computed via JOINs** - Query time calculations
2. **Materialized views** - Pre-computed for performance
3. **Denormalized columns** - If specific lookups are frequently accessed

Example for CDP scores:
```sql
-- Materialized view for 2023 Overall Score
CREATE VIEW company_cdp_scores_2023 AS
SELECT 
    c.id as company_id,
    c.name as company_name,
    cdp.overall_score_2023,
    cdp.regional_score_average,
    cdp.sector_score_average
FROM companies c
LEFT JOIN company_cdp_climate_scores j ON c.id = j.company_id
LEFT JOIN cdp_climate_scores cdp ON j.cdp_climate_score_id = cdp.id
WHERE cdp.year = 2023;
```

## Field Type Mappings: Airtable → SQL

| Airtable Type | SQL Type | Notes |
|--------------|----------|-------|
| `singleLineText` | `VARCHAR(255)` or `TEXT` | Adjust length based on field |
| `multilineText` | `TEXT` | For longer text content |
| `singleSelect` | `VARCHAR(50)` + CHECK constraint | Store option name, validate against allowed values |
| `multipleRecordLinks` | Junction table | Many-to-many relationships |
| `multipleLookupValues` | Computed/JOIN | Query-time calculation or materialized view |
| `singleCollaborator` | `VARCHAR(50)` FK | Reference to users table |
| `lastModifiedBy` | `VARCHAR(50)` | User ID |
| `lastModifiedTime` | `TIMESTAMP` | Auto-updated timestamp |
| `createdBy` | `VARCHAR(50)` | User ID |
| `createdTime` | `TIMESTAMP` | Creation timestamp |

## Key Considerations for SQL Migration

### 1. Primary Key Strategy
- **Option A:** Use Airtable record IDs (`rec...`) as primary keys
  - Pros: Direct mapping, preserves relationships
  - Cons: Not human-readable, external dependency
  
- **Option B:** Generate new integer primary keys
  - Pros: Standard SQL practice, better performance
  - Cons: Requires mapping table, more complex migration

**Recommendation:** Start with Option A for initial migration, add integer surrogate keys later if needed.

### 2. Status and Classification Fields
- Create reference tables for `primary_activity`, `primary_sector`, `primary_industry`
- Use foreign keys for data integrity
- Allows for easier updates and reporting

```sql
CREATE TABLE primary_activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE primary_sectors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE primary_industries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) UNIQUE NOT NULL
);
```

### 3. Lookup Fields Strategy
- **Immediate:** Use JOINs in queries
- **Performance:** Create materialized views for frequently accessed lookups
- **Real-time:** Consider triggers or application-level caching

### 4. Audit Trail
- Maintain `created_at`, `updated_at`, `created_by`, `updated_by`
- Consider audit log table for change tracking
- Map Airtable collaborator IDs to user table

### 5. Relationship Integrity
- Use foreign key constraints
- Consider cascade rules (RESTRICT, CASCADE, SET NULL)
- For Company → Division: CASCADE DELETE might be appropriate
- For Company → CDP scores: RESTRICT DELETE (preserve historical data)

## API Endpoint Mapping Strategy

### Recommended REST Endpoints

```
GET    /api/companies                    # List all companies
GET    /api/companies/:id                # Get single company
POST   /api/companies                    # Create company
PUT    /api/companies/:id                # Update company
DELETE /api/companies/:id                # Delete company

GET    /api/companies/:id/divisions     # Get divisions for company
GET    /api/companies/:id/cdp-scores     # Get CDP scores for company
GET    /api/companies/:id/sbti-data      # Get SBTi data for company

GET    /api/companies?status=Active      # Filter by status
GET    /api/companies?industry=Services # Filter by industry
GET    /api/companies?search=keyword     # Search companies
```

### Response Structure Example

```json
{
  "id": "recABC123",
  "name": "Example Corporation",
  "company_name": "Example Corporation Inc.",
  "isin_code": "US1234567890",
  "status": "Active",
  "primary_activity": "Software",
  "primary_sector": "IT & software development",
  "primary_industry": "Services",
  "divisions": [
    {
      "id": "recXYZ789",
      "name": "North America Division",
      "ref": "NA-001"
    }
  ],
  "cdp_scores": {
    "2023": {
      "overall_score": "B",
      "regional_average": "B+",
      "sector_average": "B-"
    }
  },
  "created_at": "2023-01-15T10:30:00Z",
  "updated_at": "2024-12-01T14:22:00Z"
}
```

## Next Steps for Implementation

1. **Phase 1: Core Table**
   - Create `companies` table with essential fields
   - Implement basic CRUD operations
   - Test with sample data

2. **Phase 2: Relationships**
   - Create `divisions` table with foreign key to companies
   - Implement Company → Division relationship
   - Test relationship queries

3. **Phase 3: Extended Relationships**
   - Create junction tables for CDP and SBTi relationships
   - Implement lookup field queries (JOINs)
   - Create materialized views for performance

4. **Phase 4: API Layer**
   - Build REST endpoints
   - Implement filtering and search
   - Add pagination and sorting

5. **Phase 5: Integration**
   - Connect to frontend
   - Replace Airtable queries with SQL queries
   - Test end-to-end workflows

## Notes

- The Company table has **38 fields** total
- Many fields are lookup fields that pull data from related tables
- CDP integration is extensive with multiple score types and historical data
- The relationship to Division is the primary organizational hierarchy
- Status field uses color coding in Airtable (Active=green, Closed=gray)

