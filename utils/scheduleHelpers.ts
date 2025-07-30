import { Schedule, ScheduleType } from '../hooks/useSchedules'

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
  
  // Vérifier si l'heure est dans une plage disponible ET non dans une plage indisponible
  const availableSlots = daySchedules.filter(s => s.type === 'available')
  const unavailableSlots = daySchedules.filter(s => s.type !== 'available')
  
  // D'abord vérifier si l'heure est dans une plage disponible
  const inAvailableSlot = availableSlots.some(schedule => {
    const [startHour, startMin] = schedule.start_time.split(':').map(Number)
    const [endHour, endMin] = schedule.end_time.split(':').map(Number)
    
    const startTime = startHour + startMin / 60
    const endTime = endHour + endMin / 60
    
    return hour >= startTime && hour < endTime
  })
  
  // Ensuite vérifier qu'elle n'est pas dans une plage indisponible
  const inUnavailableSlot = unavailableSlots.some(schedule => {
    const [startHour, startMin] = schedule.start_time.split(':').map(Number)
    const [endHour, endMin] = schedule.end_time.split(':').map(Number)
    
    const startTime = startHour + startMin / 60
    const endTime = endHour + endMin / 60
    
    return hour >= startTime && hour < endTime
  })
  
  return inAvailableSlot && !inUnavailableSlot
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
    // Vérifier si la date est dans la plage et que c'est une disponibilité
    if (schedule.date >= startDate && schedule.date <= endDate && schedule.type === 'available') {
      // Si un technicien est spécifié, vérifier que c'est le bon
      if (technicianId === null || technicianId === undefined || schedule.technician_id === technicianId) {
        availableDates.add(schedule.date)
      }
    }
  })
  
  return availableDates
}

/**
 * Type de disponibilité pour une date
 */
export type AvailabilityStatus = 'available' | 'partial' | 'unavailable' | 'unknown'

/**
 * Obtient le statut de disponibilité d'un technicien pour une date donnée
 */
export function getDateAvailabilityStatus(
  date: string,
  schedules: Schedule[],
  technicianId?: number | null
): AvailabilityStatus {
  // Filtrer les horaires pour la date donnée
  let daySchedules = schedules.filter(schedule => schedule.date === date)
  
  // Si un technicien est spécifié, filtrer par technicien
  if (technicianId !== null && technicianId !== undefined) {
    daySchedules = daySchedules.filter(schedule => schedule.technician_id === technicianId)
  }
  
  // Si aucun horaire pour ce jour, statut inconnu
  if (daySchedules.length === 0) {
    return 'unknown'
  }
  
  const availableSlots = daySchedules.filter(s => s.type === 'available')
  const unavailableSlots = daySchedules.filter(s => s.type !== 'available')
  
  // Si seulement des créneaux disponibles
  if (availableSlots.length > 0 && unavailableSlots.length === 0) {
    return 'available'
  }
  
  // Si seulement des créneaux indisponibles
  if (availableSlots.length === 0 && unavailableSlots.length > 0) {
    return 'unavailable'
  }
  
  // Si un mélange des deux
  if (availableSlots.length > 0 && unavailableSlots.length > 0) {
    return 'partial'
  }
  
  return 'unknown'
}

/**
 * Obtient les types d'indisponibilité pour une date
 */
export function getUnavailabilityTypes(
  date: string,
  schedules: Schedule[],
  technicianId?: number | null
): ScheduleType[] {
  // Filtrer les horaires pour la date donnée
  let daySchedules = schedules.filter(schedule => schedule.date === date)
  
  // Si un technicien est spécifié, filtrer par technicien
  if (technicianId !== null && technicianId !== undefined) {
    daySchedules = daySchedules.filter(schedule => schedule.technician_id === technicianId)
  }
  
  // Récupérer les types uniques d'indisponibilité
  const types = new Set<ScheduleType>()
  daySchedules
    .filter(s => s.type !== 'available')
    .forEach(s => types.add(s.type))
  
  return Array.from(types)
}

/**
 * Obtient un libellé pour le type de schedule
 */
export function getScheduleTypeLabel(type: ScheduleType): string {
  const labels: Record<ScheduleType, string> = {
    'available': 'Disponible',
    'unavailable': 'Indisponible',
    'vacation': 'Vacances',
    'sick_leave': 'Congé maladie',
    'break': 'Pause'
  }
  return labels[type] || type
}

/**
 * Obtient une couleur pour le type de schedule
 */
export function getScheduleTypeColor(type: ScheduleType): string {
  const colors: Record<ScheduleType, string> = {
    'available': '#4ade80',
    'unavailable': '#f87171',
    'vacation': '#60a5fa',
    'sick_leave': '#fb923c',
    'break': '#a78bfa'
  }
  return colors[type] || '#94a3b8'
}