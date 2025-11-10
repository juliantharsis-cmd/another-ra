# ListDetailTemplate Framework

## Overview

The `ListDetailTemplate` is a **unified, templated component** that provides a consistent design framework for all list/detail views across the Another RA application. All tables using this template automatically inherit the same UI/UX features, ensuring consistency and reducing maintenance overhead.

## Architecture

### Core Principle
**Single Source of Truth**: All table pages use `ListDetailTemplate` with a configuration object. UI/UX improvements made to the template automatically apply to all tables.

### Component Structure
```
ListDetailTemplate
├── Configuration (config object)
│   ├── Entity metadata (name, plural, API client)
│   ├── Columns definition
│   ├── Fields definition (detail panel)
│   ├── Filters configuration
│   └── Panel configuration
├── Shared Features (automatically available)
│   ├── User preferences integration
│   ├── Pagination with reset icon
│   ├── Column visibility/ordering
│   ├── Table header actions (Import/Export/Configure)
│   ├── Detail panel
│   ├── Search and filtering
│   └── Responsive design
└── Per-Table Customization
    └── Via configuration object only
```

## Tables Using ListDetailTemplate

### ✅ System Configuration
- **Companies** (`/spaces/system-config/companies`) - Uses `companyConfig`
- **Geography** (`/spaces/system-config/geography`) - Uses `geographyConfig`

### ✅ Emission Management
- **Emission Factor GWP** (`/spaces/emission-management/emission-factors`) - Uses `efGwpConfig`
- **GHG Types** (`/spaces/emission-management/ghg-types`) - Uses `ghgTypeConfig`
- **Emission Factor Version** (`/spaces/emission-management/emission-factor-version`) - Uses `emissionFactorVersionConfig`

## Automatic Features

All tables using `ListDetailTemplate` automatically have:

### 1. User Preferences Integration
- **Default Page Size**: Uses user's `defaultPageSize` from preferences
- **Per-Table Override**: Users can set different page sizes per table
- **Reset Icon**: Circular arrow icon to reset to user default (appears when override exists)
- **Persistence**: Page size preferences saved in localStorage

### 2. Pagination
- **User Default**: Respects user's default page size preference
- **Per-Table Override**: Allows custom page size per table
- **Reset Button**: Quick reset to user default
- **Page Navigation**: Previous/Next buttons with page numbers

### 3. Table Header Actions
- **Import**: Bulk import functionality
- **Export**: CSV export functionality
- **Configure Table**: Column visibility, ordering, default sort
- **Unified UI**: Single breadcrumb-style action button (when `feature.tableActionsV2` enabled)

### 4. Detail Panel
- **Right-Side Panel**: Fixed width (520px/32rem)
- **Eye Icon**: Hover-activated preview icon on table rows
- **Section Organization**: Header, Key Properties, Related Info, Metadata
- **Inline Editing**: All fields editable with validation

### 5. Column Management
- **Visibility Toggle**: Show/hide columns
- **Column Ordering**: Drag-and-drop reordering
- **Column Resizing**: Click-and-drag resize (when `feature.columnResizeV2` enabled)
- **Auto-Alignment**: Automatic alignment based on data type

### 6. Search & Filtering
- **Global Search**: Search across all text fields
- **Field Filters**: Dropdown filters for each configured filter
- **Filter Persistence**: Filters persist during pagination
- **Clear Filters**: One-click clear all filters

### 7. Sorting
- **Default Sort**: Configurable default sort field and order
- **Column Sorting**: Click column headers to sort
- **Sort Indicators**: Visual indicators for sort direction
- **Multi-Column**: Support for multiple sort criteria

## Configuration Pattern

### Basic Structure
```typescript
export const myTableConfig: ListDetailTemplateConfig<MyEntity> = {
  entityName: 'My Entity',
  entityNamePlural: 'My Entities',
  defaultSort: {
    field: 'name',
    order: 'asc',
  },
  // defaultPageSize removed - uses user preferences automatically
  pageSizeOptions: [10, 25, 50, 100],
  showImportExport: true,
  
  columns: [
    // Column definitions
  ],
  
  fields: [
    // Field definitions for detail panel
  ],
  
  filters: [
    // Filter definitions
  ],
  
  panel: {
    // Panel configuration
  },
  
  apiClient: {
    // API client adapter
  },
}
```

### Page Implementation
```typescript
export default function MyTablePage() {
  const { isCollapsed } = useSidebar()
  
  return (
    <div className="fixed inset-0 flex bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className={`flex-1 p-8 overflow-hidden flex flex-col ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <ListDetailTemplate config={myTableConfig} />
      </div>
    </div>
  )
}
```

## Adding a New Table

### Step 1: Create Configuration File
Create `src/components/templates/configs/myTableConfig.tsx`:

```typescript
import { ListDetailTemplateConfig } from '../types'
import { myTableApi, MyEntity } from '@/lib/api/myTable'

