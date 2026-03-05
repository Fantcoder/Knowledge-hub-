import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { NotesProvider } from './context/NotesContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import ProtectedRoute from './components/common/ProtectedRoute'
import Layout from './components/layout/Layout'
import QuickCapture from './components/capture/QuickCapture'
import AiChatPanel from './components/ai/AiChatPanel'
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
    const [quickCaptureOpen, setQuickCaptureOpen] = useState(false)
    const [aiChatOpen, setAiChatOpen] = useState(false)

    // Global keyboard shortcut: Ctrl+Shift+K → Quick Capture
    const handleGlobalShortcuts = useCallback((e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
            e.preventDefault()
            setQuickCaptureOpen(prev => !prev)
        }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
            e.preventDefault()
            setAiChatOpen(prev => !prev)
        }
    }, [])

    useEffect(() => {
        window.addEventListener('keydown', handleGlobalShortcuts)
        return () => window.removeEventListener('keydown', handleGlobalShortcuts)
    }, [handleGlobalShortcuts])

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

                        {/* Quick Capture Modal — Ctrl+Shift+K */}
                        <QuickCapture
                            isOpen={quickCaptureOpen}
                            onClose={() => setQuickCaptureOpen(false)}
                        />

                        {/* AI Chat Panel — Ctrl+Shift+L */}
                        <AiChatPanel
                            isOpen={aiChatOpen}
                            onClose={() => setAiChatOpen(false)}
                        />

                        {/* Floating AI Chat Button */}
                        <button
                            onClick={() => setAiChatOpen(true)}
                            className="fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full 
                                       bg-accent text-accent-ink shadow-lg hover:shadow-xl 
                                       hover:scale-105 active:scale-95 transition-all duration-200
                                       flex items-center justify-center text-xl"
                            title="Ask your brain (Ctrl+Shift+L)"
                        >
                            🧠
                        </button>

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
