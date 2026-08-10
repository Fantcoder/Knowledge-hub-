import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'
import { setApiToken } from '../services/api'

const AuthContext = createContext(null)

// ─── State ────────────────────────────────────────────────────────────────────
// accessToken lives in React memory only — NOT localStorage.
// refreshToken lives in an httpOnly cookie — JS cannot access it at all.
// On page reload, we restore the session via a silent /api/auth/refresh call
// (the browser sends the httpOnly cookie automatically).

const initialState = {
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    accessToken: null,          // in memory only — never touches localStorage
    isAuthenticated: false,     // confirmed via silent refresh on mount
    isLoading: true,            // start loading until silent refresh resolves
}

function authReducer(state, action) {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload }
        case 'LOGIN_SUCCESS':
            return {
                ...state,
                user: action.payload.user,
                accessToken: action.payload.accessToken,
                isAuthenticated: true,
                isLoading: false,
            }
        case 'LOGOUT':
            return { ...state, user: null, accessToken: null, isAuthenticated: false, isLoading: false }
        default:
            return state
    }
}

export function AuthProvider({ children }) {
    const [state, dispatch] = useReducer(authReducer, initialState)

    // ─── Silent session restore on page reload ────────────────────────────────
    // The browser automatically sends the httpOnly refreshToken cookie to /api/auth/refresh.
    // If it succeeds we get a fresh accessToken and restore the session transparently.
    useEffect(() => {
        const restoreSession = async () => {
            try {
                const { data } = await authService.refresh()
                const { accessToken, ...user } = data.data
                localStorage.setItem('user', JSON.stringify(user))
                setApiToken(accessToken)
                dispatch({ type: 'LOGIN_SUCCESS', payload: { accessToken, user } })
            } catch {
                // No valid cookie — user is not logged in. Clear stale user data.
                localStorage.removeItem('user')
                dispatch({ type: 'LOGOUT' })
            }
        }
        restoreSession()
    }, [])

    // ─── Login ────────────────────────────────────────────────────────────────
    const login = useCallback(async (credentials) => {
        dispatch({ type: 'SET_LOADING', payload: true })
        try {
            const { data } = await authService.login(credentials)
            // accessToken comes in the response body; refreshToken arrives as httpOnly cookie automatically
            const { accessToken, ...user } = data.data
            localStorage.setItem('user', JSON.stringify(user))
            setApiToken(accessToken)
            dispatch({ type: 'LOGIN_SUCCESS', payload: { accessToken, user } })
            return { success: true }
        } catch (error) {
            dispatch({ type: 'SET_LOADING', payload: false })
            const msg = error.response?.data?.error || 'Login failed. Please try again.'
            return { success: false, message: msg }
        }
    }, [])

    // ─── Google Login ─────────────────────────────────────────────────────────
    const googleLogin = useCallback(async (idToken) => {
        dispatch({ type: 'SET_LOADING', payload: true })
        try {
            const { data } = await authService.googleLogin(idToken)
            const { accessToken, ...user } = data.data
            localStorage.setItem('user', JSON.stringify(user))
            setApiToken(accessToken)
            dispatch({ type: 'LOGIN_SUCCESS', payload: { accessToken, user } })
            return { success: true }
        } catch (error) {
            dispatch({ type: 'SET_LOADING', payload: false })
            const msg = error.response?.data?.error || 'Google Login failed.'
            return { success: false, message: msg }
        }
    }, [])

    // ─── Register ─────────────────────────────────────────────────────────────
    const register = useCallback(async (formData) => {
        dispatch({ type: 'SET_LOADING', payload: true })
        try {
            const { data } = await authService.register(formData)
            const { accessToken, ...user } = data.data
            localStorage.setItem('user', JSON.stringify(user))
            setApiToken(accessToken)
            dispatch({ type: 'LOGIN_SUCCESS', payload: { accessToken, user } })
            return { success: true }
        } catch (error) {
            dispatch({ type: 'SET_LOADING', payload: false })
            const msg = error.response?.data?.error || 'Registration failed. Please try again.'
            return { success: false, message: msg }
        }
    }, [])

    // ─── Logout ───────────────────────────────────────────────────────────────
    const logout = useCallback(async () => {
        try {
            await authService.logout() // backend clears the httpOnly cookie via Set-Cookie: Max-Age=0
        } catch (_) {
            // ignore network errors — proceed with local cleanup anyway
        } finally {
            setApiToken(null)
            localStorage.removeItem('user')
            dispatch({ type: 'LOGOUT' })
        }
    }, [])

    // ─── Dark mode (unrelated to auth, but kept here) ─────────────────────────
    useEffect(() => {
        const theme = localStorage.getItem('theme') || 'dark'
        if (theme === 'dark') document.documentElement.classList.add('dark')
    }, [])

    return (
        <AuthContext.Provider value={{ ...state, login, googleLogin, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
