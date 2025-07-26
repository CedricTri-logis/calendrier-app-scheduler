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
    try {
      // Préparer les données à mettre à jour
      const updateData: any = { date, hour }
      
      // Si un technicien est fourni, l'inclure dans la mise à jour
      if (technicianId !== undefined) {
        updateData.technician_id = technicianId
      }
      
      const { error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      // Recharger pour avoir les infos mises à jour du technicien
      await fetchTickets()

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du ticket')
      return false
    }
  }

  // Retirer un ticket du calendrier (le remettre dans la liste non planifiée)
  const removeTicketFromCalendar = async (id: number) => {
    try {
      // 1. Retirer le ticket du calendrier
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ 
          date: null, 
          hour: -1,
          technician_id: null // Désassigner le technicien principal
        })
        .eq('id', id)

      if (updateError) throw updateError

      // 2. Supprimer toutes les assignations multi-techniciens
      const { error: deleteError } = await supabase
        .from('ticket_technicians')
        .delete()
        .eq('ticket_id', id)

      if (deleteError) {
        console.warn('Erreur lors de la suppression des assignations:', deleteError)
      }

      // 3. Recharger les tickets pour avoir l'état à jour
      await fetchTickets()

      return true
    } catch (err) {
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
          fetchTickets() // Recharger les tickets
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Ajouter un technicien à un ticket
  const addTechnicianToTicket = async (ticketId: number, technicianId: number, isPrimary: boolean = false) => {
    try {
      const { data, error: addError } = await supabase
        .rpc('add_technician_to_ticket', {
          p_ticket_id: ticketId,
          p_technician_id: technicianId,
          p_is_primary: isPrimary
        })

      if (addError) throw addError

      // Recharger les tickets pour avoir les mises à jour
      await fetchTickets()
      
      return { success: true, error: null }
    } catch (err) {
      console.error('Erreur lors de l\'ajout du technicien:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erreur lors de l\'ajout'
      }
    }
  }

  // Retirer un technicien d'un ticket
  const removeTechnicianFromTicket = async (ticketId: number, technicianId: number) => {
    try {
      const { data, error: removeError } = await supabase
        .rpc('remove_technician_from_ticket', {
          p_ticket_id: ticketId,
          p_technician_id: technicianId
        })

      if (removeError) throw removeError

      // Recharger les tickets pour avoir les mises à jour
      await fetchTickets()
      
      return { success: true, error: null }
    } catch (err) {
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