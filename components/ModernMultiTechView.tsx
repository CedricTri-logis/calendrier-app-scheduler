import React, { useEffect, useState, useRef } from 'react'
import styles from './ModernMultiTechView.module.css'
import ModernTicket from './ModernTicket'
import { Schedule } from '../hooks/useSchedules'
import { Technician } from '../hooks/useTechnicians'
import { 
  isHourAvailable, 
  getDateAvailabilityStatus,
  getScheduleTypeLabel,
  getScheduleTypeColor 
} from '../utils/scheduleHelpers'
import { getTechnicianAllDayTickets, getTechnicianTicketsAtHour, getTimedTickets } from '../utils/ticketFiltering'
import { 
  extractDropCoordinates,
  coordinatesToTime,
  getTechnicianIdFromCoordinates,
  validateDropPosition,
  generateDropPreview,
  DROP_CONFIG
} from '../utils/dropHelpers'
import { 
  calculateOverlapInfo,
  calculateTicketStyles,
  getDisplayInfo
} from '../utils/overlapHelpers'
import { formatHour } from '../utils/timeFormatHelpers'

interface ModernMultiTechViewProps {
  droppedTickets: { [key: string]: any[] }
  onDrop: (dayNumber: number, ticket: any, year?: number, month?: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDragStart: (e: React.DragEvent, ticketId: number) => void
  currentDate: Date
  onPreviousDay: () => void
  onNextDay: () => void
  onToday: () => void
  schedules: Schedule[]
  technicians: Technician[]
  onAddTechnician?: (ticketId: number) => void
  onRemoveTechnician?: (ticketId: number, technicianId: number) => void
  onTicketClick?: (ticketId: number) => void
}

const ModernMultiTechView: React.FC<ModernMultiTechViewProps> = ({
  droppedTickets,
  onDrop,
  onDragOver,
  onDragStart,
  currentDate,
  onPreviousDay,
  onNextDay,
  onToday,
  schedules,
  technicians,
  onAddTechnician,
  onRemoveTechnician,
  onTicketClick
}) => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [dropPreview, setDropPreview] = useState<{
    visible: boolean
    timeDisplay: string
    isValid: boolean
    top: number
    left: number
    technicianId?: number
  } | null>(null)
  const technicianColumnsRef = useRef<HTMLDivElement>(null)
  
