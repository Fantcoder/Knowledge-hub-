import React from 'react'
import { formatRelative } from '../../utils/formatDate'
import { stripHtml, truncate } from '../../utils/sanitize'
import { Pin, Archive, Trash2, Edit3, Paperclip } from 'lucide-react'

const NoteCard = React.memo(function NoteCard({
    note,
    isSelected = false,
    onSelect,
    onTogglePin,
    onToggleArchive,
    onDelete,
}) {
    const preview = truncate(stripHtml(note.contentPreview || note.content || ''), 100)

    return (
        <div
            id={`note-card-${note.id}`}
            onClick={() => onSelect?.(note)}
            className={`
                group relative p-3.5 rounded-xl cursor-pointer transition-all duration-150 border text-left select-none
                ${isSelected
                    ? 'bg-surface-1 border-accent shadow-sm ring-1 ring-accent/30'
                    : 'bg-surface-1/60 hover:bg-surface-1 border-border/70 hover:border-border-strong'}
            `}
        >
            {/* Top Row: Title & Date */}
            <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {note.isPinned && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" title="Pinned" />
                    )}
                    <h3 className={`text-sm font-semibold truncate ${isSelected ? 'text-ink' : 'text-ink'} ${!note.title ? 'italic text-ink-faint' : ''}`}>
                        {note.title || 'Untitled note'}
                    </h3>
                </div>
                <span className="text-2xs font-mono text-ink-ghost shrink-0 mt-0.5">
                    {formatRelative(note.updatedAt)}
                </span>
            </div>

            {/* Preview snippet */}
            {preview && (
                <p className="text-xs text-ink-muted leading-relaxed line-clamp-2 mb-2 font-normal">
                    {preview}
                </p>
            )}

            {/* Bottom Row: Tags & Files */}
            <div className="flex items-center justify-between gap-2 mt-1">
                <div className="flex items-center gap-1.5 flex-wrap overflow-hidden max-h-5">
                    {note.tags?.slice(0, 3).map((t) => (
                        <span key={t} className="tag text-[10px] px-1.5 py-0">
                            {t}
                        </span>
                    ))}
                    {note.tags?.length > 3 && (
                        <span className="text-2xs font-mono text-ink-ghost">+{note.tags.length - 3}</span>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {note.files?.length > 0 && (
                        <span className="flex items-center gap-0.5 text-2xs font-mono text-ink-ghost" title={`${note.files.length} attachments`}>
                            <Paperclip size={11} /> {note.files.length}
                        </span>
                    )}

                    {/* Quick Hover Actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 ml-1">
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onTogglePin?.(note.id) }}
                            className="p-1 text-ink-ghost hover:text-accent rounded hover:bg-surface-2"
                            title={note.isPinned ? 'Unpin' : 'Pin'}
                        >
                            <Pin size={12} className={note.isPinned ? 'fill-accent text-accent' : ''} />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onToggleArchive?.(note.id) }}
                            className="p-1 text-ink-ghost hover:text-ink rounded hover:bg-surface-2"
                            title="Archive"
                        >
                            <Archive size={12} />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onDelete?.(note.id) }}
                            className="p-1 text-ink-ghost hover:text-danger rounded hover:bg-danger-soft"
                            title="Delete"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}, (prevProps, nextProps) => {
    return prevProps.note.id === nextProps.note.id &&
        prevProps.note.updatedAt === nextProps.note.updatedAt &&
        prevProps.note.isPinned === nextProps.note.isPinned &&
        prevProps.isSelected === nextProps.isSelected
})

export default NoteCard