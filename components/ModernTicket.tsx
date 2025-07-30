import React, { useState } from 'react'
import styles from './ModernTicket.module.css'
import { 
  isTicketPlanned, 
  hasMultipleTechnicians as checkMultipleTechnicians,
  canAddTechnician,
  canRemoveTechnician,
  type Ticket,
  type Technician
} from '../utils/ticketHelpers'

interface ModernTicketProps {
  id: number
  title: string
  color: string
  technician_id?: number | null
  technician_name?: string | null
  technician_color?: string | null
  technicians?: Array<{
    id: number
    name: string
    color: string
    is_primary?: boolean
  }>
  onDragStart: (e: React.DragEvent, ticketId: number) => void
  onAddTechnician?: (ticketId: number) => void
  onRemoveTechnician?: (ticketId: number, technicianId: number) => void
  onDeleteTicket?: (ticketId: number) => void
  onTicketClick?: (ticketId: number) => void
  isCompact?: boolean
  showActions?: boolean
  isPlanned?: boolean
  duration?: number
  startTime?: string
}

const ModernTicket: React.FC<ModernTicketProps> = ({ 
  id, 
  title, 
  color, 
  technician_id,
  technician_name,
  technician_color,
  technicians = [],
  onDragStart,
  onAddTechnician,
  onRemoveTechnician,
  onDeleteTicket,
  onTicketClick,
  isCompact = false,
  showActions = false,
  isPlanned = false,
  duration,
  startTime
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [clickStartTime, setClickStartTime] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    const ticketData = {
      id,
      title,
      color,
      technician_id,
      technician_name,
      technician_color,
      technicians
    }
    e.dataTransfer.setData('ticket', JSON.stringify(ticketData))
    onDragStart(e, id)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    // Ignorer les clics sur les boutons d'action
    if ((e.target as Element).closest(`.${styles.actionButton}`)) {
      return
    }
    
    setClickStartTime(Date.now())
    setIsDragging(false)
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    // Ignorer les clics sur les boutons d'action
    if ((e.target as Element).closest(`.${styles.actionButton}`)) {
      return
    }

    if (clickStartTime && !isDragging) {
      const clickDuration = Date.now() - clickStartTime
      
      // Si le clic était court (moins de 200ms) et qu'on n'a pas dragué, 
      // c'est un vrai clic pour ouvrir le modal
      if (clickDuration < 200 && onTicketClick) {
        onTicketClick(id)
      }
    }
    
    setClickStartTime(null)
    setIsDragging(false)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    setClickStartTime(null)
  }
  
  // Créer un objet ticket pour utiliser les utilitaires
  const ticket: Ticket = {
    id,
    title,
    color,
    date: isPlanned ? 'dummy-date' : null, // Utiliser isPlanned pour déterminer si le ticket a une date
    technician_id,
    technician_name,
    technician_color,
    technicians: technicians || []
  }
  
  // Déterminer si plusieurs techniciens sont assignés
  const hasMultipleTechnicians = checkMultipleTechnicians(ticket)
  const primaryTechnician = technicians.find(t => t.is_primary) || technicians[0]
  
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
  
  // Fonction pour afficher les techniciens
  const renderTechnicians = () => {
    if (hasMultipleTechnicians && technicians) {
      const displayNames = technicians.slice(0, 2).map(t => t.name).join(', ')
      const remainingCount = technicians.length - 2
      return (
        <div className={styles.ticketTechnician} style={primaryTechnician ? { color: primaryTechnician.color } : undefined}>
          <span className={styles.technicianIcon}>👥</span>
          {displayNames}
          {remainingCount > 0 && ` +${remainingCount}`}
        </div>
      )
    } else if (technician_name && technician_name !== 'Non assigné') {
      return (
        <div className={styles.ticketTechnician} style={technician_color ? { color: technician_color } : undefined}>
          <span className={styles.technicianIcon}>👤</span>
          {technician_name}
        </div>
      )
    }
    return null
  }

  return (
    <div
      className={`${styles.ticket} ${isCompact ? styles.compact : ''}`}
      style={{ backgroundColor: color }}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.ticketContent}>
        <div className={styles.ticketTitle}>
          {/* Afficher l'icône d'équipe en mode compact si plusieurs techniciens */}
          {isCompact && hasMultipleTechnicians && (
            <span className={styles.technicianIcon} style={{ marginRight: '4px' }}>👥</span>
          )}
          {title}
        </div>
        {/* Afficher l'heure et la durée en mode compact si disponible */}
        {isCompact && startTime && (
          <div className={styles.ticketTime}>
            {startTime} {duration && duration !== 30 && `(${duration}min)`}
          </div>
        )}
        {!isCompact && renderTechnicians()}
      </div>
      
      {/* Boutons d'action selon l'état planifié/non planifié */}
      {showActions && isHovered && (
        <div className={styles.actionButtons}>
          {/* Bouton + seulement si planifié */}
          {isPlanned && (
            <button
              className={styles.actionButton}
              onClick={(e) => {
                e.stopPropagation()
                if (onAddTechnician) onAddTechnician(id)
              }}
              title="Ajouter un technicien"
            >
              +
            </button>
          )}
          {/* Bouton × pour TOUS les tickets non planifiés (suppression complète) */}
          {!isPlanned && (
            <button
              className={`${styles.actionButton} ${styles.removeButton}`}
              onClick={(e) => {
                e.stopPropagation()
                if (onDeleteTicket) {
                  if (confirm('Êtes-vous sûr de vouloir supprimer ce ticket ?')) {
                    onDeleteTicket(id)
                  }
                }
              }}
              title="Supprimer le ticket"
            >
              ×
            </button>
          )}
        </div>
      )}
      
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