/**
 * Performance optimization utilities for 180 FPS support with graceful degradation
 * Detects device capabilities and adjusts performance settings accordingly
 */

import React from 'react'

export interface PerformanceConfig {
  targetFPS: number
  maxFPS: number
  animationQuality: 'high' | 'medium' | 'low'
  enableGPUAcceleration: boolean
  enableAdvancedEffects: boolean
  enableSmoothScrolling: boolean
  enableHardwareAcceleration: boolean
}

export interface DeviceCapabilities {
  refreshRate: number
  gpuAcceleration: boolean
  memoryPressure: 'low' | 'medium' | 'high'
  deviceType: 'mobile' | 'tablet' | 'desktop'
  batteryLevel?: number
  connectionType?: 'slow-2g' | '2g' | '3g' | '4g' | '5g'
}

class PerformanceManager {
  private config: PerformanceConfig
  private capabilities: DeviceCapabilities
  private frameRateHistory: number[] = []
  private lastFrameTime = 0
  // Frame count tracking removed for performance
  private fpsUpdateInterval = 1000 // Update FPS calculation every second
  private lastFpsUpdate = 0

  constructor() {
    this.capabilities = this.detectDeviceCapabilities()
    this.config = this.generateOptimalConfig()
    this.initializePerformanceMonitoring()
  }

  /**
   * Detects device capabilities for performance optimization
   * Uses multiple techniques to determine optimal settings
   */
  private detectDeviceCapabilities(): DeviceCapabilities {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    
    // Detect refresh rate using requestAnimationFrame timing
    const refreshRate = this.detectRefreshRate()
    
    // Detect GPU acceleration support
    const gpuAcceleration = !!gl && !!(gl as any).getExtension('WEBGL_debug_renderer_info')
    
    // Detect memory pressure (simplified heuristic)
    const memoryPressure = this.detectMemoryPressure()
    
    // Detect device type
    const deviceType = this.detectDeviceType()
    
    // Detect battery level if available
    const batteryLevel = this.detectBatteryLevel()
    
    // Detect connection type if available
    const connectionType = this.detectConnectionType()

    return {
      refreshRate,
      gpuAcceleration,
      memoryPressure,
      deviceType,
      batteryLevel,
      connectionType
    }
  }

  /**
   * Detects refresh rate using requestAnimationFrame timing
   * More accurate than CSS media queries for high refresh rates
   */
  private detectRefreshRate(): number {
    let frameCount = 0
    let startTime = performance.now()
    
    const measureFrame = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime - startTime >= 1000) {
        const detectedFPS = Math.round((frameCount * 1000) / (currentTime - startTime))
        
        // Common refresh rates: 60, 75, 90, 120, 144, 165, 180, 240, 360
        const commonRates = [60, 75, 90, 120, 144, 165, 180, 240, 360]
        const closestRate = commonRates.reduce((prev, curr) => 
          Math.abs(curr - detectedFPS) < Math.abs(prev - detectedFPS) ? curr : prev
        )
        
        return closestRate
      }
      
