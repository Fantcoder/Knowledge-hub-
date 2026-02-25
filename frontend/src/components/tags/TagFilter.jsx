import { useNotes } from '../../context/NotesContext'

export default function TagFilter({ tags }) {
    const { activeTag, dispatch, fetchNotes } = useNotes()

    const handleClick = (name) => {
        const next = activeTag === name ? null : name
        dispatch({ type: 'SET_TAG_FILTER', payload: next })
        fetchNotes('active', next)
    }

    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            {tags.map((t) => (
                <button
                    key={t.id || t.name}
                    id={`tag-filter-${t.name}`}
                    onClick={() => handleClick(t.name)}
                    className={`tag cursor-pointer ${activeTag === t.name ? 'active' : ''}`}
                >
                    {t.name}
                </button>
            ))}
            {activeTag && (
                <button onClick={() => handleClick(activeTag)}
                    className="text-2xs font-mono text-ink-faint hover:text-ink transition-colors ml-1">
                    clear
                </button>
            )}
        </div>
    )
}
