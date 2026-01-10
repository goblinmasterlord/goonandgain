import { useState, useRef, useEffect } from 'react'
import { hasGeminiApiKey, saveGeminiApiKey, askCoachBebi, getWeeklyReview } from '@/lib/ai'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils/cn'

// Coach Bebi avatar component
const BebiAvatar = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
  }
  return (
    <div className={cn('border-2 border-accent overflow-hidden flex-shrink-0', sizeClasses[size])}>
      <img
        src="/bebi-avatar.png"
        alt="Coach Bebi"
        className="w-full h-full object-cover"
      />
    </div>
  )
}

interface Message {
  id: string
  role: 'user' | 'coach'
  content: string
  timestamp: Date
}

export function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showApiKeyInput, setShowApiKeyInput] = useState(!hasGeminiApiKey())
  const [apiKey, setApiKey] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Add welcome message
    if (messages.length === 0 && hasGeminiApiKey()) {
      setMessages([
        {
          id: 'welcome',
          role: 'coach',
          content:
            'Szia! Coach Bebi vagyok. 💪 Kérdezz bátran az edzéseidről, táplálkozásról, vagy kérj heti áttekintést. Itt vagyok, hogy segítsek!',
          timestamp: new Date(),
        },
      ])
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      saveGeminiApiKey(apiKey.trim())
      setShowApiKeyInput(false)
      setMessages([
        {
          id: 'welcome',
          role: 'coach',
          content:
            'Szia! Coach Bebi vagyok. 💪 Kérdezz bátran az edzéseidről, táplálkozásról, vagy kérj heti áttekintést. Itt vagyok, hogy segítsek!',
          timestamp: new Date(),
        },
      ])
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await askCoachBebi(userMessage.content)
      const coachMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'coach',
        content: response.success ? response.message : response.error || 'Hiba történt',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, coachMessage])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'coach',
          content: 'Bocsi, valami hiba történt. Próbáld újra!',
          timestamp: new Date(),
        },
      ])
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

    try {
      const response = await getWeeklyReview()
      const coachMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'coach',
        content: response.success ? response.message : response.error || 'Hiba történt',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, coachMessage])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'coach',
          content: 'Bocsi, valami hiba történt. Próbáld újra!',
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  if (showApiKeyInput) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col">
        <header className="px-5 pt-6 pb-4 border-b-2 border-text-muted/20">
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-wide">Coach Bebi</h1>
          <p className="text-text-muted text-sm mt-1">AI edzéstanácsadó</p>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="mb-6">
            <BebiAvatar size="lg" />
          </div>
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
      <header className="px-5 pt-6 pb-4 border-b-2 border-text-muted/20">
        <div className="flex items-center gap-4">
          <BebiAvatar size="md" />
          <div>
            <h1 className="font-display text-xl font-extrabold uppercase tracking-wide">Coach Bebi</h1>
            <p className="text-text-muted text-sm">AI edzéstanácsadó</p>
          </div>
        </div>
      </header>

      {/* Quick Actions */}
      <div className="px-5 py-3 border-b border-text-muted/10 bg-bg-secondary/50">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={handleWeeklyReview}
            disabled={isLoading}
            className="px-4 py-2 border border-accent text-accent text-sm font-display uppercase tracking-wider hover:bg-accent hover:text-bg-primary transition-colors whitespace-nowrap disabled:opacity-50"
          >
            Heti áttekintés
          </button>
          <button
            onClick={() => setInput('Milyen gyakorlatot ajánlasz a mellizmokra?')}
            className="px-4 py-2 border border-text-muted/30 text-text-muted text-sm font-display uppercase tracking-wider hover:border-accent hover:text-accent transition-colors whitespace-nowrap"
          >
            Gyakorlat tippek
          </button>
          <button
            onClick={() => setInput('Hogyan növeljem a fekvenyomás súlyomat?')}
            className="px-4 py-2 border border-text-muted/30 text-text-muted text-sm font-display uppercase tracking-wider hover:border-accent hover:text-accent transition-colors whitespace-nowrap"
          >
            Progresszió
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn('flex gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            {message.role === 'coach' && <BebiAvatar size="sm" />}
            <div
              className={cn(
                'max-w-[75%] p-4',
                message.role === 'user'
                  ? 'bg-accent text-bg-primary'
                  : 'bg-bg-secondary border border-text-muted/20'
              )}
            >
              {message.role === 'coach' && (
                <p className="text-2xs font-display uppercase tracking-wider text-accent mb-2">
                  Coach Bebi
                </p>
              )}
              <p
                className={cn(
                  'text-sm whitespace-pre-wrap',
                  message.role === 'user' ? 'text-bg-primary' : 'text-text-primary'
                )}
              >
                {message.content}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <BebiAvatar size="sm" />
            <div className="bg-bg-secondary border border-text-muted/20 p-4">
              <p className="text-2xs font-display uppercase tracking-wider text-accent mb-2">
                Coach Bebi
              </p>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-20 left-0 right-0 px-5 py-3 bg-bg-primary border-t border-text-muted/20">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Kérdezz Coach Bebitől..."
            className="flex-1 p-3 bg-bg-secondary border border-text-muted/30 text-text-primary text-sm focus:border-accent focus:outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 bg-accent text-bg-primary font-display uppercase text-sm tracking-wider disabled:opacity-50 hover:bg-accent/90 transition-colors"
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
