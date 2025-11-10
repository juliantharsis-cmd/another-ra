# Product Requirements Document: Table Configuration Mode

## Document Information

**Document Title:** Table Configuration Mode Feature  
**Version:** 1.0  
**Date:** January 2025  
**Author:** Product Team  
**Status:** Draft  
**Domain:** system-config  
**Project Naming:** another-ra-ui, another-ra-api

---

## 1. Executive Summary

### 1.1. Problem Statement

Organizations using the sustainability management system need the ability to customize table structures to match their specific data requirements and workflows. Different organizations and use cases require different field configurations, field types, and format preferences. The current system has fixed table structures that cannot be modified by users, limiting flexibility and requiring developer intervention for structural changes. Users need a self-service capability to configure table schemas, add/remove fields, change field types, and customize format preferences without code changes.

### 1.2. Solution Overview

Implement a Configuration Mode accessible from any table that allows users to customize table structures including:
- Field name editing
- Field type selection (20+ types: text, number, currency, date, select, etc.)
- Format preferences (date formats, currency symbols, number precision, etc.)
- Add/remove fields
- Reorder fields
- Field validation rules (required, unique)
- Schema persistence in Airtable with abstraction for future PostgreSQL migration

The Configuration Mode provides a comprehensive interface for table customization while maintaining data integrity and supporting future database migrations.

### 1.3. Business Value

**Flexibility:** Enable users to adapt table structures to their specific needs without developer intervention  
**Efficiency:** Reduce time-to-market for new table configurations  
**Scalability:** Support multiple organizations with different data requirements  
**User Empowerment:** Self-service table customization reduces dependency on IT  
**Future-Proofing:** Schema abstraction layer supports database migration

---

## 2. User Personas & Use Cases

### 2.1. Primary Personas

**Persona 1: System Administrator**
- **Characteristics:** Technical professionals responsible for system configuration. Have administrative privileges and understand data modeling concepts.
- **Needs:** Ability to configure table structures, define field types, set format preferences, manage field order
- **Challenges:** Ensuring schema changes don't break existing data, maintaining data integrity, understanding field type implications

**Persona 2: Data Manager**
- **Characteristics:** Professionals managing organizational data structures. Need to adapt tables to changing business requirements.
- **Needs:** Add new fields, modify field names, change field types, configure format options
- **Challenges:** Understanding field type differences, maintaining consistency across tables

**Persona 3: Power User**
- **Characteristics:** Advanced users who understand data structures and need custom configurations.
- **Needs:** Customize table views, add calculated fields, configure display formats
- **Challenges:** Learning configuration interface, understanding validation rules

### 2.2. Use Cases

**UC1: Configure Table Structure**
- **Actor:** System Administrator, Data Manager
- **Description:** Access Configuration Mode and customize table fields
- **Preconditions:** User has admin privileges, table exists
- **Flow:** Click "Configure Table" button → Configuration panel opens → Edit fields → Save changes
- **Postconditions:** Table structure updated, changes reflected in table view

**UC2: Add New Field**
- **Actor:** System Administrator, Data Manager
- **Description:** Add a new field to an existing table
- **Preconditions:** User has admin privileges, Configuration Mode open
- **Flow:** Click "Add Field" → Enter field name → Select field type → Configure format → Save
- **Postconditions:** New field added to table, visible in table view

**UC3: Change Field Type**
- **Actor:** System Administrator
- **Description:** Change existing field type (e.g., text to number)
- **Preconditions:** User has admin privileges, field exists
- **Flow:** Open Configuration Mode → Select field → Change type → Configure new type options → Save
- **Postconditions:** Field type updated, format options adjusted

**UC4: Reorder Fields**
- **Actor:** System Administrator, Data Manager
- **Description:** Change the order of fields in table
- **Preconditions:** User has admin privileges, Configuration Mode open
- **Flow:** Use up/down arrows to reorder fields → Save
- **Postconditions:** Field order updated, reflected in table display

**UC5: Configure Format Preferences**
- **Actor:** System Administrator
- **Description:** Set format preferences for fields (date format, currency symbol, etc.)
- **Preconditions:** User has admin privileges, field type supports formats
- **Flow:** Open Configuration Mode → Select field → Configure format options → Save
- **Postconditions:** Format preferences saved, applied to field display

**UC6: Remove Field**
- **Actor:** System Administrator
- **Description:** Remove a field from table structure
- **Preconditions:** User has admin privileges, field exists
- **Flow:** Open Configuration Mode → Click remove button on field → Confirm → Save
- **Postconditions:** Field removed from table structure

