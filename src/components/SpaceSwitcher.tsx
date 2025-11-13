'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname, useRouter } from 'next/navigation'
import { applicationListApi, ApplicationList } from '@/lib/api/applicationList'

export interface Space {
  id: string
  letter: string
  name: string
  path: string
  status: 'active' | 'coming-soon' | 'inactive'
}

// Define available spaces
const AVAILABLE_SPACES: Omit<Space, 'status'>[] = [
  { id: 'system-config', letter: 'S', name: 'System Configuration', path: '/spaces/system-config' },
  { id: 'admin', letter: 'A', name: 'Administration', path: '/spaces/admin' },
  // Add more spaces as needed
]

interface SpaceSwitcherProps {
  isOpen: boolean
  onClose: () => void
  currentSpaceLetter: string
  sidebarRef?: React.RefObject<HTMLDivElement>
  isCollapsed?: boolean
}

// Cache key for localStorage
const CACHE_KEY = 'space_statuses_cache'
const CACHE_TIMESTAMP_KEY = 'space_statuses_cache_timestamp'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Shared cache state across component instances
let globalSpaceCache: Space[] | null = null
let globalCacheTimestamp: number = 0

export default function SpaceSwitcher({ isOpen, onClose, currentSpaceLetter, sidebarRef, isCollapsed = false }: SpaceSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [spaces, setSpaces] = useState<Space[]>(() => {
    // Initialize with cached data if available
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(CACHE_KEY)
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
      if (cached && timestamp && Date.now() - parseInt(timestamp) < CACHE_TTL) {
        try {
          const cachedSpaces = JSON.parse(cached)
          globalSpaceCache = cachedSpaces
          globalCacheTimestamp = parseInt(timestamp)
          return cachedSpaces
        } catch (e) {
          // Cache corrupted, will fetch fresh
        }
      }
    }
    // Default: mark all as active until we fetch
    return AVAILABLE_SPACES.map(space => ({
      ...space,
      status: 'active' as const,
    }))
  })
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate position relative to sidebar header
  useEffect(() => {
    if (!isOpen || !sidebarRef?.current) return

    const sidebar = sidebarRef.current
    const header = sidebar.querySelector('[class*="border-b"]') as HTMLElement
    if (header) {
      const rect = header.getBoundingClientRect()
      const spaceLetterButton = header.querySelector('button') as HTMLElement
      if (spaceLetterButton) {
        const buttonRect = spaceLetterButton.getBoundingClientRect()
        setPosition({
          top: buttonRect.top, // Align with the space letter button
          left: buttonRect.right + 12, // 12px gap to the right of the letter
        })
      } else {
        // Fallback: use header position
        setPosition({
          top: rect.top + 16, // Offset from top
          left: isCollapsed ? rect.right + 12 : rect.right + 12, // To the right of sidebar
        })
      }
    }
  }, [isOpen, sidebarRef, isCollapsed])

  // Pre-fetch space statuses when component mounts (not when switcher opens)
  useEffect(() => {
    async function fetchSpaceStatuses() {
      // Check if we have fresh cache
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(CACHE_KEY)
        const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
        const now = Date.now()
        
        if (cached && timestamp) {
          const cacheAge = now - parseInt(timestamp)
          
          // Use cache if fresh
          if (cacheAge < CACHE_TTL) {
            try {
              const cachedSpaces = JSON.parse(cached)
              globalSpaceCache = cachedSpaces
              globalCacheTimestamp = parseInt(timestamp)
              setSpaces(cachedSpaces)
              
              // If cache is stale but not expired, refresh in background
              if (cacheAge > CACHE_TTL / 2) {
                fetchAndCacheStatuses()
              }
              return
            } catch (e) {
              // Cache corrupted, fetch fresh
            }
          }
        }
      }
      
      // Fetch fresh data
      await fetchAndCacheStatuses()
    }

    async function fetchAndCacheStatuses() {
      try {
        const result = await applicationListApi.getPaginated({ limit: 100 })
        const applications = result.data

        // Map spaces with their status from application list
        const spacesWithStatus: Space[] = AVAILABLE_SPACES.map(space => {
          // Find matching application by name (case-insensitive)
          const app = applications.find(
            (a: ApplicationList) => a.Name?.toLowerCase() === space.name.toLowerCase()
          )

          let status: 'active' | 'coming-soon' | 'inactive' = 'inactive'
          if (app) {
            if (app.Status === 'Active') {
              status = 'active'
            } else {
              status = 'coming-soon'
            }
          } else {
            // Default: if space exists in code, mark as active
            status = 'active'
          }

          return {
            ...space,
            status,
          }
        })

        // Cache the result
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEY, JSON.stringify(spacesWithStatus))
          localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
        }
        
        globalSpaceCache = spacesWithStatus
        globalCacheTimestamp = Date.now()
        setSpaces(spacesWithStatus)
      } catch (error) {
        console.error('Failed to fetch space statuses:', error)
        // Keep existing spaces state on error
      }
    }

    fetchSpaceStatuses()
  }, []) // Run once on mount, not when switcher opens

  const handleSpaceClick = (space: Space) => {
    if (space.status === 'coming-soon' || space.status === 'inactive') {
      return // Don't navigate if not active
    }

    if (pathname !== space.path) {
      router.push(space.path)
    }
    onClose()
  }

  if (!mounted || !isOpen) return null

  const currentSpace = spaces.find(s => s.letter === currentSpaceLetter) || spaces[0]
  const otherSpaces = spaces.filter(s => s.letter !== currentSpaceLetter)

  const modalContent = (
    <>
      {/* Overlay with shading */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] animate-fade-in"
        onClick={onClose}
      />

      {/* Space Switcher Container - Positioned next to sidebar */}
      <div
        className="fixed z-[101] pointer-events-none"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <div className="flex items-start gap-3 pointer-events-auto">
          {/* Other Space Letters - Sliding Animation */}
          <div className="flex flex-col gap-3">
            {otherSpaces.map((space, index) => (
                <div
                  key={space.id}
                  className="relative animate-slide-in-from-right"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Space Letter Button */}
                    <button
                      onClick={() => handleSpaceClick(space)}
                      disabled={space.status !== 'active'}
                      className={`
                        w-8 h-8 rounded flex items-center justify-center text-sm font-bold shadow-sm
                        transition-all duration-200 relative group
                        ${
                          space.status === 'active'
                            ? 'bg-green-500 text-white hover:bg-green-600 hover:scale-110 cursor-pointer'
                            : space.status === 'coming-soon'
                            ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed opacity-75 pointer-events-none'
                            : 'bg-neutral-200 text-neutral-400 cursor-not-allowed opacity-50 pointer-events-none'
                        }
                      `}
                      title={
                        space.status === 'active'
                          ? space.name
                          : space.status === 'coming-soon'
                          ? `${space.name} - Coming Soon`
                          : `${space.name} - Inactive`
                      }
                    >
                      {space.letter}
                    </button>
                    
                    {/* Elegant Space Name Display */}
                    <div className={`
                      px-3 py-1.5 rounded-lg shadow-sm backdrop-blur-sm
                      transition-all duration-200 whitespace-nowrap
                      ${
                        space.status === 'active'
                          ? 'bg-white/95 text-neutral-900 border border-neutral-200'
                          : space.status === 'coming-soon'
                          ? 'bg-neutral-100/95 text-neutral-500 border border-neutral-300'
                          : 'bg-neutral-50/95 text-neutral-400 border border-neutral-200'
                      }
                    `}>
                      <div className="text-xs font-semibold leading-tight">
                        {space.name}
                      </div>
                      {space.status === 'coming-soon' && (
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          Coming Soon
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  )

  return createPortal(modalContent, document.body)
}

