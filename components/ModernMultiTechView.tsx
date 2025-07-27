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
  onRemoveTechnician
}) => {
  const [currentTime, setCurrentTime] = useState(new Date())
  
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
  
  const handleDrop = (e: React.DragEvent, hour: number, technicianId: number) => {
    e.preventDefault()
    const ticketData = e.dataTransfer.getData('ticket')
    if (ticketData) {
      const ticket = JSON.parse(ticketData)
      // Assigner automatiquement le ticket au technicien de la colonne
      onDrop(currentDate.getDate(), { ...ticket, hour, technician_id: technicianId }, currentDate.getFullYear(), currentDate.getMonth())
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
  
  // Formater l'heure
  const formatHour = (hour: number) => {
    return `${hour}:00`
  }
  
  // Fonction pour obtenir les tickets d'un technicien à une heure donnée
  const getTechnicianTicketsAtHour = (technicianId: number, hour: number) => {
    return todayTickets.filter(ticket => {
      // Vérifier si le ticket est assigné à ce technicien
      const isAssignedToTech = ticket.technician_id === technicianId || 
        (ticket.technicians && ticket.technicians.some((t: any) => t.id === technicianId))
      
      // Vérifier si le ticket est à cette heure
      const isAtThisHour = ticket.hour === hour
      
      return isAssignedToTech && isAtThisHour
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
                  onDrop={(e) => handleDrop(e, -1, technician.id)}
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
                      isCompact={true}
                      showActions={true}
                      isPlanned={true}
                    />
                  ))}
                </div>
                
                {/* Cellules horaires */}
                {hours.map((hour) => {
                  const isAvailable = isHourAvailable(hour, dateKey, schedules, technician.id)
                  const ticketsAtHour = getTechnicianTicketsAtHour(technician.id, hour)
                  
                  return (
                    <div
                      key={`${technician.id}-${hour}`}
                      className={`${styles.hourCell} ${!isAvailable ? styles.unavailableHour : ''}`}
                      onDrop={(e) => {
                        e.preventDefault()
                        if (isAvailable) {
                          handleDrop(e, hour, technician.id)
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        if (!isAvailable) {
                          e.dataTransfer.dropEffect = 'none'
                        }
                      }}
                    >
                      {ticketsAtHour.map((ticket) => (
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
                          isCompact={true}
                          showActions={true}
                          isPlanned={true}
                        />
                      ))}
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