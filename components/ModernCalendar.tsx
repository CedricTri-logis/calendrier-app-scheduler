import React from 'react'
import styles from './ModernCalendar.module.css'
import ModernTicket from './ModernTicket'

interface ModernCalendarProps {
  droppedTickets: { [key: string]: any[] }
  onDrop: (dayNumber: number, ticket: any, year?: number, month?: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDragStart: (e: React.DragEvent, ticketId: number) => void
  currentDate: Date
  onPreviousMonth: () => void
  onNextMonth: () => void
  onToday: () => void
}

const ModernCalendar: React.FC<ModernCalendarProps> = ({ 
  droppedTickets, 
  onDrop, 
  onDragOver,
  onDragStart,
  currentDate,
  onPreviousMonth,
  onNextMonth,
  onToday
}) => {
  // Jours de la semaine
  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  
  // Noms des mois en français
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]
  
  // Obtenir le premier jour du mois
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  
  // Ajuster pour que lundi = 0, dimanche = 6
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1
  if (startingDayOfWeek === -1) startingDayOfWeek = 6
  
  // Nombre de jours dans le mois
  const daysInMonth = lastDayOfMonth.getDate()
  
  // Obtenir aujourd'hui
  const today = new Date()
  const isToday = (day: number) => {
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear()
  }
  
  // Créer un tableau pour tous les jours à afficher
  const calendarDays = []
  
  // Ajouter des jours du mois précédent
  const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0)
  const prevMonthDays = prevMonth.getDate()
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    calendarDays.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
      isPrevMonth: true
    })
  }
  
  // Ajouter les jours du mois actuel
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: true,
      isPrevMonth: false
    })
  }
  
  // Ajouter des jours du mois suivant
  const remainingDays = 42 - calendarDays.length // 6 semaines * 7 jours
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: false,
      isPrevMonth: false
    })
  }

  const handleDrop = (e: React.DragEvent, dayNumber: number) => {
    e.preventDefault()
    const ticketData = e.dataTransfer.getData('ticket')
    if (ticketData) {
      const ticket = JSON.parse(ticketData)
      onDrop(dayNumber, ticket, currentDate.getFullYear(), currentDate.getMonth())
    }
  }
  
  // Fonction pour créer une clé de date au format YYYY-MM-DD
  const getDateKey = (year: number, month: number, day: number): string => {
    const monthStr = String(month + 1).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    return `${year}-${monthStr}-${dayStr}`
  }

  return (
    <div className={styles.calendar}>
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
        {calendarDays.map((dayInfo, index) => {
          const { day, isCurrentMonth } = dayInfo
          const dateKey = isCurrentMonth 
            ? getDateKey(currentDate.getFullYear(), currentDate.getMonth(), day)
            : null
          const dayTickets = dateKey ? (droppedTickets[dateKey] || []) : []
          const hasTickets = dayTickets.length > 0
          
          return (
            <div 
              key={index} 
              className={`
                ${styles.dayCell} 
                ${!isCurrentMonth ? styles.otherMonth : ''} 
                ${isCurrentMonth && isToday(day) ? styles.today : ''}
                ${hasTickets ? styles.hasEvents : ''}
              `}
              onDrop={isCurrentMonth ? (e) => handleDrop(e, day) : undefined}
              onDragOver={isCurrentMonth ? onDragOver : undefined}
            >
              <div className={styles.dayNumber}>
                {day}
              </div>
              
              {isCurrentMonth && (
                <div className={styles.dayContent}>
                  {dayTickets.slice(0, 3).map((ticket) => (
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
                  {dayTickets.length > 3 && (
                    <div className={styles.moreEvents}>
                      +{dayTickets.length - 3} autres
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ModernCalendar