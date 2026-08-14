import React from 'react'
import { useNavigate } from 'react-router-dom'
import { formatRelative } from '../../utils/formatDate'
import { stripHtml, truncate } from '../../utils/sanitize'

const NoteCard = React.memo(function NoteCard({
    note,
    viewMode = 'grid',
    onTogglePin,
    onToggleArchive,
    onDelete
}) {
    const navigate = useNavigate()
    const preview = truncate(stripHtml(note.contentPreview || note.content || ''), 140)
    const isGrid = viewMode === 'grid'

    return (
        <article
            id={`note-${note.id}`}
            onClick={() => navigate(`/notes/${note.id}`)}
            className={`group card cursor-pointer h-full ${isGrid ? 'p-5' : 'p-4 flex items-start gap-4'}`}
        >
            <div className={isGrid ? '' : 'flex-1 min-w-0'}>
                {/* Title */}
                <div className="flex items-start gap-2 mb-1.5">
                    {note.isPinned && (
                        <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full bg-accent" title="Pinned" />
                    )}
                    <h3 className={`font-serif text-ink leading-snug ${isGrid ? 'text-base' : 'text-sm'} ${!note.title ? 'italic text-ink-faint' : ''}`}>
                        {note.title || 'Untitled'}
                    </h3>
                </div>

                {/* Preview */}
                {preview && (
                    <p className={`text-ink-faint leading-relaxed ${isGrid ? 'text-sm line-clamp-3 mb-3' : 'text-xs line-clamp-1 mb-1'}`}>
                        {preview}
                    </p>
                )}

                {/* Meta row */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-2xs font-mono text-ink-ghost">{formatRelative(note.updatedAt)}</span>
                    {note.tags?.map((t) => (
                        <span key={t} className="tag">{t}</span>
                    ))}
                    {note.files?.length > 0 && (
                        <span className="text-2xs text-ink-ghost font-mono">{note.files.length} file{note.files.length > 1 ? 's' : ''}</span>
                    )}
                </div>
            </div>

            {/* Hover actions — subtle row */}
            <div className={`${isGrid ? 'mt-3 pt-3 border-t border-border' : ''} flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                <button onClick={(e) => { e.stopPropagation(); onTogglePin(note.id) }}
                    className="btn-ghost text-xs py-1 px-2" title={note.isPinned ? 'Unpin' : 'Pin'}>
                    {note.isPinned ? 'Unpin' : 'Pin'}
                </button>
                <button onClick={(e) => { e.stopPropagation(); onToggleArchive(note.id) }}
                    className="btn-ghost text-xs py-1 px-2">
                    Archive
                </button>
                <button onClick={(e) => { e.stopPropagation(); navigate(`/notes/${note.id}/edit`) }}
                    className="btn-ghost text-xs py-1 px-2">
                    Edit
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(note.id) }}
                    className="btn-ghost text-xs py-1 px-2 text-danger hover:bg-danger-soft">
                    Delete
                </button>
            </div>
        </article>
    )
}, (prevProps, nextProps) => {
    return prevProps.note.id === nextProps.note.id &&
        prevProps.note.updatedAt === nextProps.note.updatedAt &&
        prevProps.viewMode === nextProps.viewMode
})

export default NoteCard
