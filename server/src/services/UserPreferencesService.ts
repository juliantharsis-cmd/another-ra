/**
 * User Preferences Service
 * 
 * Legacy service interface that now uses the new PreferencesService
 * under the hood. This maintains backward compatibility with existing
 * API endpoints while leveraging the database-agnostic preferences system.
 * 
 * @deprecated This service is now a wrapper around UserPreferencesAdapter.
 * Consider using PreferencesService directly for new code.
 */
import { UserPreferencesAdapter } from './UserPreferencesAdapter'
import { UserPreferences } from '../types/UserPreferences'

export class UserPreferencesService {
  private adapter: UserPreferencesAdapter

  constructor() {
    try {
      this.adapter = new UserPreferencesAdapter()
    } catch (error) {
      console.error('❌ ERROR: Failed to initialize UserPreferencesAdapter:', error)
      throw error
    }
  }

  /**
   * Find preferences by user ID
   * @deprecated Use getPreferences() instead
   */
  async findByUserId(userId: string): Promise<UserPreferences | null> {
    try {
      return await this.adapter.getPreferences(userId)
    } catch (error) {
      console.error('Error finding user preferences:', error)
      return null
    }
  }

  /**
   * Create new user preferences
   * @deprecated Use upsert() instead
   */
  async create(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      return await this.adapter.upsertPreferences(preferences.userId || '', preferences)
    } catch (error) {
      console.error('Error creating user preferences:', error)
      throw error
    }
  }

  /**
   * Update existing user preferences
   * @deprecated Use upsert() instead
   */
  async update(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      return await this.adapter.updatePreferences(userId, preferences)
    } catch (error) {
      console.error('Error updating user preferences:', error)
      throw error
    }
  }

  /**
   * Create or update user preferences (upsert)
   */
  async upsert(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      return await this.adapter.upsertPreferences(userId, preferences)
    } catch (error) {
      console.error('Error upserting user preferences:', error)
      throw error
    }
  }
}

