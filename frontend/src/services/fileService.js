import api from './api'

export const fileService = {
    upload: (file, noteId) => {
        const formData = new FormData()
        formData.append('file', file)
        if (noteId) formData.append('noteId', noteId)
        return api.post('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },
    getAll: () => api.get('/files'),
    download: (id) =>
        api.get(`/files/${id}/download`, { responseType: 'blob' }),
    delete: (id) => api.delete(`/files/${id}`),
}
