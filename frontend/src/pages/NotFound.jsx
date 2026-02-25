import { Link } from 'react-router-dom'

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-0 p-8">
            <div className="text-center max-w-sm">
                <p className="text-6xl font-serif text-ink-ghost mb-4">404</p>
                <h1 className="font-serif text-2xl text-ink mb-2">Page not found</h1>
                <p className="text-sm text-ink-faint mb-6">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <Link to="/dashboard" className="btn-primary text-sm inline-flex">
                    Back to dashboard
                </Link>
            </div>
        </div>
    )
}
