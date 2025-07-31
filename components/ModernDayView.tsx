import React, { useEffect, useState } from 'react'
import styles from './ModernDayView.module.css'
import ModernTicket from './ModernTicket'
import { Schedule } from '../hooks/useSchedules'
import { 
  isHourAvailable, 
  getDateAvailabilityStatus,
  getUnavailabilityTypes,
  getScheduleTypeLabel,
  getScheduleTypeColor 
} from '../utils/scheduleHelpers'

import { Ticket, getDurationSlots, getTicketHeight } from '../utils/ticketHelpers'
import { useZoom } from '../contexts/ZoomContext'

interface ModernDayViewProps {
  droppedTickets: { [key: string]: Ticket[] }
  onDrop: (dayNumber: number, ticket: Ticket, year?: number, month?: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDragStart: (e: React.DragEvent, ticketId: number) => void
  currentDate: Date
  onPreviousDay: () => void
  onNextDay: () => void
  onToday: () => void
  schedules: Schedule[]
  selectedTechnicianId: number | null
  onAddTechnician?: (ticketId: number) => void
  onRemoveTechnician?: (ticketId: number, technicianId: number) => void
  onTicketClick?: (ticketId: number) => void
}

const ModernDayView: React.FC<ModernDayViewProps> = ({
  droppedTickets,
  onDrop,
  onDragOver,
  onDragStart,
  currentDate,
  onPreviousDay,
  onNextDay,
  onToday,
  schedules,
  selectedTechnicianId,
  onAddTechnician,
  onRemoveTechnician,
  onTicketClick
}) => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const { zoomLevel } = useZoom()
  
  // Mettre à jour l'heure actuelle toutes les minutes
  useEffect(() => {
    let mounted = true;
    
    const timer = setInterval(() => {
      if (mounted) {
        setCurrentTime(new Date())
      }
    }, 60000)
    
    return () => {
      mounted = false;
      clearInterval(timer)
    }
  }, [])
  
  // Créneaux de 15 minutes de 7h à 18h45 (48 créneaux)
  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 4) + 7
    const minutes = (i % 4) * 15
    return { slot: i, hour, minutes }
  })
  
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
    const hours = currentTime.getHours()
    const minutes = currentTime.getMinutes()
    return ((hours * 60 + minutes) / (24 * 60)) * 100
  }
  
  const handleDrop = (e: React.DragEvent, hour: number, minutes: number = 0) => {
    e.preventDefault()
    const ticketData = e.dataTransfer.getData('ticket')
    if (ticketData) {
      const ticket = JSON.parse(ticketData)
      onDrop(currentDate.getDate(), { ...ticket, hour, minutes }, currentDate.getFullYear(), currentDate.getMonth())
    }
  }
  
  // Fonction pour créer une clé de date au format YYYY-MM-DD
  const getDateKey = (): string => {
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const day = String(currentDate.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  const todayTickets = droppedTickets[getDateKey()] || []
  const allDayTickets = todayTickets.filter(ticket => !ticket.hour || ticket.hour === -1)
  
  // Formater l'heure
  const formatTime = (hour: number, minutes: number) => {
    return `${hour}:${String(minutes).padStart(2, '0')}`
  }
  
  // Obtenir le statut de disponibilité pour la journée
  const dateKey = getDateKey()
  const availabilityStatus = getDateAvailabilityStatus(dateKey, schedules, selectedTechnicianId)
  const unavailabilityTypes = getUnavailabilityTypes(dateKey, schedules, selectedTechnicianId)
  
  return (
    <div className={styles.dayView}>
      <div 
        className={styles.zoomContainer}
        style={{
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: 'top left',
          width: `${100 / (zoomLevel / 100)}%`,
          height: `${100 / (zoomLevel / 100)}%`
        }}
      >
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
          {availabilityStatus !== 'unknown' && (
            <div className={styles.availabilityStatus}>
              {availabilityStatus === 'available' && (
                <span className={styles.availableStatus}>Disponible</span>
              )}
              {availabilityStatus === 'partial' && (
                <span className={styles.partialStatus}>Partiellement disponible</span>
              )}
              {availabilityStatus === 'unavailable' && (
                <div className={styles.unavailableStatus}>
                  {unavailabilityTypes.map(type => (
                    <span key={type} className={styles.statusBadge}>
                      {getScheduleTypeLabel(type)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Zone pour les événements toute la journée */}
      {allDayTickets.length > 0 && (
        <div className={styles.allDaySection}>
          <div className={styles.allDayLabel}>Toute la journée</div>
          <div 
            className={styles.allDayContent}
            onDrop={(e) => handleDrop(e, -1)}
            onDragOver={onDragOver}
          >
            {allDayTickets.map((ticket) => (
              <ModernTicket
                key={ticket.id}
                id={ticket.id}
                title={ticket.title}
                color={ticket.color}
                technician_id={ticket.technician_id}
                technician_name={ticket.technician_name}
                technician_color={ticket.technician_color}
                technicians={ticket.technicians}
                onDragStart={onDragStart}
                onAddTechnician={onAddTechnician}
                onRemoveTechnician={onRemoveTechnician}
                onTicketClick={onTicketClick}
                showActions={true}
                isPlanned={true}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Grille horaire */}
      <div className={styles.timeGrid}>
        {/* Ligne de temps actuelle */}
        {isToday() && (
          <div 
            className={styles.currentTimeLine} 
            style={{ top: `${getCurrentTimePosition()}%` }}
          >
            <div className={styles.currentTimeIndicator}></div>
            <div className={styles.currentTimeText}>
              {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        )}
        
        {/* Créneaux de 15 minutes */}
        {timeSlots.map((slot) => {
          const slotTickets = todayTickets.filter(ticket => 
            ticket.hour === slot.hour && (ticket.minutes || 0) === slot.minutes
          )
          const isAvailable = isHourAvailable(slot.hour, getDateKey(), schedules, selectedTechnicianId)
          
          return (
            <div key={slot.slot} className={`${styles.hourRow} ${slot.minutes === 0 ? styles.fullHour : ''}`}>
              <div className={styles.timeLabel}>
                {formatTime(slot.hour, slot.minutes)}
              </div>
              <div 
                className={`${styles.hourContent} ${!isAvailable ? styles.unavailable : ''}`}
                onDrop={isAvailable ? (e) => handleDrop(e, slot.hour, slot.minutes) : undefined}
                onDragOver={isAvailable ? onDragOver : undefined}
              >
                {slotTickets.map((ticket) => {
                  const duration = ticket.estimated_duration || 30
                  const slots = getDurationSlots(duration)
                  const height = getTicketHeight(duration)
                  
                  return (
                    <div
                      key={ticket.id}
                      className={styles.ticketContainer}
                      style={{
                        height: `${height}px`,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 'var(--z-ticket)'
                      }}
                    >
                      <ModernTicket
                        id={ticket.id}
                        title={ticket.title}
                        color={ticket.color}
                        technician_id={ticket.technician_id}
                        technician_name={ticket.technician_name}
                        technician_color={ticket.technician_color}
                        technicians={ticket.technicians}
                        onDragStart={onDragStart}
                        onAddTechnician={onAddTechnician}
                        onRemoveTechnician={onRemoveTechnician}
                        onTicketClick={onTicketClick}
                        showActions={true}
                        isPlanned={true}
                        duration={duration}
                        slots={slots}
                        height={height}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      </div>
    </div>
  )
}

export default ModernDayView