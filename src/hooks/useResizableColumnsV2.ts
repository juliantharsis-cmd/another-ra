/**
 * Enhanced Hook for managing resizable table columns with accessibility and auto-sizing
 * 
 * Features:
 * - Drag to resize
 * - Double-click to auto-size
 * - Keyboard support (Arrow keys)
 * - Accessibility (ARIA attributes)
 * - Performance optimized
 */

import { useState, useCallback, useEffect, useRef } from 'react'

export interface ColumnWidths {
  [columnKey: string]: number
}

export type ListMode = 'compact' | 'comfortable' | 'spacious'

const MIN_COLUMN_WIDTH = 60
const MAX_COLUMN_WIDTH = 800
const DEFAULT_COLUMN_WIDTH = 150
const KEYBOARD_STEP = 8
const KEYBOARD_STEP_LARGE = 32

export interface ColumnInfo {
  key: string
  minWidth?: number
  maxWidth?: number
  defaultWidth?: number
  type?: 'text' | 'number' | 'currency' | 'date' | 'boolean' | 'icon'
}

/**
 * Calculate optimal column width based on content
 * Exported for use in components that need to auto-size all columns
 */
export function calculateAutoWidth(
  columnKey: string,
  columnInfo: ColumnInfo,
  sampleData: any[]
): number {
  // Estimate based on column type and sample data
  const type = columnInfo.type || 'text'
  const minWidth = columnInfo.minWidth || MIN_COLUMN_WIDTH
  const maxWidth = columnInfo.maxWidth || MAX_COLUMN_WIDTH

  let estimatedWidth = DEFAULT_COLUMN_WIDTH

  // Type-based estimates
  switch (type) {
    case 'number':
    case 'currency':
      estimatedWidth = 100
      break
    case 'date':
      estimatedWidth = 120
      break
    case 'boolean':
    case 'icon':
      estimatedWidth = 80
      break
    case 'text':
    default:
      estimatedWidth = 150
      break
  }

  // Sample data analysis (if available)
  if (sampleData && sampleData.length > 0) {
    const samples = sampleData.slice(0, 10) // Sample first 10 rows
    let maxLength = 0

    samples.forEach(item => {
      const value = item[columnKey]
      if (value !== null && value !== undefined) {
        const str = String(value)
        // Rough estimate: 8px per character for text, more for numbers
        const charWidth = type === 'text' ? 8 : 10
        const length = str.length * charWidth
        maxLength = Math.max(maxLength, length)
      }
    })

    if (maxLength > 0) {
      estimatedWidth = Math.max(estimatedWidth, maxLength + 40) // Add padding
    }
  }

  return Math.max(minWidth, Math.min(maxWidth, estimatedWidth))
}

/**
 * Enhanced hook to manage resizable columns with accessibility
 */
export function useResizableColumnsV2(
  columnKeys: string[],
  columnInfo: ColumnInfo[],
  initialWidths?: ColumnWidths,
  mode: ListMode = 'comfortable',
  sampleData?: any[]
) {
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(() => {
    const widths: ColumnWidths = {}
    columnKeys.forEach(key => {
      const info = columnInfo.find(c => c.key === key)
      widths[key] = initialWidths?.[key] || info?.defaultWidth || DEFAULT_COLUMN_WIDTH
    })
    return widths
  })

  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeStartWidth, setResizeStartWidth] = useState(0)
  const [focusedResizer, setFocusedResizer] = useState<string | null>(null)
  const doubleClickTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleResizeStart = useCallback((columnKey: string, startX: number) => {
    setResizingColumn(columnKey)
    setResizeStartX(startX)
    setResizeStartWidth(columnWidths[columnKey] || DEFAULT_COLUMN_WIDTH)
    // Prevent text selection during drag
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
  }, [columnWidths])

  const handleResize = useCallback((currentX: number) => {
    if (!resizingColumn) return

    const diff = currentX - resizeStartX
    const info = columnInfo.find(c => c.key === resizingColumn)
    const minWidth = info?.minWidth || MIN_COLUMN_WIDTH
    const maxWidth = info?.maxWidth || MAX_COLUMN_WIDTH
    const newWidth = Math.max(minWidth, Math.min(maxWidth, resizeStartWidth + diff))
    
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn]: newWidth,
    }))
  }, [resizingColumn, resizeStartX, resizeStartWidth, columnInfo])

  const handleResizeEnd = useCallback(() => {
    setResizingColumn(null)
    setResizeStartX(0)
    setResizeStartWidth(0)
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
  }, [])

  const handleAutoSize = useCallback((columnKey: string) => {
    const info = columnInfo.find(c => c.key === columnKey)
    if (!info) return

    const autoWidth = calculateAutoWidth(columnKey, info, sampleData || [])
    setColumnWidths(prev => ({
      ...prev,
      [columnKey]: autoWidth,
    }))
  }, [columnInfo, sampleData])

  const handleDoubleClick = useCallback((columnKey: string) => {
    // Clear any existing timer
    if (doubleClickTimerRef.current) {
      clearTimeout(doubleClickTimerRef.current)
      doubleClickTimerRef.current = null
      // Double-click detected
      handleAutoSize(columnKey)
    } else {
      // First click - set timer
      doubleClickTimerRef.current = setTimeout(() => {
        doubleClickTimerRef.current = null
      }, 300)
    }
  }, [handleAutoSize])

  const handleKeyboardResize = useCallback((
    columnKey: string,
    direction: 'left' | 'right',
    isLargeStep: boolean = false
  ) => {
    const info = columnInfo.find(c => c.key === columnKey)
    const minWidth = info?.minWidth || MIN_COLUMN_WIDTH
    const maxWidth = info?.maxWidth || MAX_COLUMN_WIDTH
    const step = isLargeStep ? KEYBOARD_STEP_LARGE : KEYBOARD_STEP
    const currentWidth = columnWidths[columnKey] || DEFAULT_COLUMN_WIDTH
    
    const newWidth = direction === 'right'
      ? Math.min(maxWidth, currentWidth + step)
      : Math.max(minWidth, currentWidth - step)
    
    setColumnWidths(prev => ({
      ...prev,
      [columnKey]: newWidth,
    }))
  }, [columnWidths, columnInfo])

  // Handle mouse move and mouse up globally when resizing
  useEffect(() => {
    if (!resizingColumn) return

    const handleMouseMove = (e: MouseEvent) => {
      handleResize(e.clientX)
    }

    const handleMouseUp = () => {
      handleResizeEnd()
    }

    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizingColumn, handleResize, handleResizeEnd])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (doubleClickTimerRef.current) {
        clearTimeout(doubleClickTimerRef.current)
      }
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [])

  return {
    columnWidths,
    setColumnWidths,
    resizingColumn,
    focusedResizer,
    setFocusedResizer,
    handleResizeStart,
    handleResizeEnd,
    handleAutoSize,
    handleDoubleClick,
    handleKeyboardResize,
  }
}

