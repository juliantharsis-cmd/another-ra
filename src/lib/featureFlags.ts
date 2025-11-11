/**
 * Feature Flags Utility
 * 
 * Simple feature flag system for gating new features
 * Supports runtime overrides via localStorage
 */

type FeatureFlag = 
  | 'tableActionsV2' 
  | 'columnResizeV2' 
  | 'ghgTypes' 
  | 'emissionFactorVersion' 
  | 'emissionFactorGwp'
  | 'geography'
  | 'companies'
  | 'tableVirtualScrolling' 
  | 'tablePrefetching' 
  | 'tableDataCaching'
  | 'applicationList'
  | 'userPreferences'
  | 'settingsModal'
  | 'tableConfiguration'
  | 'detailPanelLayout'
  | 'loadingProgressBar'
  | 'userManagement'
  | 'userRoles'
  | 'columnAutoSizing'
  | 'persistentFiltering'
  | 'industryClassification'
  | 'welcomeDashboard'
  | 'aiAssistant'
  | 'notifications'
  | 'integrations'
  | 'normalizedActivities'
  | 'efDetailedG'
  | 'scope'
  | 'scopeCategorisation'
  | 'unit'
  | 'unitConversion'
  | 'standardECMCatalog'
  | 'standardECMClassification'

const featureFlags: Record<FeatureFlag, boolean> = {
  tableActionsV2: process.env.NEXT_PUBLIC_FEATURE_TABLE_ACTIONS_V2 === 'true' || true, // Default to true for development
  columnResizeV2: process.env.NEXT_PUBLIC_FEATURE_COLUMN_RESIZE_V2 === 'true' || true, // Default to true for development
  userTable: process.env.NEXT_PUBLIC_FEATURE_USER_TABLE === 'true' || process.env.NODE_ENV === 'development',
  emissionFactorVersion: process.env.NEXT_PUBLIC_FEATURE_EMISSION_FACTOR_VERSION === 'true' || process.env.NODE_ENV === 'development',
  ghgTypes: process.env.NEXT_PUBLIC_FEATURE_GHG_TYPES === 'true' || process.env.NODE_ENV === 'development', // Default ON in dev, OFF in prod
  emissionFactorGwp: process.env.NEXT_PUBLIC_FEATURE_EMISSION_FACTOR_GWP === 'true' || true, // Default to true
  geography: process.env.NEXT_PUBLIC_FEATURE_GEOGRAPHY === 'true' || true, // Default to true
  companies: process.env.NEXT_PUBLIC_FEATURE_COMPANIES === 'true' || true, // Default to true
  tableVirtualScrolling: process.env.NEXT_PUBLIC_FEATURE_TABLE_VIRTUAL_SCROLLING === 'true' || process.env.NODE_ENV === 'development', // Default ON in dev
  tablePrefetching: process.env.NEXT_PUBLIC_FEATURE_TABLE_PREFETCHING === 'true' || true, // Default to true
  tableDataCaching: process.env.NEXT_PUBLIC_FEATURE_TABLE_DATA_CACHING === 'true' || true, // Default to true
  applicationList: process.env.NEXT_PUBLIC_FEATURE_APPLICATION_LIST === 'true' || true, // Default to true
  userPreferences: process.env.NEXT_PUBLIC_FEATURE_USER_PREFERENCES === 'true' || true, // Default to true
  settingsModal: process.env.NEXT_PUBLIC_FEATURE_SETTINGS_MODAL === 'true' || true, // Default to true
  tableConfiguration: process.env.NEXT_PUBLIC_FEATURE_TABLE_CONFIGURATION === 'true' || true, // Default to true
  detailPanelLayout: process.env.NEXT_PUBLIC_FEATURE_DETAIL_PANEL_LAYOUT === 'true' || true, // Default to true
  loadingProgressBar: process.env.NEXT_PUBLIC_FEATURE_LOADING_PROGRESS_BAR === 'true' || true, // Default to true
  userManagement: process.env.NEXT_PUBLIC_FEATURE_USER_MANAGEMENT === 'true' || true, // Default to true
  userRoles: process.env.NEXT_PUBLIC_FEATURE_USER_ROLES === 'true' || true, // Default to true
  columnAutoSizing: process.env.NEXT_PUBLIC_FEATURE_COLUMN_AUTO_SIZING === 'true' || true, // Default to true (requires columnResizeV2)
  persistentFiltering: process.env.NEXT_PUBLIC_FEATURE_PERSISTENT_FILTERING === 'true' || true, // Default to true
  industryClassification: process.env.NEXT_PUBLIC_FEATURE_INDUSTRY_CLASSIFICATION === 'true' || true, // Default to true
  welcomeDashboard: process.env.NEXT_PUBLIC_FEATURE_WELCOME_DASHBOARD === 'true' || true, // Default to true
  aiAssistant: process.env.NEXT_PUBLIC_FEATURE_AI_ASSISTANT === 'true' || true, // Default to true
  notifications: process.env.NEXT_PUBLIC_FEATURE_NOTIFICATIONS === 'true' || true, // Default to true
  integrations: process.env.NEXT_PUBLIC_FEATURE_INTEGRATIONS === 'true' || true, // Default to true
  normalizedActivities: process.env.NEXT_PUBLIC_FEATURE_NORMALIZED_ACTIVITIES === 'true' || true, // Default to true
  efDetailedG: process.env.NEXT_PUBLIC_FEATURE_EF_DETAILED_G === 'true' || true, // Default to true
  scope: process.env.NEXT_PUBLIC_FEATURE_SCOPE === 'true' || true, // Default to true
  scopeCategorisation: process.env.NEXT_PUBLIC_FEATURE_SCOPE_CATEGORISATION === 'true' || true, // Default to true
  unit: process.env.NEXT_PUBLIC_FEATURE_UNIT === 'true' || true, // Default to true
  unitConversion: process.env.NEXT_PUBLIC_FEATURE_UNIT_CONVERSION === 'true' || true, // Default to true
  standardECMCatalog: process.env.NEXT_PUBLIC_FEATURE_STANDARD_ECM_CATALOG === 'true' || true, // Default to true
  standardECMClassification: process.env.NEXT_PUBLIC_FEATURE_STANDARD_ECM_CLASSIFICATION === 'true' || true, // Default to true
}

