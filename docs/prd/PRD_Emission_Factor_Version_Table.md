# Product Requirements Document: Emission Factor Version Table

## Document Information

**Document Title:** Emission Factor Version Table Feature  
**Version:** 1.0  
**Date:** January 2025  
**Author:** Product Team  
**Status:** Draft  
**Domain:** emission-management  
**Project Naming:** another-ra-ui, another-ra-api

---

## 1. Executive Summary

### 1.1. Problem Statement

Organizations need to manage different versions of emission factors for accurate emission calculations and compliance with evolving standards. The system requires a comprehensive interface to view, filter, search, and manage emission factor version records, including version names, categories, status, and related metadata. Users need efficient access to version data for use in emission calculations.

### 1.2. Solution Overview

Implement an Emission Factor Version table using the ListDetailTemplate that provides:
- Paginated table view with filtering and search
- Status and category filtering
- Inline editing through detail panel
- Integration with emission factor calculations
- Export functionality for reporting

### 1.3. Business Value

**Version Management:** Centralized version tracking ensures accurate emission calculations  
**Compliance:** Proper version management supports regulatory requirements  
**Data Quality:** Version control improves data accuracy and traceability  
**Efficiency:** Streamlined interface reduces version management time

---

## 2. User Personas & Use Cases

### 2.1. Primary Personas

**Persona 1: Emission Data Manager**
- **Characteristics:** Professionals managing emission data and factor versions
- **Needs:** View, filter, edit versions, ensure data accuracy
- **Challenges:** Managing multiple versions, maintaining consistency

**Persona 2: Compliance Officer**
- **Characteristics:** Professionals ensuring regulatory compliance
- **Needs:** Access to version data for reporting, verify version usage
- **Challenges:** Tracking version history, ensuring correct version usage

### 2.2. Use Cases

**UC1: View and Filter Versions**
- **Actor:** Emission Data Manager, Compliance Officer
- **Description:** View list of emission factor versions with filtering
- **Preconditions:** User has access to Emission Factor Version table
- **Flow:** Navigate to table → Apply filters → View filtered results
- **Postconditions:** Filtered versions displayed

**UC2: Edit Version Details**
- **Actor:** Emission Data Manager
- **Description:** Update version information through inline editing
- **Preconditions:** User has edit permissions
- **Flow:** Click version row → Detail panel opens → Edit fields → Save
- **Postconditions:** Version data updated

---

## 3. User Stories

**US1:** As an emission data manager, I want to view all emission factor versions in a table so that I can manage versions efficiently.

**US2:** As a user, I want to filter versions by status and category so that I can find specific versions.

**US3:** As an emission data manager, I want to edit version details inline so that I can maintain accurate version information.

---

## 4. Functional Requirements

### 4.1. Table Display

**FR1: Version Table**
- **Requirement:** Display versions in paginated table
- **Acceptance Criteria:**
  - Columns: Name, Short Code, Category, Status
  - Default sort: Name (ascending)
  - Pagination with configurable page size
  - Status badges with color coding

**FR2: Filtering**
- **Requirement:** Filter by status and category
- **Acceptance Criteria:**
  - Status filter: Active, Inactive
  - Category filter: All available categories
  - Multiple filters work simultaneously

**FR3: Search**
- **Requirement:** Full-text search across version attributes
- **Acceptance Criteria:**
  - Search across: Name, Short Code, Category
  - Debounced search (300ms)

### 4.2. Detail Panel

**FR4: Inline Editing**
- **Requirement:** Edit version details in detail panel
- **Acceptance Criteria:**
  - Panel opens on row click
  - Editable fields: Name, Short Code, Category, Status
  - Field validation
  - Save/Cancel buttons

---

## 5. Non-Functional Requirements

### 5.1. Performance Requirements

**Performance Targets:**
- Table load: < 1 second
- Filter application: < 300ms
- Search response: < 300ms

### 5.2. Integration Requirements

**Integration Points:**
- Emission Factor GWP table (uses versions)
- Emission calculations
- Reporting system

---

## 6. Technical Requirements

### 6.1. Data Model

**Emission Factor Version Entity:**
```typescript
interface EmissionFactorVersion {
  id: string
  Name: string
  'Short code'?: string
  Category?: string
  Status: 'Active' | 'Inactive'
  createdAt?: string
  updatedAt?: string
}
```

### 6.2. API Integration

**Endpoints:**
- `GET /api/emission-factor-versions` - Get paginated versions
- `GET /api/emission-factor-versions/{id}` - Get single version
- `PATCH /api/emission-factor-versions/{id}` - Update version
- `GET /api/emission-factor-versions/filter-values?field={field}` - Get filter options

---

## 7. Success Metrics

**Target Metrics:**
- 70% of emission data managers access table within first month
- Average session time: 3+ minutes
- Filter usage: 50% of sessions
- Data accuracy: > 95%

---

## 8. Risk Assessment

**Risk:** Version data inconsistency affecting calculations
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
- ✅ Versions display in table
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
- Emission Factor Version API
- Airtable or database

### 11.2. Data Dependencies
- Emission Factor Version table in Airtable
- Category values
- Status values

---

## 12. Appendices

### 12.1. Version Categories

Common categories:
- IPCC Guidelines
- National Standards
- Industry Standards
- Custom

### 12.2. Status Values

- Active: Currently used in calculations
- Inactive: Deprecated or not in use

---

**Document Status:** Draft  
**Last Updated:** January 2025  
**Next Review:** After enhancements

