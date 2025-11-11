'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { useSidebar } from '@/components/SidebarContext'
import ListDetailTemplate from '@/components/templates/ListDetailTemplate'
import { standardECMClassificationConfig } from '@/components/templates/configs/standardECMClassificationConfig'

export default function StandardECMClassificationPage() {
  const { isCollapsed } = useSidebar()
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
    if (typeof window !== 'undefined') {
      const isTransitioning = localStorage.getItem('space_transition') === 'true'
      if (isTransitioning) {
        localStorage.removeItem('space_transition')
        setShouldAnimate(true)
      }
    }
  }, [])
  
  return (
    <div className="fixed inset-0 flex bg-gray-50 overflow-hidden" style={{ margin: 0, padding: 0 }}>
      <Sidebar />
      <div 
        className={`flex-1 p-8 overflow-hidden flex flex-col ${isCollapsed ? 'ml-16' : 'ml-64'} ${shouldAnimate ? 'animate-fade-in' : ''}`}
        style={{ 
          transition: 'margin-left 300ms ease-in-out', 
          animationDelay: shouldAnimate ? '0.4s' : '0s',
          opacity: isMounted ? 1 : 1,
        }}
      >
        <ListDetailTemplate config={standardECMClassificationConfig} />
      </div>
    </div>
  )
}

