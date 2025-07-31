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
  minutes?: number | null
  technician_id?: number | null
  technician_name?: string | null
  technician_color?: string | null
  technicians?: Technician[]
  description?: string | null
  estimated_duration?: number | null  // en minutes
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
    minutes: ticket.minutes ?? null,
    description: ticket.description || null,
    estimated_duration: ticket.estimated_duration || null,
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
  // Si on a seulement technician_id sans la relation chargée
  else if (ticket.technician_id) {
    normalized.technician_id = ticket.technician_id
    // Essayer de récupérer les infos depuis le ticket lui-même
    normalized.technician_name = ticket.technician_name || 'Technicien'
    normalized.technician_color = ticket.technician_color || '#3B82F6'
    // Créer un tableau minimal pour ne pas perdre le ticket
    normalized.technicians = []
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
  // Vérifier d'abord le technician_id principal
  if (ticket.technician_id === technicianId) {
    return true
  }
  
  // Puis vérifier dans le tableau des techniciens
  return ticket.technicians?.some(t => t.id === technicianId) || false
}

/**
 * Obtient les IDs de tous les techniciens assignés
 */
export function getAssignedTechnicianIds(ticket: Ticket): number[] {
  const ids: number[] = []
  
  // Ajouter le technician_id principal s'il existe
  if (ticket.technician_id) {
    ids.push(ticket.technician_id)
  }
  
  // Ajouter les IDs du tableau technicians
  if (ticket.technicians) {
    ticket.technicians.forEach(t => {
      if (!ids.includes(t.id)) {
        ids.push(t.id)
      }
    })
  }
  
  return ids
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

/**
 * Convertit heure + minutes en index de créneau (0-47 pour 7h00 à 18h45)
 */
export function getSlotIndex(hour: number, minutes: number): number {
  // Limiter aux heures valides (7h-18h)
  if (hour < 7 || hour > 18) return -1
  if (hour === 18 && minutes > 45) return -1
  
  // Calculer l'index du créneau (4 créneaux par heure)
  return (hour - 7) * 4 + Math.floor(minutes / 15)
}

/**
 * Convertit un index de créneau en heure et minutes
 */
export function getTimeFromSlot(slotIndex: number): { hour: number; minutes: number } {
  // Valider l'index
  if (slotIndex < 0 || slotIndex > 47) {
    return { hour: 7, minutes: 0 }
  }
  
  const hour = Math.floor(slotIndex / 4) + 7
  const minutes = (slotIndex % 4) * 15
  
  return { hour, minutes }
}

/**
 * Arrondit les minutes au quart d'heure le plus proche
 */
export function snapToQuarterHour(minutes: number): number {
  return Math.round(minutes / 15) * 15
}

/**
 * Calcule le nombre de créneaux nécessaires pour une durée donnée
 */
export function getDurationSlots(duration: number): number {
  // Minimum 1 créneau (15 minutes)
  if (!duration || duration < 15) return 2 // 30 minutes par défaut
  
  // Arrondir au créneau supérieur
  return Math.ceil(duration / 15)
}

/**                                                                                                  
* Calcule la hauteur en pixels d'un ticket basée sur sa durée                                       
@param duration - Durée en minutes                                                               
@returns Hauteur en pixels                                                                      
│ │  */                                                                                                 
export function getTicketHeight(duration: number): number {                                        
  const slots = getDurationSlots(duration)                                                         
  // Utilise les variables CSS pour la hauteur des créneaux et le padding
  // Note: En production, ces valeurs pourraient être passées en paramètres ou récupérées du DOM
  const slotHeight = 20; // var(--slot-height)
  const slotPadding = 4; // var(--slot-padding)
  return (slots * slotHeight) - slotPadding;
}  

/**
 * Calcule l'heure de fin d'un ticket
 */
function calculateEndTime(hour: number, minutes: number, duration: number): string {
  const totalMinutes = hour * 60 + minutes + duration;
  const endHour = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHour}h${String(endMinutes).padStart(2, '0')}`;
}

/**
 * Vérifie si deux plages horaires se chevauchent
 */
export function doTimeSlotsOverlap(
  start1: { hour: number; minutes: number },
  duration1: number,
  start2: { hour: number; minutes: number },
  duration2: number
): boolean {
  // Cas spécial : ticket toute la journée
  if (start1.hour === -1 || start2.hour === -1) {
    return true; // Toujours en conflit
  }
  
  const end1Minutes = (start1.hour * 60 + start1.minutes) + duration1;
  const end2Minutes = (start2.hour * 60 + start2.minutes) + duration2;
  const start1Minutes = start1.hour * 60 + start1.minutes;
  const start2Minutes = start2.hour * 60 + start2.minutes;
  
  return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
}

/**
 * Vérifie les conflits d'horaire pour un ticket avec un seul technicien
 */
export function checkTicketConflicts(
  ticket: Ticket,
  existingTickets: Ticket[],
  newDate: string,
  newHour: number,
  newMinutes: number,
  newTechnicianId?: number
): { 
  hasConflict: boolean; 
  conflictingTickets: Ticket[]; 
  message?: string 
} {
  // Utiliser la durée par défaut si non définie
  const duration = ticket.estimated_duration || 30;
  
  // Filtrer les tickets de la même date et du même technicien
  const techId = newTechnicianId || ticket.technician_id;
  const relevantTickets = existingTickets.filter(t => 
    t.date === newDate && 
    t.id !== ticket.id &&
    (t.technician_id === techId || 
     t.technicians?.some(tech => tech.id === techId))
  );
  
  const conflicts: Ticket[] = [];
  
  for (const existingTicket of relevantTickets) {
    if (doTimeSlotsOverlap(
      { hour: newHour, minutes: newMinutes },
      duration,
      { hour: existingTicket.hour || 0, minutes: existingTicket.minutes || 0 },
      existingTicket.estimated_duration || 30
    )) {
      conflicts.push(existingTicket);
    }
  }
  
  if (conflicts.length > 0) {
    const firstConflict = conflicts[0];
    const endTime = calculateEndTime(firstConflict.hour || 0, firstConflict.minutes || 0, firstConflict.estimated_duration || 30);
    const message = `Ce créneau est déjà occupé par le ticket "${firstConflict.title}" de ${firstConflict.hour}h${String(firstConflict.minutes || 0).padStart(2, '0')} à ${endTime}`;
    return { hasConflict: true, conflictingTickets: conflicts, message };
  }
  
  return { hasConflict: false, conflictingTickets: [] };
}

/**
 * Vérifie les conflits d'horaire pour un ticket avec plusieurs techniciens
 */
export function checkMultiTechnicianConflicts(
  ticket: Ticket,
  existingTickets: Ticket[],
  newDate: string,
  newHour: number,
  newMinutes: number
): { 
  hasConflict: boolean; 
  conflictsByTechnician: Map<number, Ticket[]>; 
  message?: string 
} {
  const conflictsByTech = new Map<number, Ticket[]>();
  const allTechnicianIds = ticket.technicians?.map(t => t.id) || [];
  
  if (ticket.technician_id && !allTechnicianIds.includes(ticket.technician_id)) {
    allTechnicianIds.push(ticket.technician_id);
  }
  
  for (const techId of allTechnicianIds) {
    const result = checkTicketConflicts(
      ticket, 
      existingTickets, 
      newDate, 
      newHour, 
      newMinutes, 
      techId
    );
    
    if (result.hasConflict) {
      conflictsByTech.set(techId, result.conflictingTickets);
    }
  }
  
  if (conflictsByTech.size > 0) {
    const conflictDetails: string[] = [];
    
    conflictsByTech.forEach((conflicts, techId) => {
      const techName = ticket.technicians?.find(t => t.id === techId)?.name || 
                       (ticket.technician_id === techId ? ticket.technician_name : null) || 
                       `Technicien ${techId}`;
      const firstConflict = conflicts[0];
      conflictDetails.push(`${techName} a déjà "${firstConflict.title}" à ${firstConflict.hour}h${String(firstConflict.minutes || 0).padStart(2, '0')}`);
    });
    
    const message = conflictDetails.length === 1 
      ? `Conflit d'horaire : ${conflictDetails[0]}`
      : `Conflits d'horaire :\n${conflictDetails.join('\n')}`;
      
    return { hasConflict: true, conflictsByTechnician: conflictsByTech, message };
  }
  
  return { hasConflict: false, conflictsByTechnician: conflictsByTech };
}

/**
 * Formate l'affichage d'une durée en minutes
 */
export function formatDuration(minutes: number): string {
  if (!minutes) return '30 min'
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) {
    return `${mins} min`
  } else if (mins === 0) {
    return hours === 1 ? '1 heure' : `${hours} heures`
  } else {
    return hours === 1 ? `1h ${mins}min` : `${hours}h ${mins}min`
  }
}

/**
 * Génère les options de durée pour le sélecteur
 */
export function getDurationOptions(): Array<{ value: number; label: string }> {
  const options = []
  
  // De 15 minutes à 2 heures par tranches de 15 minutes
  for (let minutes = 15; minutes <= 120; minutes += 15) {
    options.push({
      value: minutes,
      label: formatDuration(minutes)
    })
  }
  
  // Ajouter des options plus longues
  options.push(
    { value: 150, label: '2h 30min' },
    { value: 180, label: '3 heures' },
    { value: 240, label: '4 heures' },
    { value: 300, label: '5 heures' },
    { value: 360, label: '6 heures' },
    { value: 420, label: '7 heures' },
    { value: 480, label: '8 heures' }
  )
  
  return options
}