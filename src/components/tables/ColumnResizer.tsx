/**
 * Accessible Column Resizer Component
 * 
 * Provides drag-to-resize, double-click auto-size, and keyboard support
 */

import React, { useRef, useEffect } from 'react'

export interface ColumnResizerProps {
  columnKey: string
  currentWidth: number
  minWidth: number
  maxWidth: number
  isResizing: boolean
  isFocused: boolean
  onResizeStart: (startX: number) => void
  onResizeEnd: () => void
  onAutoSize: () => void
  onDoubleClick: () => void
  onKeyboardResize: (direction: 'left' | 'right', isLargeStep: boolean) => void
  onFocus: () => void
  onBlur: () => void
  'aria-label'?: string
}

export default function ColumnResizer({
  columnKey,
  currentWidth,
  minWidth,
  maxWidth,
  isResizing,
  isFocused,
  onResizeStart,
  onResizeEnd,
  onAutoSize,
  onDoubleClick,
  onKeyboardResize,
  onFocus,
  onBlur,
  'aria-label': ariaLabel = 'Resize column',
}: ColumnResizerProps) {
  const handleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = handleRef.current
    if (!handle) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFocused) return

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          onKeyboardResize('left', e.shiftKey)
          break
        case 'ArrowRight':
          e.preventDefault()
          onKeyboardResize('right', e.shiftKey)
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          onAutoSize()
          break
        case 'Escape':
          e.preventDefault()
          onBlur()
          break
      }
    }

    handle.addEventListener('keydown', handleKeyDown)
    return () => {
      handle.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFocused, onKeyboardResize, onAutoSize, onBlur])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onResizeStart(e.clientX)
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDoubleClick()
  }

  return (
    <div
      ref={handleRef}
      role="separator"
      aria-label={ariaLabel}
      aria-orientation="vertical"
      tabIndex={0}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onFocus={onFocus}
      onBlur={onBlur}
      className={`
        absolute top-0 right-0 h-full cursor-col-resize
        transition-all duration-150
        ${isResizing 
          ? 'bg-blue-500 w-1' 
          : isFocused 
            ? 'bg-blue-400 w-0.5 hover:w-1' 
            : 'bg-neutral-300 w-px hover:bg-blue-400 hover:w-0.5'
        }
        ${isFocused ? 'ring-1 ring-blue-500' : ''}
      `}
      style={{
        marginRight: '-1px',
        zIndex: 10,
        userSelect: 'none',
      }}
      title="Click and drag to resize column"
    />
  )
}

