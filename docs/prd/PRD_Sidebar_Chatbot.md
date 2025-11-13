# PRD: Sidebar Chatbot Integration

You are a **senior full-stack engineer**. Implement a **Sidebar Chatbot** that provides AI assistant access from the sidebar footer, with **modal-based chat interface** and **seamless integration** with existing AI infrastructure.

# Goals

1) **Add Chatbot Icon to Sidebar Footer** - Integrate AI assistant icon in sidebar footer
   - Place icon in footer section alongside notifications, user preferences, and settings
   - Match existing icon sizing (w-5 h-5) and styling
   - Support both collapsed and expanded sidebar states
   - Use AIAssistantIcon component (already exists)

2) **Create Chatbot Modal Component** - Build modal wrapper for chat interface
   - Reuse existing AIChatInterface component
   - Follow same modal pattern as NotificationCenter and UserPreferencesModal
   - Slide-in animation from right side (or bottom on mobile)
   - Proper z-index layering (above sidebar, below other modals)
   - Responsive design for mobile and desktop

3) **Integrate with Sidebar State Management** - Connect chatbot to sidebar state
   - Add state for chatbot modal open/close
   - Handle click events on chatbot icon
   - Manage modal visibility with existing sidebar state
   - Support keyboard shortcuts (ESC to close)

4) **Ensure Proper Sizing and Layout** - Match existing footer icon styling
   - Icon size: w-5 h-5 (matches other footer icons)
   - Button padding: p-2 (matches notifications/settings)
   - Hover states: hover:bg-neutral-200 (consistent with other icons)
   - Active state: Show when chatbot is open (similar to user preferences)

# Technical Specifications

## Component Structure

```
Sidebar.tsx
  ├── Footer Section
  │   ├── User Preferences Icon (existing)
  │   ├── Share Icon (existing)
  │   ├── Notifications Icon (existing)
  │   ├── Chatbot Icon (NEW)
  │   └── Settings Icon (existing)
  └── ChatbotModal Component (NEW)
      └── AIChatInterface (existing, reused)
```

## Modal Specifications

**Position:** Fixed, slides in from right
**Width:** 
- Desktop: 400px (matches NotificationCenter)
- Mobile: Full width with max-width
**Height:** Full viewport height
**Z-index:** 50 (above sidebar z-30, below other modals z-40)
**Animation:** Slide-in from right with fade

## State Management

```typescript
const [isChatbotOpen, setIsChatbotOpen] = useState(false)
```

## Icon Integration

- Import: `AIAssistantIcon` from `./icons`
- Size: `w-5 h-5` (matches footer icons)
- Position: Between notifications and settings (or after settings)
- Styling: Match existing footer button styles

# Implementation

## Component: ChatbotModal.tsx

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { XMarkIcon } from './icons'
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

  // Handle ESC key
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

  if (!isOpen || !mounted) return null

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900 bg-opacity-30 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col animate-slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-neutral-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="11" fill="currentColor" />
                {/* AI icon pattern */}
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">AI Assistant</h2>
              <p className="text-xs text-neutral-500">Ask me anything</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors"
            title="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Chat Interface */}
        <div className="flex-1 overflow-hidden">
          <AIChatInterface onClose={onClose} className="h-full" />
        </div>
      </div>
    </>
  )

  return createPortal(modalContent, document.body)
}
```

## Sidebar Integration

Add to Sidebar.tsx:

```typescript
// Import
import ChatbotModal from './ChatbotModal'
import { AIAssistantIcon } from './icons'

// State
const [isChatbotOpen, setIsChatbotOpen] = useState(false)

// In footer section (after notifications, before settings):
{isFeatureEnabled('chatbot') && (
  <button 
    onClick={() => setIsChatbotOpen(true)}
    className={`p-2 text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors relative ${
      isChatbotOpen ? 'bg-green-100 text-green-700' : ''
    }`}
    title="AI Assistant"
  >
    <AIAssistantIcon className="w-5 h-5" />
  </button>
)}

// Modal component
<ChatbotModal
  isOpen={isChatbotOpen}
  onClose={() => setIsChatbotOpen(false)}
/>
```

# CSS Animations

Add to globals.css:

```css
@keyframes slide-in-from-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in-from-right {
  animation: slide-in-from-right 0.3s ease-out;
}
```

# Feature Flag

Add to feature flags:
- Key: `chatbot`
- Default: `true`
- Description: "Enable AI chatbot in sidebar footer"

> NOTE: 
> - Reuse existing AIChatInterface component (no need to rebuild chat functionality)
> - Ensure proper z-index layering (chatbot modal should be above sidebar but below other critical modals)
> - Mobile responsive: Full width on small screens
> - Accessibility: ESC key to close, proper ARIA labels
> - Performance: Portal rendering to avoid z-index issues
> - User experience: Smooth animations, clear visual feedback when chatbot is active

