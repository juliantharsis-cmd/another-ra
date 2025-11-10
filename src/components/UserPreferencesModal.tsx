'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { XMarkIcon } from './icons'
import { userPreferencesApi, UserPreferences, UpdateUserPreferencesDto } from '@/lib/api/userPreferences'
import Notification from './Notification'

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

interface PreferenceSection {
  id: string
  title: string
  description?: string
  defaultExpanded?: boolean
}

const PREFERENCE_SECTIONS: PreferenceSection[] = [
  {
    id: 'language',
    title: 'Language & Locale',
    description: 'Language, date, and time format preferences',
    defaultExpanded: true,
  },
  {
    id: 'timezone',
    title: 'Time Zone',
    description: 'Timezone settings for date and time display',
    defaultExpanded: true,
  },
  {
    id: 'theme',
    title: 'Theme & Appearance',
    description: 'Visual theme and color preferences',
    defaultExpanded: true,
  },
  {
    id: 'notifications',
    title: 'Notification Settings',
    description: 'Email and in-app notification preferences',
    defaultExpanded: false,
  },
  {
    id: 'display',
    title: 'Data Display Settings',
    description: 'Default table and data display preferences',
    defaultExpanded: false,
  },
]

interface UserPreferencesModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function UserPreferencesModal({ isOpen, onClose }: UserPreferencesModalProps) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [originalPreferences, setOriginalPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    return new Set(PREFERENCE_SECTIONS.filter(s => s.defaultExpanded).map(s => s.id))
  })

  // Load preferences when modal opens
  useEffect(() => {
    if (isOpen) {
      loadPreferences()
    }
  }, [isOpen])

  const loadPreferences = async () => {
    try {
      setLoading(true)
      const data = await userPreferencesApi.getPreferences()
      setPreferences(data)
      setOriginalPreferences(data)
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to load preferences:', error)
      // Use default preferences on error
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
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const isNetworkError = errorMessage.includes('Backend server is not running') || 
                           errorMessage.includes('Failed to fetch') ||
                           errorMessage.includes('NetworkError')
      
      setNotification({
        message: isNetworkError 
          ? 'Backend server is not running. Using default preferences.'
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
      
      // Close modal after a short delay to show notification
      setTimeout(() => {
        onClose()
      }, 1000)
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
    onClose()
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  // Use portal to render outside of parent container constraints
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!isOpen || !mounted) return null

  // Auto-detect timezone
  const detectedTimezone = typeof window !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : 'UTC'

  const modalContent = (
    <>
      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
          duration={6000}
        />
      )}

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900 bg-opacity-30 z-40"
        onClick={onClose}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Modal */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'relative', zIndex: 50 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">
                User Preferences
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                Customize your application settings and preferences
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-3 text-neutral-600">Loading preferences...</span>
              </div>
            ) : preferences ? (
              <div className="space-y-4">
                {/* Language & Locale Section */}
                {PREFERENCE_SECTIONS.find(s => s.id === 'language') && (() => {
                  const section = PREFERENCE_SECTIONS.find(s => s.id === 'language')!
                  const isExpanded = expandedSections.has(section.id)
                  return (
                    <div key={section.id} className="border border-neutral-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <svg
                            className={`w-5 h-5 text-neutral-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <div className="text-left">
                            <h4 className="text-sm font-semibold text-neutral-900">{section.title}</h4>
                            {section.description && (
                              <p className="text-xs text-neutral-500 mt-0.5">{section.description}</p>
                            )}
                          </div>
                        </div>
                        <svg
                          className={`w-4 h-4 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isExpanded && (
                        <div className="p-4 space-y-4 bg-white">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                              Language
                            </label>
                            <select
                              value={preferences.language}
                              onChange={(e) => handleChange('language', e.target.value)}
                              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                      )}
                    </div>
                  )
                })()}

                {/* Time Zone Section */}
                {PREFERENCE_SECTIONS.find(s => s.id === 'timezone') && (() => {
                  const section = PREFERENCE_SECTIONS.find(s => s.id === 'timezone')!
                  const isExpanded = expandedSections.has(section.id)
                  return (
                    <div key={section.id} className="border border-neutral-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <svg
                            className={`w-5 h-5 text-neutral-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <div className="text-left">
                            <h4 className="text-sm font-semibold text-neutral-900">{section.title}</h4>
                            {section.description && (
                              <p className="text-xs text-neutral-500 mt-0.5">{section.description}</p>
                            )}
                          </div>
                        </div>
                        <svg
                          className={`w-4 h-4 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isExpanded && (
                        <div className="p-4 bg-white">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                              Time Zone
                            </label>
                            <select
                              value={preferences.timeZone}
                              onChange={(e) => handleChange('timeZone', e.target.value)}
                              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                      )}
                    </div>
                  )
                })()}

                {/* Theme & Appearance Section */}
                {PREFERENCE_SECTIONS.find(s => s.id === 'theme') && (() => {
                  const section = PREFERENCE_SECTIONS.find(s => s.id === 'theme')!
                  const isExpanded = expandedSections.has(section.id)
                  return (
                    <div key={section.id} className="border border-neutral-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <svg
                            className={`w-5 h-5 text-neutral-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <div className="text-left">
                            <h4 className="text-sm font-semibold text-neutral-900">{section.title}</h4>
                            {section.description && (
                              <p className="text-xs text-neutral-500 mt-0.5">{section.description}</p>
                            )}
                          </div>
                        </div>
                        <svg
                          className={`w-4 h-4 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isExpanded && (
                        <div className="p-4 space-y-4 bg-white">
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
                      )}
                    </div>
                  )
                })()}

                {/* Notification Settings Section */}
                {PREFERENCE_SECTIONS.find(s => s.id === 'notifications') && (() => {
                  const section = PREFERENCE_SECTIONS.find(s => s.id === 'notifications')!
                  const isExpanded = expandedSections.has(section.id)
                  return (
                    <div key={section.id} className="border border-neutral-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <svg
                            className={`w-5 h-5 text-neutral-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <div className="text-left">
                            <h4 className="text-sm font-semibold text-neutral-900">{section.title}</h4>
                            {section.description && (
                              <p className="text-xs text-neutral-500 mt-0.5">{section.description}</p>
                            )}
                          </div>
                        </div>
                        <svg
                          className={`w-4 h-4 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isExpanded && (
                        <div className="p-4 space-y-4 bg-white">
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
                      )}
                    </div>
                  )
                })()}

                {/* Data Display Settings Section */}
                {PREFERENCE_SECTIONS.find(s => s.id === 'display') && (() => {
                  const section = PREFERENCE_SECTIONS.find(s => s.id === 'display')!
                  const isExpanded = expandedSections.has(section.id)
                  return (
                    <div key={section.id} className="border border-neutral-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <svg
                            className={`w-5 h-5 text-neutral-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <div className="text-left">
                            <h4 className="text-sm font-semibold text-neutral-900">{section.title}</h4>
                            {section.description && (
                              <p className="text-xs text-neutral-500 mt-0.5">{section.description}</p>
                            )}
                          </div>
                        </div>
                        <svg
                          className={`w-4 h-4 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isExpanded && (
                        <div className="p-4 space-y-4 bg-white">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                              Default Page Size
                            </label>
                            <select
                              value={preferences.defaultPageSize}
                              onChange={(e) => handleChange('defaultPageSize', parseInt(e.target.value))}
                              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                      )}
                    </div>
                  )
                })()}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-neutral-600">Failed to load preferences.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-neutral-200 bg-neutral-50">
            <p className="text-xs text-neutral-500">
              {hasChanges ? 'You have unsaved changes' : 'All changes saved'}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  // Render modal using portal to document.body to escape parent container constraints
  return createPortal(modalContent, document.body)
}



