import { Schedule } from '../hooks/useSchedules'

/**
 * Vérifie si une heure spécifique est disponible pour un technicien à une date donnée
 */
export function isHourAvailable(
  hour: number,
  date: string,
  schedules: Schedule[],
  technicianId?: number | null
): boolean {
  // Filtrer les horaires pour la date donnée
  let daySchedules = schedules.filter(schedule => schedule.date === date)
  
  // Si un technicien est spécifié, filtrer par technicien
  if (technicianId !== null && technicianId !== undefined) {
    daySchedules = daySchedules.filter(schedule => schedule.technician_id === technicianId)
  }
  
  // Si aucun horaire pour ce jour, pas disponible
  if (daySchedules.length === 0) {
    return false
  }
  
  // Vérifier si l'heure est dans une des plages disponibles
  return daySchedules.some(schedule => {
    const [startHour, startMin] = schedule.start_time.split(':').map(Number)
    const [endHour, endMin] = schedule.end_time.split(':').map(Number)
    
    const startTime = startHour + startMin / 60
    const endTime = endHour + endMin / 60
    
    // L'heure est disponible si elle est dans la plage
    return hour >= startTime && hour < endTime
  })
}

/**
 * Obtient tous les créneaux disponibles pour une date donnée
 */
export function getAvailableSlots(
  date: string,
  schedules: Schedule[],
  technicianId?: number | null
): Array<{ start: number; end: number }> {
  // Filtrer les horaires pour la date donnée
  let daySchedules = schedules.filter(schedule => schedule.date === date)
  
  // Si un technicien est spécifié, filtrer par technicien
  if (technicianId !== null && technicianId !== undefined) {
    daySchedules = daySchedules.filter(schedule => schedule.technician_id === technicianId)
  }
  
  // Convertir en plages horaires
  return daySchedules.map(schedule => {
    const [startHour, startMin] = schedule.start_time.split(':').map(Number)
    const [endHour, endMin] = schedule.end_time.split(':').map(Number)
    
    return {
      start: startHour + startMin / 60,
      end: endHour + endMin / 60
    }
  })
}

/**
 * Vérifie si une date a au moins une plage de disponibilité
 */
export function hasAvailability(
  date: string,
  schedules: Schedule[],
  technicianId?: number | null
): boolean {
  // Filtrer les horaires pour la date donnée
  let daySchedules = schedules.filter(schedule => schedule.date === date)
  
  // Si un technicien est spécifié, filtrer par technicien
  if (technicianId !== null && technicianId !== undefined) {
    daySchedules = daySchedules.filter(schedule => schedule.technician_id === technicianId)
  }
  
  return daySchedules.length > 0
}

/**
 * Obtient les dates qui ont des disponibilités dans une plage donnée
 */
export function getAvailableDates(
  schedules: Schedule[],
  startDate: string,
  endDate: string,
  technicianId?: number | null
): Set<string> {
  const availableDates = new Set<string>()
  
  schedules.forEach(schedule => {
    // Vérifier si la date est dans la plage
    if (schedule.date >= startDate && schedule.date <= endDate) {
      // Si un technicien est spécifié, vérifier que c'est le bon
      if (technicianId === null || technicianId === undefined || schedule.technician_id === technicianId) {
        availableDates.add(schedule.date)
      }
    }
  })
  
  return availableDates
}