'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { XMarkIcon } from './icons'
import { getAllFeatureFlags, isFeatureEnabled, type FeatureFlag, setFeatureFlag, getFeatureFlagOverrides, clearFeatureFlag } from '@/lib/featureFlags'
import Notification from './Notification'
import IntegrationMarketplace from './IntegrationMarketplace'
import { useDeveloperMode } from '@/contexts/DeveloperModeContext'

interface FeatureFlagInfo {
  key: FeatureFlag
  label: string
  description: string
  section: 'ui' | 'performance' | 'userManagement' | 'emissionManagement' | 'applicationSettings' | 'organizationStructure'
}

interface FeatureSection {
  id: string
  title: string
  description?: string
  flags: FeatureFlagInfo[]
  defaultExpanded?: boolean
}

const FEATURE_SECTIONS: FeatureSection[] = [
  {
    id: 'ui',
    title: 'User Interface',
    description: 'Visual and interaction features',
    defaultExpanded: true,
    flags: [
      {
        key: 'tableActionsV2',
        label: 'Table Actions V2',
        description: 'Enhanced table header actions with unified import/export/configure menu',
        section: 'ui',
      },
      {
        key: 'columnResizeV2',
        label: 'Column Resize V2',
        description: 'Advanced column resizing with drag-and-drop and auto-sizing',
        section: 'ui',
      },
      {
        key: 'columnAutoSizing',
        label: 'Column Auto-sizing',
        description: 'Auto-size columns based on content with one-click button',
        section: 'ui',
      },
      {
        key: 'detailPanelLayout',
        label: 'Detail Panel Layout',
        description: 'Enable new card-based detail panel layout with organized sections',
        section: 'ui',
      },
      {
        key: 'loadingProgressBar',
        label: 'Loading Progress Bar',
        description: 'Show progress bar during data loading instead of spinner',
        section: 'ui',
      },
      {
        key: 'settingsModal',
        label: 'Settings Modal',
        description: 'Enable settings modal for managing feature flags and application settings',
        section: 'ui',
      },
      {
        key: 'persistentFiltering',
        label: 'Persistent Filtering',
        description: 'Enable persistent filtering - filters are saved and restored across browser sessions',
        section: 'ui',
      },
      {
        key: 'welcomeDashboard',
        label: 'Welcome Dashboard',
        description: 'Enable the welcome dashboard screen shown after login',
        section: 'ui',
      },
      {
        key: 'aiAssistant',
        label: 'AI Assistant',
        description: 'Enable the AI Assistant button and analysis features on the welcome dashboard',
        section: 'ui',
      },
      {
        key: 'notifications',
        label: 'Notifications',
        description: 'Enable the notification center with bell icon badge and notification management',
        section: 'ui',
      },
      {
        key: 'integrations',
        label: 'AI Integrations',
        description: 'Enable AI Integration Marketplace for connecting third-party AI services',
        section: 'ui',
      },
    ],
  },
  {
    id: 'performance',
    title: 'Performance',
    description: 'Optimization features for better speed and responsiveness',
    defaultExpanded: true,
    flags: [
      {
        key: 'tableVirtualScrolling',
        label: 'Table Virtual Scrolling',
        description: 'Virtual scrolling for large tables to improve performance',
        section: 'performance',
      },
      {
        key: 'tablePrefetching',
        label: 'Table Prefetching',
        description: 'Prefetch next page data in background for instant pagination',
        section: 'performance',
      },
      {
        key: 'tableDataCaching',
        label: 'Table Data Caching',
        description: 'Cache table data with stale-while-revalidate pattern',
        section: 'performance',
      },
    ],
  },
  {
    id: 'userManagement',
    title: 'User Management',
    description: 'User-related features and preferences',
    defaultExpanded: false,
    flags: [
      {
        key: 'userManagement',
        label: 'User Management',
        description: 'Enable User Management menu and related features',
        section: 'userManagement',
      },
      {
        key: 'userPreferences',
        label: 'User Preferences',
        description: 'Enable user preferences system for storing user settings',
        section: 'userManagement',
      },
      {
        key: 'userRoles',
        label: 'User Roles',
        description: 'Enable User Roles table and role management features',
        section: 'userManagement',
      },
    ],
  },
  {
    id: 'organizationStructure',
    title: 'Organization Structure',
    description: 'Geography and company management features',
    defaultExpanded: false,
    flags: [
      {
        key: 'geography',
        label: 'Geography',
        description: 'Enable Geography table and location management features',
        section: 'organizationStructure',
      },
      {
        key: 'companies',
        label: 'Companies',
        description: 'Enable Companies table and company management features',
        section: 'organizationStructure',
      },
    ],
  },
  {
    id: 'emissionManagement',
    title: 'Emission Management',
    description: 'Emission factor and GHG type management features',
    defaultExpanded: false,
    flags: [
      {
        key: 'emissionFactorGwp',
        label: 'Emission Factor GWP',
        description: 'Enable Emission Factor GWP table and global warming potential features',
        section: 'emissionManagement',
      },
      {
        key: 'ghgTypes',
        label: 'GHG Types',
        description: 'Enable GHG Type table and management features',
        section: 'emissionManagement',
      },
      {
        key: 'emissionFactorVersion',
        label: 'Emission Factor Version',
        description: 'Enable Emission Factor Version table and versioning features',
        section: 'emissionManagement',
      },
      {
        key: 'industryClassification',
        label: 'Industry Factors',
        description: 'Enable Industry Factors table',
        section: 'emissionManagement',
      },
      {
        key: 'normalizedActivities',
        label: 'Normalized Activities',
        description: 'Enable Normalized Activities table for activity normalization',
        section: 'emissionManagement',
      },
      {
        key: 'efDetailedG',
        label: 'EF/Detailed G',
        description: 'Enable EF/Detailed G table for detailed greenhouse gas emission factors',
        section: 'emissionManagement',
      },
      {
        key: 'scope',
        label: 'Scope',
        description: 'Enable Scope table for emission scope definitions',
        section: 'emissionManagement',
      },
      {
        key: 'scopeCategorisation',
        label: 'Scope & Categorisation',
        description: 'Enable Scope & Categorisation table for scope categorization',
        section: 'emissionManagement',
      },
      {
        key: 'unit',
        label: 'Unit',
        description: 'Enable Unit table for unit definitions and symbols',
        section: 'emissionManagement',
      },
      {
        key: 'unitConversion',
        label: 'Unit Conversion',
        description: 'Enable Unit Conversion table for unit conversion factors',
        section: 'emissionManagement',
      },
      {
        key: 'standardECMCatalog',
        label: 'Standard ECM Catalog',
        description: 'Enable Standard ECM Catalog table for energy conservation measure catalogs',
        section: 'emissionManagement',
      },
      {
        key: 'standardECMClassification',
        label: 'Standard ECM Classification',
        description: 'Enable Standard ECM Classification table for ECM classifications',
        section: 'emissionManagement',
      },
    ],
  },
  {
    id: 'applicationSettings',
    title: 'Application Settings',
    description: 'Application configuration and table management',
    defaultExpanded: false,
    flags: [
      {
        key: 'applicationList',
        label: 'Application List',
        description: 'Enable Application List table and management features',
        section: 'applicationSettings',
      },
      {
        key: 'tableConfiguration',
        label: 'Table Configuration',
        description: 'Enable table configuration system for renaming fields and customizing table schemas',
        section: 'applicationSettings',
      },
    ],
  },
]

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

