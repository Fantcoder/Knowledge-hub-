import { useNotes } from '../../context/NotesContext'
import NoteCard from './NoteCard'
import EmptyState from '../common/EmptyState'
import { useNavigate } from 'react-router-dom'

export default function NoteGrid({ notes, emptyTitle, emptyDescription }) {
    const { isLoading, viewMode } = useNotes()
    const navigate = useNavigate()

    if (isLoading) {
        return (
            <div className={viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
                : 'space-y-2'
            }>
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={`card ${viewMode === 'grid' ? 'p-5' : 'p-4'}`}>
                        <div className="skeleton h-4 w-3/5 mb-3" />
                        <div className="skeleton h-3 w-full mb-2" />
                        <div className="skeleton h-3 w-2/3" />
                    </div>
                ))}
            </div>
        )
    }

    if (notes.length === 0) {
        return (
            <EmptyState
                title={emptyTitle || 'Nothing here'}
                description={emptyDescription || 'Start by creating a note.'}
                action={
                    <button onClick={() => navigate('/notes/new')} className="btn-primary text-sm">
                        Create a note
                    </button>
                }
            />
        )
    }

    return (
        <div className={
            viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
                : 'space-y-2'
        }>
            {notes.map((note) => (
                <NoteCard key={note.id} note={note} viewMode={viewMode} />
            ))}
        </div>
    )
}
