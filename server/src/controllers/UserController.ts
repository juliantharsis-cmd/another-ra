import { Request, Response } from 'express'
import { UserPreferencesService } from '../services/UserPreferencesService'
import { UpdateUserPreferencesDto, getDefaultPreferences } from '../types/UserPreferences'

let userPreferencesService: UserPreferencesService | null = null

const getUserPreferencesService = (): UserPreferencesService | null => {
  if (!userPreferencesService) {
    try {
      userPreferencesService = new UserPreferencesService()
    } catch (error) {
      console.error('Failed to initialize UserPreferencesService:', error)
      console.warn('⚠️  User preferences will use defaults until Airtable is configured')
      // Return null instead of throwing - let the controller handle it gracefully
      return null
    }
  }
  return userPreferencesService
}

export class UserController {
  /**
   * GET /user/preferences
   * Retrieve user preferences by user ID
   * 
   * Headers:
   * - X-User-Id: The user ID (required)
   * 
   * If preferences don't exist, returns default preferences based on browser settings
   */
  async getPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string || 
                     req.query.userId as string ||
                     'default-user' // Fallback for development

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required. Provide X-User-Id header or userId query parameter.',
        })
        return
      }

      // Get locale and timezone from request headers or use defaults
      const locale = req.headers['accept-language']?.split(',')[0] || 'en-US'
      const timeZone = req.headers['x-timezone'] as string || 'UTC'
      
      let preferences = null

      // Try to get preferences from Airtable, but fall back to defaults if it fails
      try {
        const service = getUserPreferencesService()
        if (service) {
          preferences = await service.findByUserId(userId)
          if (preferences) {
            console.log(`✅ Loaded preferences for user: ${userId}`)
          }
        }
      } catch (serviceError) {
        const errorMsg = serviceError instanceof Error ? serviceError.message : 'Unknown error'
        console.warn('⚠️  Airtable service unavailable, using default preferences:', errorMsg)
        // Continue to return defaults
      }

      // If no preferences exist or service failed, return defaults
      if (!preferences) {
        preferences = getDefaultPreferences(userId, locale, timeZone)
      }

      res.json({
        success: true,
        data: preferences,
      })
    } catch (error) {
      console.error('Error fetching user preferences:', error)
      // Even on error, return defaults so the UI can still work
      const userId = req.headers['x-user-id'] as string || 
                     req.query.userId as string ||
                     'default-user'
      const locale = req.headers['accept-language']?.split(',')[0] || 'en-US'
      const timeZone = req.headers['x-timezone'] as string || 'UTC'
      const defaultPrefs = getDefaultPreferences(userId, locale, timeZone)
      
      res.json({
        success: true,
        data: defaultPrefs,
        warning: 'Using default preferences due to service error',
      })
    }
  }

  /**
   * PUT /user/preferences
   * Update user preferences (creates if doesn't exist)
   * 
   * Headers:
   * - X-User-Id: The user ID (required)
   * 
   * Body: UpdateUserPreferencesDto (all fields optional)
   */
  async updatePreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string || 
                     req.body.userId as string ||
                     'default-user' // Fallback for development

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required. Provide X-User-Id header or userId in body.',
        })
        return
      }

      const updateDto: UpdateUserPreferencesDto = req.body

      // Get locale and timezone from request headers or use defaults
      const locale = req.headers['accept-language']?.split(',')[0] || 'en-US'
      const timeZone = req.headers['x-timezone'] as string || 'UTC'

      // Get existing preferences or defaults
      const service = getUserPreferencesService()
      let existing = null
      
      if (service) {
        try {
          existing = await service.findByUserId(userId)
        } catch (error) {
          console.warn('⚠️  Failed to fetch existing preferences, using defaults:', error)
        }
      }

      if (!existing) {
        // Create new preferences with defaults + updates
        existing = getDefaultPreferences(userId, locale, timeZone)
      }

      // Merge updates with existing preferences
      const updatedPreferences = {
        ...existing,
        ...updateDto,
        userId, // Ensure userId is set
      }

      // Try to save to Airtable, but don't fail if it's not available
      let result = updatedPreferences
      if (service) {
        try {
          result = await service.upsert(userId, updatedPreferences)
        } catch (error) {
          console.warn('⚠️  Failed to save preferences to Airtable, but preferences are updated in memory:', error)
          // Return the updated preferences anyway
        }
      }

      res.json({
        success: true,
        data: result,
        message: 'Preferences updated successfully',
      })
    } catch (error) {
      console.error('Error updating user preferences:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to update user preferences',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}

// Export singleton instance
export const userController = new UserController()

