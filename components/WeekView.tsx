import React from 'react'
import styles from './WeekView.module.css'
import Ticket from './Ticket'

interface WeekViewProps {
  droppedTickets: { [key: number]: any[] }
  onDrop: (dayNumber: number, ticket: any) => void
  onDragOver: (e: React.DragEvent) => void
  currentDate: Date
  onPreviousWeek: () => void
  onNextWeek: () => void
}

const WeekView: React.FC<WeekViewProps> = ({
  droppedTickets,
  onDrop,
  onDragOver,
  currentDate,
  onPreviousWeek,
  onNextWeek
}) => {
  // Jours de la semaine
  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
  
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
  
  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault()
    const ticketData = e.dataTransfer.getData('ticket')
    if (ticketData) {
      const ticket = JSON.parse(ticketData)
      onDrop(date.getDate(), ticket)
    }
  }
  
  // Formater la date pour l'affichage
  const formatDate = (date: Date) => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
    return `${date.getDate()} ${months[date.getMonth()]}`
  }
  
  return (
    <div className={styles.weekView}>
      {/* Navigation */}
      <div className={styles.weekHeader}>
        <button onClick={onPreviousWeek} className={styles.navButton}>
          ◀
        </button>
        <h3 className={styles.weekTitle}>
          Semaine du {formatDate(monday)}
        </h3>
        <button onClick={onNextWeek} className={styles.navButton}>
          ▶
        </button>
      </div>
      
      {/* Grille de la semaine */}
      <div className={styles.weekGrid}>
        {weekDays.map((date, index) => {
          const dayNumber = date.getDate()
          const isToday = date.toDateString() === new Date().toDateString()
          
          return (
            <div 
              key={index} 
              className={`${styles.dayColumn} ${isToday ? styles.today : ''}`}
              onDrop={(e) => handleDrop(e, date)}
              onDragOver={onDragOver}
            >
              <div className={styles.dayHeader}>
                <div className={styles.dayName}>{daysOfWeek[index]}</div>
                <div className={styles.dayNumber}>{dayNumber}</div>
              </div>
              <div className={styles.dayContent}>
                {droppedTickets[dayNumber] && droppedTickets[dayNumber].map((ticket) => (
                  <Ticket
                    key={ticket.id}
                    id={ticket.id}
                    title={ticket.title}
                    color={ticket.color}
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

export default WeekView