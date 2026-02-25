import { useState, useEffect, useRef } from 'react'
import { useNotes } from '../../context/NotesContext'
import { useDebounce } from '../../hooks/useDebounce'

export default function SearchBar() {
    const [query, setQuery] = useState('')
    const [focused, setFocused] = useState(false)
    const debouncedQuery = useDebounce(query, 400)
    const { searchNotes, fetchNotes, dispatch, activeFilter, activeTag } = useNotes()
    const inputRef = useRef(null)
    const isFirst = useRef(true)

    useEffect(() => {
        if (isFirst.current) { isFirst.current = false; return }
        if (debouncedQuery.trim()) {
            dispatch({ type: 'SET_SEARCH', payload: debouncedQuery })
            searchNotes(debouncedQuery, activeTag)
        } else {
            dispatch({ type: 'SET_SEARCH', payload: '' })
            fetchNotes(activeFilter, activeTag)
        }
    }, [debouncedQuery])

    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                inputRef.current?.focus()
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [])

    return (
        <div className={`relative flex items-center transition-all duration-300 ease-out-expo ${focused ? 'w-72' : 'w-56'}`}>
            <svg className="absolute left-3 w-3.5 h-3.5 text-ink-ghost pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
                ref={inputRef}
                id="search-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Search… ⌘K"
                className="w-full pl-9 pr-8 py-1.5 text-sm bg-surface-2 rounded-lg text-ink placeholder:text-ink-ghost border border-transparent focus:border-accent focus:bg-surface-1 outline-none transition-all duration-200"
            />
            {query && (
                <button id="search-clear" onClick={() => setQuery('')}
                    className="absolute right-2.5 text-ink-ghost hover:text-ink transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    )
}
