import { z } from 'zod'

// Schémas de validation
export const TicketSchema = z.object({
  title: z.string()
    .min(1, 'Le titre est requis')
    .max(255, 'Le titre ne peut pas dépasser 255 caractères')
    .trim(),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'La couleur doit être au format hexadécimal (#RRGGBB)'),
  technician_id: z.number().nullable().optional(),
  date: z.string().nullable().optional(),
  hour: z.number().min(-1).max(23).nullable().optional(),
  minutes: z.number().min(0).max(45).step(15).nullable().optional(),
  description: z.string().max(1000, 'La description ne peut pas dépasser 1000 caractères').nullable().optional(),
  estimated_duration: z.number()
    .min(15, 'La durée minimale est de 15 minutes')
    .max(480, 'La durée maximale est de 8 heures')
    .multipleOf(15, 'La durée doit être un multiple de 15 minutes')
    .nullable()
    .optional()
})

export const TechnicianSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
  active: z.boolean()
})

export const ScheduleSchema = z.object({
  id: z.number(),
  technician_id: z.number(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  schedule_type: z.enum(['work', 'vacation', 'sick_leave', 'break', 'other']),
  start_hour: z.number().min(0).max(23),
  end_hour: z.number().min(0).max(24),
  description: z.string().optional()
})

// Types dérivés des schémas
export type ValidatedTicket = z.infer<typeof TicketSchema>
export type ValidatedTechnician = z.infer<typeof TechnicianSchema>
export type ValidatedSchedule = z.infer<typeof ScheduleSchema>

// Service de validation
export class ValidationService {
  /**
   * Valide et nettoie les données d'un ticket
   */
  static validateTicket(data: unknown): { 
    success: boolean
    data?: ValidatedTicket
    errors?: z.ZodError 
  } {
    try {
      const validated = TicketSchema.parse(data)
      return { success: true, data: validated }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, errors: error }
      }
      throw error
    }
  }
  
  /**
   * Valide et nettoie les données d'un technicien
   */
  static validateTechnician(data: unknown): { 
    success: boolean
    data?: ValidatedTechnician
    errors?: z.ZodError 
  } {
    try {
      const validated = TechnicianSchema.parse(data)
      return { success: true, data: validated }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, errors: error }
      }
      throw error
    }
  }
  
  /**
   * Valide et nettoie les données d'un horaire
   */
  static validateSchedule(data: unknown): { 
    success: boolean
    data?: ValidatedSchedule
    errors?: z.ZodError 
  } {
    try {
      const validated = ScheduleSchema.parse(data)
      return { success: true, data: validated }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, errors: error }
      }
      throw error
    }
  }
  
  /**
   * Sanitize une chaîne de caractères pour éviter les injections
   */
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Retirer les caractères HTML dangereux
      .trim()
      .slice(0, 1000) // Limiter la longueur
  }
  
  /**
   * Valide une date au format YYYY-MM-DD
   */
  static isValidDateString(date: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/
    if (!regex.test(date)) return false
    
    const parsed = new Date(date)
    return !isNaN(parsed.getTime())
  }
  
  /**
   * Valide une couleur hexadécimale
   */
  static isValidHexColor(color: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(color)
  }
  
  /**
   * Formate les erreurs de validation pour l'affichage
   */
  static formatValidationErrors(errors: z.ZodError): string[] {
    return errors.errors.map(err => {
      const field = err.path.join('.')
      return `${field}: ${err.message}`
    })
  }
  
  /**
   * Obtient le premier message d'erreur
   */
  static getFirstErrorMessage(errors: z.ZodError): string {
    const firstError = errors.errors[0]
    if (!firstError) return 'Erreur de validation'
    
    return firstError.message
  }
}