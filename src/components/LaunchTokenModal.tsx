import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Blocks, Bot, Zap, Globe, Sparkles, Pen, Plus, ArrowRight } from 'lucide-react'

interface LaunchTokenModalProps {
  isOpen: boolean
  onClose: () => void
}

const LaunchTokenModal: React.FC<LaunchTokenModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    website: '',
    twitter: '',
    amount: '0.1'
  })

  const [selectedPlatform, setSelectedPlatform] = useState(() => {
    // Load saved default platform from localStorage
    const savedPlatform = localStorage.getItem('defaultTokenPlatform')
    return savedPlatform || 'Pump'
  })

  const handleClose = () => {
    onClose()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleInstantLaunch = (solAmount: string) => {
    // Check if name and symbol are filled
    if (!formData.name.trim() || !formData.symbol.trim()) {
      return // Don't launch if required fields are empty
    }
    
    // Instant launch logic - dev buy and token creation
    console.log('Instant launching token:', { 
      ...formData, 
      selectedPlatform, 
      solAmount,
      action: 'instant_launch'
    })
    handleClose()
  }

  // Check if launch is eligible
  const isLaunchEligible = formData.name.trim() && formData.symbol.trim()

  const handleSaveDefault = () => {
    // Save current platform as default
    localStorage.setItem('defaultTokenPlatform', selectedPlatform)
    console.log('Default platform saved:', selectedPlatform)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)'
          }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
              duration: 0.2,
              ease: [0.25, 0.46, 0.45, 0.94],
              type: 'spring',
              stiffness: 300,
              damping: 30
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="launch-token-modal fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] rounded-xl border shadow-lg backdrop-blur-md text-white transition-all duration-200 ease-in-out gap-4 p-6"
              style={{
                backgroundColor: 'rgba(30, 30, 30, 0.95)',
                borderColor: 'rgb(80, 80, 80)',
                backdropFilter: 'blur(20px)',
                pointerEvents: 'auto'
              }}
            >
              {/* Header */}
              <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                <h2 className="tracking-tight text-2xl font-bold text-white">
                  Launch Token
                </h2>
                <p className="text-sm text-gray-400">
                  Configure your token and launch it instantly
                </p>
              </div>

              {/* Controls */}
              <div className="flex justify-between">
                <div className="flex items-center justify-between gap-2.5 py-1">
                  <label className="font-medium select-none text-sm flex items-center gap-2">
                    <span className="flex flex-col gap-0">
                      <span>Buy/Sell Panel</span>
                    </span>
                  </label>
                  <button type="button" className="peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 bg-input/80">
                    <span className="bg-background pointer-events-none block size-4 rounded-full ring-0 transition-transform translate-x-0"></span>
                  </button>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none shadow-sm py-2 h-8 text-sm px-2.5 text-indigo-300 bg-indigo-500/10 border-indigo-400/30 hover:bg-indigo-500/20 ring-1 ring-indigo-400/50">
                    <Blocks className="w-3 h-3" />
                    <span>+1</span>
                  </button>
                  <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none bg-secondary shadow-sm hover:bg-secondary/80 py-2 px-2.5 h-8 text-sm text-muted-foreground">
                    <Bot className="w-3 h-3" />
                  </button>
                  <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none bg-secondary shadow-sm hover:bg-secondary/80 py-2 px-2.5 h-8 text-sm text-muted-foreground ring-1 ring-gray-500/30">
                    <Zap className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Main Content */}
              <div className="transition-all duration-200 ease-in-out">
                <div className="flex gap-4 flex-col">
                  <div className="transition-all duration-150 w-full">
                    {/* Platform Selection */}
                    <div className="pb-2 flex-row items-center w-full gap-5 select-none">
                      <div className="flex items-center mb-2 justify-between">
                        <label className="text-sm leading-none font-medium select-none flex gap-0.5 items-center text-left">
                          <span className="text-indigo-200 select-none">Platforms</span>
                          <span className="select-none text-gray-400"> • </span>
                          <button type="button" className="text-[12px] break-words text-indigo-400 hover:text-indigo-300" onClick={handleSaveDefault}>Save Default</button>
                        </label>
                      </div>
                      <div className="w-full grid grid-cols-3 gap-2 transition-all duration-150">
                        <button 
                          onClick={() => setSelectedPlatform('Pump')}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow h-9 px-4 py-2"
                          style={{
                            backgroundColor: selectedPlatform === 'Pump' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(30, 30, 30, 0.8)',
                            borderColor: selectedPlatform === 'Pump' ? 'rgb(34, 197, 94)' : 'rgb(80, 80, 80)',
                            color: selectedPlatform === 'Pump' ? 'rgb(34, 197, 94)' : 'rgb(192, 192, 192)',
                            opacity: selectedPlatform === 'Pump' ? 1 : 0.7,
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            boxShadow: selectedPlatform === 'Pump' ? '0 0 8px rgba(34, 197, 94, 0.3)' : '0 0 4px rgba(80, 80, 80, 0.2)'
                          }}
                        >
                          <img 
                            src="/pumpfun.png" 
                            alt="Pump.fun" 
                            className="w-[18px] h-[18px] object-contain"
                          />
                          Pump
                        </button>
                        <button 
                          onClick={() => setSelectedPlatform('Bonk')}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow h-9 px-4 py-2"
                          style={{
                            backgroundColor: selectedPlatform === 'Bonk' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(30, 30, 30, 0.8)',
                            borderColor: selectedPlatform === 'Bonk' ? 'rgb(249, 115, 22)' : 'rgb(80, 80, 80)',
                            color: selectedPlatform === 'Bonk' ? 'rgb(249, 115, 22)' : 'rgb(192, 192, 192)',
                            opacity: selectedPlatform === 'Bonk' ? 1 : 0.7,
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            boxShadow: selectedPlatform === 'Bonk' ? '0 0 8px rgba(249, 115, 22, 0.3)' : '0 0 4px rgba(80, 80, 80, 0.2)'
                          }}
                        >
                          <img 
                            src="/bonkfun.png" 
                            alt="Bonk.fun" 
                            className="w-[18px] h-[18px] object-contain"
                          />
                          Bonk
                        </button>
                        <button 
                          onClick={() => setSelectedPlatform('Bags')}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow h-9 px-4 py-2"
                          style={{
                            backgroundColor: selectedPlatform === 'Bags' ? 'rgba(21, 128, 61, 0.3)' : 'rgba(30, 30, 30, 0.8)',
                            borderColor: selectedPlatform === 'Bags' ? 'rgb(21, 128, 61)' : 'rgb(80, 80, 80)',
                            color: selectedPlatform === 'Bags' ? 'rgb(21, 128, 61)' : 'rgb(192, 192, 192)',
                            opacity: selectedPlatform === 'Bags' ? 1 : 0.7,
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            boxShadow: selectedPlatform === 'Bags' ? '0 0 8px rgba(21, 128, 61, 0.3)' : '0 0 4px rgba(80, 80, 80, 0.2)'
                          }}
                        >
                          <img 
                            src="/bags.png" 
                            alt="Bags" 
                            className="w-[18px] h-[18px] object-contain"
                          />
                          Bags
                        </button>
                      </div>
                    </div>

                    {/* Image Selection */}
                    <div className="grid gap-3 py-2">
                      <div className="grid gap-2">
                        <label className="text-sm leading-none font-medium select-none flex items-center gap-1">select image</label>
                        <div className="flex flex-wrap gap-1.5 py-1">
                          <div className="relative group">
                            <button type="button" className="w-[72px] h-[72px] overflow-hidden rounded-md border bg-muted hover:bg-muted/50 transition focus:outline-none ring-2 ring-ring ring-offset-2">
                              <div className="relative w-full h-full">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500"></div>
                              </div>
                            </button>
                            <button type="button" className="absolute top-0.5 right-0.5 p-1 bg-black/50 text-white rounded-bl-md rounded-tr-md opacity-0 group-hover:opacity-100 transition">
                              <Pen className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="relative group">
                            <button type="button" className="w-[72px] h-[72px] overflow-hidden rounded-md border bg-muted hover:bg-muted/50 transition focus:outline-none border-border">
                              <div className="relative w-full h-full">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500"></div>
                              </div>
                            </button>
                            <button type="button" className="absolute top-0.5 right-0.5 p-1 bg-black/50 text-white rounded-bl-md rounded-tr-md opacity-0 group-hover:opacity-100 transition">
                              <Pen className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="w-[72px] h-[72px] flex items-center justify-center rounded-md border border-dashed border-muted-foreground text-muted-foreground bg-muted hover:bg-muted/50 transition relative">
                            <button type="button" className="absolute inset-0 flex items-center justify-center z-10">
                              <Plus className="w-5 h-5" />
                            </button>
                            <input accept="image/*" className="hidden" type="file" />
                          </div>
                          <div className="flex flex-col gap-1 w-[72px] h-[72px] select-none">
                            <div className="w-full h-full flex items-center justify-center rounded-[5px] border border-dotted border-zinc-500 text-muted-foreground bg-muted hover:bg-muted/50 transition relative">
                              <button type="button" className="absolute inset-0 flex items-center justify-center z-10">
                                <code className="text-sm">ASCII</code>
                              </button>
                            </div>
                            <div className="relative w-full h-full flex items-center justify-center rounded-[5px] border border-dotted border-zinc-500 text-muted-foreground bg-muted hover:bg-muted/50 transition">
                              <label className="absolute flex items-center justify-center z-10 cursor-pointer">
                                <code className="text-sm">UPLOAD</code>
                                <input accept="image/*" className="absolute cursor-pointer inset-0 opacity-0 w-full h-full ring" type="file" />
                              </label>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 w-[72px] h-[72px] select-none">
                            <div className="w-full h-full flex items-center justify-center rounded-[5px] border border-dotted border-zinc-500 text-muted-foreground bg-muted hover:bg-muted/50 transition relative">
                              <button type="button" className="absolute inset-0 flex items-center justify-center z-10">
                                <code className="text-sm">STUDIO</code>
                              </button>
                            </div>
                            <div className="w-full h-full flex items-center justify-center rounded-[5px] border border-dotted border-zinc-500 text-muted-foreground bg-muted hover:bg-muted/50 transition relative">
                              <button type="button" className="absolute inset-0 flex items-center justify-center z-10">
                                <code className="text-sm">SEARCH</code>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Name and Symbol */}
                      <div className="flex items-center gap-3">
                        <div className="w-[65%] flex flex-col gap-1.5">
                          <label className="gap-2 text-sm leading-none font-medium select-none flex justify-between items-center">
                            <span>name</span>
                            <span className="text-xs text-gray-400/50">{formData.name.length}/32</span>
                          </label>
                          <div className="flex relative">
                            <input 
                              className="flex border px-3 py-1 text-base shadow-sm transition-all duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full pr-9 h-10 rounded-sm"
                              style={{
                                backgroundColor: 'rgba(30, 30, 30, 0.8)',
                                borderColor: 'rgb(80, 80, 80)',
                                color: 'rgb(192, 192, 192)'
                              }}
                              placeholder="coin name" 
                              maxLength={32} 
                              minLength={2} 
                              value={formData.name}
                              name="name"
                              onChange={handleInputChange}
                            />
                            <button type="button" className="absolute right-3 top-2 bottom-2 text-indigo-400 opacity-70 hover:opacity-100 hover:text-indigo-300 flex items-center gap-1 disabled:opacity-50">
                              <Sparkles className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="w-[35%] flex flex-col gap-1.5">
                          <label className="gap-2 text-sm leading-none font-medium select-none flex items-center justify-between">
                            <span>ticker</span>
                            <span className="text-xs text-gray-400/50">{formData.symbol.length}/10</span>
                          </label>
                          <div className="flex relative">
                            <input 
                              className="flex border px-3 py-1 text-base shadow-sm transition-all duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full pr-9 h-10 rounded-sm"
                              style={{
                                backgroundColor: 'rgba(30, 30, 30, 0.8)',
                                borderColor: 'rgb(80, 80, 80)',
                                color: 'rgb(192, 192, 192)'
                              }}
                              placeholder="MEME" 
                              minLength={1} 
                              maxLength={10} 
                              value={formData.symbol}
                              name="symbol"
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Website */}
                      <div className="grid gap-2">
                        <label className="text-sm leading-none font-medium select-none flex justify-between items-center gap-1">
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-3 h-3" />
                            <span>website</span>
                          </div>
                        </label>
                        <input 
                          className="flex h-9 w-full border px-3 py-1 text-base shadow-sm transition-all duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm rounded-sm"
                          style={{
                            backgroundColor: 'rgba(30, 30, 30, 0.8)',
                            borderColor: 'rgb(80, 80, 80)',
                            color: 'rgb(192, 192, 192)'
                          }}
                          placeholder="https://example.com" 
                          value={formData.website}
                          name="website"
                          onChange={handleInputChange}
                        />
                      </div>

                      {/* Twitter */}
                      <div className="grid gap-2">
                        <label className="text-sm leading-none font-medium select-none flex justify-between items-center gap-1">
                          <div className="flex items-center gap-1.5">
                            <svg className="fill-white w-3 h-3" fill="none" width="1200" height="1227" viewBox="0 0 1200 1227" xmlns="http://www.w3.org/2000/svg">
                              <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"></path>
                            </svg>
                            <span>twitter</span>
                          </div>
                          <a target="_blank" rel="noreferrer" href="https://x.com/libsoftiktok/status/1965086541748818272" className="flex items-center text-[12px] gap-1 hover:text-blue-400 opacity-70 hover:opacity-100 transition">
                            <span>open link</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link">
                              <path d="M15 3h6v6"></path>
                              <path d="M10 14 21 3"></path>
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 0 0 1-2-2V8a2 0 0 1 2-2h6"></path>
                            </svg>
                          </a>
                        </label>
                        <input 
                          className="flex h-9 w-full border px-3 py-1 text-base shadow-sm transition-all duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm rounded-sm"
                          style={{
                            backgroundColor: 'rgba(30, 30, 30, 0.8)',
                            borderColor: 'rgb(80, 80, 80)',
                            color: 'rgb(192, 192, 192)'
                          }}
                          placeholder="https://x.com" 
                          value={formData.twitter}
                          name="twitter"
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    {/* Instant Launch Section */}
                    <div className="flex flex-col gap-3 w-full pt-6">
                      <div className="flex gap-2 w-full">
                        <button 
                          onClick={() => handleInstantLaunch('1')}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none h-9 px-4 flex-1 py-3"
                          style={{
                            backgroundColor: 'rgb(185, 255, 93)',
                            color: 'black',
                            borderColor: 'rgb(80, 80, 80)',
                            opacity: isLaunchEligible ? 1 : 0.5
                          }}
                        >
                          <ArrowRight className="w-4 h-4" />
                          1 SOL
                        </button>
                        <button 
                          onClick={() => handleInstantLaunch('3')}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none h-9 px-4 flex-1 py-3"
                          style={{
                            backgroundColor: 'rgb(185, 255, 93)',
                            color: 'black',
                            borderColor: 'rgb(80, 80, 80)',
                            opacity: isLaunchEligible ? 1 : 0.5
                          }}
                        >
                          <ArrowRight className="w-4 h-4" />
                          3 SOL
                        </button>
                        <button 
                          onClick={() => handleInstantLaunch('5')}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none h-9 px-4 flex-1 py-3"
                          style={{
                            backgroundColor: 'rgb(185, 255, 93)',
                            color: 'black',
                            borderColor: 'rgb(80, 80, 80)',
                            opacity: isLaunchEligible ? 1 : 0.5
                          }}
                        >
                          <ArrowRight className="w-4 h-4" />
                          5 SOL
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button 
                type="button" 
                onClick={handleClose}
                className="ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none"
              >
                <X className="w-4 h-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default LaunchTokenModal