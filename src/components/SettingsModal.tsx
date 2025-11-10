'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { XMarkIcon } from './icons'
import { getAllFeatureFlags, isFeatureEnabled, type FeatureFlag, setFeatureFlag, getFeatureFlagOverrides } from '@/lib/featureFlags'
import Notification from './Notification'

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

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [featureFlags, setFeatureFlags] = useState<Record<FeatureFlag, boolean>>({} as Record<FeatureFlag, boolean>)
  const [hasChanges, setHasChanges] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    // Initialize with default expanded sections
    return new Set(FEATURE_SECTIONS.filter(s => s.defaultExpanded).map(s => s.id))
  })

  // Load current feature flags
  useEffect(() => {
    if (isOpen) {
      const currentFlags = getAllFeatureFlags()
      setFeatureFlags(currentFlags)
      setHasChanges(false)
    }
  }, [isOpen])

  // Handle toggle
  const handleToggle = (flag: FeatureFlag) => {
    const newValue = !featureFlags[flag]
    setFeatureFlags(prev => ({
      ...prev,
      [flag]: newValue,
    }))
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
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
                          <h4 className="text-sm font-semibold text-neutral-900">
                            {section.title}
                          </h4>
                          {section.description && (
                            <p className="text-xs text-neutral-500 mt-0.5">
                              {section.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-neutral-500">
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
                                  <h5 className="text-sm font-medium text-neutral-900">
                                    {info.label}
                                  </h5>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded font-medium ${
                                      isEnabled
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-neutral-100 text-neutral-600'
                                    }`}
                                  >
                                    {isEnabled ? 'Enabled' : 'Disabled'}
                                  </span>
                                </div>
                                <p className="text-xs text-neutral-500">
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

