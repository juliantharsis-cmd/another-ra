# PRD: Filter Optimization Strategy

## Problem Statement

When filtering by linked record fields (Company, User Roles, Modules), users can select values that don't exist in the user table, causing:
- Infinite loading times
- Poor performance
- Confusing user experience

## Solution: Reduced List with Validation

### Approach: Show Only Relevant Options

**Display only companies/user roles/modules that are actually used in the user table.**

### Rationale

#### Performance Comparison

| Approach | Dropdown Size | Load Time | Data Transfer | User Experience |
|----------|--------------|-----------|---------------|----------------|
| **Reduced List (Option A)** | 50-200 items | Fast (<1s) | Minimal | Excellent - only relevant options |
| **Full List (Option B)** | 15,000+ items | Slow (5-10s) | Large | Poor - too many irrelevant options |

#### Why Option A is Better

1. **Performance**
   - 300x smaller dropdown (50 vs 15,000 companies)
   - Faster initial load
   - Less memory usage
   - Better caching efficiency

2. **User Experience**
   - Users only see relevant options
   - Less confusion
   - Faster selection
   - Better mobile experience

3. **Edge Case Handling**
   - If a company has no users, it shouldn't appear in the filter (why filter by it?)
   - Validation prevents fetching records for non-existent matches
   - Immediate empty result response

### Implementation

#### 1. Filter Options Generation
- Fetch unique record IDs from user table
- Resolve IDs to names
- Return in "Name|ID" format
- Cache results for 5 minutes

#### 2. Filter Validation
- When filter is applied, validate against available options
- If selected value not in list → return empty immediately
- Prevents unnecessary record fetching

#### 3. In-Memory Filtering
- Fetch records (5x limit for linked record filters)
- Filter in memory by matching record IDs
- More reliable than Airtable ARRAYJOIN formulas

### Technical Details

#### Cache Strategy
- Cache key: `linked_{fieldName}_{limit}`
- TTL: 5 minutes
- Shared across requests for same field

#### Validation Flow
```
User selects filter value
  ↓
Check cache for available values
  ↓
Validate selected value is in available list
  ↓
If not → Return empty immediately (no fetch)
  ↓
If yes → Proceed with in-memory filtering
```

### Performance Metrics

**Before Optimization:**
- Filter dropdown: 15,000 companies
- Load time: 5-10 seconds
- Filter application: Timeout or fails

**After Optimization:**
- Filter dropdown: 50-200 companies (only used ones)
- Load time: <1 second (cached)
- Filter application: <2 seconds (in-memory)

### Edge Cases Handled

1. **Company with no users**
   - Doesn't appear in dropdown
   - If somehow selected → immediate empty result

2. **Stale cache**
   - Cache refreshes every 5 minutes
   - New companies appear after cache refresh

3. **Large datasets**
   - Limits to 10,000 filter values
   - Pagination for very large lists

### Future Enhancements

1. **Search in filter dropdown**
   - For very large reduced lists (>100 items)
   - Type-ahead search

2. **Multi-select optimization**
   - Batch validation
   - Parallel filtering

3. **Real-time updates**
   - WebSocket for cache invalidation
   - Immediate updates when new companies added

## Conclusion

**Option A (Reduced List) is the clear winner** for:
- Performance (300x improvement)
- User experience (only relevant options)
- Reliability (validation prevents edge cases)
- Scalability (works with large datasets)

The validation check ensures that even if an invalid value is selected, the system responds immediately with empty results rather than timing out.

