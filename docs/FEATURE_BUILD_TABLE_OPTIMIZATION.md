# FeatureBuild: Table Display Optimization

[FeatureBuild] You are a **senior full-stack engineer**. Implement a **Table Display Optimization** system that improves performance, rendering speed, and user experience across all existing tables in Another RA, with **performance-first architecture** and **scalable rendering strategies**.

# Goals

1) **Performance Optimization** - Improve rendering and data handling performance
   - Implement virtual scrolling for large datasets (1000+ rows)
   - Add memoization for expensive computations (filtering, sorting, column rendering)
   - Optimize re-renders using React.memo, useMemo, and useCallback
   - Implement debounced/throttled operations for search and filtering
   - Add request batching and caching strategies

2) **Data Fetching Optimization** - Optimize API calls and data management
   - Implement intelligent pagination (prefetch next page)
   - Add data caching layer (React Query or SWR pattern)
   - Implement optimistic updates for better perceived performance
   - Add request deduplication to prevent duplicate API calls
   - Implement stale-while-revalidate pattern for background updates

3) **Rendering Optimization** - Optimize component rendering and layout
   - Lazy load detail panels and modals
   - Implement code splitting for table components
   - Optimize column rendering with cell-level memoization
   - Add skeleton loaders for better perceived performance
   - Implement progressive rendering for large tables

4) **Memory Management** - Reduce memory footprint and improve efficiency
   - Clean up unused data and event listeners
   - Implement proper cleanup in useEffect hooks
   - Add memory-efficient data structures for large datasets
   - Optimize image/attachment rendering (lazy loading, thumbnails)

5) **User Experience Enhancements** - Improve perceived performance and responsiveness
   - Maintain smooth scrolling performance
   - Add loading states that don't block interaction
   - Implement optimistic UI updates
   - Add smooth transitions and animations
   - Ensure responsive behavior on all screen sizes

# Technical Specifications

## Performance Metrics Targets

- **Initial Load Time**: < 500ms for first render
- **Filter/Sort Response**: < 200ms visual feedback
- **Scroll Performance**: 60 FPS on datasets up to 10,000 rows
- **Memory Usage**: < 50MB for 1000 rows
- **API Request Reduction**: 40% reduction through caching

## Architecture Changes

### 1. Virtual Scrolling Implementation

```typescript
// Use react-window or react-virtualized for large datasets
interface VirtualScrollConfig {
  itemHeight: number | ((index: number) => number)
  overscan: number // Items to render outside viewport
  threshold: number // Switch to virtual scrolling at this row count
}
```

**Threshold**: Enable virtual scrolling when `items.length > 100`

### 2. Data Caching Strategy

```typescript
interface CacheConfig {
  staleTime: number // 5 minutes
  cacheTime: number // 10 minutes
  refetchOnWindowFocus: boolean // false
  refetchOnReconnect: boolean // true
}
```

### 3. Memoization Strategy

- **Column definitions**: Memoize with `useMemo` (dependencies: columns, columnVisibility)
- **Filtered/sorted data**: Memoize with `useMemo` (dependencies: items, filters, sortBy, sortOrder)
- **Cell renderers**: Wrap with `React.memo` for expensive renders
- **Event handlers**: Use `useCallback` for all handlers passed to child components

### 4. Request Optimization

```typescript
interface RequestConfig {
  debounceSearch: number // 300ms
  debounceFilter: number // 200ms
  batchSize: number // 50 items per request
  prefetchNextPage: boolean // true
  maxConcurrentRequests: number // 3
}
```

## Component Optimizations

### ListDetailTemplate Optimizations

1. **Split rendering logic**:
   - Separate table header component (memoized)
   - Separate table body component (virtualized for large datasets)
   - Separate pagination component (memoized)

2. **Conditional rendering**:
   - Only render visible columns
   - Lazy load filter options
   - Defer non-critical UI elements

3. **State management**:
   - Use reducer for complex state updates
   - Minimize state updates that trigger re-renders
   - Batch state updates when possible

