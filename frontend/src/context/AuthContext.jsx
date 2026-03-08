import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

const initialState = {
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    isAuthenticated: !!localStorage.getItem('accessToken'),
    isLoading: false,
}

function authReducer(state, action) {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload }
        case 'LOGIN_SUCCESS':
            return { ...state, user: action.payload, isAuthenticated: true, isLoading: false }
        case 'LOGOUT':
            return { ...state, user: null, isAuthenticated: false, isLoading: false }
        default:
            return state
    }
}

export function AuthProvider({ children }) {
    const [state, dispatch] = useReducer(authReducer, initialState)

    const login = useCallback(async (credentials) => {
        dispatch({ type: 'SET_LOADING', payload: true })
        try {
            const { data } = await authService.login(credentials)
            const { accessToken, refreshToken, ...user } = data.data
            localStorage.setItem('accessToken', accessToken)
            localStorage.setItem('refreshToken', refreshToken)
            localStorage.setItem('user', JSON.stringify(user))
            dispatch({ type: 'LOGIN_SUCCESS', payload: user })
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
            const { accessToken, refreshToken, ...user } = data.data
            localStorage.setItem('accessToken', accessToken)
            localStorage.setItem('refreshToken', refreshToken)
            localStorage.setItem('user', JSON.stringify(user))
            dispatch({ type: 'LOGIN_SUCCESS', payload: user })
            return { success: true }
        } catch (error) {
            dispatch({ type: 'SET_LOADING', payload: false })
            const msg = error.response?.data?.error || 'Google Login failed.'
            return { success: false, message: msg }
        }
    }, [])

    const register = useCallback(async (data) => {
        dispatch({ type: 'SET_LOADING', payload: true })
        try {
            const { data: res } = await authService.register(data)
            const { accessToken, refreshToken, ...user } = res.data
            localStorage.setItem('accessToken', accessToken)
            localStorage.setItem('refreshToken', refreshToken)
            localStorage.setItem('user', JSON.stringify(user))
            dispatch({ type: 'LOGIN_SUCCESS', payload: user })
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
            // ignore
        } finally {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('user')
            dispatch({ type: 'LOGOUT' })
        }
    }, [])

    // Apply dark mode on first load
    useEffect(() => {
        const dark = localStorage.getItem('darkMode') === 'true'
        if (dark) document.documentElement.classList.add('dark')
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
