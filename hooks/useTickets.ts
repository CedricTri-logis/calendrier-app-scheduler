import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { normalizeTicket, type Ticket } from '../utils/ticketHelpers'

// Interface étendue pour les tickets avec infos technicien
export interface TicketWithTechnician {
  id: number
  title: string
  color: string
  date: string | null
  hour: number | null
  technician_id: number | null
  technician_name?: string | null
  technician_color?: string | null
  technician_active?: boolean | null
  technicians?: Array<{
    id: number
    name: string
    color: string
    active: boolean
    is_primary: boolean
  }>
  primary_technician_name?: string | null
  primary_technician_color?: string | null
  created_at: string
  updated_at: string
}

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger tous les tickets avec les infos technicien
  const fetchTickets = async () => {
    try {
      setLoading(true)
      
      // Récupérer les tickets avec leur technicien principal
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select(`
          *,
          technician:technicians!technician_id(
            id,
            name,
            color,
            active
          )
        `)
        .order('created_at', { ascending: false })

      if (ticketsError) throw ticketsError

      // Récupérer toutes les assignations multi-techniciens
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('ticket_technicians')
        .select(`
          ticket_id,
          is_primary,
          technician:technicians(
            id,
            name,
            color,
            active
          )
        `)

      if (assignmentsError) {
        console.warn('Impossible de charger les assignations multi-techniciens:', assignmentsError)
      }

      // Grouper les assignations par ticket
      const assignmentsByTicket = (assignmentsData || []).reduce((acc, assignment) => {
        if (!acc[assignment.ticket_id]) {
          acc[assignment.ticket_id] = []
        }
        if (assignment.technician) {
          acc[assignment.ticket_id].push({
            ...assignment.technician,
            is_primary: assignment.is_primary
          })
        }
        return acc
      }, {} as Record<number, any[]>)

      // Transformer et normaliser les données
      const transformedData = (ticketsData || []).map(ticket => {
        // Fusionner les données avec les assignations multi-techniciens
        const ticketWithMultiTech = {
          ...ticket,
          technicians: assignmentsByTicket[ticket.id] || []
        }
        
        // Normaliser le ticket pour garantir la cohérence
        return normalizeTicket(ticketWithMultiTech)
      })

      setTickets(transformedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des tickets')
    } finally {
      setLoading(false)
    }
  }

  // Créer un nouveau ticket
  const createTicket = async (title: string, color: string, technicianId?: number) => {
    try {
      // Si pas de technicien spécifié, utiliser "Non assigné"
      let technician_id = technicianId
      if (!technician_id) {
        const { data: nonAssigneTech } = await supabase
          .from('technicians')
          .select('id')
          .eq('name', 'Non assigné')
          .single()
        
        technician_id = nonAssigneTech?.id || null
      }

      const { data, error } = await supabase
        .from('tickets')
        .insert([{ title, color, technician_id }])
        .select()
        .single()

      if (error) throw error

      // Recharger pour avoir les infos du technicien
      await fetchTickets()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du ticket')
      return null
    }
  }

  // Mettre à jour la position d'un ticket (et optionnellement le technicien)
  const updateTicketPosition = async (id: number, date: string | null, hour: number = -1, technicianId?: number) => {
    // Sauvegarder l'état précédent pour le rollback en cas d'erreur
    const previousTickets = [...tickets]
    
    try {
      // 1. Mise à jour optimiste locale immédiate
      setTickets(prevTickets => 
        prevTickets.map(ticket => {
          if (ticket.id === id) {
            // Mettre à jour le ticket localement
            const updatedTicket = { ...ticket, date, hour }
            
            // Si un technicien est fourni, mettre à jour aussi les infos technicien
            if (technicianId !== undefined) {
              updatedTicket.technician_id = technicianId
              
              // Trouver les infos du nouveau technicien
              const newTechnician = (window as any).__technicians?.find((t: any) => t.id === technicianId)
              if (newTechnician) {
                updatedTicket.technician_name = newTechnician.name
                updatedTicket.technician_color = newTechnician.color
              }
            }
            
            return updatedTicket
          }
          return ticket
        })
      )
      
      // 2. Préparer les données pour Supabase
      const updateData: any = { date, hour }
      if (technicianId !== undefined) {
        updateData.technician_id = technicianId
      }
      
      // 3. Envoyer la mise à jour à Supabase en arrière-plan
      const { error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      // Note: Pas de fetchTickets() ici - on garde l'état local optimiste
      // Le listener temps réel gérera la synchronisation si nécessaire

      return true
    } catch (err) {
      // En cas d'erreur, restaurer l'état précédent
      setTickets(previousTickets)
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du ticket')
      return false
    }
  }

  // Retirer un ticket du calendrier (le remettre dans la liste non planifiée)
  const removeTicketFromCalendar = async (id: number) => {
    // Sauvegarder l'état précédent pour le rollback en cas d'erreur
    const previousTickets = [...tickets]
    
    try {
      // 1. Mise à jour optimiste locale immédiate
      setTickets(prevTickets => 
        prevTickets.map(ticket => {
          if (ticket.id === id) {
            return {
              ...ticket,
              date: null,
              hour: null,
              technician_id: null,
              technician_name: null,
              technician_color: null,
              technicians: []
            }
          }
          return ticket
        })
      )
      
      // 2. Retirer le ticket du calendrier dans Supabase
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ 
          date: null, 
          hour: -1,
          technician_id: null
        })
        .eq('id', id)

      if (updateError) throw updateError

      // 3. Supprimer toutes les assignations multi-techniciens
      const { error: deleteError } = await supabase
        .from('ticket_technicians')
        .delete()
        .eq('ticket_id', id)

      if (deleteError) {
        console.warn('Erreur lors de la suppression des assignations:', deleteError)
      }

      // Note: Pas de fetchTickets() ici - on garde l'état local optimiste

      return true
    } catch (err) {
      // En cas d'erreur, restaurer l'état précédent
      setTickets(previousTickets)
      setError(err instanceof Error ? err.message : 'Erreur lors du retrait du ticket')
      return false
    }
  }

  // Supprimer un ticket
  const deleteTicket = async (id: number) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', id)

      if (error) throw error

      setTickets(prev => prev.filter(ticket => ticket.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression du ticket')
      return false
    }
  }

  // Charger les tickets au montage
  useEffect(() => {
    fetchTickets()

    // S'abonner aux changements en temps réel
    const subscription = supabase
      .channel('tickets-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tickets' }, 
        (payload) => {
          console.log('Changement détecté:', payload)
          
          // Optimisation: Ne recharger que si le changement vient d'un autre client
          // (éviter de recharger après nos propres mises à jour optimistes)
          if (payload.eventType === 'UPDATE') {
            // Mettre à jour uniquement le ticket modifié
            const updatedTicket = payload.new as any
            
            setTickets(prevTickets => 
              prevTickets.map(ticket => 
                ticket.id === updatedTicket.id 
                  ? { ...ticket, ...updatedTicket }
                  : ticket
              )
            )
          } else if (payload.eventType === 'INSERT') {
            // Pour les nouveaux tickets, on doit les charger avec les infos technicien
            fetchTickets()
          } else if (payload.eventType === 'DELETE') {
            // Supprimer le ticket de l'état local
            const deletedId = (payload.old as any).id
            setTickets(prevTickets => 
              prevTickets.filter(ticket => ticket.id !== deletedId)
            )
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Ajouter un technicien à un ticket
  const addTechnicianToTicket = async (ticketId: number, technicianId: number, isPrimary: boolean = false) => {
    // Sauvegarder l'état précédent pour le rollback en cas d'erreur
    const previousTickets = [...tickets]
    
    try {
      // Trouver le ticket actuel
      const currentTicket = tickets.find(t => t.id === ticketId)
      if (!currentTicket) throw new Error('Ticket non trouvé')
      
      // Vérifier si le technicien initial doit être ajouté à ticket_technicians
      let shouldAddInitialTech = false
      let initialTechId: number | null = null
      
      if (currentTicket.technician_id && (!currentTicket.technicians || currentTicket.technicians.length === 0)) {
        // Le ticket a un technician_id mais pas d'entrées dans technicians[]
        // Cela signifie que le technicien initial n'est pas dans ticket_technicians
        shouldAddInitialTech = true
        initialTechId = currentTicket.technician_id
      }
      
      // 1. Mise à jour optimiste locale immédiate
      const newTechnician = (window as any).__technicians?.find((t: any) => t.id === technicianId)
      if (newTechnician) {
        setTickets(prevTickets => 
          prevTickets.map(ticket => {
            if (ticket.id === ticketId) {
              const updatedTicket = { ...ticket }
              
              // Si nécessaire, ajouter d'abord le technicien initial
              if (shouldAddInitialTech && initialTechId) {
                const initialTech = (window as any).__technicians?.find((t: any) => t.id === initialTechId)
                if (initialTech) {
                  updatedTicket.technicians = [{
                    id: initialTech.id,
                    name: initialTech.name,
                    color: initialTech.color,
                    active: initialTech.active,
                    is_primary: true
                  }]
                }
              }
              
              // Ajouter le nouveau technicien au tableau
              const newTech = {
                id: newTechnician.id,
                name: newTechnician.name,
                color: newTechnician.color,
                active: newTechnician.active,
                is_primary: isPrimary
              }
              
              // Si c'est principal, retirer le statut principal des autres
              if (isPrimary && updatedTicket.technicians) {
                updatedTicket.technicians = updatedTicket.technicians.map(t => ({
                  ...t,
                  is_primary: false
                }))
                
                // Mettre à jour le technicien principal
                updatedTicket.technician_id = technicianId
                updatedTicket.technician_name = newTechnician.name
                updatedTicket.technician_color = newTechnician.color
              }
              
              // Ajouter au tableau des techniciens
              updatedTicket.technicians = [...(updatedTicket.technicians || []), newTech]
              
              return updatedTicket
            }
            return ticket
          })
        )
      }
      
      // 2. Si nécessaire, ajouter d'abord le technicien initial dans la BD
      if (shouldAddInitialTech && initialTechId) {
        await supabase.rpc('add_technician_to_ticket', {
          p_ticket_id: ticketId,
          p_technician_id: initialTechId,
          p_is_primary: true
        })
      }
      
      // 3. Ajouter le nouveau technicien
      const { data, error: addError } = await supabase
        .rpc('add_technician_to_ticket', {
          p_ticket_id: ticketId,
          p_technician_id: technicianId,
          p_is_primary: isPrimary
        })

      if (addError) throw addError

      // Note: Pas de fetchTickets() ici - on garde l'état local optimiste
      
      return { success: true, error: null }
    } catch (err) {
      // En cas d'erreur, restaurer l'état précédent
      setTickets(previousTickets)
      console.error('Erreur lors de l\'ajout du technicien:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erreur lors de l\'ajout'
      }
    }
  }

  // Retirer un technicien d'un ticket
  const removeTechnicianFromTicket = async (ticketId: number, technicianId: number) => {
    // Sauvegarder l'état précédent pour le rollback en cas d'erreur
    const previousTickets = [...tickets]
    
    try {
      // 1. Mise à jour optimiste locale immédiate
      setTickets(prevTickets => 
        prevTickets.map(ticket => {
          if (ticket.id === ticketId) {
            const updatedTicket = { ...ticket }
            
            // Retirer le technicien du tableau
            updatedTicket.technicians = (updatedTicket.technicians || []).filter(t => t.id !== technicianId)
            
            // Si c'était le technicien principal, réassigner
            if (updatedTicket.technician_id === technicianId) {
              if (updatedTicket.technicians.length > 0) {
                // Prendre le premier technicien restant ou celui marqué comme principal
                const newPrimary = updatedTicket.technicians.find(t => t.is_primary) || updatedTicket.technicians[0]
                updatedTicket.technician_id = newPrimary.id
                updatedTicket.technician_name = newPrimary.name
                updatedTicket.technician_color = newPrimary.color
                
                // S'assurer qu'il y a un principal
                if (!updatedTicket.technicians.some(t => t.is_primary)) {
                  updatedTicket.technicians[0].is_primary = true
                }
              } else {
                // Plus de technicien assigné
                updatedTicket.technician_id = null
                updatedTicket.technician_name = null
                updatedTicket.technician_color = null
              }
            }
            
            return updatedTicket
          }
          return ticket
        })
      )
      
      // 2. Appeler la fonction RPC en arrière-plan
      const { data, error: removeError } = await supabase
        .rpc('remove_technician_from_ticket', {
          p_ticket_id: ticketId,
          p_technician_id: technicianId
        })

      if (removeError) throw removeError

      // Note: Pas de fetchTickets() ici - on garde l'état local optimiste
      
      return { success: true, error: null }
    } catch (err) {
      // En cas d'erreur, restaurer l'état précédent
      setTickets(previousTickets)
      console.error('Erreur lors du retrait du technicien:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erreur lors du retrait'
      }
    }
  }

  // Vérifier la disponibilité de tous les techniciens d'un ticket
  const checkAllTechniciansAvailability = async (ticketId: number, date: string, hour: number = -1) => {
    try {
      const { data, error: checkError } = await supabase
        .rpc('check_all_technicians_availability', {
          p_ticket_id: ticketId,
          p_date: date,
          p_hour: hour
        })

      if (checkError) throw checkError

      return { data: data || [], error: null }
    } catch (err) {
      console.error('Erreur lors de la vérification de disponibilité:', err)
      return { 
        data: [], 
        error: err instanceof Error ? err.message : 'Erreur lors de la vérification'
      }
    }
  }

  return {
    tickets,
    loading,
    error,
    createTicket,
    updateTicketPosition,
    removeTicketFromCalendar,
    deleteTicket,
    addTechnicianToTicket,
    removeTechnicianFromTicket,
    checkAllTechniciansAvailability,
    refetch: fetchTickets
  }
}