import { useState, useRef, useEffect, useCallback } from 'react'
import { noteService } from '../../services/noteService'
import { useNotes } from '../../context/NotesContext'
import toast from 'react-hot-toast'

/**
 * Quick Capture Modal — opens with Ctrl+Shift+K
 * Designed for speed: dump a thought in < 3 seconds.
 * No title required, no folder decisions, just capture.
 */
export default function QuickCapture({ isOpen, onClose }) {
    const [text, setText] = useState('')
    const [tagInput, setTagInput] = useState('')
    const [tags, setTags] = useState([])
    const [saving, setSaving] = useState(false)
    const textareaRef = useRef(null)
    const { dispatch } = useNotes()

    // Auto-focus textarea when opened
    useEffect(() => {
        if (isOpen && textareaRef.current) {
            setTimeout(() => textareaRef.current?.focus(), 50)
        }
    }, [isOpen])

    // Reset form when closed
    useEffect(() => {
        if (!isOpen) {
            setText('')
            setTagInput('')
            setTags([])
        }
    }, [isOpen])

    // Close on Escape
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isOpen) onClose()
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [isOpen, onClose])

    const addTag = (name) => {
        const clean = name.trim().toLowerCase()
        if (clean && !tags.includes(clean)) {
            setTags(prev => [...prev, clean])
        }
        setTagInput('')
    }

    const handleTagKey = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addTag(tagInput)
        }
        if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
            setTags(tags.slice(0, -1))
        }
    }

    const handleSave = useCallback(async () => {
        if (!text.trim()) return
        setSaving(true)
        try {
            // Auto-generate title from first line or first 50 chars
            const firstLine = text.trim().split('\n')[0]
            const title = firstLine.length > 50 ? firstLine.substring(0, 50) + '…' : firstLine

            // Wrap plain text in paragraph tags for the editor
            const htmlContent = text.split('\n')
                .map(line => `<p>${line || '<br>'}</p>`)
                .join('')

            const res = await noteService.create({
                title,
                content: htmlContent,
                tags: tags.length > 0 ? tags : ['quick-note'],
            })
            dispatch({ type: 'ADD_NOTE', payload: res.data.data })
            toast.success('Captured! ⚡')
            onClose()
        } catch (err) {
            toast.error('Failed to capture note')
        } finally {
            setSaving(false)
        }
    }, [text, tags, dispatch, onClose])

    // Ctrl+Enter to save
    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault()
            handleSave()
        }
    }

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50 animate-in-up">
                <div className="bg-surface-1 border border-border rounded-2xl shadow-2xl overflow-hidden mx-4">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">⚡</span>
                            <h3 className="text-sm font-medium text-ink">Quick Capture</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-2xs text-ink-faint bg-surface-2 rounded-md border border-border">
                                Ctrl+Enter
                            </kbd>
                            <span className="text-2xs text-ink-ghost">to save</span>
                        </div>
                    </div>

                    {/* Textarea */}
                    <div className="p-4">
                        <textarea
                            ref={textareaRef}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="What's on your mind? Just dump it here…"
                            className="w-full min-h-[140px] max-h-[300px] bg-transparent text-ink text-sm 
                                       leading-relaxed resize-none outline-none placeholder:text-ink-ghost"
                            autoFocus
                        />
                    </div>

                    {/* Tags */}
                    <div className="px-4 pb-3">
                        <div className="flex items-center flex-wrap gap-1.5">
                            {tags.map((t) => (
                                <span key={t} className="tag group/tag text-xs">
                                    {t}
                                    <button type="button" onClick={() => setTags(tags.filter(x => x !== t))}
                                        className="ml-0.5 opacity-0 group-hover/tag:opacity-100 transition-opacity">
                                        ×
                                    </button>
                                </span>
                            ))}
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagKey}
                                placeholder={tags.length ? '' : '#tag'}
                                className="text-xs bg-transparent outline-none placeholder:text-ink-ghost text-ink-muted min-w-[60px] flex-1 py-0.5"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-0/50">
                        <p className="text-2xs text-ink-ghost">
                            AI will auto-organize this later ✨
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn-ghost text-xs px-3 py-1.5"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={!text.trim() || saving}
                                className="btn-primary text-xs px-4 py-1.5 disabled:opacity-40"
                            >
                                {saving ? (
                                    <span className="flex items-center gap-1.5">
                                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Saving…
                                    </span>
                                ) : 'Capture ⚡'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
