# Testing Table Display Optimizations

## Test Checklist

### 1. Skeleton Loader Test
- [ ] Navigate to any table (Companies, Geography, EF GWP, GHG Types, Emission Factor Version)
- [ ] **Expected**: Skeleton loader appears immediately on initial load (before 600ms)
- [ ] **Expected**: Progress bar appears only if loading takes longer than 600ms
- [ ] **Expected**: Skeleton shows correct number of rows (matching page size) and columns

### 2. Debounced Search Test
- [ ] Navigate to any table
- [ ] Type quickly in the search box (multiple characters rapidly)
- [ ] **Expected**: Search query updates in UI immediately
- [ ] **Expected**: API call is debounced (only fires after 300ms of no typing)
- [ ] **Expected**: Network tab shows reduced number of API calls compared to before

### 3. Debounced Filter Test
- [ ] Navigate to any table with filters (e.g., Companies, Geography)
- [ ] Change filter values rapidly (multiple changes in quick succession)
- [ ] **Expected**: Filter UI updates immediately
- [ ] **Expected**: API call is debounced (only fires after 200ms of no filter changes)
- [ ] **Expected**: Network tab shows reduced number of API calls

### 4. OptimizedTableCell Performance Test
- [ ] Open browser DevTools → React DevTools → Profiler
- [ ] Navigate to a table with data
- [ ] Start profiling
- [ ] Change a filter or search query
- [ ] Stop profiling
- [ ] **Expected**: Only cells with changed data re-render
- [ ] **Expected**: Cells with unchanged data do NOT re-render (memoization working)

### 5. Loading State Test
- [ ] Navigate to a table
- [ ] **Expected**: If data loads quickly (< 600ms), no progress bar appears
- [ ] **Expected**: If data loads slowly (> 600ms), progress bar appears
- [ ] **Expected**: Skeleton loader shows during initial load (< 600ms)

### 6. Performance Metrics Test
- [ ] Open browser DevTools → Performance tab
- [ ] Record performance while:
  - Loading a table
  - Changing filters
  - Changing search query
  - Sorting columns
- [ ] **Expected**: 
  - Initial load: < 500ms
  - Filter/Sort response: < 200ms visual feedback
  - Smooth scrolling (60 FPS)

### 7. Memory Test
- [ ] Open browser DevTools → Memory tab
- [ ] Navigate to a table with 100+ rows
- [ ] Take heap snapshot
- [ ] Scroll through the table
- [ ] Change filters/search multiple times
- [ ] Take another heap snapshot
- [ ] **Expected**: Memory usage remains stable (no memory leaks)

### 8. Cross-Table Consistency Test
- [ ] Test all tables:
  - Companies
  - Geography
  - EF GWP
  - GHG Types
  - Emission Factor Version
- [ ] **Expected**: All tables show skeleton loader on initial load
- [ ] **Expected**: All tables have debounced search (300ms)
- [ ] **Expected**: All tables have debounced filters (200ms)
- [ ] **Expected**: All tables use OptimizedTableCell (check React DevTools)

## Test Results Template

```
Date: [Date]
Tester: [Name]
Browser: [Browser + Version]

### Skeleton Loader
- Status: ✅ Pass / ❌ Fail
- Notes: [Any observations]

### Debounced Search
- Status: ✅ Pass / ❌ Fail
- API Calls Observed: [Number]
- Notes: [Any observations]

### Debounced Filters
- Status: ✅ Pass / ❌ Fail
- API Calls Observed: [Number]
- Notes: [Any observations]

### OptimizedTableCell
- Status: ✅ Pass / ❌ Fail
- Re-renders Observed: [Number]
- Notes: [Any observations]

### Performance Metrics
- Initial Load: [Time]ms
- Filter Response: [Time]ms
- Search Response: [Time]ms
- Scroll FPS: [FPS]
- Memory Usage: [MB]

### Issues Found
- [List any issues]
```

## Quick Test Commands

### Check if optimizations are loaded
Open browser console and check:
```javascript
// Check if OptimizedTableCell is being used
document.querySelectorAll('[data-optimized-cell]').length

// Check debounce timing
// Search: Should see delay of ~300ms between typing and API call
// Filters: Should see delay of ~200ms between filter change and API call
```

### Performance Profiling
1. Open React DevTools
2. Go to Profiler tab
3. Click "Record"
4. Interact with table (search, filter, sort)
5. Click "Stop"
6. Review which components re-rendered
7. **Expected**: Only OptimizedTableCell components with changed data should re-render

## Known Issues / Limitations

- Skeleton loader shows approximate number of columns (may not match exactly)
- Debounce timing may vary slightly based on browser performance
- OptimizedTableCell memoization works best when item IDs are stable

