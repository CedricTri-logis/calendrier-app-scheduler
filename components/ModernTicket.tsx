import React from 'react'
import styles from './ModernTicket.module.css'

interface ModernTicketProps {
  id: number
  title: string
  color: string
  technician_id?: number | null
  technician_name?: string | null
  technician_color?: string | null
  onDragStart: (e: React.DragEvent, ticketId: number) => void
  isCompact?: boolean
}

const ModernTicket: React.FC<ModernTicketProps> = ({ 
  id, 
  title, 
  color, 
  technician_id,
  technician_name,
  technician_color,
  onDragStart,
  isCompact = false
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    const ticketData = {
      id,
      title,
      color,
      technician_id,
      technician_name,
      technician_color
    }
    e.dataTransfer.setData('ticket', JSON.stringify(ticketData))
    onDragStart(e, id)
  }
  
  // Déterminer la classe de couleur basée sur la couleur
  const getColorClass = () => {
    const colorMap: { [key: string]: string } = {
      '#FFE5B4': 'yellow',
      '#B4E5FF': 'blue',
      '#FFB4B4': 'red',
      '#D4FFB4': 'green',
      '#E5B4FF': 'purple',
      '#E5CCFF': 'purple',
      '#FFCCCC': 'red',
      '#fff3cd': 'yellow',
      '#d1ecf1': 'blue',
      '#f8d7da': 'red',
      '#d4edda': 'green',
      '#e2d5f1': 'purple'
    }
    return colorMap[color] || 'blue'
  }
  
  return (
    <div
      className={`${styles.ticket} ${styles[getColorClass()]} ${isCompact ? styles.compact : ''}`}
      draggable
      onDragStart={handleDragStart}
    >
      <div className={styles.ticketContent}>
        <div className={styles.ticketTitle}>{title}</div>
        {technician_name && technician_name !== 'Non assigné' && !isCompact && (
          <div className={styles.ticketTechnician} style={technician_color ? { color: technician_color } : undefined}>
            <span className={styles.technicianIcon}>👤</span>
            {technician_name}
          </div>
        )}
      </div>
      <div className={styles.dragHandle}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <circle cx="3" cy="3" r="1.5" />
          <circle cx="9" cy="3" r="1.5" />
          <circle cx="3" cy="9" r="1.5" />
          <circle cx="9" cy="9" r="1.5" />
        </svg>
      </div>
    </div>
  )
}

export default ModernTicket