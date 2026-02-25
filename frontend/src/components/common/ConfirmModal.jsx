export default function ConfirmModal({ isOpen, title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
    if (!isOpen) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onCancel}>
            <div className="modal-panel bg-surface-1 border border-border rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
                <h3 className="font-serif text-lg text-ink mb-1">{title}</h3>
                <p className="text-sm text-ink-muted leading-relaxed mb-6">{message}</p>
                <div className="flex justify-end gap-2">
                    <button id="modal-cancel" onClick={onCancel} className="btn-secondary text-sm">Cancel</button>
                    <button id="modal-confirm" onClick={onConfirm} className="btn-danger text-sm">{confirmLabel}</button>
                </div>
            </div>
        </div>
    )
}
