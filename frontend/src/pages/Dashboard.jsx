import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotes } from '../context/NotesContext'
import NoteGrid from '../components/notes/NoteGrid'
import TagFilter from '../components/tags/TagFilter'
import { tagService } from '../services/tagService'

export default function Dashboard() {
    const {
        fetchNotes, notes, activeFilter, activeTag, searchQuery,
        hasMore, isLoading, loadMore, totalElements
    } = useNotes()
    const navigate = useNavigate()
    const [tags, setTags] = useState([])

    useEffect(() => { fetchNotes(activeFilter, activeTag) }, [activeFilter, activeTag])
    useEffect(() => { tagService.getAll().then((r) => setTags(r.data.data || [])).catch(() => { }) }, [])

    const isDefaultView = activeFilter === 'active' && !activeTag && !searchQuery
    const displayedPinned = isDefaultView ? notes.filter(n => n.isPinned && !n.isDeleted && !n.isArchived) : []
    const displayedRecent = isDefaultView ? notes.filter(n => !n.isPinned) : notes

    const title = searchQuery ? 'Search results'
        : activeTag ? `#${activeTag}`
            : { active: 'All notes', archived: 'Archive', deleted: 'Trash', pinned: 'Pinned' }[activeFilter] || 'All notes'

    return (
        <div className="animate-in space-y-8">
            {/* Header */}
            <div className="flex items-baseline justify-between">
                <div>
                    <h1 className="font-serif text-3xl text-ink">{title}</h1>
                    {searchQuery && (
                        <p className="text-sm text-ink-faint mt-1">
                            for "<span className="text-accent">{searchQuery}</span>"
                        </p>
                    )}
                </div>
                {totalElements > 0 && (
                    <p className="text-xs text-ink-faint">
                        {totalElements} {totalElements === 1 ? 'note' : 'notes'}
                    </p>
                )}
            </div>

            {/* Tags */}
            {tags.length > 0 && activeFilter === 'active' && !searchQuery && (
                <TagFilter tags={tags} />
            )}

            {/* Pinned */}
            {displayedPinned.length > 0 && (
                <section>
                    <p className="label mb-3">pinned</p>
                    <NoteGrid notes={displayedPinned} />
                </section>
            )}

            {/* Notes */}
            <section>
                {displayedPinned.length > 0 && (
                    <p className="label mb-3">recent</p>
                )}
                <NoteGrid
                    notes={displayedRecent}
                    emptyTitle={activeFilter === 'active' ? 'A blank page' : activeFilter === 'archived' ? 'Nothing archived' : 'Empty'}
                    emptyDescription={activeFilter === 'active' ? 'Start writing. Your first note is one click away.' : ''}
                />
            </section>

            {/* Load More */}
            {hasMore && (
                <div className="flex justify-center pt-4 pb-8">
                    <button
                        onClick={loadMore}
                        disabled={isLoading}
                        className="px-6 py-2.5 rounded-xl bg-surface-2 text-ink-muted 
                                   hover:bg-surface-3 hover:text-ink transition-all duration-200 
                                   text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Loading...
                            </span>
                        ) : (
                            'Load more notes'
                        )}
                    </button>
                </div>
            )}
        </div>
    )
}
