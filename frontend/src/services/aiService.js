import api from './api'
import { API_BASE_URL } from '../utils/constants'

export const aiService = {
    // Chat with your notes (RAG) — long timeout needed for retry backoff
    chat: (question, contextNoteIds = []) =>
        api.post('/ai/chat', { question, contextNoteIds }, { timeout: 120000 }),

    // Streaming chat with your notes (Server-Sent Events)
    chatStream: async function* (question, onSources, contextNoteIds = []) {
        const token = localStorage.getItem('accessToken');
        const baseUrl = API_BASE_URL;

        const response = await fetch(`${baseUrl}/ai/chat/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ question, contextNoteIds })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');

            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data:')) {
                    const dataStr = line.replace('data:', '').trim();
                    if (!dataStr || dataStr === '[DONE]') continue;

                    try {
                        const data = JSON.parse(dataStr);
                        if (data.type === 'sources' && onSources) {
                            onSources(data.sources);
                        } else if (data.type === 'content' && data.content) {
                            yield data.content;
                        }
                    } catch (e) {
                        // ignore malformed chunk
                    }
                }
            }
        }

        if (buffer.startsWith('data:')) {
            try {
                const data = JSON.parse(buffer.replace('data:', '').trim());
                if (data.type === 'content' && data.content) yield data.content;
            } catch (e) { }
        }
    },

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
