import { useState } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function ExportData() {
    const [exporting, setExporting] = useState(false)

    const handleExport = async () => {
        setExporting(true)
        try {
            const res = await api.get('/export')
            const data = res.data.data

            // Download as JSON file
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `knowledge-hub-export-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)

            toast.success(`Exported ${data.totalNotes} notes and ${data.totalLinks} links`)
        } catch {
            toast.error('Export failed')
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="animate-in max-w-lg space-y-6">
            <h1 className="font-serif text-3xl text-ink">Export data</h1>
            <p className="text-sm text-ink-faint leading-relaxed">
                Download all your notes, archived notes, and saved links as a single JSON file.
                Your data is yours — always.
            </p>

            <div className="card p-6 space-y-4">
                <div>
                    <p className="text-sm font-medium text-ink mb-0.5">What's included</p>
                    <ul className="text-sm text-ink-muted space-y-1 mt-2">
                        <li className="flex items-center gap-2"><span className="text-accent">✓</span> All notes with content and tags</li>
                        <li className="flex items-center gap-2"><span className="text-accent">✓</span> Archived notes</li>
                        <li className="flex items-center gap-2"><span className="text-accent">✓</span> Saved links with descriptions</li>
                        <li className="flex items-center gap-2"><span className="text-ink-ghost">–</span> <span className="text-ink-faint">Files (not included — download individually)</span></li>
                    </ul>
                </div>

                <button
                    id="export-btn"
                    onClick={handleExport}
                    disabled={exporting}
                    className="btn-primary text-sm w-full py-3"
                >
                    {exporting ? 'Exporting…' : '↓ Download JSON export'}
                </button>

                <p className="text-2xs text-ink-ghost font-mono text-center">
                    Format: JSON · Includes metadata and timestamps
                </p>
            </div>
        </div>
    )
}
