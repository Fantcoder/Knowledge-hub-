import axios from 'axios'
import { API_BASE_URL } from '../utils/constants'

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
    // withCredentials: true tells the browser to send httpOnly cookies automatically.
    // This is how the refreshToken cookie reaches /api/auth/refresh without JS touching it.
    withCredentials: true,
})

// ─── Access token injection ────────────────────────────────────────────────────
// accessToken is stored in React state (memory), not localStorage.
// Components that need authenticated requests call setApiToken(token) after login.
// This is much safer than localStorage — XSS cannot read a memory variable.

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

// ─── Silent token refresh on 401 ─────────────────────────────────────────────
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
            // Don't retry auth endpoints themselves — prevents infinite loops
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
                // Browser automatically sends the httpOnly refreshToken cookie.
                // We do NOT manually attach any token here.
                const response = await axios.post(
                    `${API_BASE_URL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                )
                const { accessToken } = response.data.data

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
    localStorage.removeItem('user')
    window.location.href = '/login'
}

export default api
