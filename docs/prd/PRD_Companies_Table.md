# Product Requirements Document: Companies Table

## Document Information

**Document Title:** Companies Table Feature  
**Version:** 1.0  
**Date:** January 2025  
**Author:** Product Team  
**Status:** Draft  
**Domain:** system-config  
**Project Naming:** another-ra-ui, another-ra-api

---

## 1. Executive Summary

### 1.1. Problem Statement

Organizations need a comprehensive, scalable interface to manage and view company data within their sustainability management system. The current system requires a modern, performant table interface that supports large datasets (3000+ companies, 100K+ records/week) with advanced filtering, sorting, search capabilities, and inline editing functionality. Users need to efficiently navigate, filter, and manage company information while maintaining data integrity and supporting compliance requirements.

### 1.2. Solution Overview

Implement a modern, reusable table component (`ListDetailTemplate`) that provides:
- Paginated table view with virtual scrolling for performance
- Advanced filtering and search capabilities
- Inline editing through a sliding detail panel
- Export/import functionality
- Column visibility management
- Responsive design with Schneider Electric-inspired styling

The Companies table serves as the primary interface for managing company entities, including ISIN codes, company names, status, industry classifications, and related metadata.

### 1.3. Business Value

**Operational Efficiency:** Streamline company data management with intuitive filtering and search  
**Data Quality:** Enable inline editing to maintain accurate company information  
**Scalability:** Support 3000+ companies with optimized performance  
**Compliance Support:** Export capabilities for regulatory reporting  
**User Experience:** Consistent, modern interface aligned with Schneider Electric design standards

---

## 2. User Personas & Use Cases

### 2.1. Primary Personas

**Persona 1: Data Administrator**
- **Characteristics:** Technical professionals responsible for managing company data. Have administrative privileges and deep understanding of company data structure.
- **Needs:** Ability to view, filter, search, edit, and export company data efficiently
- **Challenges:** Managing large datasets, ensuring data accuracy, maintaining performance with 1000+ records

**Persona 2: Compliance Officer**
- **Characteristics:** Professionals responsible for regulatory compliance and reporting. Need access to company data for verification and reporting.
- **Needs:** Ability to filter by status, industry, export data for reports, view detailed company information
- **Challenges:** Finding specific companies quickly, ensuring data completeness for compliance

**Persona 3: Business Analyst**
- **Characteristics:** Users analyzing company data for business insights. Require filtering and export capabilities.
- **Needs:** Advanced filtering, sorting, export to CSV/Excel, column visibility control
- **Challenges:** Navigating large datasets, extracting relevant subsets of data

### 2.2. Use Cases

**UC1: View and Filter Companies**
- **Actor:** Data Administrator, Compliance Officer, Business Analyst
- **Description:** View list of companies with ability to filter by status, industry, sector, and activity
- **Preconditions:** User has access to Companies table, company data exists in system
- **Flow:** Navigate to Companies table → Apply filters (status, primary industry, primary sector, primary activity) → View filtered results → Clear filters if needed
- **Postconditions:** Filtered company list displayed, filters persist during session

**UC2: Search Companies**
- **Actor:** All users
- **Description:** Search companies by name, ISIN code, sector, industry, or activity
- **Preconditions:** User has access to Companies table
- **Flow:** Enter search query in search bar → View matching results → Refine search if needed
- **Postconditions:** Search results displayed, search query highlighted

**UC3: Edit Company Details**
- **Actor:** Data Administrator
- **Description:** Update company information through inline editing in detail panel
- **Preconditions:** User has edit permissions, company record exists
- **Flow:** Click on company row → Detail panel opens → Edit fields inline → Save changes → Confirm success
- **Postconditions:** Company data updated, changes reflected in table

**UC4: Export Company Data**
- **Actor:** Compliance Officer, Business Analyst
- **Description:** Export filtered or complete company list to CSV format
- **Preconditions:** User has access to Companies table, data available
- **Flow:** Apply filters if needed → Click Export button → Download CSV file
- **Postconditions:** CSV file downloaded with current view data

