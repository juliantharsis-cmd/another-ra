/**
 * React Hook for Formatting
 * 
 * Provides formatting functions that automatically use user preferences
 */

import { useUserPreferences } from './useUserPreferences'
import { formatNumber, formatDate, formatCurrency, formatPercent, formatLocation } from '@/lib/formatters'

export function useFormatters() {
  const { preferences } = useUserPreferences()

  return {
    formatNumber: (value: number | null | undefined, options?: {
      decimals?: number
      minimumDecimals?: number
      maximumDecimals?: number
      useGrouping?: boolean
    }) => formatNumber(value, preferences, options),
    
    formatDate: (date: string | Date | null | undefined, options?: {
      includeTime?: boolean
      timeZone?: string
    }) => formatDate(date, preferences, options),
    
    formatCurrency: (value: number | null | undefined, currency?: string, options?: {
      decimals?: number
      minimumDecimals?: number
      maximumDecimals?: number
    }) => formatCurrency(value, currency, preferences, options),
    
    formatPercent: (value: number | null | undefined, options?: {
      decimals?: number
      minimumDecimals?: number
      maximumDecimals?: number
    }) => formatPercent(value, preferences, options),
    
    formatLocation: (value: string | null | undefined) => formatLocation(value, preferences),
  }
}

