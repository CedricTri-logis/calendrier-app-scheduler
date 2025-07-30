import { useState, useCallback, useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface UseToastReturn {
  toasts: Toast[]
  showToast: (message: string, type?: ToastType, duration?: number) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([])
  
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])
  
  const showToast = useCallback((
    message: string,
    type: ToastType = 'info',
    duration: number = 5000
  ) => {
    const id = Date.now().toString()
    const toast: Toast = { id, message, type, duration }
    
    setToasts(prev => [...prev, toast])
    
    // Auto-remove après la durée spécifiée
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }, [removeToast])
  
  const clearToasts = useCallback(() => {
    setToasts([])
  }, [])
  
  return {
    toasts,
    showToast,
    removeToast,
    clearToasts
  }
}

// Hook pour intégrer les toasts avec la gestion d'erreurs
export function useToastWithErrors() {
  const toast = useToast()
  
  const showError = useCallback((message: string) => {
    toast.showToast(message, 'error')
  }, [toast])
  
  const showSuccess = useCallback((message: string) => {
    toast.showToast(message, 'success')
  }, [toast])
  
  const showWarning = useCallback((message: string) => {
    toast.showToast(message, 'warning')
  }, [toast])
  
  const showInfo = useCallback((message: string) => {
    toast.showToast(message, 'info')
  }, [toast])
  
  return {
    ...toast,
    showError,
    showSuccess,
    showWarning,
    showInfo
  }
}