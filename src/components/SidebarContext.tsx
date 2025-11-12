'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SidebarContextType {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  toggleCollapse: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

const SIDEBAR_COLLAPSED_KEY = 'sidebar:collapsed'

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Initialize with default value (always true) to avoid hydration mismatch
  // Server and client must render the same initial state
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true)

  // Load from localStorage after mount (client-side only)
  // This ensures server and client render the same initially, then update after mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
      if (stored !== null) {
        setIsCollapsed(stored === 'true')
      }
    }
  }, [])

  // Persist to localStorage whenever state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed))
    }
  }, [isCollapsed])

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  const handleSetIsCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed)
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed: handleSetIsCollapsed, toggleCollapse }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

