import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { hasGeminiApiKey, saveGeminiApiKey, askCoachBebi, getWeeklyReview } from '@/lib/ai'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils/cn'

// Storage key for chat history
const CHAT_STORAGE_KEY = 'coach_bebi_chat_history'

// Coach Bebi avatar component
const BebiAvatar = ({ size = 'md', mood = 'default' }: { size?: 'sm' | 'md' | 'lg'; mood?: 'default' | 'thinking' | 'error' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
  }

  const moodImage = {
    default: '/bebi-avatar.png',
    thinking: '/bebi-avatar.png',
    error: '/bebi-disappointed.png',
  }

  return (
    <div className={cn(
      'border-2 border-accent overflow-hidden flex-shrink-0',
      sizeClasses[size],
      mood === 'thinking' && 'animate-pulse'
    )}>
      <img
        src={moodImage[mood]}
        alt="Coach Bebi"
        className="w-full h-full object-cover"
      />
    </div>
  )
}

// Typing indicator with personality
const TypingIndicator = () => {
  const messages = [
    'Elemzem az adataidat...',
    'GONDOLKODOM...',
    'Na várj, ezt meg kell néznem...',
    'Mindjárt jövök a verdikttel...',
  ]
  const [currentMessage] = useState(() => messages[Math.floor(Math.random() * messages.length)])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 justify-start"
    >
      <BebiAvatar size="sm" mood="thinking" />
      <div className="bg-bg-secondary border border-text-muted/20 p-4">
        <p className="text-2xs font-display uppercase tracking-wider text-accent mb-2">
          Coach Bebi
        </p>
        <p className="text-xs text-text-muted mb-2">{currentMessage}</p>
        <div className="flex gap-1.5">
          <motion.div
            className="w-2 h-2 bg-accent"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="w-2 h-2 bg-accent"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-2 h-2 bg-accent"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      </div>
    </motion.div>
  )
}

// Simple markdown renderer for bold text and line breaks
const renderMessage = (content: string) => {
  // Split by **bold** pattern
  const parts = content.split(/(\*\*[^*]+\*\*)/g)

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-accent">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={index}>{part}</span>
  })
}

// Relative time formatter
const formatRelativeTime = (date: Date) => {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)

  if (diffMins < 1) return 'most'
  if (diffMins < 60) return `${diffMins} perce`
  if (diffHours < 24) return `${diffHours} órája`
  return new Date(date).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })
}

interface Message {
  id: string
  role: 'user' | 'coach'
  content: string
  timestamp: Date
  isError?: boolean
}

// Load messages from localStorage
const loadMessages = (): Message[] => {
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY)
    if (stored) {
      const messages = JSON.parse(stored)
      return messages.map((m: Message) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      }))
    }
  } catch (e) {
    console.error('Failed to load chat history:', e)
  }
  return []
}

// Save messages to localStorage
const saveMessages = (messages: Message[]) => {
  try {
    // Keep last 50 messages to prevent storage bloat
    const toSave = messages.slice(-50)
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toSave))
  } catch (e) {
    console.error('Failed to save chat history:', e)
  }
}