/**
 * Get feature flag override from localStorage
 */
function getFeatureFlagOverride(flag: FeatureFlag): boolean | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(`featureFlag:${flag}`)
  if (stored === null) return null
  return stored === 'true'
}

/**
 * Get all feature flag overrides from localStorage
 */
export function getFeatureFlagOverrides(): Record<FeatureFlag, boolean> {
  if (typeof window === 'undefined') return {} as Record<FeatureFlag, boolean>
  const overrides: Partial<Record<FeatureFlag, boolean>> = {}
  Object.keys(featureFlags).forEach((key) => {
    const override = getFeatureFlagOverride(key as FeatureFlag)
    if (override !== null) {
      overrides[key as FeatureFlag] = override
    }
  })
  return overrides as Record<FeatureFlag, boolean>
}

/**
 * Set feature flag override in localStorage
 */
export function setFeatureFlag(flag: FeatureFlag, value: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`featureFlag:${flag}`, value.toString())
}

/**
 * Clear feature flag override from localStorage
 */
export function clearFeatureFlag(flag: FeatureFlag): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(`featureFlag:${flag}`)
}

/**
 * Clear all feature flag overrides from localStorage
 */
export function clearAllFeatureFlags(): void {
  if (typeof window === 'undefined') return
  Object.keys(featureFlags).forEach((key) => {
    localStorage.removeItem(`featureFlag:${key}`)
  })
}

/**
 * Get the effective value of a feature flag (default or override)
 */
function getFeatureFlagValue(flag: FeatureFlag): boolean {
  const override = getFeatureFlagOverride(flag)
  if (override !== null) {
    return override
  }
  return featureFlags[flag] ?? false
}

/**
 * Check if a feature flag is enabled
 * Checks localStorage override first, then falls back to default
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return getFeatureFlagValue(flag)
}

/**
 * Get all feature flags (for debugging)
 * Returns effective values (defaults + overrides)
 */
export function getAllFeatureFlags(): Record<FeatureFlag, boolean> {
  const result: Record<FeatureFlag, boolean> = {} as Record<FeatureFlag, boolean>
  Object.keys(featureFlags).forEach((key) => {
    result[key as FeatureFlag] = getFeatureFlagValue(key as FeatureFlag)
  })
  return result
}

// Export type for use in other files
export type { FeatureFlag }

