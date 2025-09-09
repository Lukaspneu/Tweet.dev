/**
 * Performance monitoring dashboard for 180 FPS optimization
 * Provides real-time performance metrics and debugging information
 */

import React, { useState, useEffect, useRef } from 'react'
import { performanceManager, PerformanceConfig, DeviceCapabilities } from '../utils/performanceUtils'

interface PerformanceMetrics {
  fps: number
  frameTime: number
  memoryUsage?: number
  gpuMemory?: number
  renderTime: number
  lastUpdate: number
}

interface PerformanceMonitorProps {
  isVisible?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  showDetails?: boolean
}

/**
 * Performance monitoring component for debugging 180 FPS optimization
 * Shows real-time metrics and performance statistics
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isVisible = false,
  position = 'top-right'
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    gpuMemory: 0,
    renderTime: 0,
    lastUpdate: 0
  })
  const [config, setConfig] = useState<PerformanceConfig>(performanceManager.getConfig())
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>(performanceManager.getCapabilities())
  const [isExpanded, setIsExpanded] = useState(false)
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const renderStartRef = useRef(0)

  // Update metrics continuously
  useEffect(() => {
    const updateMetrics = () => {
      const currentTime = performance.now()
      const deltaTime = currentTime - lastTimeRef.current
      
      frameCountRef.current++
      
      // Update FPS every second
      if (deltaTime >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / deltaTime)
        const frameTime = deltaTime / frameCountRef.current
        
        setMetrics(prev => ({
          ...prev,
          fps,
          frameTime,
          lastUpdate: currentTime
        }))
        
        frameCountRef.current = 0
        lastTimeRef.current = currentTime
      }
      
      // Update configuration
      setConfig(performanceManager.getConfig())
      setCapabilities(performanceManager.getCapabilities())
      
      requestAnimationFrame(updateMetrics)
    }
    
    if (isVisible) {
      requestAnimationFrame(updateMetrics)
    }
  }, [isVisible])

  // Monitor memory usage if available
  useEffect(() => {
    if (!isVisible) return

    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
          gpuMemory: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) // MB
        }))
      }
    }

    const interval = setInterval(updateMemoryUsage, 1000)
    return () => clearInterval(interval)
  }, [isVisible])

  // Measure render time
  useEffect(() => {
    renderStartRef.current = performance.now()
    
    const measureRender = () => {
      const renderTime = performance.now() - renderStartRef.current
      setMetrics(prev => ({
        ...prev,
        renderTime
      }))
    }
    
    requestAnimationFrame(measureRender)
  })

  if (!isVisible) return null

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 9999,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      fontFamily: 'monospace',
      fontSize: '12px',
      padding: '8px',
      borderRadius: '4px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      minWidth: '200px'
    }

    switch (position) {
      case 'top-left':
        return { ...baseStyles, top: '10px', left: '10px' }
      case 'top-right':
        return { ...baseStyles, top: '10px', right: '10px' }
      case 'bottom-left':
        return { ...baseStyles, bottom: '10px', left: '10px' }
      case 'bottom-right':
        return { ...baseStyles, bottom: '10px', right: '10px' }
      default:
        return { ...baseStyles, top: '10px', right: '10px' }
    }
  }

  const getFPSColor = (fps: number) => {
    if (fps >= 180) return '#00ff00' // Green for 180+ FPS
    if (fps >= 120) return '#ffff00' // Yellow for 120+ FPS
    if (fps >= 60) return '#ff8800'  // Orange for 60+ FPS
    return '#ff0000' // Red for <60 FPS
  }

  const getPerformanceStatus = () => {
    if (metrics.fps >= 180) return 'Excellent (180+ FPS)'
    if (metrics.fps >= 120) return 'Good (120+ FPS)'
    if (metrics.fps >= 60) return 'Fair (60+ FPS)'
    return 'Poor (<60 FPS)'
  }

  return (
    <div style={getPositionStyles()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>Performance Monitor</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '12px',
            padding: '2px 4px'
          }}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {/* Main FPS Display */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>FPS:</span>
          <span style={{ 
            color: getFPSColor(metrics.fps), 
            fontWeight: 'bold',
            fontSize: '16px'
          }}>
            {metrics.fps}
          </span>
          <span style={{ fontSize: '10px', opacity: 0.7 }}>
            ({getPerformanceStatus()})
          </span>
        </div>
      </div>

      {/* Frame Time */}
      <div style={{ marginBottom: '8px' }}>
        <span>Frame Time: </span>
        <span style={{ color: metrics.frameTime < 16.67 ? '#00ff00' : '#ff8800' }}>
          {metrics.frameTime.toFixed(2)}ms
        </span>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.2)', paddingTop: '8px' }}>
          {/* Memory Usage */}
          {metrics.memoryUsage && (
            <div style={{ marginBottom: '4px' }}>
              <span>Memory: </span>
              <span style={{ color: metrics.memoryUsage < 100 ? '#00ff00' : '#ff8800' }}>
                {metrics.memoryUsage}MB
              </span>
            </div>
          )}

          {/* Render Time */}
          <div style={{ marginBottom: '4px' }}>
            <span>Render: </span>
            <span style={{ color: metrics.renderTime < 5 ? '#00ff00' : '#ff8800' }}>
              {metrics.renderTime.toFixed(2)}ms
            </span>
          </div>

          {/* Device Capabilities */}
          <div style={{ marginBottom: '4px' }}>
            <span>Refresh Rate: </span>
            <span style={{ color: capabilities.refreshRate >= 180 ? '#00ff00' : '#ffff00' }}>
              {capabilities.refreshRate}Hz
            </span>
          </div>

          <div style={{ marginBottom: '4px' }}>
            <span>GPU Accel: </span>
            <span style={{ color: capabilities.gpuAcceleration ? '#00ff00' : '#ff0000' }}>
              {capabilities.gpuAcceleration ? 'Yes' : 'No'}
            </span>
          </div>

          <div style={{ marginBottom: '4px' }}>
            <span>Device: </span>
            <span style={{ color: '#00ff00' }}>
              {capabilities.deviceType}
            </span>
          </div>

          <div style={{ marginBottom: '4px' }}>
            <span>Memory Pressure: </span>
            <span style={{ 
              color: capabilities.memoryPressure === 'low' ? '#00ff00' : 
                     capabilities.memoryPressure === 'medium' ? '#ffff00' : '#ff0000'
            }}>
              {capabilities.memoryPressure}
            </span>
          </div>

          {/* Performance Configuration */}
          <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.2)', paddingTop: '8px' }}>
            <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '4px' }}>Config:</div>
            <div style={{ marginBottom: '2px' }}>
              <span>Target FPS: </span>
              <span style={{ color: '#00ff00' }}>{config.targetFPS}</span>
            </div>
            <div style={{ marginBottom: '2px' }}>
              <span>Quality: </span>
              <span style={{ 
                color: config.animationQuality === 'high' ? '#00ff00' : 
                       config.animationQuality === 'medium' ? '#ffff00' : '#ff8800'
              }}>
                {config.animationQuality}
              </span>
            </div>
            <div style={{ marginBottom: '2px' }}>
              <span>GPU Accel: </span>
              <span style={{ color: config.enableGPUAcceleration ? '#00ff00' : '#ff0000' }}>
                {config.enableGPUAcceleration ? 'On' : 'Off'}
              </span>
            </div>
            <div style={{ marginBottom: '2px' }}>
              <span>Advanced Effects: </span>
              <span style={{ color: config.enableAdvancedEffects ? '#00ff00' : '#ff0000' }}>
                {config.enableAdvancedEffects ? 'On' : 'Off'}
              </span>
            </div>
          </div>

          {/* Performance Tips */}
          <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.2)', paddingTop: '8px' }}>
            <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '4px' }}>Tips:</div>
            {metrics.fps < 60 && (
              <div style={{ fontSize: '10px', color: '#ff8800' }}>
                • Close other tabs/apps
              </div>
            )}
            {capabilities.memoryPressure === 'high' && (
              <div style={{ fontSize: '10px', color: '#ff8800' }}>
                • High memory usage detected
              </div>
            )}
            {!capabilities.gpuAcceleration && (
              <div style={{ fontSize: '10px', color: '#ff8800' }}>
                • Enable hardware acceleration
              </div>
            )}
            {metrics.fps >= 180 && (
              <div style={{ fontSize: '10px', color: '#00ff00' }}>
                • Excellent performance!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Hook for toggling performance monitor visibility
 */
export const usePerformanceMonitor = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle with Ctrl+Shift+P (Performance)
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault()
        setIsVisible(prev => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return {
    isVisible,
    toggle: () => setIsVisible(prev => !prev),
    show: () => setIsVisible(true),
    hide: () => setIsVisible(false)
  }
}

export default PerformanceMonitor
