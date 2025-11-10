# ListDetailTemplate

A reusable template component for creating list/detail views with consistent styling and behavior across the platform.

## Overview

The `ListDetailTemplate` provides a standardized experience for displaying and editing entities in a table format with a sliding detail panel. It includes:

- **List View**: Table with pagination, filtering, sorting, and search
- **Detail Panel**: Modular sections with inline editing
- **API Integration**: Abstracted API client interface
- **Consistent Styling**: Schneider Electric-inspired design (grey shades + green accents)

## Usage

### Basic Example

```tsx
import ListDetailTemplate from '@/components/templates/ListDetailTemplate'
import { companyConfig } from '@/components/templates/configs/companyConfig'

export default function CompaniesPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1">
        <ListDetailTemplate config={companyConfig} />
      </div>
    </div>
  )
}
```

### Configuration Structure

A configuration object defines how the template should behave:

```tsx
const config: ListDetailTemplateConfig<YourEntity> = {
  entityName: 'Company',
  entityNamePlural: 'Companies',
  columns: [...],      // Table columns
  fields: [...],        // Detail panel fields
  filters: [...],       // Filter options
  panel: {...},         // Panel sections
  apiClient: {...},     // API client instance
}
```

## Configuration Options

### Columns

Define table columns with sorting, filtering, and custom rendering:

```tsx
columns: [
  {
    key: 'companyName',
    label: 'Company Name',
    sortable: true,
    align: 'left',
    render: (value, record) => <CustomCell value={value} />
  }
]
```

### Fields

Define detail panel fields with types and validation:

```tsx
fields: [
  {
    key: 'status',
    label: 'Status',
    type: 'choiceList',
    editable: true,
    options: async () => await fetchOptions(),
    section: 'general'
  }
]
```

### Filters

Define filterable fields:

```tsx
filters: [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: async () => await fetchStatusOptions(),
    placeholder: 'All Statuses'
  }
]
```

### API Client

Implement the `ApiClient` interface:

```tsx
const apiClient: ApiClient<YourEntity> = {
  getPaginated: async (params) => { ... },
  getById: async (id) => { ... },
  create: async (data) => { ... },
  update: async (id, data) => { ... },
  delete: async (id) => { ... },
  getFilterValues: async (field, limit) => { ... },
  bulkImport: async (items) => { ... },
}
```

## Field Types

- `text`: Single-line text input
- `textarea`: Multi-line text input
- `select`: Dropdown select (not yet implemented in template)
- `choiceList`: Inline expandable choice list
- `readonly`: Read-only display
- `date`: Date picker (not yet implemented)
- `number`: Number input (not yet implemented)

## Examples

See the following configuration examples:

- `configs/companyConfig.tsx` - Full Company table configuration
- `configs/userConfig.example.tsx` - Example User table configuration

## Customization

### Custom Header Actions

```tsx
config.headerActions = (
  <button onClick={handleCustomAction}>
    Custom Action
  </button>
)
```

### Custom Empty State

```tsx
config.emptyStateMessage = "No companies found. Create one to get started!"
```

### Custom Loading Message

```tsx
config.loadingMessage = "Loading companies..."
```

## API Abstraction

The template uses an abstracted API client interface, allowing you to:

1. Use Airtable now (via `companiesApi`)
2. Switch to PostgreSQL later without changing the UI
3. Use mock data for development/testing

The API client handles:
- Pagination
- Filtering
- Sorting
- Search
- CRUD operations
- Bulk operations (import/export)

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

## Migration Guide

To migrate an existing table to use the template:

1. Create a configuration file (see `companyConfig.tsx` for reference)
2. Implement or adapt an API client that matches the `ApiClient` interface
3. Replace your existing page component with `ListDetailTemplate`
4. Test all functionality (CRUD, filters, sorting, pagination)

## Support

For questions or issues, refer to:
- Type definitions: `types.ts`
- Example configurations: `configs/`
- Template implementation: `ListDetailTemplate.tsx`








