import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'

export const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (isToday(date)) return `Today at ${format(date, 'h:mm a')}`
    if (isYesterday(date)) return `Yesterday at ${format(date, 'h:mm a')}`
    return format(date, 'MMM d, yyyy')
}

export const formatRelative = (dateString) => {
    if (!dateString) return ''
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
}

export const formatFull = (dateString) => {
    if (!dateString) return ''
    return format(new Date(dateString), 'MMMM d, yyyy · h:mm a')
}
