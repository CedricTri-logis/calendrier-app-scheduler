import React from 'react'
import styles from './DayView.module.css'
import Ticket from './Ticket'

interface DayViewProps {
  droppedTickets: { [key: string]: any[] }
  onDrop: (dayNumber: number, ticket: any, year?: number, month?: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDragStart: (e: React.DragEvent, ticketId: number) => void
  currentDate: Date
  onPreviousDay: () => void
  onNextDay: () => void
}

const DayView: React.FC<DayViewProps> = ({
  droppedTickets,
  onDrop,
  onDragOver,
  onDragStart,
  currentDate,
  onPreviousDay,
  onNextDay
}) => {
  // Heures de la journée (8h à 20h)
  const hours = Array.from({ length: 13 }, (_, i) => i + 8)
  
  // Formater la date pour l'affichage
  const formatDate = (date: Date) => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                   'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
    
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  }
  
  const handleDrop = (e: React.DragEvent, hour: number) => {
    e.preventDefault()
    const ticketData = e.dataTransfer.getData('ticket')
    if (ticketData) {
      const ticket = JSON.parse(ticketData)
      // On stocke toujours par jour, mais on pourrait ajouter l'heure au ticket
      onDrop(currentDate.getDate(), { ...ticket, hour }, currentDate.getFullYear(), currentDate.getMonth())
    }
  }
  
  // Fonction pour créer une clé de date
  const getDateKey = (): string => {
    return `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
  }
  
  const dayNumber = currentDate.getDate()
  const todayTickets = droppedTickets[getDateKey()] || []
  
  return (
    <div className={styles.dayView}>
      {/* Navigation */}
      <div className={styles.dayHeader}>
        <button onClick={onPreviousDay} className={styles.navButton}>
          ◀
        </button>
        <h3 className={styles.dayTitle}>
          {formatDate(currentDate)}
        </h3>
        <button onClick={onNextDay} className={styles.navButton}>
          ▶
        </button>
      </div>
      
      {/* Grille des heures */}
      <div className={styles.hoursContainer}>
        <div className={styles.hoursGrid}>
          {hours.map((hour) => (
            <div key={hour} className={styles.hourRow}>
              <div className={styles.hourLabel}>
                {hour}:00
              </div>
              <div 
                className={styles.hourContent}
                onDrop={(e) => handleDrop(e, hour)}
                onDragOver={onDragOver}
              >
                {/* Afficher les tickets de cette heure */}
                {todayTickets
                  .filter(ticket => ticket.hour === hour)
                  .map((ticket) => (
                    <Ticket
                      key={ticket.id}
                      id={ticket.id}
                      title={ticket.title}
                      color={ticket.color}
                      onDragStart={onDragStart}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Zone pour les tickets sans heure spécifique */}
        <div className={styles.allDaySection}>
          <div className={styles.allDayLabel}>Toute la journée</div>
          <div 
            className={styles.allDayContent}
            onDrop={(e) => handleDrop(e, -1)}
            onDragOver={onDragOver}
          >
            {todayTickets
              .filter(ticket => !ticket.hour || ticket.hour === -1)
              .map((ticket) => (
                <Ticket
                  key={ticket.id}
                  id={ticket.id}
                  title={ticket.title}
                  color={ticket.color}
                  onDragStart={onDragStart}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DayView