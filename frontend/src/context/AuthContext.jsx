import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'
import { setApiToken } from '../services/api'

const AuthContext = createContext(null)

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

// Extract only user-identity fields from AuthResponse — not tokenType or accessToken
function extractUser(responseData) {
    return {
        userId: responseData.userId,
        username: responseData.username,
        email: responseData.email,
    }
}

export function AuthProvider({ children }) {
    const [state, dispatch] = useReducer(authReducer, initialState)

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const { data } = await authService.refresh()
                const { accessToken } = data.data
                const user = extractUser(data.data)
                localStorage.setItem('user', JSON.stringify(user))
                setApiToken(accessToken)
                dispatch({ type: 'LOGIN_SUCCESS', payload: { accessToken, user } })
            } catch {
                localStorage.removeItem('user')
                dispatch({ type: 'LOGOUT' })
            }
        }
        restoreSession()
    }, [])

    const login = useCallback(async (credentials) => {
        dispatch({ type: 'SET_LOADING', payload: true })
        try {
            const { data } = await authService.login(credentials)
            const { accessToken } = data.data
            const user = extractUser(data.data)
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

    const googleLogin = useCallback(async (idToken) => {
        dispatch({ type: 'SET_LOADING', payload: true })
        try {
            const { data } = await authService.googleLogin(idToken)
            const { accessToken } = data.data
            const user = extractUser(data.data)
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

    const register = useCallback(async (formData) => {
        dispatch({ type: 'SET_LOADING', payload: true })
        try {
            const { data } = await authService.register(formData)
            const { accessToken } = data.data
            const user = extractUser(data.data)
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

    const logout = useCallback(async () => {
        try {
            await authService.logout()
        } catch (_) {
            // ignore errors — clean up locally anyway
        } finally {
            setApiToken(null)
            localStorage.removeItem('user')
            dispatch({ type: 'LOGOUT' })
        }
    }, [])

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
