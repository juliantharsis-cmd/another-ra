/**
 * MCP-Enhanced AI Chat Interface
 * 
 * Enhanced version of AIChatInterface that can use MCP tools
 */

'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { smartChatWithMCP } from '@/lib/ai/mcp-enhanced'
import { AIIntegration } from '@/lib/integrations/types'
import { getAllIntegrations } from '@/lib/integrations/storage'
import { gatherPageContext, formatContextAsSystemMessage } from '@/lib/ai/context'
import Notification from './Notification'
import { XMarkIcon } from './icons'
import { useTypewriter } from '@/hooks/useTypewriter'

interface AIChatInterfaceMCPProps {
  integration?: AIIntegration
  onClose?: () => void
  className?: string
}

export default function AIChatInterfaceMCP({ 
  integration, 
  onClose, 
  className = '' 
}: AIChatInterfaceMCPProps) {
  const pathname = usePathname()
  const [messages, setMessages] = useState<Array<{ 
    role: 'user' | 'assistant' | 'system'
    content: string
    id: string
    timestamp: Date
    isTyping?: boolean
  }>>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | undefined>(integration?.id)
  const [availableIntegrations, setAvailableIntegrations] = useState<AIIntegration[]>([])
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Get page context
  const pageContext = useMemo(() => {
    const userId = typeof window !== 'undefined' 
      ? localStorage.getItem('userId') || sessionStorage.getItem('userId') || undefined
      : undefined
    return gatherPageContext(pathname, userId)
  }, [pathname])
  
  const contextMessage = useMemo(() => formatContextAsSystemMessage(pageContext), [pageContext])

  // Load integrations
  useEffect(() => {
    const loadIntegrations = () => {
      const integrations = getAllIntegrations().filter(i => i.enabled)
      setAvailableIntegrations(integrations)
      
      if (integrations.length > 0 && !selectedIntegrationId) {
        // Prefer Gemini if available
        const geminiIntegration = integrations.find(i => i.providerId === 'google')
        setSelectedIntegrationId(geminiIntegration?.id || integrations[0].id)
      }
    }

    loadIntegrations()
  }, [selectedIntegrationId])

  const currentIntegration = availableIntegrations.find(i => i.id === selectedIntegrationId)

  const handleSend = async () => {
    if (!input.trim() || isLoading || !currentIntegration) return

    const userMessage = {
      role: 'user' as const,
      content: input.trim(),
    }

    const userMessageWithId = {
      ...userMessage,
      id: `user-${Date.now()}`,
      timestamp: new Date(),
    }
    
    setMessages(prev => [...prev, userMessageWithId])
    setInput('')
    setIsLoading(true)

    try {
      // Use smart chat with MCP tools
      const response = await smartChatWithMCP(
        userMessage.content,
        currentIntegration.id,
        contextMessage
      )

      if (response.success && response.content) {
        const assistantMessage = {
          role: 'assistant' as const,
          content: response.content,
          id: `assistant-${Date.now()}`,
          timestamp: new Date(),
          isTyping: false,
        }
        
        setMessages(prev => [...prev, assistantMessage])
      } else {
        setNotification({
          message: response.error || 'Failed to get response',
          type: 'error',
        })
      }
    } catch (error) {
      console.error('Error in chat:', error)
      setNotification({
        message: error instanceof Error ? error.message : 'An error occurred',
        type: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold text-neutral-900">AI Assistant (MCP Enhanced)</h2>
          {currentIntegration && (
            <span className="text-xs text-neutral-500">
              {currentIntegration.providerId === 'google' ? 'Gemini' : currentIntegration.providerId}
            </span>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-200 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-neutral-500 mt-8">
            <p>Ask me anything! I can also query your data using MCP tools.</p>
            <p className="text-sm mt-2">Try: "List all companies" or "Show me active applications"</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-teal-500 text-white'
                  : 'bg-neutral-100 text-neutral-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-neutral-100 rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-neutral-200 bg-white">
        <div className="flex space-x-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Type your message... (I can use MCP tools to query your data)"
            className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
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