---

## 3. User Stories

**US1:** As a system administrator, I want to access Configuration Mode from any table so that I can customize table structures.

**US2:** As a data manager, I want to add new fields to tables so that I can capture additional data without developer help.

**US3:** As a system administrator, I want to change field types so that I can adapt tables to changing data requirements.

**US4:** As a user, I want to edit field names so that I can use terminology that matches my organization's conventions.

**US5:** As a system administrator, I want to configure date formats so that dates display in my preferred format.

**US6:** As a data manager, I want to set currency symbols and precision so that financial data displays correctly.

**US7:** As a system administrator, I want to reorder fields so that I can prioritize important information.

**US8:** As a user, I want to mark fields as required or unique so that I can enforce data quality rules.

**US9:** As a system administrator, I want to configure select field options so that I can define dropdown choices.

**US10:** As a user, I want validation before saving so that I don't create invalid configurations.

---

## 4. Functional Requirements

### 4.1. Configuration Access

**FR1: Configuration Button**
- **Requirement:** "Configure Table" button accessible from table header
- **Acceptance Criteria:**
  - Button visible next to Import/Export buttons
  - Button opens Configuration Mode panel
  - Button accessible to users with admin privileges
  - Clear icon and label

**FR2: Configuration Panel**
- **Requirement:** Modal panel for table configuration
- **Acceptance Criteria:**
  - Panel opens as modal overlay
  - Panel displays current table name
  - Panel shows all current fields
  - Panel has Save and Cancel buttons
  - Panel closes on Cancel or successful Save

### 4.2. Field Management

**FR3: Field Display**
- **Requirement:** Display all current fields in configuration panel
- **Acceptance Criteria:**
  - Each field shown in editable card
  - Field name editable inline
  - Field type displayed with dropdown
  - Format options shown based on type
  - Field order visible

**FR4: Add Field**
- **Requirement:** Ability to add new fields
- **Acceptance Criteria:**
  - "Add Field" button at bottom of field list
  - New field created with default values
  - Field name required
  - Field type defaults to "Single line text"
  - New field added to end of list

**FR5: Remove Field**
- **Requirement:** Ability to remove fields
- **Acceptance Criteria:**
  - Remove button on each field card
  - Confirmation before removal
  - Field removed from list
  - At least one field must remain

**FR6: Reorder Fields**
- **Requirement:** Ability to change field order
- **Acceptance Criteria:**
  - Up/down arrows on each field
  - Move field up one position
  - Move field down one position
  - Disable arrows at boundaries
  - Order saved on Save

### 4.3. Field Type Management

**FR7: Field Type Selection**
- **Requirement:** Select field type from comprehensive list
- **Acceptance Criteria:**
  - Dropdown with 20+ field types
  - Types include: Single line text, Long text, Number, Currency, Percent, Date, Email, URL, Phone number, Checkbox, Single select, Multiple select, Attachment, User, Rating, Duration, Formula, etc.
  - Type change updates format options
  - Type change validated

**FR8: Format Configuration**
- **Requirement:** Configure format preferences based on field type
- **Acceptance Criteria:**
  - Number/Currency/Percent: Precision (0-10), Currency symbol
  - Date: Date format (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, MMM DD, YYYY), Time format (12h/24h)
  - Select fields: Options list (one per line)
  - Rating: Max rating (1-10)
  - Duration: Duration format (h:mm:ss, h:mm, mm:ss)
  - Format options shown/hidden based on type

### 4.4. Field Properties

**FR9: Field Name Editing**
- **Requirement:** Edit field names inline
- **Acceptance Criteria:**
  - Field name editable in text input
  - Field name required
  - Field name must be unique
  - Validation on blur
  - Error message for duplicates

**FR10: Required Field**
- **Requirement:** Mark fields as required
- **Acceptance Criteria:**
  - Checkbox to mark field as required
  - Required status saved
  - Required indicator in table view

**FR11: Unique Field**
- **Requirement:** Mark fields as unique
- **Acceptance Criteria:**
  - Checkbox to mark field as unique
  - Unique status saved
  - Unique validation in data entry

**FR12: Field Description**
- **Requirement:** Add description to fields (optional)
- **Acceptance Criteria:**
  - Description field optional
  - Description displayed in tooltips
  - Description helps users understand field purpose

### 4.5. Validation

**FR13: Field Validation**
- **Requirement:** Validate field configuration before saving
- **Acceptance Criteria:**
  - Field name required
  - Field name unique
  - Format validation based on type (precision ranges, rating limits)
  - Select fields must have at least one option
  - Validation errors displayed inline
  - Save disabled if validation errors

