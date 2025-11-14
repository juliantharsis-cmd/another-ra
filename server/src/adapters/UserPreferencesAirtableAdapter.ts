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

    // Debug: Log all field names to see what Airtable returns
    console.log(`[UserPreferencesAdapter] Reading from Airtable - Field names:`, Object.keys(fields))
    console.log(`[UserPreferencesAdapter] AI Notification Animations field value:`, fields['AI Notification Animations'], typeof fields['AI Notification Animations'])

    // Handle checkbox field - Airtable omits false checkbox values from API responses
    // We need to check if the field key exists in the fields object
    // IMPORTANT: If field is missing, it could mean:
    // 1. Never set (default to true)
    // 2. Set to false and Airtable omitted it (should be false)
    // Since we can't distinguish, we'll use a workaround:
    // - Check if the record has been modified recently (has other fields)
    // - If field is missing from a record that has other preferences, assume it was set to false
    // - Otherwise, default to true
    const fieldKey = 'AI Notification Animations'
    const hasField = fieldKey in fields
    const fieldValue = fields[fieldKey]
    
    // Check if this is a "new" record (only has User Id) or an existing one with other preferences
    const hasOtherPreferences = Object.keys(fields).some(key => 
      key !== 'User Id' && key !== fieldKey && fields[key] !== undefined && fields[key] !== null && fields[key] !== ''
    )
    
    console.log(`[UserPreferencesAdapter] Field exists: ${hasField}, Value: ${fieldValue}, Has other prefs: ${hasOtherPreferences}`)
    
    let aiNotificationAnimationsValue: boolean
    if (hasField) {
      // Field exists - use its value (true or false)
      aiNotificationAnimationsValue = Boolean(fieldValue)
    } else {
      // Field doesn't exist
      if (hasOtherPreferences) {
        // Record has other preferences, so it's been updated before
        // If field is missing, it was likely set to false (Airtable omitted it)
        console.log(`[UserPreferencesAdapter] Field '${fieldKey}' missing from existing record, assuming false`)
        aiNotificationAnimationsValue = false
      } else {
        // New record or no other preferences - field was never set, default to true
        console.log(`[UserPreferencesAdapter] Field '${fieldKey}' missing from new record, defaulting to true`)
        aiNotificationAnimationsValue = true
      }
    }

    console.log(`[UserPreferencesAdapter] Resolved aiNotificationAnimations to:`, aiNotificationAnimationsValue)

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
      aiNotificationAnimations: aiNotificationAnimationsValue,
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
    // Explicitly handle boolean - always include the field, even if false
    // This ensures Airtable stores false values properly
    if (preferences.aiNotificationAnimations !== undefined) {
      fields['AI Notification Animations'] = Boolean(preferences.aiNotificationAnimations)
      console.log(`[UserPreferencesAdapter] Setting AI Notification Animations to: ${Boolean(preferences.aiNotificationAnimations)}`)
    } else {
      // If undefined, don't include it (will use default true when reading)
      console.log(`[UserPreferencesAdapter] AI Notification Animations is undefined, skipping`)
    }

    console.log(`[UserPreferencesAdapter] Mapped fields:`, Object.keys(fields))
    console.log(`[UserPreferencesAdapter] AI Notification Animations value:`, fields['AI Notification Animations'])
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

      const record = records[0]
      const mapped = this.mapAirtableToUserPreferences(record)
      
      // The mapAirtableToUserPreferences already handles the false checkbox value logic
      // It checks if the field exists and if the record has other preferences to determine
      // if a missing field should be false (was set but omitted) or true (never set)
      
      console.log(`[UserPreferencesAdapter] getPreferences - Final mapped aiNotificationAnimations:`, mapped.aiNotificationAnimations)
      return mapped
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
        console.log(`[UserPreferencesAdapter] Updating record ${record.id} with fields:`, fields)
        const updated = await this.base(this.tableName).update(record.id, fields)
        console.log(`[UserPreferencesAdapter] Updated record fields:`, updated.fields)
        const mapped = this.mapAirtableToUserPreferences(updated)
        
        // IMPORTANT: Airtable omits false checkbox values from the response
        // If we sent false but it's not in the response, preserve the false value we sent
        if (preferences.aiNotificationAnimations !== undefined && 
            !('AI Notification Animations' in updated.fields)) {
          console.log(`[UserPreferencesAdapter] Airtable omitted false checkbox value, preserving sent value: ${preferences.aiNotificationAnimations}`)
          mapped.aiNotificationAnimations = Boolean(preferences.aiNotificationAnimations)
        }
        
        console.log(`[UserPreferencesAdapter] Mapped preferences:`, mapped)
        return mapped
      } else {
        // Create new record
        const created = await this.base(this.tableName).create(fields)
        const mapped = this.mapAirtableToUserPreferences(created)
        
        // IMPORTANT: Airtable omits false checkbox values from the response
        // If we sent false but it's not in the response, preserve the false value we sent
        if (preferences.aiNotificationAnimations !== undefined && 
            !('AI Notification Animations' in created.fields)) {
          console.log(`[UserPreferencesAdapter] Airtable omitted false checkbox value, preserving sent value: ${preferences.aiNotificationAnimations}`)
          mapped.aiNotificationAnimations = Boolean(preferences.aiNotificationAnimations)
        }
        
        return mapped
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
      console.log(`[UserPreferencesAdapter] updatePreferences - fields to update:`, fields)
      const updated = await this.base(this.tableName).update(existingRecords[0].id, fields)
      console.log(`[UserPreferencesAdapter] updatePreferences - updated record fields:`, updated.fields)
      const mapped = this.mapAirtableToUserPreferences(updated)
      
      // IMPORTANT: Airtable omits false checkbox values from the response
      // If we sent false but it's not in the response, preserve the false value we sent
      if (preferences.aiNotificationAnimations !== undefined && 
          !('AI Notification Animations' in updated.fields)) {
        console.log(`[UserPreferencesAdapter] Airtable omitted false checkbox value, preserving sent value: ${preferences.aiNotificationAnimations}`)
        mapped.aiNotificationAnimations = Boolean(preferences.aiNotificationAnimations)
      }
      
      console.log(`[UserPreferencesAdapter] updatePreferences - final mapped value:`, mapped.aiNotificationAnimations)
      return mapped
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

