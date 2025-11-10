/**
 * Relationship Cache
 * 
 * Frontend caching for resolved relationship names (Company, User Roles, etc.)
 * Uses localStorage with 24-hour TTL to reduce API calls and improve performance.
 */

export interface RelationshipCacheEntry {
  name: string
  timestamp: number
}

export class RelationshipCache {
  private static readonly CACHE_KEY_PREFIX = 'relationship_cache_'
  private static readonly CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

  /**
   * Get cached relationship name
   */
  static get(tableName: string, recordId: string): string | null {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${tableName}`
      const stored = localStorage.getItem(cacheKey)
      if (!stored) return null

      const cache: Record<string, RelationshipCacheEntry> = JSON.parse(stored)
      const entry = cache[recordId]

      if (entry && Date.now() - entry.timestamp < this.CACHE_TTL) {
        return entry.name
      }

      // Remove expired entry
      if (entry) {
        delete cache[recordId]
        localStorage.setItem(cacheKey, JSON.stringify(cache))
      }

      return null
    } catch (error) {
      console.warn('Error reading relationship cache:', error)
      return null
    }
  }

  /**
   * Set cached relationship name
   */
  static set(tableName: string, recordId: string, name: string): void {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${tableName}`
      const stored = localStorage.getItem(cacheKey)
      const cache: Record<string, RelationshipCacheEntry> = stored ? JSON.parse(stored) : {}

      cache[recordId] = {
        name,
        timestamp: Date.now(),
      }

      // Limit cache size to prevent localStorage overflow (keep last 1000 entries per table)
      const entries = Object.entries(cache)
      if (entries.length > 1000) {
        // Sort by timestamp and keep most recent
        entries.sort((a, b) => b[1].timestamp - a[1].timestamp)
        const limitedCache: Record<string, RelationshipCacheEntry> = {}
        entries.slice(0, 1000).forEach(([id, entry]) => {
          limitedCache[id] = entry
        })
        localStorage.setItem(cacheKey, JSON.stringify(limitedCache))
      } else {
        localStorage.setItem(cacheKey, JSON.stringify(cache))
      }
    } catch (error) {
      console.warn('Error writing relationship cache:', error)
      // If quota exceeded, clear old entries
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.clearOldEntries(tableName)
      }
    }
  }

  /**
   * Batch set multiple relationships
   */
  static setBatch(tableName: string, relationships: Array<{ id: string; name: string }>): void {
    relationships.forEach(rel => {
      this.set(tableName, rel.id, rel.name)
    })
  }

  /**
   * Get multiple cached relationships
   */
  static getBatch(tableName: string, recordIds: string[]): Map<string, string> {
    const result = new Map<string, string>()
    recordIds.forEach(id => {
      const name = this.get(tableName, id)
      if (name) {
        result.set(id, name)
      }
    })
    return result
  }

  /**
   * Clear old entries to free up space
   */
  private static clearOldEntries(tableName: string): void {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${tableName}`
      const stored = localStorage.getItem(cacheKey)
      if (!stored) return

      const cache: Record<string, RelationshipCacheEntry> = JSON.parse(stored)
      const now = Date.now()
      const cleaned: Record<string, RelationshipCacheEntry> = {}

      // Keep only entries less than 1 hour old
      Object.entries(cache).forEach(([id, entry]) => {
        if (now - entry.timestamp < 60 * 60 * 1000) {
          cleaned[id] = entry
        }
      })

      localStorage.setItem(cacheKey, JSON.stringify(cleaned))
    } catch (error) {
      console.warn('Error clearing old cache entries:', error)
    }
  }

  /**
   * Clear all cache for a table
   */
  static clear(tableName: string): void {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${tableName}`
      localStorage.removeItem(cacheKey)
    } catch (error) {
      console.warn('Error clearing relationship cache:', error)
    }
  }

  /**
   * Clear all relationship caches
   */
  static clearAll(): void {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('Error clearing all relationship caches:', error)
    }
  }
}



