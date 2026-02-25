import { useState } from 'react'
import { fileService } from '../../services/fileService'
import { formatFileSize, getFileIcon } from '../../utils/constants'
import toast from 'react-hot-toast'

export default function FileList({ files, onDeleted }) {
    const [downloading, setDownloading] = useState(null)

    const handleDownload = async (file) => {
        setDownloading(file.id)
        try {
            const res = await fileService.download(file.id)
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const a = document.createElement('a')
            a.href = url; a.download = file.originalName || 'file'
            document.body.appendChild(a); a.click(); a.remove()
            window.URL.revokeObjectURL(url)
        } catch { toast.error('Download failed') }
        finally { setDownloading(null) }
    }

    if (!files?.length) return null

    return (
        <div className="space-y-1.5">
            {files.map((f) => (
                <div key={f.id} id={`file-item-${f.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 transition-colors group">
                    <span className="text-lg shrink-0">{getFileIcon(f.fileType)}</span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-ink truncate">{f.originalName}</p>
                        <p className="text-2xs text-ink-ghost font-mono">{formatFileSize(f.fileSize)}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleDownload(f)} disabled={downloading === f.id}
                            className="btn-ghost text-xs py-1 px-2">
                            {downloading === f.id ? '…' : '↓'}
                        </button>
                        {onDeleted && (
                            <button onClick={async () => {
                                try { await fileService.delete(f.id); onDeleted(f.id); toast.success('Deleted') }
                                catch { toast.error('Failed') }
                            }} className="btn-ghost text-xs py-1 px-2 text-danger">×</button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
