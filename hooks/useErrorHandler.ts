import { useCallback, useState } from 'react'
import { useCalendar } from '../contexts/CalendarContext'

export interface ErrorInfo {
  message: string
  code?: string
  context?: string
  timestamp: Date
}

export interface UseErrorHandlerReturn {
  error: ErrorInfo | null
  clearError: () => void
  handleError: (error: unknown, context?: string) => void
  handleAsyncOperation: <T>(
    operation: () => Promise<T>,
    options?: {
      context?: string
      onSuccess?: (result: T) => void
      onError?: (error: ErrorInfo) => void
    }
  ) => Promise<T | null>
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setError] = useState<ErrorInfo | null>(null)
  const { dispatch } = useCalendar()
  
  const clearError = useCallback(() => {
    setError(null)
    dispatch({ type: 'SET_ERROR', payload: null })
  }, [dispatch])
  
  const handleError = useCallback((error: unknown, context?: string) => {
    let errorInfo: ErrorInfo
    
    if (error instanceof Error) {
      errorInfo = {
        message: error.message,
        code: (error as any).code,
        context,
        timestamp: new Date()
      }
    } else if (typeof error === 'string') {
      errorInfo = {
        message: error,
        context,
        timestamp: new Date()
      }
    } else {
      errorInfo = {
        message: 'Une erreur inconnue s\'est produite',
        context,
        timestamp: new Date()
      }
    }
    
    // Mettre à jour l'état local
    setError(errorInfo)
    
    // Mettre à jour l'état global
    dispatch({ type: 'SET_ERROR', payload: errorInfo.message })
    
    // Log en développement
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${context || 'App'}] Error:`, error)
    }
    
    return errorInfo
  }, [dispatch])
  
  const handleAsyncOperation = useCallback(async <T,>(
    operation: () => Promise<T>,
    options?: {
      context?: string
      onSuccess?: (result: T) => void
      onError?: (error: ErrorInfo) => void
    }
  ): Promise<T | null> => {
    try {
      const result = await operation()
      
      if (options?.onSuccess) {
        options.onSuccess(result)
      }
      
      return result
    } catch (error) {
      const errorInfo = handleError(error, options?.context)
      
      if (options?.onError) {
        options.onError(errorInfo)
      }
      
      return null
    }
  }, [handleError])
  
  return {
    error,
    clearError,
    handleError,
    handleAsyncOperation
  }
}

// Hook pour gérer les erreurs Supabase spécifiquement
export function useSupabaseErrorHandler() {
  const { handleError } = useErrorHandler()
  
  const handleSupabaseError = useCallback((error: any, operation: string) => {
    let message = 'Une erreur de base de données s\'est produite'
    
    // Gestion des erreurs Supabase communes
    if (error?.code) {
      switch (error.code) {
        case '23505':
          message = 'Cette entrée existe déjà'
          break
        case '23503':
          message = 'Référence invalide'
          break
        case '23502':
          message = 'Données manquantes requises'
          break
        case 'PGRST116':
          message = 'Aucun résultat trouvé'
          break
        case '42501':
          message = 'Permission insuffisante'
          break
        default:
          message = error.message || message
      }
    }
    
    handleError({
      message,
      code: error?.code,
      context: `Supabase: ${operation}`
    })
  }, [handleError])
  
  return { handleSupabaseError }
}