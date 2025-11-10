/**
 * User Preferences Adapter
 * 
 * Direct 1:1 mapping between UserPreferences interface and Airtable "User Preferences" table.
 * Each user has a single record with all preference fields as columns.
 */

import { UserPreferencesAirtableAdapter } from '../adapters/UserPreferencesAirtableAdapter'
import { UserPreferences } from '../types/UserPreferences'
import { getDefaultPreferences } from '../types/UserPreferences'

export class UserPreferencesAdapter {
  private airtableAdapter: UserPreferencesAirtableAdapter

  constructor() {
    this.airtableAdapter = new UserPreferencesAirtableAdapter()
  }

  /**
   * Get user preferences by user ID
   */
  async getPreferences(userId: string): Promise<UserPreferences> {
    try {
      const preferences = await this.airtableAdapter.getPreferences(userId)
      
      if (preferences) {
        return preferences
      }

      // Return defaults if no preferences found
      const locale = 'en-US' // Default locale for server-side
      const timeZone = 'UTC' // Default timezone for server-side
      return getDefaultPreferences(userId, locale, timeZone)
    } catch (error) {
      console.error('Error getting user preferences:', error)
      // Return defaults if service fails
      const locale = 'en-US' // Default locale for server-side
      const timeZone = 'UTC' // Default timezone for server-side
      return getDefaultPreferences(userId, locale, timeZone)
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      // Get existing preferences first
      const existing = await this.airtableAdapter.getPreferences(userId)
      
      if (!existing) {
        // Create new preferences with defaults + updates
        const defaults = getDefaultPreferences(userId, 'en-US', 'UTC')
        return await this.airtableAdapter.upsertPreferences(userId, {
          ...defaults,
          ...updates,
        })
      }

      // Update existing preferences
      return await this.airtableAdapter.updatePreferences(userId, updates)
    } catch (error) {
      console.error('Error updating user preferences:', error)
      throw error
    }
  }

  /**
   * Create or update user preferences (upsert)
   */
  async upsertPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      // Get existing preferences first
      const existing = await this.getPreferences(userId)

      // Merge with updates
      const merged: Partial<UserPreferences> = {
        ...existing,
        ...preferences,
        userId, // Ensure userId is set
      }

      // Upsert to Airtable
      return await this.airtableAdapter.upsertPreferences(userId, merged)
    } catch (error) {
      console.error('Error upserting user preferences:', error)
      throw error
    }
  }
}

