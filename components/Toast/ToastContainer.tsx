import React from 'react'
import styles from './ToastContainer.module.css'
import { Toast } from '../../hooks/useToast'

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null
  
  return (
    <div className={styles.container}>
      {toasts.map(toast => (
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
  )
}