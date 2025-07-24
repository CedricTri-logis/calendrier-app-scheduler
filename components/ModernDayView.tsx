import React, { useEffect, useState } from 'react'
import styles from './ModernDayView.module.css'
import ModernTicket from './ModernTicket'

interface ModernDayViewProps {
  droppedTickets: { [key: string]: any[] }
  onDrop: (dayNumber: number, ticket: any, year?: number, month?: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDragStart: (e: React.DragEvent, ticketId: number) => void
  currentDate: Date
  onPreviousDay: () => void
  onNextDay: () => void
  onToday: () => void
}

const ModernDayView: React.FC<ModernDayViewProps> = ({
  droppedTickets,
  onDrop,
  onDragOver,
  onDragStart,
  currentDate,
  onPreviousDay,
  onNextDay,
  onToday
}) => {
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Mettre à jour l'heure actuelle toutes les minutes
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    
    return () => clearInterval(timer)
  }, [])
  
  // Heures de la journée (0h à 23h)
  const hours = Array.from({ length: 24 }, (_, i) => i)
  
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
  
  const handleDrop = (e: React.DragEvent, hour: number) => {
    e.preventDefault()
    const ticketData = e.dataTransfer.getData('ticket')
    if (ticketData) {
      const ticket = JSON.parse(ticketData)
      onDrop(currentDate.getDate(), { ...ticket, hour }, currentDate.getFullYear(), currentDate.getMonth())
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
  const formatHour = (hour: number) => {
    return `${hour}:00`
  }
  
  return (
    <div className={styles.dayView}>
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
                technician={ticket.technician}
                onDragStart={onDragStart}
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
        
        {/* Heures et slots */}
        {hours.map((hour) => {
          const hourTickets = todayTickets.filter(ticket => ticket.hour === hour)
          
          return (
            <div key={hour} className={styles.hourRow}>
              <div className={styles.timeLabel}>
                {formatHour(hour)}
              </div>
              <div 
                className={styles.hourContent}
                onDrop={(e) => handleDrop(e, hour)}
                onDragOver={onDragOver}
              >
                {hourTickets.map((ticket) => (
                  <ModernTicket
                    key={ticket.id}
                    id={ticket.id}
                    title={ticket.title}
                    color={ticket.color}
                    technician={ticket.technician}
                    onDragStart={onDragStart}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ModernDayView