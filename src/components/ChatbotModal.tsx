'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { XMarkIcon, AIAssistantIcon } from './icons'
import AIChatInterface from './AIChatInterface'

interface ChatbotModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ChatbotModal({ isOpen, onClose }: ChatbotModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen || !mounted) return null

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900 bg-opacity-30 z-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div 
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col animate-slide-in-from-right"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chatbot-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Chat Interface - AIChatInterface has its own header with provider selection */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <AIChatInterface onClose={onClose} className="h-full flex-1 border-0 rounded-none" />
        </div>
      </div>
    </>
  )

  return createPortal(modalContent, document.body)
}

