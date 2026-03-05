import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { aiService } from '../../services/aiService'

/**
 * AI Chat Panel — "Talk to your brain" 🧠
 * Floating slide-over panel for chatting with your notes.
 */
export default function AiChatPanel({ isOpen, onClose }) {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const chatEndRef = useRef(null)
    const inputRef = useRef(null)
    const navigate = useNavigate()

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 100)
    }, [isOpen])

    // Close on Escape
    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape' && isOpen) onClose() }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [isOpen, onClose])

    const sendMessage = useCallback(async () => {
        if (!input.trim() || isLoading) return

        const question = input.trim()
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: question }])
        setIsLoading(true)

        try {
            const res = await aiService.chat(question)
            const data = res.data.data
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.answer,
                sources: data.sourceNotes || [],
            }])
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I couldn\'t process your question. Make sure your OPENAI_API_KEY is configured and your notes are embedded.',
                isError: true,
            }])
        } finally {
            setIsLoading(false)
        }
    }, [input, isLoading])

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const suggestedQuestions = [
        'What are my most important ideas?',
        'Summarize my recent notes',
        'What connections exist between my notes?',
        'What topics have I been exploring?',
    ]

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />

            {/* Panel */}
            <div className="fixed top-0 right-0 h-full w-full max-w-md bg-surface-1 border-l border-border shadow-2xl z-50 flex flex-col animate-slide-in">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div className="flex items-center gap-2.5">
                        <span className="text-xl">🧠</span>
                        <div>
                            <h2 className="text-sm font-semibold text-ink">Ask your brain</h2>
                            <p className="text-2xs text-ink-faint">AI-powered answers from your notes</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg text-ink-faint hover:text-ink">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-4xl mb-3">🧠</p>
                            <h3 className="text-sm font-medium text-ink mb-1">Chat with your notes</h3>
                            <p className="text-2xs text-ink-faint mb-6">
                                Ask anything — I'll find answers in your knowledge base
                            </p>
                            <div className="space-y-2">
                                {suggestedQuestions.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setInput(q); inputRef.current?.focus() }}
                                        className="block w-full text-left px-3 py-2 text-xs text-ink-muted 
                                                   bg-surface-2 rounded-xl hover:bg-surface-3 hover:text-ink 
                                                   transition-colors"
                                    >
                                        💬 {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-accent text-accent-ink rounded-br-md'
                                    : msg.isError
                                        ? 'bg-danger-soft text-ink border border-danger/20 rounded-bl-md'
                                        : 'bg-surface-2 text-ink rounded-bl-md'
                                }`}>
                                {/* Message content */}
                                <div className="whitespace-pre-wrap">{msg.content}</div>

                                {/* Source notes */}
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-3 pt-2 border-t border-border">
                                        <p className="text-2xs text-ink-faint mb-1.5">Sources:</p>
                                        <div className="space-y-1">
                                            {msg.sources.map((src, j) => (
                                                <button
                                                    key={j}
                                                    onClick={() => { navigate(`/notes/${src.noteId}`); onClose() }}
                                                    className="flex items-center gap-2 w-full text-left px-2 py-1 
                                                               text-2xs rounded-lg hover:bg-surface-3 transition-colors
                                                               text-ink-muted hover:text-ink"
                                                >
                                                    <span>📄</span>
                                                    <span className="truncate flex-1">{src.title}</span>
                                                    <span className="text-ink-ghost">{Math.round(src.similarity * 100)}%</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Loading indicator */}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-surface-2 rounded-2xl rounded-bl-md px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                                    <span className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                                    <span className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-border px-4 py-3">
                    <div className="flex items-end gap-2">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask your brain something…"
                            rows={1}
                            className="flex-1 resize-none bg-surface-2 text-ink text-sm rounded-xl px-4 py-2.5 
                                       outline-none placeholder:text-ink-ghost border border-transparent 
                                       focus:border-accent focus:bg-surface-1 transition-all"
                            style={{ maxHeight: '120px' }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || isLoading}
                            className="btn-primary p-2.5 rounded-xl disabled:opacity-40"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-2xs text-ink-ghost mt-1.5 px-1">
                        Enter to send · Shift+Enter for new line · Answers sourced from your notes
                    </p>
                </div>
            </div>
        </>
    )
}
