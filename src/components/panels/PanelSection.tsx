'use client'

import { ReactNode } from 'react'

interface PanelSectionProps {
  title?: string
  children: ReactNode
  className?: string
  showDivider?: boolean
}

export default function PanelSection({ 
  title, 
  children, 
  className = '', 
  showDivider = false 
}: PanelSectionProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-neutral-200 p-4 md:p-7 ${className}`}>
      {title && (
        <h3 className="text-sm font-semibold text-neutral-900 mb-3 md:mb-4">{title}</h3>
      )}
      <div className="space-y-0">
        {children}
      </div>
    </div>
  )
}

