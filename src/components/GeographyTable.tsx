'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Geography } from '@/lib/api/geography'
import { EyeIcon, ArrowPathIcon } from './icons'
import FilterBar from './FilterBar'
import Notification from './Notification'

// Fallback options if not provided from API
const defaultStatusOptions = ['Active', 'Inactive']

interface GeographyTableProps {
  geographies: Geography[]
  onGeographyClick: (geography: Geography) => void
  onAddGeography: () => void
  // Pagination props
  currentPage?: number
  pageSize?: number
  totalCount?: number
  hasMore?: boolean
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  userDefaultPageSize?: number // User's default page size from preferences
  // Filter props
  searchQuery?: string
  statusFilter?: string
  countryFilter?: string
  onSearchChange?: (query: string) => void
  onStatusFilterChange?: (status: string) => void
  onCountryFilterChange?: (country: string) => void
  // Filter options (from Airtable)
  statusOptions?: string[]
  countryOptions?: string[]
  // Search suggestions for autocomplete
  searchSuggestions?: string[]
  // Sort props
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSortChange?: (field: string, order: 'asc' | 'desc') => void
  // Loading state
  isLoading?: boolean
}

type SortField = 'regionName' | 'country' | 'status'
type SortDirection = 'asc' | 'desc' | null

export default function GeographyTable({
  geographies,
  onGeographyClick,
  onAddGeography,
  // Pagination props
  currentPage = 1,
  pageSize = 25,
  totalCount = 0,
  hasMore = false,
  onPageChange,
  onPageSizeChange,
  userDefaultPageSize = 25,
  // Filter props
  searchQuery: externalSearchQuery = '',
  statusFilter: externalStatusFilter = '',
  countryFilter: externalCountryFilter = '',
  onSearchChange,
  onStatusFilterChange,
  onCountryFilterChange,
  // Filter options
  statusOptions: externalStatusOptions,
  countryOptions: externalCountryOptions,
  // Search suggestions
  searchSuggestions = [],
  // Sort props
  sortBy: externalSortBy = '',
  sortOrder: externalSortOrder = 'asc',
  onSortChange,
  // Loading state
  isLoading = false,
}: GeographyTableProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState<string>('')
  const [localStatusFilter, setLocalStatusFilter] = useState<string>('')
  const [localCountryFilter, setLocalCountryFilter] = useState<string>('')
  const [localSortField, setLocalSortField] = useState<SortField | null>(null)
  const [localSortDirection, setLocalSortDirection] = useState<SortDirection>(null)

  // Determine if we're using server-side or client-side
  const isServerSide = !!onPageChange && !!onSearchChange && !!onSortChange

  const searchQuery = isServerSide ? externalSearchQuery : localSearchQuery
  const statusFilter = isServerSide ? externalStatusFilter : localStatusFilter
  const countryFilter = isServerSide ? externalCountryFilter : localCountryFilter
  const sortField = isServerSide ? (externalSortBy as SortField | null) : localSortField
  const sortDirection = isServerSide ? (externalSortOrder as SortDirection) : localSortDirection

  // UI state
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  // For server-side pagination, geographies are already filtered/sorted
  // For client-side, we still need to filter/sort
  const filteredAndSortedGeographies = useMemo(() => {
    if (isServerSide) {
      return geographies
    }

    // Client-side: filter and sort locally
    const searchInGeography = (geography: Geography, query: string): boolean => {
      if (!query) return true
      const lowerQuery = query.toLowerCase()
      const Name = geography.Name || geography.regionName || ''
      const CODE = geography.CODE || geography.country || ''
      const Status = geography.Status || geography.status || ''
      const Notes = geography.Notes || geography.notes || ''
      return (
        Name.toLowerCase().includes(lowerQuery) ||
        CODE.toLowerCase().includes(lowerQuery) ||
        Status.toLowerCase().includes(lowerQuery) ||
        Notes.toLowerCase().includes(lowerQuery)
      )
    }

    let result = geographies.filter((geography) => {
      if (!searchInGeography(geography, searchQuery)) return false
      const Status = geography.Status || geography.status
      const CODE = geography.CODE || geography.country
      if (statusFilter && Status !== statusFilter) return false
      if (countryFilter && CODE !== countryFilter) return false
      return true
    })

    if (sortField && sortDirection) {
      result = [...result].sort((a, b) => {
        // Map sort field to actual field name (Airtable or legacy)
        let aValue: string = ''
        let bValue: string = ''
        if (sortField === 'regionName') {
          aValue = String(a.Name || a.regionName || '').toLowerCase()
          bValue = String(b.Name || b.regionName || '').toLowerCase()
        } else if (sortField === 'country') {
          aValue = String(a.CODE || a.country || '').toLowerCase()
          bValue = String(b.CODE || b.country || '').toLowerCase()
        } else if (sortField === 'status') {
          aValue = String(a.Status || a.status || '').toLowerCase()
          bValue = String(b.Status || b.status || '').toLowerCase()
        } else {
          aValue = String(a[sortField] || '').toLowerCase()
          bValue = String(b[sortField] || '').toLowerCase()
        }
        const comparison = aValue.localeCompare(bValue)
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return result
  }, [geographies, searchQuery, statusFilter, countryFilter, sortField, sortDirection, isServerSide])

  const handleSort = (field: SortField) => {
    if (isServerSide && onSortChange) {
      const apiFieldName = field === 'regionName' ? 'regionName' : field
      
      if (sortField === field) {
        if (sortDirection === 'asc') {
          onSortChange(apiFieldName, 'desc')
        } else if (sortDirection === 'desc') {
          onSortChange('', 'asc')
        } else {
          onSortChange(apiFieldName, 'asc')
        }
      } else {
        onSortChange(apiFieldName, 'asc')
      }
    } else {
      if (localSortField === field) {
        if (localSortDirection === 'asc') {
          setLocalSortDirection('desc')
        } else if (localSortDirection === 'desc') {
          setLocalSortField(null)
          setLocalSortDirection(null)
        } else {
          setLocalSortDirection('asc')
        }
      } else {
        setLocalSortField(field)
        setLocalSortDirection('asc')
      }
    }
  }

  const getSortIcon = (field: SortField) => {
    const isActive = sortField === field
    const arrowColor = isActive ? 'text-neutral-600' : 'text-neutral-400'
    const strokeWidth = 1.5 // Thinner outline style
    
    return (
      <span className="flex flex-col items-center justify-center ml-1.5" style={{ lineHeight: 0 }}>
        {/* Up arrow */}
        <svg 
          className={`w-3 h-3 ${arrowColor} ${isActive && sortDirection === 'asc' ? 'opacity-100' : 'opacity-60'}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style={{ strokeWidth }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
        {/* Down arrow */}
        <svg 
          className={`w-3 h-3 ${arrowColor} ${isActive && sortDirection === 'desc' ? 'opacity-100' : 'opacity-60'}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style={{ strokeWidth }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    )
  }

  // Calculate pagination
  const startIndex = isServerSide ? (currentPage - 1) * pageSize + 1 : 0
  const endIndex = isServerSide ? Math.min(currentPage * pageSize, totalCount) : filteredAndSortedGeographies.length
  const totalPages = isServerSide ? Math.ceil(totalCount / pageSize) : Math.ceil(filteredAndSortedGeographies.length / pageSize)
  const displayTotal = isServerSide ? totalCount : filteredAndSortedGeographies.length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Geography</h1>
            <p className="text-sm text-neutral-500 mt-1">
              {isLoading ? 'Loading geography records...' : `Showing ${startIndex}-${endIndex} of ${displayTotal}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onAddGeography}
              className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors shadow-sm flex items-center space-x-2"
              aria-label="Add geography"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Geography</span>
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Filter Bar */}
      <div className="px-6 mb-4">
        <FilterBar
          searchQuery={isServerSide ? searchQuery : localSearchQuery}
          onSearchChange={(value) => {
            if (isServerSide && onSearchChange) {
              onSearchChange(value)
            } else {
              setLocalSearchQuery(value)
            }
          }}
          searchSuggestions={searchSuggestions}
          statusFilter={isServerSide ? statusFilter : localStatusFilter}
          onStatusFilterChange={(value) => {
            if (isServerSide && onStatusFilterChange) {
              onStatusFilterChange(value)
            } else {
              setLocalStatusFilter(value)
            }
          }}
          statusOptions={externalStatusOptions || defaultStatusOptions}
          industryFilter={isServerSide ? countryFilter : localCountryFilter}
          onIndustryFilterChange={(value) => {
            if (isServerSide && onCountryFilterChange) {
              onCountryFilterChange(value)
            } else {
              setLocalCountryFilter(value)
            }
          }}
          industryOptions={externalCountryOptions || []}
          activityFilter=""
          onActivityFilterChange={() => {}}
          activityOptions={[]}
          isLoading={isLoading}
        />
      </div>

      {/* Empty State */}
      {!isLoading && geographies.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <svg
              className="mx-auto h-12 w-12 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 002 2h2.945M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-4 text-sm font-semibold text-neutral-900">No geography records found</h3>
            <p className="mt-2 text-sm text-neutral-500">
              {searchQuery || statusFilter || countryFilter
                ? 'Try adjusting your filters or search query to see more results.'
                : 'Get started by creating a new geography record.'}
            </p>
            {searchQuery || statusFilter || countryFilter ? (
              <button
                onClick={() => {
                  if (onSearchChange) onSearchChange('')
                  if (onStatusFilterChange) onStatusFilterChange('')
                  if (onCountryFilterChange) onCountryFilterChange('')
                }}
                className="mt-4 px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700"
              >
                Clear all filters
              </button>
            ) : (
              <button
                onClick={onAddGeography}
                className="mt-4 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Geography
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      {geographies.length > 0 && (
        <div className="flex-1 overflow-auto border border-neutral-200 rounded-lg bg-white shadow-sm relative">
          <table className="w-full min-w-full">
            <thead className="sticky top-0 z-20 border-b-2 border-neutral-300 shadow-sm" style={{ backgroundColor: '#FAFAFA' }}>
              <tr>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('regionName')}
                    className="flex items-center text-xs font-semibold text-neutral-700 uppercase tracking-wider hover:text-green-600 transition-colors"
                    aria-label="Sort by Name"
                  >
                    <span className="whitespace-nowrap">Name</span>
                    {getSortIcon('regionName')}
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('country')}
                    className="flex items-center text-xs font-semibold text-neutral-700 uppercase tracking-wider hover:text-green-600 transition-colors"
                    aria-label="Sort by CODE"
                  >
                    <span className="whitespace-nowrap">CODE</span>
                    {getSortIcon('country')}
                  </button>
                </th>
                <th className="px-6 py-4 text-center">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center space-x-2 text-xs font-semibold text-neutral-700 uppercase tracking-wider hover:text-green-600 transition-colors mx-auto"
                    aria-label="Sort by Status"
                  >
                    <span className="whitespace-nowrap">Status</span>
                    {getSortIcon('status')}
                  </button>
                </th>
                <th className="px-6 py-4 text-center w-20">
                  <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredAndSortedGeographies.map((geography, index) => (
                <tr
                  key={geography.id}
                  className={`group transition-all duration-200 cursor-pointer border-b border-neutral-100 hover:border-green-200 hover:shadow-sm ${
                    index % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'
                  } hover:bg-green-50/70`}
                  onMouseEnter={() => setHoveredRow(geography.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => onGeographyClick(geography)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onGeographyClick(geography)
                    }
                  }}
                  aria-label={`Geography: ${geography.Name || geography.regionName}`}
                >
                  <td className="px-6 py-6 text-left">
                    <span className="text-sm font-medium text-neutral-900">
                      {geography.Name || geography.regionName}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-left">
                    <span className="text-sm text-neutral-700">
                      {geography.CODE || geography.country}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      (geography.Status || geography.status) === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-neutral-100 text-neutral-800'
                    }`}>
                      {geography.Status || geography.status}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onGeographyClick(geography)
                      }}
                      className={`text-neutral-400 hover:text-green-600 transition-all duration-200 ${
                        hoveredRow === geography.id ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                      }`}
                      aria-label={`View ${geography.regionName}`}
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Loading overlay */}
          {isLoading && geographies.length > 0 && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                <p className="text-sm text-neutral-500">Loading...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {displayTotal > 0 && isServerSide && (
        <div className="bg-white border-t border-neutral-200 px-6 py-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm text-neutral-700">Rows per page:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  if (onPageSizeChange) {
                    onPageSizeChange(Number(e.target.value))
                  }
                }}
                className="px-3 py-1 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {[10, 25, 50, 100].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              {/* Reset to user default button - only show when there's a per-table override */}
              {onPageSizeChange && pageSize !== userDefaultPageSize && (
                <button
                  onClick={() => {
                    onPageSizeChange(userDefaultPageSize)
                  }}
                  className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors"
                  aria-label="Reset to user default page size"
                  title={`Reset to default (${userDefaultPageSize} rows)`}
                >
                  <ArrowPathIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (onPageChange && currentPage > 1) {
                    onPageChange(currentPage - 1)
                  }
                }}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-neutral-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-neutral-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => {
                  if (onPageChange && currentPage < totalPages) {
                    onPageChange(currentPage + 1)
                  }
                }}
                disabled={currentPage === totalPages || !hasMore}
                className="px-3 py-1 text-sm border border-neutral-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

