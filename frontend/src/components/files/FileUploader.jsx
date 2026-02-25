import { useState, useRef } from 'react'
import { fileService } from '../../services/fileService'
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, formatFileSize } from '../../utils/constants'
import toast from 'react-hot-toast'

export default function FileUploader({ noteId, onUploaded }) {
    const [dragging, setDragging] = useState(false)
    const [uploading, setUploading] = useState(false)
    const inputRef = useRef(null)

    const validate = (file) => {
        if (file.size > MAX_FILE_SIZE) { toast.error(`Max ${formatFileSize(MAX_FILE_SIZE)}`); return false }
        if (!ALLOWED_FILE_TYPES.includes(file.type)) { toast.error('File type not allowed'); return false }
        return true
    }

    const upload = async (file) => {
        if (!validate(file)) return
        setUploading(true)
        try {
            const res = await fileService.upload(file, noteId)
            onUploaded?.(res.data.data)
            toast.success('File uploaded')
        } catch { toast.error('Upload failed') }
        finally { setUploading(false) }
    }

    const onDrop = (e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) upload(e.dataTransfer.files[0]) }

    return (
        <div
            id="file-drop-zone"
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`
        flex flex-col items-center justify-center py-8 px-4
        border-2 border-dashed rounded-2xl cursor-pointer
        transition-all duration-200
        ${dragging ? 'border-accent bg-accent-soft' : 'border-border hover:border-border-strong'}
        ${uploading ? 'opacity-60 pointer-events-none' : ''}
      `}
        >
            <input ref={inputRef} type="file" className="hidden" onChange={(e) => e.target.files[0] && upload(e.target.files[0])} />
            <p className="text-sm text-ink-muted">{uploading ? 'Uploading…' : 'Drop a file or click to browse'}</p>
            <p className="text-2xs text-ink-ghost font-mono mt-1">PDF, DOCX, PNG, JPG, TXT · Max 10MB</p>
        </div>
    )
}
