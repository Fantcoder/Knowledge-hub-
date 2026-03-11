import Dexie from 'dexie'

export const db = new Dexie('KnowledgeHubDB')

// Define the database schema
db.version(1).stores({
    notes: 'id, title, isArchived, isTrashed, isPinned, createdAt, updatedAt',
    tags: 'id, name',
    graph: 'id', // just a single record to store the cached graph
    syncQueue: '++id, action, entityId, payload, timestamp',
})

// Helper methods for IndexedDB operations

export const initSyncQueue = async () => {
    // This could optionally process the queue
}

export const cacheNotes = async (notesArray) => {
    try {
        await db.notes.bulkPut(notesArray)
    } catch (err) {
        console.warn('Failed to cache notes in IndexedDB', err)
    }
}

export const getCachedNotes = async () => {
    try {
        return await db.notes.toArray()
    } catch (err) {
        return []
    }
}

export const addToSyncQueue = async (action, entityId, payload) => {
    try {
        await db.syncQueue.add({
            action,
            entityId,
            payload,
            timestamp: Date.now()
        })
    } catch (err) { }
}
