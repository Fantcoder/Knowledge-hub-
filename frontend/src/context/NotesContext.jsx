import { createContext, useContext, useReducer, useCallback, useRef } from 'react'
import { noteService } from '../services/noteService'
import toast from 'react-hot-toast'

const NotesContext = createContext(null)

const initialState = {
    notes: [],
    selectedNote: null,
    tags: [],
    isLoading: false,
    searchQuery: '',
    activeFilter: 'active',
    activeTag: null,
    viewMode: localStorage.getItem('viewMode') || 'grid',
}

function notesReducer(state, action) {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload }
        case 'SET_NOTES':
            return { ...state, notes: action.payload, isLoading: false }
        case 'SET_SELECTED_NOTE':
            return { ...state, selectedNote: action.payload }
        case 'SET_TAGS':
            return { ...state, tags: action.payload }
        case 'ADD_NOTE':
            return { ...state, notes: [action.payload, ...state.notes] }
        case 'UPDATE_NOTE':
            return {
                ...state,
                notes: state.notes.map((n) =>
                    n.id === action.payload.id ? action.payload : n
                ),
                selectedNote:
                    state.selectedNote?.id === action.payload.id
                        ? action.payload
                        : state.selectedNote,
            }
        case 'REMOVE_NOTE':
            return { ...state, notes: state.notes.filter((n) => n.id !== action.payload) }
        case 'SET_SEARCH':
            return { ...state, searchQuery: action.payload }
        case 'SET_FILTER':
            return { ...state, activeFilter: action.payload, activeTag: null }
        case 'SET_TAG_FILTER':
            return { ...state, activeTag: action.payload, activeFilter: 'active' }
        case 'SET_VIEW_MODE':
            localStorage.setItem('viewMode', action.payload)
            return { ...state, viewMode: action.payload }
        default:
            return state
    }
}

export function NotesProvider({ children }) {
    const [state, dispatch] = useReducer(notesReducer, initialState)

    const fetchRequestId = useRef(0)

    const fetchNotes = useCallback(async (filter, tag) => {
        const currentId = ++fetchRequestId.current
        dispatch({ type: 'SET_LOADING', payload: true })
        try {
            const params = {}
            if (filter && filter !== 'active') params.filter = filter
            if (tag) params.tag = tag
            const res = await noteService.getAll(params)
            // Ignore if a newer request has started
            if (currentId !== fetchRequestId.current) return
            dispatch({ type: 'SET_NOTES', payload: res.data.data || [] })
        } catch (err) {
            if (currentId !== fetchRequestId.current) return
            dispatch({ type: 'SET_LOADING', payload: false })
            toast.error('Failed to load notes')
        }
    }, [])

    const searchNotes = useCallback(async (query, tag) => {
        dispatch({ type: 'SET_LOADING', payload: true })
        try {
            const res = await noteService.search({ q: query, tag })
            dispatch({ type: 'SET_NOTES', payload: res.data.data || [] })
        } catch {
            dispatch({ type: 'SET_LOADING', payload: false })
        }
    }, [])

    const deleteNote = useCallback(async (id) => {
        try {
            await noteService.delete(id)
            dispatch({ type: 'REMOVE_NOTE', payload: id })
            toast.success('Note moved to trash')
        } catch {
            toast.error('Failed to delete note')
        }
    }, [])

    const permanentDeleteNote = useCallback(async (id) => {
        try {
            await noteService.permanentDelete(id)
            dispatch({ type: 'REMOVE_NOTE', payload: id })
            toast.success('Note permanently deleted')
        } catch {
            toast.error('Failed to delete note')
        }
    }, [])

    const restoreNote = useCallback(async (id) => {
        try {
            const res = await noteService.restore(id)
            dispatch({ type: 'REMOVE_NOTE', payload: id })
            toast.success('Note restored')
        } catch {
            toast.error('Failed to restore note')
        }
    }, [])

    const togglePin = useCallback(async (id) => {
        try {
            const res = await noteService.pin(id)
            dispatch({ type: 'UPDATE_NOTE', payload: res.data.data })
        } catch {
            toast.error('Failed to update note')
        }
    }, [])

    const toggleArchive = useCallback(async (id) => {
        try {
            const res = await noteService.archive(id)
            dispatch({ type: 'REMOVE_NOTE', payload: id })
            toast.success(res.data.data.isArchived ? 'Note archived' : 'Note unarchived')
        } catch {
            toast.error('Failed to archive note')
        }
    }, [])

    return (
        <NotesContext.Provider
            value={{
                ...state,
                dispatch,
                fetchNotes,
                searchNotes,
                deleteNote,
                permanentDeleteNote,
                restoreNote,
                togglePin,
                toggleArchive,
            }}
        >
            {children}
        </NotesContext.Provider>
    )
}

export const useNotes = () => {
    const ctx = useContext(NotesContext)
    if (!ctx) throw new Error('useNotes must be used within NotesProvider')
    return ctx
}
