export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

export const ALLOWED_FILE_TYPES = ['pdf', 'docx', 'png', 'jpg', 'jpeg', 'webp', 'txt']
export const MAX_FILE_SIZE_MB = 10
export const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024

export const NOTE_FILTERS = {
    ACTIVE: 'active',
    ARCHIVED: 'archived',
    DELETED: 'deleted',
    PINNED: 'pinned',
}

export const FILE_TYPE_ICONS = {
    'application/pdf': '📄',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
    'image/png': '🖼️',
    'image/jpeg': '🖼️',
    'image/webp': '🖼️',
    'text/plain': '📃',
    default: '📎',
}

export const getFileIcon = (mimeType) =>
    FILE_TYPE_ICONS[mimeType] || FILE_TYPE_ICONS.default

export const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
