/**
 * React Hook for User Preferences
 * 
 * Provides easy access to user preferences with caching and reactivity
 */

import { useState, useEffect, useCallback } from 'react'
import { userPreferencesApi, UserPreferences } from '@/lib/api/userPreferences'

/**
 * Hook to get user preferences
 */
export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const prefs = await userPreferencesApi.getPreferences()
        if (!cancelled) {
          setPreferences(prefs)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load preferences'))
          // Set defaults on error
          setPreferences({
            userId: 'default-user',
            language: typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'en',
            dateFormat: 'DD/MM/YYYY',
            timeFormat: '24h',
            timeZone: typeof Intl !== 'undefined' 
              ? Intl.DateTimeFormat().resolvedOptions().timeZone 
              : 'UTC',
            theme: 'system',
            useSchneiderColors: true,
            emailNotifications: true,
            inAppAlerts: true,
            defaultPageSize: 25,
            defaultSortOrder: 'asc',
          })
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  const refresh = useCallback(async () => {
    try {
      setError(null)
      const prefs = await userPreferencesApi.getPreferences()
      setPreferences(prefs)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to refresh preferences')
      setError(error)
      throw error
    }
  }, [])

  return {
    preferences,
    loading,
    error,
    refresh,
    // Convenience getters
    defaultPageSize: preferences?.defaultPageSize ?? 25,
    language: preferences?.language ?? 'en',
    dateFormat: preferences?.dateFormat ?? 'DD/MM/YYYY',
    timeFormat: preferences?.timeFormat ?? '24h',
    timeZone: preferences?.timeZone ?? 'UTC',
    theme: preferences?.theme ?? 'system',
  }
}

