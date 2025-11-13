'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { useSidebar } from '@/components/SidebarContext'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import Link from 'next/link'
import { BuildingIcon, GlobeIcon, LeafIcon, DocumentIcon, SettingsIcon } from '@/components/icons'

function SystemConfigContent() {
  const { isCollapsed } = useSidebar()
  const { preferences, loading: prefsLoading } = useUserPreferences()
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Only apply top banner padding after mount and preferences have loaded to avoid hydration mismatch
  const sidebarLayout = preferences?.sidebarLayout || (isMounted && !prefsLoading ? 'topBanner' : undefined)
  const showTopBanner = isMounted && !prefsLoading && sidebarLayout === 'topBanner'
  
  return (
    <div className="fixed inset-0 flex bg-gray-50 overflow-hidden" style={{ margin: 0, padding: 0 }}>
      <Sidebar />
      
      <div className={`flex-1 px-8 pb-8 overflow-y-auto ${isCollapsed ? 'ml-16' : 'ml-64'} ${showTopBanner ? 'pt-20' : 'pt-8'}`}
           style={{ transition: 'margin-left 300ms ease-in-out' }}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">System Configuration</h1>
            <p className="text-neutral-600">
              Manage system settings, configurations, and organizational structure
            </p>
          </div>

          {/* Quick Access Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Link
              href="/spaces/system-config/companies"
              className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 hover:border-green-500 hover:shadow-md transition-all"
            >
              <BuildingIcon className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Companies</h3>
              <p className="text-sm text-neutral-600">Manage company information and organizational structure</p>
            </Link>

            <Link
              href="/spaces/system-config/geography"
              className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 hover:border-green-500 hover:shadow-md transition-all"
            >
              <GlobeIcon className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Geography</h3>
              <p className="text-sm text-neutral-600">Manage geographic locations and regions</p>
            </Link>

            <Link
              href="/spaces/system-config/emissions"
              className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 hover:border-green-500 hover:shadow-md transition-all"
            >
              <LeafIcon className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Emission Management</h3>
              <p className="text-sm text-neutral-600">Track and manage greenhouse gas emissions</p>
            </Link>

            <Link
              href="/spaces/system-config/settings"
              className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 hover:border-green-500 hover:shadow-md transition-all"
            >
              <SettingsIcon className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Settings</h3>
              <p className="text-sm text-neutral-600">Configure system parameters and settings</p>
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function SystemConfigPage() {
  // SidebarProvider is now at the spaces/layout.tsx level
  return <SystemConfigContent />
}

