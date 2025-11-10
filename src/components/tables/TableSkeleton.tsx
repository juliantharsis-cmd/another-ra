/**
 * Table Skeleton Loader
 * 
 * Provides a skeleton loading state for better perceived performance.
 * Shows placeholder rows and columns while data is loading.
 */

interface TableSkeletonProps {
  rows?: number
  columns?: number
  showHeader?: boolean
}

export function TableSkeleton({ 
  rows = 5, 
  columns = 4,
  showHeader = true 
}: TableSkeletonProps) {
  return (
    <div className="animate-pulse">
      {showHeader && (
        <div className="flex space-x-4 py-4 border-b border-neutral-200">
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="h-4 bg-neutral-200 rounded flex-1" />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4 py-4 border-b border-neutral-100">
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="h-4 bg-neutral-200 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

