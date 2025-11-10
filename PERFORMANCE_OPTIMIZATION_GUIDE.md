# Performance Optimization Implementation Guide
## Quick Start: Critical Fixes for 3000+ Companies, 100K+ Records/Week

This guide provides step-by-step implementation for the most critical performance optimizations.

---

## 🚀 Phase 1: Immediate Fixes (Week 1)

### 1. Add Virtual Scrolling (Priority: CRITICAL)

**Problem:** Rendering 1000+ rows causes 2-5 second load times and high memory usage.

**Solution:** Install and implement `react-window`

```bash
npm install react-window @types/react-window
```

**Implementation:**

```tsx
// src/components/templates/ListDetailTemplate.tsx
import { FixedSizeList } from 'react-window'
import { memo } from 'react'

// Memoized row component
const TableRow = memo(({ index, style, data }: any) => {
  const { items, columns, onItemClick, columnVisibility } = data
  const item = items[index]
  
  return (
    <div
      style={style}
      className="table-row border-b border-neutral-200 hover:bg-green-50 transition-colors cursor-pointer"
      onClick={() => onItemClick(item)}
    >
      <div className="flex">
        {columns
          .filter((col: any) => columnVisibility[col.key] !== false)
          .map((column: any) => (
            <div
              key={column.key}
              className={`px-6 py-3 ${
                column.align === 'center' ? 'text-center' : 
                column.align === 'right' ? 'text-right' : 'text-left'
              }`}
              style={{ width: column.width || '200px', flex: column.width ? '0 0 auto' : '1' }}
            >
              {column.render 
                ? column.render((item as any)[column.key], item)
                : (item as any)[column.key] || '—'
              }
            </div>
          ))}
      </div>
    </div>
  )
}, (prev, next) => {
  // Only re-render if item data changed
  return prev.data.items[next.index]?.id === next.data.items[next.index]?.id
})

// In ListDetailTemplate component:
const rowData = useMemo(() => ({
  items,
  columns,
  onItemClick: handleItemClick,
  columnVisibility,
}), [items, columns, handleItemClick, columnVisibility])

// Replace table body with:
<div className="flex-1 overflow-auto border border-neutral-200 rounded-lg bg-neutral-50">
  <div className="table-header">
    {/* Keep existing header */}
  </div>
  <FixedSizeList
    height={600}
    itemCount={items.length}
    itemSize={50}
    width="100%"
    itemData={rowData}
    overscanCount={5} // Render 5 extra items for smooth scrolling
  >
    {TableRow}
  </FixedSizeList>
</div>
```

**Expected Impact:** 90% reduction in render time, 80% reduction in memory

---

### 2. Batch Filter Option Requests (Priority: HIGH)

**Problem:** Filter options load sequentially, causing waterfall delays.

**Current Code (Line 109-111):**
```typescript
for (const filter of filters) {
  if (typeof filter.options === 'function') {
    options[filter.key] = await filter.options() // Sequential!
  }
}
```

**Optimized Code:**
```typescript
// Load filter options
useEffect(() => {
  const loadFilterOptions = async () => {
    setIsLoadingFilters(true)
    try {
      const options: Record<string, string[]> = {}
      
      // Batch all filter requests in parallel
      const filterPromises = filters.map(async (filter) => {
        if (typeof filter.options === 'function') {
          try {
            const values = await filter.options()
            return { key: filter.key, options: values }
          } catch (err) {
            console.error(`Error loading filter ${filter.key}:`, err)
            return { key: filter.key, options: [] }
          }
        }
        return { key: filter.key, options: filter.options || [] }
      })
      
      const results = await Promise.all(filterPromises)
      results.forEach(({ key, options: values }) => {
        options[key] = values
      })
      
      setFilterOptions(options)
    } catch (err) {
      console.error('Error loading filter options:', err)
    } finally {
      setIsLoadingFilters(false)
    }
  }

  if (filters.length > 0) {
    loadFilterOptions()
  } else {
    setIsLoadingFilters(false)
  }
}, [filters])
```

**Expected Impact:** 70% reduction in filter load time (900ms → 300ms for 3 filters)

---

### 3. Add Response Compression (Priority: HIGH)

**Problem:** Large JSON responses sent uncompressed.

**Install:**
```bash
cd server
npm install compression
npm install --save-dev @types/compression
```

**Implementation:**
```typescript
// server/src/index.ts
import compression from 'compression'

// Add after CORS middleware
app.use(compression({
  level: 6, // Balance between compression and CPU (1-9, 6 is good default)
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false
    }
    return compression.filter(req, res)
  }
}))
```

**Expected Impact:** 60-70% reduction in response size, faster network transfer

---

### 4. Optimize Search Debounce (Priority: MEDIUM)

