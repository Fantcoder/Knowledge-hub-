import { useState, useEffect, useRef, useCallback } from 'react'
import { useDebounce } from './useDebounce'

/**
 * Auto-save hook — calls saveFn 3 seconds after last change
 * Returns: { saveStatus: 'idle' | 'saving' | 'saved' | 'error' }
 */
export function useAutoSave(value, saveFn, delay = 3000, enabled = true) {
    const [saveStatus, setSaveStatus] = useState('idle')
    const debouncedValue = useDebounce(value, delay)
    const isFirstRender = useRef(true)
    const lastSaved = useRef(null)

    const save = useCallback(async (val) => {
        if (!enabled) return
        setSaveStatus('saving')
        try {
            await saveFn(val)
            setSaveStatus('saved')
            lastSaved.current = val
            setTimeout(() => setSaveStatus('idle'), 2000)
        } catch {
            setSaveStatus('error')
        }
    }, [saveFn, enabled])

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }
        if (JSON.stringify(debouncedValue) === JSON.stringify(lastSaved.current)) return
        save(debouncedValue)
    }, [debouncedValue, save])

    return { saveStatus }
}
