'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { applicationListApi, ApplicationList } from '@/lib/api/applicationList'
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons'

interface SpaceCard {
  id: string
  name: string
  description: string
  imageUrl?: string
  path: string
  status?: string
  order?: number
}

// Map application names to routes
const getSpacePath = (name: string): string => {
  const nameLower = name.toLowerCase()
  if (nameLower.includes('system') && nameLower.includes('config')) {
    return '/spaces/system-config/companies'
  }
  if (nameLower.includes('admin') || nameLower.includes('administration')) {
    return '/spaces/admin/application-list'
  }
  if (nameLower.includes('emission') || nameLower.includes('ghg')) {
    return '/spaces/emission-management/emission-factors'
  }
  // Default fallback
  return '/'
}

export default function Home() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showCards, setShowCards] = useState(false)
  const [spaceCards, setSpaceCards] = useState<SpaceCard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [homePageData, setHomePageData] = useState<{ imageUrl?: string; logoUrl?: string; description?: string } | null>(null)
  const [showLoginForm, setShowLoginForm] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const cardsContainerRef = useRef<HTMLDivElement>(null)
  const applicationsCacheRef = useRef<ApplicationList[] | null>(null)

  // Load all application data once and cache it
  useEffect(() => {
    const loadApplicationData = async () => {
      // Check cache first (5 minute TTL)
      const cacheKey = 'app_list_cache'
      const cacheTimestampKey = 'app_list_cache_timestamp'
      const cached = localStorage.getItem(cacheKey)
      const cacheTimestamp = localStorage.getItem(cacheTimestampKey)
      const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

      if (cached && cacheTimestamp && Date.now() - parseInt(cacheTimestamp) < CACHE_TTL) {
        try {
          const cachedData = JSON.parse(cached)
          applicationsCacheRef.current = cachedData
          processApplicationData(cachedData)
          return
        } catch (e) {
          // Cache corrupted, fetch fresh data
        }
      }

      try {
        // Single API call to get all applications
        const result = await applicationListApi.getPaginated({
          page: 1,
          limit: 100,
        })

        // Cache the data
        applicationsCacheRef.current = result.data
        localStorage.setItem(cacheKey, JSON.stringify(result.data))
        localStorage.setItem(cacheTimestampKey, Date.now().toString())

        processApplicationData(result.data)
      } catch (error) {
        console.error('Error loading application data:', error)
        // Try to use stale cache if available
        if (cached) {
          try {
            const staleData = JSON.parse(cached)
            applicationsCacheRef.current = staleData
            processApplicationData(staleData)
          } catch (e) {
            // Ignore
          }
        }
      }
    }

    const processApplicationData = (data: ApplicationList[]) => {
      // Find "Home page" or similar application
      const homePageApp = data.find((app: ApplicationList) => {
        const name = (app.Name || '').toLowerCase()
        return name.includes('home') || name.includes('home page') || name.includes('welcome')
      })

      if (homePageApp) {
        let imageUrl: string | undefined
        let logoUrl: string | undefined
        if (homePageApp.Attachment && Array.isArray(homePageApp.Attachment)) {
          // First attachment is the banner image
          if (homePageApp.Attachment.length > 0) {
            const bannerAttachment = homePageApp.Attachment[0]
            imageUrl = bannerAttachment.url || bannerAttachment.thumbnails?.large?.url
          }
          // Second attachment is the logo
          if (homePageApp.Attachment.length > 1) {
            const logoAttachment = homePageApp.Attachment[1]
            logoUrl = logoAttachment.url || logoAttachment.thumbnails?.large?.url
          }
        }

        setHomePageData({
          imageUrl,
          logoUrl,
          description: homePageApp.Description || '',
        })

        // Preload banner image if available
        if (imageUrl) {
          const img = new Image()
          img.src = imageUrl
        }
      }
    }

    loadApplicationData()
  }, [])

  // Load space cards from Application List (uses cached data if available)
  const loadSpaceCards = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Use cached data if available, otherwise fetch
      let data: ApplicationList[] = applicationsCacheRef.current || []
      
      if (data.length === 0) {
        const result = await applicationListApi.getPaginated({
          page: 1,
          limit: 100,
        })
        data = result.data
        applicationsCacheRef.current = data
      }

      // Map ALL applications to space cards (excluding "Home page")
      const cards: SpaceCard[] = []
      
      data.forEach((app: ApplicationList) => {
        const appName = app.Name || ''
        // Skip "Home page" application
        const nameLower = appName.toLowerCase()
        if (nameLower.includes('home') || nameLower.includes('home page') || nameLower.includes('welcome')) {
          return
        }
        
        // Skip inactive applications
        if (app.Status && app.Status.toLowerCase() === 'inactive') {
          return
        }
        
        // Get image URL from attachment
        let imageUrl: string | undefined
        if (app.Attachment && Array.isArray(app.Attachment) && app.Attachment.length > 0) {
          const attachment = app.Attachment[0]
          imageUrl = attachment.url || attachment.thumbnails?.large?.url
        }

        cards.push({
          id: app.id,
          name: appName,
          description: app.Description || '',
          imageUrl,
          path: getSpacePath(appName),
          status: app.Status || 'Active',
          order: app.Order || 999,
        })
      })

      // Sort by Order if available
      const sortedCards = cards.sort((a, b) => {
        return (a.order || 999) - (b.order || 999)
      })

      setSpaceCards(sortedCards)
    } catch (error) {
      console.error('Error loading space cards:', error)
      // Fallback to default cards if API fails
      setSpaceCards([
        {
          id: '1',
          name: 'System Configuration',
          description: 'Manage companies, organizational structure, and system configurations',
          path: '/spaces/system-config/companies',
        },
        {
          id: '2',
          name: 'Administration Space',
          description: 'Administrative functions and user management',
          path: '/spaces/admin/application-list',
        },
        {
          id: '3',
          name: 'Emission Measurement',
          description: 'Track and manage greenhouse gas emissions data',
          path: '/spaces/emission-management/emission-factors',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Check if user is already logged in
  useEffect(() => {
    const loggedIn = localStorage.getItem('another_ra_logged_in') === 'true'
    if (loggedIn) {
      setIsLoggedIn(true)
      setShowLoginForm(false)
      loadSpaceCards()
      setShowCards(true)
    }
  }, [loadSpaceCards])

  const handleLogin = async () => {
    // For now, allow login without password
    if (!loginForm.username.trim()) {
      alert('Please enter a username')
      return
    }

    // Set logged in state
    localStorage.setItem('another_ra_logged_in', 'true')
    localStorage.setItem('another_ra_username', loginForm.username)
    setIsLoggedIn(true)

    // Fade out login form smoothly
    setShowLoginForm(false)

    // Load space cards in the background
    loadSpaceCards().catch(console.error)

    // After 0.8 seconds, fade in cards with "Select a Space" header (smooth transition)
    setTimeout(() => {
      setShowCards(true)
    }, 800)
  }

  const handleCardClick = (path: string) => {
    // Set transition flag for target page BEFORE navigation
    // This ensures the Sidebar can detect it when the new page loads
    localStorage.setItem('space_transition', 'true')
    
    // Start fade-out animation
    setIsTransitioning(true)
    
    // Fade out the home page, then navigate
    setTimeout(() => {
      // Navigate after fade-out completes
      router.push(path)
      // Clear transition state after navigation
      setTimeout(() => {
        setIsTransitioning(false)
      }, 100)
    }, 400) // Shorter delay for fade-out (400ms)
  }

  const scrollCards = useCallback((direction: 'left' | 'right') => {
    if (cardsContainerRef.current) {
      const cardWidth = 320 // Approximate card width with gap
      const scrollAmount = cardWidth * 3 // Scroll by 3 cards at a time
      const currentScroll = cardsContainerRef.current.scrollLeft
      const newScroll = direction === 'right' 
        ? currentScroll + scrollAmount 
        : currentScroll - scrollAmount
      
      cardsContainerRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      })
    }
  }, [])

  // Banner image URL - use from Application List or fallback (memoized)
  const bannerImageUrl = useMemo(() => homePageData?.imageUrl || '/login-banner.jpg', [homePageData?.imageUrl])
  const welcomeMessage = useMemo(() => homePageData?.description || 'Welcome to Another RA', [homePageData?.description])

  return (
    <div className="min-h-screen flex flex-col relative w-full">
      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center">
        {/* Welcome message - only show when not logged in and login form is visible */}
        {!isLoggedIn && showLoginForm && !showCards && (
          <div className="text-center px-4 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6">
              {welcomeMessage}
            </h1>
            {/* Powered by Schneider Electric */}
            <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-neutral-500 mt-8">
              <span>Powered by</span>
              <div className="flex items-center gap-1.5">
                {/* Schneider Electric Logo - Green square */}
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="6" y="6" width="12" height="12" rx="2" fill="#00B04F"/>
                  <rect x="8" y="8" width="8" height="8" rx="1" fill="white" opacity="0.3"/>
                </svg>
                <span className="font-medium text-neutral-600">Schneider Electric</span>
              </div>
            </div>
          </div>
        )}

        {/* Space cards - fade in after login */}
        {showCards && (
          <div className={`w-full flex flex-col items-center justify-center ${isTransitioning ? 'animate-fade-out' : 'animate-slide-up-fade-in'}`} style={{ position: 'absolute', top: '10%', left: 0, right: 0, bottom: 'auto', minHeight: '70vh' }}>
            {/* Top banner - slide up and fade in smoothly */}
            <div className={`mb-12 flex items-center justify-between w-full max-w-7xl px-4 ${isTransitioning ? 'animate-fade-out' : 'animate-slide-up-fade-in'}`}>
              <div className="flex-1"></div>
              <div className="text-center flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2">
                  Select a Space
                </h1>
                <p className="text-neutral-600">
                  Choose a space to get started
                </p>
              </div>
              <div className="flex-1 flex justify-end">
                <button
                  onClick={() => {
                    localStorage.removeItem('another_ra_logged_in')
                    localStorage.removeItem('another_ra_username')
                    setIsLoggedIn(false)
                    setShowCards(false)
                    setShowLoginForm(true)
                    router.push('/')
                    router.refresh()
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300 animate-fade-in"
                  title="Log out"
                >
                  Log Out
                </button>
              </div>
            </div>

            {/* Cards container with horizontal scroll */}
            <div className="relative w-full max-w-7xl px-4 mb-8">
              {/* Left arrow */}
              <button
                onClick={() => scrollCards('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg border border-neutral-200 transition-all hover:scale-110"
                aria-label="Scroll left"
              >
                <ChevronLeftIcon className="w-6 h-6 text-neutral-700" />
              </button>

              {/* Cards scrollable container */}
              <div
                ref={cardsContainerRef}
                className="flex gap-6 md:gap-8 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {spaceCards.map((card, index) => {
                  const isComingSoon = card.status?.toLowerCase().includes('coming soon') || card.status?.toLowerCase() === 'inactive'
                  const isClickable = !isComingSoon && card.status?.toLowerCase() === 'active'
                  
                  return (
                    <div
                      key={card.id}
                      className={`bg-white rounded-lg shadow-md overflow-hidden group flex-shrink-0 w-72 ${
                        isTransitioning 
                          ? '' 
                          : 'animate-slide-down-fade-in'
                      } ${
                        isClickable 
                          ? 'hover:shadow-xl cursor-pointer' 
                          : 'opacity-60 cursor-not-allowed'
                      }`}
                      style={{
                        animationDelay: isTransitioning ? '0ms' : `${index * 100}ms`,
                        animationFillMode: 'both',
                        opacity: isTransitioning ? 0 : undefined,
                        transition: isTransitioning 
                          ? 'opacity 0.4s ease-out' 
                          : undefined,
                        pointerEvents: isTransitioning ? 'none' : undefined,
                      }}
                      onClick={() => {
                        if (isClickable) {
                          handleCardClick(card.path)
                        }
                      }}
                    >
                      {/* Card image */}
                  {card.imageUrl ? (
                    <div className="relative h-40 overflow-hidden bg-neutral-200">
                      <img
                        src={card.imageUrl}
                        alt={card.name}
                        loading="lazy"
                        decoding="async"
                        className={`w-full h-full object-cover transition-transform duration-300 ${
                          isClickable ? 'group-hover:scale-110' : ''
                        }`}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                      {/* White overlay for Coming Soon cards */}
                      {isComingSoon && (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px]"></div>
                      )}
                    </div>
                  ) : (
                        <div className={`h-40 bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center relative ${
                          isComingSoon ? 'opacity-60' : ''
                        }`}>
                          <span className="text-white text-3xl font-bold">
                            {card.name.charAt(0)}
                          </span>
                          {isComingSoon && (
                            <div className="absolute inset-0 bg-white/50"></div>
                          )}
                        </div>
                      )}

                      {/* Card content */}
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-semibold text-neutral-900">
                            {card.name}
                          </h3>
                          {isComingSoon && (
                            <span className="ml-2 px-2 py-1 text-xs font-medium text-neutral-500 bg-neutral-100 rounded-full whitespace-nowrap">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-600" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {card.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Right arrow */}
              <button
                onClick={() => scrollCards('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg border border-neutral-200 transition-all hover:scale-110"
                aria-label="Scroll right"
              >
                <ChevronRightIcon className="w-6 h-6 text-neutral-700" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom banner - always visible, full screen width, slightly smaller height */}
      <div 
        className={`relative h-56 md:h-64 w-screen ${isTransitioning ? 'animate-fade-out' : ''}`}
        style={{ 
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
        }}
      >
        {/* Background image - full screen width */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${bannerImageUrl})`,
            width: '100vw',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
        </div>

        {/* Login form on the right - fade out when logged in */}
        {showLoginForm && (
          <div className="relative z-10 h-full flex items-end justify-end p-6 md:p-12 animate-fade-in">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-6 md:p-8 w-full max-w-md">
              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-neutral-700 mb-2">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleLogin()
                      }
                    }}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleLogin()
                      }
                    }}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                </div>
                <button
                  onClick={handleLogin}
                  className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                >
                  Log In
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
