'use client'

import { useState, useEffect, useRef } from 'react'
import { AIAssistantIcon, OverviewIcon, TrendIcon, RecommendationsIcon } from './icons'
import { isFeatureEnabled } from '@/lib/featureFlags'

interface BlurOverlayProps {
  currentKpiIndex: number
}

function BlurOverlay({ currentKpiIndex }: BlurOverlayProps) {
  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-smooth-fade-in"
      style={{
        transition: 'opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    />
  )
}

interface SpeechBubbleProps {
  currentKpiIndex: number
  displayedText: string
  isTyping: boolean
  currentKpiIndexTotal: number
  onSkip: () => void
  onNext: () => void
  textContainerRef: React.RefObject<HTMLDivElement>
}

function SpeechBubble({ currentKpiIndex, displayedText, isTyping, currentKpiIndexTotal, onSkip, onNext, textContainerRef }: SpeechBubbleProps) {
  const [bubblePosition, setBubblePosition] = useState<{ top: number; left: number; opacity: number } | null>(null)
  const isPositionedRef = useRef(false)
  const bubbleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Find the highlighted KPI card and position bubble above it
    const updatePosition = () => {
      const highlightedCard = document.querySelector(`[data-kpi-index="${currentKpiIndex}"]`) as HTMLElement
      if (highlightedCard) {
        const rect = highlightedCard.getBoundingClientRect()
        const bubbleHeight = 250 // Approximate bubble height
        const newTop = Math.max(20, rect.top - bubbleHeight - 20) // 20px gap above card, min 20px from top
        const newLeft = rect.left + rect.width / 2 // Center above card
        
        // If this is the first time positioning, set opacity to 0 first, then fade in
        if (!isPositionedRef.current) {
          setBubblePosition({
            top: newTop,
            left: newLeft,
            opacity: 0,
          })
          isPositionedRef.current = true
          // Small delay to ensure position is applied before fade
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setBubblePosition(prev => prev ? {
                ...prev,
                opacity: 1,
              } : {
                top: newTop,
                left: newLeft,
                opacity: 1,
              })
            })
          })
        } else {
          // For subsequent positions, just update the position smoothly (opacity stays 1)
          // This will trigger the CSS transition to slide horizontally
          setBubblePosition(prev => ({
            top: newTop,
            left: newLeft,
            opacity: prev?.opacity ?? 1,
          }))
        }
      }
    }

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      updatePosition()
    }, 50)

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition)
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition)
    }
  }, [currentKpiIndex])

  if (!bubblePosition) {
    return null
  }

  return (
    <div 
      ref={bubbleRef}
      className="fixed z-[101]"
      style={{
        top: `${bubblePosition.top}px`,
        left: `${bubblePosition.left}px`,
        transform: 'translate(-50%, 0)',
        opacity: bubblePosition.opacity,
        transition: 'opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1), top 0.7s cubic-bezier(0.4, 0, 0.2, 1), left 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[400px] max-h-[250px] flex flex-col relative animate-smooth-fade-in">
        {/* Speech bubble tail pointing down */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-white"></div>
        
        {/* Header */}
        <p className="text-sm font-medium text-teal-600 mb-3 flex items-center gap-2 flex-shrink-0">
          <AIAssistantIcon className="w-4 h-4" />
          AI Analysis
        </p>
        
        {/* Scrollable text content - accumulates all text */}
        <div 
          ref={textContainerRef}
          className="text-neutral-800 leading-relaxed flex-1 overflow-y-auto pr-2 min-h-[100px] max-h-[150px] custom-scrollbar"
          onScroll={(e) => {
            // Auto-scroll to bottom when new text is being typed, but allow manual scrolling
            const container = e.currentTarget
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50
            if (isTyping && isNearBottom) {
              setTimeout(() => {
                container.scrollTop = container.scrollHeight
              }, 0)
            }
          }}
        >
          <div className="text-sm">
            <p className="whitespace-pre-wrap">{displayedText}</p>
            {isTyping && (
              <span className="inline-block w-0.5 h-4 bg-teal-600 ml-1 animate-pulse align-middle">|</span>
            )}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200 flex-shrink-0">
          <button
            onClick={onSkip}
            className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Skip Analysis
          </button>
          <button
            onClick={onNext}
            className="px-6 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            {currentKpiIndex >= currentKpiIndexTotal - 1 ? 'Done' : 'Next KPI →'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface KPICardProps {
  title: string
  value: number
  unit?: string
  delay?: number
  duration?: number
  isHighlighted?: boolean
  index?: number
}

function KPICard({ title, value, unit = '', delay = 0, duration = 2000, isHighlighted = false, index = 0 }: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Start animation after delay
    const timeoutId = setTimeout(() => {
      setIsAnimating(true)
      
      // Animate from 0 to target value
      const startTime = Date.now()
      const startValue = 0
      
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3)
        const currentValue = Math.floor(startValue + (value - startValue) * easeOutCubic)
        
        setDisplayValue(currentValue)
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setDisplayValue(value)
          setIsAnimating(false)
        }
      }
      
      requestAnimationFrame(animate)
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [value, delay, duration])

  // Format large numbers with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US')
  }

  return (
    <div 
      ref={cardRef}
      className={`bg-white rounded-lg shadow-md overflow-hidden w-72 flex-shrink-0 transition-all duration-700 ease-in-out ${
        isHighlighted 
          ? 'ring-4 ring-teal-500 ring-offset-4 scale-110 z-[110] shadow-2xl opacity-100' 
          : 'opacity-40 scale-95 z-10'
      }`}
      style={{
        animation: isHighlighted ? 'none' : 'slide-down-fade-in 0.6s ease-out',
        animationFillMode: 'both',
        animationDelay: `${delay}ms`,
        transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      data-kpi-index={index}
    >
      <div className="p-6">
        <h3 className="text-sm font-medium text-neutral-600 mb-4 uppercase tracking-wide whitespace-nowrap">
          {title}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-neutral-900">
            {formatNumber(displayValue)}
          </span>
          {unit && (
            <span className="text-lg text-neutral-500">
              {unit}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

interface WelcomeDashboardProps {
  username: string
  onNext: () => void
  onDontShowAgain: () => void
  isTransitioning: boolean
}

type AnalysisType = 'overview' | 'trends' | 'recommendations' | null

interface AnalysisText {
  overview: string[]
  trends: string[]
  recommendations: string[]
}

export default function WelcomeDashboard({
  username,
  onNext,
  onDontShowAgain,
  isTransitioning,
}: WelcomeDashboardProps) {
  const isAIAssistantEnabled = isFeatureEnabled('aiAssistant')
  const SUB_MENU_ICON_DISTANCE = 70

  // Placeholder KPI values for a major industry company
  // These will be replaced with real data later
  const kpis = [
    {
      title: 'Amount of CO₂e Reported',
      value: 2847500, // 2.8 million tons
      unit: 'Tons',
      delay: 200,
    },
    {
      title: 'Decarbonization Actions',
      value: 127, // 127 actions
      unit: '',
      delay: 600,
    },
    {
      title: 'Climate Risks to Mitigate',
      value: 43, // 43 risks
      unit: '',
      delay: 1000,
    },
  ]

  const [showSubMenu, setShowSubMenu] = useState(false)
  const [analysisType, setAnalysisType] = useState<AnalysisType>(null)
  const [currentKpiIndex, setCurrentKpiIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showAnalysisOverlay, setShowAnalysisOverlay] = useState(false)
  const assistantButtonRef = useRef<HTMLButtonElement>(null)
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const textContainerRef = useRef<HTMLDivElement>(null)

  // Analysis templates for each KPI and analysis type
  const analysisTexts: AnalysisText[] = [
    {
      overview: [
        "Your organization has reported 2.85 million tons of CO₂e emissions. This represents a comprehensive measurement of your carbon footprint across all scopes.",
        "This figure encompasses direct emissions from your operations, indirect emissions from purchased energy, and emissions from your value chain.",
        "For a major industrial company, this level of reporting demonstrates strong commitment to transparency and environmental accountability."
      ],
      trends: [
        "Compared to industry benchmarks, your 2.85 million tons places you in the upper quartile of emissions reporting for your sector.",
        "This volume suggests significant opportunities for reduction through targeted decarbonization initiatives.",
        "The comprehensive nature of this reporting indicates you're well-positioned to identify and address emission hotspots."
      ],
      recommendations: [
        "Focus on Scope 1 and 2 emissions first, as these are directly within your operational control.",
        "Consider implementing energy efficiency programs and transitioning to renewable energy sources.",
        "Engage with your supply chain to address Scope 3 emissions, which often represent the largest portion of industrial carbon footprints."
      ]
    },
    {
      overview: [
        "You have identified 127 decarbonization actions across your organization. This is an impressive number that shows proactive climate strategy.",
        "These actions represent concrete steps toward reducing your carbon footprint and achieving your sustainability goals.",
        "The breadth of actions suggests a comprehensive approach to decarbonization across multiple business units."
      ],
      trends: [
        "With 127 identified actions, you're ahead of many peers who typically identify 50-80 actions in their initial assessment.",
        "This volume indicates strong engagement from your teams and a culture of sustainability innovation.",
        "The number suggests you're taking a holistic view of decarbonization opportunities."
      ],
      recommendations: [
        "Prioritize actions with the highest impact-to-effort ratio to maximize your decarbonization results.",
        "Consider grouping similar actions into programs to streamline implementation and tracking.",
        "Regularly review and update your action portfolio as new technologies and opportunities emerge."
      ]
    },
    {
      overview: [
        "You have 43 climate risks identified that require mitigation. This demonstrates thorough risk assessment and climate resilience planning.",
        "These risks span physical, transitional, and regulatory dimensions of climate change impact.",
        "Addressing these risks is critical for long-term business continuity and value protection."
      ],
      trends: [
        "43 identified risks is above average for industrial companies, indicating comprehensive risk management.",
        "This number suggests you're taking a proactive approach to climate risk identification and mitigation.",
        "The volume of risks reflects the complexity of climate impacts on modern industrial operations."
      ],
      recommendations: [
        "Prioritize risks based on likelihood and impact to focus mitigation efforts where they matter most.",
        "Develop a risk mitigation roadmap with clear timelines and accountability.",
        "Consider scenario planning to prepare for different climate futures and regulatory environments."
      ]
    }
  ]

  const handleAIAssistantClick = () => {
    setShowSubMenu(!showSubMenu)
  }

  const handleAnalysisTypeSelect = (type: AnalysisType) => {
    setAnalysisType(type)
    setShowSubMenu(false)
    setShowAnalysisOverlay(true)
    setCurrentKpiIndex(0)
    setDisplayedText('')
    startAnalysis(0, type!)
  }

  const startAnalysis = (kpiIndex: number, type: AnalysisType) => {
    if (kpiIndex >= kpis.length) {
      // Analysis complete
      endAnalysis()
      return
    }

    setCurrentKpiIndex(kpiIndex)
    const texts = analysisTexts[kpiIndex][type!]
    
    // Reset text for new KPI - start from scratch
    setDisplayedText('')
    
    // Type out all text segments one by one, starting fresh
    let currentTextIndex = 0
    let accumulatedText = ''
    
    const showNextText = () => {
      if (currentTextIndex < texts.length) {
        const textToAdd = texts[currentTextIndex]
        typeTextAppend(textToAdd, accumulatedText, () => {
          accumulatedText += (accumulatedText ? ' ' : '') + textToAdd
          currentTextIndex++
          
          if (currentTextIndex < texts.length) {
            // Wait a bit before showing next text
            setTimeout(showNextText, 800)
          }
        })
      }
    }
    
    showNextText()
  }

  const typeText = (text: string, onComplete?: () => void) => {
    // Clear any existing typing interval
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current)
    }
    
    setDisplayedText('')
    setIsTyping(true)
    let charIndex = 0
    
    typingIntervalRef.current = setInterval(() => {
      if (charIndex < text.length) {
        setDisplayedText(text.substring(0, charIndex + 1))
        charIndex++
      } else {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current)
          typingIntervalRef.current = null
        }
        setIsTyping(false)
        if (onComplete) {
          setTimeout(onComplete, 500)
        }
      }
    }, 25) // Adjust speed here (lower = faster)
  }

  const typeTextAppend = (text: string, existingText: string, onComplete?: () => void) => {
    // Clear any existing typing interval
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current)
    }
    
    setIsTyping(true)
    let charIndex = 0
    let lastScrollTime = 0
    const prefix = existingText ? existingText + ' ' : ''
    
    typingIntervalRef.current = setInterval(() => {
      if (charIndex < text.length) {
        const newText = prefix + text.substring(0, charIndex + 1)
        setDisplayedText(newText)
        charIndex++
        
        // Auto-scroll to bottom as text is being typed (if user hasn't scrolled up)
        // Throttle scrolling to every 100ms for better performance
        const now = Date.now()
        if (textContainerRef.current && now - lastScrollTime > 100) {
          const container = textContainerRef.current
          const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
          if (isNearBottom) {
            lastScrollTime = now
            // Use requestAnimationFrame for smooth scrolling during typing
            requestAnimationFrame(() => {
              if (textContainerRef.current) {
                textContainerRef.current.scrollTop = textContainerRef.current.scrollHeight
              }
            })
          }
        }
      } else {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current)
          typingIntervalRef.current = null
        }
        setIsTyping(false)
        // Final scroll to bottom when typing completes
        if (textContainerRef.current) {
          requestAnimationFrame(() => {
            if (textContainerRef.current) {
              textContainerRef.current.scrollTop = textContainerRef.current.scrollHeight
            }
          })
        }
        if (onComplete) {
          setTimeout(onComplete, 500)
        }
      }
    }, 25) // Adjust speed here (lower = faster)
  }

  const handleNextKpi = () => {
    // Stop current typing if in progress
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current)
      typingIntervalRef.current = null
      setIsTyping(false)
    }
    
    // Reset displayed text when moving to next KPI - start fresh for each box
    setDisplayedText('')
    
    // Don't reset the bubble position - let it slide smoothly to the next KPI
    if (analysisType) {
      startAnalysis(currentKpiIndex + 1, analysisType)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current)
      }
    }
  }, [])

  const handleSkipAnalysis = () => {
    endAnalysis()
  }

  const endAnalysis = () => {
    // Stop any ongoing typing
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current)
      typingIntervalRef.current = null
    }
    
    setShowAnalysisOverlay(false)
    setAnalysisType(null)
    setCurrentKpiIndex(0)
    setDisplayedText('')
    setIsTyping(false)
  }

  // Close sub-menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showSubMenu &&
        assistantButtonRef.current &&
        !assistantButtonRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('.ai-sub-menu')
      ) {
        setShowSubMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSubMenu])

  return (
    <div 
      className={`w-full flex flex-col items-center justify-center ${
        isTransitioning ? 'animate-fade-out' : 'animate-fade-in'
      }`}
      style={{ 
        position: 'absolute', 
        top: '10%', 
        left: 0, 
        right: 0, 
        bottom: 'auto', 
        minHeight: '70vh' 
      }}
    >
      {/* AI Assistant Button - Floating in top right with padding to prevent clipping */}
      {isAIAssistantEnabled && (
      <div className="fixed top-6 right-6 z-50" style={{ padding: '80px' }}>
        <div className="relative">
          {/* Main AI Assistant Button */}
          <button
            ref={assistantButtonRef}
            onClick={handleAIAssistantClick}
            className={`w-14 h-14 rounded-full bg-teal-600 hover:bg-teal-700 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-110 ${
              showSubMenu ? 'bg-teal-700 scale-110' : ''
            }`}
            title="AI Assistant - Get insights about your data"
            aria-label="AI Assistant"
          >
            <AIAssistantIcon className="w-7 h-7 text-white group-hover:scale-110 transition-transform flex-shrink-0" />
            {/* Subtle pulse animation */}
            <span className="absolute inset-0 rounded-full bg-teal-400 opacity-0 group-hover:opacity-20 animate-ping"></span>
          </button>

          {/* Sub-menu icon buttons - simple elegant positioning around main icon */}
          {showSubMenu && (
            <div className="ai-sub-menu absolute inset-0">
              {/* Overview - Top */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleAnalysisTypeSelect('overview')
                }}
                className="absolute w-10 h-10 rounded-full bg-white shadow-lg hover:shadow-xl transition-all border-2 border-teal-200 hover:border-teal-400 hover:scale-110 flex items-center justify-center group animate-fade-in-submenu"
                style={{
                  top: `calc(50% - ${SUB_MENU_ICON_DISTANCE}px)`,
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  animationDelay: '0.1s',
                  opacity: 0,
                }}
                title="Overview Analysis"
                aria-label="Overview Analysis"
              >
                <OverviewIcon className="w-5 h-5 group-hover:scale-110 transition-transform flex-shrink-0" />
              </button>

              {/* Trends - Bottom */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleAnalysisTypeSelect('trends')
                }}
                className="absolute w-10 h-10 rounded-full bg-white shadow-lg hover:shadow-xl transition-all border-2 border-teal-200 hover:border-teal-400 hover:scale-110 flex items-center justify-center group animate-fade-in-submenu"
                style={{
                  top: `calc(50% + ${SUB_MENU_ICON_DISTANCE}px)`,
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  animationDelay: '0.2s',
                  opacity: 0,
                }}
                title="Trend Analysis"
                aria-label="Trend Analysis"
              >
                <TrendIcon className="w-5 h-5 group-hover:scale-110 transition-transform flex-shrink-0" />
              </button>

              {/* Recommendations - Left */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleAnalysisTypeSelect('recommendations')
                }}
                className="absolute w-10 h-10 rounded-full bg-white shadow-lg hover:shadow-xl transition-all border-2 border-teal-200 hover:border-teal-400 hover:scale-110 flex items-center justify-center group animate-fade-in-submenu"
                style={{
                  top: '50%',
                  left: `calc(50% - ${SUB_MENU_ICON_DISTANCE}px)`,
                  transform: 'translate(-50%, -50%)',
                  animationDelay: '0.15s',
                  opacity: 0,
                }}
                title="Recommendations"
                aria-label="Recommendations"
              >
                <RecommendationsIcon className="w-5 h-5 group-hover:scale-110 transition-transform flex-shrink-0" />
              </button>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Analysis Overlay */}
      {isAIAssistantEnabled && showAnalysisOverlay && (
        <>
          {/* Blur overlay with exclusion for highlighted card */}
          <BlurOverlay currentKpiIndex={currentKpiIndex} />
          
          {/* Speech bubble - positioned above the highlighted KPI card */}
          <SpeechBubble
            currentKpiIndex={currentKpiIndex}
            displayedText={displayedText}
            isTyping={isTyping}
            currentKpiIndexTotal={kpis.length}
            onSkip={handleSkipAnalysis}
            onNext={() => {
                    if (currentKpiIndex >= kpis.length - 1) {
                      endAnalysis()
                    } else {
                      handleNextKpi()
                    }
                  }}
            textContainerRef={textContainerRef}
          />
        </>
      )}

      {/* Top banner */}
      <div className={`mb-12 flex items-center justify-between w-full max-w-7xl px-4 ${
        isTransitioning ? 'animate-fade-out' : 'animate-slide-up-fade-in'
      }`}>
        <div className="flex-1"></div>
        <div className="text-center flex-1">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-lg text-neutral-600">
            {username}
          </p>
        </div>
        <div className="flex-1 flex justify-end">
          <button
            onClick={() => {
              localStorage.removeItem('another_ra_logged_in')
              localStorage.removeItem('another_ra_username')
              window.location.href = '/'
            }}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300"
            title="Log out"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="relative w-full max-w-7xl px-4 mb-8">
        <div className="flex gap-6 md:gap-8 justify-center flex-wrap">
          {kpis.map((kpi, index) => (
            <KPICard
              key={index}
              title={kpi.title}
              value={kpi.value}
              unit={kpi.unit}
              delay={kpi.delay}
              duration={2000}
              isHighlighted={showAnalysisOverlay && currentKpiIndex === index}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Subtitle */}
      <p className="text-sm text-neutral-500 mb-8 text-center max-w-2xl px-4">
        Summary of activities since your last connection
      </p>

      {/* Action buttons */}
      <div className="flex items-center gap-4 mt-8">
        <button
          onClick={onNext}
          className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-sm"
        >
          Next
        </button>
        <button
          onClick={onDontShowAgain}
          className="px-6 py-3 text-sm text-neutral-600 hover:text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors border border-neutral-200 hover:border-neutral-300"
        >
          Don't show again
        </button>
      </div>
    </div>
  )
}

