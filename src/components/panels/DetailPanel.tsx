'use client'

import { useState, useEffect, useRef, ReactNode } from 'react'
import React from 'react'

interface DetailPanelProps {
  isOpen: boolean
  onClose: () => void
  header: ReactNode
  children: ReactNode
  maxWidth?: string
}

export default function DetailPanel({
  isOpen,
  onClose,
  header,
  children,
  maxWidth = 'max-w-2xl',
}: DetailPanelProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Handle mount/unmount for smooth transitions
  useEffect(() => {
    let rafId1: number
    let rafId2: number
    let timer: NodeJS.Timeout
    
    if (isOpen) {
      // First, render the component in closed state
      setShouldRender(true)
      setIsMounted(false)
      
      // Use requestAnimationFrame to ensure the closed state is painted before animating
      rafId1 = requestAnimationFrame(() => {
        // Force a reflow to ensure the closed state is painted
        if (panelRef.current) {
          panelRef.current.offsetHeight
        }
        
        // Then trigger the animation in the next frame
        rafId2 = requestAnimationFrame(() => {
          setIsMounted(true)
        })
      })
    } else {
      // Start closing animation
      setIsMounted(false)
      // Delay unmounting until animation completes
      timer = setTimeout(() => {
        if (!isOpen) {
          setShouldRender(false)
        }
      }, 400) // Match animation duration
    }
    
    return () => {
      if (rafId1) cancelAnimationFrame(rafId1)
      if (rafId2) cancelAnimationFrame(rafId2)
      if (timer) clearTimeout(timer)
    }
  }, [isOpen])

  if (!shouldRender) return null

  // Calculate responsive width
  const getPanelWidth = () => {
    if (maxWidth?.startsWith('w-[')) {
      const widthValue = maxWidth.replace('w-[', '').replace(']', '')
      return {
        mobile: '100%',
        desktop: widthValue,
      }
    }
    return {
      mobile: '100%',
      desktop: maxWidth || '720px',
    }
  }

  const panelWidth = getPanelWidth()

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-neutral-900 z-40 transition-opacity duration-400 ease-in-out ${
          isMounted ? 'opacity-30' : 'opacity-0'
        } ${!isOpen ? 'pointer-events-none' : ''}`}
        onClick={onClose}
        style={{ 
          willChange: 'opacity',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 h-full detail-panel-responsive bg-white shadow-2xl z-50 transform transition-all duration-400 ease-smooth"
        style={{
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: isMounted ? 'translate3d(0, 0, 0)' : 'translate3d(100%, 0, 0)',
          opacity: isMounted ? 1 : 0,
          minWidth: '320px',
          ['--panel-desktop-width' as string]: panelWidth.desktop,
        } as React.CSSProperties}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          {header}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-7 space-y-4 md:space-y-6 bg-neutral-50">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}
