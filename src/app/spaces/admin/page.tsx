'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { useSidebar } from '@/components/SidebarContext'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import Link from 'next/link'
import { BuildingIcon, GlobeIcon, LeafIcon, DocumentIcon, SettingsIcon } from '@/components/icons'

function AdminContent() {
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
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Administration</h1>
            <p className="text-neutral-600">
              Manage administrative settings, configurations, and system administration
            </p>
          </div>

          {/* Quick Access Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Placeholder cards for future admin features */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 opacity-60">
              <SettingsIcon className="w-8 h-8 text-neutral-400 mb-3" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">System Settings</h3>
              <p className="text-sm text-neutral-600">Configure system parameters and settings</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 opacity-60">
              <DocumentIcon className="w-8 h-8 text-neutral-400 mb-3" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Audit Trail</h3>
              <p className="text-sm text-neutral-600">Track changes and access history</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 opacity-60">
              <SettingsIcon className="w-8 h-8 text-neutral-400 mb-3" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Backup & Restore</h3>
              <p className="text-sm text-neutral-600">Data backup and recovery options</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  // SidebarProvider is now at the spaces/layout.tsx level
  return <AdminContent />
}