  // Mettre à jour l'heure actuelle toutes les minutes
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    
    return () => clearInterval(timer)
  }, [])
  
  // Heures de la journée (7h à 18h)
  const hours = Array.from({ length: 12 }, (_, i) => i + 7)
  
  // Filtrer uniquement les techniciens actifs (exclure "Non assigné")
  const activeTechnicians = technicians.filter(tech => tech.active && tech.name !== 'Non assigné')
  
  // Formater la date pour l'affichage
  const formatDate = (date: Date) => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                   'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
    
    return {
      dayName: days[date.getDay()],
      dayNumber: date.getDate(),
      monthName: months[date.getMonth()],
      year: date.getFullYear()
    }
  }
  
  const { dayName, dayNumber, monthName, year } = formatDate(currentDate)
  
  // Vérifier si c'est aujourd'hui
  const isToday = () => {
    const today = new Date()
    return currentDate.getDate() === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear()
  }
  
  // Calculer la position de la ligne de temps actuelle
  const getCurrentTimePosition = () => {
    const currentHour = currentTime.getHours()
    const currentMinutes = currentTime.getMinutes()
    
    // Si l'heure actuelle est en dehors de la plage affichée (7h-18h)
    if (currentHour < 7) return -1
    if (currentHour > 18) return -1
    
    // Calculer la position relative dans la grille
    const hoursFromStart = currentHour - 7
    const minutesFraction = currentMinutes / 60
    const totalFraction = hoursFromStart + minutesFraction
    
    // Convertir en pourcentage (11 heures affichées = 100%)
    return (totalFraction / 11) * 100
  }
  
  // Nouveau système de drop multi-technicien avec coordonnées précises
  const handlePreciseMultiTechDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDropPreview(null)
    
    if (!technicianColumnsRef.current) return
    
    const coordinates = extractDropCoordinates(e, technicianColumnsRef.current)
    const timeResult = coordinatesToTime(coordinates.offsetY)
    
    // Déterminer quel technicien basé sur la position X
    const technicianId = getTechnicianIdFromCoordinates(
      coordinates,
      activeTechnicians,
      technicianColumnsRef.current.getBoundingClientRect(),
      80 // Largeur approximative de la colonne des heures
    )
    
    if (!technicianId) {
      console.warn('Aucun technicien détecté à cette position')
      return
    }
    
    // Valider la position de drop
    const isValid = validateDropPosition(
      timeResult,
      schedules,
      technicianId,
      getDateKey()
    )
    
    if (!isValid) {
      console.warn('Drop non valide à cette position')
      return
    }
    
    const ticketData = e.dataTransfer.getData('ticket')
    if (ticketData) {
      const ticket = JSON.parse(ticketData)
      
      // Créer le ticket avec les nouvelles coordonnées et le technicien
      const updatedTicket = {
        ...ticket,
        hour: timeResult.isAllDay ? -1 : timeResult.snappedHour,
        minutes: timeResult.isAllDay ? 0 : timeResult.snappedMinutes,
        technician_id: technicianId
      }
      
      onDrop(
        currentDate.getDate(),
        updatedTicket,
        currentDate.getFullYear(),
        currentDate.getMonth()
      )
    }
  }
  
  // Gestion du survol pour l'aperçu multi-technicien
  const handleMultiTechDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    
    if (!technicianColumnsRef.current) return
    
    const coordinates = extractDropCoordinates(e, technicianColumnsRef.current)
    const timeResult = coordinatesToTime(coordinates.offsetY)
    const preview = generateDropPreview(timeResult)
    
    // Déterminer quel technicien
    const technicianId = getTechnicianIdFromCoordinates(
      coordinates,
      activeTechnicians,
      technicianColumnsRef.current.getBoundingClientRect(),
      80
    )
    
    // Calculer la position de l'aperçu
    let previewTop = coordinates.offsetY
    if (!timeResult.isAllDay) {
      // Snap à la position de grille
      const hoursFromStart = timeResult.snappedHour - DROP_CONFIG.MIN_HOUR
      const totalMinutes = hoursFromStart * 60 + timeResult.snappedMinutes
      previewTop = (totalMinutes / 60) * DROP_CONFIG.CELL_HEIGHT + DROP_CONFIG.HEADER_HEIGHT
    }
    
    setDropPreview({
      visible: true,
      timeDisplay: preview.timeDisplay,
      isValid: preview.isValid && !!technicianId,
      top: previewTop,
      left: coordinates.offsetX,
      technicianId: technicianId || undefined
    })
  }
  
  // Gérer la sortie de la zone de drop
  const handleMultiTechDragLeave = (e: React.DragEvent) => {
    // Vérifier si on quitte vraiment le conteneur principal
    if (!technicianColumnsRef.current?.contains(e.relatedTarget as Node)) {
      setDropPreview(null)
    }
  }
  
  // Fonction pour créer une clé de date au format YYYY-MM-DD
  const getDateKey = (): string => {
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const day = String(currentDate.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  const dateKey = getDateKey()
  const todayTickets = droppedTickets[dateKey] || []
  
  // Calculer les informations de chevauchement globales
  const { overlapInfo, groups, hasOverlaps } = getDisplayInfo(todayTickets, true)
  
  // Formatage de l'heure géré par timeFormatHelpers
  
  // Fonction pour obtenir les tickets d'un technicien à une heure donnée
  const getTechnicianTicketsAtHourLocal = (technicianId: number, hour: number) => {
    return getTechnicianTicketsAtHour(todayTickets, technicianId, hour)
  }
  
  // Obtenir les tickets "toute la journée" pour un technicien
  const getAllDayTicketsForTechnicianLocal = (technicianId: number) => {
    return getTechnicianAllDayTickets(todayTickets, technicianId)
  }
  
  const timelinePosition = getCurrentTimePosition()
  
  return (
    <div className={styles.multiTechView}>
      {/* Header avec la date */}
      <div className={styles.header}>
        <div className={styles.dateInfo}>
          <div className={styles.dayNameLarge}>{dayName}</div>
          <div className={styles.dateDetails}>
            <span className={`${styles.dayNumberLarge} ${isToday() ? styles.today : ''}`}>
              {dayNumber}
            </span>
            <span className={styles.monthYear}>{monthName} {year}</span>
          </div>
        </div>
        <div className={styles.technicianCount}>
          {activeTechnicians.length} technicien{activeTechnicians.length > 1 ? 's' : ''} actif{activeTechnicians.length > 1 ? 's' : ''}
        </div>
      </div>
      
      {/* Grille principale */}
      <div className={styles.mainGrid}>
        {/* Colonne des heures */}
        <div className={styles.timeColumn}>
          <div className={styles.timeHeader}></div>
          <div className={styles.allDayLabel}>Journée</div>
          {hours.map((hour) => (
            <div key={hour} className={styles.timeLabel}>
              {formatHour(hour)}
            </div>
          ))}
        </div>
        
        {/* Colonnes des techniciens avec système de drop précis */}
        <div 
          ref={technicianColumnsRef}
          className={styles.technicianColumns}
          onDrop={handlePreciseMultiTechDrop}
          onDragOver={handleMultiTechDragOver}
          onDragLeave={handleMultiTechDragLeave}
        >
          {/* Ligne de temps actuelle */}
          {isToday() && timelinePosition >= 0 && (
            <div 
              className={styles.currentTimeLine} 
              style={{ top: `calc(${timelinePosition}% + 120px)` }}
            >
              <div className={styles.currentTimeIndicator}></div>
              <div className={styles.currentTimeText}>
                {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )}
          
          {/* Aperçu de drop multi-technicien */}
          {dropPreview && dropPreview.visible && (
            <div 
              className={`${styles.dropPreview} ${dropPreview.isValid ? styles.dropPreviewValid : styles.dropPreviewInvalid}`}
              style={{
                top: `${dropPreview.top}px`,
                left: `${dropPreview.left}px`,
                position: 'absolute',
                pointerEvents: 'none',
                backgroundColor: dropPreview.isValid ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                border: `2px solid ${dropPreview.isValid ? '#22c55e' : '#ef4444'}`,
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '12px',
                fontWeight: '500',
                color: dropPreview.isValid ? '#15803d' : '#dc2626',
                zIndex: 1000
              }}
            >
              {dropPreview.timeDisplay}
              {dropPreview.technicianId && (
                <div style={{ fontSize: '10px', opacity: 0.8 }}>
                  {activeTechnicians.find(t => t.id === dropPreview.technicianId)?.name}
                </div>
              )}
            </div>
          )}
          
          {activeTechnicians.map((technician) => {
            const availabilityStatus = getDateAvailabilityStatus(dateKey, schedules, technician.id)
            
            return (
              <div key={technician.id} className={styles.technicianColumn}>
                {/* En-tête du technicien */}
                <div 
                  className={styles.technicianHeader}
                  style={{ backgroundColor: technician.color + '20', borderColor: technician.color }}
                >
                  <div className={styles.technicianName}>{technician.name}</div>
                  <div className={styles.availabilityBadge}>
                    {availabilityStatus === 'available' && (
                      <span className={styles.available}>Disponible</span>
                    )}
                    {availabilityStatus === 'partial' && (
                      <span className={styles.partial}>Partiel</span>
                    )}
                    {availabilityStatus === 'unavailable' && (
                      <span className={styles.unavailable}>Indisponible</span>
                    )}
                  </div>
                </div>
                
                {/* Zone toute la journée */}
                <div className={styles.allDayCell}>
                  {getAllDayTicketsForTechnicianLocal(technician.id).map((ticket) => (
                    <ModernTicket
                      key={ticket.id}
                      id={ticket.id}
                      title={ticket.title}
                      color={ticket.color}
                      technician_id={ticket.technician_id}
                      technician_name={ticket.technician_name}
                      technician_color={ticket.technician_color}
                      technicians={ticket.technicians}
                      estimated_duration={ticket.estimated_duration}
                      onDragStart={onDragStart}
                      onAddTechnician={onAddTechnician}
                      onRemoveTechnician={onRemoveTechnician}
                      onTicketClick={onTicketClick}
                      isCompact={true}
                      showActions={true}
                      isPlanned={true}
                    />
                  ))}
                </div>
                
                {/* Cellules horaires */}
                {hours.map((hour) => {
                  const isAvailable = isHourAvailable(hour, dateKey, schedules, technician.id)
                  const ticketsAtHour = getTechnicianTicketsAtHourLocal(technician.id, hour)
                  
                  return (
                    <div
                      key={`${technician.id}-${hour}`}
                      className={`${styles.hourCell} ${!isAvailable ? styles.unavailableHour : ''} ${ticketsAtHour.length > 1 ? styles.hasOverlaps : ''}`}
                      style={{ position: 'relative', height: '80px', overflow: 'visible' }}
                    >
                      {/* Lignes de quart d'heure */}
                      <div className={styles.quarterLines}>
                        <div className={`${styles.quarterLine} ${styles.quarter15}`} />
                        <div className={`${styles.quarterLine} ${styles.quarter45}`} />
                      </div>
                      {ticketsAtHour.map((ticket) => {
                        // Calculer la position verticale basée sur les minutes
                        const minuteOffset = (ticket.minutes || 0) / 60 * 80 // 80px pour une heure
                        const ticketOverlapInfo = overlapInfo.get(ticket.id)
                        let customStyles: React.CSSProperties = {
                          position: 'absolute',
                          top: `${minuteOffset}px`,
                          left: '4px',
                          right: '4px',
                          zIndex: 10
                        }
                        
                        // Appliquer le positionnement en colonnes si nécessaire
                        if (ticketOverlapInfo && hasOverlaps && ticketsAtHour.length > 1) {
                          const overlapStyles = calculateTicketStyles(ticket, ticketOverlapInfo, 80)
                          customStyles = {
                            ...overlapStyles,
                            position: 'absolute',
                            top: `${minuteOffset}px`,
                            zIndex: 10
                          }
                        }
                        
                        return (
                          <ModernTicket
                            key={ticket.id}
                            id={ticket.id}
                            title={ticket.title}
                            color={ticket.color}
                            technician_id={ticket.technician_id}
                            technician_name={ticket.technician_name}
                            technician_color={ticket.technician_color}
                            technicians={ticket.technicians}
                            estimated_duration={ticket.estimated_duration}
                            onDragStart={onDragStart}
                            onAddTechnician={onAddTechnician}
                            onRemoveTechnician={onRemoveTechnician}
                            onTicketClick={onTicketClick}
                            isCompact={true}
                            showActions={true}
                            isPlanned={true}
                            overlapInfo={ticketOverlapInfo}
                            customStyles={customStyles}
                          />
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Message si aucun technicien actif */}
      {activeTechnicians.length === 0 && (
        <div className={styles.noTechnicians}>
          <p>Aucun technicien actif pour cette journée.</p>
          <p>Veuillez activer des techniciens dans la gestion des horaires.</p>
        </div>
      )}
    </div>
  )
}

export default ModernMultiTechView