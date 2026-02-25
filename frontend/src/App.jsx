import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { NotesProvider } from './context/NotesContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import ProtectedRoute from './components/common/ProtectedRoute'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import NoteCreate from './pages/NoteCreate'
import NoteEdit from './pages/NoteEdit'
import NoteView from './pages/NoteView'
import Links from './pages/Links'
import Files from './pages/Files'
import Trash from './pages/Trash'
import Profile from './pages/Profile'
import ExportData from './pages/ExportData'
import NotFound from './pages/NotFound'

export default function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <AuthProvider>
                    <NotesProvider>
                        <Toaster
                            position="bottom-right"
                            toastOptions={{
                                duration: 3000,
                                style: {
                                    borderRadius: '12px',
                                    fontFamily: '"DM Sans", sans-serif',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    background: 'var(--surface-1)',
                                    color: 'var(--ink)',
                                    border: '1px solid var(--border)',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                                },
                                success: { iconTheme: { primary: 'var(--accent)', secondary: 'var(--accent-ink)' } },
                                error: { iconTheme: { primary: '#e55353', secondary: '#fff' } },
                            }}
                        />
                        <Routes>
                            {/* Public */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />

                            {/* Protected */}
                            <Route element={<ProtectedRoute />}>
                                <Route element={<Layout />}>
                                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                    <Route path="/dashboard" element={<Dashboard />} />
                                    <Route path="/notes/new" element={<NoteCreate />} />
                                    <Route path="/notes/:id" element={<NoteView />} />
                                    <Route path="/notes/:id/edit" element={<NoteEdit />} />
                                    <Route path="/links" element={<Links />} />
                                    <Route path="/files" element={<Files />} />
                                    <Route path="/trash" element={<Trash />} />
                                    <Route path="/profile" element={<Profile />} />
                                    <Route path="/export" element={<ExportData />} />
                                </Route>
                            </Route>

                            {/* 404 */}
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </NotesProvider>
                </AuthProvider>
            </BrowserRouter>
        </ErrorBoundary>
    )
}
