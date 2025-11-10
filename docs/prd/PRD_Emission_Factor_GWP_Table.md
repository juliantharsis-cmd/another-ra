# Product Requirements Document: Emission Factor GWP Table

## Document Information

**Document Title:** Emission Factor GWP Table Feature  
**Version:** 1.0  
**Date:** January 2025  
**Author:** Product Team  
**Status:** Draft  
**Domain:** emission-management  
**Project Naming:** another-ra-ui, another-ra-api

---

## 1. Executive Summary

### 1.1. Problem Statement

Organizations managing greenhouse gas emissions need a centralized system to view, manage, and track Global Warming Potential (GWP) emission factors used in carbon calculations. The system must support multiple emission factors with different GWP values, sources, and statuses, enabling users to maintain accurate emission factor libraries for compliance reporting and emission calculations. Users need efficient access to emission factor data with filtering, search, and inline editing capabilities.

### 1.2. Solution Overview

Implement a dedicated Emission Factor GWP table using the reusable `ListDetailTemplate` component that provides:
- Comprehensive view of emission factors with GWP values
- Status-based filtering (Active/Inactive)
- Search functionality across factor names and notes
- Inline editing through detail panel
- Source and protocol tracking
- Integration with emission calculation workflows

The Emission Factor GWP table serves as the primary interface for managing emission factors, ensuring data accuracy and supporting emission inventory calculations.

### 1.3. Business Value

**Data Accuracy:** Centralized management of emission factors ensures consistency in calculations  
**Compliance Support:** Track emission factor sources and protocols for audit requirements  
**Operational Efficiency:** Quick access to emission factors with filtering and search  
**Calculation Integrity:** Maintain accurate GWP values for emission calculations  
**Audit Trail:** Track emission factor status and source information

---

## 2. User Personas & Use Cases

### 2.1. Primary Personas

**Persona 1: Emission Data Manager**
- **Characteristics:** Technical professionals responsible for managing emission factor data. Have administrative privileges and deep understanding of emission calculation methodologies.
- **Needs:** Ability to view, filter, edit, and manage emission factors with accurate GWP values and source tracking
- **Challenges:** Ensuring GWP value accuracy, maintaining source documentation, managing factor status

**Persona 2: Carbon Analyst**
- **Characteristics:** Professionals performing emission calculations and analysis. Need access to emission factors for calculations.
- **Needs:** Quick access to active emission factors, search by name, view GWP values and units
- **Challenges:** Finding specific emission factors quickly, understanding factor applicability

**Persona 3: Compliance Officer**
- **Characteristics:** Professionals ensuring regulatory compliance. Need to verify emission factor sources and protocols.
- **Needs:** Access to emission factor sources, protocols, status information for audit purposes
- **Challenges:** Verifying factor sources, tracking factor changes over time

### 2.2. Use Cases

**UC1: View Emission Factors**
- **Actor:** Emission Data Manager, Carbon Analyst, Compliance Officer
- **Description:** View list of emission factors with GWP values, units, and status
- **Preconditions:** User has access to Emission Management space, emission factor data exists
- **Flow:** Navigate to Emission Factor GWP table → View paginated list → Apply filters if needed
- **Postconditions:** Emission factor list displayed with all relevant information

**UC2: Filter by Status**
- **Actor:** Carbon Analyst, Emission Data Manager
- **Description:** Filter emission factors by status (Active/Inactive) to find relevant factors
- **Preconditions:** User has access to Emission Factor GWP table
- **Flow:** Click Filters button → Select Status filter → Choose Active or Inactive → View filtered results
- **Postconditions:** Only emission factors with selected status displayed

**UC3: Search Emission Factors**
- **Actor:** Carbon Analyst, Emission Data Manager
- **Description:** Search emission factors by factor name or notes
- **Preconditions:** User has access to Emission Factor GWP table
- **Flow:** Enter search query in search bar → View matching results
- **Postconditions:** Search results displayed, matching factors highlighted

