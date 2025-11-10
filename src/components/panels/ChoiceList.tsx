'use client'

import { useState, useMemo, useRef, useEffect } from 'react'

interface ChoiceListProps {
  label: string
  value: string | string[] // Support both single and multiple selections
  options: Array<{ value: string; label: string }>
  onChange: (value: string | string[]) => void
  layout?: 'stacked' | 'two-column'
  maxHeight?: string
  searchable?: boolean
  className?: string
  multiple?: boolean // Enable multiple selection mode
  onSearch?: (query: string) => void // Callback for search-based fetching
  isLoading?: boolean // Show loading state during search
  onToggle?: (isOpen: boolean) => void // Callback when dropdown opens/closes
}

export default function ChoiceList({
  label,
  value,
  options,
  onChange,
  layout = 'two-column',
  maxHeight = '300px',
  searchable = true,
  className = '',
  multiple = false, // Default to single selection
  onSearch, // Callback for search-based fetching
  isLoading = false, // Loading state
  onToggle, // Callback when dropdown opens/closes
}: ChoiceListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Notify parent when dropdown state changes
  useEffect(() => {
    onToggle?.(isExpanded)
  }, [isExpanded, onToggle])
  
  // Normalize value to array for easier handling
  const valueArray = useMemo(() => {
    if (multiple) {
      return Array.isArray(value) ? value : (value ? [value] : [])
    }
    return Array.isArray(value) ? [value[0]] : (value ? [value] : [])
  }, [value, multiple])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
        // Don't clear search query immediately - let AsyncChoiceList handle it
        // This prevents losing search results when clicking outside
      }
    }

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    } else {
      // Reset search when dropdown closes (but only if not using onSearch callback)
      // If using onSearch, AsyncChoiceList manages the search state
      if (!onSearch) {
        setSearchQuery('')
      }
    }
  }, [isExpanded, onSearch])

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) {
      return options
    }
    const query = searchQuery.toLowerCase()
    return options.filter(option =>
      option.label.toLowerCase().includes(query) ||
      option.value.toLowerCase().includes(query)
    )
  }, [options, searchQuery])

  // Find selected options
  const selectedOptions = useMemo(() => {
    return options.filter(opt => valueArray.includes(opt.value))
  }, [options, valueArray])
  
  // Handle selection change
  const handleOptionClick = (optionValue: string) => {
    if (multiple) {
      // Toggle selection for multiple mode
      const newValue = valueArray.includes(optionValue)
        ? valueArray.filter(v => v !== optionValue)
        : [...valueArray, optionValue]
      onChange(newValue)
    } else {
      // Single selection mode
      onChange(optionValue)
      setIsExpanded(false)
      setSearchQuery('')
    }
  }

  // Two-column layout: label on left, choice list on right
  if (layout === 'two-column') {
    return (
      <div className={`grid grid-cols-[200px_1fr] gap-4 items-start py-3 border-b border-neutral-100 last:border-b-0 ${className}`}>
        <label className="text-sm font-semibold text-neutral-700 pt-2.5">
          {label}
        </label>
        <div className="min-w-0" ref={containerRef}>
          {/* Selected value display / Toggle button */}
          <div className="mb-2">
            {selectedOptions.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {selectedOptions.map((opt) => (
                  <span
                    key={opt.value}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200"
                  >
                    {opt.label}
                    {multiple && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOptionClick(opt.value)
                        }}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="px-3 py-1.5 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                >
                  {isExpanded ? 'Hide options' : multiple ? 'Add/Remove' : 'Change'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-4 py-2 text-sm text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Select {label}
              </button>
            )}
          </div>

          {/* Expandable choice list */}
          {isExpanded && (
            <div className="border border-neutral-200 rounded-lg bg-white shadow-sm">
              {/* Search input */}
              {(searchable && (options.length > 10 || onSearch)) && (
                <div className="p-3 border-b border-neutral-200">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={onSearch ? `Search ${label.toLowerCase()}... (type to search all records)` : `Search ${label.toLowerCase()}...`}
                      value={searchQuery}
                      onChange={(e) => {
                        const newQuery = e.target.value
                        setSearchQuery(newQuery)
                        // Trigger search-based fetching if callback provided
                        if (onSearch) {
                          onSearch(newQuery)
                        }
                      }}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      autoFocus
                    />
                    {isLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  {searchQuery && !isLoading && (
                    <p className="mt-2 text-xs text-neutral-500">
                      {filteredOptions.length} option{filteredOptions.length !== 1 ? 's' : ''} found
                      {onSearch && ' (searching all records...)'}
                    </p>
                  )}
                  {isLoading && (
                    <p className="mt-2 text-xs text-neutral-500">
                      Searching...
                    </p>
                  )}
                </div>
              )}

              {/* Options list */}
              <div
                className="overflow-y-auto"
                style={{ maxHeight }}
              >
                {filteredOptions.length === 0 ? (
                  <div className="p-4 text-center text-sm text-neutral-500">
                    No options found
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredOptions.map((option) => {
                      const isSelected = valueArray.includes(option.value)
                      return (
                        <button
                          key={option.value}
                          onClick={() => handleOptionClick(option.value)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all mb-1 ${
                            isSelected
                              ? 'bg-green-50 text-green-700 border border-green-200 font-medium'
                              : 'text-neutral-700 hover:bg-neutral-50 hover:border-neutral-200 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{option.label}</span>
                            {isSelected && (
                              <svg
                                className="w-4 h-4 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Footer with option count */}
              <div className="px-3 py-2 border-t border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
                {filteredOptions.length === options.length
                  ? `${options.length} total option${options.length !== 1 ? 's' : ''}`
                  : `Showing ${filteredOptions.length} of ${options.length} option${options.length !== 1 ? 's' : ''}`}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Stacked layout (backward compatibility)
  return (
    <div className={`py-3 border-b border-neutral-100 last:border-b-0 ${className}`}>
      <label className="block text-sm font-semibold text-neutral-700 mb-2">
        {label}
      </label>
      <div className="border border-neutral-200 rounded-lg bg-white shadow-sm">
        {searchable && options.length > 10 && (
          <div className="p-3 border-b border-neutral-200">
            <input
              type="text"
              placeholder={`Search ${label.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        )}
        <div className="overflow-y-auto p-2" style={{ maxHeight }}>
          {filteredOptions.map((option) => {
            const isSelected = valueArray.includes(option.value)
            return (
              <button
                key={option.value}
                onClick={() => handleOptionClick(option.value)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all mb-1 ${
                  isSelected
                    ? 'bg-green-50 text-green-700 border border-green-200 font-medium'
                    : 'text-neutral-700 hover:bg-neutral-50 hover:border-neutral-200 border border-transparent'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

