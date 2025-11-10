'use client'

import { useState, useRef, useEffect, useMemo } from 'react'

interface FilterPopoverProps {
  label: string
  options: string[] // Format: "Name|ID" or just "Name"
  value: string | string[] // Selected value(s)
  onChange: (value: string | string[]) => void
  multiple?: boolean
  isOpen: boolean
  onToggle: (isOpen: boolean) => void
  placeholder?: string
  fieldKey?: string // Field key to determine color scheme
}

export default function FilterPopover({
  label,
  options,
  value,
  onChange,
  multiple = true,
  isOpen,
  onToggle,
  placeholder = 'Find an option',
  fieldKey,
}: FilterPopoverProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Parse options into { label, value } format
  const parsedOptions = useMemo(() => {
    return options.map(opt => {
      if (opt.includes('|')) {
        const [label, id] = opt.split('|')
        return { label: label.trim(), value: id.trim() }
      }
      return { label: opt, value: opt }
    })
  }, [options])

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) {
      return parsedOptions
    }
    const query = searchQuery.toLowerCase()
    return parsedOptions.filter(opt =>
      opt.label.toLowerCase().includes(query)
    )
  }, [parsedOptions, searchQuery])

  // Get selected values as array
  const selectedValues = useMemo(() => {
    if (multiple) {
      return Array.isArray(value) ? value : (value ? [value] : [])
    }
    return value ? [value] : []
  }, [value, multiple])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onToggle(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Focus search input when opened
      setTimeout(() => inputRef.current?.focus(), 0)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onToggle])

  // Handle checkbox toggle
  const handleToggle = (optionValue: string) => {
    if (multiple) {
      // selectedValues is already string[] from useMemo
      const currentValues: string[] = selectedValues as string[]
      const newValue: string[] = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue]
      onChange(newValue)
    } else {
      onChange(optionValue)
      onToggle(false)
      setSearchQuery('')
    }
  }

  // Get color for option based on field type and value
  const getOptionColor = (optionLabel: string, optionValue: string) => {
    // Status field: use exact colors from table
    if (fieldKey === 'status' || fieldKey === 'Status') {
      const statusColors: Record<string, string> = {
        'Active': 'bg-green-100 text-green-800 border-green-200',
        'Inactive': 'bg-neutral-100 text-neutral-800 border-neutral-200',
        'Submitted': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      }
      // Check both label and value for status
      const statusValue = optionLabel || optionValue
      return statusColors[statusValue] || 'bg-neutral-100 text-neutral-700 border-neutral-200'
    }
    
    // Linked record fields (Company, User Roles, Modules): use green (link color)
    const linkedRecordFields = ['Company', 'User Roles', 'Modules']
    if (fieldKey && linkedRecordFields.includes(fieldKey)) {
      return 'bg-green-100 text-green-700 border-green-200'
    }
    
    // For other fields, use neutral color
    return 'bg-neutral-100 text-neutral-700 border-neutral-200'
  }

  const isActive = selectedValues.length > 0

  return (
    <div ref={containerRef} className="relative">
      {/* Filter Button */}
      <button
        type="button"
        onClick={() => onToggle(!isOpen)}
        className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
          isActive
            ? 'border-green-500 bg-green-50 text-green-700'
            : 'border-neutral-300 bg-white text-neutral-700 hover:border-green-400 hover:text-green-600'
        }`}
      >
        {label}
        {isActive && (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
            {selectedValues.length}
          </span>
        )}
      </button>

      {/* Popover Overlay */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 w-80 bg-white border border-neutral-200 rounded-lg shadow-lg">
          {/* Search Input */}
          <div className="p-3 border-b border-neutral-200">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Options List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-sm text-neutral-500">
                No options found
              </div>
            ) : (
              <div className="py-1">
                {filteredOptions.map((option) => {
                  const isChecked = selectedValues.includes(option.value)
                  return (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-neutral-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggle(option.value)}
                        className="w-4 h-4 text-green-600 border-neutral-300 rounded focus:ring-green-500"
                      />
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getOptionColor(option.label, option.value)}`}>
                        {option.label}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* Filter Logic Indicator */}
          <div className="px-4 py-2 border-t border-neutral-200 bg-neutral-50">
            <div className="flex items-center justify-between text-xs text-neutral-600">
              <span>{label} is</span>
              <select
                className="text-neutral-700 bg-white border border-neutral-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500"
                defaultValue="any"
              >
                <option value="any">any of</option>
                <option value="all">all of</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

