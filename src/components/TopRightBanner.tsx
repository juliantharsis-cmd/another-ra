'use client'

import { useState } from 'react'
import { UserIcon, ShareIcon, BellIcon, SettingsIcon } from './icons'
import { isFeatureEnabled } from '@/lib/featureFlags'
import NotificationCenter from './NotificationCenter'
import SettingsModal from './SettingsModal'
import UserPreferencesModal from './UserPreferencesModal'
import { useNotifications } from '@/contexts/NotificationContext'

export default function TopRightBanner() {
  const { unreadCount } = useNotifications()
  const [isUserPreferencesOpen, setIsUserPreferencesOpen] = useState(false)
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <>
      {/* Top Right Banner */}
      <div className="fixed top-0 right-0 z-[60] bg-white border-b border-l border-neutral-200 shadow-sm rounded-bl-lg">
        <div className="flex items-center gap-2 px-3 py-2.5">
          {/* User Preferences */}
          {isFeatureEnabled('userPreferences') && (
            <button
              onClick={() => setIsUserPreferencesOpen(true)}
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer group ${
                isUserPreferencesOpen
                  ? 'bg-green-100 border-green-500'
                  : 'bg-neutral-300 border-transparent hover:bg-green-100 hover:border-green-500'
              }`}
              title="User Preferences"
            >
              <UserIcon
                className={`w-5 h-5 transition-colors ${
                  isUserPreferencesOpen
                    ? 'text-green-600'
                    : 'text-neutral-600 group-hover:text-green-600'
                }`}
              />
            </button>
          )}

          {/* Share */}
          <button 
            className="p-2 text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors" 
            title="Share"
          >
            <ShareIcon className="w-5 h-5" />
          </button>

          {/* Notifications */}
          {isFeatureEnabled('notifications') && (
            <button 
              onClick={() => setIsNotificationCenterOpen(true)}
              className="relative p-2 text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors" 
              title="Notifications"
            >
              <BellIcon className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[14px] h-[14px] px-0.5 text-[10px] font-semibold text-white bg-green-600 rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Settings */}
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors" 
            title="Settings"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Modals */}
      {isFeatureEnabled('settingsModal') && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isFeatureEnabled('userPreferences') && (
        <UserPreferencesModal
          isOpen={isUserPreferencesOpen}
          onClose={() => setIsUserPreferencesOpen(false)}
        />
      )}

      {isFeatureEnabled('notifications') && (
        <NotificationCenter
          isOpen={isNotificationCenterOpen}
          onClose={() => setIsNotificationCenterOpen(false)}
        />
      )}
    </>
  )
}

