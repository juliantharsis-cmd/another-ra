'use client'

import { ReactNode } from 'react'
import { CloseIcon } from '../icons'

interface PanelHeaderProps {
  title: string
  actions?: ReactNode
  onClose: () => void
}

export default function PanelHeader({ title, actions, onClose }: PanelHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 md:p-6 border-b border-neutral-200 bg-white">
      <h2 className="text-base md:text-lg font-semibold text-neutral-900 truncate pr-2">{title}</h2>
      <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
        {actions}
        <button
          onClick={onClose}
          className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          aria-label="Close panel"
        >
          <CloseIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}

