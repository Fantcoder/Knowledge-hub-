import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'
import { setApiToken } from '../services/api'

const AuthContext = createContext(null)

// ─── State ────────────────────────────────────────────────────────────────────
// accessToken  → React memory only (not localStorage, cannot be read by XSS)
// refreshToken → localStorage (needed to survive page reload; rotated on every use)
// user         → localStorage (non-sensitive: userId, username, email only)

const initialState = {
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
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

// Extract only identity fields from the AuthResponse DTO.
// AuthResponse: { accessToken, refreshToken, tokenType, userId, username, email }
// We store only userId/username/email in localStorage — never tokens in user object.
function extractUser(data) {
    return { userId: data.userId, username: data.username, email: data.email }
}

function saveSession(accessToken, refreshToken, user) {
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(user))
    setApiToken(accessToken)
}

function clearSession() {
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setApiToken(null)
}

export function AuthProvider({ children }) {
    const [state, dispatch] = useReducer(authReducer, initialState)

    // ─── Silent session restore on page reload ────────────────────────────────
    // On reload, React memory is wiped but localStorage persists.
    // We read the refreshToken from localStorage and call /api/auth/refresh to
    // get a fresh accessToken, restoring the session transparently.
    useEffect(() => {
        const restoreSession = async () => {
            const storedRefreshToken = localStorage.getItem('refreshToken')
            if (!storedRefreshToken) {
                dispatch({ type: 'LOGOUT' })
                return
            }
            try {
                const { data } = await authService.refresh(storedRefreshToken)
                const { accessToken, refreshToken } = data.data
                const user = extractUser(data.data)
                saveSession(accessToken, refreshToken, user)
                dispatch({ type: 'LOGIN_SUCCESS', payload: { accessToken, user } })
            } catch {
                // Refresh token invalid or expired — clear everything
                clearSession()
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
            const { accessToken, refreshToken } = data.data
            const user = extractUser(data.data)
            saveSession(accessToken, refreshToken, user)
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
            const { accessToken, refreshToken } = data.data
            const user = extractUser(data.data)
            saveSession(accessToken, refreshToken, user)
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
            const { accessToken, refreshToken } = data.data
            const user = extractUser(data.data)
            saveSession(accessToken, refreshToken, user)
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
            await authService.logout()
        } catch (_) {
            // ignore network errors — clean up locally anyway
        } finally {
            clearSession()
            dispatch({ type: 'LOGOUT' })
        }
    }, [])

    // ─── Dark mode ────────────────────────────────────────────────────────────
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