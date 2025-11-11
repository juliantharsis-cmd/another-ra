# Table Generator Script

This script automatically generates all necessary files for a new table based on an Airtable table name, following the same pattern as the GHG Type table.

## Usage

```bash
npm run generate-table "Table Name"
```

Or directly:

```bash
node scripts/generate-table.mjs "Table Name"
```

## Options

- `--route <path>` - Custom route path (default: auto-generated from table name)
- `--menu <parent>` - Parent menu item (default: "Emission management")
- `--feature-flag <name>` - Feature flag name (default: auto-generated)
- `--no-feature-flag` - Don't add feature flag
- `--api-route <path>` - Custom API route (default: auto-generated)

## Examples

### Basic usage
```bash
npm run generate-table "Activity Type"
```

This will generate:
- Backend: Types, Service, Repository, Controller, Routes
- Frontend: API Client, Config, Page, Layout
- Updates: Server index.ts, Feature flags, Sidebar

### With custom options
```bash
npm run generate-table "Activity Type" --route "activity-types" --menu "System Configuration"
```

## Generated Files

### Backend (`server/src/`)
- `types/{PascalCase}.ts` - TypeScript interfaces
- `services/{PascalCase}AirtableService.ts` - Airtable service
- `data/{PascalCase}Repository.ts` - Repository layer
- `controllers/{PascalCase}Controller.ts` - Express controller
- `routes/{camelCase}Routes.ts` - Express routes

### Frontend (`src/`)
- `lib/api/{camelCase}.ts` - API client
- `components/templates/configs/{camelCase}Config.tsx` - Table configuration
- `app/spaces/emission-management/{kebab-case}/page.tsx` - Page component
- `app/spaces/emission-management/{kebab-case}/layout.tsx` - Layout component

### Updated Files
- `server/src/index.ts` - Adds route registration
- `src/lib/featureFlags.ts` - Adds feature flag
- `src/components/Sidebar.tsx` - Adds menu item

## Next Steps After Generation

1. **Update field mappings** in the service file based on your Airtable schema
2. **Update the types file** with actual field names from your Airtable table
3. **Update the config file** to match your table columns and fields
4. **Set environment variable** for the Airtable table name:
   ```
   AIRTABLE_{SNAKE_CASE}_TABLE_NAME=Your Table Name
   ```
5. **Test the API endpoints**
6. **Restart both servers**

## Feature Flag

To enable the feature in production, set:
```
NEXT_PUBLIC_FEATURE_{SNAKE_CASE}=true
```

The feature flag is enabled by default in development mode.

