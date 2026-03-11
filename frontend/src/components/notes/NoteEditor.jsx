import { useState, useEffect, useRef, useCallback } from 'react'
import TiptapEditor from '../editor/TiptapEditor'
import '../editor/tiptap.css'
import { tagService } from '../../services/tagService'
import { Maximize2, Minimize2, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function NoteEditor({ initialData, onSave, onCancel, isSaving }) {
    const [title, setTitle] = useState(initialData?.title || '')
    const [content, setContent] = useState(initialData?.content || '')
    const [tagInput, setTagInput] = useState('')
    const [tags, setTags] = useState(initialData?.tags || [])
    const [allTags, setAllTags] = useState([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [isZenMode, setIsZenMode] = useState(false)
    const tagRef = useRef(null)

    useEffect(() => {
        tagService.getAll().then((r) => setAllTags(r.data.data || [])).catch(() => { })
    }, [])

    const suggestions = tagInput.trim()
        ? allTags.filter((t) =>
            t.name.toLowerCase().includes(tagInput.toLowerCase()) &&
            !tags.includes(t.name)
        ).slice(0, 5)
        : []

    const addTag = useCallback((name) => {
        const clean = name.trim().toLowerCase()
        if (clean && !tags.includes(clean)) {
            setTags([...tags, clean])
        }
        setTagInput('')
        setShowSuggestions(false)
    }, [tags])

    const handleTagKey = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addTag(tagInput)
        }
        if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
            setTags(tags.slice(0, -1))
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        onSave({ title, content, tags })
    }

    // Toggle body overflow when in zen mode so we don't double scroll
    useEffect(() => {
        if (isZenMode) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'auto'
        }
        return () => { document.body.style.overflow = 'auto' }
    }, [isZenMode])

    const editorContent = (
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <div className="flex-1 max-w-4xl mx-auto w-full pt-8 pb-32">
                {/* Header Actions */}
                <div className="flex items-center justify-between mb-8 opacity-60 hover:opacity-100 transition-opacity">
                    {!isZenMode && (
                        <button type="button" onClick={onCancel} className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors">
                            <ArrowLeft size={16} /> Back
                        </button>
                    )}
                    {isZenMode && <div />} {/* Spacer */}

                    <button
                        type="button"
                        onClick={() => setIsZenMode(!isZenMode)}
                        className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors px-3 py-1.5 rounded-full hover:bg-surface-2"
                        title="Toggle Zen Mode"
                    >
                        {isZenMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        {isZenMode ? 'Exit Zen' : 'Zen focus'}
                    </button>
                </div>

                {/* Title */}
                <input
                    id="note-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Untitled thought..."
                    className="w-full text-4xl lg:text-5xl font-serif text-ink bg-transparent outline-none placeholder:text-ink-ghost border-none mb-8 tracking-tight"
                    required
                />

                {/* Tags (Fade out slightly in Zen mode unless hovered) */}
                <div className={`relative mb-8 transition-opacity duration-300 ${isZenMode ? 'opacity-30 hover:opacity-100' : 'opacity-100'}`}>
                    <div className="flex items-center flex-wrap gap-2">
                        {tags.map((t) => (
                            <span key={t} className="px-3 py-1 text-[11px] font-mono font-medium tracking-wider uppercase rounded-full bg-surface-2 text-ink-muted group/tag flex items-center gap-1 border border-border">
                                {t}
                                <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))}
                                    className="opacity-0 group-hover/tag:opacity-100 transition-opacity text-ink-faint hover:text-danger-soft">
                                    ×
                                </button>
                            </span>
                        ))}
                        <input
                            ref={tagRef}
                            id="tag-input"
                            type="text"
                            value={tagInput}
                            onChange={(e) => { setTagInput(e.target.value); setShowSuggestions(true) }}
                            onKeyDown={handleTagKey}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            placeholder={tags.length ? '' : '+ Add tags'}
                            className="text-sm bg-transparent outline-none placeholder:text-ink-ghost text-ink min-w-[100px] flex-1 py-1 font-mono"
                        />
                    </div>

                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-surface-1/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden z-20">
                            {suggestions.map((s) => (
                                <button key={s.id} type="button"
                                    onClick={() => addTag(s.name)}
                                    className="w-full text-left px-4 py-3 text-sm text-ink-muted hover:bg-accent hover:text-accent-ink transition-colors font-mono">
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tiptap Editor */}
                <div className="prose-container flex-1">
                    <TiptapEditor
                        content={content}
                        onChange={setContent}
                        placeholder="Start typing (type '/' for commands, use Markdown shortcuts like # heading)..."
                    />
                </div>
            </div>

            {/* Sticky Actions Bar */}
            <div className={`fixed bottom-0 left-0 right-0 p-6 flex justify-center pointer-events-none z-40 transition-opacity duration-500 ${isZenMode && !title ? 'opacity-0' : 'opacity-100'}`}>
                <div className="bg-surface-1/80 backdrop-blur-xl border border-border/50 shadow-2xl rounded-full px-4 py-3 flex items-center gap-4 pointer-events-auto">
                    {!isZenMode && (
                        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-full text-sm font-medium text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors">
                            Discard
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isSaving || !title.trim()}
                        className="px-8 py-2 rounded-full bg-accent text-accent-ink text-sm font-medium shadow-lg hover:shadow-xl hover:bg-accent-hover active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                    >
                        {isSaving ? 'Synching...' : 'Save into brain'}
                    </button>
                </div>
            </div>
        </form>
    )

    return (
        <AnimatePresence>
            {isZenMode ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="fixed inset-0 z-50 bg-surface-0 overflow-y-auto"
                >
                    <div className="bg-aurora opacity-50" />
                    {editorContent}
                </motion.div>
            ) : (
                <div className="animate-in h-full">
                    {editorContent}
                </div>
            )}
        </AnimatePresence>
    )
}
