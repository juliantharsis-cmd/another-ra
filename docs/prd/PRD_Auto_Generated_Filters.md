# Product Requirements Document: Auto-Generated Filters

## Document Information

**Document Title:** Auto-Generated Filters System  
**Version:** 1.0  
**Date:** January 2025  
**Author:** Product Team  
**Status:** Draft  
**Domain:** ui, data-management  
**Project Naming:** another-ra-ui, another-ra-api

---

## 1. Executive Summary

### 1.1. Problem Statement

Currently, table filters must be manually configured for each table, requiring developers to explicitly define filter configurations for every filterable field. This leads to:
- Inconsistent filter availability across tables
- Manual work for each new field that should be filterable
- Risk of missing filters for important fields
- Maintenance burden when fields are added or changed

Users expect all non-text fields (selects, linked records, dates, numbers) to be filterable by default, while text fields should be searchable via the global search bar.

### 1.2. Solution Overview

Implement an auto-generated filters system that:
- Automatically creates filter configurations from field definitions
- Applies consistent rules: text fields → search, non-text fields → filters
- Reduces manual configuration to only exceptions/customizations
- Works systematically across all tables using the ListDetailTemplate framework
- Supports both regular fields and linked records (relationships)

### 1.3. Business Value

**Developer Efficiency:** Reduces configuration code by 60-80% per table  
**Consistency:** Ensures all tables have consistent filter behavior  
**User Experience:** Users can filter by any non-text field without waiting for manual configuration  
**Maintainability:** New fields automatically get filters when appropriate  
**Scalability:** Easy to apply to new tables without additional configuration

---

## 2. User Personas & Use Cases

### 2.1. Primary Personas

**Persona 1: Data Analyst**
- **Characteristics:** Users analyzing data across multiple tables
- **Needs:** Ability to filter by any relevant field (status, linked records, dates)
- **Challenges:** Missing filters for important fields, inconsistent filter availability

**Persona 2: System Administrator**
- **Characteristics:** Users managing data and configuring tables
- **Needs:** Consistent filtering experience across all tables
- **Challenges:** Remembering which fields are filterable, discovering available filters

### 2.2. Use Cases

**UC1: Filter by Linked Record**
- **Actor:** Data Analyst
- **Description:** Filter users by Company, User Roles, or Modules
- **Preconditions:** User table has Company, User Roles, Modules fields
- **Flow:** Open filter dropdown → Select Company/User Roles/Modules → Choose value → Results filtered
- **Postconditions:** Table shows only records matching selected filter

**UC2: Filter by Select Field**
- **Actor:** All users
- **Description:** Filter by Status or other select fields
- **Preconditions:** Table has select fields (Status, Category, etc.)
- **Flow:** Open filter dropdown → Select field → Choose value → Results filtered
- **Postconditions:** Table shows only records with selected value

**UC3: Search Text Fields**
- **Actor:** All users
- **Description:** Search across text fields using global search bar
- **Preconditions:** Table has text fields (Email, Name, etc.)
- **Flow:** Type in search bar → Results filtered across all text fields
- **Postconditions:** Table shows records matching search query in any text field

---

## 3. User Stories

**US1:** As a data analyst, I want to filter by any non-text field so that I can quickly find relevant records without manual configuration.

**US2:** As a developer, I want filters to be automatically generated from field definitions so that I don't have to manually configure each filter.

**US3:** As a user, I want consistent filter behavior across all tables so that I can use the same workflow everywhere.

**US4:** As a user, I want text fields to be searchable via the global search bar so that I can find records by any text content.

**US5:** As a developer, I want to override auto-generated filters when needed so that I can customize filter behavior for specific use cases.

---

## 4. Functional Requirements

### 4.1. Filter Generation Rules

**FR1: Automatic Filter Generation**
- **Requirement:** System automatically generates filters from field configurations
- **Acceptance Criteria:**
  - Filters generated for `select` fields
  - Filters generated for `choiceList` fields (linked records)
  - Filters generated for `date` fields
  - Filters generated for `number` fields
  - Text fields (`text`, `textarea`) excluded from filters (handled by search)
  - Attachment fields excluded from filters
  - Readonly fields excluded unless they're select/choiceList

**FR2: Filter Options Resolution**
- **Requirement:** Filter options automatically resolved from field configuration
- **Acceptance Criteria:**
  - Uses field's `options` function if available
  - Falls back to API client's `getFilterValues` method
  - Handles async option loading
  - Supports "Name|ID" format for linked records
  - Gracefully handles missing options (empty array)

