import { Ticket } from '../utils/ticketHelpers'
import { Schedule } from '../hooks/useSchedules'
import { getDateAvailabilityStatus, isHourAvailable } from '../utils/scheduleHelpers'

export interface ValidationResult {
  isValid: boolean
  error?: string
}

export interface DropValidationParams {
  ticket: any
  dateString: string
  hour: number
  technicianId: number | null
  schedules: Schedule[]
  technicians: any[]
}

export class TicketService {
  /**
   * Valide qu'un ticket peut être déposé sur une date/heure spécifique
   */
  static validateDrop(params: DropValidationParams): ValidationResult {
    const { dateString, hour, technicianId, schedules, technicians } = params
    
    // Pas de technicien assigné
    if (!technicianId) {
      return { isValid: true }
    }
    
    // Vérifier la disponibilité générale
    const availabilityStatus = getDateAvailabilityStatus(dateString, schedules, technicianId)
    
    if (availabilityStatus === 'unavailable') {
      return {
        isValid: false,
        error: 'Ce technicien n\'est pas disponible à cette date.'
      }
    }
    
    // Vérifier la disponibilité horaire si nécessaire
    if (hour !== -1) {
      const isAvailable = isHourAvailable(hour, dateString, schedules, technicianId)
      if (!isAvailable) {
        const date = new Date(dateString)
        return {
          isValid: false,
          error: `Ce technicien n'est pas disponible à ${hour}h00 le ${date.toLocaleDateString('fr-FR')}.`
        }
      }
    }
    
    // Avertissement pour disponibilité partielle (mais toujours valide)
    if (availabilityStatus === 'partial') {
      const technicianName = technicians.find(t => t.id === technicianId)?.name || 'Ce technicien'
      // Note: Dans un vrai système, on pourrait retourner un warning plutôt qu'utiliser confirm
      return {
        isValid: true,
        error: `${technicianName} a une disponibilité limitée à cette date.`
      }
    }
    
    return { isValid: true }
  }
  
  /**
   * Valide qu'un ticket peut être créé avec les données fournies
   */
  static validateTicketCreation(title: string, color: string): ValidationResult {
    if (!title || title.trim().length === 0) {
      return {
        isValid: false,
        error: 'Le titre du ticket est requis'
      }
    }
    
    if (title.trim().length > 255) {
      return {
        isValid: false,
        error: 'Le titre ne peut pas dépasser 255 caractères'
      }
    }
    
    if (!color || !color.match(/^#[0-9A-F]{6}$/i)) {
      return {
        isValid: false,
        error: 'La couleur doit être au format hexadécimal (#RRGGBB)'
      }
    }
    
    return { isValid: true }
  }
  
  /**
   * Valide qu'un technicien peut être ajouté à un ticket
   */
  static validateTechnicianAddition(
    ticket: Ticket,
    technicianId: number,
    schedules: Schedule[],
    technicians: any[]
  ): ValidationResult {
    // Vérifier que le ticket est planifié
    if (!ticket.date) {
      return {
        isValid: false,
        error: 'Le ticket doit être planifié avant d\'ajouter des techniciens'
      }
    }
    
    // Vérifier que le technicien n'est pas déjà assigné
    const isAlreadyAssigned = ticket.technicians?.some(t => t.id === technicianId) || 
                              ticket.technician_id === technicianId
    if (isAlreadyAssigned) {
      return {
        isValid: false,
        error: 'Ce technicien est déjà assigné à ce ticket'
      }
    }
    
    // Limite de techniciens
    const currentCount = ticket.technicians?.length || 0
    if (currentCount >= 5) {
      return {
        isValid: false,
        error: 'Maximum 5 techniciens par ticket'
      }
    }
    
    // Vérifier la disponibilité
    const availabilityStatus = getDateAvailabilityStatus(ticket.date, schedules, technicianId)
    
    if (availabilityStatus === 'unavailable') {
      return {
        isValid: false,
        error: 'Ce technicien n\'est pas disponible à cette date'
      }
    }
    
    // Vérifier la disponibilité horaire si nécessaire
    if (ticket.hour !== null && ticket.hour !== undefined && ticket.hour !== -1) {
      const isAvailable = isHourAvailable(ticket.hour, ticket.date, schedules, technicianId)
      if (!isAvailable) {
        const date = new Date(ticket.date)
        return {
          isValid: false,
          error: `Ce technicien n'est pas disponible à ${ticket.hour}h00 le ${date.toLocaleDateString('fr-FR')}`
        }
      }
    }
    
    // Avertissement pour disponibilité partielle
    if (availabilityStatus === 'partial') {
      const technicianName = technicians.find(t => t.id === technicianId)?.name || 'Ce technicien'
      return {
        isValid: true,
        error: `${technicianName} a une disponibilité limitée à cette date`
      }
    }
    
    return { isValid: true }
  }
  
  /**
   * Valide qu'un technicien peut être retiré d'un ticket
   */
  static validateTechnicianRemoval(ticket: Ticket): ValidationResult {
    // Vérifier qu'il y a plusieurs techniciens
    const technicianCount = ticket.technicians?.length || 0
    
    if (technicianCount <= 1) {
      return {
        isValid: false,
        error: 'Impossible de retirer le seul technicien assigné'
      }
    }
    
    return { isValid: true }
  }
  
  /**
   * Valide les détails d'un ticket (description et durée)
   */
  static validateTicketDetails(description: string | null, duration: number | null): ValidationResult {
    if (description !== null && description.length > 1000) {
      return {
        isValid: false,
        error: 'La description ne peut pas dépasser 1000 caractères'
      }
    }
    
    if (duration !== null) {
      if (duration < 15) {
        return {
          isValid: false,
          error: 'La durée minimale est de 15 minutes'
        }
      }
      
      if (duration > 480) {
        return {
          isValid: false,
          error: 'La durée maximale est de 8 heures (480 minutes)'
        }
      }
      
      if (duration % 15 !== 0) {
        return {
          isValid: false,
          error: 'La durée doit être un multiple de 15 minutes'
        }
      }
    }
    
    return { isValid: true }
  }
}