import React, { useEffect, useState } from 'react'
import styles from './ModernWeekView.module.css'
import ModernTicket from './ModernTicket'

interface ModernWeekViewProps {
  droppedTickets: { [key: string]: any[] }
  onDrop: (dayNumber: number, ticket: any, year?: number, month?: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDragStart: (e: React.DragEvent, ticketId: number) => void
  currentDate: Date
  onPreviousWeek: () => void
  onNextWeek: () => void
  onToday: () => void
}

const ModernWeekView: React.FC<ModernWeekViewProps> = ({
  droppedTickets,
  onDrop,
  onDragOver,
  onDragStart,
  currentDate,
  onPreviousWeek,
  onNextWeek,
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
  
  // Jours de la semaine
  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
  const daysOfWeekShort = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  
  // Heures de la journée (0h à 23h)
  const hours = Array.from({ length: 24 }, (_, i) => i)
  
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
  
  const handleDrop = (e: React.DragEvent, date: Date, hour?: number) => {
    e.preventDefault()
    const ticketData = e.dataTransfer.getData('ticket')
    if (ticketData) {
      const ticket = JSON.parse(ticketData)
      const ticketWithHour = hour !== undefined ? { ...ticket, hour } : ticket
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
  const formatHour = (hour: number) => {
    return `${hour}:00`
  }
  
  return (
    <div className={styles.weekView}>
      {/* Header avec les jours */}
      <div className={styles.header}>
        <div className={styles.timeGutter}></div>
        {weekDays.map((date, index) => (
          <div 
            key={index} 
            className={`${styles.dayHeader} ${isToday(date) ? styles.today : ''}`}
          >
            <div className={styles.dayName}>{daysOfWeekShort[index]}</div>
            <div className={styles.dayNumber}>{date.getDate()}</div>
          </div>
        ))}
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
                  technician={ticket.technician}
                  onDragStart={onDragStart}
                  isCompact={true}
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
          {hours.map((hour) => (
            <div key={hour} className={styles.timeSlot}>
              <span className={styles.timeLabel}>{formatHour(hour)}</span>
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
              {hours.map((hour) => {
                const hourTickets = dayTickets.filter(ticket => ticket.hour === hour)
                
                return (
                  <div
                    key={hour}
                    className={styles.hourCell}
                    onDrop={(e) => handleDrop(e, date, hour)}
                    onDragOver={onDragOver}
                  >
                    {hourTickets.map((ticket) => (
                      <div key={ticket.id} className={styles.eventWrapper}>
                        <ModernTicket
                          id={ticket.id}
                          title={ticket.title}
                          color={ticket.color}
                          technician={ticket.technician}
                          onDragStart={onDragStart}
                          isCompact={true}
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
  )
}

export default ModernWeekView