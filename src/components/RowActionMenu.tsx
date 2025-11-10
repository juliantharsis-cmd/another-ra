'use client'

import { useState, useRef, useEffect } from 'react'
import { Company } from '@/lib/mockData'

interface RowActionMenuProps {
  company: Company
  onOpen: () => void
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
}

export default function RowActionMenu({
  company,
  onOpen,
  onEdit,
  onDelete,
  onDuplicate,
}: RowActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleAction = (action: () => void) => {
    action()
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
        aria-label="More actions"
        aria-expanded={isOpen}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 z-50 py-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAction(onOpen)
            }}
            className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Open
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAction(onEdit)
            }}
            className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAction(onDuplicate)
            }}
            className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Duplicate
          </button>
          <div className="border-t border-neutral-200 my-1"></div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAction(onDelete)
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

