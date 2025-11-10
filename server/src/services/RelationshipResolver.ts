/**
 * Relationship Resolver Service
 * 
 * Generic service for resolving linked record relationships between tables.
 * Handles bidirectional relationships, name resolution, and relationship metadata.
 */

import Airtable from 'airtable'

export interface RelationshipConfig {
  /** Source table name in Airtable */
  sourceTable: string
  /** Field name in source table that links to target */
  sourceField: string
  /** Target table name in Airtable */
  targetTable: string
  /** Field name in target table to display (usually "Name") */
  targetDisplayField?: string
  /** Whether relationship is one-to-many (default: true) */
  oneToMany?: boolean
  /** Reverse relationship field name (if exists) */
  reverseField?: string
}

export interface ResolvedRelationship {
  /** Record ID */
  id: string
  /** Display name */
  name: string
  /** Additional metadata */
  metadata?: Record<string, any>
}

export class RelationshipResolver {
  private base: Airtable.Base
  private cache: Map<string, { data: ResolvedRelationship[]; timestamp: number }> = new Map()
  private individualCache: Map<string, { name: string; timestamp: number }> = new Map() // Individual ID → name cache
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly INDIVIDUAL_CACHE_TTL = 30 * 60 * 1000 // 30 minutes for individual records
  private authorizationErrorsLogged: Set<string> = new Set() // Track which tables have logged auth errors

  constructor(baseId: string, apiKey: string) {
    this.base = new Airtable({ apiKey }).base(baseId)
  }

  /**
   * Resolve linked record IDs to names
   */
  async resolveLinkedRecords(
    recordIds: string | string[],
    targetTable: string,
    displayField: string = 'Name'
  ): Promise<ResolvedRelationship[]> {
    if (!recordIds || (Array.isArray(recordIds) && recordIds.length === 0)) {
      return []
    }

    const ids = Array.isArray(recordIds) ? recordIds : [recordIds]
    const cacheKey = `${targetTable}:${displayField}:${ids.sort().join(',')}`

    // Check batch cache first
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as ResolvedRelationship[]
    }

    // Check individual cache for each ID (better hit rate)
    const cachedResults: ResolvedRelationship[] = []
    const uncachedIds: string[] = []

    ids.forEach(id => {
      const individualKey = `${targetTable}:${displayField}:${id}`
      const individualCached = this.individualCache.get(individualKey)
      if (individualCached && Date.now() - individualCached.timestamp < this.INDIVIDUAL_CACHE_TTL) {
        cachedResults.push({ id, name: individualCached.name })
      } else {
        uncachedIds.push(id)
      }
    })

    // If all IDs are cached, return immediately
    if (uncachedIds.length === 0) {
      return cachedResults
    }

    try {
      // Fetch only the specified display field (no fallbacks)
      const fieldsToFetch = [displayField]
      
      const records = await this.base(targetTable)
        .select({
          filterByFormula: `OR(${uncachedIds.map(id => `RECORD_ID() = "${id}"`).join(', ')})`,
          fields: fieldsToFetch,
        })
        .all()

      const resolved: ResolvedRelationship[] = records.map(record => {
        // Use only the specified display field - no fallbacks
        let name = record.fields[displayField] as string
        if (!name || name === '') {
          // If field is missing or empty, use record ID as last resort
          name = record.id
        }
        return {
          id: record.id,
          name,
          metadata: record.fields,
        }
      })

      // Cache batch result
      this.cache.set(cacheKey, {
        data: resolved as ResolvedRelationship[],
        timestamp: Date.now(),
      })

      // Also cache individual records for better hit rates
      resolved.forEach(r => {
        const individualKey = `${targetTable}:${displayField}:${r.id}`
        this.individualCache.set(individualKey, {
          name: r.name,
          timestamp: Date.now(),
        })
      })

      // Combine cached and newly resolved results
      return [...cachedResults, ...resolved]
    } catch (error: any) {
      // Handle authorization errors more gracefully
      const isAuthError = error?.error === 'NOT_AUTHORIZED' || error?.statusCode === 403
      const errorKey = `${targetTable}:${isAuthError ? 'auth' : 'other'}`
      
      if (isAuthError) {
        // Only log authorization errors once per table to reduce noise
        if (!this.authorizationErrorsLogged.has(errorKey)) {
          console.warn(
            `⚠️  No permission to read from "${targetTable}" table. ` +
            `Linked records will display as IDs. ` +
            `To fix: Grant read access to "${targetTable}" in Airtable.`
          )
          this.authorizationErrorsLogged.add(errorKey)
        }
      } else {
        // Log other errors normally (but only once per table)
        if (!this.authorizationErrorsLogged.has(errorKey)) {
          console.error(`Error resolving linked records for ${targetTable}:`, error)
          this.authorizationErrorsLogged.add(errorKey)
        }
      }
      
      // Return IDs as fallback (graceful degradation)
      return ids.map(id => ({ id, name: id }))
    }
  }

  /**
   * Get relationship configuration from Airtable schema
   */
  async getRelationshipConfig(
    tableName: string,
    fieldName: string,
    baseId: string,
    apiKey: string
  ): Promise<RelationshipConfig | null> {
    try {
      // Fetch table schema from Airtable Metadata API
      const metaUrl = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`
      const response = await fetch(metaUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json() as { tables?: Array<{ id: string; name: string; fields?: Array<{ name: string; type: string; options?: { linkedTableId?: string } }> }> }
      const table = data.tables?.find((t) => 
        t.name.toLowerCase() === tableName.toLowerCase()
      )

      if (!table) {
        return null
      }

      const field = table.fields?.find((f) => 
        f.name.toLowerCase() === fieldName.toLowerCase()
      )

      if (!field || field.type !== 'multipleRecordLinks') {
        return null
      }

      const linkedTableId = field.options?.linkedTableId
      const linkedTable = data.tables?.find((t) => t.id === linkedTableId)

      return {
        sourceTable: tableName,
        sourceField: fieldName,
        targetTable: linkedTable?.name || '',
        targetDisplayField: 'Name',
        oneToMany: true,
      }
    } catch (error) {
      console.error('Error fetching relationship config:', error)
      return null
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Clear cache for specific table
   */
  clearCacheForTable(tableName: string): void {
    const keysToDelete: string[] = []
    this.cache.forEach((_, key) => {
      if (key.startsWith(`${tableName}:`)) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach(key => this.cache.delete(key))
  }
}

