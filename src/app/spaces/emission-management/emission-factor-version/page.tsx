'use client'

import Sidebar from '@/components/Sidebar'
import { useSidebar } from '@/components/SidebarContext'
import ListDetailTemplate from '@/components/templates/ListDetailTemplate'
import { emissionFactorVersionConfig } from '@/components/templates/configs/emissionFactorVersionConfig'
import { isFeatureEnabled } from '@/lib/featureFlags'

/**
 * Emission Factor Version Page using ListDetailTemplate
 * 
 * This page displays the Emission Factor Version table from Airtable
 * using the reusable ListDetailTemplate component.
 * Matches the exact structure and styling of the Geography and EF GWP pages.
 */
export default function EmissionFactorVersionPage() {
  const { isCollapsed } = useSidebar()
  const isEmissionFactorVersionsEnabled = isFeatureEnabled('emissionFactorVersion')
  
  // If feature flag is disabled, show a message
  if (!isEmissionFactorVersionsEnabled) {
    return (
      <div className="fixed inset-0 flex bg-gray-50 overflow-hidden" style={{ margin: 0, padding: 0 }}>
        <Sidebar />
        <div className={`flex-1 p-8 overflow-hidden flex flex-col ${isCollapsed ? 'ml-16' : 'ml-64'}`}
             style={{ transition: 'margin-left 300ms ease-in-out' }}>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-neutral-700 mb-2">Emission Factor Version Feature</h2>
              <p className="text-neutral-500">This feature is currently disabled.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="fixed inset-0 flex bg-gray-50 overflow-hidden" style={{ margin: 0, padding: 0 }}>
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className={`flex-1 p-8 overflow-hidden flex flex-col ${isCollapsed ? 'ml-16' : 'ml-64'}`}
           style={{ transition: 'margin-left 300ms ease-in-out' }}>
        <ListDetailTemplate config={emissionFactorVersionConfig} />
      </div>
    </div>
  )
}