type PresetMode = 'safe' | 'standard' | 'power' | 'custom'

// Preset configurations
const PRESET_CONFIGURATIONS: Record<PresetMode, Partial<Record<FeatureFlag, boolean>>> = {
  safe: {
    // Essential features only - minimal configuration for recovery
    companies: true,
    geography: true,
    applicationList: true,
    settingsModal: true,
    userPreferences: true,
    // Disable all advanced/experimental features
    tableActionsV2: false,
    columnResizeV2: false,
    columnAutoSizing: false,
    detailPanelLayout: false,
    loadingProgressBar: false,
    persistentFiltering: false,
    welcomeDashboard: false,
    aiAssistant: false,
    notifications: false,
    integrations: false,
    tableVirtualScrolling: false,
    tablePrefetching: false,
    tableDataCaching: false,
    userManagement: false,
    userRoles: false,
    emissionFactorGwp: false,
    emissionFactorVersion: false,
    ghgTypes: false,
    industryClassification: false,
    tableConfiguration: false,
  },
  standard: {
    // Balanced configuration - most common features enabled
    companies: true,
    geography: true,
    applicationList: true,
    settingsModal: true,
    userPreferences: true,
    tableActionsV2: true,
    columnResizeV2: true,
    columnAutoSizing: true,
    detailPanelLayout: true,
    loadingProgressBar: true,
    persistentFiltering: true,
    tablePrefetching: true,
    tableDataCaching: true,
    userManagement: true,
    userRoles: true,
    emissionFactorGwp: true,
    emissionFactorVersion: true,
    ghgTypes: true,
    industryClassification: true,
    tableConfiguration: true,
    notifications: true,
    // Disable experimental/advanced features
    welcomeDashboard: false,
    aiAssistant: false,
    integrations: true,
    tableVirtualScrolling: false,
  },
  power: {
    // All features enabled - maximum functionality
    companies: true,
    geography: true,
    applicationList: true,
    settingsModal: true,
    userPreferences: true,
    tableActionsV2: true,
    columnResizeV2: true,
    columnAutoSizing: true,
    detailPanelLayout: true,
    loadingProgressBar: true,
    persistentFiltering: true,
    welcomeDashboard: true,
    aiAssistant: true,
    notifications: true,
    integrations: true,
    tableVirtualScrolling: true,
    tablePrefetching: true,
    tableDataCaching: true,
    userManagement: true,
    userRoles: true,
    emissionFactorGwp: true,
    emissionFactorVersion: true,
    ghgTypes: true,
    industryClassification: true,
    tableConfiguration: true,
  },
  custom: {}, // Custom mode - no preset applied
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'features' | 'integrations'>('features')
  const [featureFlags, setFeatureFlags] = useState<Record<FeatureFlag, boolean>>({} as Record<FeatureFlag, boolean>)
  const [hasChanges, setHasChanges] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [currentPreset, setCurrentPreset] = useState<PresetMode>('custom')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    // Initialize with default expanded sections
    return new Set(FEATURE_SECTIONS.filter(s => s.defaultExpanded).map(s => s.id))
  })
  const { isDeveloperMode, toggleDeveloperMode } = useDeveloperMode()

  // Detect current preset mode based on feature flags
  const detectPresetMode = (flags: Record<FeatureFlag, boolean>): PresetMode => {
    // Check if flags match a preset
    for (const [preset, config] of Object.entries(PRESET_CONFIGURATIONS)) {
      if (preset === 'custom') continue
      
      let matches = true
      for (const [key, value] of Object.entries(config)) {
        if (flags[key as FeatureFlag] !== value) {
          matches = false
          break
        }
      }
      if (matches) {
        return preset as PresetMode
      }
    }
    return 'custom'
  }

  // Load current feature flags
  useEffect(() => {
    if (isOpen) {
      const currentFlags = getAllFeatureFlags()
      setFeatureFlags(currentFlags)
      setHasChanges(false)
      setCurrentPreset(detectPresetMode(currentFlags))
    }
  }, [isOpen])

  // Handle toggle
  const handleToggle = (flag: FeatureFlag) => {
    const newValue = !featureFlags[flag]
    const updatedFlags = {
      ...featureFlags,
      [flag]: newValue,
    }
    setFeatureFlags(updatedFlags)
    setHasChanges(true)
    setCurrentPreset(detectPresetMode(updatedFlags))
  }

  // Handle preset selection
  const handlePresetSelect = (preset: PresetMode) => {
    if (preset === 'custom') {
      setCurrentPreset('custom')
      return
    }

    const presetConfig = PRESET_CONFIGURATIONS[preset]
    const updatedFlags = { ...featureFlags }
    
    // Apply preset configuration
    Object.entries(presetConfig).forEach(([key, value]) => {
      updatedFlags[key as FeatureFlag] = value
    })
    
    setFeatureFlags(updatedFlags)
    setCurrentPreset(preset)
    setHasChanges(true)
  }

  // Handle save
  const handleSave = () => {
    // Save all changes to localStorage
    Object.entries(featureFlags).forEach(([key, value]) => {
      setFeatureFlag(key as FeatureFlag, value)
    })
    
    setHasChanges(false)
    
    // Show success notification
    setNotification({
      message: 'Feature flags updated. Please refresh the page to see changes.',
      type: 'success',
    })
    
    // Close modal after a short delay to show notification
    setTimeout(() => {
      onClose()
    }, 500)
  }

  // Handle reset
  const handleReset = () => {
    // Clear all overrides
    const overrides = getFeatureFlagOverrides()
    Object.keys(overrides).forEach(key => {
      localStorage.removeItem(`featureFlag:${key}`)
    })
    
    // Reload flags
    const currentFlags = getAllFeatureFlags()
    setFeatureFlags(currentFlags)
    setHasChanges(false)
    
    // Show success notification
    setNotification({
      message: 'Feature flags reset to defaults. Please refresh the page to see changes.',
      type: 'success',
    })
  }

  // Toggle section expansion
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
                Settings
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                Manage feature flags and application settings
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

          {/* Tabs */}
          <div className="flex border-b border-neutral-200">
            <button
              onClick={() => setActiveTab('features')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'features'
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              Feature Flags
            </button>
            {isFeatureEnabled('integrations') && (
              <button
                onClick={() => setActiveTab('integrations')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'integrations'
                    ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                Integrations
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'features' ? (
            <div className="space-y-4">
              {/* Developer Mode Toggle */}
              <div className="mb-6 p-4 border border-neutral-200 rounded-lg bg-neutral-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-neutral-900">
                        Developer Mode
                      </h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        isDeveloperMode
                          ? 'bg-green-100 text-green-700'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {isDeveloperMode ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500">
                      Enable developer tools to create tables from Airtable. When active, you'll see "+" buttons in the sidebar to add new tables.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
                    <input
                      type="checkbox"
                      checked={isDeveloperMode}
                      onChange={toggleDeveloperMode}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Feature Flags
                  </h3>
                  <p className="text-sm text-neutral-500 mt-1">
                    Enable or disable features in the application. Changes require a page refresh to take effect.
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors px-3 py-1.5 border border-neutral-300 rounded-md hover:bg-neutral-50"
                >
                  Reset to Defaults
                </button>
              </div>

              {/* Preset Configurations */}
              <div className="mb-6">
                <h4 className="text-xs font-semibold text-neutral-700 mb-3">Quick Configuration Presets</h4>
                <div className="grid grid-cols-3 gap-3">
                  {/* Safe Mode / Recovery Mode */}
                  <button
                    onClick={() => handlePresetSelect('safe')}
                    className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                      currentPreset === 'safe'
                        ? 'border-green-500 bg-green-50'
                        : 'border-neutral-200 bg-white hover:border-green-300 hover:bg-green-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      {currentPreset === 'safe' && (
                        <span className="text-[10px] px-2 py-0.5 bg-green-600 text-white rounded-full font-medium">Active</span>
                      )}
                    </div>
                    <h5 className="text-xs font-semibold text-neutral-900 mb-0.5">Safe Mode</h5>
                    <p className="text-[10px] text-neutral-600 leading-tight">Essential features only for recovery and troubleshooting</p>
                  </button>

                  {/* Standard Experience */}
                  <button
                    onClick={() => handlePresetSelect('standard')}
                    className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                      currentPreset === 'standard'
                        ? 'border-green-500 bg-green-50'
                        : 'border-neutral-200 bg-white hover:border-green-300 hover:bg-green-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      {currentPreset === 'standard' && (
                        <span className="text-[10px] px-2 py-0.5 bg-green-600 text-white rounded-full font-medium">Active</span>
                      )}
                    </div>
                    <h5 className="text-xs font-semibold text-neutral-900 mb-0.5">Standard Experience</h5>
                    <p className="text-[10px] text-neutral-600 leading-tight">Balanced configuration with common features enabled</p>
                  </button>

                  {/* On Steroids */}
                  <button
                    onClick={() => handlePresetSelect('power')}
                    className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                      currentPreset === 'power'
                        ? 'border-green-500 bg-green-50'
                        : 'border-neutral-200 bg-white hover:border-green-300 hover:bg-green-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {currentPreset === 'power' && (
                        <span className="text-[10px] px-2 py-0.5 bg-green-600 text-white rounded-full font-medium">Active</span>
                      )}
                    </div>
                    <h5 className="text-xs font-semibold text-neutral-900 mb-0.5">On Steroids</h5>
                    <p className="text-[10px] text-neutral-600 leading-tight">All features enabled for maximum functionality</p>
                  </button>
                </div>
              </div>

              {/* Feature Flags by Section (Collapsible) */}
              {FEATURE_SECTIONS.map((section) => {
                const isExpanded = expandedSections.has(section.id)
                const enabledCount = section.flags.filter(flag => featureFlags[flag.key] ?? false).length
                const totalCount = section.flags.length
                
                return (
                  <div
                    key={section.id}
                    className="border border-neutral-200 rounded-lg overflow-hidden"
                  >
                    {/* Section Header (Collapsible) */}
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
                          <h4 className="text-xs font-semibold text-neutral-900">
                            {section.title}
                          </h4>
                          {section.description && (
                            <p className="text-[10px] text-neutral-500 mt-0.5">
                              {section.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-[10px] text-neutral-500">
                          {enabledCount}/{totalCount} enabled
                        </span>
                        <svg
                          className={`w-4 h-4 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Section Content (Collapsible) */}
                    {isExpanded && (
                      <div className="p-4 space-y-3 bg-white">
                        {section.flags.map((info) => {
                          const isEnabled = featureFlags[info.key] ?? false
                          return (
                            <div
                              key={info.key}
                              className="flex items-start justify-between p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
                            >
                              <div className="flex-1 mr-4">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h5 className="text-xs font-medium text-neutral-900">
                                    {info.label}
                                  </h5>
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                                      isEnabled
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-neutral-100 text-neutral-600'
                                    }`}
                                  >
                                    {isEnabled ? 'Enabled' : 'Disabled'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-neutral-500">
                                  {info.description}
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                <input
                                  type="checkbox"
                                  checked={isEnabled}
                                  onChange={() => handleToggle(info.key)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                              </label>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            ) : (
              <IntegrationMarketplace />
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-neutral-200 bg-neutral-50">
            <p className="text-xs text-neutral-500">
              {hasChanges ? 'You have unsaved changes' : 'All changes saved'}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Changes
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

