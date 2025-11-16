import { useState, useRef, useEffect, useMemo } from 'react'
import { Send, Sparkles, User } from 'lucide-react'
import type { QualityReport, ColorReport } from '@shared/types'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ArtworkChatProps {
  quality: QualityReport
  colors?: ColorReport
  workerUrl?: string
  aiName?: string
  greetingMessage?: string
  isOpen?: boolean // Track if chat is open to reset on close
}

export default function ArtworkChat({ quality, colors, workerUrl, aiName = 'McCarthy AI Artwork Assistant', greetingMessage = "Hello! I'm McCarthy, your AI artwork assistant.\n\nI'm here to help you understand your artwork's print quality, DPI, colors, and file specifications.\n\nFeel free to ask me anything about your artwork!", isOpen = true }: ArtworkChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isShowingGreeting, setIsShowingGreeting] = useState(false)
  const [hasShownGreeting, setHasShownGreeting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const apiBase = useMemo(() => {
    const fallback = import.meta.env.VITE_WORKER_URL?.trim()
    const base = workerUrl?.trim() || fallback || '/api'
    return base.replace(/\/$/, '')
  }, [workerUrl])

  const scrollToBottom = () => {
    // Use scrollTop instead of scrollIntoView to avoid stealing focus
    // Use requestAnimationFrame to ensure DOM has updated and avoid interrupting user input
    requestAnimationFrame(() => {
      if (messagesEndRef.current && messagesEndRef.current.parentElement) {
        const container = messagesEndRef.current.parentElement
        // Only scroll if user isn't actively typing (check if textarea is focused)
        if (document.activeElement !== textareaRef.current) {
          container.scrollTop = container.scrollHeight
        }
      }
    })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Clear messages when a new artwork is uploaded OR when chat is closed
  useEffect(() => {
    if (!isOpen) {
      setMessages([])
      setHasShownGreeting(false)
    }
  }, [isOpen])

  // Clear messages when a new artwork is uploaded
  useEffect(() => {
    setMessages([])
    setHasShownGreeting(false)
  }, [quality.pixels?.w, quality.pixels?.h, quality.fileSizeMB])

  // Show greeting messages in 3 parts with typing delays
  useEffect(() => {
    if (!hasShownGreeting && greetingMessage) {
      // Parse greeting into 3 parts (split by line breaks)
      const parts = greetingMessage.split('\n\n').filter(p => p.trim())
      const greetingParts = parts.length >= 3 ? parts : [
        "Hi! I'm McCarthy, your artwork assistant.",
        "I can see your artwork is uploaded and analyzed.",
        "What would you like to know about it?"
      ]

      // Show typing indicator first (but don't disable input)
      setIsShowingGreeting(true)

      const timers: number[] = []

      // First message after 1-2 seconds
      timers.push(setTimeout(() => {
        setIsShowingGreeting(false)
        setMessages([{
          id: crypto.randomUUID(),
          role: 'assistant',
          content: greetingParts[0],
          timestamp: new Date(),
        }])
        // Show typing for next message
        setIsShowingGreeting(true)
      }, 1500))

      // Second message after 3-4 more seconds
      timers.push(setTimeout(() => {
        setIsShowingGreeting(false)
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: greetingParts[1],
          timestamp: new Date(),
        }])
        // Show typing for next message
        setIsShowingGreeting(true)
      }, 5000))

      // Third message after 3-4 more seconds
      timers.push(setTimeout(() => {
        setIsShowingGreeting(false)
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: greetingParts[2] || greetingParts[1],
          timestamp: new Date(),
        }])
        setHasShownGreeting(true)
      }, 8500))

      return () => {
        timers.forEach(timer => clearTimeout(timer))
      }
    }
  }, [hasShownGreeting, greetingMessage])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!input.trim() || isLoading) {
      return
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Keep focus in the textarea to prevent page scrolling
    const textarea = textareaRef.current
    if (textarea) {
      textarea.focus()
      // Prevent any scroll events during submission
      textarea.scrollIntoView({ behavior: 'auto', block: 'nearest' })
    }

    try {
      // Get the last 10 messages (5 exchanges) for conversation history
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const response = await fetch(`${apiBase}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage.content,
          quality,
          colors,
          history: conversationHistory, // Send conversation history
        }),
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = (await response.json()) as { answer: string }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your question. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      // Re-focus and ensure textarea stays in view
      if (textarea) {
        setTimeout(() => {
          textarea.focus()
          textarea.scrollIntoView({ behavior: 'auto', block: 'nearest' })
        }, 0)
      }
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit(event)
    }
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <Sparkles className="h-5 w-5 text-indigo-600" />
        <h3 className="font-semibold text-slate-900">{aiName}</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Sparkles className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">
                Ask me anything about your artwork's print quality, DPI, colors, or file specifications.
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Example: "Is this file ready for DTF printing?"
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-900'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                <p
                  className={`mt-1 text-xs ${
                    message.role === 'user' ? 'text-indigo-200' : 'text-slate-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {message.role === 'user' && (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-200">
                  <User className="h-4 w-4 text-slate-600" />
                </div>
              )}
            </div>
          ))
        )}
        {(isLoading || isShowingGreeting) && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100">
              <Sparkles className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-3">
              <div className="flex gap-1 items-end">
                <div className="h-1 w-1 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.8s' }}></div>
                <div className="h-1 w-1 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '200ms', animationDuration: '0.8s' }}></div>
                <div className="h-1 w-1 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '400ms', animationDuration: '0.8s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-slate-200 p-4">
        <div className="flex gap-2 items-center">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={(e) => {
              // Prevent page scroll when focusing
              e.target.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' })
            }}
            placeholder=""
            disabled={isLoading}
            className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-50"
            rows={1}
            style={{ height: '40px', minHeight: '40px', maxHeight: '40px' }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}

