# System Configuration Space - Airtable Schema

**Base ID:** `appGtLbKhmNkkTLVL`  
**Base Name:** System configuration space  
**Extracted:** 2025-01-11

## Overview

This document contains the complete schema structure of the System Configuration workspace in Airtable, including all tables, fields, field types, and relationships.

---

## Tables Summary

The System Configuration workspace contains **20 tables** with various relationships and field types.

### Table List

1. **Parent Company** (`tbl82H6ezrakMSkV1`)
2. **Emission Factor Set** (`tblWqUNyat8ijCvrn`)
3. **Std Emission factors** (`tblCelrEqu8rV486L`)
4. **EF/Detailed G** (`tblHxPSQIEvC65Lav`)
5. **Commodity** (`tblj9hLv7DPfhMOa4`)
6. **Unit Conversion** (`tblu8uINdexiEwvkB`)
7. **Emission Factor** (`tbl8qJ8qJ8qJ8qJ8q`)
8. **Division** (`tblLIRnxlCNotH2FY`)
9. **EF GWP** (`tblASLDn54Lni8avO`)
10. **GHG TYPE** (`tblG7T6uhVW1PBGik`)
11. **Emission Factor Version** (`tblqdF1SxpPnApvGz`)
12. **Protocol** (`tbl1ic21SAfMwdd3C`)
13. **Emission Factor Set Lifecycle Stage** (`tbl5NbZpWH9tZr2xU`)
14. **Application list** (`tbl4uNhIUBerxuSlT`)
15. **Activity Density** (`tblujWtA0mEuiREBF`)
16. *(Additional tables may exist - see full JSON export)*

---

## Key Relationships

### Core Data Model

```
Parent Company
  └── Division (linked via "Parent Company" field)
      └── (various emission-related tables)

Emission Factor Set
  └── Emission Factor Version
      └── Std Emission factors
          └── EF/Detailed G
              └── EF GWP
                  └── GHG TYPE

Commodity
  └── Activity Density
      └── Unit Conversion
```

### Relationship Details

1. **Parent Company ↔ Division**
   - One-to-Many relationship
   - Division table has "Parent Company" field linking to Parent Company

2. **Emission Factor Set ↔ Emission Factor Version**
   - One-to-Many relationship
   - Version links to Set via "Emission Factor Set" field

3. **Emission Factor Version ↔ Std Emission factors**
   - Many-to-Many relationship
   - Linked via "Std Emission factors" field

4. **GHG TYPE ↔ EF GWP**
   - Many-to-Many relationship
   - Bidirectional link

5. **Commodity ↔ Activity Density**
   - One-to-Many relationship
   - Activity Density links to Commodity

---

## Field Types Used

The schema uses various Airtable field types:

- **singleLineText** - Text fields
- **multilineText** - Long text/notes
- **number** - Numeric values (with precision settings)
- **singleSelect** - Dropdown with predefined choices
- **multipleSelects** - Multi-select dropdown
- **multipleRecordLinks** - Links to other tables (relationships)
- **formula** - Calculated fields
- **date** - Date fields
- **dateTime** - Date and time fields
- **createdBy** - Auto-track creator
- **lastModifiedBy** - Auto-track last modifier
- **createdTime** - Auto-track creation time
- **lastModifiedTime** - Auto-track modification time
- **url** - URL fields
- **button** - Action buttons
- **multipleAttachments** - File attachments
- **singleCollaborator** - User assignment
- **multipleLookupValues** - Lookup fields from linked records

---

## Common Patterns

### Status Fields
Many tables include status fields with choices:
- **Active/Inactive** (most common)
- **Todo/In progress/Done** (for lifecycle stages)

### Audit Fields
Most tables include:
- **Created By** (createdBy)
- **Created** (createdTime)
- **Last Modified By** (lastModifiedBy)
- **Last Modified** (lastModifiedTime)

### Notes Fields
Many tables have a "Notes" field (multilineText) for additional information.

---

## Detailed Table Information

*(Full detailed schema available in JSON format - see `data/system-config-schema.json`)*

### Example: Parent Company Table

- **Table ID:** `tbl82H6ezrakMSkV1`
- **Primary Field:** Name (singleLineText)
- **Key Fields:**
  - Name
  - Ref. (Reference)
  - Status (Active/Inactive)
  - Division (reverse link from Division table)

### Example: Emission Factor Set

- **Table ID:** `tblWqUNyat8ijCvrn`
- **Primary Field:** Name (singleLineText)
- **Key Fields:**
  - Name
  - Description
  - Status
  - Emission Factor Version (linked)

---

## Usage Notes

1. **Base ID:** Use `appGtLbKhmNkkTLVL` to connect to this base
2. **API Access:** Requires Personal Access Token with appropriate scopes
3. **Relationships:** Many tables are interconnected - be careful when querying to avoid circular references
4. **Status Fields:** Filter by status to get only active records where applicable
5. **Audit Trail:** Use created/modified fields for tracking changes

---

## Next Steps

- [ ] Map relationships visually
- [ ] Create TypeScript interfaces for each table
- [ ] Build API wrapper functions for common operations
- [ ] Document business logic and validation rules
- [ ] Create data migration scripts if needed

---

*Schema extracted using Airtable Meta API on 2025-01-11*

