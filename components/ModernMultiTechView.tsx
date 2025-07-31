import React, { useEffect, useState } from 'react'
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
import {
  getSlotIndex,
  getTimeFromSlot,
  snapToQuarterHour,
  getDurationSlots,
  getTicketHeight,
  Ticket
} from '../utils/ticketHelpers'
import { useZoom } from '../contexts/ZoomContext'

interface ModernMultiTechViewProps {
  droppedTickets: { [key: string]: Ticket[] }
  onDrop: (dayNumber: number, ticket: Ticket, year?: number, month?: number) => void
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
    const { hour, minutes } = getTimeFromSlot(i)
    return { slot: i, hour, minutes }
  })
  
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
    
    // Si l'heure actuelle est en dehors de la plage affichée (7h-18h45)
    if (currentHour < 7) return -1
    if (currentHour > 18 || (currentHour === 18 && currentMinutes > 45)) return -1
    
    // Obtenir l'index du créneau actuel
    const currentSlot = getSlotIndex(currentHour, currentMinutes)
    if (currentSlot < 0) return -1
    
    // Calculer la position en pourcentage (48 créneaux = 100%)
    return (currentSlot / 48) * 100
  }
  
  const handleDrop = (e: React.DragEvent, hour: number, minutes: number, technicianId: number) => {
    e.preventDefault()
    const ticketData = e.dataTransfer.getData('ticket')
    if (ticketData) {
      const ticket = JSON.parse(ticketData)
      // Assigner automatiquement le ticket au technicien de la colonne
      onDrop(currentDate.getDate(), { ...ticket, hour, minutes, technician_id: technicianId }, currentDate.getFullYear(), currentDate.getMonth())
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
  
  // Formater l'heure avec minutes
  const formatTime = (hour: number, minutes: number) => {
    return `${hour}:${minutes.toString().padStart(2, '0')}`
  }
  
  // Fonction pour obtenir les tickets d'un technicien à un créneau donné
  const getTechnicianTicketsAtSlot = (technicianId: number, slotIndex: number) => {
    return todayTickets.filter(ticket => {
      // Vérifier si le ticket est assigné à ce technicien
      const isAssignedToTech = ticket.technician_id === technicianId || 
        (ticket.technicians && ticket.technicians.some((t: any) => t.id === technicianId))
      
      // Vérifier si le ticket commence à ce créneau
      const ticketSlot = getSlotIndex(ticket.hour || 0, ticket.minutes || 0)
      const duration = ticket.estimated_duration || 30
      const slots = getDurationSlots(duration)
      
      
      // Le ticket occupe ce créneau s'il commence avant ou à ce créneau
      // et se termine après ce créneau
      const occupiesSlot = ticketSlot <= slotIndex && slotIndex < ticketSlot + slots
      
      return isAssignedToTech && occupiesSlot && ticket.hour !== -1 && ticket.hour !== null
    })
  }
  
  // Obtenir les tickets "toute la journée" pour un technicien
  const getAllDayTicketsForTechnician = (technicianId: number) => {
    return todayTickets.filter(ticket => {
      const isAssignedToTech = ticket.technician_id === technicianId || 
        (ticket.technicians && ticket.technicians.some((t: any) => t.id === technicianId))
      
      const isAllDay = !ticket.hour || ticket.hour === -1
      
      return isAssignedToTech && isAllDay
    })
  }
  
  const timelinePosition = getCurrentTimePosition()
  
  return (
    <div className={styles.multiTechView}>
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
          {timeSlots.map((slot) => (
            <div key={slot.slot} className={styles.timeLabel}>
              {slot.minutes === 0 ? formatTime(slot.hour, slot.minutes) : ''}
            </div>
          ))}
        </div>
        
        {/* Colonnes des techniciens */}
        <div className={styles.technicianColumns}>
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
                <div 
                  className={styles.allDayCell}
                  onDrop={(e) => handleDrop(e, -1, 0, technician.id)}
                  onDragOver={onDragOver}
                >
                  {getAllDayTicketsForTechnician(technician.id).map((ticket) => (
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
                
                {/* Cellules des créneaux de 15 minutes */}
                {timeSlots.map((slot) => {
                  const isAvailable = isHourAvailable(slot.hour, dateKey, schedules, technician.id)
                  const ticketsAtSlot = getTechnicianTicketsAtSlot(technician.id, slot.slot)
                  
                  // Ne rendre le ticket que sur son créneau de départ
                  const ticketsStartingHere = ticketsAtSlot.filter(ticket => {
                    const ticketSlot = getSlotIndex(ticket.hour || 0, ticket.minutes || 0)
                    return ticketSlot === slot.slot
                  })
                  
                  return (
                    <div
                      key={`${technician.id}-${slot.slot}`}
                      className={`${styles.slotCell} ${!isAvailable ? styles.unavailableSlot : ''}`}
                      onDrop={(e) => {
                        e.preventDefault()
                        if (isAvailable) {
                          handleDrop(e, slot.hour, slot.minutes, technician.id)
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        if (!isAvailable) {
                          e.dataTransfer.dropEffect = 'none'
                        }
                      }}
                    >
                      {ticketsStartingHere.map((ticket) => {
                        const duration = ticket.estimated_duration || 30
                        const slots = getDurationSlots(duration)
                        
                        return (
                          <div
                            key={ticket.id}
                            className={styles.ticketContainer}
                            style={{
                              gridRow: `span ${slots}`,
                              height: `${getTicketHeight(duration)}px`
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
                              isCompact={true}
                              showActions={true}
                              isPlanned={true}
                              duration={duration}
                              startTime={formatTime(ticket.hour || 0, ticket.minutes || 0)}
                              slots={slots}
                              height={slots * 20 - 4}
                            />
                          </div>
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
    </div>
  )
}

export default ModernMultiTechView