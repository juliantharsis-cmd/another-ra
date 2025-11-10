/**
 * Memory Preferences Adapter
 * 
 * In-memory storage for preferences (useful for testing and development)
 */

import {
  IPreferencesAdapter,
  PreferenceRecord,
  PreferenceKey,
  PreferenceFilter,
  SetPreferenceOptions,
  PreferenceQueryResult,
} from '../../types/Preferences'

export class MemoryPreferencesAdapter implements IPreferencesAdapter {
  private storage: Map<string, PreferenceRecord> = new Map()

  getName(): string {
    return 'Memory'
  }

  async healthCheck(): Promise<boolean> {
    return true
  }

  /**
   * Build unique key string for storage
   */
  private buildKey(key: PreferenceKey): string {
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
   * Check if preference matches filter
   */
  private matchesFilter(record: PreferenceRecord, filter?: PreferenceFilter): boolean {
    if (!filter) return true

    if (filter.namespace) {
      const namespaces = Array.isArray(filter.namespace) ? filter.namespace : [filter.namespace]
      if (!namespaces.includes(record.namespace)) return false
    }

    if (filter.tableId && record.tableId !== filter.tableId) return false
    if (filter.scopeId && record.scopeId !== filter.scopeId) return false

    if (filter.key) {
      const keys = Array.isArray(filter.key) ? filter.key : [filter.key]
      if (!keys.includes(record.key)) return false
    }

    if (filter.visibility) {
      const visibilities = Array.isArray(filter.visibility) ? filter.visibility : [filter.visibility]
      if (!visibilities.includes(record.visibility || 'private')) return false
    }

    return true
  }

  async get(key: PreferenceKey): Promise<PreferenceRecord | null> {
    const storageKey = this.buildKey(key)
    const record = this.storage.get(storageKey)

    if (!record) {
      return null
    }

    // Check if expired
    if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
      this.storage.delete(storageKey)
      return null
    }

    return { ...record }
  }

  async getAll(userId: string, filter?: PreferenceFilter): Promise<PreferenceQueryResult> {
    const now = new Date()
    const records: PreferenceRecord[] = []

    for (const record of this.storage.values()) {
      if (record.userId !== userId) continue

      // Check expiry
      if (record.expiresAt && new Date(record.expiresAt) < now) {
        if (filter?.expired !== true) continue
      }

      if (this.matchesFilter(record, filter)) {
        records.push({ ...record })
      }
    }

    return {
      records,
      total: records.length,
    }
  }

  async set(record: PreferenceRecord, options?: SetPreferenceOptions): Promise<PreferenceRecord> {
    // Calculate expiry if TTL is provided
    let expiresAt = record.expiresAt
    if (options?.ttl) {
      expiresAt = new Date(Date.now() + options.ttl * 1000)
    } else if (options?.expiresAt) {
      expiresAt = typeof options.expiresAt === 'string' 
        ? new Date(options.expiresAt) 
        : options.expiresAt
    }

    const preference: PreferenceRecord = {
      ...record,
      visibility: options?.visibility || record.visibility || 'private',
      expiresAt,
      updatedAt: new Date(),
    }

    const key: PreferenceKey = {
      userId: preference.userId,
      namespace: preference.namespace,
      key: preference.key,
      tableId: preference.tableId,
      scopeId: preference.scopeId,
    }

    const storageKey = this.buildKey(key)
    const existing = this.storage.get(storageKey)

    if (existing) {
      if (options?.overwrite === false) {
        throw new Error('Preference already exists and overwrite is disabled')
      }
      preference.id = existing.id
      preference.createdAt = existing.createdAt
    } else {
      preference.id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      preference.createdAt = new Date()
    }

    this.storage.set(storageKey, { ...preference })
    return { ...preference }
  }

  async delete(key: PreferenceKey): Promise<boolean> {
    const storageKey = this.buildKey(key)
    return this.storage.delete(storageKey)
  }

  async deleteAll(userId: string, filter?: PreferenceFilter): Promise<number> {
    const result = await this.getAll(userId, filter)
    let deleted = 0

    for (const record of result.records) {
      const key: PreferenceKey = {
        userId: record.userId,
        namespace: record.namespace,
        key: record.key,
        tableId: record.tableId,
        scopeId: record.scopeId,
      }
      if (await this.delete(key)) {
        deleted++
      }
    }

    return deleted
  }

  /**
   * Clear all stored preferences (useful for testing)
   */
  clear(): void {
    this.storage.clear()
  }
}

