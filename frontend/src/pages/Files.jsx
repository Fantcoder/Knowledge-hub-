import { useEffect, useState } from 'react'
import { fileService } from '../services/fileService'
import { formatFileSize, getFileIcon } from '../utils/constants'
import { formatDate } from '../utils/formatDate'
import FileUploader from '../components/files/FileUploader'
import ConfirmModal from '../components/common/ConfirmModal'
import EmptyState from '../components/common/EmptyState'
import toast from 'react-hot-toast'

export default function Files() {
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [confirmId, setConfirmId] = useState(null)
    const [downloading, setDownloading] = useState(null)

    useEffect(() => {
        fileService.getAll()
            .then((r) => setFiles(r.data.data || []))
            .catch(() => toast.error('Failed to load files'))
            .finally(() => setLoading(false))
    }, [])

    const handleDelete = async (id) => {
        try { await fileService.delete(id); setFiles(files.filter((f) => f.id !== id)); toast.success('Deleted') }
        catch { toast.error('Failed') }
        finally { setConfirmId(null) }
    }

    const handleDownload = async (file) => {
        setDownloading(file.id)
        try {
            const res = await fileService.download(file.id)
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const a = document.createElement('a'); a.href = url; a.download = file.originalName || 'file'
            document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url)
        } catch { toast.error('Download failed') }
        finally { setDownloading(null) }
    }

    return (
        <div className="animate-in space-y-8">
            <h1 className="font-serif text-3xl text-ink">Files</h1>

            <FileUploader onUploaded={(f) => setFiles([f, ...files])} />

            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="card p-4"><div className="skeleton h-8 w-8 rounded-lg mb-3" /><div className="skeleton h-3 w-3/4 mb-1" /><div className="skeleton h-2 w-1/2" /></div>
                    ))}
                </div>
            ) : files.length === 0 ? (
                <EmptyState title="No files" description="Upload PDFs, images, documents and more." />
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {files.map((f) => (
                        <div key={f.id} className="card p-4 group">
                            <span className="text-2xl mb-2 block">{getFileIcon(f.fileType)}</span>
                            <p className="text-sm text-ink truncate mb-0.5">{f.originalName}</p>
                            <p className="text-2xs font-mono text-ink-ghost">{formatFileSize(f.fileSize)}</p>
                            <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleDownload(f)} disabled={downloading === f.id}
                                    className="btn-secondary text-xs flex-1 py-1.5">{downloading === f.id ? '…' : '↓ Download'}</button>
                                <button onClick={() => setConfirmId(f.id)}
                                    className="btn-ghost text-xs py-1.5 px-2 text-danger">×</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmModal isOpen={!!confirmId} title="Delete file" message="This file will be permanently deleted."
                onConfirm={() => handleDelete(confirmId)} onCancel={() => setConfirmId(null)} />
        </div>
    )
}