**Current:** 500ms debounce may be too long for large datasets.

**Optimized:**
```typescript
// Reduce debounce and add search caching
const [debouncedSearch, setDebouncedSearch] = useState('')
const searchCache = useRef(new Map<string, any>())

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchQuery)
    setCurrentPage(1)
  }, 300) // Reduced from 500ms
  
  return () => clearTimeout(timer)
}, [searchQuery])

// In loadItems, add caching:
const loadItems = useCallback(async () => {
  try {
    setIsLoading(true)
    setError(null)

    // Check cache for search results
    const cacheKey = `search:${debouncedSearch}:page:${currentPage}:filters:${JSON.stringify(activeFilters)}`
    if (searchCache.current.has(cacheKey)) {
      const cached = searchCache.current.get(cacheKey)
      setItems(cached.data)
      setTotalCount(cached.pagination.total)
      setHasMore(cached.pagination.hasMore)
      setIsLoading(false)
      return
    }

    const result = await apiClient.getPaginated({
      page: currentPage,
      limit: pageSize,
      search: debouncedSearch || undefined,
      sortBy: sortBy || undefined,
      sortOrder: sortOrder || undefined,
      filters: Object.keys(activeFilters).length > 0 ? activeFilters : undefined,
    })

    // Cache result (limit cache size)
    if (searchCache.current.size > 50) {
      const firstKey = searchCache.current.keys().next().value
      searchCache.current.delete(firstKey)
    }
    searchCache.current.set(cacheKey, result)

    setItems(result.data)
    setTotalCount(result.pagination.total)
    setHasMore(result.pagination.hasMore)
    
    // ... rest of code
  } catch (err) {
    // ... error handling
  }
}, [currentPage, pageSize, debouncedSearch, sortBy, sortOrder, activeFilters, apiClient])
```

**Expected Impact:** 200ms faster search response, 30% reduction in API calls

---

## 🔧 Phase 2: Backend Optimizations (Week 2-3)

### 5. Add Redis Caching Layer

**Install:**
```bash
cd server
npm install ioredis
npm install --save-dev @types/ioredis
```

**Create Cache Service:**
```typescript
// server/src/services/CacheService.ts
import Redis from 'ioredis'

class CacheService {
  private redis: Redis | null = null
  private enabled: boolean = false

  constructor() {
    const redisUrl = process.env.REDIS_URL
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000)
            return delay
          },
        })
        this.enabled = true
        console.log('✅ Redis cache enabled')
      } catch (error) {
        console.warn('⚠️  Redis not available, using in-memory cache')
        this.enabled = false
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.redis) return null
    
    try {
      const value = await this.redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    if (!this.enabled || !this.redis) return
    
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  async del(key: string): Promise<void> {
    if (!this.enabled || !this.redis) return
    
    try {
      await this.redis.del(key)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.enabled || !this.redis) return
    
    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
    } catch (error) {
      console.error('Cache invalidate error:', error)
    }
  }
}

export const cacheService = new CacheService()
```

**Use in AirtableService:**
```typescript
// server/src/services/AirtableService.ts
import { cacheService } from './CacheService'

async findPaginated(
  offset: number = 0,
  limit: number = 50,
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'asc',
  filters?: Record<string, any>,
  search?: string
): Promise<{ records: any[], total: number }> {
  // Generate cache key
  const cacheKey = `table:${this.tableName}:offset:${offset}:limit:${limit}:sort:${sortBy}:${sortOrder}:filters:${JSON.stringify(filters)}:search:${search}`
  
  // Check cache
  const cached = await cacheService.get<{ records: any[], total: number }>(cacheKey)
  if (cached) {
    console.log(`📦 Cache hit for ${this.tableName}`)
    return cached
  }
  
  // ... existing fetch logic ...
  
  const result = { records: paginatedRecords, total }
  
  // Cache for 5 minutes
  await cacheService.set(cacheKey, result, 300)
  
  return result
}
```

**Expected Impact:** 80% reduction in database load for repeated queries

---

### 6. Add Rate Limiting

**Install:**
```bash
cd server
npm install express-rate-limit
```

**Implementation:**
```typescript
// server/src/index.ts
import rateLimit from 'express-rate-limit'

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/health',
})

// Stricter limiter for expensive operations
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 requests per window
  message: {
    success: false,
    error: 'Rate limit exceeded',
    message: 'Too many requests for this operation',
  },
})

// Apply to routes
app.use('/api/', apiLimiter)
app.use('/api/companies', strictLimiter) // Stricter for companies endpoint
```

**Expected Impact:** Protection against request storms, better resource allocation

---

### 7. Optimize Airtable Pagination

**Current Issue:** Fetches entire pages even when only a few records are needed.

