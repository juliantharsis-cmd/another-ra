# ListDetailTemplate Verification Checklist

Use this checklist to verify that all tables are properly using the templated framework.

## ✅ Tables Using ListDetailTemplate

### System Configuration
- [x] **Companies** - `/spaces/system-config/companies` - Uses `companyConfig`
- [x] **Geography** - `/spaces/system-config/geography` - Uses `geographyConfig`

### Emission Management
- [x] **Emission Factor GWP** - `/spaces/emission-management/emission-factors` - Uses `efGwpConfig`
- [x] **GHG Types** - `/spaces/emission-management/ghg-types` - Uses `ghgTypeConfig`
- [x] **Emission Factor Version** - `/spaces/emission-management/emission-factor-version` - Uses `emissionFactorVersionConfig`

## ✅ Features Verification

### User Preferences Integration
- [x] All tables use `useUserPreferences()` hook
- [x] Default page size comes from user preferences
- [x] Per-table overrides supported
- [x] Reset icon appears when override exists
- [x] Reset icon removes override and uses user default

### Pagination
- [x] Page size selector present
- [x] Reset icon next to page size selector
- [x] Page navigation (Previous/Next)
- [x] Page number display
- [x] Total count display

### Table Header Actions
- [x] Import button (when `feature.tableActionsV2` enabled)
- [x] Export button (when `feature.tableActionsV2` enabled)
- [x] Configure Table button (when `feature.tableActionsV2` enabled)
- [x] Unified action menu (breadcrumb style)

### Detail Panel
- [x] Right-side panel (520px/32rem width)
- [x] Eye icon on hover (first column)
- [x] Panel sections organized consistently
- [x] Inline editing enabled
- [x] Save/Cancel buttons

### Column Management
- [x] Column visibility toggle
- [x] Column ordering (drag-and-drop)
- [x] Column resizing (when `feature.columnResizeV2` enabled)
- [x] Auto-alignment based on data type

### Search & Filtering
- [x] Global search input
- [x] Field-specific filters
- [x] Filter persistence
- [x] Clear filters button

### Sorting
- [x] Column header sorting
- [x] Sort indicators (arrows)
- [x] Default sort applied
- [x] Sort direction toggle

## Configuration Files

### All Configs Should Have:
- [x] `entityName` and `entityNamePlural` defined
- [x] `defaultSort` configured
- [x] `pageSizeOptions` defined (no hardcoded `defaultPageSize`)
- [x] `columns` array with proper column definitions
- [x] `fields` array for detail panel
- [x] `filters` array (if applicable)
- [x] `panel` configuration
- [x] `apiClient` adapter

## Page Structure

### All Pages Should Have:
- [x] `'use client'` directive
- [x] `Sidebar` component
- [x] `useSidebar()` hook
- [x] Standard layout structure
- [x] `ListDetailTemplate` with config

## Testing Checklist

### For Each Table:
1. [ ] Page loads without errors
2. [ ] User preferences page size is applied
3. [ ] Reset icon appears when page size differs from default
4. [ ] Reset icon works (resets to user default)
5. [ ] Per-table override persists after page reload
6. [ ] Detail panel opens on row click
7. [ ] Eye icon appears on hover
8. [ ] Search works
9. [ ] Filters work
10. [ ] Sorting works
11. [ ] Pagination works
12. [ ] Import/Export/Configure buttons work (if enabled)

## Common Issues

### Issue: Reset icon not appearing
**Solution**: Check if `pageSize !== userDefaultPageSize`. Icon only shows when there's an override.

### Issue: User preferences not loading
**Solution**: 
- Check browser console for API errors
- Verify backend server is running
- Check `useUserPreferences` hook implementation

### Issue: Features not consistent across tables
**Solution**: 
- Verify all tables use `ListDetailTemplate`
- Check configuration files for missing properties
- Ensure no custom table components are being used

### Issue: Page size not respecting user preference
**Solution**:
- Verify `useUserPreferences` is called in `ListDetailTemplate`
- Check `getPageSize()` function is working
- Verify localStorage is accessible

## Migration Status

### ✅ Fully Migrated (Using ListDetailTemplate)
- Companies (via `companyConfig`)
- Geography (via `geographyConfig`)
- Emission Factor GWP (via `efGwpConfig`)
- GHG Types (via `ghgTypeConfig`)
- Emission Factor Version (via `emissionFactorVersionConfig`)

### ⚠️ Legacy Components (Still in Use)
- `CompanyTable` - Used in `/spaces/system-config/companies/page.tsx`
  - **Note**: This is a legacy component. Consider migrating to use `ListDetailTemplate` directly.

## Next Steps

1. **Verify all tables** are using `ListDetailTemplate`
2. **Test user preferences** integration on all tables
3. **Verify reset icon** appears and works on all tables
4. **Consider migrating** `CompanyTable` to use `ListDetailTemplate` directly
5. **Document** any table-specific customizations

