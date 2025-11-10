/**
 * Optimized Table Cell Component
 * 
 * Memoized cell renderer to prevent unnecessary re-renders.
 * Only re-renders when the cell value or item ID changes.
 */

import React from 'react'

interface OptimizedTableCellProps {
  value: any
  column: {
    key: string
    render?: (value: any, item: any) => React.ReactNode
  }
  item: {
    id: string
    [key: string]: any
  }
}

export const OptimizedTableCell = React.memo<OptimizedTableCellProps>(
  ({ value, column, item }) => {
    if (column.render) {
      return <>{column.render(value, item)}</>
    }
    return <span className="text-xs text-neutral-700">{value || '—'}</span>
  },
  (prevProps, nextProps) => {
    // Only re-render if value, item ID, or column key changed
    return (
      prevProps.value === nextProps.value &&
      prevProps.item.id === nextProps.item.id &&
      prevProps.column.key === nextProps.column.key
    )
  }
)

OptimizedTableCell.displayName = 'OptimizedTableCell'

