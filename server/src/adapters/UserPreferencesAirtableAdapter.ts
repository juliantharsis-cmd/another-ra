/**
 * User Preferences Airtable Adapter
 * 
 * Direct 1:1 mapping between UserPreferences interface and Airtable "User Preferences" table.
 * Each user has a single record with all preference fields as columns.
 */

import Airtable from 'airtable'
import { UserPreferences } from '../types/UserPreferences'
import { getDefaultPreferences } from '../types/UserPreferences'

export class UserPreferencesAirtableAdapter {
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

  /**
   * Map Airtable record to UserPreferences
   */
  private mapAirtableToUserPreferences(record: Airtable.Record<any>): UserPreferences {
    const fields = record.fields

    return {
      userId: fields['User Id'] || '',
      language: fields['Language'] || 'en',
      dateFormat: fields['Date Format'] || 'DD/MM/YYYY',
      timeFormat: fields['Time Format'] || '24h',
      timeZone: fields['Time Zone'] || 'UTC',
      theme: fields['Theme'] || 'system',
      useSchneiderColors: fields['Use Schneider Colors'] ?? true,
      emailNotifications: fields['Email Notifications'] ?? true,
      inAppAlerts: fields['In App Alerts'] ?? true,
      defaultPageSize: fields['Default Page Size'] ?? 25,
      defaultSortField: fields['Default Sort Field'] || undefined,
      defaultSortOrder: fields['Default Sort Order'] || 'asc',
      sidebarLayout: fields['Sidebar Layout'] || 'sidebarFooter',
      createdAt: fields['Created At'] ? new Date(fields['Created At']).toISOString() : undefined,
      updatedAt: fields['Last Modified'] ? new Date(fields['Last Modified']).toISOString() : undefined,
    }
  }

  /**
   * Map UserPreferences to Airtable fields
   */
  private mapUserPreferencesToAirtable(preferences: Partial<UserPreferences>): Record<string, any> {
    const fields: Record<string, any> = {}

    if (preferences.userId !== undefined) {
      fields['User Id'] = preferences.userId
    }
    if (preferences.language !== undefined) {
      fields['Language'] = preferences.language
    }
    if (preferences.dateFormat !== undefined) {
      fields['Date Format'] = preferences.dateFormat
    }
    if (preferences.timeFormat !== undefined) {
      fields['Time Format'] = preferences.timeFormat
    }
    if (preferences.timeZone !== undefined) {
      fields['Time Zone'] = preferences.timeZone
    }
    if (preferences.theme !== undefined) {
      fields['Theme'] = preferences.theme
    }
    if (preferences.useSchneiderColors !== undefined) {
      fields['Use Schneider Colors'] = preferences.useSchneiderColors
    }
    if (preferences.emailNotifications !== undefined) {
      fields['Email Notifications'] = preferences.emailNotifications
    }
    if (preferences.inAppAlerts !== undefined) {
      fields['In App Alerts'] = preferences.inAppAlerts
    }
    if (preferences.defaultPageSize !== undefined) {
      fields['Default Page Size'] = preferences.defaultPageSize
    }
    if (preferences.defaultSortField !== undefined) {
      fields['Default Sort Field'] = preferences.defaultSortField || ''
    }
    if (preferences.defaultSortOrder !== undefined) {
      fields['Default Sort Order'] = preferences.defaultSortOrder
    }
    if (preferences.sidebarLayout !== undefined) {
      fields['Sidebar Layout'] = preferences.sidebarLayout
    }

    return fields
  }

  /**
   * Get user preferences by user ID
   */
  async getPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const records = await this.base(this.tableName)
        .select({
          filterByFormula: `{User Id} = '${userId.replace(/'/g, "''")}'`,
          maxRecords: 1,
        })
        .firstPage()

      if (records.length === 0) {
        return null
      }

      return this.mapAirtableToUserPreferences(records[0])
    } catch (error) {
      console.error('Error getting user preferences from Airtable:', error)
      throw error
    }
  }

  /**
   * Create or update user preferences (upsert)
   */
  async upsertPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      // Try to find existing record
      const existingRecords = await this.base(this.tableName)
        .select({
          filterByFormula: `{User Id} = '${userId.replace(/'/g, "''")}'`,
          maxRecords: 1,
        })
        .firstPage()

      const fields = this.mapUserPreferencesToAirtable({
        ...preferences,
        userId, // Ensure userId is set
      })

      if (existingRecords.length > 0) {
        // Update existing record
        const record = existingRecords[0]
        const updated = await this.base(this.tableName).update(record.id, fields)
        return this.mapAirtableToUserPreferences(updated)
      } else {
        // Create new record
        const created = await this.base(this.tableName).create(fields)
        return this.mapAirtableToUserPreferences(created)
      }
    } catch (error) {
      console.error('Error upserting user preferences in Airtable:', error)
      throw error
    }
  }

  /**
   * Update user preferences (must exist)
   */
  async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      const existingRecords = await this.base(this.tableName)
        .select({
          filterByFormula: `{User Id} = '${userId.replace(/'/g, "''")}'`,
          maxRecords: 1,
        })
        .firstPage()

      if (existingRecords.length === 0) {
        throw new Error(`User preferences not found for userId: ${userId}`)
      }

      const fields = this.mapUserPreferencesToAirtable(preferences)
      const updated = await this.base(this.tableName).update(existingRecords[0].id, fields)
      return this.mapAirtableToUserPreferences(updated)
    } catch (error) {
      console.error('Error updating user preferences in Airtable:', error)
      throw error
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.base(this.tableName).select({ maxRecords: 1 }).firstPage()
      return true
    } catch (error) {
      console.error('UserPreferencesAirtableAdapter health check failed:', error)
      return false
    }
  }
}

