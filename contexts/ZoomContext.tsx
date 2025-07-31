import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface ZoomContextType {
  zoomLevel: number
  setZoomLevel: (level: number) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
}

const ZoomContext = createContext<ZoomContextType | undefined>(undefined)

const ZOOM_LEVELS = [50, 75, 100, 125, 150, 175, 200]
const DEFAULT_ZOOM = 100
const ZOOM_STEP = 25

export const ZoomProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    // Charger le zoom sauvegardé
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('calendarZoom')
      return saved ? parseInt(saved, 10) : DEFAULT_ZOOM
    }
    return DEFAULT_ZOOM
  })

  // Sauvegarder le zoom dans localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('calendarZoom', zoomLevel.toString())
    }
  }, [zoomLevel])

  const zoomIn = () => {
    setZoomLevel(prev => {
      const nextLevel = Math.min(prev + ZOOM_STEP, 200)
      return nextLevel
    })
  }

  const zoomOut = () => {
    setZoomLevel(prev => {
      const nextLevel = Math.max(prev - ZOOM_STEP, 50)
      return nextLevel
    })
  }

  const resetZoom = () => {
    setZoomLevel(DEFAULT_ZOOM)
  }

  // Gérer les raccourcis clavier
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault()
          zoomIn()
        } else if (e.key === '-') {
          e.preventDefault()
          zoomOut()
        } else if (e.key === '0') {
          e.preventDefault()
          resetZoom()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  return (
    <ZoomContext.Provider value={{
      zoomLevel,
      setZoomLevel,
      zoomIn,
      zoomOut,
      resetZoom
    }}>
      {children}
    </ZoomContext.Provider>
  )
}

export const useZoom = () => {
  const context = useContext(ZoomContext)
  if (context === undefined) {
    throw new Error('useZoom must be used within a ZoomProvider')
  }
  return context
}