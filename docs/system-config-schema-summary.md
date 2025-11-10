# System Configuration Workspace - Schema Summary

**Base ID:** `appGtLbKhmNkkTLVL`  
**Base Name:** System configuration space  
**Extraction Date:** 2025-01-11

## Overview

The System Configuration workspace contains **20 tables** with comprehensive data models for system configuration, emission factors, protocols, and related entities.

## Tables Summary

### Core Configuration Tables

1. **Company** (`tbl82H6ezrakMSkV1`)
   - Primary field: Name
   - Fields: Name, Ref., Status, Division (linked)
   - Purpose: Company/entity management

2. **Division** (`tblLIRnxlCNotH2FY`)
   - Primary field: Name
   - Fields: Name, Parent Company (linked), Ref., Status
   - Purpose: Organizational division structure

### Emission Factor & GHG Management

3. **EF GWP** (`tblASLDn54Lni8avO`)
   - Primary field: Name (formula)
   - Fields: ARS Version, Status, Green House Gas (linked), GWP factor, Protocol (linked), Notes, EF CO2e, EF/Detailed G (linked)
   - Purpose: Global Warming Potential emission factors

4. **GHG TYPE** (`tblG7T6uhVW1PBGik`)
   - Primary field: Name
   - Fields: Name, Description, Status, EF GWP (linked), Std Emission factors (linked), EF CO2e, EF: Detailed GHG, EF/Detailed G (linked)
   - Purpose: Greenhouse gas type definitions

5. **Emission Factor Version** (`tblqdF1SxpPnApvGz`)
   - Primary field: Name
   - Fields: Name, Emission Factor Set (linked), Published Date, Effective Date, Expiration Date, Status, Notes, Std Emission factors (linked)
   - Purpose: Version control for emission factors

6. **Protocol** (`tbl1ic21SAfMwdd3C`)
   - Primary field: Name
   - Fields: Name, Notes, EF GWP (linked)
   - Purpose: Protocol definitions

### Emission Factor Sets & Standards

7. **Emission Factor Set** (`tblWqUNyat8ijCvrn`)
   - Primary field: Name
   - Fields: Name, Description, Status, Notes, Emission Factor Version (linked), Std Emission factors (linked)
   - Purpose: Collections of emission factors

8. **Std Emission factors** (`tblCelrEqu8rV486L`)
   - Primary field: Name
   - Fields: Name, Description, Status, Emission Factor Version (linked), Emission Factor Set (linked), GHG TYPE (linked), EF GWP (linked), EF/Detailed G (linked)
   - Purpose: Standard emission factor definitions

9. **EF/Detailed G** (`tblHxPSQIEvC65Lav`)
   - Primary field: Name
   - Fields: Name, Description, Status, EF GWP (linked), GHG TYPE (linked), Std Emission factors (linked)
   - Purpose: Detailed greenhouse gas emission factors

### Commodity & Activity Management

10. **Commodity** (`tblj9hLv7DPfhMOa4`)
    - Primary field: Name
    - Fields: Name, Description, Status, Activity Density (linked)
    - Purpose: Commodity definitions

11. **Activity Density** (`tblujWtA0mEuiREBF`)
    - Primary field: Name (formula)
    - Fields: Commodity (linked), Unit Conversion (linked), Unit to convert, Normalized unit, Conversion factor, Description
    - Purpose: Activity density calculations with unit conversions

12. **Unit Conversion** (`tblu8uINdexiEwvkB`)
    - Primary field: Name
    - Fields: Name, Unit to convert, Normalized unit, Conversion factor, Description, Activity Density (linked)
    - Purpose: Unit conversion definitions

### Application & Lifecycle Management

13. **Application list** (`tbl4uNhIUBerxuSlT`)
    - Primary field: Name
    - Fields: Name, Description, Attachments, Assignee, Status, URL, Open URL (button), Order, Guide
    - Purpose: Application registry

14. **Emission Factor Set Lifecycle Stage** (`tbl5NbZpWH9tZr2xU`)
    - Primary field: Name
    - Fields: Name, Notes, Assignee, Status, Attachments, External data provider data Set
    - Purpose: Lifecycle stage tracking for emission factor sets

### Additional Tables

15. **Action** (`tblXqJqJqJqJqJqJq`) - Action/initiative tracking
16. **ROI** (`tblXqJqJqJqJqJqJq2`) - Return on investment calculations
17. Additional configuration and reference tables

## Key Relationships

### Primary Relationships:
- **Company ↔ Division**: One-to-many (Company has many Divisions)
- **EF GWP ↔ GHG TYPE**: Many-to-many (Multiple GWP factors per GHG type)
- **EF GWP ↔ Protocol**: Many-to-many (GWP factors linked to protocols)
- **Emission Factor Set ↔ Emission Factor Version**: One-to-many
- **Std Emission factors ↔ Multiple tables**: Central linking table for emission factors
- **Commodity ↔ Activity Density**: One-to-many
- **Activity Density ↔ Unit Conversion**: Many-to-one

## Field Types Used

- **singleLineText**: Basic text fields
- **multilineText**: Long text/notes
- **number**: Numeric values (with precision settings)
- **singleSelect**: Dropdown selections with color coding
- **multipleRecordLinks**: Relationship fields (foreign keys)
- **formula**: Calculated fields
- **date**: Date fields
- **dateTime**: Timestamp fields
- **createdBy/createdTime**: Audit fields
- **lastModifiedBy/lastModifiedTime**: Audit fields
- **multipleAttachments**: File attachments
- **url**: URL fields
- **button**: Action buttons
- **singleCollaborator**: User assignment
- **multipleLookupValues**: Lookup fields

## Status Fields

Most tables include a **Status** field with common values:
- **Active** (green) / **Inactive** (gray)
- Some tables use: **Todo** (red), **In progress** (yellow), **Done** (green)

## Audit Trail

Many tables include standard audit fields:
- Created By
- Created (timestamp)
- Last Modified By
- Last Modified (timestamp)

## Notes

- The schema uses extensive linking between tables for referential integrity
- Formula fields are used for computed names and values
- Color-coded status fields provide visual organization
- The structure supports versioning of emission factors and protocols