**UC5: Manage Column Visibility**
- **Actor:** All users
- **Description:** Show/hide table columns to customize view
- **Preconditions:** User has access to Companies table
- **Flow:** Click Columns button → Toggle column visibility → View updated table
- **Postconditions:** Table displays only selected columns, preference persists

**UC6: Sort Companies**
- **Actor:** All users
- **Description:** Sort companies by any sortable column (ascending/descending)
- **Preconditions:** User has access to Companies table
- **Flow:** Click column header → Toggle sort direction → View sorted results
- **Postconditions:** Table sorted by selected column, sort indicator displayed

---

## 3. User Stories

**US1:** As a data administrator, I want to view all companies in a paginated table so that I can efficiently navigate large datasets.

**US2:** As a user, I want to filter companies by status, industry, sector, and activity so that I can find specific subsets of data quickly.

**US3:** As a user, I want to search companies by name, ISIN code, or other attributes so that I can locate specific companies without scrolling through pages.

**US4:** As a data administrator, I want to edit company details inline in a detail panel so that I can update information without navigating away from the list.

**US5:** As a compliance officer, I want to export company data to CSV so that I can use it for regulatory reporting.

**US6:** As a user, I want to control which columns are visible so that I can customize my view based on my needs.

**US7:** As a user, I want to sort companies by any column so that I can organize data according to my analysis needs.

**US8:** As a user, I want the table to maintain my filter, sort, and column preferences during my session so that I don't have to reconfigure the view repeatedly.

**US9:** As a data administrator, I want to see company status indicators (Active/Inactive) with visual badges so that I can quickly identify company states.

**US10:** As a user, I want responsive table design so that I can access company data on different screen sizes.

---

## 4. Functional Requirements

### 4.1. Table Display

**FR1: Paginated Table View**
- **Requirement:** Display companies in a paginated table with configurable page sizes
- **Acceptance Criteria:**
  - Default page size of 25 records
  - Page size options: 10, 25, 50, 100
  - Display total count of records
  - Pagination controls (Previous, Next, page numbers)
  - Show current page and total pages
  - Virtual scrolling for performance with 1000+ records

**FR2: Column Display**
- **Requirement:** Display company data in configurable columns
- **Acceptance Criteria:**
  - Default columns: ISIN Code, Company Name, Status, Primary Industry, Primary Sector, Primary Activity
  - Column headers with sort indicators
  - Sticky header on scroll
  - Column width optimization
  - Responsive column layout

**FR3: Row Styling**
- **Requirement:** Apply consistent row styling with hover effects
- **Acceptance Criteria:**
  - Alternating row colors (zebra striping)
  - Hover effect on row selection
  - Clickable rows to open detail panel
  - Visual feedback on interaction

### 4.2. Filtering and Search

**FR4: Advanced Filtering**
- **Requirement:** Filter companies by multiple criteria
- **Acceptance Criteria:**
  - Filter by Status (Active/Inactive)
  - Filter by Primary Industry
  - Filter by Primary Sector
  - Filter by Primary Activity
  - Multiple filters can be applied simultaneously
  - Clear all filters functionality
  - Filter badge showing active filter count
  - Filters persist during pagination

**FR5: Search Functionality**
- **Requirement:** Full-text search across company attributes
- **Acceptance Criteria:**
  - Search across: Company Name, ISIN Code, Primary Sector, Primary Industry, Primary Activity
  - Debounced search (300ms delay)
  - Search suggestions/autocomplete
  - Clear search button
  - Search highlights in results
  - Search works with filters simultaneously

### 4.3. Sorting

**FR6: Column Sorting**
- **Requirement:** Sort companies by any sortable column
- **Acceptance Criteria:**
  - Sortable columns: ISIN Code, Company Name, Status, Primary Industry, Primary Sector, Primary Activity
  - Toggle between ascending/descending
  - Visual sort indicators (arrows)
  - Sort persists during pagination
  - Default sort: Company Name (ascending)