**FR14: Schema Validation**
- **Requirement:** Validate entire schema before saving
- **Acceptance Criteria:**
  - All fields validated
  - No duplicate field names
  - All required format fields valid
  - Schema integrity checked
  - Error summary displayed

### 4.6. Schema Persistence

**FR15: Schema Storage**
- **Requirement:** Save schema to persistent storage
- **Acceptance Criteria:**
  - Schema saved to Airtable "Table Schemas" table
  - Schema includes all field definitions
  - Schema versioned
  - Schema retrieval on load

**FR16: Schema Application**
- **Requirement:** Apply schema changes to table view
- **Acceptance Criteria:**
  - Table view updates after schema save
  - New fields appear in table
  - Removed fields disappear
  - Field order updated
  - Format preferences applied

---

## 5. Non-Functional Requirements

### 5.1. Performance Requirements

**Performance Targets:**
- Configuration panel load: < 500ms
- Schema save: < 2 seconds
- Field validation: < 100ms
- Schema retrieval: < 500ms

### 5.2. Usability Requirements

**User Interface:**
- Intuitive field configuration interface
- Clear field type descriptions
- Helpful format option labels
- Visual feedback for all actions
- Error messages in plain language

**Workflow:**
- Guided configuration process
- Clear Save/Cancel actions
- Confirmation for destructive actions
- Undo capability (future)

### 5.3. Data Integrity Requirements

**Validation:**
- Prevent invalid configurations
- Ensure schema consistency
- Validate format options
- Check field name uniqueness

**Backup:**
- Schema versioning
- Ability to revert changes
- Audit trail of schema changes

### 5.4. Security Requirements

**Access Control:**
- Only admin users can configure tables
- Role-based permission checks
- Secure schema storage
- Validation of user permissions

---

## 6. Technical Requirements

### 6.1. Frontend Architecture

**Component Structure:**
- `TableConfigurationPanel`: Main configuration component
- Field configuration cards
- Field type selector
- Format option inputs
- Validation display

**Technology:**
- React with TypeScript
- Tailwind CSS for styling
- Modal overlay pattern
- Form validation

### 6.2. API Integration

**Endpoints:**
- `GET /api/tables/{tableId}/schema` - Get table schema
- `PUT /api/tables/{tableId}/schema` - Update table schema

**Schema Service:**
- `TableSchemaAirtableService`: Airtable schema storage
- Schema mapping and transformation
- Error handling

### 6.3. Data Model

**Table Schema:**
```typescript
interface TableSchema {
  tableId: string
  tableName: string
  fields: TableField[]
  createdAt?: string
  updatedAt?: string
}

interface TableField {
  id: string
  name: string
  type: FieldType
  format?: FieldFormat
  required?: boolean
  unique?: boolean
  description?: string
  order: number
}
```

**Field Types:**
- Single line text, Long text, Number, Currency, Percent
- Date, Email, URL, Phone number
- Checkbox, Single select, Multiple select
- Attachment, User, Rating, Duration, Formula
- Created time, Last modified time, Created by, Last modified by

### 6.4. Storage

**Airtable Storage:**
- Table: "Table Schemas"
- Fields: Table ID, Table Name, Fields (JSON)
- Schema versioning support

**Future Migration:**
- PostgreSQL schema support
- Migration path defined
- Data transformation logic

---

## 7. Success Metrics

### 7.1. User Adoption Metrics

**Target Metrics:**
- 50% of admins use Configuration Mode within 3 months
- Average configurations per admin: 2+
- Field additions per month: 10+
- Schema modifications: 5+ per month

### 7.2. Performance Metrics

**Target Metrics:**
- Configuration panel load (p95): < 500ms
- Schema save time (p95): < 2 seconds
- Validation response: < 100ms
- Zero data loss incidents

### 7.3. User Satisfaction Metrics

**Target Metrics:**
- User satisfaction: 4.0/5.0
- Task completion rate: > 90%
- Error rate: < 5%
- Support tickets: < 2 per month

---

## 8. Risk Assessment

### 8.1. Technical Risks

**Risk:** Schema changes break existing data
- **Mitigation:** Validation rules, migration scripts, rollback capability

**Risk:** Performance impact of dynamic schemas
- **Mitigation:** Schema caching, optimized queries, lazy loading

**Risk:** Complex field type conversions
- **Mitigation:** Type validation, conversion warnings, user guidance

