'use client'

import { useState, useEffect } from 'react'
import { userPreferencesApi, UserPreferences } from '@/lib/api/userPreferences'
import Link from 'next/link'
import { UserIcon } from './icons'

export default function UserPreferencesDisplay() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const data = await userPreferencesApi.getPreferences()
      setPreferences(data)
    } catch (error) {
      console.error('Failed to load preferences:', error)
      // Use defaults
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
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-neutral-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!preferences) return null

  const formatPreference = (key: string, value: any): string => {
    switch (key) {
      case 'language':
        return value.toUpperCase()
      case 'dateFormat':
        return value
      case 'timeFormat':
        return value === '12h' ? '12-hour' : '24-hour'
      case 'timeZone':
        return value.split('/').pop()?.replace('_', ' ') || value
      case 'theme':
        return value.charAt(0).toUpperCase() + value.slice(1)
      case 'defaultPageSize':
        return `${value} rows`
      case 'defaultSortOrder':
        return value === 'asc' ? 'Ascending' : 'Descending'
      case 'useSchneiderColors':
      case 'emailNotifications':
      case 'inAppAlerts':
        return value ? 'Enabled' : 'Disabled'
      default:
        return String(value)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <UserIcon className="w-5 h-5 text-green-600" />
          <h3 className="text-sm font-semibold text-neutral-900">User Preferences</h3>
        </div>
        <Link
          href="/spaces/admin/user-preferences"
          className="text-xs text-green-600 hover:text-green-700 font-medium"
        >
          Edit
        </Link>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-neutral-500">Language:</span>
          <span className="ml-1 text-neutral-700 font-medium">{formatPreference('language', preferences.language)}</span>
        </div>
        <div>
          <span className="text-neutral-500">Date Format:</span>
          <span className="ml-1 text-neutral-700 font-medium">{formatPreference('dateFormat', preferences.dateFormat)}</span>
        </div>
        <div>
          <span className="text-neutral-500">Time Format:</span>
          <span className="ml-1 text-neutral-700 font-medium">{formatPreference('timeFormat', preferences.timeFormat)}</span>
        </div>
        <div>
          <span className="text-neutral-500">Timezone:</span>
          <span className="ml-1 text-neutral-700 font-medium">{formatPreference('timeZone', preferences.timeZone)}</span>
        </div>
        <div>
          <span className="text-neutral-500">Theme:</span>
          <span className="ml-1 text-neutral-700 font-medium">{formatPreference('theme', preferences.theme)}</span>
        </div>
        <div>
          <span className="text-neutral-500">Page Size:</span>
          <span className="ml-1 text-neutral-700 font-medium">{formatPreference('defaultPageSize', preferences.defaultPageSize)}</span>
        </div>
      </div>
    </div>
  )
}

