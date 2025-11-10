'use client'

import { useState, useMemo } from 'react'
import SearchableSelect from './SearchableSelect'
import MultiSelect from './MultiSelect'

interface FilterBarProps {
  // Search
  searchQuery: string
  onSearchChange: (query: string) => void
  searchSuggestions?: string[]
  
  // Filters (single-select for now, can be extended to multi-select)
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  statusOptions: string[]
  
  industryFilter: string
  onIndustryFilterChange: (value: string) => void
  industryOptions: string[]
  
  activityFilter: string
  onActivityFilterChange: (value: string) => void
  activityOptions: string[]
  
  // Multi-select support (for future use)
  multiSelect?: boolean
  
  // Loading state
  isLoading?: boolean
}

export default function FilterBar({
  searchQuery,
  onSearchChange,
  searchSuggestions = [],
  statusFilter,
  onStatusFilterChange,
  statusOptions,
  industryFilter,
  onIndustryFilterChange,
  industryOptions,
  activityFilter,
  onActivityFilterChange,
  activityOptions,
  multiSelect = false,
  isLoading = false,
}: FilterBarProps) {
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (statusFilter) count++
    if (industryFilter) count++
    if (activityFilter) count++
    return count
  }, [statusFilter, industryFilter, activityFilter])

  const hasActiveFilters = searchQuery || activeFilterCount > 0

  const handleClearFilters = () => {
    onSearchChange('')
    onStatusFilterChange('')
    onIndustryFilterChange('')
    onActivityFilterChange('')
  }

  const handleSearchChange = (value: string) => {
    onSearchChange(value)
    if (value && searchSuggestions.length > 0) {
      const filtered = searchSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredSuggestions(filtered.slice(0, 5))
      setShowSearchSuggestions(filtered.length > 0)
    } else {
      setShowSearchSuggestions(false)
    }
  }

  return (
    <div className="mb-4">
      {/* Compact Header: Search + Filters Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Global Search - Always Visible */}
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (searchQuery && filteredSuggestions.length > 0) {
                setShowSearchSuggestions(true)
              }
            }}
            onBlur={() => {
              setTimeout(() => setShowSearchSuggestions(false), 200)
            }}
            placeholder="Search by company name, ISIN code..."
            className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
            aria-label="Search companies"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {/* Autocomplete Suggestions */}
          {showSearchSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    handleSearchChange(suggestion)
                    setShowSearchSuggestions(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filters Button with Badge */}
        <div className="relative sm:w-auto w-full">
          <button
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-all ${
              isFilterPanelOpen || activeFilterCount > 0
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-neutral-300 bg-white text-neutral-700 hover:border-green-500 hover:text-green-600'
            }`}
            aria-label="Toggle filters"
            aria-expanded={isFilterPanelOpen}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-semibold rounded-full min-w-[20px] text-center">
                {activeFilterCount}
              </span>
            )}
            <svg
              className={`w-4 h-4 transition-transform ${isFilterPanelOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expandable Filter Panel */}
      {isFilterPanelOpen && (
        <div className="mt-3 border border-neutral-200 rounded-lg bg-white shadow-sm">
          <div className="p-4 space-y-4">
            {/* Panel Header with Clear Button */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="text-sm font-semibold text-neutral-900">Filter Options</h3>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs text-neutral-500 hover:text-green-600 transition-colors font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>

            {/* Filter Dropdowns - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <SearchableSelect
                  value={statusFilter}
                  onChange={onStatusFilterChange}
                  options={statusOptions}
                  placeholder="All Status"
                  maxHeight="250px"
                  isLoading={isLoading}
                />
              </div>

              <div>
                <SearchableSelect
                  value={industryFilter}
                  onChange={onIndustryFilterChange}
                  options={industryOptions}
                  placeholder="All Industries"
                  maxHeight="300px"
                  isLoading={isLoading}
                />
              </div>

              <div>
                <SearchableSelect
                  value={activityFilter}
                  onChange={onActivityFilterChange}
                  options={activityOptions}
                  placeholder="All Activities"
                  maxHeight="350px"
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
