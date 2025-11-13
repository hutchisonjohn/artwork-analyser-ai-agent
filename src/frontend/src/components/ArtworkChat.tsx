import { useState, useRef, useEffect, useMemo } from 'react'
import { Send, Bot, User } from 'lucide-react'
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
}

export default function ArtworkChat({ quality, colors, workerUrl, aiName = 'McCarthy AI Artwork Assistant', greetingMessage = 'Hello! I\'m McCarthy, your AI artwork assistant. I\'m here to help you understand your artwork\'s print quality, DPI, colors, and file specifications. Feel free to ask me anything about your artwork!' }: ArtworkChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasShownGreeting, setHasShownGreeting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const apiBase = useMemo(() => {
    const fallback = import.meta.env.VITE_WORKER_URL?.trim()
    const base = workerUrl?.trim() || fallback || '/api'
    return base.replace(/\/$/, '')
  }, [workerUrl])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Clear messages when a new artwork is uploaded
  useEffect(() => {
    setMessages([])
    setHasShownGreeting(false)
  }, [quality.pixels?.w, quality.pixels?.h, quality.fileSizeMB])

  // Show greeting message after 1-2 seconds delay when chat opens
  useEffect(() => {
    if (!hasShownGreeting && greetingMessage) {
      const timer = setTimeout(() => {
        const welcomeMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: greetingMessage,
          timestamp: new Date(),
        }
        setMessages([welcomeMessage])
        setHasShownGreeting(true)
      }, 1500) // 1.5 second delay

      return () => clearTimeout(timer)
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

    try {
      const response = await fetch(`${apiBase}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage.content,
          quality,
          colors,
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
      textareaRef.current?.focus()
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
        <Bot className="h-5 w-5 text-indigo-600" />
        <h3 className="font-semibold text-slate-900">{aiName}</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Bot className="mx-auto h-12 w-12 text-slate-300" />
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
                  <Bot className="h-4 w-4 text-indigo-600" />
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
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100">
              <Bot className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-3">
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="h-2 w-2 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="h-2 w-2 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-slate-200 p-4">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your artwork... (Press Enter to send)"
            disabled={isLoading}
            className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-50"
            rows={1}
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