const myTableApiClient = {
  getPaginated: async (params) => {
    return await myTableApi.getPaginated(params)
  },
  getById: async (id) => {
    return await myTableApi.getById(id)
  },
  // ... other methods
}

export const myTableConfig: ListDetailTemplateConfig<MyEntity> = {
  entityName: 'My Entity',
  entityNamePlural: 'My Entities',
  defaultSort: { field: 'name', order: 'asc' },
  pageSizeOptions: [10, 25, 50, 100],
  showImportExport: true,
  columns: [/* ... */],
  fields: [/* ... */],
  filters: [/* ... */],
  panel: { /* ... */ },
  apiClient: myTableApiClient,
}
```

### Step 2: Create Page Component
Create `src/app/spaces/my-space/my-table/page.tsx`:

```typescript
'use client'

import Sidebar from '@/components/Sidebar'
import { useSidebar } from '@/components/SidebarContext'
import ListDetailTemplate from '@/components/templates/ListDetailTemplate'
import { myTableConfig } from '@/components/templates/configs/myTableConfig'

export default function MyTablePage() {
  const { isCollapsed } = useSidebar()
  
  return (
    <div className="fixed inset-0 flex bg-gray-50 overflow-hidden" style={{ margin: 0, padding: 0 }}>
      <Sidebar />
      <div className={`flex-1 p-8 overflow-hidden flex flex-col ${isCollapsed ? 'ml-16' : 'ml-64'}`}
           style={{ transition: 'margin-left 300ms ease-in-out' }}>
        <ListDetailTemplate config={myTableConfig} />
      </div>
    </div>
  )
}
```

### Step 3: Add to Sidebar (Optional)
Update `src/components/Sidebar.tsx` to include navigation link.

## Feature Flags

Some features are controlled by feature flags:

- `feature.tableActionsV2`: Unified table header actions (Import/Export/Configure)
- `feature.columnResizeV2`: Column resizing with drag-and-drop
- `feature.ghgTypes`: GHG Types table visibility
- `feature.emissionFactorVersion`: Emission Factor Version table visibility

## User Preferences Integration

### Automatic Features
- **Page Size**: All tables respect user's `defaultPageSize` preference
- **Per-Table Override**: Users can override default per table
- **Reset Icon**: Appears when override exists, resets to user default

### Implementation
The template automatically:
1. Loads user preferences via `useUserPreferences()` hook
2. Applies user default page size
3. Checks for per-table overrides in localStorage
4. Shows reset icon when override exists
5. Saves/removes overrides when user changes page size

## Consistency Guarantees

### ✅ All Tables Have:
- Same pagination UI with reset icon
- Same detail panel width and layout
- Same table header actions
- Same search and filter UI
- Same column management
- Same responsive behavior

### ✅ Automatic Updates
When `ListDetailTemplate` is updated:
- All tables automatically get the update
- No need to modify individual table pages
- Consistent UX across the application

## Migration Guide

### From Custom Table Component to ListDetailTemplate

1. **Create Config File**: Extract table configuration to a config object
2. **Replace Component**: Replace custom table component with `ListDetailTemplate`
3. **Update Page**: Use the standard page structure
4. **Test**: Verify all features work correctly

### Example: Migrating CompanyTable

**Before** (Custom Component):
```typescript
<CompanyTable
  companies={companies}
  onCompanyClick={handleClick}
  pageSize={pageSize}
  onPageSizeChange={handlePageSizeChange}
  // ... many props
/>
```

**After** (ListDetailTemplate):
```typescript
<ListDetailTemplate config={companyConfig} />
```

## Best Practices

1. **Always use ListDetailTemplate** for new tables
2. **Don't create custom table components** - use configuration instead
3. **Keep configs focused** - only table-specific configuration
4. **Leverage automatic features** - don't reimplement what the template provides
5. **Test with feature flags** - ensure features work when flags are enabled/disabled

## Troubleshooting

### Table not showing user preferences
- Verify `useUserPreferences` hook is working
- Check browser console for errors
- Ensure user preferences API is accessible

### Reset icon not appearing
- Check if page size differs from user default
- Verify `ArrowPathIcon` is imported
- Check browser console for errors

### Features not updating
- Clear browser cache
- Restart development server
- Verify feature flags are enabled

## Future Enhancements

The template is designed to be extended. Future features will automatically be available to all tables:
- Advanced filtering
- Column grouping
- Export formats (Excel, PDF)
- Bulk operations
- Keyboard shortcuts
- Accessibility improvements