**UC4: Edit Emission Factor**
- **Actor:** Emission Data Manager
- **Description:** Update emission factor details including GWP value, source, status, and notes
- **Preconditions:** User has edit permissions, emission factor record exists
- **Flow:** Click on emission factor row → Detail panel opens → Edit fields → Save changes
- **Postconditions:** Emission factor updated, changes reflected in table

**UC5: View Emission Factor Details**
- **Actor:** Carbon Analyst, Compliance Officer
- **Description:** View comprehensive emission factor information including source and protocol
- **Preconditions:** User has access to Emission Factor GWP table
- **Flow:** Click on emission factor row → Detail panel opens → Review all details
- **Postconditions:** Complete emission factor information displayed

---

## 3. User Stories

**US1:** As a carbon analyst, I want to view all emission factors in a table so that I can quickly find factors for calculations.

**US2:** As an emission data manager, I want to filter emission factors by status so that I can see only active factors for current calculations.

**US3:** As a user, I want to search emission factors by name or notes so that I can locate specific factors quickly.

**US4:** As an emission data manager, I want to edit emission factor GWP values so that I can maintain accurate calculation data.

**US5:** As a compliance officer, I want to view emission factor sources and protocols so that I can verify data for audits.

**US6:** As an emission data manager, I want to update emission factor status so that I can manage factor lifecycle.

**US7:** As a user, I want to see emission factor units so that I understand the measurement context.

**US8:** As a carbon analyst, I want to view emission factor notes so that I understand factor applicability and limitations.

---

## 4. Functional Requirements

### 4.1. Table Display

**FR1: Paginated Table View**
- **Requirement:** Display emission factors in a paginated table
- **Acceptance Criteria:**
  - Default page size of 25 records
  - Page size options: 10, 25, 50, 100
  - Display total count of emission factors
  - Pagination controls (Previous, Next, page numbers)
  - Virtual scrolling for performance

**FR2: Column Display**
- **Requirement:** Display emission factor data in columns
- **Acceptance Criteria:**
  - Columns: Factor Name, GWP Value, Source, Status
  - Column headers with sort indicators
  - Sticky header on scroll
  - Proper number formatting for GWP values
  - Status badges (Active/Inactive)

**FR3: Row Interaction**
- **Requirement:** Enable row click to open detail panel
- **Acceptance Criteria:**
  - Click row opens detail panel
  - Hover effect on rows
  - Visual feedback on selection
  - Alternating row colors

### 4.2. Filtering and Search

**FR4: Status Filtering**
- **Requirement:** Filter emission factors by status
- **Acceptance Criteria:**
  - Filter by Status (Active/Inactive)
  - Filter options loaded from API
  - Clear filter functionality
  - Filter persists during pagination

**FR5: Search Functionality**
- **Requirement:** Full-text search across emission factor attributes
- **Acceptance Criteria:**
  - Search across: Factor Name, Notes
  - Debounced search (300ms delay)
  - Clear search button
  - Search works with filters simultaneously

### 4.3. Sorting

**FR6: Column Sorting**
- **Requirement:** Sort emission factors by sortable columns
- **Acceptance Criteria:**
  - Sortable columns: Factor Name, GWP Value, Status
  - Toggle between ascending/descending
  - Visual sort indicators
  - Default sort: Factor Name (ascending)

### 4.4. Detail Panel

**FR7: Inline Editing**
- **Requirement:** Edit emission factor details in sliding detail panel
- **Acceptance Criteria:**
  - Panel slides in from right
  - Modular sections: General Info, GWP Details, Notes & Comments
  - Inline editable fields
  - Save/Cancel buttons
  - Field validation
  - Success/error notifications

**FR8: Detail Panel Sections**
- **Requirement:** Organize emission factor data in logical sections
- **Acceptance Criteria:**
  - General Info: Factor Name, Status
  - GWP Details: GWP Value, Source
  - Notes & Comments: Notes field
  - Activity Log section (if applicable)

**FR9: GWP Value Editing**
- **Requirement:** Edit GWP values with proper validation
- **Acceptance Criteria:**
  - Numeric input for GWP value
  - Decimal precision support
  - Validation for positive numbers
  - Unit display/editing

**FR10: Source and Protocol Tracking**
- **Requirement:** Display and edit emission factor source and protocol
- **Acceptance Criteria:**
  - Source field editable
  - Protocol information displayed
  - Source tracking for audit purposes

