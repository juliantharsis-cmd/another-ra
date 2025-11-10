/**
 * Formatting Utilities
 * 
 * Provides consistent formatting for numbers, dates, and locations
 * based on user preferences and locale settings.
 */

import { UserPreferences } from '@/lib/api/userPreferences'

/**
 * Format a number according to user preferences
 */
export function formatNumber(
  value: number | null | undefined,
  preferences?: UserPreferences | null,
  options?: {
    decimals?: number
    minimumDecimals?: number
    maximumDecimals?: number
    useGrouping?: boolean
  }
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—'
  }

  // Get locale from preferences or browser default
  const locale = preferences?.language 
    ? (preferences.language.includes('-') ? preferences.language : `${preferences.language}-${preferences.language.toUpperCase()}`)
    : (typeof navigator !== 'undefined' ? navigator.language : 'en-US')

  // Determine decimal places
  const minimumFractionDigits = options?.minimumDecimals ?? options?.decimals ?? 0
  const maximumFractionDigits = options?.maximumDecimals ?? options?.decimals ?? 6

  // Format number with locale
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping: options?.useGrouping !== false, // Default to true (thousand separators)
  })

  return formatter.format(value)
}

/**
 * Format a date according to user preferences
 */
export function formatDate(
  date: string | Date | null | undefined,
  preferences?: UserPreferences | null,
  options?: {
    includeTime?: boolean
    timeZone?: string
  }
): string {
  if (!date) {
    return '—'
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return '—'
  }

  // Get locale from preferences
  const locale = preferences?.language 
    ? (preferences.language.includes('-') ? preferences.language : `${preferences.language}-${preferences.language.toUpperCase()}`)
    : (typeof navigator !== 'undefined' ? navigator.language : 'en-US')

  // Get timezone from preferences or options
  const timeZone = options?.timeZone || preferences?.timeZone || 'UTC'

  // Format date based on user preference
  const dateFormat = preferences?.dateFormat || 'DD/MM/YYYY'
  
  // Map date format to Intl.DateTimeFormat options
  let dateStyle: 'full' | 'long' | 'medium' | 'short' | undefined
  let timeStyle: 'full' | 'long' | 'medium' | 'short' | undefined
  
  if (dateFormat === 'YYYY-MM-DD') {
    dateStyle = 'short'
  } else if (dateFormat === 'MM/DD/YYYY') {
    dateStyle = 'short'
  } else {
    dateStyle = 'short'
  }

  if (options?.includeTime) {
    timeStyle = preferences?.timeFormat === '12h' ? 'short' : 'short'
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle,
    timeStyle,
    timeZone,
  })

  // Custom format if needed to match exact preference
  if (dateFormat === 'YYYY-MM-DD') {
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    let formatted = `${year}-${month}-${day}`
    
    if (options?.includeTime) {
      const hours = String(dateObj.getHours()).padStart(2, '0')
      const minutes = String(dateObj.getMinutes()).padStart(2, '0')
      const seconds = options?.includeTime ? String(dateObj.getSeconds()).padStart(2, '0') : ''
      
      if (preferences?.timeFormat === '12h') {
        const hour12 = dateObj.getHours() % 12 || 12
        const ampm = dateObj.getHours() >= 12 ? 'PM' : 'AM'
        formatted += ` ${hour12}:${minutes}${seconds ? ':' + seconds : ''} ${ampm}`
      } else {
        formatted += ` ${hours}:${minutes}${seconds ? ':' + seconds : ''}`
      }
    }
    
    return formatted
  } else if (dateFormat === 'MM/DD/YYYY') {
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    let formatted = `${month}/${day}/${year}`
    
    if (options?.includeTime) {
      const hours = String(dateObj.getHours()).padStart(2, '0')
      const minutes = String(dateObj.getMinutes()).padStart(2, '0')
      const seconds = options?.includeTime ? String(dateObj.getSeconds()).padStart(2, '0') : ''
      
      if (preferences?.timeFormat === '12h') {
        const hour12 = dateObj.getHours() % 12 || 12
        const ampm = dateObj.getHours() >= 12 ? 'PM' : 'AM'
        formatted += ` ${hour12}:${minutes}${seconds ? ':' + seconds : ''} ${ampm}`
      } else {
        formatted += ` ${hours}:${minutes}${seconds ? ':' + seconds : ''}`
      }
    }
    
    return formatted
  } else {
    // DD/MM/YYYY (default)
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    let formatted = `${day}/${month}/${year}`
    
    if (options?.includeTime) {
      const hours = String(dateObj.getHours()).padStart(2, '0')
      const minutes = String(dateObj.getMinutes()).padStart(2, '0')
      const seconds = options?.includeTime ? String(dateObj.getSeconds()).padStart(2, '0') : ''
      
      if (preferences?.timeFormat === '12h') {
        const hour12 = dateObj.getHours() % 12 || 12
        const ampm = dateObj.getHours() >= 12 ? 'PM' : 'AM'
        formatted += ` ${hour12}:${minutes}${seconds ? ':' + seconds : ''} ${ampm}`
      } else {
        formatted += ` ${hours}:${minutes}${seconds ? ':' + seconds : ''}`
      }
    }
    
    return formatted
  }
}

/**
 * Format a currency value according to user preferences
 */
export function formatCurrency(
  value: number | null | undefined,
  currency: string = 'USD',
  preferences?: UserPreferences | null,
  options?: {
    decimals?: number
    minimumDecimals?: number
    maximumDecimals?: number
  }
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—'
  }

  const locale = preferences?.language 
    ? (preferences.language.includes('-') ? preferences.language : `${preferences.language}-${preferences.language.toUpperCase()}`)
    : (typeof navigator !== 'undefined' ? navigator.language : 'en-US')

  const minimumFractionDigits = options?.minimumDecimals ?? options?.decimals ?? 2
  const maximumFractionDigits = options?.maximumDecimals ?? options?.decimals ?? 2

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  })

  return formatter.format(value)
}

/**
 * Format a percentage value according to user preferences
 */
export function formatPercent(
  value: number | null | undefined,
  preferences?: UserPreferences | null,
  options?: {
    decimals?: number
    minimumDecimals?: number
    maximumDecimals?: number
  }
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—'
  }

  const locale = preferences?.language 
    ? (preferences.language.includes('-') ? preferences.language : `${preferences.language}-${preferences.language.toUpperCase()}`)
    : (typeof navigator !== 'undefined' ? navigator.language : 'en-US')

  const minimumFractionDigits = options?.minimumDecimals ?? options?.decimals ?? 0
  const maximumFractionDigits = options?.maximumDecimals ?? options?.decimals ?? 2

  const formatter = new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits,
  })

  return formatter.format(value / 100) // Convert from decimal to percentage
}

/**
 * Format a location/address field
 */
export function formatLocation(
  value: string | null | undefined,
  preferences?: UserPreferences | null
): string {
  if (!value) {
    return '—'
  }

  // For now, just return the value as-is
  // Future: Could format based on locale conventions
  return value
}