export function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showApiKeyInput, setShowApiKeyInput] = useState(!hasGeminiApiKey())
  const [apiKey, setApiKey] = useState('')
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [retryMessage, setRetryMessage] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load persisted messages on mount
  useEffect(() => {
    if (hasGeminiApiKey()) {
      const saved = loadMessages()
      if (saved.length > 0) {
        setMessages(saved)
      } else {
        // Show welcome message for new users
        setMessages([{
          id: 'welcome',
          role: 'coach',
          content: 'Szia! Coach Bebi vagyok. 💪 Kérdezz bátran az edzéseidről, táplálkozásról, vagy kérj heti áttekintést. Itt vagyok, hogy segítsek!',
          timestamp: new Date(),
        }])
      }
    }
  }, [])

  // Save messages when they change (excluding initial load)
  useEffect(() => {
    if (messages.length > 0 && messages[0].id !== 'welcome') {
      saveMessages(messages)
    } else if (messages.length > 1) {
      saveMessages(messages)
    }
  }, [messages])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (!showScrollButton) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, showScrollButton])

  // Track scroll position for scroll-to-bottom button
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setShowScrollButton(!isNearBottom)
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowScrollButton(false)
  }

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      saveGeminiApiKey(apiKey.trim())
      setShowApiKeyInput(false)
      setMessages([{
        id: 'welcome',
        role: 'coach',
        content: 'Szia! Coach Bebi vagyok. 💪 Kérdezz bátran az edzéseidről, táplálkozásról, vagy kérj heti áttekintést. Itt vagyok, hogy segítsek!',
        timestamp: new Date(),
      }])
    }
  }

  const handleSend = async (messageOverride?: string) => {
    const messageText = messageOverride || input.trim()
    if (!messageText || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setRetryMessage(null)
    setShowScrollButton(false)

    try {
      const response = await askCoachBebi(messageText)
      const coachMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'coach',
        content: response.success ? response.message : response.error || 'Hiba történt',
        timestamp: new Date(),
        isError: !response.success,
      }
      setMessages((prev) => [...prev, coachMessage])

      if (!response.success) {
        setRetryMessage(messageText)
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'coach',
          content: 'Bocsi, valami hiba történt. Próbáld újra!',
          timestamp: new Date(),
          isError: true,
        },
      ])
      setRetryMessage(messageText)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWeeklyReview = async () => {
    if (isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: 'Kérek egy heti áttekintést!',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    setRetryMessage(null)
    setShowScrollButton(false)

    try {
      const response = await getWeeklyReview()
      const coachMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'coach',
        content: response.success ? response.message : response.error || 'Hiba történt',
        timestamp: new Date(),
        isError: !response.success,
      }
      setMessages((prev) => [...prev, coachMessage])

      if (!response.success) {
        setRetryMessage('weekly_review')
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'coach',
          content: 'Bocsi, valami hiba történt. Próbáld újra!',
          timestamp: new Date(),
          isError: true,
        },
      ])
      setRetryMessage('weekly_review')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    if (!retryMessage) return

    if (retryMessage === 'weekly_review') {
      // Remove last error message and retry
      setMessages((prev) => prev.slice(0, -2))
      handleWeeklyReview()
    } else {
      // Remove last error message and retry
      setMessages((prev) => prev.slice(0, -2))
      handleSend(retryMessage)
    }
  }

  const handleClearChat = () => {
    setMessages([{
      id: 'welcome-' + Date.now(),
      role: 'coach',
      content: 'Na, tiszta lap! 💪 Mi járhat a fejedben? Kérdezz bármit az edzésről, vagy kérj heti áttekintést!',
      timestamp: new Date(),
    }])
    setRetryMessage(null)
    localStorage.removeItem(CHAT_STORAGE_KEY)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Quick action handler that sends immediately
  const handleQuickAction = (question: string) => {
    if (isLoading) return
    handleSend(question)
  }

  if (showApiKeyInput) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col">
        <header className="px-4 pt-5 pb-3 border-b-2 border-text-muted/20">
          <h1 className="font-display text-xl font-extrabold uppercase tracking-wide">Coach Bebi</h1>
          <p className="text-text-muted text-xs mt-0.5">AI edzéstanácsadó</p>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6"
          >
            <BebiAvatar size="lg" />
          </motion.div>
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-center mb-2">
            Gemini API kulcs szükséges
          </h2>
          <p className="text-text-muted text-sm text-center mb-6 max-w-xs">
            Coach Bebi a Google Gemini AI-t használja. Add meg az API kulcsodat a használathoz.
          </p>

          <div className="w-full max-w-sm space-y-4">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
              placeholder="Gemini API kulcs"
              className="w-full p-4 bg-bg-secondary border-2 border-text-muted/30 font-mono text-sm text-text-primary focus:border-accent focus:outline-none"
            />
            <Button onClick={handleSaveApiKey} disabled={!apiKey.trim()} className="w-full">
              MENTÉS
            </Button>
            <p className="text-2xs text-text-muted text-center">
              API kulcsot a{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Google AI Studio
              </a>
              -ban szerezhetsz.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col pb-20">
      {/* Header */}
      <header className="px-4 pt-5 pb-3 border-b-2 border-text-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BebiAvatar size="md" />
            <div>
              <h1 className="font-display text-lg font-extrabold uppercase tracking-wide">Coach Bebi</h1>
              <p className="text-text-muted text-xs">AI edzéstanácsadó</p>
            </div>
          </div>

          {/* Clear chat button */}
          {messages.length > 1 && (
            <button
              onClick={handleClearChat}
              className="p-2 text-text-muted hover:text-accent transition-colors"
              title="Beszélgetés törlése"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Quick Actions */}
      <div className="px-4 py-3 border-b border-text-muted/10 bg-bg-secondary/50">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          <button
            onClick={handleWeeklyReview}
            disabled={isLoading}
            className="px-4 py-2 bg-accent text-bg-primary text-sm font-display uppercase tracking-wider hover:bg-accent-hover transition-colors whitespace-nowrap disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="square" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Heti áttekintés
          </button>
          <button
            onClick={() => handleQuickAction('Milyen gyakorlatot ajánlasz a mellizmokra?')}
            disabled={isLoading}
            className="px-4 py-2 border border-text-muted/30 text-text-secondary text-sm font-display uppercase tracking-wider hover:border-accent hover:text-accent transition-colors whitespace-nowrap disabled:opacity-50"
          >
            Gyakorlat tippek
          </button>
          <button
            onClick={() => handleQuickAction('Hogyan növeljem a fekvenyomás súlyomat?')}
            disabled={isLoading}
            className="px-4 py-2 border border-text-muted/30 text-text-secondary text-sm font-display uppercase tracking-wider hover:border-accent hover:text-accent transition-colors whitespace-nowrap disabled:opacity-50"
          >
            Progresszió
          </button>
          <button
            onClick={() => handleQuickAction('Adj motivációt az edzéshez!')}
            disabled={isLoading}
            className="px-4 py-2 border border-text-muted/30 text-text-secondary text-sm font-display uppercase tracking-wider hover:border-accent hover:text-accent transition-colors whitespace-nowrap disabled:opacity-50"
          >
            Motiváció
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn('flex gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {message.role === 'coach' && (
                <BebiAvatar size="sm" mood={message.isError ? 'error' : 'default'} />
              )}
              <div
                className={cn(
                  'max-w-[80%] p-4',
                  message.role === 'user'
                    ? 'bg-accent text-bg-primary'
                    : message.isError
                    ? 'bg-danger/10 border border-danger/30'
                    : 'bg-bg-secondary border border-text-muted/20'
                )}
              >
                {message.role === 'coach' && (
                  <div className="flex items-center justify-between mb-2">
                    <p className={cn(
                      "text-2xs font-display uppercase tracking-wider",
                      message.isError ? 'text-danger' : 'text-accent'
                    )}>
                      Coach Bebi
                    </p>
                    <p className="text-2xs text-text-muted">
                      {formatRelativeTime(message.timestamp)}
                    </p>
                  </div>
                )}
                <div
                  className={cn(
                    'text-sm whitespace-pre-wrap leading-relaxed',
                    message.role === 'user' ? 'text-bg-primary' : 'text-text-primary'
                  )}
                >
                  {message.role === 'coach' ? renderMessage(message.content) : message.content}
                </div>

                {/* Retry button for error messages */}
                {message.isError && retryMessage && message.id === messages[messages.length - 1]?.id && (
                  <button
                    onClick={handleRetry}
                    className="mt-3 text-xs text-accent hover:text-accent-hover flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="square" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Újrapróbálás
                  </button>
                )}
              </div>

              {message.role === 'user' && (
                <p className="text-2xs text-text-muted self-end">
                  {formatRelativeTime(message.timestamp)}
                </p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="fixed bottom-36 right-4 w-10 h-10 bg-accent text-bg-primary flex items-center justify-center shadow-harsh z-10"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="square" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="fixed bottom-20 left-0 right-0 px-4 py-3 bg-bg-primary border-t border-text-muted/20">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Kérdezz Coach Bebitől..."
            className="flex-1 p-3 bg-bg-secondary border border-text-muted/30 text-text-primary text-sm focus:border-accent focus:outline-none placeholder:text-text-muted/50"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className={cn(
              "px-4 bg-accent text-bg-primary font-display uppercase text-sm tracking-wider transition-all",
              (!input.trim() || isLoading) ? 'opacity-50' : 'hover:bg-accent-hover active:scale-95'
            )}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="square" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export { CoachPage as default }
