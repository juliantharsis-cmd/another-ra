'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Company, getTagColor } from '@/lib/mockData'
import { EyeIcon, ArrowPathIcon } from './icons'
import FilterBar from './FilterBar'
import ImportModal from './ImportModal'
import Notification from './Notification'
import TableHeaderActions from './tables/TableHeaderActions'
import ConfigureTableModal from './tables/ConfigureTableModal'
import { isFeatureEnabled } from '@/lib/featureFlags'
import { getTablePreferences, TablePreferences, getColumnWidths, updateColumnWidths } from '@/lib/tablePreferences'
import { trackEvent } from '@/lib/telemetry'
import { useResizableColumns } from '@/hooks/useResizableColumns'

// Fallback options if not provided from API
const defaultStatusOptions = ['Active', 'Closed']
const defaultIndustryOptions: string[] = []
const defaultActivityOptions: string[] = []

interface CompanyTableProps {
  companies: Company[]
  onCompanyClick: (company: Company) => void
  onAddCompany: () => void
  onImport?: (companies: any[]) => Promise<void>
  onExportSuccess?: () => void
  // Pagination props
  currentPage?: number
  pageSize?: number
  totalCount?: number
  hasMore?: boolean
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  // Filter props
  searchQuery?: string
  statusFilter?: string
  industryFilter?: string
  activityFilter?: string
  onSearchChange?: (query: string) => void
  onStatusFilterChange?: (status: string) => void
  onIndustryFilterChange?: (industry: string) => void
  onActivityFilterChange?: (activity: string) => void
  // Filter options (from Airtable)
  statusOptions?: string[]
  industryOptions?: string[]
  activityOptions?: string[]
  // Search suggestions for autocomplete
  searchSuggestions?: string[]
  // Sort props
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSortChange?: (field: string, order: 'asc' | 'desc') => void
  // Loading state
  isLoading?: boolean
}

type SortField = 'isinCode' | 'companyName' | 'primarySector' | 'primaryActivity' | 'status' | 'primaryIndustry'
type SortDirection = 'asc' | 'desc' | null

interface ColumnVisibility {
  isinCode: boolean
  companyName: boolean
  status: boolean
  primaryIndustry: boolean
  primarySector: boolean
  primaryActivity: boolean
}