### 4.4. Detail Panel

**FR7: Inline Editing**
- **Requirement:** Edit company details in sliding detail panel
- **Acceptance Criteria:**
  - Click row to open detail panel
  - Panel slides in from right
  - Modular sections: General Info, Industry Classification, Additional Details
  - Inline editable fields with Save/Cancel buttons
  - Field validation
  - Success/error notifications
  - Panel closes on save or cancel

**FR8: Detail Panel Sections**
- **Requirement:** Organize company data in logical sections
- **Acceptance Criteria:**
  - General Info: ISIN Code, Company Name, Status
  - Industry Classification: Primary Industry, Primary Sector, Primary Activity
  - Additional Details: Other relevant fields
  - Collapsible sections (if applicable)
  - Activity log section

### 4.5. Export/Import

**FR9: Export Functionality**
- **Requirement:** Export company data to CSV format
- **Acceptance Criteria:**
  - Export button in table header
  - Export includes all visible columns
  - Export respects current filters and search
  - CSV includes UTF-8 BOM for Excel compatibility
  - Filename includes timestamp: `Companies_YYYY-MM-DD.csv`
  - Export handles large datasets efficiently

**FR10: Import Functionality** (Future)
- **Requirement:** Import companies from CSV file
- **Acceptance Criteria:**
  - Import button in table header
  - CSV file validation
  - Bulk import with progress indicator
  - Error handling for invalid data
  - Import preview before confirmation

### 4.6. Column Management

**FR11: Column Visibility**
- **Requirement:** Show/hide table columns
- **Acceptance Criteria:**
  - Columns menu button
  - Checkbox list of all columns
  - Toggle individual column visibility
  - At least one column must remain visible
  - Column visibility persists during session

**FR12: Header Wrapping**
- **Requirement:** Option to wrap column headers
- **Acceptance Criteria:**
  - "Wrap headers" checkbox
  - Toggle header text wrapping
  - Improves readability for long column names

---

## 5. Non-Functional Requirements

### 5.1. Performance Requirements

**Performance Targets:**
- Initial page load: < 1 second for 25 records
- Table render with 1000+ rows: < 500ms (with virtual scrolling)
- Filter application: < 300ms
- Search response: < 300ms
- Export generation: < 2 minutes for 10,000 records
- API response time (p95): < 500ms

**Scalability:**
- Support 3000+ companies
- Handle 100K+ records/week processing
- Virtual scrolling for tables with 1000+ visible rows
- Efficient pagination (fetch only required pages)

### 5.2. Usability Requirements

**User Interface:**
- Schneider Electric-inspired styling (grey shades + green accents)
- Intuitive filter and search interface
- Clear visual feedback for all actions
- Responsive design for tablet and desktop
- Keyboard navigation support
- Loading states and progress indicators

**Error Handling:**
- Clear error messages for failed operations
- Graceful degradation for API failures
- Retry mechanisms for transient errors
- User-friendly validation messages

### 5.3. Accessibility Requirements

**WCAG 2.1 AA Compliance:**
- Keyboard navigation for all interactive elements
- Proper ARIA labels and roles
- Focus management
- Screen reader compatibility
- Color contrast compliance
- No critical accessibility violations

### 5.4. Security Requirements

**Access Control:**
- Role-based permissions for edit operations
- Read access for all authorized users
- Secure API communication (HTTPS)
- Input validation and sanitization
- Protection against XSS attacks

### 5.5. Browser Compatibility

**Supported Browsers:**
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

---

## 6. Technical Requirements

### 6.1. Frontend Architecture

**Technology Stack:**
- Next.js 14+ (React framework)
- TypeScript for type safety
- Tailwind CSS for styling
- React hooks for state management

**Component Structure:**
- `ListDetailTemplate`: Reusable table component
- `companyConfig.tsx`: Companies-specific configuration
- API client: `src/lib/api/companies.ts`
- Detail panel components

