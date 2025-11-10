/**
 * React Hook for User Preferences
 * 
 * Provides easy access to user preferences with caching and reactivity
 */

import { useState, useEffect, useCallback } from 'react'
import { preferencesApi, PreferenceRecord, PreferenceNamespace, PreferenceType, SetPreferenceOptions } from '@/lib/api/preferences'

/**
 * Hook to get a single preference
 */
export function usePreference<T = any>(
  key: string,
  namespace: PreferenceNamespace = 'misc',
  tableId?: string,
  scopeId?: string,
  defaultValue?: T
) {
  const [preference, setPreference] = useState<PreferenceRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const pref = await preferencesApi.get(key, namespace, undefined, tableId, scopeId)
        if (!cancelled) {
          setPreference(pref)
          if (!pref && defaultValue !== undefined) {
            // Set default value if preference doesn't exist
            const defaultPref = await preferencesApi.set(
              key,
              defaultValue,
              typeof defaultValue === 'number' ? 'number' :
              typeof defaultValue === 'boolean' ? 'boolean' :
              typeof defaultValue === 'object' ? 'json' : 'string',
              { namespace, tableId, scopeId }
            )
            setPreference(defaultPref)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load preference'))
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
  }, [key, namespace, tableId, scopeId, defaultValue])

  const update = useCallback(async (
    value: T,
    type?: PreferenceType,
    options?: SetPreferenceOptions
  ) => {
    try {
      setError(null)
      const inferredType: PreferenceType = type || (
        typeof value === 'number' ? 'number' :
        typeof value === 'boolean' ? 'boolean' :
        typeof value === 'object' ? 'json' : 'string'
      )
      const updated = await preferencesApi.set(
        key,
        value as any,
        inferredType,
        { ...options, namespace, tableId, scopeId }
      )
      setPreference(updated)
      return updated
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update preference')
      setError(error)
      throw error
    }
  }, [key, namespace, tableId, scopeId])

  const remove = useCallback(async () => {
    try {
      setError(null)
      await preferencesApi.delete(key, namespace, undefined, tableId, scopeId)
      setPreference(null)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete preference')
      setError(error)
      throw error
    }
  }, [key, namespace, tableId, scopeId])

  return {
    preference,
    value: preference?.value as T | undefined,
    loading,
    error,
    update,
    remove,
  }
}

/**
 * Hook to get all preferences for a user
 */
export function usePreferences(namespace?: PreferenceNamespace, tableId?: string) {
  const [preferences, setPreferences] = useState<PreferenceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const prefs = await preferencesApi.getAll(undefined, {
          namespace,
          tableId,
        })
        if (!cancelled) {
          setPreferences(prefs)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load preferences'))
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
  }, [namespace, tableId])

  const refresh = useCallback(async () => {
    try {
      setError(null)
      const prefs = await preferencesApi.getAll(undefined, {
        namespace,
        tableId,
      })
      setPreferences(prefs)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to refresh preferences')
      setError(error)
      throw error
    }
  }, [namespace, tableId])

  return {
    preferences,
    loading,
    error,
    refresh,
  }
}

