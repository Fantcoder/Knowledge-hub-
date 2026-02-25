import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NoteEditor from '../components/notes/NoteEditor'
import { noteService } from '../services/noteService'
import { useNotes } from '../context/NotesContext'
import toast from 'react-hot-toast'

export default function NoteCreate() {
    const navigate = useNavigate()
    const { dispatch } = useNotes()
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async ({ title, content, tags }) => {
        setIsSaving(true)
        try {
            const res = await noteService.create({ title, content, tags })
            dispatch({ type: 'ADD_NOTE', payload: res.data.data })
            toast.success('Note created!')
            navigate('/dashboard')
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to create note')
        } finally { setIsSaving(false) }
    }

    return (
        <div className="animate-in max-w-3xl">
            <button id="back-btn" onClick={() => navigate(-1)} className="btn-ghost text-sm mb-4">
                ← Back
            </button>
            <NoteEditor onSave={handleSave} onCancel={() => navigate(-1)} isSaving={isSaving} />
        </div>
    )
}