### 8.2. Data Quality Risks

**Risk:** Invalid field configurations
- **Mitigation:** Comprehensive validation, format checks, user testing

**Risk:** Schema inconsistency across tables
- **Mitigation:** Schema templates, validation rules, documentation

### 8.3. User Experience Risks

**Risk:** Complex configuration interface
- **Mitigation:** Intuitive UI, help text, guided workflows, user training

**Risk:** Unintended schema changes
- **Mitigation:** Confirmation dialogs, change preview, undo capability

---

## 9. Implementation Plan

### 9.1. Phase 1: Core Configuration (Completed)
- ✅ Configuration panel component
- ✅ Field display and editing
- ✅ Field type selection
- ✅ Basic format options

### 9.2. Phase 2: Advanced Features (Completed)
- ✅ Add/remove fields
- ✅ Reorder fields
- ✅ Comprehensive format options
- ✅ Validation system

### 9.3. Phase 3: Schema Persistence (Completed)
- ✅ API endpoints
- ✅ Airtable storage
- ✅ Schema retrieval
- ✅ Schema application

### 9.4. Phase 4: Enhancements (Planned)
- ⏳ Schema templates
- ⏳ Field-level permissions
- ⏳ Default values
- ⏳ Advanced validation rules
- ⏳ Schema export/import

---

## 10. Acceptance Criteria

### 10.1. Configuration Access
- ✅ "Configure Table" button visible
- ✅ Button opens configuration panel
- ✅ Panel displays table name
- ✅ Panel shows current fields

### 10.2. Field Management
- ✅ Fields display in editable cards
- ✅ Add field button works
- ✅ Remove field button works
- ✅ Reorder fields works
- ✅ At least one field required

### 10.3. Field Configuration
- ✅ Field name editable
- ✅ Field type selectable
- ✅ Format options shown based on type
- ✅ Required checkbox works
- ✅ Unique checkbox works

### 10.4. Validation
- ✅ Field name required validation
- ✅ Field name unique validation
- ✅ Format validation works
- ✅ Validation errors displayed
- ✅ Save disabled on errors

### 10.5. Schema Persistence
- ✅ Schema saves to API
- ✅ Schema retrieves on load
- ✅ Schema applies to table
- ✅ Changes reflected immediately

---

## 11. Dependencies

### 11.1. Technical Dependencies
- React/Next.js framework
- TypeScript
- Tailwind CSS
- Airtable API
- Express.js API server

### 11.2. Component Dependencies
- ListDetailTemplate (for table integration)
- Modal components
- Form components
- Validation library

### 11.3. Data Dependencies
- Table Schemas table in Airtable
- Schema API endpoints
- Table metadata

---

## 12. Appendices

### 12.1. Glossary

**Table Schema:** Definition of table structure including fields, types, and formats  
**Field Type:** Data type of a field (text, number, date, etc.)  
**Format Preferences:** Display and input format options for fields  
**Field Order:** Sequence of fields in table display  
**Schema Persistence:** Saving table schema to database  
**Schema Versioning:** Tracking changes to table schemas over time

### 12.2. Field Type Reference

**Text Types:**
- Single line text
- Long text

**Numeric Types:**
- Number
- Currency
- Percent
- Rating

**Date/Time Types:**
- Date
- Created time
- Last modified time

**Selection Types:**
- Single select
- Multiple select
- Checkbox

**Reference Types:**
- User
- Created by
- Last modified by
- Attachment

**Other Types:**
- Email
- URL
- Phone number
- Duration
- Formula

### 12.3. API Reference

**GET /api/tables/{tableId}/schema**
- Response: `{ success: boolean, data: TableSchema }`

**PUT /api/tables/{tableId}/schema**
- Body: `UpdateTableSchemaDto`
- Response: `{ success: boolean, data: TableSchema }`

### 12.4. Configuration Example

```typescript
const schema: TableSchema = {
  tableId: 'companies',
  tableName: 'Companies',
  fields: [
    {
      id: 'field-1',
      name: 'Company Name',
      type: 'singleLineText',
      required: true,
      order: 0
    },
    {
      id: 'field-2',
      name: 'Revenue',
      type: 'currency',
      format: { symbol: '$', precision: 2 },
      order: 1
    },
    {
      id: 'field-3',
      name: 'Status',
      type: 'singleSelect',
      format: { options: ['Active', 'Inactive'] },
      order: 2
    }
  ]
}
```

---

**Document Status:** Draft  
**Last Updated:** January 2025  
**Next Review:** After Phase 4 completion

