/**
 * Accessibility optimizations for 180 FPS performance
 * Ensures ARIA compliance and keyboard navigation while maintaining performance
 */

import React, { useEffect, useRef, useCallback } from 'react'
import { usePerformanceConfig } from '../utils/performanceUtils'

interface AccessibilityOptimizerProps {
  children: React.ReactNode
  role?: string
  ariaLabel?: string
  ariaDescribedBy?: string
  tabIndex?: number
  onKeyDown?: (event: React.KeyboardEvent) => void
  onFocus?: (event: React.FocusEvent) => void
  onBlur?: (event: React.FocusEvent) => void
}

/**
 * Accessibility optimizer component that maintains performance while ensuring ARIA compliance
 */
export const AccessibilityOptimizer: React.FC<AccessibilityOptimizerProps> = ({
  children,
  role,
  ariaLabel,
  ariaDescribedBy,
  tabIndex = 0,
  onKeyDown,
  onFocus,
  onBlur
}) => {
  const elementRef = useRef<HTMLDivElement>(null)
  const perfConfig = usePerformanceConfig()

  // Optimized keyboard navigation with performance considerations
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Prevent default behavior for performance-critical keys
    if (event.key === 'Tab' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
    }

    // Call custom handler if provided
    if (onKeyDown) {
      onKeyDown(event)
    }
  }, [onKeyDown])

  // Optimized focus handling
  const handleFocus = useCallback((event: React.FocusEvent) => {
    // Add focus styles without causing reflows
    if (elementRef.current) {
      elementRef.current.style.outline = '2px solid rgb(185, 255, 93)'
      elementRef.current.style.outlineOffset = '2px'
    }

    if (onFocus) {
      onFocus(event)
    }
  }, [onFocus])

  // Optimized blur handling
  const handleBlur = useCallback((event: React.FocusEvent) => {
    // Remove focus styles efficiently
    if (elementRef.current) {
      elementRef.current.style.outline = 'none'
      elementRef.current.style.outlineOffset = '0'
    }

    if (onBlur) {
      onBlur(event)
    }
  }, [onBlur])

  // Set up ARIA attributes efficiently
  useEffect(() => {
    if (elementRef.current) {
      const element = elementRef.current
      
      if (role) element.setAttribute('role', role)
      if (ariaLabel) element.setAttribute('aria-label', ariaLabel)
      if (ariaDescribedBy) element.setAttribute('aria-describedby', ariaDescribedBy)
      
      element.setAttribute('tabindex', tabIndex.toString())
      
      // Add keyboard navigation support
      element.addEventListener('keydown', handleKeyDown as any)
      element.addEventListener('focus', handleFocus as any)
      element.addEventListener('blur', handleBlur as any)

      return () => {
        element.removeEventListener('keydown', handleKeyDown as any)
        element.removeEventListener('focus', handleFocus as any)
        element.removeEventListener('blur', handleBlur as any)
      }
    }
  }, [role, ariaLabel, ariaDescribedBy, tabIndex, handleKeyDown, handleFocus, handleBlur])

  return (
    <div
      ref={elementRef}
      style={{
        // Performance-optimized focus styles
        outline: 'none',
        outlineOffset: '0',
        // Ensure proper focus visibility
        '--focus-visible': '2px solid rgb(185, 255, 93)',
        // GPU acceleration for focus animations
        willChange: perfConfig.enableGPUAcceleration ? 'outline' : 'auto',
        transform: perfConfig.enableHardwareAcceleration ? 'translateZ(0)' : 'none'
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
}

/**
 * Hook for managing focus with performance optimization
 */
export const useFocusManagement = () => {
  const focusHistory = useRef<HTMLElement[]>([])
  const perfConfig = usePerformanceConfig()

  const addToFocusHistory = useCallback((element: HTMLElement) => {
    // Limit focus history to prevent memory issues
    if (focusHistory.current.length > 10) {
      focusHistory.current.shift()
    }
    focusHistory.current.push(element)
  }, [])

  const restorePreviousFocus = useCallback(() => {
    const previousElement = focusHistory.current.pop()
    if (previousElement && previousElement.focus) {
      // Use requestAnimationFrame for smooth focus transitions
      requestAnimationFrame(() => {
        previousElement.focus()
      })
    }
  }, [])

  const focusElement = useCallback((element: HTMLElement) => {
    if (perfConfig.enableGPUAcceleration) {
      // Use requestAnimationFrame for smooth focus on high-end devices
      requestAnimationFrame(() => {
        element.focus()
        addToFocusHistory(element)
      })
    } else {
      // Direct focus for lower-end devices
      element.focus()
      addToFocusHistory(element)
    }
  }, [perfConfig, addToFocusHistory])

  return {
    focusElement,
    restorePreviousFocus,
    addToFocusHistory
  }
}

/**
 * Hook for managing ARIA live regions with performance optimization
 */
export const useAriaLiveRegion = () => {
  const liveRegionRef = useRef<HTMLDivElement>(null)
  const perfConfig = usePerformanceConfig()

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (liveRegionRef.current) {
      // Clear previous message
      liveRegionRef.current.textContent = ''
      
      // Use requestAnimationFrame for smooth announcements
      if (perfConfig.enableGPUAcceleration) {
        requestAnimationFrame(() => {
          if (liveRegionRef.current) {
            liveRegionRef.current.textContent = message
            liveRegionRef.current.setAttribute('aria-live', priority)
          }
        })
      } else {
        // Direct announcement for lower-end devices
        liveRegionRef.current.textContent = message
        liveRegionRef.current.setAttribute('aria-live', priority)
      }
    }
  }, [perfConfig])

  const AriaLiveRegion = useCallback(() => (
    <div
      ref={liveRegionRef}
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'absolute',
        left: '-10000px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        // Performance optimization
        willChange: 'auto',
        transform: 'translateZ(0)'
      }}
    />
  ), [])

  return {
    announce,
    AriaLiveRegion
  }
}

