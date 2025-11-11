# Product Requirements Document: Batch Table Implementation

## Overview

This PRD documents the implementation of 8 new data management tables following the Standard Emission Factors pattern. These tables provide comprehensive management capabilities for emission-related reference data, scope definitions, unit conversions, and ECM (Energy Conservation Measure) catalogs.

**Implementation Date:** 2025-01-XX  
**Status:** ✅ Completed

---

## Tables Implemented

### 1. Normalized Activities
- **Purpose:** Manage normalized activity definitions for emission calculations
- **Key Fields:** Name, Description, Status, Notes
- **Relationships:** None (standalone reference table)
- **Location:** `/spaces/emission-management/normalized-activities`

### 2. EF/Detailed G
- **Purpose:** Manage detailed greenhouse gas emission factors
- **Key Fields:** Name, Description, Status, EF GWP, GHG TYPE, Std Emission factors, Notes
- **Relationships:** 
  - Links to EF GWP (many-to-many)
  - Links to GHG TYPE (many-to-many)
  - Links to Standard Emission Factors (many-to-many)
- **Location:** `/spaces/emission-management/ef-detailed-g`

### 3. Scope
- **Purpose:** Define emission scopes (Scope 1, 2, 3)
- **Key Fields:** Name, Description, Status, Notes
- **Relationships:** None (standalone reference table)
- **Location:** `/spaces/emission-management/scope`

### 4. Scope & Categorisation
- **Purpose:** Categorize emissions by scope and category
- **Key Fields:** Name, Description, Status, Scope, Notes
- **Relationships:** 
  - Links to Scope (many-to-one)
- **Location:** `/spaces/emission-management/scope-categorisation`

### 5. Unit
- **Purpose:** Manage unit definitions and symbols
- **Key Fields:** Name, Symbol, Description, Status, Notes
- **Relationships:** None (standalone reference table)
- **Location:** `/spaces/emission-management/unit`

### 6. Unit Conversion
- **Purpose:** Define conversion factors between units
- **Key Fields:** Name, Unit to convert, Normalized unit, Conversion factor, Description, Activity Density, Status, Notes
- **Relationships:** 
  - Links to Activity Density (many-to-many)
- **Location:** `/spaces/emission-management/unit-conversion`

### 7. Standard ECM Catalog
- **Purpose:** Manage Energy Conservation Measure catalogs
- **Key Fields:** Name, Description, Status, Standard ECM Classification, Notes
- **Relationships:** 
  - Links to Standard ECM Classification (many-to-many)
- **Location:** `/spaces/emission-management/standard-ecm-catalog`

### 8. Standard ECM Classification
- **Purpose:** Classify Energy Conservation Measures
- **Key Fields:** Name, Description, Status, Standard ECM catalog, Notes
- **Relationships:** 
  - Links to Standard ECM Catalog (many-to-many)
- **Location:** `/spaces/emission-management/standard-ecm-classification`

---

## Technical Implementation

### Backend Architecture

#### Services
All services follow the same pattern:
- **Lazy Initialization:** Services are instantiated only when needed (not at module load time) to prevent environment variable errors
- **Relationship Resolution:** Uses `RelationshipResolver` to resolve linked record names
- **Error Handling:** Comprehensive error handling with retry logic
- **Pagination:** Server-side pagination with offset/limit support
- **Filtering:** Status-based and search filtering
- **Sorting:** Configurable sorting by any field

#### Controllers
- **Lazy Service Initialization:** All controllers use `getService()` pattern to avoid initialization errors
- **Standard CRUD Operations:** Create, Read, Update, Delete
- **Filter Values Endpoint:** `/filters/values` for dynamic filter options

#### Routes
All routes registered in `server/src/index.ts`:
- `/api/normalized-activities`
- `/api/ef-detailed-g`
- `/api/scope`
- `/api/scope-categorisation`
- `/api/unit`
- `/api/unit-conversion`
- `/api/standard-ecm-catalog`
- `/api/standard-ecm-classification`

### Frontend Architecture

#### API Clients
- **Retry Logic:** Exponential backoff (3 retries)
- **Error Handling:** Comprehensive error messages
- **Type Safety:** Full TypeScript interfaces
- **Pagination Support:** Page-based pagination with offset calculation

#### Configs (ListDetailTemplate)
- **Column Configuration:** Sortable, filterable columns with custom renderers
- **Field Configuration:** Organized into sections (general, relationships, notes)
- **Filter Configuration:** Dynamic filter options from API
- **Panel Configuration:** Collapsible sections for better UX

#### Pages & Layouts
- **Consistent Structure:** All pages follow the same pattern
- **Sidebar Integration:** Proper sidebar context and animation
- **Responsive Design:** Adapts to sidebar collapse state

### Feature Flags

All 8 tables have feature flags:
- `normalizedActivities`
- `efDetailedG`
- `scope`
- `scopeCategorisation`
- `unit`
- `unitConversion`
- `standardECMCatalog`
- `standardECMClassification`

**Default State:** All enabled by default (can be toggled in Settings Modal)

---

## Navigation Structure

### Reorganized Sidebar Menu

