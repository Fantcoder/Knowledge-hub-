import api from './api'

export const noteService = {
    getAll: (params) => api.get('/notes', { params }),
    getById: (id) => api.get(`/notes/${id}`),
    create: (data) => api.post('/notes', data),
    update: (id, data) => api.put(`/notes/${id}`, data),
    delete: (id) => api.delete(`/notes/${id}`),
    permanentDelete: (id) => api.delete(`/notes/${id}/permanent`),
    restore: (id) => api.patch(`/notes/${id}/restore`),
    pin: (id) => api.patch(`/notes/${id}/pin`),
    archive: (id) => api.patch(`/notes/${id}/archive`),
    search: (params) => api.get('/notes/search', { params }),
    toggleShare: (id) => api.patch(`/notes/${id}/share`),
    getShared: (slug) => {
        return import('axios').then(axios => axios.default.get(import.meta.env.VITE_API_URL + `/shared/${slug}`))
    }
}
