import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotes } from '../../context/NotesContext'
import { tagService } from '../../services/tagService'
import { useEffect, useState } from 'react'

function NavItem({ to, label, id, onClick, count }) {
    return (
        <NavLink
            id={id}
            to={to}
            onClick={onClick}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
            <span className="flex-1">{label}</span>
            {count !== undefined && (
                <span className="text-2xs font-mono text-ink-ghost">{count}</span>
            )}
        </NavLink>
    )
}

export default function Sidebar({ isOpen, onClose }) {
    const { user, logout } = useAuth()
    const { dispatch, activeTag, fetchNotes } = useNotes()
    const navigate = useNavigate()
    const [tags, setTags] = useState([])
    const [dark, setDark] = useState(localStorage.getItem('darkMode') === 'true')

    useEffect(() => {
        tagService.getAll().then((r) => setTags(r.data.data || [])).catch(() => { })
    }, [])

    const handleFilter = (filter) => {
        dispatch({ type: 'SET_FILTER', payload: filter })
        onClose?.()
    }

    const handleTag = (name) => {
        dispatch({ type: 'SET_TAG_FILTER', payload: name })
        fetchNotes('active', name)
        navigate('/dashboard')
        onClose?.()
    }

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    const toggleDark = () => {
        const next = !dark
        setDark(next)
        localStorage.setItem('darkMode', String(next))
        document.documentElement.classList.toggle('dark', next)
    }

    const initial = user?.username?.[0]?.toUpperCase() || '?'

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/30 z-20 lg:hidden animate-in" onClick={onClose} />
            )}

            <aside className={`
        fixed top-0 left-0 h-full w-64 z-30 flex flex-col
        border-r border-border
        transition-transform duration-300 ease-out-expo
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ background: 'var(--sidebar-bg)' }}>

                {/* — Logo — */}
                <div className="flex items-center gap-3 px-5 h-14">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                        <span className="text-xs font-bold text-accent-ink">K</span>
                    </div>
                    <span className="font-serif text-lg text-ink tracking-tight">knowledge</span>
                </div>

                {/* — Nav — */}
                <nav className="flex-1 overflow-y-auto px-3 pt-2 pb-4 space-y-0.5">
                    <p className="label px-3 pt-4 pb-1">notes</p>
                    <NavItem to="/dashboard" label="All notes" id="nav-all"
                        onClick={() => handleFilter('active')} />
                    <div className="sidebar-link" id="nav-pinned"
                        onClick={() => { handleFilter('pinned'); navigate('/dashboard') }}>
                        <span className="flex-1">Pinned</span>
                    </div>
                    <div className="sidebar-link" id="nav-archived"
                        onClick={() => { handleFilter('archived'); navigate('/dashboard') }}>
                        <span className="flex-1">Archive</span>
                    </div>

                    <p className="label px-3 pt-6 pb-1">library</p>
                    <NavItem to="/links" label="Links" id="nav-links" />
                    <NavItem to="/files" label="Files" id="nav-files" />
                    <NavItem to="/trash" label="Trash" id="nav-trash" />
                    <NavItem to="/export" label="Export" id="nav-export" />

                    {tags.length > 0 && (
                        <>
                            <p className="label px-3 pt-6 pb-1">tags</p>
                            {tags.map((t) => (
                                <button
                                    key={t.id}
                                    id={`nav-tag-${t.id}`}
                                    onClick={() => handleTag(t.name)}
                                    className={`sidebar-link w-full text-left ${activeTag === t.name ? 'active' : ''}`}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                                    <span className="truncate">{t.name}</span>
                                </button>
                            ))}
                        </>
                    )}
                </nav>

                {/* — Footer — */}
                <div className="px-3 py-3 border-t border-border space-y-1">
                    <button id="toggle-dark" onClick={toggleDark} className="sidebar-link w-full">
                        <span className="flex-1">{dark ? 'Light mode' : 'Dark mode'}</span>
                        <div className={`w-8 h-4.5 rounded-full relative transition-colors duration-200 ${dark ? 'bg-accent' : 'bg-surface-3'}`}>
                            <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${dark ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </div>
                    </button>
                    <NavItem to="/profile" label="Settings" id="nav-profile" />

                    <div className="flex items-center gap-3 px-3 py-2.5 mt-2 rounded-xl bg-surface-2/60">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-accent-ink shrink-0"
                            style={{ background: 'var(--accent)' }}>
                            {initial}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink truncate">{user?.username}</p>
                            <p className="text-2xs text-ink-faint font-mono truncate">{user?.email}</p>
                        </div>
                        <button id="logout-btn" onClick={handleLogout} title="Sign out"
                            className="text-ink-ghost hover:text-danger transition-colors p-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                            </svg>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    )
}
