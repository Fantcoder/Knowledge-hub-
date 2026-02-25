import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function Profile() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [dark, setDark] = useState(localStorage.getItem('darkMode') === 'true')

    const handleLogout = async () => {
        await logout()
        navigate('/login')
        toast.success('Signed out')
    }

    const toggleDark = () => {
        const next = !dark
        setDark(next)
        localStorage.setItem('darkMode', String(next))
        document.documentElement.classList.toggle('dark', next)
    }

    const initial = user?.username?.[0]?.toUpperCase() || '?'

    return (
        <div className="animate-in max-w-lg space-y-6">
            <h1 className="font-serif text-3xl text-ink">Settings</h1>

            {/* User */}
            <div className="card p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-accent-ink shrink-0"
                    style={{ background: 'var(--accent)' }}>
                    {initial}
                </div>
                <div>
                    <p className="text-lg font-medium text-ink">{user?.username}</p>
                    <p className="text-sm text-ink-faint font-mono">{user?.email}</p>
                </div>
            </div>

            {/* Preferences */}
            <div className="card divide-y divide-border">
                <div className="flex items-center justify-between p-5">
                    <div>
                        <p className="text-sm font-medium text-ink">Theme</p>
                        <p className="text-2xs text-ink-faint mt-0.5">Switch between light and dark</p>
                    </div>
                    <button id="profile-dark-toggle" onClick={toggleDark}
                        className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${dark ? 'bg-accent' : 'bg-surface-3'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${dark ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                </div>

                <div className="p-5">
                    <p className="text-sm font-medium text-ink mb-0.5">Account ID</p>
                    <p className="text-2xs text-ink-faint font-mono">{user?.userId}</p>
                </div>
            </div>

            {/* Actions */}
            <div className="card p-5">
                <button id="profile-logout" onClick={handleLogout}
                    className="w-full text-left text-sm font-medium text-danger hover:bg-danger-soft px-3 py-2.5 rounded-xl transition-colors">
                    Sign out
                </button>
            </div>

            <p className="text-center text-2xs text-ink-ghost font-mono pb-4">
                knowledge · hub v1.0
            </p>
        </div>
    )
}
