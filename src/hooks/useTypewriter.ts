import { useState, useEffect, useRef } from 'react'

interface UseTypewriterOptions {
  text: string
  speed?: number // Characters per second
  onComplete?: () => void
  enabled?: boolean
}

/**
 * Hook for typewriter effect
 * Gradually reveals text character by character
 */
export function useTypewriter({ text, speed = 50, onComplete, enabled = true }: UseTypewriterOptions) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const indexRef = useRef(0)
  const textRef = useRef(text)
  const enabledRef = useRef(enabled)

  // Update refs when props change
  useEffect(() => {
    textRef.current = text
    enabledRef.current = enabled
  }, [text, enabled])

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (!enabledRef.current) {
      setDisplayedText(textRef.current)
      setIsTyping(false)
      return
    }

    // Reset when text changes
    setDisplayedText('')
    setIsTyping(true)
    indexRef.current = 0

    const typeNextChar = () => {
      if (indexRef.current < textRef.current.length && enabledRef.current) {
        setDisplayedText(textRef.current.slice(0, indexRef.current + 1))
        indexRef.current += 1
        timeoutRef.current = setTimeout(typeNextChar, 1000 / speed)
      } else {
        setIsTyping(false)
        if (onComplete && enabledRef.current) {
          onComplete()
        }
      }
    }

    // Start typing after a small delay
    timeoutRef.current = setTimeout(typeNextChar, 50)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [text, speed, enabled, onComplete])

  return { displayedText, isTyping }
}

