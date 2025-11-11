'use client'

import { useState, useEffect, useRef } from 'react'
import { AIAssistantIcon, OverviewIcon, TrendIcon, RecommendationsIcon } from './icons'

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
      className={`bg-white rounded-lg shadow-md overflow-hidden w-72 flex-shrink-0 transition-all duration-500 ${
        isHighlighted 
          ? 'ring-4 ring-teal-500 ring-offset-4 scale-105 z-50 shadow-2xl' 
          : 'opacity-30 scale-95'
      }`}
      style={{
        animation: isHighlighted ? 'none' : 'slide-down-fade-in 0.6s ease-out',
        animationFillMode: 'both',
        animationDelay: `${delay}ms`,
      }}
      data-kpi-index={index}
    >
      <div className="p-6">
        <h3 className="text-sm font-medium text-neutral-600 mb-4 uppercase tracking-wide">
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
        {isAnimating && (
          <div className="mt-3 h-1 bg-neutral-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{
                width: `${(displayValue / value) * 100}%`,
              }}
            />
          </div>
        )}
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
      title: 'Decarbonization Actions Identified',
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
    let currentTextIndex = 0
    
    const showNextText = () => {
      if (currentTextIndex < texts.length) {
        typeText(texts[currentTextIndex], () => {
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

  const handleNextKpi = () => {
    // Stop current typing if in progress
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current)
      typingIntervalRef.current = null
      setIsTyping(false)
    }
    
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
            <AIAssistantIcon className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
            {/* Subtle pulse animation */}
            <span className="absolute inset-0 rounded-full bg-teal-400 opacity-0 group-hover:opacity-20 animate-ping"></span>
          </button>

          {/* Sub-menu icon buttons - arranged in a circle around the main icon with slide-out animation */}
          {showSubMenu && (
            <div className="ai-sub-menu absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              {/* Overview - Top (80px from center) */}
              <button
                onClick={() => handleAnalysisTypeSelect('overview')}
                className="absolute w-10 h-10 rounded-full bg-white shadow-lg hover:shadow-xl transition-all border-2 border-teal-200 hover:border-teal-400 hover:scale-110 flex items-center justify-center group ai-icon-top"
                style={{
                  left: '50%',
                  top: '-80px',
                  transform: 'translateX(-50%)',
                }}
                title="Overview Analysis"
                aria-label="Overview Analysis"
              >
                <OverviewIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>

              {/* Trends - Bottom (80px from center, same distance as top) */}
              <button
                onClick={() => handleAnalysisTypeSelect('trends')}
                className="absolute w-10 h-10 rounded-full bg-white shadow-lg hover:shadow-xl transition-all border-2 border-teal-200 hover:border-teal-400 hover:scale-110 flex items-center justify-center group ai-icon-bottom"
                style={{
                  left: '50%',
                  top: '80px',
                  transform: 'translateX(-50%)',
                }}
                title="Trend Analysis"
                aria-label="Trend Analysis"
              >
                <TrendIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>

              {/* Recommendations - Right (80px from center, same distance as top) */}
              <button
                onClick={() => handleAnalysisTypeSelect('recommendations')}
                className="absolute w-10 h-10 rounded-full bg-white shadow-lg hover:shadow-xl transition-all border-2 border-teal-200 hover:border-teal-400 hover:scale-110 flex items-center justify-center group ai-icon-right"
                style={{
                  top: '50%',
                  left: '80px',
                  transform: 'translateY(-50%)',
                }}
                title="Recommendations"
                aria-label="Recommendations"
              >
                <RecommendationsIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Overlay */}
      {showAnalysisOverlay && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in">
          {/* Speech bubble - positioned above the KPI cards area */}
          <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg min-w-[350px] relative animate-slide-down-fade-in">
              {/* Speech bubble tail pointing down */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-white"></div>
              
              {/* Typewriter text */}
              <div className="text-neutral-800 leading-relaxed min-h-[120px]">
                <p className="text-sm font-medium text-teal-600 mb-3 flex items-center gap-2">
                  <AIAssistantIcon className="w-4 h-4" />
                  AI Analysis
                </p>
                <div className="text-base space-y-2">
                  {displayedText.split('\n').map((line, idx) => (
                    <p key={idx}>{line || '\u00A0'}</p>
                  ))}
                  {isTyping && (
                    <span className="inline-block w-0.5 h-5 bg-teal-600 ml-1 animate-pulse align-middle">|</span>
                  )}
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-200">
                <button
                  onClick={handleSkipAnalysis}
                  className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  Skip Analysis
                </button>
                <button
                  onClick={() => {
                    if (currentKpiIndex >= kpis.length - 1) {
                      endAnalysis()
                    } else {
                      handleNextKpi()
                    }
                  }}
                  className="px-6 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
                >
                  {currentKpiIndex >= kpis.length - 1 ? 'Done' : 'Next KPI →'}
                </button>
              </div>
            </div>
          </div>
        </div>
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

