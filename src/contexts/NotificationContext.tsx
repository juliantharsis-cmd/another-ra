'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

// Notification types
export type NotificationType = 'new_records' | 'validation' | 'comment' | 'agent_insight'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  read: boolean
  // For new_records type
  tableName?: string
  tablePath?: string
  recordCount?: number
  // For validation type
  recordId?: string
  recordName?: string
  validationPath?: string
  // For comment type
  commentId?: string
  commentPath?: string
  author?: string
  // For agent_insight type
  insightCategory?: string
  insightPath?: string
}

// Placeholder notifications - will be replaced with real data later
const PLACEHOLDER_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'new_records',
    title: 'New Records in Companies',
    message: '5 new companies have been added to the Companies table',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: false,
    tableName: 'Companies',
    tablePath: '/spaces/system-config/companies',
    recordCount: 5,
  },
  {
    id: '2',
    type: 'validation',
    title: 'Record Requires Validation',
    message: 'Emission Factor "GHG-2024-Q1" requires your validation',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    read: false,
    recordId: 'ef-123',
    recordName: 'GHG-2024-Q1',
    validationPath: '/spaces/emission-management/emission-factors',
  },
  {
    id: '3',
    type: 'comment',
    title: 'You were mentioned in a comment',
    message: 'John Doe mentioned you in a comment on Company "Acme Corp"',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    read: false,
    commentId: 'comment-456',
    author: 'John Doe',
    commentPath: '/spaces/system-config/companies',
  },
  {
    id: '4',
    type: 'agent_insight',
    title: 'SARA Insight: Data Quality Alert',
    message: 'SARA detected potential data inconsistencies in your emission factors. Review recommended.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    read: false,
    insightCategory: 'data_quality',
    insightPath: '/spaces/emission-management/emission-factors',
  },
  {
    id: '5',
    type: 'new_records',
    title: 'New Records in Emission Factors',
    message: '12 new emission factors have been added',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    read: true,
    tableName: 'Emission Factors',
    tablePath: '/spaces/emission-management/emission-factors',
    recordCount: 12,
  },
]

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  setNotifications: (notifications: Notification[]) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(PLACEHOLDER_NOTIFICATIONS)

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        setNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

