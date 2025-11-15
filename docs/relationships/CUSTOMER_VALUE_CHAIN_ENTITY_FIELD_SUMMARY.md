# Customer Value Chain Entity Field - Quick Reference

## Current Flow (Simplified)

```
┌─────────────────┐
│   Airtable      │
│   Record        │
│   [rec1, rec2]  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Backend Service                    │
│  1. Extract IDs                     │
│  2. Deduplicate                     │
│  3. Resolve to Names                │
│  4. Create Map: {rec1: "Name1"}     │
│  5. Return:                         │
│     - IDs: [rec1, rec2]              │
│     - Names: ["Name1", "Name2"]     │
│     - Map: {rec1: "Name1", ...}     │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Frontend Component                 │
│  1. Receive record with map         │
│  2. Populate cache from map         │
│  3. Load options from API           │
│  4. Merge: Backend map FIRST        │
│  5. Display in choiceList          │
└─────────────────────────────────────┘
```

## Key Components

### Backend
- **Service**: `CustomerValueChainAirtableService.ts`
- **Resolver**: `RelationshipResolver.ts`
- **Field**: `Entities Value Chain` (array of IDs)
- **Map Field**: `_Entities Value Chain Name Map` (ID→name mapping)
- **Name Field**: `Entities Value Chain Name` (array of names)

### Frontend
- **Component**: `DetailPanelContent.tsx`
- **Config**: `customerValueChainConfig.tsx`
- **Cache**: `selectedOptionsCache` (useRef)
- **Special Handling**: Order preservation logic (lines 1141-1215)

## Current Issues

1. **Duplicates**: Same ID appears multiple times
2. **Order**: Backend order lost in frontend
3. **Resolution**: Some IDs show "NOT FOUND"
4. **Cache**: Stale data persists
5. **Map**: May not serialize correctly

## Quick Fixes (Priority Order)

### Critical (Do First)
1. **Enforce ID Uniqueness** - Add deduplication everywhere
2. **Verify Map Serialization** - Ensure map reaches frontend
3. **Simplify Order Logic** - Reduce complexity in frontend

### Important (Do Next)
4. **Cache Invalidation** - Clear cache on record change
5. **Error Handling** - Retry failed resolutions
6. **ID Normalization** - Consistent format everywhere

### Nice to Have (Do Last)
7. **Resolution Batching** - Optimize performance
8. **Monitoring** - Add metrics and alerts
9. **Testing** - Comprehensive test coverage

## Implementation Checklist

### Backend
- [ ] Add deduplication helper
- [ ] Apply deduplication in create/update/map
- [ ] Add retry logic for resolution
- [ ] Verify map serialization
- [ ] Add resolution verification

### Frontend
- [ ] Simplify order preservation
- [ ] Add cache invalidation
- [ ] Improve map validation
- [ ] Add ID normalization
- [ ] Improve error handling

## Testing Checklist

- [ ] Create record with duplicates → Verify deduplication
- [ ] Update record → Verify order preserved
- [ ] Test with invalid IDs → Verify placeholders
- [ ] Test cache invalidation → Verify fresh data
- [ ] Test map serialization → Verify map in response

## Key Code Locations

| Task | File | Lines |
|------|------|-------|
| Backend Deduplication | `CustomerValueChainAirtableService.ts` | 232, 660 |
| Resolution | `CustomerValueChainAirtableService.ts` | 811-1152 |
| Order Preservation | `DetailPanelContent.tsx` | 1141-1215 |
| Cache Management | `DetailPanelContent.tsx` | 483, 574-600 |
| Map Validation | `DetailPanelContent.tsx` | 1045 |

## Success Metrics

- ✅ No duplicate IDs in arrays
- ✅ Order matches backend
- ✅ >95% resolution success rate
- ✅ Cache synchronized
- ✅ Map always serialized
- ✅ <2s resolution time for 100 IDs

