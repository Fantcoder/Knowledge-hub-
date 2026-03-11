import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import NoteEditor from '../components/notes/NoteEditor'
import { noteService } from '../services/noteService'
import { useNotes } from '../context/NotesContext'
import toast from 'react-hot-toast'

export default function NoteEdit() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { dispatch } = useNotes()
    const [note, setNote] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        let unmounted = false
        noteService.getById(id)
            .then((r) => { if (!unmounted) setNote(r.data.data) })
            .catch(() => { if (!unmounted) { toast.error('Note not found'); navigate('/dashboard') } })
            .finally(() => { if (!unmounted) setLoading(false) })
        return () => { unmounted = true }
    }, [id])

    const handleSave = async ({ title, content, tags }) => {
        setIsSaving(true)
        try {
            const res = await noteService.update(id, { title, content, tags })
            dispatch({ type: 'UPDATE_NOTE', payload: res.data.data })
            toast.success('Note saved')
            navigate(`/notes/${id}`)
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to save')
        } finally { setIsSaving(false) }
    }

    if (loading) return <div className="space-y-4 animate-pulse"><div className="skeleton h-8 w-2/3" /><div className="skeleton h-4 w-1/3" /><div className="skeleton h-64 w-full rounded-2xl" /></div>
    if (!note) return null

    return (
        <div className="animate-in max-w-3xl h-full flex flex-col pt-4">
            <NoteEditor initialData={note} onSave={handleSave} onCancel={() => navigate(-1)} isSaving={isSaving} />
        </div>
    )
}
