/**
 * AI Chat Interface Component
 * 
 * A reusable chat interface for interacting with AI providers (Claude, OpenAI, etc.)
 * Displays conversation history and allows users to send messages
 */

'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { aiClient, ChatMessage } from '@/lib/ai/client'
import { AIIntegration } from '@/lib/integrations/types'
import { getAllIntegrations } from '@/lib/integrations/storage'
import { gatherPageContext, formatContextAsSystemMessage } from '@/lib/ai/context'
import Notification from './Notification'
import { XMarkIcon } from './icons'
import { useTypewriter } from '@/hooks/useTypewriter'

interface AIChatInterfaceProps {
  integration?: AIIntegration
  onClose?: () => void
  className?: string
}

export default function AIChatInterface({ integration, onClose, className = '' }: AIChatInterfaceProps) {
  const pathname = usePathname()
  const [messages, setMessages] = useState<Array<ChatMessage & { id: string; timestamp: Date; isTyping?: boolean }>>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | undefined>(integration?.id)
  const [availableIntegrations, setAvailableIntegrations] = useState<AIIntegration[]>([])
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const typingMessageIdRef = useRef<string | null>(null)
  
  // Track if we've sent the initial context message and the pathname it was sent for
  const contextSentRef = useRef<string | null>(null)
  
  // Memoize context gathering to avoid recalculating on every render
  const pageContext = useMemo(() => {
    const userId = typeof window !== 'undefined' 
      ? localStorage.getItem('userId') || sessionStorage.getItem('userId') || undefined
      : undefined
    return gatherPageContext(pathname, userId)
  }, [pathname])
  
  // Memoize context message to avoid reformatting
  const contextMessage = useMemo(() => formatContextAsSystemMessage(pageContext), [pageContext])

  // Function to load and filter integrations
  const loadIntegrations = () => {
    const allIntegrations = getAllIntegrations().filter(i => i.enabled)
    
    // Remove duplicates by providerId - keep only the most recently updated one
    const uniqueIntegrations = allIntegrations.reduce((acc, current) => {
      const existing = acc.find(i => i.providerId === current.providerId)
      if (!existing) {
        acc.push(current)
      } else {
        // If we have a duplicate, keep the one with the most recent updatedAt
        const existingDate = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0
        const currentDate = current.updatedAt ? new Date(current.updatedAt).getTime() : 0
        if (currentDate > existingDate) {
          // Replace existing with current
          const index = acc.indexOf(existing)
          acc[index] = current
        }
      }
      return acc
    }, [] as typeof allIntegrations)
    
    setAvailableIntegrations(uniqueIntegrations)
    
    // If integration prop provided, use it; otherwise use first available
    if (integration?.id && uniqueIntegrations.find(i => i.id === integration.id)) {
      setSelectedIntegrationId(integration.id)
    } else if (uniqueIntegrations.length > 0) {
      setSelectedIntegrationId(uniqueIntegrations[0].id)
    } else {
      // No integrations available, clear selection
      setSelectedIntegrationId(undefined)
    }
  }

  // Load available integrations on mount and when integration prop changes
  useEffect(() => {
    loadIntegrations()
  }, [integration])

  // Refresh integrations when window gains focus (in case they were cleared in another tab)
  useEffect(() => {
    const handleFocus = () => {
      loadIntegrations()
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // Also refresh when storage changes (for same-tab updates)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Check if integration-related keys changed
      if (e.key && (e.key.startsWith('ai_integration_') || e.key === 'ai_integrations_list')) {
        loadIntegrations()
      }
    }
    
    // Listen for custom event when integrations are cleared
    const handleIntegrationsCleared = () => {
      loadIntegrations()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('integrations-cleared', handleIntegrationsCleared)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('integrations-cleared', handleIntegrationsCleared)
    }
  }, [])

  // Note: We don't reset contextSentRef here because we check pathname equality in handleSend
  // This allows us to update context when pathname changes during a conversation

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const currentIntegration = availableIntegrations.find(i => i.id === selectedIntegrationId)

  const handleSend = async () => {
    if (!input.trim() || isLoading || !currentIntegration) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
    }

    // Add user message to chat
    const userMessageWithId = {
      ...userMessage,
      id: `user-${Date.now()}`,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessageWithId])
    setInput('')
    setIsLoading(true)

    try {
      // Use the model from integration, or verified model from metadata
      let defaultModel = currentIntegration.model || currentIntegration.metadata?.verifiedModel
      
      // If still no model, try to get from metadata availableModels
      if (!defaultModel && currentIntegration.metadata?.availableModels?.length > 0) {
        defaultModel = currentIntegration.metadata.availableModels[0]
      }
      
      // Last resort: use provider-specific defaults (but these might not work)
      if (!defaultModel) {
        switch (currentIntegration.providerId) {
          case 'anthropic':
            defaultModel = 'claude-3-haiku-20240307' // Cheapest/most available
            break
          case 'openai':
            defaultModel = 'gpt-3.5-turbo'
            break
          case 'google':
            // Don't use hardcoded model - it might not exist
            // Instead, show error
            setNotification({
              message: 'No model configured. Please configure the integration and select a model.',
              type: 'error',
            })
            setIsLoading(false)
            return
          default:
            defaultModel = 'claude-3-haiku-20240307'
        }
      }

      // Build messages array with context (using memoized values)
      const messageHistory = messages.map(m => ({ role: m.role, content: m.content }))
      
      // Check if we need to update context (pathname changed or first message)
      const needsContextUpdate = contextSentRef.current !== pathname
      
      // Debug logging (can be removed in production)
      if (process.env.NODE_ENV === 'development') {
        console.log('🤖 [Chatbot Context]', {
          pathname,
          needsContextUpdate,
          contextMessage: contextMessage.substring(0, 100) + '...',
          pageContext: {
            space: pageContext.space,
            tableName: pageContext.tableName,
            pageType: pageContext.pageType,
            pageTitle: pageContext.pageTitle,
          }
        })
      }
      
      // Add context as system message if needed
      let messagesToSend: ChatMessage[]
      if (needsContextUpdate) {
        // Pathname changed or first message - include/update context as system message
        // Remove any existing system messages and add the new one
        const messagesWithoutSystem = messageHistory.filter(m => m.role !== 'system')
        messagesToSend = [
          { role: 'system', content: contextMessage },
          ...messagesWithoutSystem,
          userMessage,
        ]
        contextSentRef.current = pathname
        
        // Debug: Log what we're sending
        if (process.env.NODE_ENV === 'development') {
          console.log('📤 [Chatbot] Sending context update:', {
            systemMessageLength: contextMessage.length,
            totalMessages: messagesToSend.length,
            hasSystemMessage: messagesToSend.some(m => m.role === 'system'),
          })
        }
      } else {
        // Context already sent for this pathname, just add user message
        messagesToSend = [...messageHistory, userMessage]
        
        // Ensure system message is still included
        const hasSystemMessage = messagesToSend.some(m => m.role === 'system')
        if (!hasSystemMessage) {
          // If somehow system message is missing, add it
          messagesToSend = [
            { role: 'system', content: contextMessage },
            ...messagesToSend,
          ]
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ [Chatbot] System message was missing, re-added')
          }
        }
      }
      
      // Limit message history to prevent token bloat (keep last 20 messages + system)
      // This prevents excessive token usage in long conversations
      const MAX_MESSAGES = 20
      if (messagesToSend.length > MAX_MESSAGES + 1) { // +1 for system message
        const systemMsg = messagesToSend.find(m => m.role === 'system')
        const nonSystemMessages = messagesToSend.filter(m => m.role !== 'system')
        const recentMessages = nonSystemMessages.slice(-MAX_MESSAGES)
        messagesToSend = systemMsg ? [systemMsg, ...recentMessages] : recentMessages
      }

      // Make API call
      const response = await aiClient.chat(
        {
          providerId: currentIntegration.providerId,
          apiKey: currentIntegration.apiKey,
          baseUrl: currentIntegration.baseUrl,
          model: defaultModel,
          messages: messagesToSend,
          maxTokens: 1024,
          temperature: 0.7,
        },
        currentIntegration.id // Update lastUsed timestamp
      )

      if (response.success && response.content) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.content,
        }
        const messageId = `assistant-${Date.now()}`
        typingMessageIdRef.current = messageId
        setMessages(prev => [
          ...prev,
          {
            ...assistantMessage,
            id: messageId,
            timestamp: new Date(),
            isTyping: true, // Mark as typing to enable typewriter effect
          },
        ])
      } else {
        setNotification({
          message: response.error || 'Failed to get response from AI',
          type: 'error',
        })
      }
    } catch (error) {
      setNotification({
        message: error instanceof Error ? error.message : 'An error occurred',
        type: 'error',
      })
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClear = () => {
    setMessages([])
    setInput('')
    inputRef.current?.focus()
  }

  if (!currentIntegration && availableIntegrations.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-white rounded-lg border border-neutral-200 ${className}`}>
        <div className="text-center">
          <svg className="w-12 h-12 text-neutral-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">No AI Integration Available</h3>
          <p className="text-sm text-neutral-600 mb-4">
            Please connect an AI provider in the Integration Marketplace first.
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700"
            >
              Go to Integrations
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg border border-neutral-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-neutral-50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">
              {currentIntegration?.providerName || 'AI Assistant'}
            </h3>
            <p className="text-xs text-neutral-500">
              {currentIntegration?.model || 'No model selected'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {availableIntegrations.length > 1 ? (
            <select
              value={selectedIntegrationId || ''}
              onChange={(e) => setSelectedIntegrationId(e.target.value)}
              className="text-xs px-2 py-1 border border-neutral-300 rounded-md bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {availableIntegrations.map((int) => (
                <option key={int.id} value={int.id}>
                  {int.providerName} {int.model ? `(${int.model})` : ''}
                </option>
              ))}
            </select>
          ) : availableIntegrations.length === 1 ? (
            <div className="text-xs text-neutral-500 px-2 py-1">
              {currentIntegration?.providerName}
            </div>
          ) : null}
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="px-2 py-1 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 rounded transition-colors"
              title="Clear conversation"
            >
              Clear
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
              title="Close"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <svg className="w-16 h-16 text-neutral-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <h4 className="text-sm font-medium text-neutral-600 mb-1">Start a conversation</h4>
            <p className="text-xs text-neutral-500">Ask me anything!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onTypingComplete={() => {
                if (message.id === typingMessageIdRef.current) {
                  setMessages(prev => prev.map(m => 
                    m.id === message.id ? { ...m, isTyping: false } : m
                  ))
                  typingMessageIdRef.current = null
                }
              }}
            />
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-neutral-200 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-neutral-200 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={currentIntegration ? "Type your message..." : "Connect an AI provider first"}
            disabled={!currentIntegration || isLoading}
            rows={1}
            className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none disabled:bg-neutral-100 disabled:text-neutral-500"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !currentIntegration}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Send'
            )}
          </button>
        </div>
        {currentIntegration && (
          <p className="text-xs text-neutral-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        )}
      </div>

      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  )
}

// Message Bubble Component with typewriter effect for assistant messages
function MessageBubble({ 
  message, 
  onTypingComplete 
}: { 
  message: ChatMessage & { id: string; timestamp: Date; isTyping?: boolean }
  onTypingComplete: () => void
}) {
  const shouldType = message.role === 'assistant' && message.isTyping
  const { displayedText, isTyping } = useTypewriter({
    text: message.content,
    speed: 50, // 50 characters per second
    enabled: shouldType,
    onComplete: onTypingComplete,
  })
  
  const displayContent = shouldType ? displayedText : message.content
  
  return (
    <div
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          message.role === 'user'
            ? 'bg-green-600 text-white'
            : 'bg-white text-neutral-900 border border-neutral-200'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">
          {displayContent}
          {isTyping && (
            <span className="inline-block w-2 h-4 bg-neutral-400 ml-1 animate-pulse" />
          )}
        </p>
        <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-green-100' : 'text-neutral-400'}`}>
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}

