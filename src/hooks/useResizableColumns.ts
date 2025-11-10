/**
 * Hook for managing resizable table columns
 */

import { useState, useCallback, useRef, useEffect } from 'react'

export interface ColumnWidths {
  [columnKey: string]: number
}

const MIN_COLUMN_WIDTH = 80
const DEFAULT_COLUMN_WIDTH = 150

/**
 * Hook to manage resizable columns
 */
export function useResizableColumns(
  columnKeys: string[],
  initialWidths?: ColumnWidths
) {
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(() => {
    const widths: ColumnWidths = {}
    columnKeys.forEach(key => {
      widths[key] = initialWidths?.[key] || DEFAULT_COLUMN_WIDTH
    })
    return widths
  })

  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeStartWidth, setResizeStartWidth] = useState(0)

  const handleResizeStart = useCallback((columnKey: string, startX: number) => {
    setResizingColumn(columnKey)
    setResizeStartX(startX)
    setResizeStartWidth(columnWidths[columnKey] || DEFAULT_COLUMN_WIDTH)
  }, [columnWidths])

  const handleResize = useCallback((currentX: number) => {
    if (!resizingColumn) return

    const diff = currentX - resizeStartX
    const newWidth = Math.max(MIN_COLUMN_WIDTH, resizeStartWidth + diff)
    
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn]: newWidth,
    }))
  }, [resizingColumn, resizeStartX, resizeStartWidth])

  const handleResizeEnd = useCallback(() => {
    setResizingColumn(null)
    setResizeStartX(0)
    setResizeStartWidth(0)
  }, [])

  // Handle mouse move and mouse up globally when resizing
  useEffect(() => {
    if (!resizingColumn) return

    const handleMouseMove = (e: MouseEvent) => {
      handleResize(e.clientX)
    }

    const handleMouseUp = () => {
      handleResizeEnd()
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizingColumn, handleResize, handleResizeEnd])

  return {
    columnWidths,
    setColumnWidths,
    resizingColumn,
    handleResizeStart,
    handleResizeEnd,
  }
}

