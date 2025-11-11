'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { XMarkIcon, AIAssistantIcon } from './icons'
import { BuildingIcon, DocumentIcon, ChartIcon, LeafIcon } from './icons'
import { useNotifications, NotificationType, Notification } from '@/contexts/NotificationContext'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const router = useRouter()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [filter, setFilter] = useState<NotificationType | 'all'>('all')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!isOpen || !mounted) return null

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filter)

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markAsRead(notification.id)

    // Navigate based on notification type
    if (notification.type === 'new_records' && notification.tablePath) {
      router.push(notification.tablePath)
      onClose()
    } else if (notification.type === 'validation' && notification.validationPath) {
      router.push(notification.validationPath)
      onClose()
    } else if (notification.type === 'comment' && notification.commentPath) {
      router.push(notification.commentPath)
      onClose()
    } else if (notification.type === 'agent_insight' && notification.insightPath) {
      router.push(notification.insightPath)
      onClose()
    }
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'new_records':
        return <BuildingIcon className="w-5 h-5" />
      case 'validation':
        return <DocumentIcon className="w-5 h-5" />
      case 'comment':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )
      case 'agent_insight':
        return <AIAssistantIcon className="w-5 h-5" />
    }
  }

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'new_records':
        return 'bg-blue-100 text-blue-600'
      case 'validation':
        return 'bg-amber-100 text-amber-600'
      case 'comment':
        return 'bg-purple-100 text-purple-600'
      case 'agent_insight':
        return 'bg-teal-100 text-teal-600'
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900 bg-opacity-30 z-40"
        onClick={onClose}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Modal */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'relative', zIndex: 50 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">
                Notifications
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-md hover:bg-neutral-100 transition-colors"
                >
                  Mark all as read
                </button>
              )}
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
                aria-label="Close"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 px-6 pt-4 pb-2 border-b border-neutral-200">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-green-100 text-green-700'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('new_records')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === 'new_records'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              New Records
            </button>
            <button
              onClick={() => setFilter('validation')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === 'validation'
                  ? 'bg-amber-100 text-amber-700'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Validation
            </button>
            <button
              onClick={() => setFilter('comment')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === 'comment'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Comments
            </button>
            <button
              onClick={() => setFilter('agent_insight')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === 'agent_insight'
                  ? 'bg-teal-100 text-teal-700'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              SARA Insights
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-neutral-600 font-medium">No notifications</p>
                <p className="text-sm text-neutral-500 mt-1">
                  {filter === 'all' ? 'You\'re all caught up!' : `No ${filter.replace('_', ' ')} notifications`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-4 rounded-lg border transition-all hover:shadow-md ${
                      notification.read
                        ? 'bg-white border-neutral-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className={`text-sm font-semibold ${notification.read ? 'text-neutral-700' : 'text-neutral-900'}`}>
                              {notification.title}
                            </h4>
                            <p className="text-sm text-neutral-600 mt-1">
                              {notification.message}
                            </p>
                            {notification.type === 'new_records' && (
                              <div className="mt-2 text-xs text-neutral-500">
                                <span className="font-medium">Note:</span> This feature is in progress. Record highlighting will be available soon.
                              </div>
                            )}
                          </div>
                          {!notification.read && (
                            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600"></div>
                          )}
                        </div>
                        <div className="mt-2 text-xs text-neutral-500">
                          {formatTimestamp(notification.timestamp)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )

  return createPortal(modalContent, document.body)
}

