'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { useSidebar } from './SidebarContext'
import {
  HomeIcon,
  FolderIcon,
  BuildingIcon,
  GlobeIcon,
  LeafIcon,
  ChartIcon,
  DocumentIcon,
  SettingsIcon,
  MenuIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ShareIcon,
  BellIcon,
  UserIcon,
  AIAssistantIcon,
} from './icons'
import { isFeatureEnabled, getAllFeatureFlags } from '@/lib/featureFlags'
import SettingsModal from './SettingsModal'
import UserPreferencesModal from './UserPreferencesModal'
import NotificationCenter from './NotificationCenter'
import ChatbotModal from './ChatbotModal'
import { useNotifications } from '@/contexts/NotificationContext'
import { useDeveloperMode } from '@/contexts/DeveloperModeContext'
import TableCreationDialog from './TableCreationDialog'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import SpaceSwitcher from './SpaceSwitcher'

interface NavItem {
  name: string
  Icon: React.ComponentType<{ className?: string }>
  path?: string
  badge?: number
  children?: NavItem[]
}

// Helper function to detect current space from pathname
const detectSpace = (pathname: string): 'system-config' | 'admin' | 'other' => {
  if (pathname.startsWith('/spaces/system-config')) {
    return 'system-config'
  }
  if (pathname.startsWith('/spaces/admin')) {
    return 'admin'
  }
  return 'other'
}

// System Configuration space navigation items
const getSystemConfigNavItems = (featureFlags: Record<string, boolean>): NavItem[] => [
  { name: 'Home Space', Icon: HomeIcon, path: '/' },
  {
    name: 'Organization structure',
    Icon: FolderIcon,
    children: [
      ...(featureFlags.geography ? [{ name: 'Geography', Icon: GlobeIcon, path: '/spaces/system-config/geography' }] : []),
      ...(featureFlags.companies ? [{ name: 'Companies', Icon: BuildingIcon, path: '/spaces/system-config/companies' }] : []),
    ],
  },
  ...(featureFlags.userManagement ? [{
    name: 'User management',
    Icon: UserIcon,
    children: [
      { name: 'Users', Icon: UserIcon, path: '/spaces/user-management/users' },
      ...(featureFlags.userRoles ? [{ name: 'User Roles', Icon: UserIcon, path: '/spaces/system-config/user-roles' }] : []),
    ],
  }] : []),
  {
    name: 'Emission management',
    Icon: LeafIcon,
    children: [
      ...(featureFlags.emissionFactorGwp ? [{ name: 'Emission Factor GWP', Icon: ChartIcon, path: '/spaces/emission-management/emission-factors' }] : []),
      ...(featureFlags.emissionFactorVersion ? [{ name: 'Emission Factor Version', Icon: ChartIcon, path: '/spaces/emission-management/emission-factor-version' }] : []),
      { name: 'Standard Emission Factors', Icon: ChartIcon, path: '/spaces/emission-management/standard-emission-factors' },
      ...(featureFlags.efDetailedG ? [{ name: 'EF/Detailed G', Icon: ChartIcon, path: '/spaces/emission-management/ef-detailed-g' }] : []),
      ...(featureFlags.normalizedActivities ? [{ name: 'Normalized Activities', Icon: ChartIcon, path: '/spaces/emission-management/normalized-activities' }] : []),
      ...(featureFlags.ghgTypes ? [{ name: 'GHG Type', Icon: ChartIcon, path: '/spaces/emission-management/ghg-types' }] : []),
      ...(featureFlags.industryClassification ? [{ name: 'Industry Factors', Icon: ChartIcon, path: '/spaces/emission-management/industry-classification' }] : []),
    ],
  },
  {
    name: 'Reference Data',
    Icon: DocumentIcon,
    children: [
      ...(featureFlags.scope ? [{ name: 'Scope', Icon: DocumentIcon, path: '/spaces/emission-management/scope' }] : []),
      ...(featureFlags.scopeCategorisation ? [{ name: 'Scope & Categorisation', Icon: DocumentIcon, path: '/spaces/emission-management/scope-categorisation' }] : []),
      ...(featureFlags.unit ? [{ name: 'Unit', Icon: DocumentIcon, path: '/spaces/emission-management/unit' }] : []),
      ...(featureFlags.unitConversion ? [{ name: 'Unit Conversion', Icon: DocumentIcon, path: '/spaces/emission-management/unit-conversion' }] : []),
    ],
  },
  {
    name: 'ECM Management',
    Icon: LeafIcon,
    children: [
      ...(featureFlags.standardECMCatalog ? [{ name: 'Standard ECM Catalog', Icon: ChartIcon, path: '/spaces/emission-management/standard-ecm-catalog' }] : []),
      ...(featureFlags.standardECMClassification ? [{ name: 'Standard ECM Classification', Icon: ChartIcon, path: '/spaces/emission-management/standard-ecm-classification' }] : []),
    ],
  },
  { name: 'Sustainability Actions', Icon: LeafIcon, path: '/spaces/system-config/sustainability' },
  ...(featureFlags.integrations ? [{
    name: 'Application Settings',
    Icon: SettingsIcon,
    children: [
      { name: 'Integrations', Icon: SettingsIcon, path: '/spaces/system-config/integration-marketplace' },
      { name: 'AI Model Registry', Icon: SettingsIcon, path: '/spaces/system-config/ai-model-registry' },
      ...(featureFlags.applicationList ? [{ name: 'Application List', Icon: SettingsIcon, path: '/spaces/admin/application-list' }] : []),
    ],
  }] : []),
]

