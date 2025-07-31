import React, { useEffect, useState } from 'react'
import styles from './ModernWeekView.module.css'
import ModernTicket from './ModernTicket'
import { Schedule } from '../hooks/useSchedules'
import { 
  isHourAvailable, 
  getDateAvailabilityStatus,
  getUnavailabilityTypes,
  getScheduleTypeLabel,
  getScheduleTypeColor 
} from '../utils/scheduleHelpers'

import { Ticket } from '../utils/ticketHelpers'
import { useZoom } from '../contexts/ZoomContext'

interface ModernWeekViewProps {
  droppedTickets: { [key: string]: Ticket[] }
  onDrop: (dayNumber: number, ticket: Ticket, year?: number, month?: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDragStart: (e: React.DragEvent, ticketId: number) => void
  currentDate: Date
  onPreviousWeek: () => void
  onNextWeek: () => void
  onToday: () => void
  schedules: Schedule[]
  selectedTechnicianId: number | null
  onAddTechnician?: (ticketId: number) => void
  onRemoveTechnician?: (ticketId: number, technicianId: number) => void
  onTicketClick?: (ticketId: number) => void
}

const ModernWeekView: React.FC<ModernWeekViewProps> = ({
  droppedTickets,
  onDrop,
  onDragOver,
  onDragStart,
  currentDate,
  onPreviousWeek,
  onNextWeek,
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
  
  // Jours de la semaine
  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
  const daysOfWeekShort = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  
  // Créneaux de 15 minutes de 7h à 18h45 (48 créneaux)
  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 4) + 7
    const minutes = (i % 4) * 15
    return { slot: i, hour, minutes }
  })
  
  // Obtenir le lundi de la semaine actuelle
  const getMonday = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }
  
  const monday = getMonday(currentDate)
  const weekDays = []
  
  // Créer les 7 jours de la semaine
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    weekDays.push(day)
  }
  
  // Vérifier si c'est aujourd'hui
  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }
  
  // Calculer la position de la ligne de temps actuelle
  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours()
    const minutes = currentTime.getMinutes()
    return ((hours * 60 + minutes) / (24 * 60)) * 100
  }
  
  const handleDrop = (e: React.DragEvent, date: Date, hour?: number, minutes: number = 0) => {
    e.preventDefault()
    const ticketData = e.dataTransfer.getData('ticket')
    if (ticketData) {
      const ticket = JSON.parse(ticketData)
      const ticketWithHour = hour !== undefined ? { ...ticket, hour, minutes } : ticket
      onDrop(date.getDate(), ticketWithHour, date.getFullYear(), date.getMonth())
    }
  }
  
  // Fonction pour créer une clé de date au format YYYY-MM-DD
  const getDateKey = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  // Formater l'heure
  const formatTime = (hour: number, minutes: number) => {
    return `${hour}:${String(minutes).padStart(2, '0')}`
  }
  
  return (
    <div className={styles.weekView}>
      <div 
        className={styles.zoomContainer}
        style={{
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: 'top left',
          width: `${100 / (zoomLevel / 100)}%`,
          height: `${100 / (zoomLevel / 100)}%`
        }}
      >
        {/* Header avec les jours */}
        <div className={styles.header}>
        <div className={styles.timeGutter}></div>
        {weekDays.map((date, index) => {
          const dateKey = getDateKey(date)
          const availabilityStatus = getDateAvailabilityStatus(dateKey, schedules, selectedTechnicianId)
          const unavailabilityTypes = getUnavailabilityTypes(dateKey, schedules, selectedTechnicianId)
          
          return (
            <div 
              key={index} 
              className={`${styles.dayHeader} ${isToday(date) ? styles.today : ''} ${availabilityStatus === 'unavailable' ? styles.unavailable : ''}`}
            >
              <div className={styles.dayName}>{daysOfWeekShort[index]}</div>
              <div className={styles.dayNumber}>{date.getDate()}</div>
              {availabilityStatus !== 'unknown' && (
                <div className={styles.availabilityIndicators}>
                  {availabilityStatus === 'unavailable' && unavailabilityTypes.map(type => (
                    <span 
                      key={type}
                      className={styles.unavailabilityIcon}
                      style={{ color: getScheduleTypeColor(type) }}
                      title={getScheduleTypeLabel(type)}
                    >
                      {type === 'vacation' && '🏖️'}
                      {type === 'sick_leave' && '🏥'}
                      {type === 'break' && '☕'}
                      {type === 'unavailable' && '🚫'}
                    </span>
                  ))}
                  {availabilityStatus === 'partial' && (
                    <span className={styles.partialIcon} title="Partiellement disponible">⚡</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Zone pour les événements toute la journée */}
      <div className={styles.allDayRow}>
        <div className={styles.allDayLabel}>Journée</div>
        {weekDays.map((date, index) => {
          const dateKey = getDateKey(date)
          const allDayTickets = (droppedTickets[dateKey] || []).filter(
            ticket => !ticket.hour || ticket.hour === -1
          )
          
          return (
            <div 
              key={index}
              className={styles.allDayCell}
              onDrop={(e) => handleDrop(e, date, -1)}
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
                  isCompact={true}
                  showActions={true}
                  isPlanned={true}
                />
              ))}
            </div>
          )
        })}
      </div>
      
      {/* Grille horaire */}
      <div className={styles.timeGrid}>
        {/* Ligne de temps actuelle */}
        {weekDays.some(date => isToday(date)) && (
          <div 
            className={styles.currentTimeLine} 
            style={{ top: `${getCurrentTimePosition()}%` }}
          >
            <div className={styles.currentTimeIndicator}></div>
          </div>
        )}
        
        {/* Colonne des heures */}
        <div className={styles.timeColumn}>
          {timeSlots.map((slot) => (
            <div key={slot.slot} className={`${styles.timeSlot} ${slot.minutes === 0 ? styles.fullHour : ''}`}>
              <span className={styles.timeLabel}>
                {formatTime(slot.hour, slot.minutes)}
              </span>
            </div>
          ))}
        </div>
        
        {/* Colonnes des jours */}
        {weekDays.map((date, dayIndex) => {
          const dateKey = getDateKey(date)
          const dayTickets = droppedTickets[dateKey] || []
          
          return (
            <div 
              key={dayIndex} 
              className={`${styles.dayColumn} ${isToday(date) ? styles.todayColumn : ''}`}
            >
              {timeSlots.map((slot) => {
                const slotTickets = dayTickets.filter(ticket => 
                  ticket.hour === slot.hour && (ticket.minutes || 0) === slot.minutes
                )
                const isAvailable = isHourAvailable(slot.hour, dateKey, schedules, selectedTechnicianId)
                
                return (
                  <div
                    key={slot.slot}
                    className={`${styles.hourCell} ${!isAvailable ? styles.unavailable : ''} ${slot.minutes === 0 ? styles.fullHour : ''}`}
                    onDrop={isAvailable ? (e) => handleDrop(e, date, slot.hour, slot.minutes) : undefined}
                    onDragOver={isAvailable ? onDragOver : undefined}
                  >
                    {slotTickets.map((ticket) => (
                      <div key={ticket.id} className={styles.eventWrapper}>
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
                          isCompact={true}
                          showActions={true}
                          isPlanned={true}
                        />
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
      </div>
    </div>
  )
}

export default ModernWeekView