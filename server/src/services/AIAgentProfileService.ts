/**
 * AI Agent Profile Service
 * 
 * Manages user-specific AI behavior preferences using the Preferences system
 */

import { PreferencesService } from './PreferencesService'
import { PreferenceNamespace } from '../types/Preferences'
import { AIAgentProfile, mergeWithDefaults, DEFAULT_AI_AGENT_PROFILE } from '../types/AIAgentProfile'

export class AIAgentProfileService {
  private preferencesService: PreferencesService
  private readonly NAMESPACE: PreferenceNamespace = 'ai'
  private readonly KEY = 'agentProfile' as const

  constructor() {
    this.preferencesService = new PreferencesService()
  }

  /**
   * Get AI Agent Profile for a user
   * Returns merged profile with defaults if user has no custom profile
   */
  async getProfile(userId: string): Promise<Required<AIAgentProfile>> {
    try {
      const preference = await this.preferencesService.get(
        userId,
        this.KEY,
        this.NAMESPACE
      )

      if (!preference || preference.type !== 'json') {
        // No profile exists, return defaults
        return DEFAULT_AI_AGENT_PROFILE
      }

      // Parse JSON value
      let profile: Partial<AIAgentProfile> = {}
      try {
        if (preference.value) {
          profile = typeof preference.value === 'string' 
            ? JSON.parse(preference.value) 
            : preference.value
        }
      } catch (error) {
        console.warn(`Error parsing AI Agent Profile for user ${userId}:`, error)
        return DEFAULT_AI_AGENT_PROFILE
      }

      // Merge with defaults to ensure all fields are present
      return mergeWithDefaults(profile)
    } catch (error) {
      console.error(`Error fetching AI Agent Profile for user ${userId}:`, error)
      // Return defaults on error
      return DEFAULT_AI_AGENT_PROFILE
    }
  }

  /**
   * Save AI Agent Profile for a user
   */
  async saveProfile(userId: string, profile: Partial<AIAgentProfile>): Promise<void> {
    try {
      // Validate profile (optional - can add validation here)
      const validatedProfile = this.validateProfile(profile)

      // Save as JSON preference
      await this.preferencesService.set(
        userId,
        this.KEY,
        validatedProfile,
        'json',
        {
          namespace: this.NAMESPACE,
        }
      )
    } catch (error) {
      console.error(`Error saving AI Agent Profile for user ${userId}:`, error)
      
      // Provide helpful error message if namespace validation fails
      if (error instanceof Error && error.message.includes('namespace must be one of')) {
        throw new Error(
          `Failed to save AI Agent Profile: The 'ai' namespace is not available in Airtable. ` +
          `Please run the script: npx tsx server/src/scripts/addAiNamespaceToPreferences.ts ` +
          `Or manually add 'ai' as an option to the 'Namespace' field in the 'User Preferences' table in Airtable.`
        )
      }
      
      throw new Error(`Failed to save AI Agent Profile: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete AI Agent Profile for a user (revert to defaults)
   */
  async deleteProfile(userId: string): Promise<void> {
    try {
      await this.preferencesService.delete(
        userId,
        this.KEY,
        this.NAMESPACE
      )
    } catch (error) {
      console.error(`Error deleting AI Agent Profile for user ${userId}:`, error)
      throw new Error(`Failed to delete AI Agent Profile: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Validate and sanitize profile data
   */
  private validateProfile(profile: Partial<AIAgentProfile>): Partial<AIAgentProfile> {
    const validated: Partial<AIAgentProfile> = {}

    // Validate tone
    const validTones: AIAgentProfile['tone'][] = ['analytical', 'conversational', 'professional', 'friendly', 'technical', 'concise']
    if (profile.tone && validTones.includes(profile.tone)) {
      validated.tone = profile.tone
    }

    // Validate detailLevel
    const validDetailLevels: AIAgentProfile['detailLevel'][] = ['low', 'medium', 'high']
    if (profile.detailLevel && validDetailLevels.includes(profile.detailLevel)) {
      validated.detailLevel = profile.detailLevel
    }

    // Validate responseStyle
    const validResponseStyles: AIAgentProfile['responseStyle'][] = ['concise', 'detailed', 'balanced']
    if (profile.responseStyle && validResponseStyles.includes(profile.responseStyle)) {
      validated.responseStyle = profile.responseStyle
    }

    // Validate domainFocus
    const validDomainFocuses: AIAgentProfile['domainFocus'][] = [
      'sustainability_data',
      'energy_data',
      'carbon_emissions',
      'compliance',
      'general',
      'financial',
      'operations',
    ]
    if (profile.domainFocus && validDomainFocuses.includes(profile.domainFocus)) {
      validated.domainFocus = profile.domainFocus
    }

    // Validate customInstructions (sanitize length)
    if (profile.customInstructions !== undefined) {
      validated.customInstructions = String(profile.customInstructions).slice(0, 1000) // Max 1000 chars
    }

    // Validate includeReasoning
    if (profile.includeReasoning !== undefined) {
      validated.includeReasoning = Boolean(profile.includeReasoning)
    }

    // Validate outputFormat
    const validOutputFormats: AIAgentProfile['outputFormat'][] = ['paragraph', 'bullet_points', 'structured', 'mixed']
    if (profile.outputFormat && validOutputFormats.includes(profile.outputFormat)) {
      validated.outputFormat = profile.outputFormat
    }

    // Validate language (ISO 639-1 code, 2-3 characters)
    if (profile.language && /^[a-z]{2,3}$/i.test(profile.language)) {
      validated.language = profile.language.toLowerCase()
    }

    return validated
  }
}