// Administration space navigation items
const getAdminNavItems = (featureFlags: Record<string, boolean>): NavItem[] => [
  { name: 'Home Space', Icon: HomeIcon, path: '/' },
  // Future admin sections can be added here as they're created
  // {
  //   name: 'System Settings',
  //   Icon: SettingsIcon,
  //   path: '/spaces/admin/system-settings',
  // },
  // {
  //   name: 'Audit Trail',
  //   Icon: DocumentIcon,
  //   path: '/spaces/admin/audit-trail',
  // },
]

// Helper function to get nav items based on current space
const getNavItems = (pathname: string, featureFlags: Record<string, boolean>): NavItem[] => {
  const space = detectSpace(pathname)
  
  switch (space) {
    case 'system-config':
      return getSystemConfigNavItems(featureFlags)
    case 'admin':
      return getAdminNavItems(featureFlags)
    default:
      // Default to system-config navigation for other routes
      return getSystemConfigNavItems(featureFlags)
  }
}

// Helper function to get space title
const getSpaceTitle = (pathname: string): string => {
  const space = detectSpace(pathname)
  
  switch (space) {
    case 'system-config':
      return 'System configuration space'
    case 'admin':
      return 'Administration space'
    default:
      return 'System configuration space'
  }
}

// Helper function to get space icon letter
const getSpaceIconLetter = (pathname: string): string => {
  const space = detectSpace(pathname)
  
  switch (space) {
    case 'system-config':
      return 'S'
    case 'admin':
      return 'A'
    default:
      return 'S'
  }
}