### Column Rendering Optimization

```typescript
// Memoized cell renderer
const MemoizedCell = React.memo(({ value, column, item }) => {
  return column.render ? column.render(value, item) : <span>{value}</span>
}, (prevProps, nextProps) => {
  // Custom comparison for performance
  return prevProps.value === nextProps.value && 
         prevProps.item.id === nextProps.item.id
})
```

### Filter/Search Optimization

- Debounce search input (300ms)
- Debounce filter changes (200ms)
- Cache filter options
- Lazy load filter dropdowns

# Implementation

## Phase 1: Core Performance Optimizations

### Step 1: Add Memoization to ListDetailTemplate

```typescript
// In ListDetailTemplate.tsx

// Memoize filtered and sorted data
const filteredAndSortedItems = useMemo(() => {
  let result = [...items]
  
  // Apply filters
  if (searchQuery) {
    result = result.filter(item => 
      // Search logic
    )
  }
  
  // Apply sorting
  if (sortBy) {
    result = sortItems(result, sortBy, sortOrder)
  }
  
  return result
}, [items, searchQuery, activeFilters, sortBy, sortOrder])

// Memoize column definitions
const visibleColumns = useMemo(() => {
  return configuredColumns.filter(col => 
    columnVisibility[col.key] !== false
  )
}, [configuredColumns, columnVisibility])

// Memoize event handlers
const handleSearchChange = useCallback((query: string) => {
  setSearchQuery(query)
}, [])

const handleFilterChange = useCallback((key: string, value: string) => {
  setActiveFilters(prev => ({ ...prev, [key]: value }))
}, [])
```

### Step 2: Implement Virtual Scrolling

```typescript
// Install: npm install react-window @types/react-window

import { FixedSizeList } from 'react-window'

// In ListDetailTemplate.tsx
{items.length > 100 ? (
  <FixedSizeList
    height={600}
    itemCount={filteredAndSortedItems.length}
    itemSize={50}
    width="100%"
  >
    {({ index, style }) => (
      <div style={style}>
        <TableRow item={filteredAndSortedItems[index]} />
      </div>
    )}
  </FixedSizeList>
) : (
  // Regular table rendering
)}
```

### Step 3: Add Data Caching

```typescript
// Create hooks/useTableData.ts
import { useState, useEffect, useRef } from 'react'

interface CacheEntry<T> {
  data: T[]
  timestamp: number
  key: string
}

export function useTableDataCache<T>(
  fetchFn: () => Promise<T[]>,
  cacheKey: string,
  staleTime: number = 5 * 60 * 1000 // 5 minutes
) {
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map())
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const cached = cacheRef.current.get(cacheKey)
    const now = Date.now()
    
    if (cached && (now - cached.timestamp) < staleTime) {
      // Use cached data
      setData(cached.data)
      setIsLoading(false)
      
      // Refresh in background
      fetchFn().then(newData => {
        cacheRef.current.set(cacheKey, {
          data: newData,
          timestamp: now,
          key: cacheKey
        })
        setData(newData)
      })
    } else {
      // Fetch fresh data
      setIsLoading(true)
      fetchFn().then(newData => {
        cacheRef.current.set(cacheKey, {
          data: newData,
          timestamp: now,
          key: cacheKey
        })
        setData(newData)
        setIsLoading(false)
      })
    }
  }, [cacheKey, fetchFn, staleTime])
  
  return { data, isLoading }
}
```

### Step 4: Optimize Cell Rendering

```typescript
// Create components/tables/OptimizedTableCell.tsx
import React from 'react'

interface OptimizedTableCellProps {
  value: any
  column: ColumnConfig
  item: any
}

export const OptimizedTableCell = React.memo<OptimizedTableCellProps>(
  ({ value, column, item }) => {
    if (column.render) {
      return column.render(value, item)
    }
    return <span className="text-sm text-neutral-700">{value || '—'}</span>
  },
  (prevProps, nextProps) => {
    // Only re-render if value or item ID changed
    return (
      prevProps.value === nextProps.value &&
      prevProps.item.id === nextProps.item.id &&
      prevProps.column.key === nextProps.column.key
    )
  }
)
```

