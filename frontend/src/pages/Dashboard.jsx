import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, FileText, Activity, Sparkles } from 'lucide-react'
import { useNotes } from '../context/NotesContext'
import NoteGrid from '../components/notes/NoteGrid'
import TagFilter from '../components/tags/TagFilter'
import { tagService } from '../services/tagService'

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

function BentoCard({ title, value, subtitle, icon: Icon, className = "", delay = 0 }) {
    return (
        <motion.div
            variants={itemVariants}
            className={`card p-6 flex flex-col justify-between overflow-hidden relative group backdrop-blur-md bg-surface-1/60 ${className}`}
        >
            <div className="absolute -right-6 -top-6 text-ink-ghost/10 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">
                <Icon size={120} />
            </div>
            <div>
                <div className="flex items-center gap-2 text-ink-muted mb-2 font-mono text-xs uppercase tracking-widest">
                    <Icon size={14} className="text-accent" />
                    {title}
                </div>
                <div className="font-serif text-4xl text-ink tracking-tight">{value}</div>
            </div>
            {subtitle && <div className="text-sm text-ink-faint mt-4">{subtitle}</div>}
        </motion.div>
    )
}

export default function Dashboard() {
    const {
        fetchNotes, notes, activeFilter, activeTag, searchQuery,
        hasMore, isLoading, loadMore, totalElements
    } = useNotes()
    const navigate = useNavigate()
    const [tags, setTags] = useState([])

    useEffect(() => { fetchNotes(activeFilter, activeTag) }, [activeFilter, activeTag])
    useEffect(() => { tagService.getAll().then((r) => setTags(r.data.data || [])).catch(() => { }) }, [])

    const isDefaultView = activeFilter === 'active' && !activeTag && !searchQuery
    const displayedPinned = isDefaultView ? notes.filter(n => n.isPinned && !n.isDeleted && !n.isArchived) : []
    const displayedRecent = isDefaultView ? notes.filter(n => !n.isPinned) : notes

    const title = searchQuery ? 'Search results'
        : activeTag ? `#${activeTag}`
            : { active: 'Dashboard', archived: 'Archive', deleted: 'Trash', pinned: 'Pinned' }[activeFilter] || 'Dashboard'

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8 pb-12"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-baseline justify-between">
                <div>
                    <h1 className="font-serif text-4xl md:text-5xl text-ink tracking-tight mb-2">{title}</h1>
                    {searchQuery && (
                        <p className="text-sm text-ink-faint">
                            for "<span className="text-accent">{searchQuery}</span>"
                        </p>
                    )}
                </div>
                {totalElements > 0 && (
                    <div className="px-3 py-1 rounded-full bg-surface-2 text-xs font-medium text-ink-muted shadow-sm">
                        {totalElements} {totalElements === 1 ? 'record' : 'records'}
                    </div>
                )}
            </motion.div>

            {/* Bento Box Stats (Only on true default dashboard) */}
            {isDefaultView && !isLoading && (
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <BentoCard
                        title="Total Brain"
                        value={totalElements}
                        subtitle="Notes captured"
                        icon={Brain}
                        className="md:col-span-1"
                    />
                    <BentoCard
                        title="Organization"
                        value={tags.length}
                        subtitle="Active semantic tags"
                        icon={Sparkles}
                        className="md:col-span-1"
                    />
                    <motion.div
                        variants={itemVariants}
                        onClick={() => navigate('/graph')}
                        className="card p-6 md:col-span-1 border-accent/20 bg-accent-soft hover:bg-accent/10 cursor-pointer flex flex-col items-center justify-center text-center group transition-colors"
                    >
                        <Activity className="text-accent mb-3 group-hover:scale-110 transition-transform" size={32} />
                        <h3 className="font-serif text-xl text-ink">Enter Graph View</h3>
                        <p className="text-xs text-ink-faint mt-1">Visualize your mind</p>
                    </motion.div>
                </motion.div>
            )}

            {/* Tags */}
            {tags.length > 0 && activeFilter === 'active' && !searchQuery && (
                <motion.div variants={itemVariants}>
                    <TagFilter tags={tags} />
                </motion.div>
            )}

            {/* Pinned */}
            {displayedPinned.length > 0 && (
                <motion.section variants={itemVariants}>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-accent animate-pulse-soft" />
                        <p className="label !mb-0">pinned thoughts</p>
                    </div>
                    <NoteGrid notes={displayedPinned} />
                </motion.section>
            )}

            {/* Notes */}
            <motion.section variants={itemVariants}>
                {displayedPinned.length > 0 && (
                    <p className="label mb-4 mt-8">recent activity</p>
                )}
                <NoteGrid
                    notes={displayedRecent}
                    emptyTitle={activeFilter === 'active' ? 'A blank page' : activeFilter === 'archived' ? 'Nothing archived' : 'Empty'}
                    emptyDescription={activeFilter === 'active' ? 'Start writing. Your first note is one click away.' : ''}
                />
            </motion.section>

            {/* Load More */}
            {hasMore && (
                <motion.div variants={itemVariants} className="flex justify-center pt-8">
                    <button
                        onClick={loadMore}
                        disabled={isLoading}
                        className="btn-secondary rounded-full px-8 py-3 shadow-sm hover:shadow-md"
                    >
                        {isLoading ? 'Loading deep thoughts...' : 'Dive deeper'}
                    </button>
                </motion.div>
            )}
        </motion.div>
    )
}
