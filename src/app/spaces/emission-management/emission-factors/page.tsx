'use client'

import Sidebar from '@/components/Sidebar'
import { useSidebar } from '@/components/SidebarContext'
import ListDetailTemplate from '@/components/templates/ListDetailTemplate'
import { efGwpConfig } from '@/components/templates/configs/efGwpConfig'

/**
 * Emission Factor GWP Page using ListDetailTemplate
 * 
 * This page displays the Emission Factor GWP table from Airtable
 * using the reusable ListDetailTemplate component.
 * Matches the exact structure and styling of the Companies page.
 */
export default function EmissionFactorsPage() {
  const { isCollapsed } = useSidebar()
  
  return (
    <div className="fixed inset-0 flex bg-gray-50 overflow-hidden" style={{ margin: 0, padding: 0 }}>
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className={`flex-1 p-8 overflow-hidden flex flex-col ${isCollapsed ? 'ml-16' : 'ml-64'}`}
           style={{ transition: 'margin-left 300ms ease-in-out' }}>
        <ListDetailTemplate config={efGwpConfig} />
      </div>
    </div>
  )
}