The sidebar has been reorganized with intuitive grouping:

1. **Emission Management** (existing + new)
   - Emission Factor GWP
   - Emission Factor Version
   - Standard Emission Factors
   - **EF/Detailed G** (new)
   - **Normalized Activities** (new)
   - GHG Type
   - Industry Factors

2. **Reference Data** (NEW SECTION)
   - **Scope** (new)
   - **Scope & Categorisation** (new)
   - **Unit** (new)
   - **Unit Conversion** (new)

3. **ECM Management** (NEW SECTION)
   - **Standard ECM Catalog** (new)
   - **Standard ECM Classification** (new)

---

## Relationship Handling

### Link Reconciliation

All relationships are properly handled:

1. **Backend Resolution:**
   - Services use `RelationshipResolver` to fetch linked record names
   - Parallel resolution using `Promise.all()` for performance
   - Fallback to programmatic resolution if lookup fields don't exist

2. **Frontend Display:**
   - Linked record names displayed in columns (e.g., "EF GWP Name", "GHG TYPE Name")
   - Read-only relationship fields in detail panels
   - Proper handling of single and multiple relationships

3. **Data Integrity:**
   - Linked record IDs stored in Airtable
   - Names resolved on-demand for display
   - No data duplication

---

## Optimizations Implemented

### Performance
- **Lazy Service Initialization:** Prevents startup errors and improves load time
- **Parallel Relationship Resolution:** Uses `Promise.all()` for concurrent API calls
- **Server-Side Pagination:** Reduces data transfer and improves response times
- **Retry Logic:** Exponential backoff for transient failures
- **Error Caching:** Prevents repeated failed API calls

### User Experience
- **Consistent UI:** All tables use the same ListDetailTemplate for familiarity
- **Organized Sections:** Detail panels organized into collapsible sections
- **Status Badges:** Visual status indicators with color coding
- **Search & Filter:** Full-text search and status filtering on all tables
- **Responsive Design:** Adapts to sidebar collapse/expand

### Code Quality
- **Type Safety:** Full TypeScript coverage
- **Error Handling:** Comprehensive error messages and fallbacks
- **Code Reusability:** Shared patterns and templates
- **Maintainability:** Consistent structure across all tables

---

## Testing Checklist

### Backend
- [x] All services initialize correctly with lazy loading
- [x] All controllers handle errors gracefully
- [x] All routes are registered and accessible
- [x] Relationship resolution works correctly
- [x] Pagination works as expected
- [x] Filtering and sorting function properly

### Frontend
- [x] All API clients connect to backend correctly
- [x] All configs render tables properly
- [x] All pages load without errors
- [x] All layouts provide sidebar context
- [x] Feature flags control visibility correctly
- [x] Navigation menu displays all tables

### Integration
- [x] Backend-frontend connection verified
- [x] Relationship links display correctly
- [x] CRUD operations work end-to-end
- [x] Feature flags toggle table visibility

---

## Known Limitations

1. **Relationship Editing:** Linked records cannot be edited directly from the detail panel (must be edited in source table)
2. **Bulk Operations:** No bulk import/export yet (can be added later)
3. **Advanced Filtering:** Currently only status filtering (can be extended)

---

## Future Enhancements

1. **Bulk Import/Export:** Add CSV import/export for all tables
2. **Advanced Filtering:** Multi-field filtering with AND/OR logic
3. **Relationship Editing:** Allow editing linked records from detail panel
4. **Audit Trail:** Enhanced audit logging for all operations
5. **Data Validation:** Client-side and server-side validation rules

---

## Files Created

### Backend (24 files)
- 8 Type files (`server/src/types/`)
- 8 Service files (`server/src/services/`)
- 8 Controller files (`server/src/controllers/`)
- 8 Route files (`server/src/routes/`)
- Updated `server/src/index.ts`

### Frontend (33 files)
- 8 API client files (`src/lib/api/`)
- 8 Config files (`src/components/templates/configs/`)
- 8 Page files (`src/app/spaces/emission-management/`)
- 8 Layout files (`src/app/spaces/emission-management/`)
- Updated `src/lib/featureFlags.ts`
- Updated `src/components/Sidebar.tsx`
- Updated `src/components/SettingsModal.tsx`

**Total:** 57 new/modified files

---

## Success Criteria

✅ All 8 tables are accessible via navigation menu  
✅ All tables support full CRUD operations  
✅ All relationships are properly resolved and displayed  
✅ All tables have feature flags for toggle control  
✅ Navigation menu is organized with intuitive grouping  
✅ All optimizations from Standard Emission Factors are applied  
✅ No errors on server startup or page load  
✅ Consistent user experience across all tables  

---

## Conclusion

All 8 tables have been successfully implemented following the Standard Emission Factors pattern. The implementation includes:

- Complete backend infrastructure with lazy initialization
- Full frontend integration with ListDetailTemplate
- Proper relationship handling and link reconciliation
- Feature flags for all new tables
- Reorganized navigation menu with intuitive grouping
- All optimizations and best practices applied

The system is now ready for use with comprehensive emission management capabilities.

