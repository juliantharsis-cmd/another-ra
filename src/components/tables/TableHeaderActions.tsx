'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon } from '../icons'
import { trackEvent } from '@/lib/telemetry'

export interface TableHeaderAction {
  id: string
  label: string
  icon?: React.ReactNode
  onClick: () => void
  shortcut?: string
  divider?: boolean
}

interface TableHeaderActionsProps {
  tableId: string
  actions: TableHeaderAction[]
  className?: string
}

/**
 * Unified Table Header Actions Component
 * 
 * Provides a breadcrumb-style action button with dropdown menu
 * for Import, Export, and Configure Table actions.
 */
export default function TableHeaderActions({
  tableId,
  actions,
  className = '',
}: TableHeaderActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when dropdown is open or button is focused
      if (!isOpen && document.activeElement !== buttonRef.current) return

      // Period key opens menu
      if (event.key === '.' && !isOpen) {
        event.preventDefault()
        setIsOpen(true)
        return
      }

      // Shift + I/E/C for Import/Export/Configure
      if (event.shiftKey) {
        const action = actions.find(a => {
          if (a.shortcut) {
            return event.key.toLowerCase() === a.shortcut.toLowerCase()
          }
          return false
        })
        if (action) {
          event.preventDefault()
          action.onClick()
          setIsOpen(false)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, actions])

  const handleActionClick = (action: TableHeaderAction) => {
    action.onClick()
    setIsOpen(false)

    // Track telemetry
    if (action.id === 'import') {
      trackEvent({ type: 'table.import_clicked', tableId })
    } else if (action.id === 'export') {
      trackEvent({ type: 'table.export_clicked', tableId })
    } else if (action.id === 'configure') {
      trackEvent({ type: 'table.configure_opened', tableId })
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Breadcrumb-style action button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
        aria-label="Table actions"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>Actions</span>
        <ChevronDownIcon
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1">
            {actions.map((action, index) => (
              <div key={action.id}>
                {action.divider && index > 0 && (
                  <div className="border-t border-neutral-200 my-1" />
                )}
                <button
                  onClick={() => handleActionClick(action)}
                  className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none flex items-center gap-2"
                  role="menuitem"
                >
                  {action.icon && <span className="w-4 h-4">{action.icon}</span>}
                  <span className="flex-1">{action.label}</span>
                  {action.shortcut && (
                    <span className="text-xs text-neutral-400 font-mono">
                      {action.shortcut}
                    </span>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

