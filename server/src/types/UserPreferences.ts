/**
 * User Preferences Types
 * 
 * Defines the structure for user preferences that can be customized
 * by logged-in users.
 */

export interface UserPreferences {
  userId: string
  // Language & Locale
  language: string // ISO 639-1 language code (e.g., 'en', 'fr', 'de')
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  timeFormat: '12h' | '24h'
  
  // Time Zone
  timeZone: string // IANA timezone (e.g., 'America/New_York', 'Europe/Paris')
  
  // Theme & Appearance
  theme: 'light' | 'dark' | 'system'
  useSchneiderColors: boolean // Use Schneider Electric color palette
  
  // Notification Settings
  emailNotifications: boolean
  inAppAlerts: boolean
  
  // Data Display Settings
  defaultPageSize: number // Default rows per page (10, 25, 50, 100)
  defaultSortField?: string
  defaultSortOrder: 'asc' | 'desc'
  
  // Metadata
  createdAt?: string
  updatedAt?: string
}

export interface CreateUserPreferencesDto {
  language?: string
  dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  timeFormat?: '12h' | '24h'
  timeZone?: string
  theme?: 'light' | 'dark' | 'system'
  useSchneiderColors?: boolean
  emailNotifications?: boolean
  inAppAlerts?: boolean
  defaultPageSize?: number
  defaultSortField?: string
  defaultSortOrder?: 'asc' | 'desc'
}

export interface UpdateUserPreferencesDto extends CreateUserPreferencesDto {}

/**
 * Default preferences based on browser/regional settings
 * Note: This function should be called from the client side or with locale/timezone passed in
 */
export function getDefaultPreferences(
  userId: string,
  locale: string = 'en-US',
  timeZone: string = 'UTC'
): UserPreferences {
  const language = locale.split('-')[0] // Extract language code
  
  // Detect date format based on locale
  const dateFormat = detectDateFormat(locale)
  
  // Detect time format based on locale
  const timeFormat = detectTimeFormat(locale)
  
  return {
    userId,
    language,
    dateFormat,
    timeFormat,
    timeZone,
    theme: 'system',
    useSchneiderColors: true,
    emailNotifications: true,
    inAppAlerts: true,
    defaultPageSize: 25,
    defaultSortOrder: 'asc',
  }
}

/**
 * Detect date format preference based on locale
 */
function detectDateFormat(locale: string): 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' {
  // US, Canada use MM/DD/YYYY
  if (locale.startsWith('en-US') || locale.startsWith('en-CA')) {
    return 'MM/DD/YYYY'
  }
  
  // ISO format for some locales
  if (locale.startsWith('en-GB') || locale.startsWith('en-AU')) {
    return 'DD/MM/YYYY'
  }
  
  // Most European countries use DD/MM/YYYY
  const europeanLocales = ['fr', 'de', 'es', 'it', 'pt', 'nl', 'pl', 'ru']
  if (europeanLocales.some(lang => locale.startsWith(lang))) {
    return 'DD/MM/YYYY'
  }
  
  // Default to ISO format
  return 'YYYY-MM-DD'
}

/**
 * Detect time format preference based on locale
 */
function detectTimeFormat(locale: string): '12h' | '24h' {
  // US, Canada, Philippines use 12h format
  const twelveHourLocales = ['en-US', 'en-CA', 'en-PH', 'es-MX']
  if (twelveHourLocales.some(loc => locale.startsWith(loc))) {
    return '12h'
  }
  
  // Most other countries use 24h format
  return '24h'
}

