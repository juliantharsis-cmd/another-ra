'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AIAssistantIcon, ChatIcon, OverviewIcon, TrendIcon, RecommendationsIcon } from './icons'

interface AIAssistantMenuOption {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
  isPlaceholder?: boolean
}

interface AIAssistantMenuProps {
  isOpen: boolean
  onClose: () => void
  buttonRef?: React.RefObject<HTMLButtonElement>
  sidebarRef?: React.RefObject<HTMLDivElement>
  isCollapsed?: boolean
  onChatClick: () => void
  onAnalysisClick?: (type: 'overview' | 'trends' | 'recommendations') => void
}

export default function AIAssistantMenu({ 
  isOpen, 
  onClose, 
  buttonRef,
  sidebarRef,
  isCollapsed = false,
  onChatClick,
  onAnalysisClick
}: AIAssistantMenuProps) {
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate position relative to button and sidebar footer
  useEffect(() => {
    if (!isOpen || !buttonRef?.current || !sidebarRef?.current) return

    const button = buttonRef.current
    const sidebar = sidebarRef.current
    const buttonRect = button.getBoundingClientRect()
    
    if (isCollapsed) {
      // Collapsed: position vertically to the right of button
      setPosition({
        top: buttonRect.top,
        left: buttonRect.right + 12, // 12px gap to the right
      })
    } else {
      // Expanded: position horizontally just above the main AI button
      const iconSize = 32 // w-8 = 32px
      const gap = 12 // gap-3 = 12px
      const numOptions = 4 // Chat + Overview + Trends + Recommendations
      const menuWidth = numOptions * iconSize + (numOptions - 1) * gap
      
      // Position just above the button (button top - icon height - gap)
      const menuTop = buttonRect.top - iconSize - gap
      
      // Center the menu horizontally above the button
      // Calculate left position: center of button minus half menu width
      let menuLeft = buttonRect.left + (buttonRect.width / 2) - (menuWidth / 2)
      
      // Ensure menu stays within screen bounds
      const screenWidth = window.innerWidth
      const minLeft = 8 // Minimum margin from screen edge
      const maxLeft = screenWidth - menuWidth - 8 // Maximum left position
      
      // If menu would go off-screen to the right, adjust it
      if (menuLeft + menuWidth > screenWidth - 8) {
        menuLeft = Math.max(minLeft, maxLeft)
      }
      
      // Ensure menu doesn't go off the left edge
      if (menuLeft < minLeft) {
        menuLeft = minLeft
      }
      
      // Ensure menu doesn't go above the screen
      const minTop = 8
      const finalTop = Math.max(minTop, menuTop)
      
      setPosition({
        top: finalTop,
        left: menuLeft,
      })
    }
  }, [isOpen, buttonRef, sidebarRef, isCollapsed])

  // Calculate button position for clipPath exclusion
  useEffect(() => {
    if (isOpen && buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setButtonRect(rect)
    } else {
      setButtonRect(null)
    }
  }, [isOpen, buttonRef])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef?.current &&
        !buttonRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('.ai-assistant-menu')
      ) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, buttonRef, onClose])

  if (!isOpen || !mounted) return null

  const options: AIAssistantMenuOption[] = [
    {
      id: 'chat',
      label: 'Chat',
      icon: ChatIcon,
      action: () => {
        onChatClick()
        onClose()
      },
    },
    {
      id: 'overview',
      label: 'Overview',
      icon: OverviewIcon,
      action: () => {
        // Placeholder - work in progress
        console.log('Overview analysis - coming soon')
        onClose()
      },
      isPlaceholder: true,
    },
    {
      id: 'trends',
      label: 'Trends',
      icon: TrendIcon,
      action: () => {
        // Placeholder - work in progress
        console.log('Trend analysis - coming soon')
        onClose()
      },
      isPlaceholder: true,
    },
    {
      id: 'recommendations',
      label: 'Recommendations',
      icon: RecommendationsIcon,
      action: () => {
        // Placeholder - work in progress
        console.log('Recommendations - coming soon')
        onClose()
      },
      isPlaceholder: true,
    },
  ]

  const menuContent = (
    <>
      {/* Overlay with shading (no blur) - exclude AI button area from shade */}
      <div
        className="fixed inset-0 bg-black/40 z-[70] animate-fade-in"
        onClick={onClose}
        style={
          buttonRect
            ? {
                clipPath: `polygon(
                  0% 0%,
                  0% 100%,
                  ${buttonRect.left - 8}px 100%,
                  ${buttonRect.left - 8}px ${buttonRect.top - 8}px,
                  ${buttonRect.right + 8}px ${buttonRect.top - 8}px,
                  ${buttonRect.right + 8}px ${buttonRect.bottom + 8}px,
                  ${buttonRect.left - 8}px ${buttonRect.bottom + 8}px,
                  ${buttonRect.left - 8}px 100%,
                  100% 100%,
                  100% 0%
                )`,
              }
            : undefined
        }
      />

      {/* Menu Container - Positioned above button when expanded, to the right when collapsed */}
      <div
        className="ai-assistant-menu fixed z-[71] pointer-events-none"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <div className={`flex ${isCollapsed ? 'flex-col' : 'flex-row'} gap-3 pointer-events-auto`}>
          {options.map((option, index) => {
            const Icon = option.icon
            const isPlaceholder = option.isPlaceholder || false
            return (
              <div
                key={option.id}
                className={`relative animate-slide-in-from-right`}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <button
                  onClick={option.action}
                  disabled={isPlaceholder}
                  className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold shadow-sm transition-all duration-200 relative group ${
                    isPlaceholder
                      ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed opacity-60'
                      : 'bg-teal-500 text-white hover:bg-teal-600 hover:scale-110 cursor-pointer'
                  }`}
                  title={isPlaceholder ? `${option.label} - Coming Soon` : option.label}
                >
                  <Icon className={`w-4 h-4 ${isPlaceholder ? 'opacity-50' : ''}`} />
                  {/* Work in progress indicator for placeholders */}
                  {isPlaceholder && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full border border-white animate-pulse" />
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )

  return createPortal(menuContent, document.body)
}

