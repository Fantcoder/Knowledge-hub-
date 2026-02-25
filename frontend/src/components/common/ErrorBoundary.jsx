import { Component } from 'react'

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-surface-0 p-8">
                    <div className="text-center max-w-md">
                        <h1 className="font-serif text-3xl text-ink mb-2">Something went wrong</h1>
                        <p className="text-sm text-ink-faint mb-6">
                            An unexpected error occurred. Try refreshing the page.
                        </p>
                        <button
                            onClick={() => { this.setState({ hasError: false }); window.location.href = '/dashboard' }}
                            className="btn-primary text-sm"
                        >
                            Go to dashboard
                        </button>
                        {import.meta.env.DEV && this.state.error && (
                            <pre className="mt-6 text-left text-xs text-danger bg-danger-soft p-4 rounded-xl overflow-auto max-h-48">
                                {this.state.error.toString()}
                            </pre>
                        )}
                    </div>
                </div>
            )
        }
        return this.props.children
    }
}
