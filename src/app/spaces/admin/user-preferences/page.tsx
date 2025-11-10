'use client'

import { useState, useEffect } from 'react'
import { userPreferencesApi, UserPreferences, UpdateUserPreferencesDto } from '@/lib/api/userPreferences'
import Notification from '@/components/Notification'

// Timezone options (common timezones)
const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Europe/Rome', label: 'Rome' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Asia/Dubai', label: 'Dubai' },
  { value: 'Australia/Sydney', label: 'Sydney' },
]

// Language options
const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
]

// Date format options
const DATE_FORMAT_OPTIONS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (e.g., 25/12/2024)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (e.g., 12/25/2024)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (e.g., 2024-12-25)' },
]

// Page size options
const PAGE_SIZE_OPTIONS = [
  { value: 10, label: '10 rows' },
  { value: 25, label: '25 rows' },
  { value: 50, label: '50 rows' },
  { value: 100, label: '100 rows' },
]

export default function UserPreferencesPage() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
  } | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalPreferences, setOriginalPreferences] = useState<UserPreferences | null>(null)

  // Load preferences on mount
  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      setLoading(true)
      const data = await userPreferencesApi.getPreferences()
      setPreferences(data)
      setOriginalPreferences(data)
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to load preferences:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error details:', errorMessage)
      
      // Use default preferences even if API fails
      const defaultPrefs: UserPreferences = {
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
      }
      setPreferences(defaultPrefs)
      setOriginalPreferences(defaultPrefs)
      setHasChanges(false)
      
      // Check if it's a network error (backend not running) vs API error
      const isNetworkError = errorMessage.includes('Backend server is not running') || 
                           errorMessage.includes('Failed to fetch') || 
                           errorMessage.includes('NetworkError') ||
                           errorMessage.includes('ERR_CONNECTION_REFUSED')
      
      setNotification({
        message: isNetworkError 
          ? 'Backend server is not running. Please start the server on port 3001.'
          : `Using default preferences. API connection failed: ${errorMessage}`,
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof UpdateUserPreferencesDto, value: any) => {
    if (!preferences) return

    setPreferences({
      ...preferences,
      [field]: value,
    })
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!preferences || !originalPreferences) return

    try {
      setSaving(true)
      const updates: UpdateUserPreferencesDto = {}

      // Only send changed fields
      Object.keys(preferences).forEach((key) => {
        const typedKey = key as keyof UserPreferences
        if (preferences[typedKey] !== originalPreferences[typedKey]) {
          updates[typedKey as keyof UpdateUserPreferencesDto] = preferences[typedKey] as any
        }
      })

      const updated = await userPreferencesApi.updatePreferences(updates)
      setPreferences(updated)
      setOriginalPreferences(updated)
      setHasChanges(false)
      setNotification({
        message: 'Preferences saved successfully!',
        type: 'success',
      })
    } catch (error) {
      console.error('Failed to save preferences:', error)
      setNotification({
        message: 'Failed to save preferences. Please try again.',
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (originalPreferences) {
      setPreferences(originalPreferences)
      setHasChanges(false)
    }
  }

  // Auto-detect timezone
  const detectedTimezone = typeof window !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : 'UTC'

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-3 text-neutral-600">Loading preferences...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!preferences) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
          <p className="text-neutral-600">Failed to load preferences.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">User Preferences</h1>
        <p className="text-neutral-600">
          Customize your application settings and preferences
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
        {/* Language & Locale Section */}
        <section className="p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Language & Locale</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Language
              </label>
              <select
                value={preferences.language}
                onChange={(e) => handleChange('language', e.target.value)}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-neutral-400"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Date Format
              </label>
              <select
                value={preferences.dateFormat}
                onChange={(e) => handleChange('dateFormat', e.target.value)}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-neutral-400"
              >
                {DATE_FORMAT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Time Format
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="timeFormat"
                    value="12h"
                    checked={preferences.timeFormat === '12h'}
                    onChange={(e) => handleChange('timeFormat', e.target.value)}
                    className="mr-2 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-neutral-700">12-hour (AM/PM)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="timeFormat"
                    value="24h"
                    checked={preferences.timeFormat === '24h'}
                    onChange={(e) => handleChange('timeFormat', e.target.value)}
                    className="mr-2 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-neutral-700">24-hour</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Time Zone Section */}
        <section className="p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Time Zone</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Time Zone
              </label>
              <select
                value={preferences.timeZone}
                onChange={(e) => handleChange('timeZone', e.target.value)}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-neutral-400"
              >
                {TIMEZONE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-neutral-500">
                Detected: {detectedTimezone}
              </p>
            </div>
          </div>
        </section>

        {/* Theme & Appearance Section */}
        <section className="p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Theme & Appearance</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Theme
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={preferences.theme === 'light'}
                    onChange={(e) => handleChange('theme', e.target.value)}
                    className="mr-2 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-neutral-700">Light</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={preferences.theme === 'dark'}
                    onChange={(e) => handleChange('theme', e.target.value)}
                    className="mr-2 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-neutral-700">Dark</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="theme"
                    value="system"
                    checked={preferences.theme === 'system'}
                    onChange={(e) => handleChange('theme', e.target.value)}
                    className="mr-2 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-neutral-700">System</span>
                </label>
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.useSchneiderColors}
                  onChange={(e) => handleChange('useSchneiderColors', e.target.checked)}
                  className="mr-2 text-green-600 focus:ring-green-500 rounded"
                />
                <span className="text-sm font-medium text-neutral-700">
                  Use Schneider Electric color palette
                </span>
              </label>
              <p className="mt-1 text-xs text-neutral-500 ml-6">
                Apply Schneider Electric brand colors (green accents, grey shades)
              </p>
            </div>
          </div>
        </section>

        {/* Notification Settings Section */}
        <section className="p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Notification Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                  className="mr-2 text-green-600 focus:ring-green-500 rounded"
                />
                <span className="text-sm font-medium text-neutral-700">
                  Email Notifications
                </span>
              </label>
              <p className="mt-1 text-xs text-neutral-500 ml-6">
                Receive email notifications for important updates
              </p>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.inAppAlerts}
                  onChange={(e) => handleChange('inAppAlerts', e.target.checked)}
                  className="mr-2 text-green-600 focus:ring-green-500 rounded"
                />
                <span className="text-sm font-medium text-neutral-700">
                  In-App Alerts
                </span>
              </label>
              <p className="mt-1 text-xs text-neutral-500 ml-6">
                Show in-app notification alerts
              </p>
            </div>
          </div>
        </section>

        {/* Data Display Settings Section */}
        <section className="p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Data Display Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Default Page Size
              </label>
              <select
                value={preferences.defaultPageSize}
                onChange={(e) => handleChange('defaultPageSize', parseInt(e.target.value))}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-neutral-400"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Default Sort Order
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="defaultSortOrder"
                    value="asc"
                    checked={preferences.defaultSortOrder === 'asc'}
                    onChange={(e) => handleChange('defaultSortOrder', e.target.value)}
                    className="mr-2 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-neutral-700">Ascending (A-Z)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="defaultSortOrder"
                    value="desc"
                    checked={preferences.defaultSortOrder === 'desc'}
                    onChange={(e) => handleChange('defaultSortOrder', e.target.value)}
                    className="mr-2 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-neutral-700">Descending (Z-A)</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="p-6 border-t border-neutral-200 bg-neutral-50 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            disabled={!hasChanges || saving}
            className="px-6 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="px-6 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  )
}

