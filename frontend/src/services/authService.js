import api from './api'

export const authService = {
    register:    (data)         => api.post('/auth/register', data),
    login:       (data)         => api.post('/auth/login', data),
    googleLogin: (idToken)      => api.post('/auth/google', { idToken }),
    // refreshToken is sent in the request body (not a cookie) — works cross-domain (Vercel -> Render)
    refresh:     (refreshToken) => api.post('/auth/refresh', { refreshToken }),
    logout:      ()             => api.post('/auth/logout'),
}