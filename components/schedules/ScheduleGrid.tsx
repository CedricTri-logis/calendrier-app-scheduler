import React, { useMemo } from 'react'
import styles from './ScheduleGrid.module.css'
import ScheduleCell from './ScheduleCell'
import { Schedule } from '../../hooks/useSchedules'
import { Technician } from '../../hooks/useTechnicians'

interface ScheduleGridProps {
  weekDates: Date[]
  schedules: Schedule[]
  technicians: Technician[]
  onAddSchedule: (date: string, technicianId: number) => void
  onEditSchedule: (schedule: Schedule) => void
  onDeleteSchedule: (schedule: Schedule) => void
}

const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  weekDates,
  schedules,
  technicians,
  onAddSchedule,
  onEditSchedule,
  onDeleteSchedule
}) => {
  // Jours de la semaine
  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
  
  // Créer un map des horaires par date et technicien
  const schedulesByDateAndTech = useMemo(() => {
    const map = new Map<string, Schedule[]>()
    
    schedules.forEach(schedule => {
      // Extraire seulement la partie date (YYYY-MM-DD) de l'ISO string
      const dateOnly = schedule.date.split('T')[0]
      const key = `${dateOnly}_${schedule.technician_id}`
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(schedule)
    })
    
    // Trier les horaires par heure de début
    map.forEach((scheduleList) => {
      scheduleList.sort((a, b) => a.start_time.localeCompare(b.start_time))
    })
    
    return map
  }, [schedules])

  // Formater la date pour l'affichage
  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    return `${day}/${month}`
  }

  // Formater la date pour la clé
  const formatDateKey = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Vérifier si c'est aujourd'hui
  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  // Calculer le total d'heures pour un technicien sur une date
  const calculateHours = (technicianId: number, date: Date) => {
    const dateKey = formatDateKey(date)
    const key = `${dateKey}_${technicianId}`
    const daySchedules = schedulesByDateAndTech.get(key) || []
    
    let totalMinutes = 0
    daySchedules.forEach(schedule => {
      if (schedule.type === 'available') {
        // Gérer les formats HH:MM et HH:MM:SS
        const startParts = schedule.start_time.split(':')
        const endParts = schedule.end_time.split(':')
        const startHour = Number(startParts[0])
        const startMin = Number(startParts[1])
        const endHour = Number(endParts[0])
        const endMin = Number(endParts[1])
        const minutes = (endHour * 60 + endMin) - (startHour * 60 + startMin)
        totalMinutes += minutes
      }
    })
    
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    if (hours === 0 && minutes === 0) return ''
    if (minutes === 0) return `${hours}h`
    return `${hours}h${minutes.toString().padStart(2, '0')}`
  }

  // Calculer le total d'heures hebdomadaire pour un technicien
  const calculateWeeklyHours = (technicianId: number) => {
    let totalMinutes = 0
    
    weekDates.forEach(date => {
      const dateKey = formatDateKey(date)
      const key = `${dateKey}_${technicianId}`
      const daySchedules = schedulesByDateAndTech.get(key) || []
      
      daySchedules.forEach(schedule => {
        if (schedule.type === 'available') {
          const [startHour, startMin] = schedule.start_time.split(':').map(Number)
          const [endHour, endMin] = schedule.end_time.split(':').map(Number)
          const minutes = (endHour * 60 + endMin) - (startHour * 60 + startMin)
          totalMinutes += minutes
        }
      })
    })
    
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    if (hours === 0 && minutes === 0) return '0h'
    if (minutes === 0) return `${hours}h`
    return `${hours}h${minutes.toString().padStart(2, '0')}`
  }

  // Filtrer les techniciens actifs
  const activeTechnicians = technicians.filter(tech => tech.active && tech.name !== 'Non assigné')

  return (
    <div className={styles.gridContainer}>
      <div className={styles.gridHeader}>
        <div className={styles.technicianColumn}>
          <div className={styles.headerCell}>Techniciens</div>
        </div>
        {weekDates.map((date, index) => (
          <div key={index} className={styles.dayColumn}>
            <div className={`${styles.headerCell} ${isToday(date) ? styles.today : ''}`}>
              <div className={styles.dayName}>{daysOfWeek[index]}</div>
              <div className={styles.dayDate}>{formatDate(date)}</div>
            </div>
          </div>
        ))}
        <div className={styles.totalColumn}>
          <div className={styles.headerCell}>Total</div>
        </div>
      </div>

      <div className={styles.gridBody}>
        {activeTechnicians.map(technician => (
          <div key={technician.id} className={styles.technicianRow}>
            <div className={styles.technicianColumn}>
              <div 
                className={styles.technicianInfo}
                style={{ borderLeftColor: technician.color }}
              >
                <div className={styles.technicianName}>{technician.name}</div>
              </div>
            </div>
            
            {weekDates.map((date, index) => {
              const dateKey = formatDateKey(date)
              const key = `${dateKey}_${technician.id}`
              const daySchedules = schedulesByDateAndTech.get(key) || []
              
              return (
                <div key={index} className={styles.dayColumn}>
                  <div className={styles.scheduleContainer}>
                    {daySchedules.length === 0 ? (
                      <ScheduleCell
                        date={dateKey}
                        technicianId={technician.id}
                        technicianColor={technician.color}
                        onAddClick={() => onAddSchedule(dateKey, technician.id)}
                        onEditClick={onEditSchedule}
                        onDeleteClick={onDeleteSchedule}
                      />
                    ) : (
                      daySchedules.map((schedule) => (
                        <ScheduleCell
                          key={schedule.id}
                          schedule={schedule}
                          date={dateKey}
                          technicianId={technician.id}
                          technicianColor={technician.color}
                          onAddClick={() => onAddSchedule(dateKey, technician.id)}
                          onEditClick={onEditSchedule}
                          onDeleteClick={onDeleteSchedule}
                        />
                      ))
                    )}
                    {daySchedules.length > 0 && (
                      <div className={styles.addMoreButton}>
                        <button
                          onClick={() => onAddSchedule(dateKey, technician.id)}
                          title="Ajouter un autre horaire"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                            <path d="M7 2a.5.5 0 0 1 .5.5v4h4a.5.5 0 0 1 0 1h-4v4a.5.5 0 0 1-1 0v-4h-4a.5.5 0 0 1 0-1h4v-4A.5.5 0 0 1 7 2z"/>
                          </svg>
                          Ajouter
                        </button>
                      </div>
                    )}
                  </div>
                  {calculateHours(technician.id, date) && (
                    <div className={styles.dayHours}>
                      {calculateHours(technician.id, date)}
                    </div>
                  )}
                </div>
              )
            })}
            
            <div className={styles.totalColumn}>
              <div className={styles.weeklyTotal}>
                {calculateWeeklyHours(technician.id)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ScheduleGrid