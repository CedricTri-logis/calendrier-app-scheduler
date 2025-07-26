// Utilitaires pour la gestion des tickets multi-techniciens

export interface Technician {
  id: number
  name: string
  color: string
  is_primary?: boolean
  active?: boolean
}

export interface Ticket {
  id: number
  title: string
  color: string
  date?: string | null
  hour?: number | null
  technician_id?: number | null
  technician_name?: string | null
  technician_color?: string | null
  technicians?: Technician[]
  created_at?: string
  updated_at?: string
}

/**
 * Normalise les données d'un ticket pour garantir la cohérence
 * entre l'ancien système (technician_id) et le nouveau (technicians[])
 */
export function normalizeTicket(ticket: any): Ticket {
  const normalized: Ticket = {
    id: ticket.id,
    title: ticket.title || 'Sans titre',
    color: ticket.color || '#fff3cd',
    date: ticket.date || null,
    hour: ticket.hour ?? null,
    created_at: ticket.created_at,
    updated_at: ticket.updated_at
  }

  // Si on a un tableau de techniciens (nouveau système)
  if (ticket.technicians && Array.isArray(ticket.technicians) && ticket.technicians.length > 0) {
    normalized.technicians = ticket.technicians
    
    // Trouver le technicien principal
    const primaryTech = ticket.technicians.find((t: Technician) => t.is_primary)
    const firstTech = primaryTech || ticket.technicians[0]
    
    // Synchroniser avec l'ancien système
    if (firstTech) {
      normalized.technician_id = firstTech.id
      normalized.technician_name = firstTech.name
      normalized.technician_color = firstTech.color
    }
  }
  // Si on a seulement l'ancien système
  else if (ticket.technician_id && ticket.technician) {
    normalized.technician_id = ticket.technician_id
    normalized.technician_name = ticket.technician.name || 'Technicien'
    normalized.technician_color = ticket.technician.color || '#3B82F6'
    
    // Créer un tableau pour le nouveau système
    normalized.technicians = [{
      id: ticket.technician_id,
      name: ticket.technician.name || 'Technicien',
      color: ticket.technician.color || '#3B82F6',
      is_primary: true,
      active: ticket.technician.active !== false
    }]
  }
  // Pas de technicien assigné
  else {
    normalized.technician_id = null
    normalized.technician_name = 'Non assigné'
    normalized.technician_color = '#6B7280'
    normalized.technicians = []
  }

  return normalized
}

/**
 * Vérifie si un ticket est planifié (a une date)
 */
export function isTicketPlanned(ticket: Ticket): boolean {
  return ticket.date !== null && ticket.date !== undefined
}

/**
 * Vérifie si un ticket a plusieurs techniciens
 */
export function hasMultipleTechnicians(ticket: Ticket): boolean {
  return (ticket.technicians?.length || 0) > 1
}

/**
 * Vérifie si un technicien est assigné à un ticket
 */
export function isTechnicianAssigned(ticket: Ticket, technicianId: number): boolean {
  return ticket.technicians?.some(t => t.id === technicianId) || false
}

/**
 * Obtient les IDs de tous les techniciens assignés
 */
export function getAssignedTechnicianIds(ticket: Ticket): number[] {
  return ticket.technicians?.map(t => t.id) || []
}

/**
 * Filtre les tickets selon le technicien sélectionné
 */
export function filterTicketsByTechnician(tickets: Ticket[], technicianId: number | null): Ticket[] {
  if (technicianId === null) {
    return tickets
  }
  
  return tickets.filter(ticket => isTechnicianAssigned(ticket, technicianId))
}

/**
 * Obtient le technicien principal d'un ticket
 */
export function getPrimaryTechnician(ticket: Ticket): Technician | null {
  if (!ticket.technicians || ticket.technicians.length === 0) {
    return null
  }
  
  return ticket.technicians.find(t => t.is_primary) || ticket.technicians[0]
}

/**
 * Valide si un technicien peut être ajouté à un ticket
 */
export function canAddTechnician(ticket: Ticket, technicianId: number): {
  canAdd: boolean
  reason?: string
} {
  // Vérifier si le ticket est planifié
  if (!isTicketPlanned(ticket)) {
    return { canAdd: false, reason: 'Le ticket doit être planifié avant d\'ajouter des techniciens' }
  }
  
  // Vérifier si le technicien est déjà assigné
  if (isTechnicianAssigned(ticket, technicianId)) {
    return { canAdd: false, reason: 'Ce technicien est déjà assigné à ce ticket' }
  }
  
  // Limite arbitraire de 5 techniciens par ticket
  if ((ticket.technicians?.length || 0) >= 5) {
    return { canAdd: false, reason: 'Maximum 5 techniciens par ticket' }
  }
  
  return { canAdd: true }
}

/**
 * Valide si un technicien peut être retiré d'un ticket
 */
export function canRemoveTechnician(ticket: Ticket, technicianId: number): {
  canRemove: boolean
  reason?: string
} {
  // Vérifier si le ticket est planifié
  if (isTicketPlanned(ticket)) {
    return { canRemove: false, reason: 'Le ticket doit être retiré du calendrier avant de modifier les techniciens' }
  }
  
  // Vérifier qu'il y a plusieurs techniciens
  if (!hasMultipleTechnicians(ticket)) {
    return { canRemove: false, reason: 'Impossible de retirer le seul technicien assigné' }
  }
  
  // Vérifier que le technicien est assigné
  if (!isTechnicianAssigned(ticket, technicianId)) {
    return { canRemove: false, reason: 'Ce technicien n\'est pas assigné à ce ticket' }
  }
  
  return { canRemove: true }
}