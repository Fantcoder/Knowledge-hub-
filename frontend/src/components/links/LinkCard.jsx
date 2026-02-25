import { useState } from 'react'
import { linkService } from '../../services/linkService'
import toast from 'react-hot-toast'

export default function LinkCard({ link, onDeleted, onUpdated }) {
    const [editing, setEditing] = useState(false)
    const [form, setForm] = useState({ url: link.url, title: link.title, description: link.description })
    const [saving, setSaving] = useState(false)

    const domain = (() => { try { return new URL(link.url).hostname.replace('www.', '') } catch { return '' } })()

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await linkService.update(link.id, form)
            onUpdated?.(res.data.data)
            setEditing(false)
            toast.success('Link updated')
        } catch { toast.error('Failed') }
        finally { setSaving(false) }
    }

    const handleDelete = async () => {
        try { await linkService.delete(link.id); onDeleted?.(link.id); toast.success('Link deleted') }
        catch { toast.error('Failed') }
    }

    if (editing) {
        return (
            <div className="card p-4 space-y-2.5 animate-in">
                <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="input text-sm" placeholder="URL" />
                <input type="text" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input text-sm" placeholder="Title" />
                <textarea rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input text-sm resize-none" placeholder="Notes" />
                <div className="flex justify-end gap-2">
                    <button onClick={() => setEditing(false)} className="btn-ghost text-xs">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="btn-primary text-xs">{saving ? '…' : 'Save'}</button>
                </div>
            </div>
        )
    }

    return (
        <div id={`link-${link.id}`} className="card p-4 group">
            <div className="flex items-start gap-3">
                {/* Favicon */}
                <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center shrink-0 mt-0.5">
                    <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt="" className="w-4 h-4" onError={(e) => { e.target.style.display = 'none' }} />
                </div>

                <div className="flex-1 min-w-0">
                    <a href={link.url} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-medium text-ink hover:text-accent transition-colors truncate block">
                        {link.title || link.url}
                    </a>
                    <p className="text-2xs text-ink-ghost font-mono mt-0.5">{domain}</p>
                    {link.description && <p className="text-xs text-ink-faint mt-1.5 line-clamp-2">{link.description}</p>}
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => setEditing(true)} className="btn-ghost text-xs py-1 px-2">Edit</button>
                    <button onClick={handleDelete} className="btn-ghost text-xs py-1 px-2 text-danger">×</button>
                </div>
            </div>
        </div>
    )
}
