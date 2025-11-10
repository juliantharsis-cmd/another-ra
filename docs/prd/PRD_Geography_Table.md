# Product Requirements Document: Geography Table

## Document Information

**Document Title:** Geography Table Feature  
**Version:** 1.0  
**Date:** January 2025  
**Author:** Product Team  
**Status:** Draft  
**Domain:** system-config  
**Project Naming:** another-ra-ui, another-ra-api

---

## 1. Executive Summary

### 1.1. Problem Statement

Organizations managing sustainability data need a comprehensive interface to view and manage geographic entities (countries, regions, locations) that are critical for emission reporting, compliance, and data organization. The system requires a performant, user-friendly table interface that supports geographic data management with filtering, search, and inline editing capabilities. Users need to efficiently navigate geographic hierarchies, filter by country and status, and maintain accurate geographic metadata.

### 1.2. Solution Overview

Implement a Geography table using the reusable `ListDetailTemplate` component that provides:
- Comprehensive view of geographic entities with country, region, and location data
- Country and status-based filtering
- Full-text search across geographic attributes
- Inline editing through sliding detail panel
- Consistent styling aligned with Companies table experience
- Integration with emission and sustainability workflows

The Geography table serves as the primary interface for managing geographic entities, ensuring data consistency and supporting location-based reporting and analysis.

### 1.3. Business Value

**Data Organization:** Centralized management of geographic entities supports structured data organization  
**Compliance Support:** Geographic data essential for regulatory reporting and compliance  
**Operational Efficiency:** Quick access to geographic information with filtering and search  
**Consistency:** Unified interface design ensures consistent user experience  
**Reporting Foundation:** Geographic data supports location-based emission reporting and analysis

---

## 2. User Personas & Use Cases

### 2.1. Primary Personas

**Persona 1: Geographic Data Manager**
- **Characteristics:** Professionals responsible for managing geographic entity data. Have administrative privileges and understand geographic hierarchies.
- **Needs:** Ability to view, filter, edit, and manage geographic entities with accurate country and region information
- **Challenges:** Maintaining geographic hierarchy accuracy, ensuring data consistency, managing large geographic datasets

**Persona 2: Sustainability Analyst**
- **Characteristics:** Professionals performing emission analysis and reporting. Need access to geographic data for location-based analysis.
- **Needs:** Quick access to geographic entities, filter by country, search by location name
- **Challenges:** Finding specific locations quickly, understanding geographic relationships

**Persona 3: Compliance Officer**
- **Characteristics:** Professionals ensuring regulatory compliance. Need to verify geographic data for reporting.
- **Needs:** Access to geographic metadata, status information, country classifications
- **Challenges:** Verifying geographic accuracy, tracking geographic changes

### 2.2. Use Cases

**UC1: View Geographic Entities**
- **Actor:** Geographic Data Manager, Sustainability Analyst, Compliance Officer
- **Description:** View list of geographic entities with country, region, and status information
- **Preconditions:** User has access to Geography table, geographic data exists
- **Flow:** Navigate to Geography table → View paginated list → Apply filters if needed
- **Postconditions:** Geographic entity list displayed with all relevant information

**UC2: Filter by Country**
- **Actor:** Sustainability Analyst, Geographic Data Manager
- **Description:** Filter geographic entities by country to focus on specific regions
- **Preconditions:** User has access to Geography table
- **Flow:** Click Filters button → Select Country filter → Choose country → View filtered results
- **Postconditions:** Only geographic entities from selected country displayed

**UC3: Filter by Status**
- **Actor:** Geographic Data Manager
- **Description:** Filter geographic entities by status (Active/Inactive)
- **Preconditions:** User has access to Geography table
- **Flow:** Click Filters button → Select Status filter → Choose status → View filtered results
- **Postconditions:** Only geographic entities with selected status displayed

**UC4: Search Geographic Entities**
- **Actor:** All users
- **Description:** Search geographic entities by name or other attributes
- **Preconditions:** User has access to Geography table
- **Flow:** Enter search query in search bar → View matching results
- **Postconditions:** Search results displayed, matching entities highlighted

**UC5: Edit Geographic Entity**
- **Actor:** Geographic Data Manager
- **Description:** Update geographic entity details including name, country, status, and metadata
- **Preconditions:** User has edit permissions, geographic entity exists
- **Flow:** Click on geographic entity row → Detail panel opens → Edit fields → Save changes
- **Postconditions:** Geographic entity updated, changes reflected in table

**UC6: View Geographic Details**
- **Actor:** Sustainability Analyst, Compliance Officer
- **Description:** View comprehensive geographic entity information
- **Preconditions:** User has access to Geography table
- **Flow:** Click on geographic entity row → Detail panel opens → Review all details
- **Postconditions:** Complete geographic entity information displayed

---

## 3. User Stories

**US1:** As a sustainability analyst, I want to view all geographic entities in a table so that I can quickly find locations for analysis.

**US2:** As a geographic data manager, I want to filter geographic entities by country so that I can focus on specific regions.

**US3:** As a user, I want to filter geographic entities by status so that I can see only active locations.

