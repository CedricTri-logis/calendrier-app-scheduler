import React from 'react'
import styles from './WeekSelector.module.css'

interface WeekSelectorProps {
  currentWeek: Date
  onWeekChange: (week: Date) => void
}

const WeekSelector: React.FC<WeekSelectorProps> = ({ currentWeek, onWeekChange }) => {
  // Obtenir le lundi de la semaine
  const getMonday = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  // Obtenir le dimanche de la semaine
  const getSunday = (date: Date) => {
    const monday = getMonday(date)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return sunday
  }

  // Formater la date
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
    return date.toLocaleDateString('fr-FR', options)
  }

  // Navigation
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeek)
    newDate.setDate(currentWeek.getDate() - 7)
    onWeekChange(newDate)
  }

  const goToNextWeek = () => {
    const newDate = new Date(currentWeek)
    newDate.setDate(currentWeek.getDate() + 7)
    onWeekChange(newDate)
  }

  const goToCurrentWeek = () => {
    onWeekChange(new Date())
  }

  const monday = getMonday(currentWeek)
  const sunday = getSunday(currentWeek)

  // Vérifier si c'est la semaine courante
  const isCurrentWeek = () => {
    const today = new Date()
    const currentMonday = getMonday(today)
    return monday.toDateString() === currentMonday.toDateString()
  }

  return (
    <div className={styles.weekSelector}>
      <button 
        className={styles.navButton}
        onClick={goToPreviousWeek}
        title="Semaine précédente"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
        </svg>
      </button>

      <div className={styles.weekInfo}>
        <h2 className={styles.weekTitle}>
          {formatDate(monday)} - {formatDate(sunday)}
        </h2>
        <span className={styles.weekNumber}>
          Semaine {getWeekNumber(monday)}
        </span>
      </div>

      <button 
        className={styles.navButton}
        onClick={goToNextWeek}
        title="Semaine suivante"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
        </svg>
      </button>

      {!isCurrentWeek() && (
        <button 
          className={styles.todayButton}
          onClick={goToCurrentWeek}
          title="Revenir à la semaine courante"
        >
          Aujourd'hui
        </button>
      )}
    </div>
  )
}

// Obtenir le numéro de semaine
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export default WeekSelector