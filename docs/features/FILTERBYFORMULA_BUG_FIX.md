# filterByFormula Bug Fix

## Issue

**Error:** `Airtable: invalid parameters for 'select': the value for 'filterByFormula' should be a string`

**Root Cause:** When `formula` is an empty string `''`, the code `formula || undefined` evaluates to `undefined`, and Airtable doesn't accept `undefined` for `filterByFormula`. It must be either a string or omitted entirely.

## Fix Applied

Changed from:
```typescript
const selectOptions: Airtable.SelectOptions<any> = {
  filterByFormula: formula || undefined,  // ❌ Wrong: undefined is not allowed
}
```

To:
```typescript
const selectOptions: Airtable.SelectOptions<any> = {}
if (formula) {
  selectOptions.filterByFormula = formula  // ✅ Correct: only add if truthy
}
```

## Files Fixed

All 9 services were updated:
1. ✅ `ScopeAirtableService.ts`
2. ✅ `NormalizedActivityAirtableService.ts`
3. ✅ `EFDetailedGAirtableService.ts`
4. ✅ `ScopeCategorisationAirtableService.ts`
5. ✅ `UnitAirtableService.ts`
6. ✅ `UnitConversionAirtableService.ts`
7. ✅ `StandardECMCatalogAirtableService.ts`
8. ✅ `StandardECMClassificationAirtableService.ts`
9. ✅ `StandardEmissionFactorAirtableService.ts`

## Pattern to Follow

**Always check if formula is truthy before adding to selectOptions:**

```typescript
const selectOptions: Airtable.SelectOptions<any> = {}
if (formula) {
  selectOptions.filterByFormula = formula
}
// ... add other options
```

**For count queries:**
```typescript
const countSelectOptions: Airtable.SelectOptions<any> = {
  fields: ['Name'],
}
if (formula) {
  countSelectOptions.filterByFormula = formula
}
```

## Prevention Strategy

Add this to the bulk table creation checklist:
- [ ] Never use `filterByFormula: formula || undefined`
- [ ] Always conditionally add `filterByFormula` only if `formula` is truthy
- [ ] Apply same pattern to count queries

---

**Status:** ✅ Fixed in all 9 services

