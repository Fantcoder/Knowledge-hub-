import axios from 'axios'
import { API_BASE_URL } from '../utils/constants'

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
    // No withCredentials needed — we use localStorage for the refresh token,
    // not cookies. This avoids cross-domain cookie blocking (Vercel vs Render).
})

// --- Access token injection --------------------------------------------------
// accessToken stays in React memory (set via setApiToken after login/refresh).
// It is never written to localStorage — memory-only tokens cannot be read by XSS.

let _accessToken = null

export function setApiToken(token) {
    _accessToken = token
    if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`
    } else {
        delete api.defaults.headers.common.Authorization
    }
}

api.interceptors.request.use(
    (config) => {
        if (_accessToken) {
            config.headers.Authorization = `Bearer ${_accessToken}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// --- Silent token refresh on 401 --------------------------------------------
// When the access token expires the backend returns 401.
// We intercept it, use the refreshToken from localStorage to get a new
// accessToken from /api/auth/refresh, then replay the original request.

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error)
        else prom.resolve(token)
    })
    failedQueue = []
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config
        const isAuthError = error.response?.status === 401 || error.response?.status === 403

        if (isAuthError && !originalRequest._retry) {
            // Never retry auth endpoints themselves — prevents infinite loops
            if (originalRequest.url?.includes('/auth/')) {
                return Promise.reject(error)
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`
                        return api(originalRequest)
                    })
                    .catch((err) => Promise.reject(err))
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
                const storedRefreshToken = localStorage.getItem('refreshToken')
                if (!storedRefreshToken) {
                    throw new Error('No refresh token in storage')
                }

                const response = await axios.post(
                    `${API_BASE_URL}/auth/refresh`,
                    { refreshToken: storedRefreshToken }
                )
                const { accessToken, refreshToken: newRefreshToken } = response.data.data

                // Rotate the stored refresh token
                localStorage.setItem('refreshToken', newRefreshToken)
                setApiToken(accessToken)
                processQueue(null, accessToken)

                originalRequest.headers.Authorization = `Bearer ${accessToken}`
                return api(originalRequest)
            } catch (refreshError) {
                processQueue(refreshError, null)
                clearAuthAndRedirect()
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)

function clearAuthAndRedirect() {
    setApiToken(null)
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    window.location.href = '/login'
}

export default api