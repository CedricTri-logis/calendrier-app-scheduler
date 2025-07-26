import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

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
  created_at: string
  updated_at: string
}

export function useTickets() {
  const [tickets, setTickets] = useState<TicketWithTechnician[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger tous les tickets avec les infos technicien
  const fetchTickets = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tickets_with_technician')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setTickets(data || [])
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
      const { error } = await supabase
        .from('tickets')
        .update({ date: null, hour: -1 })
        .eq('id', id)

      if (error) throw error

      // Mettre à jour l'état local
      setTickets(prev => 
        prev.map(ticket => 
          ticket.id === id ? { ...ticket, date: null, hour: -1 } : ticket
        )
      )

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

  return {
    tickets,
    loading,
    error,
    createTicket,
    updateTicketPosition,
    removeTicketFromCalendar,
    deleteTicket,
    refetch: fetchTickets
  }
}