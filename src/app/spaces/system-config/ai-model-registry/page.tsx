'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { useSidebar } from '@/components/SidebarContext'
import ListDetailTemplate from '@/components/templates/ListDetailTemplate'
import { aiModelRegistryConfig } from '@/components/templates/configs/aiModelRegistryConfig'

/**
 * AI Model Registry Page
 * 
 * This page allows administrators to view and manage AI models
 * stored in the Airtable AI Model Registry table.
 */
export default function AIModelRegistryPage() {
  const { isCollapsed } = useSidebar()
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    // Set mounted state first to ensure consistent rendering
    setIsMounted(true)
    
    // Check if we're transitioning from home page (only after mount to prevent hydration issues)
    if (typeof window !== 'undefined') {
      const isTransitioning = localStorage.getItem('space_transition') === 'true'
      if (isTransitioning) {
        // Clear the flag immediately to prevent flickering on subsequent renders
        localStorage.removeItem('space_transition')
        // Show content immediately without delay to prevent flicker
        setShouldAnimate(true)
      }
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
          opacity: isMounted ? 1 : 1, // Always visible after hydration
        }}
      >
        <ListDetailTemplate config={aiModelRegistryConfig} />
      </div>
    </div>
  )
}

