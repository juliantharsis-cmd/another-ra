# ListDetailTemplate System

## Overview

The `ListDetailTemplate` is a reusable template component that standardizes the list/detail view experience across all tables in the platform. It provides a consistent UI/UX with modern table layout, pagination, filtering, sorting, and a sliding detail panel with inline editing.

## Architecture

### Core Components

1. **ListDetailTemplate** (`src/components/templates/ListDetailTemplate.tsx`)
   - Main template component
   - Handles list view (table, pagination, filters, sorting)
   - Manages detail panel state and interactions
   - Integrates with API client

2. **DetailPanelContent** (`src/components/templates/DetailPanelContent.tsx`)
   - Renders panel sections and fields
   - Handles async field options loading
   - Manages field rendering based on type

3. **Types** (`src/components/templates/types.ts`)
   - TypeScript interfaces for configuration
   - `ListDetailTemplateConfig` - Main configuration interface
   - `ApiClient` - API abstraction interface
   - Field, column, filter, and section config types

### Configuration Files

1. **companyConfig.tsx** - Full Company table configuration
2. **userConfig.example.tsx** - Example User table configuration

## Features

### List View
- ✅ Dynamic table columns with custom rendering
- ✅ Server-side pagination with page size options
- ✅ Global search with autocomplete suggestions
- ✅ Filterable columns with dynamic options
- ✅ Sortable columns (ascending/descending)
- ✅ Hover interactions with eye icon
- ✅ Clickable rows to open detail panel
- ✅ Alternating row colors
- ✅ Sticky column headers
- ✅ Loading states and empty states

### Detail Panel
- ✅ Modular sections (General Info, Classification, Notes, etc.)
- ✅ Inline editable fields
- ✅ Choice lists for single-select fields
- ✅ Text and textarea inputs
- ✅ Read-only fields
- ✅ Save/Cancel functionality
- ✅ Delete action with confirmation
- ✅ Smooth slide-in/out animation

### API Integration
- ✅ Abstracted API client interface
- ✅ Works with Airtable now
- ✅ Can switch to PostgreSQL later without UI changes
- ✅ Supports pagination, filtering, sorting, search
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Bulk import/export (optional)

## Usage

### Basic Setup

1. **Create a configuration file:**

```tsx
// src/components/templates/configs/myEntityConfig.tsx
import { ListDetailTemplateConfig } from '../types'

export const myEntityConfig: ListDetailTemplateConfig<MyEntity> = {
  entityName: 'MyEntity',
  entityNamePlural: 'MyEntities',
  columns: [...],
  fields: [...],
  filters: [...],
  panel: {...},
  apiClient: myApiClient,
}
```

2. **Use in your page:**

```tsx
// src/app/my-entities/page.tsx
import ListDetailTemplate from '@/components/templates/ListDetailTemplate'
import { myEntityConfig } from '@/components/templates/configs/myEntityConfig'

export default function MyEntitiesPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1">
        <ListDetailTemplate config={myEntityConfig} />
      </div>
    </div>
  )
}
```

### Configuration Options

#### Columns

```tsx
columns: [
  {
    key: 'fieldName',
    label: 'Display Name',
    sortable: true,
    filterable: true,
    align: 'left' | 'center' | 'right',
    width: 'w-32',
    render: (value, record) => <CustomComponent />
  }
]
```

#### Fields

```tsx
fields: [
  {
    key: 'fieldName',
    label: 'Field Label',
    type: 'text' | 'textarea' | 'choiceList' | 'readonly',
    editable: true,
    required: true,
    options: ['Option1', 'Option2'] | async () => await fetchOptions(),
    section: 'sectionId',
    validate: (value) => value ? null : 'Required',
  }
]
```

#### Filters

```tsx
filters: [
  {
    key: 'fieldName',
    label: 'Filter Label',
    type: 'select' | 'multiselect',
    options: ['Option1', 'Option2'] | async () => await fetchOptions(),
    placeholder: 'All Options',
  }
]
```

#### Panel Sections

```tsx
panel: {
  titleKey: 'companyName', // Field to display as panel title
  sections: [
    {
      id: 'general',
      title: 'General Information',
      fields: ['field1', 'field2', 'field3'],
    }
  ],
  actions: {
    delete: {
      label: 'Delete',
      confirmMessage: 'Are you sure?',
    }
  }
}
```

#### API Client

```tsx
const apiClient: ApiClient<MyEntity> = {
  getPaginated: async (params) => {
    // Return { data: MyEntity[], pagination: {...} }
  },
  getById: async (id) => {
    // Return MyEntity
  },
  create: async (data) => {
    // Return created MyEntity
  },
  update: async (id, data) => {
    // Return updated MyEntity
  },
  delete: async (id) => {
    // Delete entity
  },
  getFilterValues: async (field, limit) => {
    // Return string[] of distinct values
  },
  bulkImport: async (items) => {
    // Return { success: number, failed: number, errors: string[] }
  },
}
```

## Migration from Existing Pages

To migrate an existing table page to use the template:

1. **Analyze current page:**
   - Identify columns, fields, filters
   - Map API endpoints
   - Note any custom logic

2. **Create configuration:**
   - Copy `companyConfig.tsx` as a starting point
   - Adapt columns, fields, filters to your entity
   - Create or adapt API client

3. **Replace page component:**
   - Replace existing page with `ListDetailTemplate`
   - Test all functionality
   - Verify styling matches

4. **Clean up:**
   - Remove old components if no longer needed
   - Update imports
   - Remove unused state management

## Benefits

1. **Consistency**: All tables have the same look, feel, and behavior
2. **Maintainability**: Changes to template affect all tables
3. **Speed**: New tables can be created in minutes with just configuration
4. **Type Safety**: Full TypeScript support with generics
5. **Flexibility**: Custom rendering, validation, and actions supported
6. **API Abstraction**: Easy to switch data sources (Airtable → PostgreSQL)

## Future Enhancements

- [ ] Multi-select filters
- [ ] Advanced filtering (date ranges, numeric ranges)
- [ ] Bulk actions (select multiple rows)
- [ ] Export to CSV/Excel
- [ ] Saved filter sets
- [ ] Column visibility toggles
- [ ] Custom field types (date picker, number input)
- [ ] Inline editing in table cells
- [ ] Drag-and-drop column reordering
- [ ] User-specific preferences (column widths, sort order)

## Examples

See:
- `src/components/templates/configs/companyConfig.tsx` - Full Company configuration
- `src/app/spaces/system-config/companies/page-template.tsx` - Example page using template
- `src/components/templates/configs/userConfig.example.tsx` - Example User configuration

## Documentation

- Main README: `src/components/templates/README.md`
- Type definitions: `src/components/templates/types.ts`
- Template implementation: `src/components/templates/ListDetailTemplate.tsx`








