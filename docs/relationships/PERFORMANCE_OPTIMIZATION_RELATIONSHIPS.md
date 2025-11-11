# Performance Optimization for Relationship Resolution

## Current Performance Issues

The relationship resolution is slow because:
1. **Synchronous resolution** - Blocks page load until all names are resolved
2. **In-memory cache only** - Lost on server restart, 5-minute TTL
3. **No frontend caching** - Every page load requires new resolution
4. **Airtable API limits** - Rate limiting and latency for each batch request

## Immediate Performance Strategies

### 1. **Frontend Caching (Quick Win - High Impact)**

Cache resolved company names in browser localStorage with longer TTL:

```typescript
// src/lib/cache/relationshipCache.ts
export class RelationshipCache {
  private static readonly CACHE_KEY = 'relationship_cache'
  private static readonly CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

  static get(companyId: string): string | null {
    const cache = this.getCache()
    const entry = cache[companyId]
    if (entry && Date.now() - entry.timestamp < this.CACHE_TTL) {
      return entry.name
    }
    return null
  }

  static set(companyId: string, name: string): void {
    const cache = this.getCache()
    cache[companyId] = { name, timestamp: Date.now() }
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache))
  }

  static getCache(): Record<string, { name: string; timestamp: number }> {
    try {
      const stored = localStorage.getItem(this.CACHE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }
}
```

### 2. **Lazy/Progressive Loading (Better UX)**

Load company names asynchronously after table renders:

```typescript
// Show table immediately with IDs, then update with names
useEffect(() => {
  if (items.length > 0) {
    // Resolve in background
    resolveCompanyNames(items).then(resolved => {
      setItems(prev => prev.map(item => ({
        ...item,
        CompanyName: resolved[item.id] || item.CompanyName
      })))
    })
  }
}, [items])
```

### 3. **Batch Pre-fetching (Reduce API Calls)**

Pre-fetch all company names on app load or in background:

```typescript
// Pre-fetch all companies once, cache for session
async function preloadCompanyNames() {
  const companies = await companiesApi.getPaginated({ limit: 1000 })
  companies.data.forEach(company => {
    RelationshipCache.set(company.id, company.companyName)
  })
}
```

### 4. **Backend: Persistent Disk Cache**

Extend RelationshipResolver to use disk cache like total count:

```typescript
// server/src/services/RelationshipResolver.ts
private readonly cacheFilePath: string
private loadCacheFromDisk(): void {
  // Load from disk on startup
}
private saveCacheToDisk(): void {
  // Save cache periodically
}
```

### 5. **Individual Record Caching**

Cache each company ID → name mapping separately for better hit rates:

```typescript
// Instead of caching entire batch, cache individual mappings
private cache: Map<string, { name: string; timestamp: number }> = new Map()
```

## Database/Table Structure Recommendations

### For Airtable (Current)

1. **Create a Lookup Field** (if possible)
   - Add a formula field in Users table: `Company Name` = Lookup from Companies
   - This pre-resolves names at Airtable level
   - **Pros**: Instant, no API calls needed
   - **Cons**: Only works if relationship is one-to-many

2. **Optimize Field Names**
   - Ensure "Company Name" field exists in Companies table
   - Use consistent naming across tables
   - Index frequently queried fields

3. **Denormalization** (for critical relationships)
   - Add "Company Name" field directly to Users table
   - Update via automation when Company changes
   - **Pros**: Instant display, no resolution needed
   - **Cons**: Data duplication, sync complexity

### For PostgreSQL (Future Migration)

1. **Proper Foreign Keys with Indexes**
   ```sql
   CREATE TABLE users (
     id UUID PRIMARY KEY,
     company_id UUID REFERENCES companies(id),
     company_name VARCHAR(255) -- Denormalized for performance
   );
   
   CREATE INDEX idx_users_company_id ON users(company_id);
   ```

2. **Materialized Views for Lookups**
   ```sql
   CREATE MATERIALIZED VIEW user_company_lookup AS
   SELECT 
     u.id as user_id,
     u.company_id,
     c.name as company_name
   FROM users u
   LEFT JOIN companies c ON u.company_id = c.id;
   
   CREATE INDEX ON user_company_lookup(user_id);
   REFRESH MATERIALIZED VIEW CONCURRENTLY user_company_lookup;
   ```

3. **Computed Columns** (PostgreSQL 12+)
   ```sql
   ALTER TABLE users 
   ADD COLUMN company_name VARCHAR(255) 
   GENERATED ALWAYS AS (
     (SELECT name FROM companies WHERE id = company_id)
   ) STORED;
   ```

## Recommended Implementation Priority

### Phase 1: Quick Wins (1-2 hours)
1. ✅ Frontend localStorage caching
2. ✅ Progressive/lazy loading
3. ✅ Individual record caching in RelationshipResolver

### Phase 2: Backend Improvements (2-4 hours)
1. ✅ Persistent disk cache for RelationshipResolver
2. ✅ Background pre-fetching
3. ✅ Batch optimization (chunk large ID lists)

### Phase 3: Database Optimization (If using Airtable)
1. ⚠️ Add lookup formula field in Users table
2. ⚠️ Consider denormalization for Company Name
3. ⚠️ Optimize Airtable field indexing

### Phase 4: Long-term (PostgreSQL Migration)
1. 🔮 Proper foreign keys and indexes
2. 🔮 Materialized views
3. 🔮 Computed columns

## Expected Performance Improvements

| Strategy | Current | After Optimization | Improvement |
|----------|---------|-------------------|-------------|
| First Load (no cache) | 3-5s | 0.5-1s | **80% faster** |
| Subsequent Loads | 2-3s | <0.1s | **95% faster** |
| Cache Hit Rate | 0% | 80-90% | **Massive** |
| User Experience | Blocking | Non-blocking | **Much better** |

## Code Implementation

See implementation files:
- `src/lib/cache/relationshipCache.ts` - Frontend caching
- `server/src/services/RelationshipResolver.ts` - Enhanced with disk cache
- `src/components/templates/ListDetailTemplate.tsx` - Progressive loading