### 4.5. Data Management

**FR11: Status Management**
- **Requirement:** Update emission factor status
- **Acceptance Criteria:**
  - Status field editable in detail panel
  - Status options: Active, Inactive
  - Status change reflected immediately
  - Status used in filtering

**FR12: Notes Management**
- **Requirement:** Add and edit notes for emission factors
- **Acceptance Criteria:**
  - Notes field in detail panel
  - Multi-line text support
  - Notes searchable
  - Notes preserved on save

---

## 5. Non-Functional Requirements

### 5.1. Performance Requirements

**Performance Targets:**
- Initial page load: < 1 second for 25 records
- Table render: < 500ms (with virtual scrolling)
- Filter application: < 300ms
- Search response: < 300ms
- API response time (p95): < 500ms

**Scalability:**
- Support 1000+ emission factors
- Efficient pagination
- Virtual scrolling for large lists

### 5.2. Usability Requirements

**User Interface:**
- Schneider Electric-inspired styling
- Intuitive filter and search interface
- Clear visual feedback
- Responsive design
- Loading states

**Error Handling:**
- Clear error messages
- Graceful API failure handling
- Validation feedback

### 5.3. Accessibility Requirements

**WCAG 2.1 AA Compliance:**
- Keyboard navigation
- Proper ARIA labels
- Screen reader compatibility
- Color contrast compliance

### 5.4. Data Integrity Requirements

**Validation:**
- GWP value must be numeric
- GWP value must be positive
- Factor name required
- Status required

**Audit Trail:**
- Track emission factor changes
- Maintain source information
- Preserve protocol data

---

## 6. Technical Requirements

### 6.1. Frontend Architecture

**Technology Stack:**
- Next.js 14+ (React framework)
- TypeScript
- Tailwind CSS
- Reusable ListDetailTemplate component

**Component Structure:**
- `ListDetailTemplate`: Reusable table component
- `emissionFactorConfig.tsx`: Emission Factor-specific configuration
- API client: `src/lib/api/emissionFactors.ts`
- Detail panel components

### 6.2. API Integration

**Endpoints:**
- `GET /api/emission-factors` - Get paginated emission factors
- `GET /api/emission-factors/{id}` - Get single emission factor
- `PATCH /api/emission-factors/{id}` - Update emission factor
- `GET /api/emission-factors/filter-values?field=status` - Get status filter options

**API Client:**
- Retry logic
- Error handling
- Type-safe requests

### 6.3. Data Model

**Emission Factor Entity:**
```typescript
interface EmissionFactor {
  id: string
  factor_name: string
  gwp_value: number
  source?: string
  status: 'Active' | 'Inactive'
  notes?: string
  created_at?: string
  updated_at?: string
}
```

**Airtable Mapping:**
- `Name` → `factor_name`
- `GWP factor` → `gwp_value`
- `Protocol` → `source`
- `Status` → `status`
- `Notes` → `notes`

### 6.4. Data Source

**Airtable Table:**
- Table Name: "EF GWP"
- Fields: Name, GWP factor, Status, Notes, Protocol
- Base: System Configuration Base

---

## 7. Success Metrics

### 7.1. User Adoption Metrics

**Target Metrics:**
- 80% of emission management users access table within first month
- Average session time: 3+ minutes
- Filter usage: 60% of sessions
- Search usage: 50% of sessions
- Edit operations: 30% of sessions

### 7.2. Performance Metrics

**Target Metrics:**
- Page load time (p95): < 1 second
- Table render time (p95): < 500ms
- Filter response time (p95): < 300ms
- Search response time (p95): < 300ms
- API success rate: > 99%

### 7.3. Data Quality Metrics

**Target Metrics:**
- Emission factor data completeness: > 95%
- Source information present: > 90%
- Status accuracy: 100%

---

## 8. Risk Assessment

### 8.1. Technical Risks

**Risk:** GWP value calculation errors
- **Mitigation:** Input validation, numeric type enforcement, range checks

**Risk:** Source information missing
- **Mitigation:** Required field indicators, validation, user guidance

