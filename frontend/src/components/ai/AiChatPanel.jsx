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

        // Add user message
        setMessages(prev => [...prev, { role: 'user', content: question }])

        // Add empty assistant message that we will stream into
        setMessages(prev => [...prev, { role: 'assistant', content: '', sources: [] }])
        setIsLoading(true)

        try {
            const onSources = (sources) => {
                setMessages(prev => {
                    const newMsgs = [...prev]
                    newMsgs[newMsgs.length - 1].sources = sources
                    return newMsgs
                })
            }

            const stream = aiService.chatStream(question, onSources)
            let isFirstChunk = true

            // Read the stream chunk-by-chunk using 'for await'
            for await (const chunk of stream) {
                if (isFirstChunk) {
                    setIsLoading(false) // Stop pulsing once we receive the very first chunk
                    isFirstChunk = false
                }
                setMessages(prev => {
                    const newMsgs = [...prev]
                    newMsgs[newMsgs.length - 1].content += chunk
                    return newMsgs
                })
            }
        } catch (err) {
            setMessages(prev => {
                const newMsgs = [...prev]
                // Only show error if nothing streamed successfully
                if (newMsgs[newMsgs.length - 1].content === '') {
                    newMsgs[newMsgs.length - 1].content = 'Sorry, the AI brain is currently overloaded. Please try again in 30 seconds.'
                    newMsgs[newMsgs.length - 1].isError = true
                } else {
                    newMsgs[newMsgs.length - 1].content += '\n\n*(Connection interrupted)*'
                }
                return newMsgs
            })
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

                    {messages.map((msg, i) => {
                        const isLastAssistantMessage = msg.role === 'assistant' && i === messages.length - 1;
                        const isStreamingOrLoading = (isLoading || (msg.content === '' && isLastAssistantMessage));

                        return (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`relative max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed overflow-hidden
                                    ${msg.role === 'user'
                                        ? 'bg-accent text-accent-ink rounded-br-md shadow-lg shadow-accent/20'
                                        : msg.isError
                                            ? 'bg-danger-soft text-ink border border-danger/20 rounded-bl-md'
                                            : 'bg-surface-2 text-ink rounded-bl-md shadow-sm border border-border/50 backdrop-blur-md'
                                    }`}>

                                    {/* Iridescent Glow for actively streaming message */}
                                    {isLastAssistantMessage && isStreamingOrLoading && !msg.isError && (
                                        <div className="absolute inset-0 z-0 bg-[linear-gradient(90deg,transparent,rgba(217,119,6,0.3),rgba(59,130,246,0.3),transparent)] 
                                                        bg-[length:200%_100%] animate-[shimmer_2s_infinite_linear] opacity-40 pointer-events-none" />
                                    )}

                                    {/* Message content */}
                                    <div className="relative z-10 whitespace-pre-wrap font-sans">
                                        {msg.content === '' && isLastAssistantMessage ? (
                                            <span className="flex items-center gap-1.5 h-5">
                                                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                                                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                                                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                                            </span>
                                        ) : (
                                            msg.content
                                        )}
                                    </div>

                                    {/* Source notes */}
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="relative z-10 mt-3 pt-2 border-t border-border/50">
                                            <p className="text-2xs font-mono tracking-widest uppercase text-ink-faint mb-1.5">Sources</p>
                                            <div className="space-y-1">
                                                {msg.sources.map((src, j) => (
                                                    <button
                                                        key={j}
                                                        onClick={() => { navigate(`/notes/${src.noteId}`); onClose() }}
                                                        className="flex items-center gap-2 w-full text-left px-2 py-1.5 
                                                                   text-2xs rounded-lg hover:bg-surface-3 transition-colors
                                                                   text-ink-muted hover:text-ink font-mono"
                                                    >
                                                        <span>📄</span>
                                                        <span className="truncate flex-1">{src.title}</span>
                                                        <span className="text-accent/80 font-semibold">{Math.round(src.similarity * 100)}%</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-border px-4 py-3 bg-surface-1/90 backdrop-blur-md">
                    <div className={`flex items-end gap-2 relative p-1 rounded-xl transition-all ${isLoading ? 'p-[2px]' : ''}`}>
                        {/* Input Iridescent Border when loading */}
                        {isLoading && (
                            <div className="absolute inset-0 rounded-xl bg-[linear-gradient(45deg,var(--accent),#3b82f6,var(--accent))] 
                                            bg-[length:200%_200%] animate-[shimmer_3s_infinite_linear] opacity-50 z-[-1]"
                            />
                        )}

                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask your brain something…"
                            rows={1}
                            className="flex-1 resize-none bg-surface-0 text-ink text-sm rounded-lg px-4 py-2.5 
                                       outline-none placeholder:text-ink-ghost font-sans shadow-inner
                                       transition-all relative z-10"
                            style={{ maxHeight: '120px' }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || isLoading}
                            className="relative z-10 btn-primary p-2.5 flex-shrink-0 disabled:opacity-40 rounded-lg shadow-md"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-[10px] uppercase tracking-wider text-ink-ghost mt-2 px-1 text-center font-mono">
                        Shift+Enter for new line
                    </p>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes shimmer {
                        0% { background-position: 200% 0; }
                        100% { background-position: -200% 0; }
                    }
                `}} />
            </div>
        </>
    )
}
