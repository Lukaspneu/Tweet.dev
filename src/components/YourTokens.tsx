import React from 'react'
import { RefreshCw } from 'lucide-react'

const YourTokens: React.FC = () => {
  return (
    <div className="w-full h-full rounded-xl border overflow-hidden flex flex-col" style={{backgroundColor: 'rgb(30,30,30)', borderColor: 'rgb(80,80,80)'}}>
      {/* Header */}
      <div className="flex items-center justify-between px-2 sm:px-4 py-3 border-b sticky top-0 z-10" style={{backgroundColor: 'rgb(30,30,30)', borderColor: 'rgb(80,80,80)'}}>
        <h2 className="font-bold text-base sm:text-lg" style={{color: 'rgb(192,192,192)'}}>Your Tokens</h2>
        <div className="flex items-center gap-1 sm:gap-2">
          <button className="px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm hover:opacity-80 transition-opacity" style={{backgroundColor: 'rgb(30,30,30)', borderColor: 'rgb(80,80,80)', color: 'rgb(192,192,192)'}} type="button">
            Sell Presets
          </button>
          <button className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity" style={{backgroundColor: 'rgb(30,30,30)', borderColor: 'rgb(80,80,80)'}} type="button">
            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" style={{color: 'rgb(192,192,192)'}} />
          </button>
        </div>
      </div>

      {/* Token List - Empty */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center" style={{backgroundColor: 'rgb(30,30,30)'}}>
        <div className="text-center" style={{color: 'rgb(192,192,192)'}}>
          <p className="text-lg mb-2">No tokens available</p>
          <p className="text-sm opacity-70">Add tokens to see them here</p>
        </div>
      </div>
    </div>
  )
}

export default YourTokens