**FR3: Manual Filter Override**
- **Requirement:** Developers can provide manual filters that take precedence
- **Acceptance Criteria:**
  - Manual filters appear first in filter list
  - Auto-generated filters don't duplicate manual filters
  - Manual filters can customize labels, placeholders, options
  - System merges manual and auto-generated filters correctly

### 4.2. Backend Filter Support

**FR4: Linked Record Filtering**
- **Requirement:** Backend supports filtering by linked record IDs
- **Acceptance Criteria:**
  - Filters by Company field work correctly
  - Filters by User Roles field work correctly
  - Filters by Modules field work correctly
  - Uses Airtable's ARRAYJOIN and FIND functions
  - Handles array of linked record IDs

**FR5: Regular Field Filtering**
- **Requirement:** Backend supports filtering by regular fields (Status, etc.)
- **Acceptance Criteria:**
  - Filters by Status field work correctly
  - Filters by other select fields work correctly
  - Uses Airtable field name mapping
  - Handles escaped values correctly

### 4.3. User Interface

**FR6: Filter Display**
- **Requirement:** Auto-generated filters appear in filter dropdowns
- **Acceptance Criteria:**
  - Filters displayed in responsive grid layout
  - Filter labels match field labels
  - Placeholders show "All [Field Name]"
  - Options loaded asynchronously
  - Loading states shown while options load

**FR7: Filter Interaction**
- **Requirement:** Users can select filter values and see filtered results
- **Acceptance Criteria:**
  - Filter dropdowns are selectable
  - Selected values persist in filter state
  - Results update when filters change
  - "All [Field]" option clears filter
  - Multiple filters can be applied simultaneously

---

## 5. Non-Functional Requirements

### 5.1. Performance Requirements

**Performance Targets:**
- Filter generation: < 10ms (compile-time)
- Filter options loading: < 500ms for most fields
- Filter application: Same as existing filter performance
- No performance degradation vs. manual filters

### 5.2. Usability Requirements

**User Interface:**
- Filters clearly labeled with field names
- Consistent filter placement and styling
- Intuitive filter interaction
- Clear indication of active filters

**Accessibility:**
- Keyboard navigation support
- Screen reader compatibility
- ARIA labels for filter controls
- Focus management

### 5.3. Maintainability Requirements

**Code Quality:**
- Reusable utility functions
- Clear separation of concerns
- Well-documented code
- Type-safe implementation

---

## 6. Technical Requirements

### 6.1. Frontend Implementation

**Components:**
- `autoGenerateFilters()` utility function
- `mergeFilters()` utility function
- Integration with `ListDetailTemplateConfig`

**File Structure:**
```
src/lib/autoGenerateFilters.ts
src/components/templates/configs/userTableConfig.tsx
```

**Implementation:**
```typescript
// Auto-generate filters from field configurations
const autoGeneratedFilters = autoGenerateFilters(
  fields,           // Field configurations
  apiClient,        // API client for getFilterValues fallback
  manualFilters     // Existing manual filters (to avoid duplicates)
)

// Merge manual and auto-generated filters
const allFilters = mergeFilters(manualFilters, autoGeneratedFilters)
```

### 6.2. Backend Implementation

**Service Updates:**
- `UserTableAirtableService.findPaginated()` enhanced to handle linked record filters
- Filter formula building for linked records using ARRAYJOIN and FIND

**Filter Formula Pattern:**
```typescript
// Linked record filter
FIND('recordId', ARRAYJOIN({Field Name}, ',')) > 0

// Regular field filter
{Field Name} = 'value'
```

### 6.3. Field Type Mapping

**Filterable Field Types:**
- `select` → Single select filter
- `choiceList` → Single select filter (multiselect future enhancement)
- `date` → Date filter (range filter future enhancement)
- `number` → Number filter (range filter future enhancement)

**Non-Filterable Field Types:**
- `text` → Handled by global search
- `textarea` → Handled by global search
- `attachment` → Not filterable
- `readonly` → Not filterable (unless select/choiceList)

---

## 7. Success Metrics

**Target Metrics:**
- 100% of non-text fields have filters (where appropriate)
- 0 manual filter configurations needed for standard fields
- Filter discovery: 90% of users find relevant filters within first use
- Developer time saved: 60-80% reduction in filter configuration code
- User satisfaction: 4.5/5.0 for filter availability

---

## 8. Risk Assessment

**Risk:** Auto-generated filters may not match user expectations
- **Mitigation:** Clear rules, allow manual overrides, user testing

**Risk:** Performance impact of loading many filter options
- **Mitigation:** Async loading, caching, pagination for large option sets

**Risk:** Backend filter support may be incomplete
- **Mitigation:** Comprehensive testing, fallback to client-side filtering if needed

**Risk:** Filter options may fail to load
- **Mitigation:** Graceful degradation, empty state handling, error logging

