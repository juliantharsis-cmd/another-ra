'use client'

import { useState, useRef, useEffect } from 'react'

interface SearchableSelectProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  label?: string
  className?: string
  maxHeight?: string
  isLoading?: boolean
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  label,
  className = '',
  maxHeight = '300px',
  isLoading = false,
}: SearchableSelectProps) {
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

  // Get display value
  const displayValue = value || placeholder

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
      // Focus input when dropdown opens
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
        handleSelect(filteredOptions[highlightedIndex])
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

  const handleSelect = (option: string) => {
    onChange(option)
    setIsOpen(false)
    setSearchQuery('')
    setHighlightedIndex(-1)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setSearchQuery('')
  }

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setSearchQuery('')
      setHighlightedIndex(-1)
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-neutral-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={handleToggle}
          className={`w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-left flex items-center justify-between ${
            !value ? 'text-neutral-400' : 'text-neutral-900'
          } ${isOpen ? 'ring-2 ring-green-500 border-green-500' : ''}`}
          aria-label={label || placeholder}
        >
          <span className="truncate flex-1">{displayValue}</span>
          <div className="flex items-center space-x-2 ml-2">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
                aria-label="Clear selection"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <svg
              className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {isOpen && (
          <div
            className="absolute z-50 w-full mt-1 bg-white border border-neutral-300 rounded-lg shadow-lg overflow-hidden"
            style={{ maxHeight }}
          >
            {/* Search input */}
            <div className="p-2 border-b border-neutral-200 bg-neutral-50">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setHighlightedIndex(-1)
                }}
                placeholder="Search options..."
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Options list */}
            <div
              ref={dropdownRef}
              className="overflow-y-auto"
              style={{ maxHeight: `calc(${maxHeight} - 60px)` }}
            >
              {/* "All" option */}
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-green-50 transition-colors ${
                  value === '' ? 'bg-green-100 text-green-700 font-medium' : 'text-neutral-700'
                }`}
              >
                All {label || 'Options'}
              </button>

              {/* Filtered options */}
              {isLoading ? (
                <div className="px-4 py-8 text-center text-sm text-neutral-500">
                  Loading options...
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-neutral-500">
                  No options found
                  {searchQuery && ` matching "${searchQuery}"`}
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                      value === option
                        ? 'bg-green-100 text-green-700 font-medium'
                        : highlightedIndex === index
                        ? 'bg-green-50 text-neutral-900'
                        : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {option}
                  </button>
                ))
              )}

              {/* Show count and total */}
              {filteredOptions.length > 0 && (
                <div className="px-4 py-2 text-xs text-neutral-500 border-t border-neutral-200 bg-neutral-50">
                  {searchQuery ? (
                    <>
                      {filteredOptions.length} of {options.length} option{options.length !== 1 ? 's' : ''} found
                    </>
                  ) : (
                    <>
                      {options.length} option{options.length !== 1 ? 's' : ''} available
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

