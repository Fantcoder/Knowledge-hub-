import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute() {
    const { isAuthenticated, isLoading } = useAuth()

    // While checking/restoring the session on page reload, show loader instead of immediately redirecting to /login
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-surface-0">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
        )
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}