'use client'

import { useState, useRef, useEffect } from 'react'

interface MultiSelectProps {
  value: string[]
  onChange: (value: string[]) => void
  options: string[]
  placeholder?: string
  label?: string
  className?: string
  maxHeight?: string
  isLoading?: boolean
}

export default function MultiSelect({
  value = [],
  onChange,
  options,
  placeholder = 'Select options...',
  label,
  className = '',
  maxHeight = '300px',
  isLoading = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter options based on search query
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
        setHighlightedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      setTimeout(() => inputRef.current?.focus(), 0)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
      } else if (e.key === 'Enter' && highlightedIndex >= 0) {
        e.preventDefault()
        handleToggle(filteredOptions[highlightedIndex])
      } else if (e.key === 'Escape') {
        setIsOpen(false)
        setSearchQuery('')
        setHighlightedIndex(-1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredOptions, highlightedIndex])

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.children[highlightedIndex + 1] as HTMLElement
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex])

  const handleToggle = (option: string) => {
    const newValue = value.includes(option)
      ? value.filter((v) => v !== option)
      : [...value, option]
    onChange(newValue)
    setSearchQuery('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
    setSearchQuery('')
  }

  const handleRemoveTag = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation()
    onChange(value.filter((v) => v !== tag))
  }

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setSearchQuery('')
      setHighlightedIndex(-1)
    }
  }

  const displayText = value.length > 0 
    ? `${value.length} selected` 
    : placeholder

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-neutral-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={handleToggleDropdown}
          className={`w-full text-left px-3 py-2.5 border border-neutral-300 rounded-lg text-sm bg-white hover:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
            isOpen ? 'border-green-500 ring-2 ring-green-500' : ''
          }`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-wrap gap-1.5 flex-1 min-w-0">
              {value.length === 0 ? (
                <span className="text-neutral-500">{displayText}</span>
              ) : (
                <>
                  {value.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-700 border border-green-200"
                    >
                      {tag.length > 15 ? `${tag.substring(0, 15)}...` : tag}
                      <button
                        type="button"
                        onClick={(e) => handleRemoveTag(e, tag)}
                        className="ml-1.5 text-green-600 hover:text-green-800"
                        aria-label={`Remove ${tag}`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                  {value.length > 2 && (
                    <span className="text-xs text-neutral-500">
                      +{value.length - 2} more
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center space-x-1 ml-2">
              {value.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-neutral-400 hover:text-neutral-600 p-0.5"
                  aria-label="Clear selection"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <svg
                className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>

        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden"
            style={{ maxHeight }}
          >
            {/* Search input */}
            <div className="p-2 border-b border-neutral-200">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search options..."
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Options list */}
            <div className="overflow-y-auto" style={{ maxHeight: `calc(${maxHeight} - 60px)` }}>
              {isLoading ? (
                <div className="p-4 text-center text-sm text-neutral-500">
                  Loading options...
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-sm text-neutral-500">
                  No options found
                </div>
              ) : (
                <ul role="listbox" className="py-1">
                  {filteredOptions.map((option, index) => {
                    const isSelected = value.includes(option)
                    const isHighlighted = index === highlightedIndex
                    return (
                      <li
                        key={option}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleToggle(option)}
                        className={`px-3 py-2 cursor-pointer text-sm flex items-center justify-between ${
                          isHighlighted ? 'bg-green-50' : 'hover:bg-neutral-50'
                        } ${isSelected ? 'bg-green-50' : ''}`}
                      >
                        <span className={isSelected ? 'font-medium text-green-700' : 'text-neutral-700'}>
                          {option}
                        </span>
                        {isSelected && (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Footer with count */}
            {filteredOptions.length > 0 && (
              <div className="px-3 py-2 border-t border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
                {filteredOptions.length} option{filteredOptions.length !== 1 ? 's' : ''} available
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