      requestAnimationFrame(measureFrame)
    }
    
    requestAnimationFrame(measureFrame)
    
    // Fallback to CSS media query detection
    return this.detectRefreshRateCSS() || 60
  }

  /**
   * Fallback refresh rate detection using CSS media queries
   */
  private detectRefreshRateCSS(): number | null {
    const mediaQueries = [
      { query: '(min-resolution: 360dpi)', rate: 360 },
      { query: '(min-resolution: 240dpi)', rate: 240 },
      { query: '(min-resolution: 180dpi)', rate: 180 },
      { query: '(min-resolution: 165dpi)', rate: 165 },
      { query: '(min-resolution: 144dpi)', rate: 144 },
      { query: '(min-resolution: 120dpi)', rate: 120 },
      { query: '(min-resolution: 90dpi)', rate: 90 },
      { query: '(min-resolution: 75dpi)', rate: 75 }
    ]

    for (const { query, rate } of mediaQueries) {
      if (window.matchMedia(query).matches) {
        return rate
      }
    }
    
    return null
  }

  /**
   * Detects memory pressure using available heuristics
   */
  private detectMemoryPressure(): 'low' | 'medium' | 'high' {
    // Use device memory API if available
    if ('deviceMemory' in navigator) {
      const memory = (navigator as any).deviceMemory
      if (memory <= 2) return 'high'
      if (memory <= 4) return 'medium'
      return 'low'
    }

    // Use hardware concurrency as proxy
    const cores = navigator.hardwareConcurrency || 4
    if (cores <= 2) return 'high'
    if (cores <= 4) return 'medium'
    return 'low'
  }

  /**
   * Detects device type based on screen size and user agent
   */
  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (width <= 768 || /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
      return 'mobile'
    }
    
    if (width <= 1024 || /tablet|ipad|android/i.test(userAgent)) {
      return 'tablet'
    }
    
    return 'desktop'
  }

  /**
   * Detects battery level if Battery API is available
   */
  private detectBatteryLevel(): number | undefined {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        return battery.level
      }).catch(() => undefined)
    }
    return undefined
  }

  /**
   * Detects connection type if Network Information API is available
   */
  private detectConnectionType(): 'slow-2g' | '2g' | '3g' | '4g' | '5g' | undefined {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      return connection.effectiveType
    }
    return undefined
  }

  /**
   * Generates optimal performance configuration based on device capabilities
   */
  private generateOptimalConfig(): PerformanceConfig {
    const { refreshRate, gpuAcceleration, memoryPressure, deviceType, batteryLevel, connectionType } = this.capabilities

    // Base configuration for 180 FPS target
    let config: PerformanceConfig = {
      targetFPS: 180,
      maxFPS: 180,
      animationQuality: 'high',
      enableGPUAcceleration: true,
      enableAdvancedEffects: true,
      enableSmoothScrolling: true,
      enableHardwareAcceleration: true
    }

    // Adjust based on refresh rate capability
    if (refreshRate < 120) {
      config.targetFPS = Math.min(refreshRate, 120)
      config.maxFPS = refreshRate
    } else if (refreshRate < 180) {
      config.targetFPS = refreshRate
      config.maxFPS = refreshRate
    }

    // Adjust based on GPU acceleration
    if (!gpuAcceleration) {
      config.enableGPUAcceleration = false
      config.enableAdvancedEffects = false
      config.animationQuality = 'medium'
    }

    // Adjust based on memory pressure
    if (memoryPressure === 'high') {
      config.animationQuality = 'low'
      config.enableAdvancedEffects = false
      config.targetFPS = Math.min(config.targetFPS, 60)
    } else if (memoryPressure === 'medium') {
      config.animationQuality = 'medium'
      config.targetFPS = Math.min(config.targetFPS, 120)
    }

    // Adjust based on device type
    if (deviceType === 'mobile') {
      config.targetFPS = Math.min(config.targetFPS, 120)
      config.enableAdvancedEffects = false
      config.animationQuality = 'medium'
    }

    // Adjust based on battery level
    if (batteryLevel !== undefined && batteryLevel < 0.2) {
      config.targetFPS = Math.min(config.targetFPS, 60)
      config.animationQuality = 'low'
      config.enableAdvancedEffects = false
    }

    // Adjust based on connection type
    if (connectionType === 'slow-2g' || connectionType === '2g') {
      config.animationQuality = 'low'
      config.enableAdvancedEffects = false
    }

    return config
  }

  /**
   * Initializes performance monitoring for dynamic adjustments
   */
  private initializePerformanceMonitoring(): void {
    // Monitor frame rate continuously
    this.monitorFrameRate()
    
    // Monitor memory usage if available
    this.monitorMemoryUsage()
    
    // Monitor battery level changes
    this.monitorBatteryLevel()
  }

  /**
   * Monitors actual frame rate and adjusts configuration dynamically
   */
  private monitorFrameRate(): void {
    const measureFrame = (currentTime: number) => {
      if (this.lastFrameTime) {
        const deltaTime = currentTime - this.lastFrameTime
        const fps = 1000 / deltaTime
        
        this.frameRateHistory.push(fps)
        
        // Keep only last 60 frames for rolling average
        if (this.frameRateHistory.length > 60) {
          this.frameRateHistory.shift()
        }
        
        // Update FPS calculation every second
        if (currentTime - this.lastFpsUpdate >= this.fpsUpdateInterval) {
          const averageFPS = this.frameRateHistory.reduce((a, b) => a + b, 0) / this.frameRateHistory.length
          
          // Adjust configuration if performance is poor
          if (averageFPS < this.config.targetFPS * 0.8) {
            this.adjustConfigurationForPerformance(averageFPS)
          }
          
          this.lastFpsUpdate = currentTime
        }
      }
      
      this.lastFrameTime = currentTime
      requestAnimationFrame(measureFrame)
    }
    
    requestAnimationFrame(measureFrame)
  }

  /**
   * Monitors memory usage and adjusts configuration accordingly
   */
  private monitorMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      
      setInterval(() => {
        const usedRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit
        
        if (usedRatio > 0.8) {
          // High memory usage - reduce quality
          this.config.animationQuality = 'low'
          this.config.enableAdvancedEffects = false
        } else if (usedRatio > 0.6) {
          // Medium memory usage - reduce quality slightly
          this.config.animationQuality = 'medium'
        }
      }, 5000) // Check every 5 seconds
    }
  }

  /**
   * Monitors battery level changes
   */
  private monitorBatteryLevel(): void {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        battery.addEventListener('levelchange', () => {
          if (battery.level < 0.2) {
            // Low battery - reduce performance
            this.config.targetFPS = Math.min(this.config.targetFPS, 60)
            this.config.animationQuality = 'low'
            this.config.enableAdvancedEffects = false
          }
        })
      }).catch(() => {
        // Battery API not available, ignore
      })
    }
  }

  /**
   * Adjusts configuration based on actual performance
   */
  private adjustConfigurationForPerformance(averageFPS: number): void {
    if (averageFPS < 30) {
      // Very poor performance
      this.config.animationQuality = 'low'
      this.config.enableAdvancedEffects = false
      this.config.targetFPS = 30
    } else if (averageFPS < 60) {
      // Poor performance
      this.config.animationQuality = 'low'
      this.config.enableAdvancedEffects = false
      this.config.targetFPS = 60
    } else if (averageFPS < 120) {
      // Medium performance
      this.config.animationQuality = 'medium'
      this.config.targetFPS = 120
    } else if (averageFPS < 180) {
      // Good performance, but not optimal
      this.config.animationQuality = 'high'
      this.config.targetFPS = averageFPS
    }
  }

  /**
   * Gets current performance configuration
   */
  public getConfig(): PerformanceConfig {
    return { ...this.config }
  }

  /**
   * Gets current device capabilities
   */
  public getCapabilities(): DeviceCapabilities {
    return { ...this.capabilities }
  }

  /**
   * Gets current average frame rate
   */
  public getCurrentFPS(): number {
    if (this.frameRateHistory.length === 0) return 0
    return this.frameRateHistory.reduce((a, b) => a + b, 0) / this.frameRateHistory.length
  }

  /**
   * Forces a configuration update (useful for manual adjustments)
   */
  public updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

