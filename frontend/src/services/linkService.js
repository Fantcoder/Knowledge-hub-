import api from './api'

export const linkService = {
    getAll: () => api.get('/links'),
    create: (data) => api.post('/links', data),
    update: (id, data) => api.put(`/links/${id}`, data),
    delete: (id) => api.delete(`/links/${id}`),
}
