import api from './api'

export const authService = {
    register:    (data)    => api.post('/auth/register', data),
    login:       (data)    => api.post('/auth/login', data),
    googleLogin: (idToken) => api.post('/auth/google', { idToken }),
    // No body needed — browser sends the httpOnly cookie automatically
    refresh:     ()        => api.post('/auth/refresh', {}),
    logout:      ()        => api.post('/auth/logout'),
}
