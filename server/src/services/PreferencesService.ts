/**
 * Preferences Service
 * 
 * High-level service for managing user preferences with validation,
 * caching, and TTL support. Uses adapter pattern for storage.
 */

import {
  PreferenceRecord,
  PreferenceKey,
  PreferenceFilter,
  SetPreferenceOptions,
  PreferenceQueryResult,
  PreferenceValidationError,
  PreferenceNotFoundError,
} from '../types/Preferences'
import { getPreferencesAdapter } from '../adapters/preferences/PreferencesAdapterFactory'

/**
 * Simple in-memory cache with TTL
 */
class PreferenceCache {
  private cache: Map<string, { record: PreferenceRecord; expiresAt: number }> = new Map()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  get(key: string): PreferenceRecord | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return cached.record
  }

  set(key: string, record: PreferenceRecord, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL)
    this.cache.set(key, { record, expiresAt })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  /**
   * Invalidate all cache entries for a user
   */
  invalidateUser(userId: string): void {
    for (const [key] of this.cache) {
      if (key.startsWith(`${userId}::`)) {
        this.cache.delete(key)
      }
    }
  }
}

export class PreferencesService {
  private adapter = getPreferencesAdapter()
  private cache = new PreferenceCache()

  /**
   * Validate preference record
   */
  private validate(record: PreferenceRecord): void {
    if (!record.userId || typeof record.userId !== 'string') {
      throw new PreferenceValidationError('userId is required and must be a string', 'userId')
    }

    if (!record.namespace || !['ui', 'table', 'filters', 'featureFlags', 'misc'].includes(record.namespace)) {
      throw new PreferenceValidationError('namespace must be one of: ui, table, filters, featureFlags, misc', 'namespace')
    }

    if (!record.key || typeof record.key !== 'string') {
      throw new PreferenceValidationError('key is required and must be a string', 'key')
    }

    if (!record.type || !['string', 'number', 'boolean', 'json'].includes(record.type)) {
      throw new PreferenceValidationError('type must be one of: string, number, boolean, json', 'type')
    }

    // Validate value matches type
    switch (record.type) {
      case 'number':
        if (typeof record.value !== 'number') {
          throw new PreferenceValidationError('value must be a number for type "number"', 'value')
        }
        break
      case 'boolean':
        if (typeof record.value !== 'boolean') {
          throw new PreferenceValidationError('value must be a boolean for type "boolean"', 'value')
        }
        break
      case 'json':
        if (typeof record.value !== 'object' || record.value === null || Array.isArray(record.value)) {
          // Allow objects and arrays for JSON type
          if (typeof record.value !== 'object') {
            throw new PreferenceValidationError('value must be an object for type "json"', 'value')
          }
        }
        break
      case 'string':
        if (typeof record.value !== 'string') {
          throw new PreferenceValidationError('value must be a string for type "string"', 'value')
        }
        break
    }
  }

  /**
   * Build cache key
   */
  private buildCacheKey(key: PreferenceKey): string {
    const parts = [
      key.userId,
      key.namespace,
      key.tableId || '',
      key.scopeId || '',
      key.key,
    ]
    return parts.join('::')
  }

  /**
   * Get a single preference
   */
  async get(
    userId: string,
    key: string,
    namespace: PreferenceRecord['namespace'] = 'misc',
    tableId?: string,
    scopeId?: string
  ): Promise<PreferenceRecord | null> {
    const preferenceKey: PreferenceKey = {
      userId,
      namespace,
      key,
      tableId,
      scopeId,
    }

    const cacheKey = this.buildCacheKey(preferenceKey)
    const cached = this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    const record = await this.adapter.get(preferenceKey)
    if (record) {
      this.cache.set(cacheKey, record)
    }

    return record
  }

  /**
   * Get all preferences for a user (with optional filter)
   */
  async getAll(userId: string, filter?: PreferenceFilter): Promise<PreferenceQueryResult> {
    return await this.adapter.getAll(userId, filter)
  }

  /**
   * Set a preference (create or update)
   */
  async set(
    userId: string,
    key: string,
    value: string | number | boolean | object,
    type: PreferenceRecord['type'],
    options?: SetPreferenceOptions & {
      namespace?: PreferenceRecord['namespace']
      tableId?: string
      scopeId?: string
    }
  ): Promise<PreferenceRecord> {
    const record: PreferenceRecord = {
      userId,
      namespace: options?.namespace || 'misc',
      key,
      tableId: options?.tableId,
      scopeId: options?.scopeId,
      type,
      value,
      visibility: options?.visibility || 'private',
      expiresAt: options?.expiresAt,
    }

    this.validate(record)

    const saved = await this.adapter.set(record, options)

    // Update cache
    const cacheKey = this.buildCacheKey({
      userId: saved.userId,
      namespace: saved.namespace,
      key: saved.key,
      tableId: saved.tableId,
      scopeId: saved.scopeId,
    })
    this.cache.set(cacheKey, saved)

    return saved
  }

  /**
   * Delete a preference
   */
  async delete(
    userId: string,
    key: string,
    namespace: PreferenceRecord['namespace'] = 'misc',
    tableId?: string,
    scopeId?: string
  ): Promise<boolean> {
    const preferenceKey: PreferenceKey = {
      userId,
      namespace,
      key,
      tableId,
      scopeId,
    }

    const deleted = await this.adapter.delete(preferenceKey)

    if (deleted) {
      const cacheKey = this.buildCacheKey(preferenceKey)
      this.cache.delete(cacheKey)
    }

    return deleted
  }

  /**
   * Delete all preferences matching filter
   */
  async deleteAll(userId: string, filter?: PreferenceFilter): Promise<number> {
    const deleted = await this.adapter.deleteAll(userId, filter)

    if (deleted > 0) {
      this.cache.invalidateUser(userId)
    }

    return deleted
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    return await this.adapter.healthCheck()
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear()
  }
}

// Singleton instance
let preferencesServiceInstance: PreferencesService | null = null

export function getPreferencesService(): PreferencesService {
  if (!preferencesServiceInstance) {
    preferencesServiceInstance = new PreferencesService()
  }
  return preferencesServiceInstance
}

