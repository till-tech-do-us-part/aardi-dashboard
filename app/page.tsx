'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Metric {
  label: string
  value: string
  color?: string
}

interface Card {
  id: string
  title: string
  badge: string
  badgeText: string
  metrics: Metric[]
  chart?: boolean
  priority?: number
}

export default function Home() {
  const [cards, setCards] = useState<Card[]>([])
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [showDashboard, setShowDashboard] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onstart = () => {
        setIsListening(true)
        if ('speechSynthesis' in window) {
          speechSynthesis.cancel()
        }
      }

      recognitionRef.current.onresult = async (event: any) => {
        const command = event.results[0][0].transcript
        setTranscript(command)
        await processCommand(command)
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }

    if ('speechSynthesis' in window) {
      speechSynthesis.getVoices()
      speechSynthesis.onvoiceschanged = () => {
        speechSynthesis.getVoices()
      }
    }
  }, [])

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert('Voice recognition is not supported in your browser. Please try Chrome or Edge.')
      return
    }

    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
    }

    if (isListening) {
      recognitionRef.current.stop()
    } else {
      recognitionRef.current.start()
    }
  }

  const processCommand = async (command: string) => {
    if (command.toLowerCase().includes('clear') || command.toLowerCase().includes('reset') || command.toLowerCase().includes('remove')) {
      setCards([])
      speak("Dashboard cleared. Ready for new analysis.")
      return
    }

    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      })
      
      const data = await response.json()
      
      if (data.cards && Array.isArray(data.cards)) {
        setCards(prevCards => {
          const existingTitles = prevCards.map(c => c.title)
          const newCards = data.cards.filter((card: Card) => !existingTitles.includes(card.title))
          const allCards = [...newCards, ...prevCards]
          return allCards.slice(0, 12)
        })
      }

      speak(data.response || "Processing your request")
    } catch (error) {
      console.error('Error processing command:', error)
      speak("I encountered an error processing your request")
    }
  }

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
      const pronounceableText = text.replace(/AARDI/g, 'R-dee')
      const utterance = new SpeechSynthesisUtterance(pronounceableText)
      const voices = speechSynthesis.getVoices()
      const britishVoice = voices.find(voice => 
        voice.lang === 'en-GB' && (voice.name.includes('Google UK') || voice.name.includes('Microsoft'))
      ) || voices.find(voice => voice.lang === 'en-GB')
      
      if (britishVoice) {
        utterance.voice = britishVoice
      }
      
      utterance.rate = 1.0
      utterance.pitch = 0.9
      speechSynthesis.speak(utterance)
    }
  }

  const startDemo = () => {
    setShowDashboard(true)
    speak("Good day. I'm R-dee, your environmental intelligence system. I'm now monitoring all your systems. How may I assist you today?")
  }

  // Add keyboard shortcut for spacebar
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Fix: Properly check if target is an Element before using matches
      const target = e.target as Element | null
      if (e.code === 'Space' && target && !target.matches('input, textarea, button')) {
        e.preventDefault()
        toggleVoice()
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isListening])

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <AnimatePresence mode="wait">
        {!showDashboard ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center min-h-screen p-6"
          >
            <div className="text-center max-w-2xl">
              <motion.h1 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
              >
                AARDI
              </motion.h1>
              <motion.p 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-300 mb-8 text-lg"
              >
                AI-powered environmental intelligence dashboard that responds to natural conversation.
              </motion.p>
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 mb-8"
              >
                <p className="text-sm text-gray-400 mb-4">Try saying:</p>
                <div className="space-y-2 text-left">
                  <p className="text-blue-400">"Show me security status"</p>
                  <p className="text-blue-400">"What's happening in production?"</p>
                  <p className="text-blue-400">"Check database performance"</p>
                  <p className="text-blue-400">"Any incidents?"</p>
                  <p className="text-blue-400">"Show compliance status"</p>
                  <p className="text-gray-400 text-sm mt-2">Say "clear dashboard" to reset</p>
                </div>
              </motion.div>
              <motion.button
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={startDemo}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl font-semibold hover:scale-105 transition-transform"
              >
                Start AARDI Experience
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6"
          >
            <div className="max-w-7xl mx-auto">
              <header className="mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  AARDI Environmental Intelligence
                </h1>
                {transcript && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-gray-400 mt-2 bg-white/5 backdrop-blur-lg px-4 py-2 rounded-lg inline-block"
                  >
                    Analyzing: "{transcript}"
                  </motion.p>
                )}
                <p className="text-gray-500 text-sm mt-2">
                  {cards.length} active cards • Say "clear dashboard" to reset
                </p>
              </header>

              <motion.button
                onClick={toggleVoice}
                className={`fixed bottom-8 right-8 p-6 rounded-full ${
                  isListening ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
                } shadow-2xl hover:scale-110 transition-all z-50`}
                animate={isListening ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: isListening ? Infinity : 0, duration: 1.5 }}
              >
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm-1-11c0-.55.45-1 1-1s1 .45 1 1v8c0 .55-.45 1-1 1s-1-.45-1-1V4zm6 8c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-white bg-black/50 px-3 py-1 rounded-full whitespace-nowrap">
                  {isListening ? 'Listening...' : 'Click or press Space'}
                </span>
              </motion.button>

              <div className={`grid gap-6 ${
                cards.length === 1 ? 'grid-cols-1 max-w-2xl' :
                cards.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              }`}>
                <AnimatePresence>
                  {cards.map((card, index) => (
                    <motion.div
                      key={card.id}
                      layout
                      initial={{ opacity: 0, y: 50, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 100,
                        delay: index * 0.05
                      }}
                      className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 hover:scale-105 transition-all hover:border-white/20"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-semibold text-white">{card.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          card.badge === 'critical' ? 'bg-red-500/20 text-red-400 animate-pulse' :
                          card.badge === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                          card.badge === 'success' ? 'bg-green-500/20 text-green-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {card.badgeText}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {Array.isArray(card.metrics) && card.metrics.map((metric: Metric, i: number) => (
                          <div key={`${card.id}-metric-${i}`} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                            <span className="text-gray-400 text-sm">{metric.label}</span>
                            <span 
                              className="text-white font-semibold text-sm" 
                              style={{ color: metric.color || '#ffffff' }}
                            >
                              {metric.value}
                            </span>
                          </div>
                        ))}
                      </div>
                      {card.chart && (
                        <div className="mt-4 h-16 flex items-end gap-1">
                          {[...Array(10)].map((_, i) => (
                            <motion.div
                              key={`${card.id}-bar-${i}`}
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.random() * 100}%` }}
                              transition={{ delay: i * 0.03 }}
                              className="flex-1 bg-gradient-to-t from-blue-500/60 to-purple-500/60 rounded-t"
                            />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {cards.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 text-gray-400"
                >
                  <p className="text-xl mb-4">Your dashboard is ready for commands</p>
                  <p className="text-blue-400">Click the microphone or press spacebar to start</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
