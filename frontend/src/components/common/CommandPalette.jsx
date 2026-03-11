import { useEffect, useState } from 'react'
import { Command } from 'cmdk'
import { useNavigate } from 'react-router-dom'
import { Search, FileText, Settings, Activity, Compass, Brain, Plus } from 'lucide-react'
import { useNotes } from '../../context/NotesContext'

export default function CommandPalette() {
    const [open, setOpen] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const navigate = useNavigate()
    const { fetchNotes, setSearchQuery } = useNotes()

    useEffect(() => {
        const down = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }
        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [])

    const runCommand = (command) => {
        setOpen(false)
        command()
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
            <div
                className="fixed inset-0 bg-ink/30 backdrop-blur-sm"
                onClick={() => setOpen(false)}
            />

            <Command
                className="relative w-full max-w-xl bg-surface-1 backdrop-blur-md rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
                shouldFilter={false} // Filter manually if needed, or rely on cmdk default
            >
                <div className="flex items-center px-4 py-3 border-b border-border">
                    <Search className="h-5 w-5 text-ink-faint mr-3" />
                    <Command.Input
                        autoFocus
                        placeholder="Type a command or search..."
                        value={inputValue}
                        onValueChange={setInputValue}
                        className="flex-1 bg-transparent text-ink placeholder:text-ink-ghost outline-none font-sans text-sm"
                    />
                    <div className="text-[10px] text-ink-ghost font-mono border border-border px-1.5 py-0.5 rounded">ESC</div>
                </div>

                <Command.List className="max-h-[300px] overflow-y-auto px-2 py-2">
                    <Command.Empty className="py-6 text-center text-sm text-ink-muted">
                        No results found.
                    </Command.Empty>

                    <Command.Group heading="Actions" className="py-1 text-xs font-mono tracking-widest text-ink-faint px-2 mb-2">
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/notes/new'))}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-ink rounded-lg cursor-pointer hover:bg-accent-soft hover:text-accent outline-none aria-selected:bg-accent-soft aria-selected:text-accent transition-colors"
                        >
                            <Plus size={16} /> Create new note
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => {
                                // Just a dummy trigger to search
                                setSearchQuery(inputValue)
                                navigate('/dashboard')
                            })}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-ink rounded-lg cursor-pointer hover:bg-accent-soft hover:text-accent outline-none aria-selected:bg-accent-soft aria-selected:text-accent transition-colors"
                        >
                            <Search size={16} /> Search all notes for "{inputValue || '...'}"
                        </Command.Item>
                    </Command.Group>

                    <Command.Group heading="Navigation" className="py-1 text-xs font-mono tracking-widest text-ink-faint px-2 mb-2">
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/dashboard'))}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-ink rounded-lg cursor-pointer hover:bg-accent-soft hover:text-accent outline-none aria-selected:bg-accent-soft aria-selected:text-accent transition-colors"
                        >
                            <Compass size={16} /> Dashboard
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/graph'))}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-ink rounded-lg cursor-pointer hover:bg-accent-soft hover:text-accent outline-none aria-selected:bg-accent-soft aria-selected:text-accent transition-colors"
                        >
                            <Activity size={16} /> Open Knowledge Graph
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/profile'))}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-ink rounded-lg cursor-pointer hover:bg-accent-soft hover:text-accent outline-none aria-selected:bg-accent-soft aria-selected:text-accent transition-colors"
                        >
                            <Settings size={16} /> Settings
                        </Command.Item>
                    </Command.Group>
                </Command.List>
            </Command>

            <style dangerouslySetInnerHTML={{
                __html: `
                [cmdk-group-heading] {
                    margin-bottom: 4px;
                    padding-left: 8px;
                }
            `}} />
        </div>
    )
}
