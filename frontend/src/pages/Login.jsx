import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
    const [form, setForm] = useState({ username: '', password: '' })
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await login(form)
            navigate('/dashboard')
        } catch (err) {
            toast.error(err.response?.data?.error || 'Invalid credentials')
        } finally { setLoading(false) }
    }

    return (
        <div className="min-h-screen flex bg-surface-0">
            {/* Left — branding */}
            <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative"
                style={{ background: 'var(--surface-2)' }}>
                <div className="max-w-sm text-center px-8">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
                        style={{ background: 'var(--accent)' }}>
                        <span className="text-xl font-bold text-accent-ink">K</span>
                    </div>
                    <h1 className="font-serif text-4xl text-ink mb-3">knowledge</h1>
                    <p className="text-ink-faint text-sm leading-relaxed">
                        A quiet space for your thoughts, links, and files.<br />
                        Private. Organized. Yours.
                    </p>
                </div>
                {/* Subtle decorative dots */}
                <div className="absolute bottom-8 left-8 text-2xs font-mono text-ink-ghost">
                    personal knowledge hub · v1.0
                </div>
            </div>

            {/* Right — form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-sm animate-in-up">
                    <div className="mb-8">
                        <h2 className="font-serif text-2xl text-ink mb-1">Welcome back</h2>
                        <p className="text-sm text-ink-faint">Sign in to continue</p>
                    </div>

                    <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label" htmlFor="username">Username</label>
                            <input id="username" type="text" required value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                                className="input" placeholder="your username" autoComplete="username" />
                        </div>

                        <div>
                            <label className="label" htmlFor="password">Password</label>
                            <div className="relative">
                                <input id="password" type={showPw ? 'text' : 'password'} required
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    className="input pr-10" placeholder="••••••••" autoComplete="current-password" />
                                <button type="button" onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-ghost hover:text-ink-muted transition-colors text-xs font-mono">
                                    {showPw ? 'hide' : 'show'}
                                </button>
                            </div>
                        </div>

                        <button id="login-submit" type="submit" disabled={loading}
                            className="btn-primary w-full py-3 text-sm mt-2">
                            {loading ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-ink-faint mt-6">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-accent hover:text-accent-hover font-medium transition-colors">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
