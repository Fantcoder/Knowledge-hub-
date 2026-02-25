import { useEffect, useState } from 'react'
import { useNotes } from '../context/NotesContext'
import { noteService } from '../services/noteService'
import { truncate, stripHtml } from '../utils/sanitize'
import { formatRelative } from '../utils/formatDate'
import EmptyState from '../components/common/EmptyState'
import ConfirmModal from '../components/common/ConfirmModal'
import toast from 'react-hot-toast'

export default function Trash() {
    const { fetchNotes, notes, isLoading, permanentDeleteNote, restoreNote } = useNotes()
    const [emptyConfirm, setEmptyConfirm] = useState(false)

    useEffect(() => { fetchNotes('deleted') }, [])

    const handleEmpty = async () => {
        try {
            await Promise.all(notes.map((n) => noteService.permanentDelete(n.id)))
            fetchNotes('deleted')
            toast.success('Trash emptied')
        } catch { toast.error('Failed') }
        finally { setEmptyConfirm(false) }
    }

    return (
        <div className="animate-in space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-3xl text-ink">Trash</h1>
                    <p className="text-sm text-ink-faint mt-1">
                        {notes.length} note{notes.length !== 1 ? 's' : ''}
                    </p>
                </div>
                {notes.length > 0 && (
                    <button id="empty-trash" onClick={() => setEmptyConfirm(true)} className="btn-danger text-sm">
                        Empty trash
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="card p-4"><div className="skeleton h-4 w-1/2 mb-2" /><div className="skeleton h-3 w-3/4" /></div>
                ))}</div>
            ) : notes.length === 0 ? (
                <EmptyState title="Trash is empty" description="Deleted notes appear here before permanent removal." />
            ) : (
                <div className="space-y-2">
                    {notes.map((n) => (
                        <div key={n.id} className="card p-4 flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-medium text-ink truncate">{n.title}</h3>
                                <p className="text-2xs font-mono text-ink-ghost mt-0.5">{formatRelative(n.updatedAt)}</p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                                <button onClick={() => restoreNote(n.id)} className="btn-secondary text-xs py-1.5 px-3">Restore</button>
                                <button onClick={() => permanentDeleteNote(n.id)} className="btn-ghost text-xs py-1.5 px-2 text-danger">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmModal isOpen={emptyConfirm} title="Empty trash"
                message={`Permanently delete all ${notes.length} notes? This cannot be undone.`}
                confirmLabel="Empty trash" onConfirm={handleEmpty} onCancel={() => setEmptyConfirm(false)} />
        </div>
    )
}
