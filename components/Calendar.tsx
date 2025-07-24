import React from 'react'
import styles from './Calendar.module.css'
import Ticket from './Ticket'

interface CalendarProps {
  droppedTickets: { [key: number]: any }
  onDrop: (dayNumber: number, ticket: any) => void
  onDragOver: (e: React.DragEvent) => void
  currentDate: Date
  onPreviousMonth: () => void
  onNextMonth: () => void
}

const Calendar: React.FC<CalendarProps> = ({ 
  droppedTickets, 
  onDrop, 
  onDragOver,
  currentDate,
  onPreviousMonth,
  onNextMonth
}) => {
  // Jours de la semaine
  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  
  // Noms des mois en français
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]
  
  // Obtenir le premier jour du mois (0 = dimanche, 1 = lundi, etc.)
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  
  // Ajuster pour que lundi = 0, dimanche = 6
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1
  if (startingDayOfWeek === -1) startingDayOfWeek = 6
  
  // Nombre de jours dans le mois
  const daysInMonth = lastDayOfMonth.getDate()
  
  // Créer un tableau pour tous les jours à afficher (incluant les cases vides)
  const calendarDays = []
  
  // Ajouter des cases vides au début
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  
  // Ajouter les jours du mois
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i)
  }
  
  // Compléter avec des cases vides à la fin pour avoir 35 cases
  while (calendarDays.length < 35) {
    calendarDays.push(null)
  }

  const handleDrop = (e: React.DragEvent, dayNumber: number) => {
    e.preventDefault()
    const ticketData = e.dataTransfer.getData('ticket')
    if (ticketData) {
      const ticket = JSON.parse(ticketData)
      onDrop(dayNumber, ticket)
    }
  }

  return (
    <div className={styles.calendar}>
      {/* Navigation et titre du mois */}
      <div className={styles.monthHeader}>
        <button onClick={onPreviousMonth} className={styles.navButton}>
          ◀
        </button>
        <h3 className={styles.monthTitle}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <button onClick={onNextMonth} className={styles.navButton}>
          ▶
        </button>
      </div>
      
      {/* En-tête avec les jours de la semaine */}
      <div className={styles.weekHeader}>
        {daysOfWeek.map(day => (
          <div key={day} className={styles.weekDay}>
            {day}
          </div>
        ))}
      </div>
      
      {/* Grille des jours */}
      <div className={styles.daysGrid}>
        {calendarDays.map((dayNumber, index) => (
          <div 
            key={index} 
            className={`${styles.dayCell} ${dayNumber === null ? styles.emptyCell : ''}`}
            onDrop={dayNumber ? (e) => handleDrop(e, dayNumber) : undefined}
            onDragOver={dayNumber ? onDragOver : undefined}
          >
            {dayNumber && (
              <>
                <div className={styles.dayNumber}>{dayNumber}</div>
                <div className={styles.dayContent}>
                  {droppedTickets[dayNumber] && (
                    <Ticket
                      id={droppedTickets[dayNumber].id}
                      title={droppedTickets[dayNumber].title}
                      color={droppedTickets[dayNumber].color}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Calendar