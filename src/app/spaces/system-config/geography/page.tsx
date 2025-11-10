'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { useSidebar } from '@/components/SidebarContext'
import ListDetailTemplate from '@/components/templates/ListDetailTemplate'
import { geographyConfig } from '@/components/templates/configs/geographyConfig'

/**
 * Geography Page using ListDetailTemplate
 * 
 * This page displays the Geography table from Airtable
 * using the reusable ListDetailTemplate component.
 * Matches the exact structure and styling of the Companies page.
 */
export default function GeographyPage() {
  const { isCollapsed } = useSidebar()
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const [isInitialMount, setIsInitialMount] = useState(true)
  
  useEffect(() => {
    // Check if we're transitioning from home page
    const isTransitioning = localStorage.getItem('space_transition') === 'true'
    if (isTransitioning) {
      // Delay animation to prevent glitch
      const timer = setTimeout(() => {
        setShouldAnimate(true)
        setIsInitialMount(false)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setIsInitialMount(false)
    }
  }, [])
  
  return (
    <div className="fixed inset-0 flex bg-gray-50 overflow-hidden" style={{ margin: 0, padding: 0 }}>
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div 
        className={`flex-1 p-8 overflow-hidden flex flex-col ${isCollapsed ? 'ml-16' : 'ml-64'} ${shouldAnimate ? 'animate-fade-in' : ''}`}
        style={{ 
          transition: 'margin-left 300ms ease-in-out', 
          animationDelay: shouldAnimate ? '0.4s' : '0s',
          opacity: isInitialMount ? 0 : 1,
        }}
      >
        <ListDetailTemplate config={geographyConfig} />
      </div>
    </div>
  )
}


