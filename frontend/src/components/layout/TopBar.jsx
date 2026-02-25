import { useNavigate } from 'react-router-dom'
import { useNotes } from '../../context/NotesContext'
import SearchBar from '../common/SearchBar'

export default function TopBar({ onMenuClick }) {
    const navigate = useNavigate()
    const { viewMode, dispatch } = useNotes()

    return (
        <header className="h-14 flex items-center gap-4 px-6 lg:px-10 border-b border-border bg-surface-0/80 backdrop-blur-md sticky top-0 z-10">
            {/* Mobile hamburger */}
            <button id="menu-toggle" onClick={onMenuClick} className="lg:hidden p-1 text-ink-muted hover:text-ink transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
            </button>

            <SearchBar />

            <div className="flex-1" />

            {/* View toggle */}
            <div className="hidden sm:flex items-center gap-0.5 p-0.5 rounded-lg bg-surface-2">
                <button
                    id="view-grid"
                    onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'grid' })}
                    className={`p-1.5 rounded-md transition-all duration-150 ${viewMode === 'grid' ? 'bg-surface-1 text-ink shadow-sm' : 'text-ink-faint hover:text-ink-muted'}`}
                >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                        <rect x="1" y="1" width="6" height="6" rx="1" />
                        <rect x="9" y="1" width="6" height="6" rx="1" />
                        <rect x="1" y="9" width="6" height="6" rx="1" />
                        <rect x="9" y="9" width="6" height="6" rx="1" />
                    </svg>
                </button>
                <button
                    id="view-list"
                    onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'list' })}
                    className={`p-1.5 rounded-md transition-all duration-150 ${viewMode === 'list' ? 'bg-surface-1 text-ink shadow-sm' : 'text-ink-faint hover:text-ink-muted'}`}
                >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                        <rect x="1" y="2" width="14" height="2.5" rx="0.75" />
                        <rect x="1" y="6.75" width="14" height="2.5" rx="0.75" />
                        <rect x="1" y="11.5" width="14" height="2.5" rx="0.75" />
                    </svg>
                </button>
            </div>

            {/* New note */}
            <button id="topbar-new-note" onClick={() => navigate('/notes/new')} className="btn-primary text-sm py-2">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="hidden sm:inline">New note</span>
            </button>
        </header>
    )
}