### 8.2. Data Quality Risks

**Risk:** Incorrect GWP values affecting calculations
- **Mitigation:** Validation rules, review workflows, audit trail

**Risk:** Inconsistent status management
- **Mitigation:** Clear status definitions, status change tracking

---

## 9. Implementation Plan

### 9.1. Phase 1: Core Table (Completed)
- ✅ Implement ListDetailTemplate for Emission Factors
- ✅ Configure columns and filters
- ✅ Integrate with EF GWP API
- ✅ Basic pagination and sorting

### 9.2. Phase 2: Detail Panel (Completed)
- ✅ Detail panel with inline editing
- ✅ GWP value editing
- ✅ Source and notes editing
- ✅ Status management

### 9.3. Phase 3: Enhancements (Planned)
- ⏳ Advanced filtering options
- ⏳ Export functionality
- ⏳ Import functionality
- ⏳ Version history

---

## 10. Acceptance Criteria

### 10.1. Table Display
- ✅ Emission factors display in paginated table
- ✅ Columns: Factor Name, GWP Value, Source, Status
- ✅ Status badges display correctly
- ✅ GWP values formatted properly
- ✅ Pagination works correctly

### 10.2. Filtering and Search
- ✅ Filter by Status works
- ✅ Search by Factor Name works
- ✅ Search by Notes works
- ✅ Clear filters works
- ✅ Filters persist during pagination

### 10.3. Detail Panel
- ✅ Click row opens detail panel
- ✅ Panel displays all sections
- ✅ Inline editing works
- ✅ Save updates data
- ✅ Cancel discards changes
- ✅ Validation works

### 10.4. Data Editing
- ✅ Factor Name editable
- ✅ GWP Value editable with validation
- ✅ Source editable
- ✅ Status editable
- ✅ Notes editable
- ✅ All changes save correctly

---

## 11. Dependencies

### 11.1. Technical Dependencies
- Next.js framework
- React 18+
- TypeScript
- ListDetailTemplate component
- Airtable API
- Express.js API server

### 11.2. Data Dependencies
- EF GWP table in Airtable
- Filter values API
- Update API endpoints

---

## 12. Appendices

### 12.1. Glossary

**Emission Factor:** Multiplier used to convert activity data to emissions  
**GWP (Global Warming Potential):** Measure of how much heat a greenhouse gas traps relative to CO2  
**GWP Value:** Numeric value representing the GWP of an emission factor  
**Source:** Origin or reference for the emission factor  
**Protocol:** Standard or methodology used (e.g., IPCC, GHG Protocol)  
**Status:** Active or Inactive state of emission factor

### 12.2. API Reference

**GET /api/emission-factors**
- Query params: `page`, `limit`, `sortBy`, `sortOrder`, `search`, `status`
- Response: `{ success: boolean, data: EmissionFactor[], pagination: {...} }`

**GET /api/emission-factors/{id}**
- Response: `{ success: boolean, data: EmissionFactor }`

**PATCH /api/emission-factors/{id}**
- Body: `Partial<EmissionFactor>`
- Response: `{ success: boolean, data: EmissionFactor }`

**GET /api/emission-factors/filter-values?field=status**
- Response: `{ success: boolean, data: string[] }`

### 12.3. Configuration Example

```typescript
export const emissionFactorConfig: ListDetailTemplateConfig<EmissionFactor> = {
  entityName: 'Emission Factor',
  entityNamePlural: 'Emission Factors',
  defaultSort: { field: 'factor_name', order: 'asc' },
  defaultPageSize: 25,
  columns: [
    { key: 'factor_name', label: 'Factor Name', sortable: true },
    { key: 'gwp_value', label: 'GWP Value', sortable: true },
    { key: 'source', label: 'Source', sortable: false },
    { key: 'status', label: 'Status', sortable: true },
  ],
  filters: [
    { key: 'status', label: 'Status', type: 'select', options: async () => [...] },
  ],
  apiClient: emissionFactorApiClient,
  // ... more config
}
```

---

**Document Status:** Draft  
**Last Updated:** January 2025  
**Next Review:** After enhancements completion

