'use client'

import Sidebar from '@/components/Sidebar'
import { useSidebar } from '@/components/SidebarContext'
import ListDetailTemplate from '@/components/templates/ListDetailTemplate'
import { industryClassificationConfig } from '@/components/templates/configs/industryClassificationConfig'
import type { IndustryClassification } from '@/lib/api/industryClassification'
import { isFeatureEnabled } from '@/lib/featureFlags'

/**
 * Industry Factors Page using ListDetailTemplate
 * 
 * This page displays the Industry Factors table from Airtable
 * using the reusable ListDetailTemplate component.
 */
export default function IndustryClassificationPage() {
  // All hooks must be called before any conditional returns
  const { isCollapsed } = useSidebar()
  const isIndustryClassificationEnabled = isFeatureEnabled('industryClassification')
  
  // Conditional rendering AFTER all hooks are called
  if (!isIndustryClassificationEnabled) {
    return (
      <div className="fixed inset-0 flex bg-gray-50 overflow-hidden" style={{ margin: 0, padding: 0 }}>
        <Sidebar />
        <div className={`flex-1 p-8 overflow-hidden flex flex-col ${isCollapsed ? 'ml-16' : 'ml-64'}`}
             style={{ transition: 'margin-left 300ms ease-in-out' }}>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-neutral-700 mb-2">Industry Factors Feature</h2>
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
        <ListDetailTemplate<IndustryClassification> config={industryClassificationConfig} />
      </div>
    </div>
  )
}

