/**
 * Lazy loading and performance optimization components for 180 FPS
 * Implements efficient rendering techniques and dynamic loading
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { usePerformanceConfig } from '../utils/performanceUtils'

interface LazyComponentProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  threshold?: number
  rootMargin?: string
  delay?: number
}

/**
 * Lazy loading component with performance optimization
 * Uses Intersection Observer API for efficient loading
 */
export const LazyComponent: React.FC<LazyComponentProps> = ({
  children,
  fallback = <div>Loading...</div>,
  threshold = 0.1,
  rootMargin = '50px',
  delay = 0
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)
  const perfConfig = usePerformanceConfig()

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Use Intersection Observer for efficient visibility detection
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Add delay for performance optimization
            if (delay > 0) {
              setTimeout(() => {
                setIsLoaded(true)
              }, delay)
            } else {
              setIsLoaded(true)
            }
            
            // Disconnect observer after loading
            observer.disconnect()
          }
        })
      },
      {
        threshold,
        rootMargin,
        // Performance optimization for high refresh rates
        ...(perfConfig.targetFPS >= 180 && { 
          rootMargin: '100px' // Larger margin for smoother loading
        })
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin, delay, perfConfig])

  return (
    <div ref={elementRef}>
      {isLoaded ? children : fallback}
    </div>
  )
}

/**
 * Virtual scrolling component for large lists
 * Optimized for 180 FPS performance
 */
export const VirtualScroll: React.FC<{
  items: any[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: any, index: number) => React.ReactNode
  overscan?: number
}> = ({ items, itemHeight, containerHeight, renderItem, overscan = 5 }) => {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const perfConfig = usePerformanceConfig()

  // Calculate visible range efficiently
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length - 1
    )
    
    return {
      start: Math.max(0, startIndex - overscan),
      end: endIndex
    }
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length])

  // Optimized scroll handler
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement
    const newScrollTop = target.scrollTop

    // Use requestAnimationFrame for smooth scrolling on high-end devices
    if (perfConfig.enableGPUAcceleration) {
      requestAnimationFrame(() => {
        setScrollTop(newScrollTop)
      })
    } else {
      setScrollTop(newScrollTop)
    }
  }, [perfConfig])

  // Throttled scroll handler for performance
  const throttledHandleScroll = useMemo(() => {
    let timeoutId: NodeJS.Timeout
    
    return (event: React.UIEvent<HTMLDivElement>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => handleScroll(event), perfConfig.targetFPS >= 180 ? 8 : 16)
    }
  }, [handleScroll, perfConfig])

  return (
    <div
      ref={containerRef}
      style={{
        height: containerHeight,
        overflow: 'auto',
        // Performance optimizations
        willChange: 'scroll-position',
        transform: 'translateZ(0)',
        // Smooth scrolling for high refresh rates
        scrollBehavior: perfConfig.targetFPS >= 180 ? 'smooth' : 'auto'
      }}
      onScroll={throttledHandleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {items.slice(visibleRange.start, visibleRange.end + 1).map((item, index) => (
          <div
            key={visibleRange.start + index}
            style={{
              position: 'absolute',
              top: (visibleRange.start + index) * itemHeight,
              width: '100%',
              height: itemHeight,
              // Performance optimization
              willChange: 'transform',
              transform: 'translateZ(0)'
            }}
          >
            {renderItem(item, visibleRange.start + index)}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Debounced input component for performance optimization
 */
export const DebouncedInput: React.FC<{
  value: string
  onChange: (value: string) => void
  placeholder?: string
  delay?: number
  className?: string
  style?: React.CSSProperties
}> = ({ value, onChange, placeholder, delay = 300, className, style }) => {
  const [localValue, setLocalValue] = useState(value)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const perfConfig = usePerformanceConfig()

  // Optimized debounced onChange
  const debouncedOnChange = useCallback((newValue: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Adjust delay based on device performance
    const adjustedDelay = delay * (60 / perfConfig.targetFPS)
    
    timeoutRef.current = setTimeout(() => {
      onChange(newValue)
    }, adjustedDelay)
  }, [onChange, delay, perfConfig])

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value
    setLocalValue(newValue)
    debouncedOnChange(newValue)
  }, [debouncedOnChange])

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  return (
    <input
      type="text"
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      style={{
        ...style,
        // Performance optimizations
        willChange: 'auto',
        transform: 'translateZ(0)'
      }}
    />
  )
}

/**
 * Performance-optimized image component with lazy loading
 */
export const OptimizedImage: React.FC<{
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  style?: React.CSSProperties
  priority?: boolean
}> = ({ src, alt, width, height, className, style, priority = false }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const imgRef = useRef<HTMLImageElement>(null)
  const perfConfig = usePerformanceConfig()

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) return

    const img = imgRef.current
    if (!img) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    )

    observer.observe(img)

    return () => {
      observer.disconnect()
    }
  }, [priority])

  const handleLoad = useCallback(() => {
    setIsLoaded(true)
  }, [])

  return (
    <div
      className={className}
      style={{
        ...style,
        position: 'relative',
        overflow: 'hidden',
        // Performance optimizations
        willChange: 'auto',
        transform: 'translateZ(0)'
      }}
    >
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          onLoad={handleLoad}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            // Performance optimizations
            willChange: 'auto',
            transform: 'translateZ(0)',
            // Smooth loading transition
            opacity: isLoaded ? 1 : 0,
            transition: perfConfig.targetFPS >= 180 ? 'opacity 0.1s ease' : 'opacity 0.2s ease'
          }}
        />
      )}
      {!isLoaded && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(30, 30, 30, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '14px'
          }}
        >
          Loading...
        </div>
      )}
    </div>
  )
}

/**
 * Hook for managing component visibility with performance optimization
 */
export const useVisibility = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef<HTMLElement>(null)
  const perfConfig = usePerformanceConfig()

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting)
        })
      },
      {
        threshold,
        // Performance optimization for high refresh rates
        ...(perfConfig.targetFPS >= 180 && { 
          rootMargin: '100px' 
        })
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold, perfConfig])

  return { isVisible, elementRef }
}

export default LazyComponent