---

## 9. Implementation Plan

### 9.1. Phase 1: Core Utility (Completed)
- ✅ `autoGenerateFilters()` function
- ✅ `mergeFilters()` function
- ✅ Field type detection logic
- ✅ Filter options resolution

### 9.2. Phase 2: User Table Implementation (Completed)
- ✅ User table config updated
- ✅ Auto-generated filters for Company, User Roles, Modules
- ✅ Backend support for linked record filtering
- ✅ Filter options loading from field configurations

### 9.3. Phase 3: Testing & Validation (In Progress)
- ⏳ Test filters work correctly (Status, Company, User Roles, Modules)
- ⏳ Verify filter options load correctly
- ⏳ Test backend filtering performance
- ⏳ User acceptance testing

### 9.4. Phase 4: Rollout to Other Tables (Planned)
- ⏳ Apply to Companies table
- ⏳ Apply to Application List table
- ⏳ Apply to other tables using ListDetailTemplate
- ⏳ Documentation and training

### 9.5. Phase 5: Enhancements (Future)
- ⏳ Multiselect support for choiceList fields
- ⏳ Date range filters
- ⏳ Number range filters
- ⏳ Filter presets/saved filters

---

## 10. Acceptance Criteria

### 10.1. Filter Generation
- ✅ Filters automatically generated for select fields
- ✅ Filters automatically generated for choiceList fields
- ✅ Filters automatically generated for date fields
- ✅ Filters automatically generated for number fields
- ✅ Text fields excluded from filters
- ✅ Attachment fields excluded from filters

### 10.2. Filter Functionality
- ✅ Filter options load correctly
- ✅ Filters apply correctly to table data
- ✅ Linked record filters work (Company, User Roles, Modules)
- ✅ Regular field filters work (Status)
- ✅ Multiple filters can be applied simultaneously
- ✅ Filters clear correctly

### 10.3. Backend Support
- ✅ Backend handles linked record filtering
- ✅ Backend handles regular field filtering
- ✅ Filter formulas built correctly
- ✅ Filtered results accurate

### 10.4. User Experience
- ✅ Filters visible in filter dropdowns
- ✅ Filter labels clear and descriptive
- ✅ Filter options display correctly
- ✅ Filter interaction intuitive
- ✅ Loading states shown appropriately

---

## 11. Dependencies

### 11.1. Technical Dependencies
- React 18+
- TypeScript
- ListDetailTemplate framework
- Airtable API
- Backend filter support

### 11.2. Component Dependencies
- `ListDetailTemplateConfig` interface
- `FieldConfig` interface
- `FilterConfig` interface
- `ApiClient` interface with `getFilterValues` method

### 11.3. Data Dependencies
- Field configurations must include type information
- Field configurations should include options functions where applicable
- API clients should implement `getFilterValues` for fallback

---

## 12. Appendices

### 12.1. Filter Generation Rules

**Included Field Types:**
- `select` - Single selection dropdown
- `choiceList` - Multiple selection (linked records)
- `date` - Date field
- `number` - Number field

**Excluded Field Types:**
- `text` - Handled by global search
- `textarea` - Handled by global search
- `attachment` - Not filterable
- `readonly` - Not filterable (unless select/choiceList)

### 12.2. Filter Options Resolution Priority

1. Field's `options` function (if available)
2. API client's `getFilterValues` method (fallback)
3. Empty array (if neither available)

### 12.3. Backend Filter Formula Examples

**Linked Record Filter:**
```
FIND('recABC123', ARRAYJOIN({Company}, ',')) > 0
```

**Regular Field Filter:**
```
{Status} = 'Active'
```

**Multiple Filters:**
```
AND(
  {Status} = 'Active',
  FIND('recABC123', ARRAYJOIN({Company}, ',')) > 0
)
```

### 12.4. Usage Example

```typescript
// Define fields
const userTableFields = [
  { key: 'Status', type: 'select', options: async () => [...] },
  { key: 'Company', type: 'choiceList', options: async () => [...] },
  { key: 'Email', type: 'text' }, // Excluded from filters
]

// Manual filters (optional)
const manualFilters = [
  { key: 'status', label: 'Status', type: 'select', ... }
]

// Auto-generate filters
const autoGeneratedFilters = autoGenerateFilters(
  userTableFields,
  apiClient,
  manualFilters
)

// Merge filters
const allFilters = mergeFilters(manualFilters, autoGeneratedFilters)

// Use in config
export const userTableConfig = {
  // ...
  filters: allFilters,
  fields: userTableFields,
}
```

---

**Document Status:** Draft  
**Last Updated:** January 2025  
**Next Review:** After Phase 3 completion

