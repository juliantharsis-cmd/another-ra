/**
 * Table Data Cache Hook
 * 
 * Implements caching with stale-while-revalidate pattern for table data.
 * Shows cached data immediately while fetching fresh data in the background.
 */

import { useState, useEffect, useRef } from 'react'

interface CacheEntry<T> {
  data: T[]
  timestamp: number
  key: string
}

interface UseTableDataCacheOptions {
  staleTime?: number // Time before data is considered stale (default: 5 minutes)
  cacheTime?: number // Time before cache entry is removed (default: 10 minutes)
}

export function useTableDataCache<T>(
  fetchFn: () => Promise<T[]>,
  cacheKey: string,
  options: UseTableDataCacheOptions = {}
) {
  const { staleTime = 5 * 60 * 1000, cacheTime = 10 * 60 * 1000 } = options
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map())
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  useEffect(() => {
    const cached = cacheRef.current.get(cacheKey)
    const now = Date.now()
    
    // Clean up old cache entries
    for (const [key, entry] of cacheRef.current.entries()) {
      if (now - entry.timestamp > cacheTime) {
        cacheRef.current.delete(key)
      }
    }
    
    if (cached && (now - cached.timestamp) < staleTime) {
      // Use cached data immediately
      setData(cached.data)
      setIsLoading(false)
      
      // Refresh in background (stale-while-revalidate)
      setIsRefreshing(true)
      fetchFn()
        .then(newData => {
          cacheRef.current.set(cacheKey, {
            data: newData,
            timestamp: now,
            key: cacheKey
          })
          setData(newData)
        })
        .catch(error => {
          console.error('Background refresh failed:', error)
          // Keep using cached data on error
        })
        .finally(() => {
          setIsRefreshing(false)
        })
    } else {
      // Fetch fresh data
      setIsLoading(true)
      fetchFn()
        .then(newData => {
          cacheRef.current.set(cacheKey, {
            data: newData,
            timestamp: now,
            key: cacheKey
          })
          setData(newData)
          setIsLoading(false)
        })
        .catch(error => {
          console.error('Data fetch failed:', error)
          setIsLoading(false)
          // If we have stale cache, use it as fallback
          if (cached) {
            setData(cached.data)
          }
        })
    }
  }, [cacheKey, fetchFn, staleTime, cacheTime])
  
  // Invalidate cache entry
  const invalidate = () => {
    cacheRef.current.delete(cacheKey)
  }
  
  // Clear all cache
  const clearCache = () => {
    cacheRef.current.clear()
  }
  
  return { 
    data, 
    isLoading, 
    isRefreshing,
    invalidate,
    clearCache
  }
}

