import React from 'react'
import styles from './ScheduleCell.module.css'
import { Schedule, ScheduleType } from '../../hooks/useSchedules'

interface ScheduleCellProps {
  schedule?: Schedule
  date: string
  technicianId: number
  technicianColor: string
  onAddClick: () => void
  onEditClick: (schedule: Schedule) => void
  onDeleteClick: (schedule: Schedule) => void
}

const ScheduleCell: React.FC<ScheduleCellProps> = ({
  schedule,
  date,
  technicianId,
  technicianColor,
  onAddClick,
  onEditClick,
  onDeleteClick
}) => {
  // Obtenir la couleur selon le type d'horaire
  const getTypeColor = (type: ScheduleType) => {
    switch (type) {
      case 'available':
        return '#28a745' // Vert
      case 'unavailable':
        return '#dc3545' // Rouge
      case 'vacation':
        return '#ffc107' // Jaune
      case 'sick_leave':
        return '#fd7e14' // Orange
      case 'break':
        return '#6c757d' // Gris
      default:
        return '#0070f3' // Bleu par défaut
    }
  }

  // Obtenir le label du type
  const getTypeLabel = (type: ScheduleType) => {
    switch (type) {
      case 'available':
        return 'Disponible'
      case 'unavailable':
        return 'Indisponible'
      case 'vacation':
        return 'Vacances'
      case 'sick_leave':
        return 'Congé maladie'
      case 'break':
        return 'Pause'
      default:
        return type
    }
  }

  // Formater l'heure
  const formatTime = (time: string) => {
    return time.substring(0, 5)
  }

  if (!schedule) {
    return (
      <div className={styles.emptyCell} onClick={onAddClick}>
        <div className={styles.addButton}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
          </svg>
        </div>
      </div>
    )
  }

  const typeColor = getTypeColor(schedule.type)

  return (
    <div 
      className={styles.scheduleCell}
      style={{ 
        borderLeftColor: technicianColor,
        backgroundColor: `${typeColor}10`
      }}
      onClick={() => onEditClick(schedule)}
    >
      <div className={styles.timeRange}>
        {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
      </div>
      
      <div 
        className={styles.typeLabel}
        style={{ color: typeColor }}
      >
        {getTypeLabel(schedule.type)}
      </div>

      {schedule.notes && (
        <div className={styles.notes} title={schedule.notes}>
          {schedule.notes}
        </div>
      )}

      <button
        className={styles.deleteButton}
        onClick={(e) => {
          e.stopPropagation()
          onDeleteClick(schedule)
        }}
        title="Supprimer"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
          <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
        </svg>
      </button>
    </div>
  )
}

export default ScheduleCell