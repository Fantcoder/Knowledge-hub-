/**
 * Strip HTML tags and return plain text preview
 */
export const stripHtml = (html) => {
    if (!html) return ''
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent || div.innerText || ''
}

/**
 * Truncate text to maxLength characters
 */
export const truncate = (text, maxLength = 150) => {
    if (!text) return ''
    const stripped = stripHtml(text)
    return stripped.length > maxLength
        ? stripped.substring(0, maxLength) + '...'
        : stripped
}