**Key Components:**
```typescript
- ListDetailTemplate<T>
- DetailPanel
- PanelHeader
- DetailPanelContent
- TableConfigurationPanel (for future table customization)
```

### 6.2. API Integration

**Endpoints:**
- `GET /api/companies` - Get paginated companies with filters, search, sort
- `GET /api/companies/{id}` - Get single company details
- `PATCH /api/companies/{id}` - Update company
- `GET /api/companies/filter-values?field={field}` - Get filter options

**API Client:**
- Retry logic for failed requests
- Error handling with user-friendly messages
- Request cancellation support
- Type-safe request/response handling

### 6.3. Data Model

**Company Entity:**
```typescript
interface Company {
  id: string
  isinCode?: string
  companyName: string
  status: 'Active' | 'Inactive'
  primaryIndustry?: string
  primarySector?: string
  primaryActivity?: string
  // Additional fields...
  createdAt?: string
  updatedAt?: string
}
```

### 6.4. State Management

**Local State:**
- React hooks (`useState`, `useCallback`, `useMemo`)
- Pagination state
- Filter state
- Search state
- Column visibility state
- Selected item state

**Optimization:**
- Memoized callbacks to prevent unnecessary re-renders
- Debounced search input
- Virtual scrolling for large lists
- Cached filter options

---

## 7. Success Metrics

### 7.1. User Adoption Metrics

**Target Metrics:**
- 90% of users access Companies table within first week
- Average session time: 5+ minutes
- Filter usage: 70% of sessions use filters
- Search usage: 60% of sessions use search
- Export usage: 40% of sessions export data

### 7.2. Performance Metrics

**Target Metrics:**
- Page load time (p95): < 1 second
- Table render time (p95): < 500ms
- Filter response time (p95): < 300ms
- Search response time (p95): < 300ms
- API success rate: > 99%
- Zero critical accessibility violations

### 7.3. User Satisfaction Metrics

**Target Metrics:**
- User satisfaction rating: 4.5/5.0
- Task completion rate: > 95%
- Error rate: < 2%
- Support ticket reduction: 30%

---

## 8. Risk Assessment

### 8.1. Technical Risks

**Risk:** Performance degradation with 1000+ companies
- **Mitigation:** Implement virtual scrolling, optimize API queries, add caching

**Risk:** API rate limiting with high traffic
- **Mitigation:** Implement request batching, add client-side caching, optimize pagination

**Risk:** Data inconsistency during concurrent edits
- **Mitigation:** Implement optimistic updates, add conflict resolution, show last-modified timestamps

### 8.2. User Experience Risks

**Risk:** Complex filtering interface reducing adoption
- **Mitigation:** Intuitive filter panel, clear labels, filter presets, user guidance

**Risk:** Slow search response affecting usability
- **Mitigation:** Debounced search, search caching, optimized backend queries

### 8.3. Data Quality Risks

**Risk:** Invalid data entry through inline editing
- **Mitigation:** Field validation, required field indicators, error messages, data type enforcement

---

## 9. Implementation Plan

### 9.1. Phase 1: Core Table Functionality (Completed)
- ✅ Implement ListDetailTemplate component
- ✅ Configure Companies table with columns and filters
- ✅ Integrate with Companies API
- ✅ Basic pagination and sorting

### 9.2. Phase 2: Advanced Features (Completed)
- ✅ Detail panel with inline editing
- ✅ Advanced filtering
- ✅ Search functionality
- ✅ Export to CSV

### 9.3. Phase 3: Performance Optimization (In Progress)
- 🔄 Virtual scrolling implementation
- 🔄 Request batching for filters
- 🔄 Response compression
- 🔄 Caching layer

### 9.4. Phase 4: Enhancements (Planned)
- ⏳ Import functionality
- ⏳ Bulk edit operations
- ⏳ Advanced column customization
- ⏳ Saved filter presets

