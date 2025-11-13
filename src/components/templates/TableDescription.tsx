'use client'

import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '../icons'

interface TableDescriptionProps {
  description: string
  maxLength?: number
}

/**
 * TableDescription Component
 * 
 * Displays a table description with truncation and expand/collapse functionality.
 * Shows a one-liner with "..." and a button to read the full description.
 */
export default function TableDescription({ description, maxLength = 120 }: TableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  if (!description || description.trim().length === 0) {
    return null
  }
  
  const shouldTruncate = description.length > maxLength
  const displayText = isExpanded || !shouldTruncate 
    ? description 
    : description.substring(0, maxLength).trim() + '...'
  
  return (
    <div className="mt-2">
      <p className="text-sm text-neutral-600 leading-relaxed">
        {displayText}
      </p>
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-1.5 flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
          aria-label={isExpanded ? 'Show less' : 'Show more'}
        >
          {isExpanded ? (
            <>
              <span>Show less</span>
              <ChevronUpIcon className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Read more</span>
              <ChevronDownIcon className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  )
}


