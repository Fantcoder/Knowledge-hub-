import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { noteService } from '../services/noteService'
import { formatFull } from '../utils/formatDate'

export default function SharedNoteView() {
    const { slug } = useParams()
    const [note, setNote] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        // Apply theme for visitors
        const theme = localStorage.getItem('theme') || 'dark'
        document.documentElement.classList.toggle('dark', theme === 'dark')

        let unmounted = false
        // Fetch public note data
        noteService.getShared(slug)
            .then((r) => { 
                if (!unmounted) {
                    setNote(r.data.data)
                    document.title = `${r.data.data.title} | Knowledge Hub`
                } 
            })
            .catch(() => { if (!unmounted) setError(true) })
            .finally(() => { if (!unmounted) setLoading(false) })
        return () => { 
            unmounted = true 
            document.title = 'Knowledge Hub'
        }
    }, [slug])

    if (loading) {
        return (
            <div className="min-h-screen bg-surface-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
        )
    }

    if (error || !note) {
        return (
            <div className="min-h-screen bg-surface-1 flex flex-col items-center justify-center p-6 text-center">
                <h1 className="font-serif text-3xl text-ink mb-4">Note not found</h1>
                <p className="text-ink-faint mb-8 max-w-sm">This note may have been deleted, or the author has turned off link sharing.</p>
                <Link to="/" className="btn-primary rounded-full px-6 py-2">
                    Create your own Knowledge Hub
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-surface-1 text-ink selection:bg-accent/20">
            {/* Top Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-surface-1/70 backdrop-blur-md border-b border-border shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 cursor-pointer select-none">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent text-accent-ink font-bold shadow-inner">K</div>
                        <span className="font-serif text-xl text-ink tracking-tight hidden sm:block">knowledge hub</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-sm font-medium text-ink-muted hover:text-ink transition-colors hidden sm:block">Sign in</Link>
                        <Link to="/register" className="btn-primary py-2 px-5 text-sm shadow-md shadow-accent/20">Get Started Free</Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-3xl mx-auto px-6 pt-32 pb-32 animate-in">
                
                {/* Note Header */}
                <header className="mb-12">
                    <h1 className="font-serif text-4xl md:text-5xl text-ink leading-tight mb-4 tracking-tight">{note.title}</h1>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-mono text-ink-ghost">{formatFull(note.updatedAt)}</span>
                        {note.tags?.map((t) => <span key={t} className="px-2 py-0.5 rounded bg-surface-2 text-2xs font-medium text-ink-muted uppercase tracking-wider">{t}</span>)}
                    </div>
                </header>

                {/* Note Content */}
                <main>
                    {note.content ? (
                        <div className="note-prose" dangerouslySetInnerHTML={{ __html: note.content }} />
                    ) : (
                        <p className="text-ink-faint italic">No content</p>
                    )}
                </main>
            </div>

            {/* Viral Footer */}
            <footer className="fixed bottom-0 left-0 right-0 border-t border-border/50 bg-surface-1/80 backdrop-blur-md z-10">
                <div className="max-w-3xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded flex items-center justify-center bg-accent text-accent-ink font-bold" style={{ fontSize: '10px' }}>K</div>
                        <span className="text-sm text-ink-muted font-medium">Shared via Knowledge Hub</span>
                    </div>
                    <Link to="/" className="text-xs font-medium text-accent hover:text-accent-hover transition-colors">
                        Build your own second brain →
                    </Link>
                </div>
            </footer>
        </div>
    )
}
