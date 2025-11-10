'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { UserIcon } from './icons'

const spaces = [
  { name: 'Home', path: '/' },
  { name: 'System Config', path: '/spaces/system-config/companies' },
  { name: 'Admin', path: '/spaces/admin' },
  { name: 'GHG Emission', path: '/spaces/ghg-emission' },
  { name: 'Preferences', path: '/spaces/admin/user-preferences', icon: UserIcon },
]

export default function SpaceNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Check if user is logged in
  useEffect(() => {
    const checkLogin = () => {
      const loggedIn = localStorage.getItem('another_ra_logged_in') === 'true'
      setIsLoggedIn(loggedIn)
    }
    checkLogin()
    // Listen for storage changes (in case logout happens in another tab)
    window.addEventListener('storage', checkLogin)
    // Check periodically in case localStorage was changed in same tab
    const interval = setInterval(checkLogin, 1000)
    return () => {
      window.removeEventListener('storage', checkLogin)
      clearInterval(interval)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('another_ra_logged_in')
    localStorage.removeItem('another_ra_username')
    setIsLoggedIn(false)
    router.push('/')
    router.refresh()
  }
  
  // Hide navigation on companies page (it has its own sidebar) or on home page (always)
  const hideNav = pathname.startsWith('/spaces/system-config/companies') || pathname === '/'
  
  if (hideNav) {
    return null
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Another RA
            </Link>
            <div className="flex space-x-4">
              {spaces.map((space) => {
                let isActive = false
                if (space.path === '/spaces/admin/user-preferences') {
                  isActive = pathname === space.path
                } else if (space.path.includes('/companies')) {
                  isActive = pathname.startsWith('/spaces/system-config')
                } else if (space.path === '/spaces/admin') {
                  isActive = pathname.startsWith('/spaces/admin') && !pathname.includes('/user-preferences')
                } else {
                  isActive = pathname === space.path
                }
                const Icon = space.icon
                return (
                  <Link
                    key={space.path}
                    href={space.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{space.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
          {/* Logout button - only show when logged in */}
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300"
              title="Log out"
            >
              Log Out
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}

