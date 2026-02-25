import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { noteService } from '../services/noteService'
import { useNotes } from '../context/NotesContext'
import { formatFull } from '../utils/formatDate'
import FileList from '../components/files/FileList'
import ConfirmModal from '../components/common/ConfirmModal'
import toast from 'react-hot-toast'

export default function NoteView() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { deleteNote } = useNotes()
    const [note, setNote] = useState(null)
    const [loading, setLoading] = useState(true)
    const [confirmDelete, setConfirmDelete] = useState(false)

    useEffect(() => {
        let unmounted = false
        noteService.getById(id)
            .then((r) => { if (!unmounted) setNote(r.data.data) })
            .catch(() => { if (!unmounted) { toast.error('Note not found'); navigate('/dashboard') } })
            .finally(() => { if (!unmounted) setLoading(false) })
        return () => { unmounted = true }
    }, [id])

    const handlePin = async () => {
        const res = await noteService.pin(id)
        setNote(res.data.data)
    }

    const handleDelete = async () => {
        await deleteNote(parseInt(id))
        navigate('/dashboard')
    }

    if (loading) {
        return (
            <div className="max-w-3xl animate-pulse space-y-4">
                <div className="skeleton h-10 w-2/3" />
                <div className="skeleton h-4 w-40" />
                <div className="skeleton h-72 rounded-2xl" />
            </div>
        )
    }
    if (!note) return null

    return (
        <>
            <div className="max-w-3xl animate-in">
                {/* Toolbar */}
                <div className="flex items-center justify-between mb-8">
                    <button id="back-btn" onClick={() => navigate('/dashboard')} className="btn-ghost text-sm">
                        ← All notes
                    </button>
                    <div className="flex items-center gap-1">
                        <button id="pin-note" onClick={handlePin}
                            className={`btn-ghost text-xs py-1.5 px-2.5 ${note.isPinned ? 'text-accent' : ''}`}>
                            {note.isPinned ? '● Pinned' : 'Pin'}
                        </button>
                        <button id="edit-note" onClick={() => navigate(`/notes/${id}/edit`)}
                            className="btn-ghost text-xs py-1.5 px-2.5">
                            Edit
                        </button>
                        <button id="delete-note" onClick={() => setConfirmDelete(true)}
                            className="btn-ghost text-xs py-1.5 px-2.5 text-danger hover:bg-danger-soft">
                            Delete
                        </button>
                    </div>
                </div>

                {/* Note */}
                <article>
                    <h1 className="font-serif text-3xl text-ink leading-tight mb-3">{note.title}</h1>

                    {/* Meta */}
                    <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border">
                        <span className="text-2xs font-mono text-ink-ghost">{formatFull(note.updatedAt)}</span>
                        {note.tags?.map((t) => <span key={t} className="tag">{t}</span>)}
                    </div>

                    {/* Content */}
                    {note.content ? (
                        <div className="note-prose" dangerouslySetInnerHTML={{ __html: note.content }} />
                    ) : (
                        <p className="text-ink-faint italic">No content yet</p>
                    )}

                    {/* Files */}
                    {note.files?.length > 0 && (
                        <div className="mt-10 pt-6 border-t border-border">
                            <p className="label mb-3">attachments ({note.files.length})</p>
                            <FileList
                                files={note.files}
                                onDeleted={(fid) => setNote((n) => ({ ...n, files: n.files.filter((f) => f.id !== fid) }))}
                            />
                        </div>
                    )}
                </article>
            </div>

            <ConfirmModal
                isOpen={confirmDelete}
                title="Move to trash"
                message={`"${note.title}" will be moved to trash.`}
                confirmLabel="Move to trash"
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete(false)}
            />
        </>
    )
}
