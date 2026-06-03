import { useEffect } from 'react'

export default function ConfirmModal({ 
  show, 
  title = 'Are you sure?', 
  message = 'This action cannot be undone.', 
  confirmText = 'Proceed', 
  cancelText = 'Cancel', 
  type = 'danger', // danger, primary, success
  onConfirm, 
  onCancel 
}) {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [show])

  if (!show) return null

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: 20 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        )
      case 'warning':
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', marginBottom: 20 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        )
      default:
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', marginBottom: 20 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        )
    }
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }} onClick={onCancel}>
      <div 
        className="modal" 
        style={{ 
          maxWidth: 400, 
          padding: '32px 24px 24px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          textAlign: 'center'
        }} 
        onClick={e => e.stopPropagation()}
      >
        {getIcon()}
        
        <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
          {title}
        </h3>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: '1.5', marginBottom: 28 }}>
          {message}
        </p>
        
        <div style={{ display: 'flex', gap: 12, width: '100%', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <button 
            className="btn btn-ghost" 
            style={{ flex: 1, padding: '12px' }} 
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`} 
            style={{ flex: 1, padding: '12px' }} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
