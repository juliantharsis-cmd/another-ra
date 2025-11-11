# Batch Table Implementation Status

## Progress Summary

### ✅ Completed
1. **Types** - All 8 tables have TypeScript interfaces created
2. **Normalized Activities** - Service, Controller, Routes created
3. **EF/Detailed G** - Service, Controller, Routes created
4. **Standard Emission Factors** - Complete implementation (template)

### ⏳ Remaining (6 tables)
- Scope
- scope & categorisation  
- Unit
- Unit Conversion
- Standard ECM catalog
- Standard ECM Classification

## Implementation Pattern

Each table follows this structure:

### Backend Files
1. `server/src/types/{PascalCase}.ts` - TypeScript interfaces
2. `server/src/services/{PascalCase}AirtableService.ts` - Airtable service with relationship resolution
3. `server/src/controllers/{PascalCase}Controller.ts` - Express controller
4. `server/src/routes/{camelCase}Routes.ts` - Express routes
5. Register in `server/src/index.ts`

### Frontend Files
1. `src/lib/api/{camelCase}.ts` - API client
2. `src/components/templates/configs/{camelCase}Config.tsx` - ListDetailTemplate config
3. `src/app/spaces/emission-management/{kebab-case}/page.tsx` - Page component
4. `src/app/spaces/emission-management/{kebab-case}/layout.tsx` - Layout component
5. Add to `src/components/Sidebar.tsx`

## Relationship Handling

Tables with relationships need:
- RelationshipResolver in service
- Promise.all for parallel resolution
- Name fields in interface (e.g., `EF GWP Name`)
- Display in frontend config columns

## Next Steps

Continue creating remaining service files, controllers, routes, and frontend files following the established pattern.

