import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Ticket } from '../lib/supabase'

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger tous les tickets
  const fetchTickets = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tickets')
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
  const createTicket = async (title: string, color: string, technician?: string) => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert([{ title, color, technician: technician || null }])
        .select()
        .single()

      if (error) throw error

      setTickets(prev => [data, ...prev])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du ticket')
      return null
    }
  }

  // Mettre à jour la position d'un ticket
  const updateTicketPosition = async (id: number, date: string | null, hour: number = -1) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ date, hour })
        .eq('id', id)

      if (error) throw error

      // Mettre à jour l'état local
      setTickets(prev => 
        prev.map(ticket => 
          ticket.id === id ? { ...ticket, date, hour } : ticket
        )
      )

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