/**
 * Hook for managing keyboard shortcuts with performance optimization
 */
export const useKeyboardShortcuts = (shortcuts: Record<string, () => void>) => {
  const perfConfig = usePerformanceConfig()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const modifier = event.ctrlKey || event.metaKey
      const shortcutKey = modifier ? `ctrl+${key}` : key

      if (shortcuts[shortcutKey]) {
        event.preventDefault()
        
        // Use requestAnimationFrame for smooth execution on high-end devices
        if (perfConfig.enableGPUAcceleration) {
          requestAnimationFrame(() => {
            shortcuts[shortcutKey]()
          })
        } else {
          // Direct execution for lower-end devices
          shortcuts[shortcutKey]()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, perfConfig])
}

/**
 * Component for managing focus trap with performance optimization
 */
export const FocusTrap: React.FC<{
  children: React.ReactNode
  isActive: boolean
  onEscape?: () => void
}> = ({ children, isActive, onEscape }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const firstFocusableRef = useRef<HTMLElement | null>(null)
  const lastFocusableRef = useRef<HTMLElement | null>(null)
  const perfConfig = usePerformanceConfig()

  // Find focusable elements efficiently
  const findFocusableElements = useCallback(() => {
    if (!containerRef.current) return

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    firstFocusableRef.current = focusableElements[0] || null
    lastFocusableRef.current = focusableElements[focusableElements.length - 1] || null
  }, [])

  // Handle tab navigation
  const handleTabKey = useCallback((event: KeyboardEvent) => {
    if (!isActive) return

    if (event.key === 'Tab') {
      if (event.shiftKey) {
        // Shift + Tab (backward)
        if (document.activeElement === firstFocusableRef.current) {
          event.preventDefault()
          lastFocusableRef.current?.focus()
        }
      } else {
        // Tab (forward)
        if (document.activeElement === lastFocusableRef.current) {
          event.preventDefault()
          firstFocusableRef.current?.focus()
        }
      }
    } else if (event.key === 'Escape' && onEscape) {
      onEscape()
    }
  }, [isActive, onEscape])

  useEffect(() => {
    if (isActive) {
      findFocusableElements()
      document.addEventListener('keydown', handleTabKey)
      
      // Focus first element smoothly
      if (firstFocusableRef.current) {
        if (perfConfig.enableGPUAcceleration) {
          requestAnimationFrame(() => {
            firstFocusableRef.current?.focus()
          })
        } else {
          firstFocusableRef.current.focus()
        }
      }
    }

    return () => {
      document.removeEventListener('keydown', handleTabKey)
    }
  }, [isActive, findFocusableElements, handleTabKey, perfConfig])

  return (
    <div ref={containerRef}>
      {children}
    </div>
  )
}

export default AccessibilityOptimizer
