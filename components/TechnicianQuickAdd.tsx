import React, { useState, useEffect, useRef } from 'react'
import styles from './TechnicianQuickAdd.module.css'
import { useTechnicians } from '../hooks/useTechnicians'
import { useSchedules } from '../hooks/useSchedules'
import { getDateAvailabilityStatus } from '../utils/scheduleHelpers'

interface TechnicianQuickAddProps {
  ticketId: number
  ticketDate?: string | null
  ticketHour?: number | null
  currentTechnicianIds: number[]
  position: { x: number; y: number }
  onSelect: (technicianId: number) => void
  onClose: () => void
}

const TechnicianQuickAdd: React.FC<TechnicianQuickAddProps> = ({
  ticketId,
  ticketDate,
  ticketHour,
  currentTechnicianIds,
  position,
  onSelect,
  onClose
}) => {
  const popupRef = useRef<HTMLDivElement>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const { technicians } = useTechnicians()
  const { schedules } = useSchedules()
  
  // Filtrer les techniciens disponibles
  const availableTechnicians = technicians.filter(tech => {
    // Exclure les techniciens déjà assignés et "Non assigné"
    if (currentTechnicianIds.includes(tech.id) || tech.name === 'Non assigné') {
      return false
    }
    
    // Filtrer par terme de recherche
    if (searchTerm && !tech.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    
    return true
  })
  
  // Obtenir le statut de disponibilité pour chaque technicien
  const getTechnicianAvailability = (technicianId: number) => {
    if (!ticketDate) return 'unknown'
    return getDateAvailabilityStatus(ticketDate, schedules, technicianId)
  }
  
  // Gérer les clics en dehors du popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])
  
  // Focus sur le champ de recherche au montage
  useEffect(() => {
    const searchInput = document.getElementById('technician-search')
    if (searchInput) {
      searchInput.focus()
    }
  }, [])
  
  const handleSelect = (technicianId: number) => {
    onSelect(technicianId)
    onClose()
  }
  
  // Calculer la position du popup pour qu'il reste visible
  const popupStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: 1000
  }
  
  // Ajuster la position si le popup dépasse de l'écran
  useEffect(() => {
    if (popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect()
      const newStyle: React.CSSProperties = { ...popupStyle }
      
      // Ajuster horizontalement
      if (rect.right > window.innerWidth) {
        newStyle.left = `${position.x - rect.width}px`
      }
      
      // Ajuster verticalement
      if (rect.bottom > window.innerHeight) {
        newStyle.top = `${position.y - rect.height}px`
      }
      
      Object.assign(popupRef.current.style, newStyle)
    }
  }, [position])
  
  return (
    <div ref={popupRef} className={styles.popup} style={popupStyle}>
      <div className={styles.header}>
        <h3>Ajouter un technicien</h3>
        <button className={styles.closeButton} onClick={onClose}>×</button>
      </div>
      
      <div className={styles.searchContainer}>
        <input
          id="technician-search"
          type="text"
          placeholder="Rechercher un technicien..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>
      
      <div className={styles.technicianList}>
        {availableTechnicians.length === 0 ? (
          <div className={styles.emptyState}>
            {searchTerm ? 'Aucun technicien trouvé' : 'Tous les techniciens sont déjà assignés'}
          </div>
        ) : (
          availableTechnicians.map(tech => {
            const availability = getTechnicianAvailability(tech.id)
            const isUnavailable = availability === 'unavailable'
            
            return (
              <button
                key={tech.id}
                className={`${styles.technicianItem} ${isUnavailable ? styles.unavailable : ''}`}
                onClick={() => !isUnavailable && handleSelect(tech.id)}
                disabled={isUnavailable}
              >
                <div 
                  className={styles.technicianColor} 
                  style={{ backgroundColor: tech.color }}
                />
                <span className={styles.technicianName}>{tech.name}</span>
                <span className={`${styles.availabilityBadge} ${styles[availability]}`}>
                  {availability === 'available' && '✓ Disponible'}
                  {availability === 'partial' && '◐ Partiel'}
                  {availability === 'unavailable' && '✗ Non disponible'}
                  {availability === 'unknown' && '? Non planifié'}
                </span>
              </button>
            )
          })
        )}
      </div>
      
      {ticketDate && (
        <div className={styles.footer}>
          <small>Disponibilité pour le {new Date(ticketDate).toLocaleDateString('fr-CA')}</small>
        </div>
      )}
    </div>
  )
}

export default TechnicianQuickAdd