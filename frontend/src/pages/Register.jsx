import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

import { GoogleLogin } from '@react-oauth/google'

export default function Register() {
    const [form, setForm] = useState({ username: '', email: '', password: '' })
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const { register, googleLogin } = useAuth()
    const navigate = useNavigate()

    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true)
        try {
            await googleLogin(credentialResponse.credential)
            navigate('/dashboard')
            toast.success('Account created!')
        } catch (err) {
            toast.error('Google registration failed')
        } finally { setLoading(false) }
    }

    const pwStrength = (() => {
        const p = form.password
        if (!p) return { level: 0, label: '' }
        let s = 0
        if (p.length >= 8) s++
        if (/[A-Z]/.test(p)) s++
        if (/[0-9]/.test(p)) s++
        if (/[^A-Za-z0-9]/.test(p)) s++
        const labels = ['', 'weak', 'fair', 'good', 'strong']
        return { level: s, label: labels[s] }
    })()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
        setLoading(true)
        try {
            await register(form)
            navigate('/dashboard')
            toast.success('Account created!')
        } catch (err) {
            toast.error(err.response?.data?.error || 'Registration failed')
        } finally { setLoading(false) }
    }

    return (
        <div className="min-h-screen flex bg-surface-0">
            {/* Left — branding */}
            <div className="hidden lg:flex lg:w-1/2 items-center justify-center"
                style={{ background: 'var(--surface-2)' }}>
                <div className="max-w-sm text-center px-8">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
                        style={{ background: 'var(--accent)' }}>
                        <span className="text-xl font-bold text-accent-ink">K</span>
                    </div>
                    <h1 className="font-serif text-4xl text-ink mb-3">knowledge</h1>
                    <p className="text-ink-faint text-sm leading-relaxed">
                        Your second brain. Private notes, organized links,<br />
                        important files — all in one calm workspace.
                    </p>
                </div>
            </div>

            {/* Right — form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-sm animate-in-up">
                    <div className="mb-8">
                        <h2 className="font-serif text-2xl text-ink mb-1">Create your account</h2>
                        <p className="text-sm text-ink-faint">Start building your personal knowledge base</p>
                    </div>

                    <div className="flex justify-center mb-6">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => toast.error('Google register failed')}
                            theme="outline"
                            size="large"
                            text="signup_with"
                            width="250"
                        />
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-px bg-border flex-1"></div>
                        <span className="text-xs text-ink-ghost uppercase tracking-wider">or sign up with email</span>
                        <div className="h-px bg-border flex-1"></div>
                    </div>

                    <form id="register-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label" htmlFor="username">Username</label>
                            <input id="username" type="text" required value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                                className="input" placeholder="your name" autoComplete="username" />
                        </div>

                        <div>
                            <label className="label" htmlFor="email">Email</label>
                            <input id="email" type="email" required value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="input" placeholder="you@example.com" autoComplete="email" />
                        </div>

                        <div>
                            <label className="label" htmlFor="password">Password</label>
                            <div className="relative">
                                <input id="password" type={showPw ? 'text' : 'password'} required
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    className="input pr-10" placeholder="8+ characters" autoComplete="new-password" />
                                <button type="button" onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-ghost hover:text-ink-muted transition-colors text-xs font-mono">
                                    {showPw ? 'hide' : 'show'}
                                </button>
                            </div>

                            {/* Strength indicator */}
                            {form.password && (
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="flex gap-1 flex-1">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${i <= pwStrength.level
                                                ? pwStrength.level <= 1 ? 'bg-danger' : pwStrength.level <= 2 ? 'bg-yellow-500' : 'bg-green-500'
                                                : 'bg-surface-3'
                                                }`} />
                                        ))}
                                    </div>
                                    <span className="text-2xs font-mono text-ink-faint">{pwStrength.label}</span>
                                </div>
                            )}
                        </div>

                        <button id="register-submit" type="submit" disabled={loading}
                            className="btn-primary w-full py-3 text-sm mt-2">
                            {loading ? 'Creating…' : 'Create account'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-ink-faint mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-accent hover:text-accent-hover font-medium transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