**Optimized:**
```typescript
// server/src/services/AirtableService.ts
async findPaginated(
  offset: number = 0,
  limit: number = 50,
  // ... other params
): Promise<{ records: any[], total: number }> {
  // Calculate exact records needed
  const startRecordIndex = offset
  const endRecordIndex = offset + limit
  
  // Airtable max is 100 per page, but we can optimize further
  // If we need records 50-75, we only need to fetch page 1 (records 0-99)
  const startPage = Math.floor(startRecordIndex / 100)
  const endPage = Math.ceil(endRecordIndex / 100)
  
  // If we only need one page, use maxRecords to limit fetch
  if (startPage === endPage) {
    const maxRecords = Math.min(endRecordIndex, 100)
    const records = await this.base(this.tableName)
      .select({
        maxRecords,
        // ... other options
      })
      .all()
    
    // Slice to exact range needed
    const startIndex = startRecordIndex % 100
    return {
      records: records.slice(startIndex, startIndex + limit),
      total: await this.getTotalCount(),
    }
  }
  
  // ... existing multi-page logic
}
```

**Expected Impact:** 40% reduction in data transfer for small page requests

---

## 📊 Phase 3: Monitoring & Advanced Optimizations (Month 2)

### 8. Add Performance Monitoring

**Install:**
```bash
cd server
npm install express-slow-down
```

**Add Performance Middleware:**
```typescript
// server/src/middleware/performance.ts
import { Request, Response, NextFunction } from 'express'

export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    const { method, path } = req
    const { statusCode } = res
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`⚠️  Slow request: ${method} ${path} - ${duration}ms (${statusCode})`)
    }
    
    // Log all requests for analysis
    console.log(`📊 ${method} ${path} - ${duration}ms (${statusCode})`)
    
    // Send to monitoring service (DataDog, New Relic, etc.)
    // monitoringService.recordMetric('api.response_time', duration, {
    //   method,
    //   path,
    //   statusCode,
    // })
  })
  
  next()
}

// In server/src/index.ts
import { performanceMonitor } from './middleware/performance'
app.use(performanceMonitor)
```

---

### 9. Memoize Expensive Computations

**In ListDetailTemplate:**
```typescript
// Memoize visible columns
const visibleColumns = useMemo(() => {
  return columns.filter(col => columnVisibility[col.key] !== false)
}, [columns, columnVisibility])

// Memoize sorted/filtered items (if doing client-side)
const processedItems = useMemo(() => {
  // Only if you're doing client-side processing
  return items
}, [items])

// Memoize search suggestions
const searchSuggestionsMemo = useMemo(() => {
  const titleField = columns.find(col => col.key === panel.titleKey)
  if (!titleField) return []
  
  return items
    .map(item => (item as any)[panel.titleKey])
    .filter(Boolean)
    .slice(0, 10)
}, [items, columns, panel.titleKey])
```

---

## 🎯 Testing Performance Improvements

### Before/After Metrics

Create a test script to measure improvements:

```typescript
// scripts/performance-test.ts
async function measurePerformance() {
  const metrics = {
    initialLoad: 0,
    filterLoad: 0,
    searchResponse: 0,
    memoryUsage: 0,
  }
  
  // Test initial load
  const start = Date.now()
  await fetch('/api/companies?page=1&limit=25')
  metrics.initialLoad = Date.now() - start
  
  // Test filter load
  const filterStart = Date.now()
  await Promise.all([
    fetch('/api/companies/filter-values?field=status'),
    fetch('/api/companies/filter-values?field=primaryIndustry'),
    fetch('/api/companies/filter-values?field=primaryActivity'),
  ])
  metrics.filterLoad = Date.now() - filterStart
  
  // Test search
  const searchStart = Date.now()
  await fetch('/api/companies?search=test&page=1&limit=25')
  metrics.searchResponse = Date.now() - searchStart
  
  console.log('Performance Metrics:', metrics)
}
```

---

## 📝 Environment Variables

Add to `.env`:

```bash
# Redis Cache (optional but recommended)
REDIS_URL=redis://localhost:6379

# Performance tuning
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX=100
CACHE_TTL_SECONDS=300
```

---

## ✅ Checklist

- [ ] Install react-window and implement virtual scrolling
- [ ] Batch filter option requests
- [ ] Add response compression
- [ ] Optimize search debounce and add caching
- [ ] Set up Redis (optional but recommended)
- [ ] Add rate limiting
- [ ] Optimize Airtable pagination
- [ ] Add performance monitoring
- [ ] Memoize expensive computations
- [ ] Test with 10K+ records
- [ ] Monitor production metrics

---

**Next Steps:** After implementing Phase 1, measure improvements and proceed to Phase 2 based on actual bottlenecks observed in production.