export default function Sidebar() {
  const pathname = usePathname()
  const sidebarRef = useRef<HTMLDivElement>(null)
  // Initialize expanded items based on current space
  const getInitialExpandedItems = (pathname: string): string[] => {
    const space = detectSpace(pathname)
    if (space === 'admin') {
      return ['Application Management']
    }
    return ['Organization structure', 'User management', 'Emission management', 'Reference Data', 'ECM Management', 'Application Settings']
  }
  
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return ['Organization structure', 'User management', 'Emission management', 'Reference Data', 'ECM Management']
    }
    return getInitialExpandedItems(pathname)
  })
  
  // Update expanded items when space changes
  useEffect(() => {
    const newExpandedItems = getInitialExpandedItems(pathname)
    setExpandedItems(newExpandedItems)
  }, [pathname])
  const [isMounted, setIsMounted] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isUserPreferencesOpen, setIsUserPreferencesOpen] = useState(false)
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false)
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const { unreadCount } = useNotifications()
  const [shouldAnimateIn, setShouldAnimateIn] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [hoveredItemPosition, setHoveredItemPosition] = useState<number | null>(null)
  const isSubmenuHoveredRef = useRef(false)
  const { isCollapsed, toggleCollapse } = useSidebar()
  const { isDeveloperMode } = useDeveloperMode()
  const [isTableCreationDialogOpen, setIsTableCreationDialogOpen] = useState(false)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [isSpaceSwitcherOpen, setIsSpaceSwitcherOpen] = useState(false)
  const { preferences } = useUserPreferences()
  const sidebarLayout = preferences?.sidebarLayout || 'topBanner'
  const showButtonsInSidebar = sidebarLayout === 'sidebarFooter'
  
  // Get feature flags - use consistent defaults to avoid hydration mismatch
  // Load from localStorage only after mount
  // Initialize with all flags as true (defaults) to match server render
  // This ensures server and client render the same initial HTML
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>(() => {
    // Return default values on server (no localStorage access)
    // These match the defaults in featureFlags.ts where most flags default to true
    // Safe mode will update these after mount via useEffect
    if (typeof window === 'undefined') {
      return {
        geography: true,
        companies: true,
        userManagement: true,
        userRoles: true,
        emissionFactorGwp: true,
        emissionFactorVersion: true,
        ghgTypes: true,
        industryClassification: true,
        applicationList: true,
        normalizedActivities: true,
        efDetailedG: true,
        scope: true,
        scopeCategorisation: true,
        unit: true,
        unitConversion: true,
        standardECMCatalog: true,
        standardECMClassification: true,
      }
    }
    // On client, still use defaults initially to match server
    // Will be updated in useEffect
    return {
      geography: true,
      companies: true,
      userManagement: true,
      userRoles: true,
      emissionFactorGwp: true,
      emissionFactorVersion: true,
      ghgTypes: true,
      industryClassification: true,
      applicationList: true,
      normalizedActivities: true,
      efDetailedG: true,
      scope: true,
      scopeCategorisation: true,
      unit: true,
      unitConversion: true,
      standardECMCatalog: true,
      standardECMClassification: true,
    }
  })
  
  // Load actual feature flags from localStorage after mount (client-side only)
  // This ensures hydration matches, then updates to reflect user's feature flag settings
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const allFlags = getAllFeatureFlags()
      setFeatureFlags(allFlags)
    }
  }, [])
  
  const navItems = getNavItems(pathname, featureFlags)
  const spaceTitle = getSpaceTitle(pathname)
  const spaceIconLetter = getSpaceIconLetter(pathname)

  // Check if we're transitioning from home page (only animate on initial entry)
  useEffect(() => {
    const isTransitioning = localStorage.getItem('space_transition') === 'true'
    if (isTransitioning) {
      // Only animate when entering from home page
      setIsMounted(true)
      // Small delay to ensure the sidebar starts from off-screen
      setTimeout(() => {
        setShouldAnimateIn(true)
      }, 50)
      // Clear the flag after animation completes (1200ms for slide-in animation)
      const clearTimer = setTimeout(() => {
        localStorage.removeItem('space_transition')
        setShouldAnimateIn(false) // Reset animation state after it completes
      }, 1250)
      return () => {
        clearTimeout(clearTimer)
      }
    } else {
      // No animation when navigating between pages within the space
      setIsMounted(true)
      setShouldAnimateIn(false) // Don't animate on internal navigation
    }
  }, [pathname]) // Re-run when pathname changes

  // Cleanup hover timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout)
      }
    }
  }, [hoverTimeout])

  const toggleExpand = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName) ? prev.filter((name) => name !== itemName) : [...prev, itemName]
    )
  }

  const isActive = (path?: string) => {
    if (!path) return false
    // Check if pathname matches or is a child of the path
    if (pathname === path) return true
    // For parent items with children, check if any child is active
    if (pathname.startsWith(path + '/')) return true
    return false
  }

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.name)
    // Check if this item or any of its children is active
    const active = isActive(item.path) || (hasChildren && item.children?.some(child => isActive(child.path)))
    const { Icon } = item

    if (isCollapsed) {
      // Collapsed view: show only icons with hover submenu for all items
      const isHovered = hoveredItem === item.name
      
      return (
        <div 
          key={item.name}
          className="relative"
          onMouseEnter={(e) => {
            if (hoverTimeout) clearTimeout(hoverTimeout)
            // Calculate vertical position of this icon relative to viewport
            const rect = e.currentTarget.getBoundingClientRect()
            setHoveredItemPosition(rect.top)
            setHoveredItem(item.name) // Show submenu for all items on hover
          }}
          onMouseLeave={() => {
            // Only close if submenu is not being hovered
            const timeout = setTimeout(() => {
              if (!isSubmenuHoveredRef.current) {
                setHoveredItem(null)
                setHoveredItemPosition(null)
              }
            }, 150) // Short timeout for icon leave
            setHoverTimeout(timeout)
          }}
        >
          {item.path ? (
            <Link
              href={item.path}
              className={`flex items-center justify-center p-2.5 mx-2 mb-1 rounded-lg transition-all duration-200 relative ${
                active
                  ? 'bg-green-50 text-green-700'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-green-600' : 'text-neutral-500'}`} />
              {item.badge && (
                <span className="absolute top-1 right-1 bg-green-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-medium">
                  {item.badge}
                </span>
              )}
            </Link>
          ) : (
            <div
              className={`flex items-center justify-center p-2.5 mx-2 mb-1 rounded-lg transition-all duration-200 cursor-pointer relative ${
                active
                  ? 'bg-green-50 text-green-700'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-green-600' : 'text-neutral-500'}`} />
              {item.badge && (
                <span className="absolute top-1 right-1 bg-green-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-medium">
                  {item.badge}
                </span>
              )}
            </div>
          )}
        </div>
      )
    }

    // Expanded view: show full navigation
    return (
      <div key={item.name}>
        <div
          className={`flex items-center justify-between py-2.5 cursor-pointer transition-all duration-200 ${
            active
              ? 'bg-green-50 text-green-700 border-r-2 border-green-500'
              : 'text-neutral-700 hover:bg-neutral-100'
          }`}
          style={{ paddingLeft: `${0.75 + level * 1.5}rem`, paddingRight: '1rem' }}
          onClick={() => hasChildren && toggleExpand(item.name)}
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-green-600' : 'text-neutral-500'}`} />
            {item.path ? (
              <Link href={item.path} className="flex-1 min-w-0" onClick={(e) => !hasChildren && e.stopPropagation()}>
                <span className={`text-sm font-medium block truncate ${active ? 'text-green-700' : 'text-neutral-700'}`}>
                  {item.name}
                </span>
              </Link>
            ) : (
              <span className={`text-sm font-medium block truncate ${active ? 'text-green-700' : 'text-neutral-700'}`}>
                {item.name}
              </span>
            )}
          </div>
          {item.badge && (
            <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
              {item.badge}
            </span>
          )}
          {isDeveloperMode && hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedSection(item.name)
                setIsTableCreationDialogOpen(true)
              }}
              className="ml-2 w-6 h-6 flex items-center justify-center rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors text-xs font-semibold"
              title={`Add table to ${item.name}`}
            >
              +
            </button>
          )}
          {hasChildren && (
            <ChevronRightIcon
              className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
          )}
        </div>
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="ml-2">
            {item.children!.map((child) => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Main Sidebar */}
      <div 
      ref={sidebarRef}
      className={`fixed left-0 top-0 h-screen bg-white border-r border-neutral-200 flex flex-col z-30 shadow-sm sidebar-main ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${shouldAnimateIn ? 'animate-slide-in-from-left' : ''}`}
        style={!shouldAnimateIn ? {
          // No animation - sidebar stays fixed and visible
          transform: 'translateX(0)',
          opacity: 1,
          borderRadius: '0 0.5rem 0.5rem 0', // Top-right and bottom-right rounded
          overflow: 'hidden' // Ensure rounded corners are visible
        } : {
          borderRadius: '0 0.5rem 0.5rem 0',
          overflow: 'hidden'
        }}
      >
      {/* Header */}
      <div className={`p-4 border-b border-neutral-200 bg-neutral-50 ${isCollapsed ? 'px-2' : ''}`}>
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3 group flex-1">
              <button
                onClick={() => setIsSpaceSwitcherOpen(true)}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity flex-1"
              >
                <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white font-bold shadow-sm hover:bg-green-600 transition-colors cursor-pointer">
                  {spaceIconLetter}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-neutral-900 group-hover:text-green-600 transition-colors">
                    {spaceTitle}
                  </div>
                </div>
              </button>
            </div>
          )}
          {isCollapsed && (
            <button
              onClick={() => setIsSpaceSwitcherOpen(true)}
              className="flex items-center justify-center hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white font-bold shadow-sm hover:bg-green-600 transition-colors cursor-pointer">
                {spaceIconLetter}
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-hide">
        {/* Expand/Collapse Button - positioned above Home Space icon */}
        <button
          onClick={toggleCollapse}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} p-2.5 mx-2 mb-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors group w-full`}
        >
          <div className="relative w-5 h-5 flex items-center justify-center">
            <ChevronRightIcon 
              className={`w-5 h-5 text-neutral-500 group-hover:text-green-600 transition-all duration-300 ease-in-out ${
                isCollapsed ? 'rotate-0' : 'rotate-180'
              }`}
            />
          </div>
        </button>
        {!isCollapsed && <div className="border-t border-neutral-200 my-3 mx-4"></div>}
        {navItems.map((item) => renderNavItem(item))}
      </nav>

      {/* Footer */}
      <div className={`p-4 border-t border-neutral-200 bg-neutral-50 flex ${isCollapsed ? 'flex-col items-center space-y-2' : 'items-center justify-between'}`}>
        {/* AI Assistant - First icon with engaging animation */}
        {isFeatureEnabled('chatbot') && (
          <button 
            onClick={() => setIsChatbotOpen(true)}
            className={`relative p-2.5 rounded-lg transition-all duration-300 group ${
              isChatbotOpen 
                ? 'bg-teal-100 shadow-md' 
                : 'bg-gradient-to-br from-teal-50 to-teal-100/50 hover:from-teal-100 hover:to-teal-100 shadow-sm hover:shadow-md'
            }`}
            title="AI Assistant - Ask me anything"
          >
            {/* Subtle pulse animation on hover - similar to welcome page */}
            <span className="absolute inset-0 rounded-lg bg-teal-400 opacity-0 group-hover:opacity-30 animate-ping" style={{ animationDuration: '1.5s' }}></span>
            
            {/* Glow effect when active */}
            {isChatbotOpen && (
              <span className="absolute inset-0 rounded-lg bg-teal-400 opacity-20 animate-pulse" style={{ animationDuration: '2s' }}></span>
            )}
            
            {/* Icon with gentle breathing animation when not active */}
            <div className={`relative z-10 ${!isChatbotOpen ? 'animate-pulse' : ''}`} style={{ animationDuration: '2.5s' }}>
              <AIAssistantIcon className={`w-6 h-6 transition-transform group-hover:scale-110 ${isChatbotOpen ? 'scale-110' : ''}`} />
            </div>
            
            {/* Active indicator dot with glow */}
            {isChatbotOpen && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-teal-500 rounded-full animate-pulse shadow-sm shadow-teal-500/50"></span>
            )}
            
            {/* Subtle "AI" badge when not active - makes it clear it's an agent */}
            {!isChatbotOpen && !isCollapsed && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-bold text-teal-700 bg-teal-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                AI
              </span>
            )}
          </button>
        )}
        
        {/* Conditionally render buttons based on sidebarLayout preference */}
        {showButtonsInSidebar && (
          <>
            {isFeatureEnabled('userPreferences') && (
              <button
                onClick={() => setIsUserPreferencesOpen(true)}
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer group ${
                  isUserPreferencesOpen
                    ? 'bg-green-100 border-green-500'
                    : 'bg-neutral-300 border-transparent hover:bg-green-100 hover:border-green-500'
                }`}
                title="User Preferences"
              >
                <UserIcon
                  className={`w-5 h-5 transition-colors ${
                    isUserPreferencesOpen
                      ? 'text-green-600'
                      : 'text-neutral-600 group-hover:text-green-600'
                  }`}
                />
              </button>
            )}
            {!isCollapsed && (
              <>
                <button className="p-2 text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors" title="Share">
                  <ShareIcon className="w-5 h-5" />
                </button>
                {isFeatureEnabled('notifications') && (
                  <button 
                    onClick={() => setIsNotificationCenterOpen(true)}
                    className="relative p-2 text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors" 
                    title="Notifications"
                  >
                  <BellIcon className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[14px] h-[14px] px-0.5 text-[10px] font-semibold text-white bg-green-600 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                </button>
                )}
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors" 
                  title="Settings"
                >
                  <SettingsIcon className="w-5 h-5" />
                </button>
              </>
            )}
            {isCollapsed && (
              <>
                <button className="p-2 text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors" title="Share">
                  <ShareIcon className="w-5 h-5" />
                </button>
                {isFeatureEnabled('notifications') && (
                  <button 
                    onClick={() => setIsNotificationCenterOpen(true)}
                    className="relative p-2 text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors" 
                    title="Notifications"
                  >
                  <BellIcon className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[14px] h-[14px] px-0.5 text-[10px] font-semibold text-white bg-green-600 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                </button>
                )}
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors" 
                  title="Settings"
                >
                  <SettingsIcon className="w-5 h-5" />
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Settings Modal */}
      {isFeatureEnabled('settingsModal') && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* User Preferences Modal */}
      {isFeatureEnabled('userPreferences') && (
        <UserPreferencesModal
          isOpen={isUserPreferencesOpen}
          onClose={() => setIsUserPreferencesOpen(false)}
        />
      )}

      {/* Notification Center */}
      {isFeatureEnabled('notifications') && (
        <NotificationCenter
          isOpen={isNotificationCenterOpen}
          onClose={() => setIsNotificationCenterOpen(false)}
        />
      )}

      {/* Chatbot Modal */}
      {isFeatureEnabled('chatbot') && (
        <ChatbotModal
          isOpen={isChatbotOpen}
          onClose={() => setIsChatbotOpen(false)}
        />
      )}

      {/* Space Switcher */}
      <SpaceSwitcher
        isOpen={isSpaceSwitcherOpen}
        onClose={() => setIsSpaceSwitcherOpen(false)}
        currentSpaceLetter={spaceIconLetter}
        sidebarRef={sidebarRef}
        isCollapsed={isCollapsed}
      />

      <TableCreationDialog
        isOpen={isTableCreationDialogOpen}
        onClose={() => {
          setIsTableCreationDialogOpen(false)
          setSelectedSection(null)
        }}
        targetSection={selectedSection}
      />
      </div>


      {/* Sliding Submenu Panel - extends from sidebar on hover, aligned with parent icon */}
      {isCollapsed && hoveredItem && hoveredItemPosition !== null && (() => {
        const hoveredNavItem = navItems.find(item => item.name === hoveredItem)
        if (!hoveredNavItem) return null
        
        const hasChildren = hoveredNavItem.children && hoveredNavItem.children.length > 0
        const active = isActive(hoveredNavItem.path) || (hasChildren && hoveredNavItem.children?.some(child => isActive(child.path)))
        
        // Position submenu to align with parent icon (hoveredItemPosition is already viewport-relative)
        const topPosition = hoveredItemPosition
        // Calculate icon height (approximately 40px with padding)
        const iconHeight = 40
        // Calculate submenu height based on number of children
        const submenuItemHeight = 40 // Approximate height per item
        const numItems = hasChildren ? (hoveredNavItem.children?.length || 1) : 1
        const submenuHeight = Math.max(iconHeight, numItems * submenuItemHeight)
        
        return (
          <>
            {/* Bridge element to prevent hover loss between sidebar and submenu */}
            {/* This invisible bridge fills the gap between sidebar icon and submenu */}
            <div
              className="fixed z-40 pointer-events-auto"
              style={{
                left: '56px', // Start well inside sidebar (64px - 8px overlap) to ensure no gap
                top: `${topPosition}px`,
                width: '20px', // Wider to catch mouse movement more reliably
                height: `${submenuHeight}px`, // Extend to cover full submenu height
                backgroundColor: 'transparent', // Invisible but functional
              }}
              onMouseEnter={() => {
                if (hoverTimeout) clearTimeout(hoverTimeout)
                setHoveredItem(hoveredItem)
                isSubmenuHoveredRef.current = true
              }}
              onMouseLeave={() => {
                // Don't close immediately - check if mouse moved to submenu
                const timeout = setTimeout(() => {
                  if (!isSubmenuHoveredRef.current) {
                    setHoveredItem(null)
                    setHoveredItemPosition(null)
                    isSubmenuHoveredRef.current = false
                  }
                }, 150)
                setHoverTimeout(timeout)
              }}
            />
            <div
              className="fixed bg-white border-r border-neutral-200 shadow-xl z-40 w-64 animate-slide-in-from-left-submenu overflow-hidden submenu-container"
              style={{
                left: '60px', // Start slightly inside sidebar (64px - 4px) to ensure no gap
                top: `${topPosition}px`,
                maxHeight: `calc(100vh - ${topPosition}px)`,
                minHeight: 'auto',
                borderRadius: '0 0.5rem 0.5rem 0', // Rounded right corners
                paddingLeft: '4px', // Add padding to compensate for overlap
              }}
              onMouseEnter={() => {
                if (hoverTimeout) clearTimeout(hoverTimeout)
                setHoveredItem(hoveredItem)
                isSubmenuHoveredRef.current = true
              }}
              onMouseLeave={() => {
                // Delay setting to false to allow mouse to move to links
                const timeout = setTimeout(() => {
                  isSubmenuHoveredRef.current = false
                  // Check again after a short delay
                  setTimeout(() => {
                    if (!isSubmenuHoveredRef.current) {
                      setHoveredItem(null)
                      setHoveredItemPosition(null)
                    }
                  }, 100)
                }, 200)
                setHoverTimeout(timeout)
              }}
            >
            <div 
              className="flex flex-col"
              onMouseEnter={() => {
                // Maintain hover state when mouse is anywhere in the submenu
                if (hoverTimeout) clearTimeout(hoverTimeout)
                setHoveredItem(hoveredItem)
                isSubmenuHoveredRef.current = true
              }}
              onMouseLeave={() => {
                // Don't set to false immediately - allow movement between links
                const timeout = setTimeout(() => {
                  isSubmenuHoveredRef.current = false
                }, 100)
                setHoverTimeout(timeout)
              }}
            >
              {!hasChildren ? (
                // Single item - show as clickable link aligned with parent
                hoveredNavItem.path ? (
                  <Link
                    href={hoveredNavItem.path}
                    className={`flex items-center space-x-3 px-4 py-2.5 hover:bg-neutral-100 transition-colors ${
                      active
                        ? 'bg-green-50 text-green-700 border-r-2 border-green-500'
                        : 'text-neutral-700'
                    }`}
                    onMouseEnter={() => {
                      // Maintain hover state when mouse enters the link
                      if (hoverTimeout) clearTimeout(hoverTimeout)
                      setHoveredItem(hoveredItem)
                      isSubmenuHoveredRef.current = true
                    }}
                    onMouseLeave={(e) => {
                      // Check if mouse is moving to another element in the submenu
                      const relatedTarget = e.relatedTarget as HTMLElement | null
                      if (relatedTarget && relatedTarget instanceof HTMLElement && relatedTarget.closest('.submenu-container')) {
                        isSubmenuHoveredRef.current = true
                      } else {
                        // Small delay before setting to false
                        setTimeout(() => {
                          isSubmenuHoveredRef.current = false
                        }, 50)
                      }
                    }}
                  >
                    {hoveredNavItem.Icon && (
                      <hoveredNavItem.Icon className={`w-4 h-4 ${active ? 'text-green-600' : 'text-neutral-500'}`} />
                    )}
                    <span className={`text-sm font-medium ${active ? 'text-green-700' : 'text-neutral-700'}`}>
                      {hoveredNavItem.name}
                    </span>
                    {hoveredNavItem.badge && (
                      <span className="ml-auto bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                        {hoveredNavItem.badge}
                      </span>
                    )}
                  </Link>
                ) : (
                  <div className="px-4 py-2.5 text-sm text-neutral-500">
                    {hoveredNavItem.name}
                  </div>
                )
              ) : (
                // Has children - show child items directly below parent icon
                hoveredNavItem.children && hoveredNavItem.children.map((child) => {
                  const childActive = isActive(child.path)
                  return (
                    <Link
                      key={child.name}
                      href={child.path || '#'}
                      className={`flex items-center space-x-3 px-4 py-2.5 hover:bg-neutral-100 transition-colors ${
                        childActive
                          ? 'bg-green-50 text-green-700 border-r-2 border-green-500'
                          : 'text-neutral-700'
                      }`}
                      onMouseEnter={() => {
                        // Maintain hover state when mouse enters a link
                        if (hoverTimeout) clearTimeout(hoverTimeout)
                        setHoveredItem(hoveredItem)
                        isSubmenuHoveredRef.current = true
                      }}
                      onMouseLeave={(e) => {
                        // Check if mouse is moving to another link in the submenu
                        const relatedTarget = e.relatedTarget as HTMLElement | null
                        if (relatedTarget && relatedTarget instanceof HTMLElement && relatedTarget.closest('.submenu-container')) {
                          // Mouse is moving to another element in submenu, keep it open
                          isSubmenuHoveredRef.current = true
                        } else {
                          // Small delay before setting to false
                          setTimeout(() => {
                            isSubmenuHoveredRef.current = false
                          }, 50)
                        }
                      }}
                    >
                      {child.Icon && (
                        <child.Icon className={`w-4 h-4 ${childActive ? 'text-green-600' : 'text-neutral-500'}`} />
                      )}
                      <span className={`text-sm font-medium ${childActive ? 'text-green-700' : 'text-neutral-700'}`}>
                        {child.name}
                      </span>
                      {child.badge && (
                        <span className="ml-auto bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                          {child.badge}
                        </span>
                      )}
                    </Link>
                  )
                })
              )}
            </div>
          </div>
          </>
        )
      })()}
    </>
  )
}