export default function CompanyTable({
  companies,
  onCompanyClick,
  onAddCompany,
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
  industryFilter: externalIndustryFilter = '',
  activityFilter: externalActivityFilter = '',
  onSearchChange,
  onStatusFilterChange,
  onIndustryFilterChange,
  onActivityFilterChange,
  // Filter options
  statusOptions: externalStatusOptions,
  industryOptions: externalIndustryOptions,
  activityOptions: externalActivityOptions,
  // Search suggestions
  searchSuggestions = [],
  // Sort props
  sortBy: externalSortBy = '',
  sortOrder: externalSortOrder = 'asc',
  onSortChange,
  // Loading state
  isLoading = false,
  // Import/Export
  onImport,
  onExportSuccess,
}: CompanyTableProps) {
  // Use external props if provided, otherwise use local state (for backward compatibility)
  const [localSearchQuery, setLocalSearchQuery] = useState<string>('')
  const [localStatusFilter, setLocalStatusFilter] = useState<string>('')
  const [localIndustryFilter, setLocalIndustryFilter] = useState<string>('')
  const [localActivityFilter, setLocalActivityFilter] = useState<string>('')
  const [localSortField, setLocalSortField] = useState<SortField | null>(null)
  const [localSortDirection, setLocalSortDirection] = useState<SortDirection>(null)

  // Determine if we're using server-side or client-side
  const isServerSide = !!onPageChange && !!onSearchChange && !!onSortChange

  const searchQuery = isServerSide ? externalSearchQuery : localSearchQuery
  const statusFilter = isServerSide ? externalStatusFilter : localStatusFilter
  const industryFilter = isServerSide ? externalIndustryFilter : localIndustryFilter
  const activityFilter = isServerSide ? externalActivityFilter : localActivityFilter
  const sortField = isServerSide ? (externalSortBy as SortField | null) : localSortField
  const sortDirection = isServerSide ? (externalSortOrder as SortDirection) : localSortDirection

  // Feature flag check - must be defined before useState initializers that use it
  const isTableActionsV2Enabled = isFeatureEnabled('tableActionsV2')

  // Configure table modal state
  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false)

  // Column definitions for configure modal
  const columnDefinitions = useMemo(() => [
    { key: 'isinCode', label: 'ISIN Code', sortable: true },
    { key: 'companyName', label: 'Company Name', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'primaryIndustry', label: 'Primary Industry', sortable: true },
    { key: 'primarySector', label: 'Primary Sector', sortable: true },
    { key: 'primaryActivity', label: 'Primary Activity', sortable: true },
  ], [])

  // Column visibility - load from preferences if feature enabled
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(() => {
    if (isTableActionsV2Enabled) {
      const prefs = getTablePreferences('Companies')
      if (prefs?.columnVisibility) {
        return {
          isinCode: prefs.columnVisibility.isinCode ?? true,
          companyName: prefs.columnVisibility.companyName ?? true,
          status: prefs.columnVisibility.status ?? true,
          primaryIndustry: prefs.columnVisibility.primaryIndustry ?? true,
          primarySector: prefs.columnVisibility.primarySector ?? true,
          primaryActivity: prefs.columnVisibility.primaryActivity ?? true,
        }
      }
    }
    return {
      isinCode: true,
      companyName: true,
      status: true,
      primaryIndustry: true,
      primarySector: true,
      primaryActivity: true,
    }
  })
  const [showColumnMenu, setShowColumnMenu] = useState(false)

  // Utility controls

  // UI state
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const columnMenuRef = useRef<HTMLDivElement>(null)

  // Column resizing
  const visibleColumnKeys = useMemo(() => {
    const keys: string[] = []
    if (columnVisibility.isinCode) keys.push('isinCode')
    if (columnVisibility.companyName) keys.push('companyName')
    if (columnVisibility.status) keys.push('status')
    if (columnVisibility.primaryIndustry) keys.push('primaryIndustry')
    if (columnVisibility.primarySector) keys.push('primarySector')
    if (columnVisibility.primaryActivity) keys.push('primaryActivity')
    return keys
  }, [columnVisibility])

  const savedWidths = useMemo(() => {
    if (isTableActionsV2Enabled) {
      return getColumnWidths('Companies') || {}
    }
    return {}
  }, [isTableActionsV2Enabled])

  const {
    columnWidths,
    setColumnWidths,
    resizingColumn,
    handleResizeStart,
  } = useResizableColumns(visibleColumnKeys, savedWidths)

  // Save column widths when they change
  useEffect(() => {
    if (isTableActionsV2Enabled && Object.keys(columnWidths).length > 0) {
      updateColumnWidths('Companies', columnWidths)
    }
  }, [columnWidths, isTableActionsV2Enabled])

  // Close column menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
        setShowColumnMenu(false)
      }
    }
    if (showColumnMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showColumnMenu])

  // For server-side pagination, companies are already filtered/sorted
  // For client-side, we still need to filter/sort
  const filteredAndSortedCompanies = useMemo(() => {
    if (isServerSide) {
      // Server-side: companies are already filtered and sorted
      return companies
    }

    // Client-side: filter and sort locally
    const searchInCompany = (company: Company, query: string): boolean => {
      if (!query) return true
      const lowerQuery = query.toLowerCase()
      return (
        company.isinCode.toLowerCase().includes(lowerQuery) ||
        company.companyName.toLowerCase().includes(lowerQuery) ||
        company.status.toLowerCase().includes(lowerQuery) ||
        company.primarySector.toLowerCase().includes(lowerQuery) ||
        company.primaryActivity.toLowerCase().includes(lowerQuery) ||
        company.primaryIndustry.toLowerCase().includes(lowerQuery) ||
        (company.notes || '').toLowerCase().includes(lowerQuery)
      )
    }

    let result = companies.filter((company) => {
      if (!searchInCompany(company, searchQuery)) return false
      if (statusFilter && company.status !== statusFilter) return false
      if (industryFilter && company.primaryIndustry !== industryFilter) return false
      if (activityFilter && !company.primaryActivity.includes(activityFilter)) return false
      return true
    })

    if (sortField && sortDirection) {
      result = [...result].sort((a, b) => {
        let aValue: string = String(a[sortField] || '').toLowerCase()
        let bValue: string = String(b[sortField] || '').toLowerCase()
        const comparison = aValue.localeCompare(bValue)
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return result
  }, [companies, searchQuery, statusFilter, industryFilter, activityFilter, sortField, sortDirection, isServerSide])

  const handleSort = (field: SortField) => {
    if (isServerSide && onSortChange) {
      // Server-side: cycle through asc -> desc -> no sort
      // Map frontend field names to API field names
      const apiFieldName = field === 'companyName' ? 'companyName' : field
      
      if (sortField === field) {
        if (sortDirection === 'asc') {
          onSortChange(apiFieldName, 'desc')
        } else if (sortDirection === 'desc') {
          onSortChange('', 'asc') // Clear sort
        } else {
          onSortChange(apiFieldName, 'asc')
        }
      } else {
        onSortChange(apiFieldName, 'asc')
      }
    } else {
      // Client-side: local state
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

  const toggleColumn = (column: keyof ColumnVisibility) => {
    setColumnVisibility({ ...columnVisibility, [column]: !columnVisibility[column] })
  }

  // Import/Export state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const handleImport = useCallback(() => {
    trackEvent({ type: 'table.import_clicked', tableId: 'Companies' })
    setIsImportModalOpen(true)
  }, [])

  const handleExport = useCallback(() => {
    trackEvent({ type: 'table.export_clicked', tableId: 'Companies' })
    try {
      // Use filtered and sorted companies (current view)
      const companiesToExport = isServerSide ? companies : filteredAndSortedCompanies
      
      // Create CSV content with proper escaping
      const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return ''
        const str = String(value)
        // If contains comma, quote, or newline, wrap in quotes and escape quotes
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }

      const headers = ['ISIN Code', 'Company Name', 'Status', 'Primary Industry', 'Primary Sector', 'Primary Activity', 'Notes']
      const rows = companiesToExport.map((company) => [
        escapeCSV(company.isinCode),
        escapeCSV(company.companyName),
        escapeCSV(company.status),
        escapeCSV(company.primaryIndustry),
        escapeCSV(company.primarySector),
        escapeCSV(company.primaryActivity),
        escapeCSV(company.notes),
      ])
      
      // Add BOM for UTF-8 encoding (helps Excel recognize UTF-8)
      const BOM = '\uFEFF'
      const csvContent = BOM + [headers.map(escapeCSV), ...rows].map((row) => row.join(',')).join('\n')
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `companies_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      if (onExportSuccess) {
        onExportSuccess()
      }
      setNotification({
        message: `Exported ${companiesToExport.length} companies to CSV`,
        type: 'success',
      })
    } catch (error) {
      console.error('Export error:', error)
      setNotification({
        message: `Failed to export: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      })
    }
  }, [companies, filteredAndSortedCompanies, isServerSide, onExportSuccess])

  const handleConfigureTable = useCallback(() => {
    setIsConfigureModalOpen(true)
    trackEvent({ type: 'table.configure_opened', tableId: 'Companies' })
  }, [])

  const handlePreferencesChange = useCallback((preferences: TablePreferences) => {
    setColumnVisibility({
      isinCode: preferences.columnVisibility.isinCode ?? true,
      companyName: preferences.columnVisibility.companyName ?? true,
      status: preferences.columnVisibility.status ?? true,
      primaryIndustry: preferences.columnVisibility.primaryIndustry ?? true,
      primarySector: preferences.columnVisibility.primarySector ?? true,
      primaryActivity: preferences.columnVisibility.primaryActivity ?? true,
    })
    // Apply default sort if needed
    if (preferences.defaultSort) {
      if (onSortChange) {
        onSortChange(preferences.defaultSort.field, preferences.defaultSort.order)
      }
    }
  }, [onSortChange])

  const handleImportComplete = async (companiesToImport: any[]) => {
    if (!onImport) return
    
    try {
      await onImport(companiesToImport)
      setNotification({
        message: `Successfully imported ${companiesToImport.length} companies`,
        type: 'success',
      })
      setIsImportModalOpen(false)
    } catch (error) {
      setNotification({
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      })
    }
  }

  return (
    <>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      {isImportModalOpen && onImport && (
        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportComplete}
        />
      )}
      {isTableActionsV2Enabled && (
        <ConfigureTableModal
          isOpen={isConfigureModalOpen}
          onClose={() => setIsConfigureModalOpen(false)}
          tableId="Companies"
          columns={columnDefinitions}
          currentSort={sortField ? { field: sortField, order: sortDirection || 'asc' } : undefined}
          onPreferencesChange={handlePreferencesChange}
        />
      )}
      <div className="flex flex-col h-full relative">
      {/* Breadcrumb with Import/Export and Size Column */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-neutral-600">
            <span className="hover:text-green-600 cursor-pointer transition-colors">Organization structure</span>
            <span className="text-neutral-400">/</span>
            <span className="font-medium text-neutral-900">Companies</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-neutral-500">
            {isServerSide ? (
              <>
                <span>
                  Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)} - {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
                </span>
                <span className="text-neutral-300">•</span>
                <span>{totalCount} total</span>
              </>
            ) : (
              <>
                <span>{filteredAndSortedCompanies.length} {filteredAndSortedCompanies.length === 1 ? 'company' : 'companies'}</span>
                <span className="text-neutral-300">•</span>
                <span>{companies.length} total</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {isTableActionsV2Enabled && onImport ? (
            <TableHeaderActions
              tableId="Companies"
              actions={[
                {
                  id: 'import',
                  label: 'Import',
                  onClick: handleImport,
                  shortcut: 'Shift+I',
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  ),
                },
                {
                  id: 'export',
                  label: 'Export',
                  onClick: handleExport,
                  shortcut: 'Shift+E',
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                  ),
                },
                {
                  id: 'configure',
                  label: 'Configure Table',
                  onClick: handleConfigureTable,
                  shortcut: 'Shift+C',
                  divider: true,
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ),
                },
              ]}
            />
          ) : (
            <>
              {onImport && (
                <button
                  onClick={handleImport}
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-sm text-neutral-700 bg-white hover:bg-neutral-50 transition-colors flex items-center space-x-2"
                  aria-label="Import companies"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Import</span>
                </button>
              )}
              <button
                onClick={handleExport}
                className="px-3 py-2 border border-neutral-300 rounded-lg text-sm text-neutral-700 bg-white hover:bg-neutral-50 transition-colors flex items-center space-x-2"
                aria-label="Export companies"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <span>Export</span>
              </button>
            </>
          )}
          <button
            onClick={onAddCompany}
            className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors shadow-sm flex items-center space-x-2"
            aria-label="Add company"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add company</span>
          </button>
        </div>
      </div>

      {/* Collapsible Filter Bar */}
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
        industryFilter={isServerSide ? industryFilter : localIndustryFilter}
        onIndustryFilterChange={(value) => {
          if (isServerSide && onIndustryFilterChange) {
            onIndustryFilterChange(value)
          } else {
            setLocalIndustryFilter(value)
          }
        }}
        industryOptions={externalIndustryOptions || defaultIndustryOptions}
        activityFilter={isServerSide ? activityFilter : localActivityFilter}
        onActivityFilterChange={(value) => {
          if (isServerSide && onActivityFilterChange) {
            onActivityFilterChange(value)
          } else {
            setLocalActivityFilter(value)
          }
        }}
        activityOptions={externalActivityOptions || defaultActivityOptions}
        isLoading={isLoading}
      />

      {/* Utility Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Column Visibility Toggle */}
          <div className="relative" ref={columnMenuRef}>
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm text-neutral-700 bg-white hover:bg-neutral-50 transition-colors flex items-center space-x-2"
              aria-label="Toggle column visibility"
              aria-expanded={showColumnMenu}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>Columns</span>
            </button>
            {showColumnMenu && (
              <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 z-50 py-2">
                {Object.entries(columnVisibility).map(([key, visible]) => (
                  <label
                    key={key}
                    className="flex items-center px-4 py-2 hover:bg-neutral-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={visible}
                      onChange={() => toggleColumn(key as keyof ColumnVisibility)}
                      className="mr-3 rounded border-neutral-300 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-sm text-neutral-700 capitalize">
                      {key === 'isinCode' ? 'ISIN Code' : key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Empty State */}
      {!isLoading && companies.length === 0 && (
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-4 text-sm font-semibold text-neutral-900">No companies found</h3>
            <p className="mt-2 text-sm text-neutral-500">
              {searchQuery || statusFilter || industryFilter || activityFilter
                ? 'Try adjusting your filters or search query to see more results.'
                : 'Get started by creating a new company.'}
            </p>
            {searchQuery || statusFilter || industryFilter || activityFilter ? (
              <button
                onClick={() => {
                  if (onSearchChange) onSearchChange('')
                  if (onStatusFilterChange) onStatusFilterChange('')
                  if (onIndustryFilterChange) onIndustryFilterChange('')
                  if (onActivityFilterChange) onActivityFilterChange('')
                }}
                className="mt-4 px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700"
              >
                Clear all filters
              </button>
            ) : (
              <button
                onClick={onAddCompany}
                className="mt-4 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Company
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      {companies.length > 0 && (
      <div className="flex-1 overflow-auto border border-neutral-200 rounded-lg bg-white shadow-sm relative">
        <table className="w-full min-w-full">
          <thead className="sticky top-0 z-20 border-b-2 border-neutral-300 shadow-sm" style={{ backgroundColor: '#FAFAFA' }}>
            <tr>
              {(() => {
                const visibleColumns = [
                  { key: 'isinCode', label: 'ISIN Code', align: 'left', visible: columnVisibility.isinCode },
                  { key: 'companyName', label: 'Company Name', align: 'left', visible: columnVisibility.companyName },
                  { key: 'status', label: 'Status', align: 'center', visible: columnVisibility.status },
                  { key: 'primaryIndustry', label: 'Primary Industry', align: 'center', visible: columnVisibility.primaryIndustry },
                  { key: 'primarySector', label: 'Primary Sector', align: 'center', visible: columnVisibility.primarySector },
                  { key: 'primaryActivity', label: 'Primary Activity', align: 'center', visible: columnVisibility.primaryActivity },
                ].filter(col => col.visible)
                
                return visibleColumns.map((col, idx) => {
                  const isLastColumn = idx === visibleColumns.length - 1
                  const savedWidth = columnWidths[col.key]
                  const isResizing = resizingColumn === col.key
                  
                  return (
                    <th
                      key={col.key}
                      style={{
                        width: savedWidth ? `${savedWidth}px` : undefined,
                        minWidth: savedWidth ? `${savedWidth}px` : '80px',
                        position: 'relative',
                      }}
                      className={`px-6 py-4 border-r border-neutral-200 ${
                        col.align === 'center' ? 'text-center' : 'text-left'
                      } ${isLastColumn ? 'border-r-0' : ''} ${
                        isResizing ? 'bg-blue-50' : ''
                      }`}
                    >
                      <button
                        onClick={() => handleSort(col.key as SortField)}
                        className={`flex items-center text-xs font-semibold text-neutral-700 uppercase tracking-wider hover:text-green-600 transition-colors ${
                          col.align === 'center' ? 'justify-center mx-auto' : ''
                        }`}
                        aria-label={`Sort by ${col.label}`}
                      >
                        <span className="whitespace-nowrap">
                          {col.label}
                        </span>
                        {getSortIcon(col.key)}
                      </button>
                      {/* Column separator with resize handle */}
                      {!isLastColumn && (
                        <div
                          onMouseDown={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleResizeStart(col.key, e.clientX)
                          }}
                          className={`
                            absolute top-0 right-0 h-full cursor-col-resize
                            transition-all duration-150
                            ${isResizing 
                              ? 'bg-blue-500 w-1' 
                              : 'bg-neutral-300 w-px hover:bg-blue-400 hover:w-0.5'
                            }
                          `}
                          style={{
                            zIndex: 10,
                            marginRight: '-1px',
                            userSelect: 'none',
                          }}
                          title="Click and drag to resize column"
                          role="separator"
                          aria-label={`Resize ${col.label} column`}
                        />
                      )}
                    </th>
                  )
                })
              })()}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-100">
            {filteredAndSortedCompanies.length === 0 ? (
              <tr>
                <td
                  colSpan={Object.values(columnVisibility).filter(Boolean).length}
                  className="px-6 py-16 text-center"
                >
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-12 h-12 text-neutral-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-neutral-500 text-sm font-medium">No companies found</p>
                    <p className="text-neutral-400 text-xs mt-1">Try adjusting your filters or search query</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedCompanies.map((company, index) => (
                <tr
                  key={company.id}
                  className={`group transition-all duration-200 cursor-pointer border-b border-neutral-100 hover:border-green-200 hover:shadow-sm ${
                    index % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'
                  } hover:bg-green-50/70`}
                  onMouseEnter={() => setHoveredRow(company.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => onCompanyClick(company)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onCompanyClick(company)
                    }
                  }}
                  aria-label={`Company: ${company.companyName}`}
                >
                  {(() => {
                    const visibleColumns = [
                      { key: 'isinCode', visible: columnVisibility.isinCode, align: 'left' },
                      { key: 'companyName', visible: columnVisibility.companyName, align: 'left' },
                      { key: 'status', visible: columnVisibility.status, align: 'center' },
                      { key: 'primaryIndustry', visible: columnVisibility.primaryIndustry, align: 'center' },
                      { key: 'primarySector', visible: columnVisibility.primarySector, align: 'center' },
                      { key: 'primaryActivity', visible: columnVisibility.primaryActivity, align: 'center' },
                    ].filter(col => col.visible)
                    
                    return visibleColumns.map((col, colIdx) => {
                      const isLastColumn = colIdx === visibleColumns.length - 1
                      
                      return (
                        <td
                          key={col.key}
                          style={{
                            width: columnWidths[col.key] ? `${columnWidths[col.key]}px` : undefined,
                            minWidth: columnWidths[col.key] ? `${columnWidths[col.key]}px` : undefined,
                          }}
                          className={`px-6 py-6 border-r border-neutral-200 ${
                            col.align === 'center' ? 'text-center' : 'text-left'
                          } ${isLastColumn ? 'border-r-0' : ''} ${col.key === 'isinCode' ? 'whitespace-nowrap' : ''}`}
                        >
                          {col.key === 'isinCode' ? (
                            <span className="text-sm text-neutral-600 font-mono">
                              {company.isinCode}
                            </span>
                          ) : col.key === 'companyName' ? (
                            <div className="flex items-center space-x-3">
                              <span className="text-base font-semibold text-neutral-900 group-hover:text-green-700 transition-colors leading-tight">
                                {company.companyName}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onCompanyClick(company)
                                }}
                                className={`flex items-center justify-center text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full p-1.5 transition-all duration-200 ${
                                  hoveredRow === company.id
                                    ? 'opacity-100 scale-100'
                                    : 'opacity-0 scale-95 pointer-events-none'
                                }`}
                                aria-label={`View ${company.companyName} details`}
                                title="View details"
                              >
                                <EyeIcon className="w-5 h-5" />
                              </button>
                            </div>
                          ) : col.key === 'status' ? (
                            <span
                              className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide ${
                                company.status === 'Active'
                                  ? 'bg-green-100 text-green-700 border border-green-200'
                                  : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                              }`}
                            >
                              {company.status}
                            </span>
                          ) : col.key === 'primaryIndustry' ? (
                            <span
                              className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium ${getTagColor(
                                company.primaryIndustry
                              )}`}
                            >
                              {company.primaryIndustry}
                            </span>
                          ) : col.key === 'primarySector' ? (
                            <span
                              className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium ${getTagColor(
                                company.primarySector
                              )}`}
                            >
                              {company.primarySector.length > 30
                                ? `${company.primarySector.substring(0, 30)}...`
                                : company.primarySector}
                            </span>
                          ) : col.key === 'primaryActivity' ? (
                            <span
                              className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium ${getTagColor(
                                company.primaryActivity
                              )}`}
                            >
                              {company.primaryActivity.length > 30
                                ? `${company.primaryActivity.substring(0, 30)}...`
                                : company.primaryActivity}
                            </span>
                          ) : null}
                        </td>
                      )
                    })
                  })()}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-20">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-2"></div>
              <p className="text-sm text-neutral-600">Loading...</p>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Pagination Controls */}
      {isServerSide && onPageChange && onPageSizeChange && (
        <div className="mt-6 flex items-center justify-between border-t border-neutral-200 pt-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="page-size" className="text-sm text-neutral-600">
                Rows per page:
              </label>
              <select
                id="page-size"
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                aria-label="Select page size"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              {/* Reset to user default button - only show when there's a per-table override */}
              {onPageSizeChange && pageSize !== userDefaultPageSize && (
                <button
                  onClick={() => {
                    onPageSizeChange(userDefaultPageSize)
                    // The parent component (CompaniesPage) will handle removing the override
                  }}
                  className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors"
                  aria-label="Reset to user default page size"
                  title={`Reset to default (${userDefaultPageSize} rows)`}
                >
                  <ArrowPathIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="text-sm text-neutral-600">
              Page {currentPage} of {Math.ceil(totalCount / pageSize) || 1}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1 || isLoading}
              className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="First page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
              className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Page numbers */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, Math.ceil(totalCount / pageSize) || 1) }, (_, i) => {
                const totalPages = Math.ceil(totalCount / pageSize) || 1
                let pageNum: number
                
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    disabled={isLoading}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-300'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    aria-label={`Go to page ${pageNum}`}
                    aria-current={currentPage === pageNum ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!hasMore || isLoading}
              className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => onPageChange(Math.ceil(totalCount / pageSize) || 1)}
              disabled={!hasMore || isLoading}
              className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Last page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