// Export singleton instance
export const performanceManager = new PerformanceManager()

/**
 * Hook for React components to access performance configuration
 */
export const usePerformanceConfig = () => {
  const [config, setConfig] = React.useState(performanceManager.getConfig())
  
  React.useEffect(() => {
    const updateConfig = () => {
      setConfig(performanceManager.getConfig())
    }
    
    // Update config every 2 seconds
    const interval = setInterval(updateConfig, 2000)
    
    return () => clearInterval(interval)
  }, [])
  
  return config
}

/**
 * Utility function to create frame-rate independent animations
 */
export const createFrameRateIndependentAnimation = (
  duration: number,
  callback: (progress: number) => void,
  config: PerformanceConfig
): () => void => {
  const startTime = performance.now()
  const targetDuration = duration * (60 / config.targetFPS) // Adjust for target FPS
  
  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / targetDuration, 1)
    
    callback(progress)
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }
  
  return () => requestAnimationFrame(animate)
}

/**
 * Utility function for efficient DOM updates with batching
 */
export const batchDOMUpdates = (updates: (() => void)[]): void => {
  requestAnimationFrame(() => {
    updates.forEach(update => update())
  })
}

/**
 * Utility function for throttled event handlers
 */
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number,
  config: PerformanceConfig
): T => {
  const adjustedLimit = limit * (60 / config.targetFPS)
  let inThrottle: boolean
  
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, adjustedLimit)
    }
  }) as T
}

/**
 * Utility function for debounced event handlers
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number,
  config: PerformanceConfig
): T => {
  const adjustedDelay = delay * (60 / config.targetFPS)
  let timeoutId: NodeJS.Timeout
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), adjustedDelay)
  }) as T
}
