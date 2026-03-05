import { useState, useEffect, useRef, useCallback } from 'react'
import TiptapEditor from '../editor/TiptapEditor'
import '../editor/tiptap.css'
import { tagService } from '../../services/tagService'

export default function NoteEditor({ initialData, onSave, onCancel, isSaving }) {
    const [title, setTitle] = useState(initialData?.title || '')
    const [content, setContent] = useState(initialData?.content || '')
    const [tagInput, setTagInput] = useState('')
    const [tags, setTags] = useState(initialData?.tags || [])
    const [allTags, setAllTags] = useState([])
    const [showSuggestions, setShowSuggestions] = useState(false)
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

    return (
        <form onSubmit={handleSubmit} className="space-y-5 animate-in">
            {/* Title */}
            <input
                id="note-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled"
                className="w-full text-2xl font-serif text-ink bg-transparent outline-none placeholder:text-ink-ghost border-none"
                required
            />

            {/* Tags */}
            <div className="relative">
                <div className="flex items-center flex-wrap gap-1.5 mb-1">
                    {tags.map((t) => (
                        <span key={t} className="tag group/tag">
                            {t}
                            <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))}
                                className="ml-1 opacity-0 group-hover/tag:opacity-100 transition-opacity text-ink-faint hover:text-ink">
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
                        placeholder={tags.length ? '' : 'Add tags…'}
                        className="text-sm bg-transparent outline-none placeholder:text-ink-ghost text-ink min-w-[80px] flex-1 py-1"
                    />
                </div>

                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-surface-1 border border-border rounded-xl shadow-lg overflow-hidden z-20 animate-in-scale">
                        {suggestions.map((s) => (
                            <button key={s.id} type="button"
                                onClick={() => addTag(s.name)}
                                className="w-full text-left px-3 py-2 text-sm text-ink-muted hover:bg-surface-2 hover:text-ink transition-colors">
                                {s.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Tiptap Editor */}
            <TiptapEditor
                content={content}
                onChange={setContent}
                placeholder="Start writing… (use Markdown shortcuts: # heading, **bold**, *italic*)"
            />

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
                <button type="button" id="editor-cancel" onClick={onCancel} className="btn-ghost text-sm">
                    Cancel
                </button>
                <button type="submit" id="editor-save" disabled={isSaving || !title.trim()} className="btn-primary text-sm">
                    {isSaving ? 'Saving…' : 'Save note'}
                </button>
            </div>
        </form>
    )
}
