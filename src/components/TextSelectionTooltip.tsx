import React, { useState, useEffect, useRef } from 'react'
import { Settings, Zap } from 'lucide-react'

interface TextSelectionTooltipProps {
  onAction?: (action: string, selectedText: string) => void
  onLaunchModalOpen?: (tokenData: { 
    name: string; 
    ticker: string; 
    tweetImage?: string; 
    profileImage?: string; 
    tweetUrl?: string;
    selectedImage?: string; // Auto-selected image (tweet image if available, otherwise profile)
  }) => void
}

interface SelectionData {
  text: string
  rect: DOMRect
  isVisible: boolean
}

const TextSelectionTooltip: React.FC<TextSelectionTooltipProps> = ({ onAction, onLaunchModalOpen }) => {
  const [selection, setSelection] = useState<SelectionData>({
    text: '',
    rect: new DOMRect(),
    isVisible: false
  })
  const tooltipRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()
  const selectionTimeoutRef = useRef<NodeJS.Timeout>()

  // Auto-generate ticker from name (e.g., "Life's Good" → "LG", "Crypto Cash Club" → "CCC")
  const generateTicker = (name: string): string => {
    const words = name.trim().split(/\s+/)
    
    if (words.length === 1) {
      // Single word: take first 2-9 characters, max 9
      const word = words[0].replace(/[^a-zA-Z0-9]/g, '') // Remove special characters
      return word.substring(0, Math.min(9, Math.max(2, word.length))).toUpperCase()
    } else {
      // Multiple words: take first letter of each word, max 9 characters
      const initials = words
        .map(word => word.replace(/[^a-zA-Z0-9]/g, '')) // Remove special characters
        .filter(word => word.length > 0) // Remove empty words
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
      
      // If initials are too long, truncate to 9 characters
      return initials.substring(0, Math.min(9, initials.length))
    }
  }

  // Get both tweet image and profile image from selection
  const getImagesFromSelection = (): { tweetImage?: string; profileImage?: string; tweetUrl?: string } => {
    const windowSelection = window.getSelection()
    if (!windowSelection || windowSelection.rangeCount === 0) return {}

    const range = windowSelection.getRangeAt(0)
    const container = range.commonAncestorContainer
    
    // Find the tweet container
    let tweetElement = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element
    while (tweetElement && !tweetElement.closest('[data-tweet-container]')) {
      tweetElement = tweetElement.parentElement
    }
    
    if (tweetElement) {
      const tweetContainer = tweetElement.closest('[data-tweet-container]')
      if (tweetContainer) {
        // Look for tweet image
        const tweetImage = tweetContainer.querySelector('img[src*="pbs.twimg.com/media"]')
        const tweetImageSrc = tweetImage?.getAttribute('src')
        
        // Look for profile image
        const profileImage = tweetContainer.querySelector('img[src*="pbs.twimg.com/profile_images"]')
        const profileImageSrc = profileImage?.getAttribute('src')
        
        // Look for tweet URL
        const tweetLink = tweetContainer.querySelector('a[href*="twitter.com"], a[href*="x.com"]')
        const tweetUrl = tweetLink?.getAttribute('href')
        
        return {
          tweetImage: tweetImageSrc || undefined,
          profileImage: profileImageSrc || undefined,
          tweetUrl: tweetUrl || undefined
        }
      }
    }
    
    return {}
  }

  const updateSelection = () => {
    const windowSelection = window.getSelection()
    
    if (!windowSelection || windowSelection.rangeCount === 0) {
      setSelection(prev => ({ ...prev, isVisible: false }))
      return
    }

    const range = windowSelection.getRangeAt(0)
    const selectedText = range.toString().trim()

    if (selectedText.length === 0) {
      setSelection(prev => ({ ...prev, isVisible: false }))
      return
    }

    const rect = range.getBoundingClientRect()
    
    // Only show tooltip for selections longer than 2 characters
    if (selectedText.length < 3) {
      setSelection(prev => ({ ...prev, isVisible: false }))
      return
    }

    // Show tooltip immediately when highlighting starts
    setSelection({
      text: selectedText,
      rect,
      isVisible: true
    })
  }

  const handleSelectionChange = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      updateSelection()
    })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent default to avoid interfering with text selection
    e.preventDefault()
    e.stopPropagation()
  }

  const handleMouseUp = (action: string) => {
    // Only trigger action on actual mouse up (click)
    if (action === 'auto' && onLaunchModalOpen) {
      const name = selection.text.trim()
      const ticker = generateTicker(name)
      const { tweetImage, profileImage, tweetUrl } = getImagesFromSelection()
      
      // Auto-select image: tweet image if available, otherwise profile image
      const selectedImage = tweetImage || profileImage
      
      // Open launch modal with auto-filled data
      onLaunchModalOpen({
        name,
        ticker,
        tweetImage,
        profileImage,
        tweetUrl,
        selectedImage
      })
    } else if (onAction) {
      onAction(action, selection.text)
    }
    
    // Clear selection after action
    window.getSelection()?.removeAllRanges()
    setSelection(prev => ({ ...prev, isVisible: false }))
  }

  const getTooltipPosition = () => {
    if (!selection.isVisible) return { top: -1000, left: -1000 }

    const tooltipWidth = 160
    const tooltipHeight = 60
    const padding = 10

    // Calculate center position above the selection
    let top = selection.rect.top - tooltipHeight - padding
    let left = selection.rect.left + (selection.rect.width / 2) - (tooltipWidth / 2)

    // Ensure tooltip stays within viewport bounds
    const viewportWidth = window.innerWidth

    // Horizontal bounds
    if (left < padding) {
      left = padding
    } else if (left + tooltipWidth > viewportWidth - padding) {
      left = viewportWidth - tooltipWidth - padding
    }

    // Vertical bounds - if too high, show below selection
    if (top < padding) {
      top = selection.rect.bottom + padding
    }

    return { top, left }
  }

  useEffect(() => {
    // Add event listeners for text selection
    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('mouseup', handleSelectionChange)
    document.addEventListener('keyup', handleSelectionChange)

    // Cleanup
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('mouseup', handleSelectionChange)
      document.removeEventListener('keyup', handleSelectionChange)
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current)
      }
    }
  }, [])

  const position = getTooltipPosition()

  if (!selection.isVisible) {
    return null
  }

  return (
    <div
      ref={tooltipRef}
      data-selection-tooltip="true"
      className="fixed z-50 animate-in fade-in-0 zoom-in-95 duration-[100ms]"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: '160px'
      }}
    >
      {/* Main tooltip content - matches app background */}
      <div className="text-white z-50 w-full rounded-md px-3 py-2 text-xs shadow-xl border border-gray-700/50 backdrop-blur-md relative" style={{backgroundColor: 'rgb(30,30,30)'}}>
        {/* Character count header */}
        <div className="w-full pb-1.5 mb-1.5 border-b border-gray-700/50 flex items-center justify-center">
          <span className="text-[10px] text-gray-300 font-medium">
            {selection.text.length} characters
          </span>
        </div>
        
        {/* Action buttons - horizontal layout */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onMouseDown={handleMouseDown}
            onMouseUp={() => handleMouseUp('auto')}
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded group hover:bg-gray-700/30 transition-colors duration-150"
            title="Auto processing"
          >
            <Settings className="w-3 h-3 text-gray-400 transition-colors group-hover:text-lime-400" />
            <span className="text-gray-300 transition-colors group-hover:text-lime-400">Auto</span>
          </button>
          
          <button
            type="button"
            onMouseDown={handleMouseDown}
            onMouseUp={() => handleMouseUp('instant')}
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded group hover:bg-gray-700/30 transition-colors duration-150"
            title="Instant processing"
          >
            <Zap className="w-3 h-3 text-gray-400 transition-colors group-hover:text-lime-400" />
            <span className="text-gray-300 transition-colors group-hover:text-lime-400">Instant</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default TextSelectionTooltip