**US4:** As a user, I want to search geographic entities by name so that I can locate specific locations quickly.

**US5:** As a geographic data manager, I want to edit geographic entity details so that I can maintain accurate location data.

**US6:** As a compliance officer, I want to view geographic entity metadata so that I can verify data for reporting.

**US7:** As a user, I want the Geography table to have the same look and feel as the Companies table so that I have a consistent experience.

**US8:** As a user, I want to see geographic entity status indicators so that I can quickly identify active locations.

---

## 4. Functional Requirements

### 4.1. Table Display

**FR1: Paginated Table View**
- **Requirement:** Display geographic entities in a paginated table
- **Acceptance Criteria:**
  - Default page size of 25 records
  - Page size options: 10, 25, 50, 100
  - Display total count of geographic entities
  - Pagination controls (Previous, Next, page numbers)
  - Virtual scrolling for performance
  - Consistent styling with Companies table

**FR2: Column Display**
- **Requirement:** Display geographic entity data in columns
- **Acceptance Criteria:**
  - Columns: Name, Country, Status (and other relevant fields)
  - Column headers with sort indicators
  - Sticky header on scroll
  - Header background color: #f5f5f5
  - Alternating row colors
  - Hover effects on rows

**FR3: Row Interaction**
- **Requirement:** Enable row click to open detail panel
- **Acceptance Criteria:**
  - Click row opens detail panel
  - Hover effect on rows
  - Visual feedback on selection
  - Consistent row height and spacing

### 4.2. Filtering and Search

**FR4: Country Filtering**
- **Requirement:** Filter geographic entities by country
- **Acceptance Criteria:**
  - Filter by Country dropdown
  - Filter options loaded from API
  - Clear filter functionality
  - Filter persists during pagination
  - Filter badge showing active filters

**FR5: Status Filtering**
- **Requirement:** Filter geographic entities by status
- **Acceptance Criteria:**
  - Filter by Status (Active/Inactive)
  - Filter options loaded from API
  - Clear filter functionality
  - Multiple filters work simultaneously

**FR6: Search Functionality**
- **Requirement:** Full-text search across geographic entity attributes
- **Acceptance Criteria:**
  - Search across: Name, Country, and other searchable fields
  - Debounced search (300ms delay)
  - Clear search button
  - Search works with filters simultaneously
  - Search suggestions/autocomplete

### 4.3. Sorting

**FR7: Column Sorting**
- **Requirement:** Sort geographic entities by sortable columns
- **Acceptance Criteria:**
  - Sortable columns: Name, Country, Status
  - Toggle between ascending/descending
  - Visual sort indicators (arrows)
  - Default sort: Name (ascending)
  - Sort persists during pagination

### 4.4. Detail Panel

**FR8: Inline Editing**
- **Requirement:** Edit geographic entity details in sliding detail panel
- **Acceptance Criteria:**
  - Panel slides in from right
  - Modular sections: General Info, Geographic Details, Additional Details
  - Inline editable fields
  - Save/Cancel buttons
  - Field validation
  - Success/error notifications
  - Consistent styling with Companies detail panel

**FR9: Detail Panel Sections**
- **Requirement:** Organize geographic entity data in logical sections
- **Acceptance Criteria:**
  - General Info: Name, Status
  - Geographic Details: Country, Region, Coordinates (if applicable)
  - Additional Details: Other relevant fields
  - Activity Log section (if applicable)
  - Collapsible sections support

**FR10: Geographic Metadata**
- **Requirement:** Display and edit geographic metadata
- **Acceptance Criteria:**
  - Country field editable
  - Region/State field editable (if applicable)
  - Status editable
  - Metadata fields properly validated

### 4.5. Styling Consistency

**FR11: Design Alignment**
- **Requirement:** Match Companies table design exactly
- **Acceptance Criteria:**
  - Same row height and spacing
  - Same alternating row colors
  - Same hover interactions
  - Same sticky header styling
  - Same detail panel structure
  - Same button styles and placements
  - Same filter panel design
  - Header background: #f5f5f5

**FR12: Menu Consistency**
- **Requirement:** Same menu options as Companies table
- **Acceptance Criteria:**
  - Search bar present
  - Filter button with badge
  - Columns menu
  - Wrap headers checkbox
  - Share button
  - Configure Table button
  - Import/Export buttons (if applicable)

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
- Support 1000+ geographic entities
- Efficient pagination
- Virtual scrolling for large lists

### 5.2. Usability Requirements

**User Interface:**
- Schneider Electric-inspired styling (grey shades + green accents)
- Intuitive filter and search interface
- Clear visual feedback
- Responsive design
- Loading states
- Consistent with Companies table UX

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
- Geographic name required
- Country validation
- Status required
- Data type validation

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
- `geographyConfig.tsx`: Geography-specific configuration
- API client: `src/lib/api/geography.ts`
- Detail panel components

### 6.2. API Integration

**Endpoints:**
- `GET /api/geography` - Get paginated geographic entities
- `GET /api/geography/{id}` - Get single geographic entity
- `PATCH /api/geography/{id}` - Update geographic entity
- `GET /api/geography/filter-values?field={field}` - Get filter options

