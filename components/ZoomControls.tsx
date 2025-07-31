import React from 'react'
import { useZoom } from '../contexts/ZoomContext'
import styles from './ZoomControls.module.css'

const ZoomControls: React.FC = () => {
  const { zoomLevel, zoomIn, zoomOut, resetZoom } = useZoom()

  return (
    <div className={styles.zoomControls}>
      <button 
        className={styles.zoomButton}
        onClick={zoomOut}
        disabled={zoomLevel <= 50}
        title="Zoom arrière (Ctrl -)"
        aria-label="Zoom arrière"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M3 8h10v1H3z"/>
        </svg>
      </button>
      
      <button 
        className={styles.zoomLevel}
        onClick={resetZoom}
        title="Réinitialiser le zoom (Ctrl 0)"
      >
        {zoomLevel}%
      </button>
      
      <button 
        className={styles.zoomButton}
        onClick={zoomIn}
        disabled={zoomLevel >= 200}
        title="Zoom avant (Ctrl +)"
        aria-label="Zoom avant"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 3v5H3v1h5v5h1V9h5V8H9V3H8z"/>
        </svg>
      </button>
    </div>
  )
}

export default ZoomControls