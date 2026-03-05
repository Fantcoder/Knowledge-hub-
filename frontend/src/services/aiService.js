import api from './api'

export const aiService = {
    // Chat with your notes (RAG)
    chat: (question, contextNoteIds = []) =>
        api.post('/ai/chat', { question, contextNoteIds }),

    // Semantic search
    semanticSearch: (query, limit = 10) =>
        api.get('/ai/search', { params: { q: query, limit } }),

    // Manually embed a specific note
    embedNote: (noteId) =>
        api.post(`/ai/embed/${noteId}`),

    // Batch embed all notes
    embedAll: () =>
        api.post('/ai/embed-all'),
}
