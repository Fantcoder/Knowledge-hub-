import api from './api'

export const tagService = {
    getAll: () => api.get('/tags'),
    create: (name) => api.post('/tags', { name }),
    delete: (id) => api.delete(`/tags/${id}`),
}
