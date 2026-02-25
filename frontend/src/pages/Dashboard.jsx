import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotes } from '../context/NotesContext'
import NoteGrid from '../components/notes/NoteGrid'
import TagFilter from '../components/tags/TagFilter'
import { tagService } from '../services/tagService'

export default function Dashboard() {
    const { fetchNotes, notes, activeFilter, activeTag, searchQuery } = useNotes()
    const navigate = useNavigate()
    const [tags, setTags] = useState([])

    useEffect(() => { fetchNotes(activeFilter, activeTag) }, [activeFilter, activeTag])
    useEffect(() => { tagService.getAll().then((r) => setTags(r.data.data || [])).catch(() => { }) }, [])

    const pinned = notes.filter((n) => n.isPinned && !n.isDeleted && !n.isArchived)
    const rest = notes.filter((n) => !n.isPinned)

    const title = searchQuery ? 'Search results'
        : activeTag ? `#${activeTag}`
            : { active: 'All notes', archived: 'Archive', deleted: 'Trash', pinned: 'Pinned' }[activeFilter] || 'All notes'

    return (
        <div className="animate-in space-y-8">
            {/* Header */}
            <div>
                <h1 className="font-serif text-3xl text-ink">{title}</h1>
                {searchQuery && (
                    <p className="text-sm text-ink-faint mt-1">
                        for "<span className="text-accent">{searchQuery}</span>"
                    </p>
                )}
            </div>

            {/* Tags */}
            {tags.length > 0 && activeFilter === 'active' && !searchQuery && (
                <TagFilter tags={tags} />
            )}

            {/* Pinned */}
            {pinned.length > 0 && activeFilter === 'active' && !activeTag && !searchQuery && (
                <section>
                    <p className="label mb-3">pinned</p>
                    <NoteGrid notes={pinned} />
                </section>
            )}

            {/* Notes */}
            <section>
                {pinned.length > 0 && activeFilter === 'active' && !activeTag && !searchQuery && (
                    <p className="label mb-3">recent</p>
                )}
                <NoteGrid
                    notes={rest.length > 0 || pinned.length > 0 ? rest : notes}
                    emptyTitle={activeFilter === 'active' ? 'A blank page' : activeFilter === 'archived' ? 'Nothing archived' : 'Empty'}
                    emptyDescription={activeFilter === 'active' ? 'Start writing. Your first note is one click away.' : ''}
                />
            </section>
        </div>
    )
}
