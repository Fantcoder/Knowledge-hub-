import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotes } from '../../context/NotesContext'
import { tagService } from '../../services/tagService'
import { noteService } from '../../services/noteService'
import NoteCard from '../notes/NoteCard'
import TiptapEditor from '../editor/TiptapEditor'
import FileList from '../files/FileList'
import {
    Plus, Search, Pin, Archive, Trash2, Share2, Maximize2, Minimize2,
    Sun, Moon, Folder, Tag as TagIcon, Network, Link as LinkIcon,
    FileText, ArrowLeft, PanelLeftClose, PanelLeft
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AppleWorkspace({ initialNoteId = null }) {
    const { user, logout } = useAuth()
    const {
        notes, fetchNotes, activeFilter, activeTag, searchQuery,
        hasMore, isLoading, loadMore, totalElements, dispatch
    } = useNotes()
    const navigate = useNavigate()

    // Layout state
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [selectedNoteId, setSelectedNoteId] = useState(initialNoteId ? parseInt(initialNoteId) : null)
    const [isCreatingNew, setIsCreatingNew] = useState(false)
    const [isZenMode, setIsZenMode] = useState(false)
    const [mobileView, setMobileView] = useState('list') // 'list' or 'detail'

    // Editor live state for selected note
    const [editorTitle, setEditorTitle] = useState('')
    const [editorContent, setEditorContent] = useState('')
    const [editorTags, setEditorTags] = useState([])
    const [editorFiles, setEditorFiles] = useState([])
    const [tagInput, setTagInput] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [saveStatus, setSaveStatus] = useState('saved') // 'saved', 'saving', 'unsaved'

    // Tags & theme
    const [tags, setTags] = useState([])
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
    const dark = theme === 'dark'

    // Auto-save debounce timer
    const saveTimerRef = useRef(null)

    // Load tags
    useEffect(() => {
        tagService.getAll().then((r) => setTags(r.data.data || [])).catch(() => {})
    }, [])

    // Initial fetch of notes
    useEffect(() => {
        fetchNotes(activeFilter, activeTag)
    }, [activeFilter, activeTag])

    // Find the currently selected note object
    const selectedNote = useMemo(() => {
        if (!selectedNoteId) return null
        return notes.find((n) => n.id === selectedNoteId) || null
    }, [notes, selectedNoteId])

    // When note selection changes, populate editor states
    useEffect(() => {
        if (selectedNote) {
            setEditorTitle(selectedNote.title || '')
            setEditorContent(selectedNote.content || '')
            setEditorTags(selectedNote.tags || [])
            setEditorFiles(selectedNote.files || [])
            setIsCreatingNew(false)
            setSaveStatus('saved')
        } else if (!isCreatingNew && notes.length > 0 && !selectedNoteId && window.innerWidth >= 1024) {
            // Auto-select first note on desktop
            setSelectedNoteId(notes[0].id)
        }
    }, [selectedNote, notes, isCreatingNew])

    // Debounced Auto-Save to Backend
    const triggerAutoSave = useCallback((updatedTitle, updatedContent, updatedTags) => {
        if (isCreatingNew) return // Wait for manual first save on brand new notes
        if (!selectedNoteId) return

        setSaveStatus('saving')
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

        saveTimerRef.current = setTimeout(async () => {
            try {
                const res = await noteService.update(selectedNoteId, {
                    title: updatedTitle || 'Untitled note',
                    content: updatedContent,
                    tags: updatedTags,
                })
                dispatch({ type: 'UPDATE_NOTE', payload: res.data.data })
                setSaveStatus('saved')
            } catch {
                setSaveStatus('unsaved')
            }
        }, 1200)
    }, [selectedNoteId, isCreatingNew, dispatch])

    const handleTitleChange = (val) => {
        setEditorTitle(val)
        triggerAutoSave(val, editorContent, editorTags)
    }

    const handleContentChange = (val) => {
        setEditorContent(val)
        triggerAutoSave(editorTitle, val, editorTags)
    }

    const handleAddTag = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            const clean = tagInput.trim().toLowerCase()
            if (clean && !editorTags.includes(clean)) {
                const nextTags = [...editorTags, clean]
                setEditorTags(nextTags)
                setTagInput('')
                triggerAutoSave(editorTitle, editorContent, nextTags)
            }
        }
    }

    const handleRemoveTag = (tagToRemove) => {
        const nextTags = editorTags.filter((t) => t !== tagToRemove)
        setEditorTags(nextTags)
        triggerAutoSave(editorTitle, editorContent, nextTags)
    }

    // Start a brand new note
    const handleStartNewNote = () => {
        setIsCreatingNew(true)
        setSelectedNoteId(null)
        setEditorTitle('')
        setEditorContent('')
        setEditorTags(activeTag ? [activeTag] : [])
        setEditorFiles([])
        setSaveStatus('unsaved')
        setMobileView('detail')
    }

    // Save a new note
    const handleCreateSubmit = async () => {
        if (!editorTitle.trim()) {
            toast.error('Please give your note a title')
            return
        }
        setIsSaving(true)
        try {
            const res = await noteService.create({
                title: editorTitle.trim(),
                content: editorContent,
                tags: editorTags,
            })
            const newNote = res.data.data
            dispatch({ type: 'ADD_NOTE', payload: newNote })
            setIsCreatingNew(false)
            setSelectedNoteId(newNote.id)
            setSaveStatus('saved')
            toast.success('Note created!')
        } catch {
            toast.error('Failed to create note')
        } finally {
            setIsSaving(false)
        }
    }

    // Quick Action Handlers
    const handleTogglePin = async (id = null) => {
        const targetId = id || selectedNoteId
        if (!targetId) return
        try {
            const res = await noteService.pin(targetId)
            dispatch({ type: 'UPDATE_NOTE', payload: res.data.data })
            toast.success(res.data.data.isPinned ? 'Pinned to top' : 'Unpinned')
        } catch {
            toast.error('Failed to pin note')
        }
    }

    const handleToggleArchive = async (id = null) => {
        const targetId = id || selectedNoteId
        if (!targetId) return
        try {
            const res = await noteService.archive(targetId)
            dispatch({ type: 'UPDATE_NOTE', payload: res.data.data })
            toast.success(res.data.data.isArchived ? 'Note archived' : 'Note unarchived')
        } catch {
            toast.error('Failed to archive note')
        }
    }

    const handleToggleShare = async (id = null) => {
        const targetId = id || selectedNoteId
        if (!targetId) return
        try {
            const res = await noteService.toggleShare(targetId)
            dispatch({ type: 'UPDATE_NOTE', payload: res.data.data })
            if (res.data.data.isShared) {
                const url = `${window.location.origin}/shared/${res.data.data.shareSlug}`
                navigator.clipboard.writeText(url)
                toast.success('Public link copied to clipboard!')
            } else {
                toast.success('Sharing disabled')
            }
        } catch {
            toast.error('Failed to update share status')
        }
    }

    const handleDelete = async (id = null) => {
        const targetId = id || selectedNoteId
        if (!targetId) return
        try {
            await noteService.delete(targetId)
            dispatch({ type: 'REMOVE_NOTE', payload: targetId })
            if (selectedNoteId === targetId) {
                setSelectedNoteId(null)
                setMobileView('list')
            }
            toast.success('Moved to trash')
        } catch {
            toast.error('Failed to delete note')
        }
    }

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark'
        setTheme(next)
        localStorage.setItem('theme', next)
        document.documentElement.classList.toggle('dark', next === 'dark')
    }

    const handleFilterSelect = (filter) => {
        dispatch({ type: 'SET_FILTER', payload: filter })
    }

    const handleTagSelect = (tagName) => {
        dispatch({ type: 'SET_TAG_FILTER', payload: tagName })
    }

    return (
        <div className="flex h-screen w-screen overflow-hidden select-none bg-surface-0">
            
            {/* ══════════════════════════════════════════════════════════════════════
                COLUMN 1: APPLE SIDEBAR (Folders, Navigation, Tags, Settings)
               ══════════════════════════════════════════════════════════════════════ */}
            {sidebarOpen && (
                <aside className="w-56 shrink-0 h-full flex flex-col border-r border-border bg-sidebar transition-all duration-200 z-20">
                    {/* Top Branding / Window Header */}
                    <div className="h-12 px-4 flex items-center justify-between border-b border-border/50">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-md bg-accent flex items-center justify-center font-bold text-xs text-accent-ink">
                                K
                            </div>
                            <span className="font-semibold text-sm tracking-tight text-ink">Knowledge</span>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-1 rounded-md text-ink-ghost hover:text-ink hover:bg-surface-2 transition-colors"
                            title="Hide Sidebar"
                        >
                            <PanelLeftClose size={15} />
                        </button>
                    </div>

                    {/* Navigation List */}
                    <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
                        {/* Folders */}
                        <div>
                            <p className="label px-2 mb-1 text-[10px] text-ink-ghost">Folders</p>
                            <div className="space-y-0.5">
                                <button
                                    onClick={() => handleFilterSelect('active')}
                                    className={`sidebar-link w-full text-left ${activeFilter === 'active' && !activeTag ? 'active' : ''}`}
                                >
                                    <Folder size={14} />
                                    <span className="flex-1 truncate">All Notes</span>
                                    <span className="text-2xs font-mono text-ink-ghost">{totalElements}</span>
                                </button>

                                <button
                                    onClick={() => handleFilterSelect('pinned')}
                                    className={`sidebar-link w-full text-left ${activeFilter === 'pinned' ? 'active' : ''}`}
                                >
                                    <Pin size={14} />
                                    <span className="flex-1 truncate">Pinned</span>
                                </button>

                                <button
                                    onClick={() => handleFilterSelect('archived')}
                                    className={`sidebar-link w-full text-left ${activeFilter === 'archived' ? 'active' : ''}`}
                                >
                                    <Archive size={14} />
                                    <span className="flex-1 truncate">Archive</span>
                                </button>
                            </div>
                        </div>

                        {/* Library & Tools */}
                        <div>
                            <p className="label px-2 mb-1 text-[10px] text-ink-ghost">Library</p>
                            <div className="space-y-0.5">
                                <button onClick={() => navigate('/graph')} className="sidebar-link w-full text-left">
                                    <Network size={14} />
                                    <span className="flex-1">Graph View</span>
                                </button>
                                <button onClick={() => navigate('/links')} className="sidebar-link w-full text-left">
                                    <LinkIcon size={14} />
                                    <span className="flex-1">Saved Links</span>
                                </button>
                                <button onClick={() => navigate('/files')} className="sidebar-link w-full text-left">
                                    <FileText size={14} />
                                    <span className="flex-1">Attachments</span>
                                </button>
                                <button onClick={() => navigate('/trash')} className="sidebar-link w-full text-left text-ink-muted hover:text-danger">
                                    <Trash2 size={14} />
                                    <span className="flex-1">Trash</span>
                                </button>
                            </div>
                        </div>

                        {/* Semantic Tags */}
                        {tags.length > 0 && (
                            <div>
                                <p className="label px-2 mb-1 text-[10px] text-ink-ghost">Tags</p>
                                <div className="space-y-0.5 max-h-48 overflow-y-auto">
                                    {tags.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => handleTagSelect(t.name)}
                                            className={`sidebar-link w-full text-left ${activeTag === t.name ? 'active' : ''}`}
                                        >
                                            <TagIcon size={13} className="text-accent" />
                                            <span className="flex-1 truncate">#{t.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Profile & Theme Toggle */}
                    <div className="p-2 border-t border-border/60 space-y-1">
                        <button
                            onClick={toggleTheme}
                            className="sidebar-link w-full text-left flex items-center justify-between"
                        >
                            <span className="flex items-center gap-2">
                                {dark ? <Moon size={14} /> : <Sun size={14} />}
                                <span>{dark ? 'Dark Mode' : 'Light Mode'}</span>
                            </span>
                        </button>
                        <button
                            onClick={() => navigate('/profile')}
                            className="sidebar-link w-full text-left truncate text-xs text-ink-muted"
                        >
                            <span>👤 {user?.username}</span>
                        </button>
                    </div>
                </aside>
            )}

            {/* ══════════════════════════════════════════════════════════════════════
                COLUMN 2: NOTE FEED (Scrollable List with Search & Actions)
               ══════════════════════════════════════════════════════════════════════ */}
            <div className={`
                ${mobileView === 'detail' ? 'hidden md:flex' : 'flex'}
                w-full md:w-80 lg:w-88 shrink-0 h-full flex-col border-r border-border bg-feed transition-all duration-150
            `}>
                {/* Header & Controls */}
                <div className="p-3 border-b border-border/50 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        {!sidebarOpen && (
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors"
                                title="Show Sidebar"
                            >
                                <PanelLeft size={16} />
                            </button>
                        )}
                        <h2 className="text-sm font-semibold text-ink capitalize flex-1 truncate">
                            {activeTag ? `#${activeTag}` : activeFilter} ({totalElements})
                        </h2>
                        <button
                            id="apple-new-note-btn"
                            onClick={handleStartNewNote}
                            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 shadow-sm"
                            title="New Note"
                        >
                            <Plus size={14} /> Note
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative flex items-center">
                        <Search size={13} className="absolute left-2.5 text-ink-ghost pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
                            placeholder="Search notes..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-surface-2 text-ink placeholder:text-ink-ghost border border-transparent focus:border-accent outline-none"
                        />
                    </div>
                </div>

                {/* Scrollable Note List */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                    {isLoading && notes.length === 0 ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="p-3 rounded-xl bg-surface-1/40 animate-pulse space-y-2">
                                <div className="h-4 w-3/5 bg-surface-2 rounded" />
                                <div className="h-3 w-4/5 bg-surface-2 rounded" />
                            </div>
                        ))
                    ) : notes.length === 0 ? (
                        <div className="py-12 text-center text-xs text-ink-faint">
                            No notes found in this view.
                        </div>
                    ) : (
                        notes.map((note) => (
                            <NoteCard
                                key={note.id}
                                note={note}
                                isSelected={selectedNoteId === note.id}
                                onSelect={(n) => {
                                    setSelectedNoteId(n.id)
                                    setIsCreatingNew(false)
                                    setMobileView('detail')
                                }}
                                onTogglePin={handleTogglePin}
                                onToggleArchive={handleToggleArchive}
                                onDelete={handleDelete}
                            />
                        ))
                    )}

                    {hasMore && (
                        <div className="pt-2 text-center">
                            <button
                                onClick={loadMore}
                                disabled={isLoading}
                                className="text-xs text-accent hover:underline py-2"
                            >
                                {isLoading ? 'Loading...' : 'Load more notes'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════════
                COLUMN 3: LIVE EDITOR / READER CANVAS (Fluid Writing Space)
               ══════════════════════════════════════════════════════════════════════ */}
            <main className={`
                ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}
                flex-1 h-full flex-col bg-canvas overflow-y-auto relative
                ${isZenMode ? 'fixed inset-0 z-50 p-6 md:p-12' : ''}
            `}>
                {selectedNote || isCreatingNew ? (
                    <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-6 lg:p-10">
                        {/* Editor Header Toolbar */}
                        <div className="flex items-center justify-between gap-3 pb-4 mb-6 border-b border-border/50">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setMobileView('list')}
                                    className="md:hidden p-1.5 text-ink-muted hover:text-ink"
                                    title="Back to list"
                                >
                                    <ArrowLeft size={16} />
                                </button>
                                <span className="text-2xs font-mono text-ink-ghost">
                                    {saveStatus === 'saving' ? 'Saving...' : 'Saved to brain'}
                                </span>
                            </div>

                            <div className="flex items-center gap-1">
                                {!isCreatingNew && (
                                    <>
                                        <button
                                            onClick={() => handleTogglePin()}
                                            className={`p-1.5 rounded-md hover:bg-surface-2 text-ink-muted hover:text-accent transition-colors ${selectedNote?.isPinned ? 'text-accent' : ''}`}
                                            title="Pin Note"
                                        >
                                            <Pin size={15} className={selectedNote?.isPinned ? 'fill-accent' : ''} />
                                        </button>
                                        <button
                                            onClick={() => handleToggleShare()}
                                            className={`p-1.5 rounded-md hover:bg-surface-2 text-ink-muted hover:text-ink transition-colors ${selectedNote?.isShared ? 'text-accent' : ''}`}
                                            title="Share Note"
                                        >
                                            <Share2 size={15} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete()}
                                            className="p-1.5 rounded-md hover:bg-danger-soft text-ink-muted hover:text-danger transition-colors"
                                            title="Move to Trash"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </>
                                )}

                                <button
                                    onClick={() => setIsZenMode(!isZenMode)}
                                    className="p-1.5 rounded-md hover:bg-surface-2 text-ink-muted hover:text-ink transition-colors"
                                    title={isZenMode ? 'Exit Zen Focus' : 'Zen Focus Mode'}
                                >
                                    {isZenMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                                </button>

                                {isCreatingNew && (
                                    <button
                                        onClick={handleCreateSubmit}
                                        disabled={isSaving || !editorTitle.trim()}
                                        className="btn-primary text-xs py-1 px-4 ml-2"
                                    >
                                        {isSaving ? 'Creating...' : 'Save Note'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Title Input */}
                        <input
                            type="text"
                            value={editorTitle}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            placeholder="Title..."
                            className="w-full text-3xl lg:text-4xl font-serif font-medium text-ink bg-transparent outline-none placeholder:text-ink-ghost border-none mb-4"
                        />

                        {/* Tags Input */}
                        <div className="flex items-center gap-1.5 flex-wrap mb-6">
                            {editorTags.map((tag) => (
                                <span key={tag} className="tag flex items-center gap-1">
                                    #{tag}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTag(tag)}
                                        className="hover:text-danger ml-0.5"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                placeholder={editorTags.length === 0 ? '+ Add tags (press Enter)' : '+ tag'}
                                className="text-xs font-mono bg-transparent outline-none placeholder:text-ink-ghost text-ink py-0.5 px-1 min-w-[80px]"
                            />
                        </div>

                        {/* TipTap Rich Text Editor */}
                        <div className="flex-1 prose-container">
                            <TiptapEditor
                                content={editorContent}
                                onChange={handleContentChange}
                                placeholder="Start writing (type '/' for formatting)..."
                            />
                        </div>

                        {/* Attachments Section */}
                        {editorFiles.length > 0 && (
                            <div className="mt-8 pt-4 border-t border-border/50">
                                <p className="label mb-2">Attachments ({editorFiles.length})</p>
                                <FileList
                                    files={editorFiles}
                                    onDeleted={(fid) => setEditorFiles((f) => f.filter((x) => x.id !== fid))}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-ink-muted">
                        <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mb-4 text-ink-ghost">
                            <FileText size={32} />
                        </div>
                        <h3 className="font-serif text-xl text-ink mb-1">No Note Selected</h3>
                        <p className="text-xs text-ink-faint max-w-xs mb-6">
                            Choose a note from the feed on the left or create a fresh thought.
                        </p>
                        <button
                            onClick={handleStartNewNote}
                            className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                        >
                            <Plus size={15} /> Create a note
                        </button>
                    </div>
                )}
            </main>
        </div>
    )
}