## Phase 2: Advanced Optimizations

### Step 5: Implement Request Batching

```typescript
// Create utils/requestBatcher.ts
class RequestBatcher {
  private queue: Array<() => Promise<any>> = []
  private batchSize: number = 10
  private timeout: number = 100
  
  add(request: () => Promise<any>) {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      
      if (this.queue.length >= this.batchSize) {
        this.flush()
      } else {
        setTimeout(() => this.flush(), this.timeout)
      }
    })
  }
  
  private async flush() {
    const batch = this.queue.splice(0, this.batchSize)
    await Promise.all(batch.map(req => req()))
  }
}
```

### Step 6: Add Prefetching

```typescript
// In ListDetailTemplate.tsx
useEffect(() => {
  if (currentPage < totalPages && !isLoading) {
    // Prefetch next page in background
    const nextPage = currentPage + 1
    apiClient.getPaginated({
      page: nextPage,
      limit: pageSize,
      // ... other params
    }).then(result => {
      // Cache the result
      cacheNextPage(nextPage, result.data)
    }).catch(() => {
      // Silently fail - prefetch is optional
    })
  }
}, [currentPage, totalPages, pageSize])
```

## Phase 3: User Experience Enhancements

### Step 7: Add Skeleton Loaders

```typescript
// Create components/tables/TableSkeleton.tsx
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4 py-4">
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="h-4 bg-neutral-200 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}
```

### Step 8: Optimize Loading States

```typescript
// Already implemented: 600ms delay before showing progress bar
// Add: Skeleton loader for initial load
{isLoading && items.length === 0 && !showLoadingIndicator ? (
  <TableSkeleton rows={pageSize} columns={visibleColumns.length} />
) : (
  // Regular loading or content
)}
```

# Configuration

## Feature Flags

Add to `src/lib/featureFlags.ts`:

```typescript
export const featureFlags = {
  // ... existing flags
  tableOptimization: {
    virtualScrolling: process.env.NODE_ENV === 'production',
    dataCaching: true,
    requestBatching: true,
    prefetching: true,
  }
}
```

## Environment Variables

```env
# Table optimization settings
NEXT_PUBLIC_TABLE_VIRTUAL_SCROLL_THRESHOLD=100
NEXT_PUBLIC_TABLE_CACHE_STALE_TIME=300000
NEXT_PUBLIC_TABLE_PREFETCH_ENABLED=true
```

# Testing

## Performance Testing

1. **Load Test**: Test with 10,000 rows
2. **Memory Test**: Monitor memory usage during scrolling
3. **Render Test**: Measure time to first render
4. **Interaction Test**: Test filter/sort responsiveness

## Metrics to Track

- Time to first render
- Time to interactive
- Scroll FPS
- Memory usage
- API request count
- Cache hit rate

# Migration Plan

1. **Phase 1** (Week 1): Core optimizations (memoization, debouncing)
2. **Phase 2** (Week 2): Virtual scrolling and caching
3. **Phase 3** (Week 3): Advanced features (prefetching, batching)
4. **Phase 4** (Week 4): Testing and refinement

# Tables to Optimize

1. ✅ **Companies** - Using `ListDetailTemplate`
2. ✅ **Geography** - Using `ListDetailTemplate`
3. ✅ **EF GWP** - Using `ListDetailTemplate`
4. ✅ **GHG Types** - Using `ListDetailTemplate`
5. ✅ **Emission Factor Version** - Using `ListDetailTemplate`

All optimizations will be applied to `ListDetailTemplate`, automatically benefiting all tables.

> NOTE: 
> - All optimizations must be backward compatible
> - Performance improvements should not break existing functionality
> - Virtual scrolling should be opt-in via feature flag initially
> - Caching should respect user preferences and data freshness requirements
> - Memory optimizations should not cause data loss
> - All changes should be tested on datasets of various sizes (10, 100, 1000, 10000 rows)
