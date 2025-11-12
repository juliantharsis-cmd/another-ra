/**
 * Airtable Preferences Adapter
 * 
 * Stores user preferences in Airtable "User Preferences" table
 */

import Airtable from 'airtable'
import {
  IPreferencesAdapter,
  PreferenceRecord,
  PreferenceKey,
  PreferenceFilter,
  SetPreferenceOptions,
  PreferenceQueryResult,
  PreferenceValidationError,
} from '../../types/Preferences'

export class AirtablePreferencesAdapter implements IPreferencesAdapter {
  private base: Airtable.Base
  private tableName: string = 'User Preferences'

  constructor() {
    const apiKey = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY
    const baseId = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID

    if (!apiKey) {
      throw new Error('AIRTABLE_PERSONAL_ACCESS_TOKEN or AIRTABLE_API_KEY is required')
    }
    if (!baseId) {
      throw new Error('AIRTABLE_SYSTEM_CONFIG_BASE_ID is required')
    }

    Airtable.configure({ apiKey })
    this.base = Airtable.base(baseId)
  }

  getName(): string {
    return 'Airtable'
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Try to query the table (limit 1 for efficiency)
      await this.base(this.tableName).select({ maxRecords: 1 }).firstPage()
      return true
    } catch (error) {
      console.error('Airtable preferences adapter health check failed:', error)
      return false
    }
  }

  /**
   * Build unique key string for Airtable lookup
   */
  private buildUniqueKey(key: PreferenceKey): string {
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
   * Map Airtable record to PreferenceRecord
   */
  private mapAirtableToPreference(record: Airtable.Record<any>): PreferenceRecord {
    const fields = record.fields

    // Determine value based on type
    let value: string | number | boolean | object
    const type = fields['Type'] as string

    switch (type) {
      case 'number':
        value = fields['Value (number)'] ?? 0
        break
      case 'boolean':
        value = fields['Value (boolean)'] ?? false
        break
      case 'json':
        try {
          value = JSON.parse(fields['Value (text)'] || '{}')
        } catch {
          value = {}
        }
        break
      case 'string':
      default:
        value = fields['Value (text)'] || ''
    }

    return {
      id: record.id,
      userId: fields['User Id'] || '',
      namespace: fields['Namespace'] as any,
      key: fields['Key'] || '',
      tableId: fields['Table Id'] || undefined,
      scopeId: fields['Scope Id'] || undefined,
      type: type as any,
      value,
      visibility: (fields['Visibility'] as any) || 'private',
      expiresAt: fields['Expires At'] ? new Date(fields['Expires At']) : undefined,
      createdAt: fields['Created At'] ? new Date(fields['Created At']) : undefined,
      updatedAt: fields['Last Modified'] ? new Date(fields['Last Modified']) : undefined,
    }
  }

  /**
   * Map PreferenceRecord to Airtable fields
   */
  private mapPreferenceToAirtable(record: PreferenceRecord): Record<string, any> {
    const fields: Record<string, any> = {
      'User Id': record.userId,
      'Namespace': record.namespace,
      'Key': record.key,
      'Type': record.type,
      'Visibility': record.visibility || 'private',
    }

    // Set table and scope IDs if provided
    if (record.tableId) {
      fields['Table Id'] = record.tableId
    }
    if (record.scopeId) {
      fields['Scope Id'] = record.scopeId
    }

    // Set value based on type
    switch (record.type) {
      case 'number':
        fields['Value (number)'] = typeof record.value === 'number' ? record.value : 0
        fields['Value (text)'] = ''
        fields['Value (boolean)'] = false
        break
      case 'boolean':
        fields['Value (boolean)'] = typeof record.value === 'boolean' ? record.value : false
        fields['Value (text)'] = ''
        fields['Value (number)'] = 0
        break
      case 'json':
        fields['Value (text)'] = JSON.stringify(record.value)
        fields['Value (number)'] = 0
        fields['Value (boolean)'] = false
        break
      case 'string':
      default:
        fields['Value (text)'] = String(record.value)
        fields['Value (number)'] = 0
        fields['Value (boolean)'] = false
    }

    // Set expiry if provided
    if (record.expiresAt) {
      fields['Expires At'] = typeof record.expiresAt === 'string' 
        ? record.expiresAt 
        : record.expiresAt.toISOString()
    }

    return fields
  }

  async get(key: PreferenceKey): Promise<PreferenceRecord | null> {
    try {
      const uniqueKey = this.buildUniqueKey(key)

      // Try to use Unique Key formula field first, fallback to manual matching if not available
      let records: Airtable.Record<any>[]
      try {
        records = await this.base(this.tableName)
          .select({
            filterByFormula: `{Unique Key} = '${uniqueKey.replace(/'/g, "''")}'`,
            maxRecords: 1,
          })
          .firstPage()
      } catch (formulaError: any) {
        // If Unique Key formula doesn't exist yet, match manually
        console.log('⚠️  Unique Key formula field not found, using manual matching')
        
        // Try to get all records and filter in memory as fallback
        try {
          const conditions = [
            `{User Id} = '${key.userId.replace(/'/g, "''")}'`,
            `{Namespace} = '${key.namespace.replace(/'/g, "''")}'`,
            `{Key} = '${key.key.replace(/'/g, "''")}'`,
          ]
          if (key.tableId) {
            conditions.push(`{Table Id} = '${key.tableId.replace(/'/g, "''")}'`)
          } else {
            conditions.push(`OR({Table Id} = '', ISBLANK({Table Id}))`)
          }
          if (key.scopeId) {
            conditions.push(`{Scope Id} = '${key.scopeId.replace(/'/g, "''")}'`)
          } else {
            conditions.push(`OR({Scope Id} = '', ISBLANK({Scope Id}))`)
          }
          records = await this.base(this.tableName)
            .select({
              filterByFormula: `AND(${conditions.join(', ')})`,
              maxRecords: 1,
            })
            .firstPage()
        } catch (manualError: any) {
          // If manual matching also fails, try fetching all and filtering in memory
          console.warn('⚠️  Formula-based filtering failed, trying in-memory filtering:', manualError.message)
          const allRecords: Airtable.Record<any>[] = []
          await this.base(this.tableName)
            .select({ maxRecords: 1000 }) // Limit to prevent memory issues
            .eachPage((pageRecords, fetchNextPage) => {
              allRecords.push(...pageRecords)
              fetchNextPage()
            })
          
          // Filter in memory
          records = allRecords.filter(record => {
            const fields = record.fields
            return fields['User Id'] === key.userId &&
                   fields['Namespace'] === key.namespace &&
                   fields['Key'] === key.key &&
                   (key.tableId ? fields['Table Id'] === key.tableId : !fields['Table Id']) &&
                   (key.scopeId ? fields['Scope Id'] === key.scopeId : !fields['Scope Id'])
          }).slice(0, 1)
        }
      }

      if (records.length === 0) {
        return null
      }

      const preference = this.mapAirtableToPreference(records[0])

      // Check if expired
      if (preference.expiresAt && new Date(preference.expiresAt) < new Date()) {
        return null
      }

      return preference
    } catch (error) {
      console.error('Error getting preference from Airtable:', error)
      throw error
    }
  }

  async getAll(userId: string, filter?: PreferenceFilter): Promise<PreferenceQueryResult> {
    try {
      const formulas: string[] = [`{User Id} = '${userId.replace(/'/g, "''")}'`]

      if (filter) {
        if (filter.namespace) {
          const namespaces = Array.isArray(filter.namespace) ? filter.namespace : [filter.namespace]
          const namespaceFormulas = namespaces.map(ns => `{Namespace} = '${ns}'`)
          formulas.push(`OR(${namespaceFormulas.join(', ')})`)
        }

        if (filter.tableId) {
          formulas.push(`{Table Id} = '${filter.tableId.replace(/'/g, "''")}'`)
        }

        if (filter.scopeId) {
          formulas.push(`{Scope Id} = '${filter.scopeId.replace(/'/g, "''")}'`)
        }

        if (filter.key) {
          const keys = Array.isArray(filter.key) ? filter.key : [filter.key]
          const keyFormulas = keys.map(k => `{Key} = '${k.replace(/'/g, "''")}'`)
          formulas.push(`OR(${keyFormulas.join(', ')})`)
        }

        if (filter.visibility) {
          const visibilities = Array.isArray(filter.visibility) ? filter.visibility : [filter.visibility]
          const visibilityFormulas = visibilities.map(v => `{Visibility} = '${v}'`)
          formulas.push(`OR(${visibilityFormulas.join(', ')})`)
        }
      }

      const filterFormula = formulas.length > 1 ? `AND(${formulas.join(', ')})` : formulas[0]

      const allRecords: Airtable.Record<any>[] = []
      await this.base(this.tableName)
        .select({
          filterByFormula: filterFormula,
        })
        .eachPage((records, fetchNextPage) => {
          allRecords.push(...records)
          fetchNextPage()
        })

      // Filter expired if not explicitly requested
      const now = new Date()
      const preferences = allRecords
        .map(record => this.mapAirtableToPreference(record))
        .filter(pref => {
          if (pref.expiresAt && new Date(pref.expiresAt) < now) {
            return filter?.expired === true
          }
          return true
        })

      return {
        records: preferences,
        total: preferences.length,
      }
    } catch (error) {
      console.error('Error getting preferences from Airtable:', error)
      throw error
    }
  }

  async set(record: PreferenceRecord, options?: SetPreferenceOptions): Promise<PreferenceRecord> {
    try {
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
      }

      const fields = this.mapPreferenceToAirtable(preference)
      const uniqueKey = this.buildUniqueKey({
        userId: preference.userId,
        namespace: preference.namespace,
        key: preference.key,
        tableId: preference.tableId,
        scopeId: preference.scopeId,
      })

      // Check if record exists
      const existing = await this.get({
        userId: preference.userId,
        namespace: preference.namespace,
        key: preference.key,
        tableId: preference.tableId,
        scopeId: preference.scopeId,
      })

      if (existing) {
        // Update existing record
        if (options?.overwrite === false) {
          throw new PreferenceValidationError('Preference already exists and overwrite is disabled')
        }

        await this.base(this.tableName).update(existing.id!, fields)
        return {
          ...preference,
          id: existing.id,
          updatedAt: new Date(),
        }
      } else {
        // Create new record
        const created = await this.base(this.tableName).create(fields)
        return {
          ...preference,
          id: created.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }
    } catch (error) {
      console.error('Error setting preference in Airtable:', error)
      throw error
    }
  }

  async delete(key: PreferenceKey): Promise<boolean> {
    try {
      const existing = await this.get(key)
      if (!existing || !existing.id) {
        return false
      }

      await this.base(this.tableName).destroy(existing.id)
      return true
    } catch (error) {
      console.error('Error deleting preference from Airtable:', error)
      throw error
    }
  }

  async deleteAll(userId: string, filter?: PreferenceFilter): Promise<number> {
    try {
      const result = await this.getAll(userId, filter)
      if (result.records.length === 0) {
        return 0
      }

      const ids = result.records.map(r => r.id!).filter(Boolean)
      if (ids.length === 0) {
        return 0
      }

      // Delete in batches of 10 (Airtable limit)
      let deleted = 0
      for (let i = 0; i < ids.length; i += 10) {
        const batch = ids.slice(i, i + 10)
        await this.base(this.tableName).destroy(batch)
        deleted += batch.length
      }

      return deleted
    } catch (error) {
      console.error('Error deleting preferences from Airtable:', error)
      throw error
    }
  }
}

