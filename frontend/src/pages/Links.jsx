import { useEffect, useState } from 'react'
import { linkService } from '../services/linkService'
import LinkCard from '../components/links/LinkCard'
import EmptyState from '../components/common/EmptyState'
import toast from 'react-hot-toast'

export default function Links() {
    const [links, setLinks] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ url: '', title: '', description: '' })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        linkService.getAll()
            .then((r) => setLinks(r.data.data || []))
            .catch(() => toast.error('Failed to load links'))
            .finally(() => setLoading(false))
    }, [])

    const handleAdd = async (e) => {
        e.preventDefault()
        if (!form.url.trim()) return
        setSaving(true)
        try {
            const res = await linkService.create(form)
            setLinks([res.data.data, ...links])
            setForm({ url: '', title: '', description: '' })
            setShowForm(false)
            toast.success('Link saved')
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed')
        } finally { setSaving(false) }
    }

    return (
        <div className="animate-in space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="font-serif text-3xl text-ink">Links</h1>
                <button id="add-link-btn" onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
                    + Add link
                </button>
            </div>

            {showForm && (
                <form id="add-link-form" onSubmit={handleAdd} className="card p-5 space-y-3 animate-in">
                    <div>
                        <label className="label" htmlFor="link-url">URL</label>
                        <input id="link-url" type="url" required value={form.url}
                            onChange={(e) => setForm({ ...form, url: e.target.value })}
                            className="input" placeholder="https://…" />
                    </div>
                    <div>
                        <label className="label" htmlFor="link-title">Title</label>
                        <input id="link-title" type="text" value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            className="input" placeholder="Optional" />
                    </div>
                    <div>
                        <label className="label" htmlFor="link-desc">Notes</label>
                        <textarea id="link-desc" rows={2} value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="input resize-none" placeholder="Why is this important?" />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                        <button type="button" onClick={() => setShowForm(false)} className="btn-ghost text-sm">Cancel</button>
                        <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? '…' : 'Save'}</button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="card p-4"><div className="skeleton h-4 w-2/3 mb-2" /><div className="skeleton h-3 w-1/2" /></div>
                ))}</div>
            ) : links.length === 0 ? (
                <EmptyState title="No links yet" description="Save URLs with notes to find them later."
                    action={<button onClick={() => setShowForm(true)} className="btn-primary text-sm">Add your first link</button>} />
            ) : (
                <div className="space-y-2">
                    {links.map((l) => <LinkCard key={l.id} link={l} onDeleted={(id) => setLinks(links.filter((x) => x.id !== id))} onUpdated={(u) => setLinks(links.map((x) => x.id === u.id ? u : x))} />)}
                </div>
            )}
        </div>
    )
}