---

## 10. Acceptance Criteria

### 10.1. Table Display
- ✅ Companies display in paginated table
- ✅ Default 25 records per page
- ✅ Page size options work correctly
- ✅ Total count displays accurately
- ✅ Pagination controls function properly
- ✅ Sticky header on scroll
- ✅ Alternating row colors
- ✅ Hover effects on rows

### 10.2. Filtering and Search
- ✅ Filter by Status works
- ✅ Filter by Primary Industry works
- ✅ Filter by Primary Sector works
- ✅ Filter by Primary Activity works
- ✅ Multiple filters work simultaneously
- ✅ Clear filters works
- ✅ Search across multiple fields works
- ✅ Search with filters works
- ✅ Debounced search (300ms)

### 10.3. Sorting
- ✅ Sort by ISIN Code works
- ✅ Sort by Company Name works
- ✅ Sort by Status works
- ✅ Sort by Primary Industry works
- ✅ Sort indicators display correctly
- ✅ Sort persists during pagination

### 10.4. Detail Panel
- ✅ Click row opens detail panel
- ✅ Panel slides in from right
- ✅ Inline editing works
- ✅ Save button updates data
- ✅ Cancel button discards changes
- ✅ Validation works
- ✅ Success notifications display

### 10.5. Export
- ✅ Export button visible
- ✅ Export generates CSV
- ✅ Export includes filtered data
- ✅ CSV filename includes timestamp
- ✅ CSV opens correctly in Excel

### 10.6. Column Management
- ✅ Columns menu accessible
- ✅ Column visibility toggles work
- ✅ At least one column remains visible
- ✅ Header wrap toggle works

---

## 11. Dependencies

### 11.1. Technical Dependencies
- Next.js framework
- React 18+
- TypeScript
- Tailwind CSS
- Airtable API (or PostgreSQL for future migration)
- Express.js API server

### 11.2. Data Dependencies
- Companies data in Airtable (or database)
- Filter values API endpoints
- Company update API endpoints

### 11.3. Component Dependencies
- ListDetailTemplate (reusable component)
- DetailPanel components
- Icon components
- Toast notification system

---

## 12. Appendices

### 12.1. Glossary

**Company:** Business entity with ISIN code, name, and classification data  
**ISIN Code:** International Securities Identification Number  
**Primary Industry:** Main industry classification  
**Primary Sector:** Main sector classification  
**Primary Activity:** Main activity classification  
**Status:** Active or Inactive company state  
**Detail Panel:** Sliding panel for viewing/editing company details  
**Virtual Scrolling:** Rendering only visible rows for performance

### 12.2. API Reference

**GET /api/companies**
- Query params: `page`, `limit`, `sortBy`, `sortOrder`, `search`, `status`, `primaryIndustry`, `primarySector`, `primaryActivity`
- Response: `{ success: boolean, data: Company[], pagination: {...} }`

**GET /api/companies/{id}**
- Response: `{ success: boolean, data: Company }`

**PATCH /api/companies/{id}**
- Body: `Partial<Company>`
- Response: `{ success: boolean, data: Company }`

**GET /api/companies/filter-values?field={field}**
- Response: `{ success: boolean, data: string[] }`

### 12.3. Configuration Example

```typescript
export const companyConfig: ListDetailTemplateConfig<Company> = {
  entityName: 'Company',
  entityNamePlural: 'Companies',
  defaultSort: { field: 'companyName', order: 'asc' },
  defaultPageSize: 25,
  columns: [
    { key: 'isinCode', label: 'ISIN Code', sortable: true },
    { key: 'companyName', label: 'Company Name', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    // ... more columns
  ],
  filters: [
    { key: 'status', label: 'Status', type: 'select', options: async () => [...] },
    // ... more filters
  ],
  apiClient: companyApiClient,
  // ... more config
}
```

---

**Document Status:** Draft  
**Last Updated:** January 2025  
**Next Review:** After Phase 3 completion

