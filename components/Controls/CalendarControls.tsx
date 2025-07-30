import React from 'react'
import styles from '../../styles/ModernHome.module.css'
import Input from '../ui/Input'
import { useCalendarState, useCalendarActions } from '../../contexts/CalendarContext'
import { formatDateForDB } from '../../utils/dateHelpers'
import { getDateAvailabilityStatus } from '../../utils/scheduleHelpers'

export default function CalendarControls() {
  const state = useCalendarState()
  const { dispatch } = useCalendarActions()
  
  const {
    currentDate,
    viewMode,
    selectedTechnicianId,
    technicians,
    schedules
  } = state
  
  // Obtenir le titre de navigation
  const getNavigationTitle = () => {
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]
    
    if (viewMode === 'month') {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    } else if (viewMode === 'week') {
      const monday = new Date(currentDate)
      const day = monday.getDay()
      const diff = monday.getDate() - day + (day === 0 ? -6 : 1)
      monday.setDate(diff)
      return `Semaine du ${monday.getDate()} ${monthNames[monday.getMonth()]}`
    } else {
      const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
      return `${days[currentDate.getDay()]} ${currentDate.getDate()} ${monthNames[currentDate.getMonth()]}`
    }
  }
  
  return (
    <div className={styles.calendarControls}>
      <div className={styles.navigationGroup}>
        <button 
          onClick={() => dispatch({ type: 'GO_TO_PREVIOUS_PERIOD' })} 
          className={styles.navButton}
        >
          ‹
        </button>
        <div className={styles.navigationTitle}>
          {getNavigationTitle()}
        </div>
        <button 
          onClick={() => dispatch({ type: 'GO_TO_NEXT_PERIOD' })} 
          className={styles.navButton}
        >
          ›
        </button>
        <button 
          onClick={() => dispatch({ type: 'GO_TO_TODAY' })} 
          className={styles.todayButton}
        >
          Aujourd'hui
        </button>
      </div>
      
      <div className={styles.viewControls}>
        <div className={styles.viewButtonGroup}>
          <button 
            className={`${styles.viewButton} ${viewMode === 'month' ? styles.active : ''}`}
            onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'month' })}
          >
            Mois
          </button>
          <button 
            className={`${styles.viewButton} ${viewMode === 'week' ? styles.active : ''}`}
            onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'week' })}
          >
            Semaine
          </button>
          <button 
            className={`${styles.viewButton} ${viewMode === 'day' ? styles.active : ''}`}
            onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'day' })}
          >
            Jour
          </button>
          <button 
            className={`${styles.viewButton} ${viewMode === 'multiTech' ? styles.active : ''}`}
            onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'multiTech' })}
          >
            Multi-Tech
          </button>
        </div>
      </div>
      
      {viewMode !== 'multiTech' && (
        <div className={styles.filterSection}>
          <label className={styles.filterLabel}>Technicien:</label>
          <div style={{ minWidth: '200px' }}>
            <Input
              variant="select"
              value={selectedTechnicianId || ''}
              onChange={(e) => dispatch({ 
                type: 'SET_SELECTED_TECHNICIAN', 
                payload: e.target.value ? parseInt(e.target.value) : null 
              })}
              options={[
                { value: '', label: 'Tous les techniciens' },
                ...technicians.filter(tech => tech.active).map(tech => {
                  const todayKey = formatDateForDB(new Date())
                  const todayStatus = getDateAvailabilityStatus(todayKey, schedules, tech.id)
                  let statusEmoji = ''
                  if (todayStatus === 'available') statusEmoji = '✅ '
                  else if (todayStatus === 'partial') statusEmoji = '⚡ '
                  else if (todayStatus === 'unavailable') statusEmoji = '🚫 '
                  return {
                    value: tech.id.toString(),
                    label: `${statusEmoji}${tech.name}`
                  }
                })
              ]}
              fullWidth
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Composant séparé pour la légende des disponibilités
export function AvailabilityLegend() {
  return (
    <div className={styles.availabilityLegend}>
      <span className={styles.legendTitle}>Légende:</span>
      <div className={styles.legendItems}>
        <div className={styles.legendItem}>
          <span className={styles.legendIcon} style={{ backgroundColor: 'var(--success-green)' }}>✓</span>
          <span className={styles.legendText}>Disponible</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendIcon} style={{ backgroundColor: 'var(--warning-orange)' }}>⚡</span>
          <span className={styles.legendText}>Partiellement</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendIcon} style={{ backgroundColor: '#60a5fa' }}>🏖️</span>
          <span className={styles.legendText}>Vacances</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendIcon} style={{ backgroundColor: '#fb923c' }}>🏥</span>
          <span className={styles.legendText}>Congé maladie</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendIcon} style={{ backgroundColor: '#a78bfa' }}>☕</span>
          <span className={styles.legendText}>Pause</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendIcon} style={{ backgroundColor: '#f87171' }}>🚫</span>
          <span className={styles.legendText}>Indisponible</span>
        </div>
      </div>
    </div>
  )
}