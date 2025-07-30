import { Technician } from '../hooks/useTechnicians'
import { Schedule } from '../hooks/useSchedules'
import { getDateAvailabilityStatus } from '../utils/scheduleHelpers'

export interface TechnicianAvailability {
  technicianId: number
  technicianName: string
  status: 'available' | 'partial' | 'unavailable' | 'unknown'
  statusEmoji: string
  scheduleTypes?: string[]
}

export class TechnicianService {
  /**
   * Obtient le statut de disponibilité d'un technicien pour une date donnée
   */
  static getTechnicianAvailability(
    technician: Technician,
    date: string,
    schedules: Schedule[]
  ): TechnicianAvailability {
    const status = getDateAvailabilityStatus(date, schedules, technician.id)
    
    let statusEmoji = ''
    if (status === 'available') statusEmoji = '✅'
    else if (status === 'partial') statusEmoji = '⚡'
    else if (status === 'unavailable') statusEmoji = '🚫'
    
    // Obtenir les types d'horaires pour cette date
    const daySchedules = schedules.filter(s => 
      s.technician_id === technician.id && s.date === date
    )
    const scheduleTypes = daySchedules.map(s => s.type)
    
    return {
      technicianId: technician.id,
      technicianName: technician.name,
      status,
      statusEmoji,
      scheduleTypes: scheduleTypes.length > 0 ? scheduleTypes : undefined
    }
  }
  
  /**
   * Filtre les techniciens actifs (exclut "Non assigné")
   */
  static getActiveTechnicians(technicians: Technician[]): Technician[] {
    return technicians.filter(tech => tech.active && tech.name !== 'Non assigné')
  }
  
  /**
   * Obtient les techniciens disponibles pour une date/heure spécifique
   */
  static getAvailableTechnicians(
    technicians: Technician[],
    date: string,
    hour: number | null,
    schedules: Schedule[]
  ): Technician[] {
    return technicians.filter(tech => {
      if (!tech.active || tech.name === 'Non assigné') return false
      
      const availability = TechnicianService.getTechnicianAvailability(tech, date, schedules)
      
      // Si pas disponible du tout, exclure
      if (availability.status === 'unavailable') return false
      
      // Si heure spécifique, vérifier la disponibilité horaire
      if (hour !== null && hour !== -1) {
        const daySchedules = schedules.filter(s => 
          s.technician_id === tech.id && s.date === date
        )
        
        // Si aucun horaire, considérer comme disponible
        if (daySchedules.length === 0) return true
        
        // Vérifier si l'heure est dans une plage disponible
        const isHourAvailable = daySchedules.some(schedule => {
          if (schedule.type === 'available') {
            // Parse les heures depuis start_time et end_time
            const startHour = parseInt(schedule.start_time.split(':')[0])
            const endHour = parseInt(schedule.end_time.split(':')[0])
            return hour >= startHour && hour < endHour
          }
          return false
        })
        
        // Si des horaires existent mais l'heure n'est pas disponible
        if (!isHourAvailable) return false
      }
      
      return true
    })
  }
  
  /**
   * Groupe les techniciens par statut de disponibilité
   */
  static groupTechniciansByAvailability(
    technicians: Technician[],
    date: string,
    schedules: Schedule[]
  ): {
    available: Technician[]
    partial: Technician[]
    unavailable: Technician[]
  } {
    const result = {
      available: [] as Technician[],
      partial: [] as Technician[],
      unavailable: [] as Technician[]
    }
    
    technicians.forEach(tech => {
      if (!tech.active || tech.name === 'Non assigné') return
      
      const availability = TechnicianService.getTechnicianAvailability(tech, date, schedules)
      
      switch (availability.status) {
        case 'available':
          result.available.push(tech)
          break
        case 'partial':
          result.partial.push(tech)
          break
        case 'unavailable':
          result.unavailable.push(tech)
          break
      }
    })
    
    return result
  }
  
  /**
   * Obtient les statistiques de charge de travail pour un technicien
   */
  static getTechnicianWorkload(
    technicianId: number,
    tickets: any[],
    dateRange?: { start: Date; end: Date }
  ): {
    totalTickets: number
    totalHours: number
    ticketsByDate: { [date: string]: number }
  } {
    // Filtrer les tickets du technicien
    const technicianTickets = tickets.filter(ticket => {
      // Vérifier si le technicien est assigné
      const isAssigned = ticket.technician_id === technicianId ||
        ticket.technicians?.some((t: any) => t.id === technicianId)
      
      if (!isAssigned || !ticket.date) return false
      
      // Vérifier la plage de dates si fournie
      if (dateRange) {
        const ticketDate = new Date(ticket.date)
        if (ticketDate < dateRange.start || ticketDate > dateRange.end) {
          return false
        }
      }
      
      return true
    })
    
    // Calculer les statistiques
    let totalHours = 0
    const ticketsByDate: { [date: string]: number } = {}
    
    technicianTickets.forEach(ticket => {
      // Compter les heures
      const duration = ticket.estimated_duration || 30 // 30 min par défaut
      totalHours += duration / 60
      
      // Compter par date
      if (ticket.date) {
        ticketsByDate[ticket.date] = (ticketsByDate[ticket.date] || 0) + 1
      }
    })
    
    return {
      totalTickets: technicianTickets.length,
      totalHours,
      ticketsByDate
    }
  }
}