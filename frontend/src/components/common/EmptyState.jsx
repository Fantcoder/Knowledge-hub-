export default function EmptyState({ icon, title, description, action }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 animate-in">
            {icon && <span className="text-4xl mb-4 opacity-40">{icon}</span>}
            <h3 className="font-serif text-xl text-ink mb-1">{title}</h3>
            {description && <p className="text-sm text-ink-faint max-w-xs text-center">{description}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    )
}
