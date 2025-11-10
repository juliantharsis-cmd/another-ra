# Product Requirements Document: GHG Types Table

## Document Information

**Document Title:** GHG Types Table Feature  
**Version:** 1.0  
**Date:** January 2025  
**Author:** Product Team  
**Status:** Draft  
**Domain:** emission-management  
**Project Naming:** another-ra-ui, another-ra-api

---

## 1. Executive Summary

### 1.1. Problem Statement

Organizations need to manage Greenhouse Gas (GHG) type classifications for accurate emission reporting and calculations. The system requires a comprehensive interface to view, filter, search, and manage GHG type records, including categories, status, and related metadata. Users need efficient access to GHG type data for use in emission factor calculations and reporting.

### 1.2. Solution Overview

Implement a GHG Types table using the ListDetailTemplate that provides:
- Paginated table view with filtering and search
- Status and category filtering
- Inline editing through detail panel
- Integration with emission factor calculations
- Export functionality for reporting

### 1.3. Business Value

**Data Management:** Centralized GHG type management improves data quality  
**Emission Calculations:** Accurate GHG type data ensures correct emission calculations  
**Compliance:** Proper classification supports regulatory reporting  
**Efficiency:** Streamlined interface reduces data management time

---

## 2. User Personas & Use Cases

### 2.1. Primary Personas

**Persona 1: Emission Data Manager**
- **Characteristics:** Professionals managing emission data and GHG classifications
- **Needs:** View, filter, edit GHG types, ensure data accuracy
- **Challenges:** Managing large datasets, maintaining classification consistency

**Persona 2: Compliance Officer**
- **Characteristics:** Professionals ensuring regulatory compliance
- **Needs:** Access to GHG type data for reporting, verify classifications
- **Challenges:** Finding specific GHG types, ensuring completeness

### 2.2. Use Cases

**UC1: View and Filter GHG Types**
- **Actor:** Emission Data Manager, Compliance Officer
- **Description:** View list of GHG types with filtering by status and category
- **Preconditions:** User has access to GHG Types table
- **Flow:** Navigate to GHG Types → Apply filters → View filtered results
- **Postconditions:** Filtered GHG types displayed

**UC2: Edit GHG Type Details**
- **Actor:** Emission Data Manager
- **Description:** Update GHG type information through inline editing
- **Preconditions:** User has edit permissions
- **Flow:** Click GHG type row → Detail panel opens → Edit fields → Save
- **Postconditions:** GHG type data updated

**UC3: Search GHG Types**
- **Actor:** All users
- **Description:** Search GHG types by name, category, or other attributes
- **Preconditions:** User has access to GHG Types table
- **Flow:** Enter search query → View matching results
- **Postconditions:** Search results displayed

---

## 3. User Stories

**US1:** As an emission data manager, I want to view all GHG types in a table so that I can manage classifications efficiently.

**US2:** As a user, I want to filter GHG types by status and category so that I can find specific subsets of data.

**US3:** As an emission data manager, I want to edit GHG type details inline so that I can maintain accurate classifications.

**US4:** As a compliance officer, I want to export GHG type data so that I can use it for regulatory reporting.

---

## 4. Functional Requirements

### 4.1. Table Display

**FR1: GHG Types Table**
- **Requirement:** Display GHG types in paginated table
- **Acceptance Criteria:**
  - Columns: Name, Category, Status, Description
  - Default sort: Name (ascending)
  - Pagination with configurable page size
  - Status badges with color coding
  - Responsive layout

**FR2: Filtering**
- **Requirement:** Filter by status and category
- **Acceptance Criteria:**
  - Status filter: Active, Inactive
  - Category filter: All available categories
  - Multiple filters work simultaneously
  - Clear filters functionality

**FR3: Search**
- **Requirement:** Full-text search across GHG type attributes
- **Acceptance Criteria:**
  - Search across: Name, Category, Description
  - Debounced search (300ms)
  - Search works with filters

### 4.2. Detail Panel

**FR4: Inline Editing**
- **Requirement:** Edit GHG type details in detail panel
- **Acceptance Criteria:**
  - Panel opens on row click
  - Editable fields: Name, Category, Status, Description
  - Field validation
  - Save/Cancel buttons
  - Success notifications

---

## 5. Non-Functional Requirements

### 5.1. Performance Requirements

**Performance Targets:**
- Table load: < 1 second
- Filter application: < 300ms
- Search response: < 300ms

### 5.2. Integration Requirements

**Integration Points:**
- Emission Factor GWP table (uses GHG types)
- Emission calculations
- Reporting system

---

## 6. Technical Requirements

### 6.1. Data Model

**GHG Type Entity:**
```typescript
interface GHGType {
  id: string
  Name: string
  Category?: string
  Status: 'Active' | 'Inactive'
  Description?: string
  createdAt?: string
  updatedAt?: string
}
```

### 6.2. API Integration

**Endpoints:**
- `GET /api/ghg-types` - Get paginated GHG types
- `GET /api/ghg-types/{id}` - Get single GHG type
- `PATCH /api/ghg-types/{id}` - Update GHG type
- `GET /api/ghg-types/filter-values?field={field}` - Get filter options

---

## 7. Success Metrics

**Target Metrics:**
- 80% of emission data managers access table within first month
- Average session time: 3+ minutes
- Filter usage: 60% of sessions
- Data accuracy: > 95%

---

## 8. Risk Assessment

**Risk:** Data inconsistency affecting emission calculations
- **Mitigation:** Field validation, required fields, data integrity checks

**Risk:** Performance with large datasets
- **Mitigation:** Pagination, optimized queries, caching

---

## 9. Implementation Plan

### 9.1. Phase 1: Core Table (Completed)
- ✅ ListDetailTemplate integration
- ✅ Basic columns and filters
- ✅ API integration

### 9.2. Phase 2: Editing (Completed)
- ✅ Detail panel with inline editing
- ✅ Field validation
- ✅ Save functionality

---

## 10. Acceptance Criteria

### 10.1. Table Display
- ✅ GHG types display in table
- ✅ Filtering works correctly
- ✅ Search works correctly
- ✅ Sorting works correctly

### 10.2. Editing
- ✅ Detail panel opens on row click
- ✅ Fields are editable
- ✅ Save updates data
- ✅ Validation works

---

## 11. Dependencies

### 11.1. Technical Dependencies
- ListDetailTemplate component
- GHG Types API
- Airtable or database

### 11.2. Data Dependencies
- GHG Types table in Airtable
- Category values
- Status values

---

## 12. Appendices

### 12.1. GHG Type Categories

Common categories:
- Direct Emissions
- Indirect Emissions
- Scope 1
- Scope 2
- Scope 3

### 12.2. Status Values

- Active: Currently used in calculations
- Inactive: Deprecated or not in use

---

**Document Status:** Draft  
**Last Updated:** January 2025  
**Next Review:** After enhancements

