import React from 'react'
import styles from './ToastContainer.module.css'
import { Toast } from '../../hooks/useToast'
import ConflictModal from './ConflictModal'

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  // Séparer les toasts normaux des modals de conflit
  const regularToasts = toasts.filter(toast => toast.type !== 'conflict')
  const conflictToasts = toasts.filter(toast => toast.type === 'conflict')
  
  return (
    <>
      {/* Toasts normaux en haut à droite */}
      {regularToasts.length > 0 && (
        <div className={styles.container}>
          {regularToasts.map(toast => (
            <div
              key={toast.id}
              className={`${styles.toast} ${styles[toast.type]}`}
              onClick={() => onRemove(toast.id)}
            >
              <div className={styles.icon}>
                {toast.type === 'success' && '✅'}
                {toast.type === 'error' && '❌'}
                {toast.type === 'warning' && '⚠️'}
                {toast.type === 'info' && 'ℹ️'}
              </div>
              <div className={styles.message}>
                {toast.message}
              </div>
              <button 
                className={styles.closeButton}
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(toast.id)
                }}
                aria-label="Fermer"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Modals de conflit centrés */}
      {conflictToasts.map(toast => (
        <ConflictModal
          key={toast.id}
          message={toast.message}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </>
  )
}