**API Client:**
- Retry logic
- Error handling
- Type-safe requests

### 6.3. Data Model

**Geography Entity:**
```typescript
interface Geography {
  id: string
  name: string
  country?: string
  status: 'Active' | 'Inactive'
  // Additional geographic fields...
  created_at?: string
  updated_at?: string
}
```

### 6.4. Styling Specifications

**Header Background:**
- Color: #f5f5f5
- Sticky positioning
- Border styling consistent with Companies table

**Row Styling:**
- Alternating colors: white and light grey
- Hover: green-50 background
- Consistent height: 50px
- Consistent padding

**Detail Panel:**
- Same structure as Companies panel
- Same section organization
- Same inline editing patterns

---

## 7. Success Metrics

### 7.1. User Adoption Metrics

**Target Metrics:**
- 70% of users access Geography table within first month
- Average session time: 3+ minutes
- Filter usage: 60% of sessions
- Search usage: 50% of sessions
- Edit operations: 25% of sessions

### 7.2. Performance Metrics

**Target Metrics:**
- Page load time (p95): < 1 second
- Table render time (p95): < 500ms
- Filter response time (p95): < 300ms
- Search response time (p95): < 300ms
- API success rate: > 99%

### 7.3. Consistency Metrics

**Target Metrics:**
- Design consistency score: 100% match with Companies table
- User perception of consistency: 4.5/5.0
- Zero styling inconsistencies reported

---

## 8. Risk Assessment

### 8.1. Technical Risks

**Risk:** Performance degradation with large geographic datasets
- **Mitigation:** Virtual scrolling, optimized queries, caching

**Risk:** Inconsistent styling with Companies table
- **Mitigation:** Shared component library, design system, code review

### 8.2. User Experience Risks

**Risk:** Users confused by different table experiences
- **Mitigation:** Consistent design, user testing, documentation

**Risk:** Geographic hierarchy complexity
- **Mitigation:** Clear data model, user guidance, validation

---

## 9. Implementation Plan

### 9.1. Phase 1: Core Table (Completed)
- ✅ Implement ListDetailTemplate for Geography
- ✅ Configure columns and filters
- ✅ Integrate with Geography API
- ✅ Basic pagination and sorting

### 9.2. Phase 2: Design Alignment (Completed)
- ✅ Match Companies table styling
- ✅ Implement same menu options
- ✅ Align detail panel structure
- ✅ Apply header background color

### 9.3. Phase 3: Enhancements (Planned)
- ⏳ Advanced filtering
- ⏳ Export functionality
- ⏳ Geographic hierarchy visualization
- ⏳ Map integration (future)

---

## 10. Acceptance Criteria

### 10.1. Table Display
- ✅ Geographic entities display in paginated table
- ✅ Columns display correctly
- ✅ Header background: #f5f5f5
- ✅ Alternating row colors
- ✅ Hover effects work
- ✅ Sticky header on scroll
- ✅ Consistent with Companies table

### 10.2. Filtering and Search
- ✅ Filter by Country works
- ✅ Filter by Status works
- ✅ Search works
- ✅ Multiple filters work simultaneously
- ✅ Clear filters works

### 10.3. Detail Panel
- ✅ Click row opens detail panel
- ✅ Panel structure matches Companies panel
- ✅ Inline editing works
- ✅ Save/Cancel works
- ✅ Validation works

### 10.4. Menu Consistency
- ✅ Search bar present
- ✅ Filter button present
- ✅ Columns menu present
- ✅ Wrap headers checkbox present
- ✅ Share button present
- ✅ Configure Table button present

---

## 11. Dependencies

### 11.1. Technical Dependencies
- Next.js framework
- React 18+
- TypeScript
- ListDetailTemplate component
- Airtable API
- Express.js API server

### 11.2. Component Dependencies
- Shared styling components
- Detail panel components
- Filter components

### 11.3. Data Dependencies
- Geography data in Airtable
- Filter values API
- Update API endpoints

---

## 12. Appendices

### 12.1. Glossary

**Geography:** Geographic entity representing a location, region, or country  
**Country:** Nation or sovereign state  
**Status:** Active or Inactive state of geographic entity  
**Geographic Hierarchy:** Organizational structure of geographic entities

### 12.2. API Reference

**GET /api/geography**
- Query params: `page`, `limit`, `sortBy`, `sortOrder`, `search`, `country`, `status`
- Response: `{ success: boolean, data: Geography[], pagination: {...} }`

**GET /api/geography/{id}**
- Response: `{ success: boolean, data: Geography }`

**PATCH /api/geography/{id}**
- Body: `Partial<Geography>`
- Response: `{ success: boolean, data: Geography }`

### 12.3. Styling Reference

**Header Background:** #f5f5f5  
**Row Colors:** Alternating white and light grey  
**Hover Color:** green-50  
**Row Height:** 50px  
**Border:** Consistent with Companies table

---

**Document Status:** Draft  
**Last Updated:** January 2025  
**Next Review:** After enhancements completion

