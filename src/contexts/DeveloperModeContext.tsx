'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface DeveloperModeContextType {
  isDeveloperMode: boolean
  toggleDeveloperMode: () => void
  setDeveloperMode: (enabled: boolean) => void
}

const DeveloperModeContext = createContext<DeveloperModeContextType | undefined>(undefined)

const STORAGE_KEY = 'developer_mode_enabled'

export function DeveloperModeProvider({ children }: { children: ReactNode }) {
  const [isDeveloperMode, setIsDeveloperMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      setIsDeveloperMode(stored === 'true')
      setMounted(true)
    }
  }, [])

  const toggleDeveloperMode = () => {
    const newValue = !isDeveloperMode
    setIsDeveloperMode(newValue)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(newValue))
    }
  }

  const setDeveloperMode = (enabled: boolean) => {
    setIsDeveloperMode(enabled)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(enabled))
    }
  }

  // Always render the Provider to ensure context is available
  // Use default value (false) until mounted to prevent hydration mismatch
  return (
    <DeveloperModeContext.Provider
      value={{
        isDeveloperMode: mounted ? isDeveloperMode : false,
        toggleDeveloperMode,
        setDeveloperMode,
      }}
    >
      {children}
    </DeveloperModeContext.Provider>
  )
}

export function useDeveloperMode() {
  const context = useContext(DeveloperModeContext)
  if (context === undefined) {
    throw new Error('useDeveloperMode must be used within a DeveloperModeProvider')
  }
  return context
}

