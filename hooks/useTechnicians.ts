import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface Technician {
  id: number
  name: string
  email?: string | null
  phone?: string | null
  color: string
  active: boolean
  created_at: string
  updated_at: string
}

export function useTechnicians() {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger tous les techniciens
  const fetchTechnicians = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('technicians')
        .select('*')
        .order('name')

      if (fetchError) throw fetchError

      setTechnicians(data || [])
    } catch (err) {
      console.error('Erreur lors du chargement des techniciens:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  // Créer un nouveau technicien
  const createTechnician = async (
    name: string,
    color: string,
    email?: string,
    phone?: string
  ) => {
    try {
      const { data, error: createError } = await supabase
        .from('technicians')
        .insert([{
          name,
          color,
          email: email || null,
          phone: phone || null
        }])
        .select()
        .single()

      if (createError) throw createError

      // Mettre à jour la liste locale
      setTechnicians(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      
      return { data, error: null }
    } catch (err) {
      console.error('Erreur lors de la création du technicien:', err)
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Erreur lors de la création'
      }
    }
  }

  // Mettre à jour un technicien
  const updateTechnician = async (
    id: number,
    updates: Partial<Omit<Technician, 'id' | 'created_at' | 'updated_at'>>
  ) => {
    try {
      const { data, error: updateError } = await supabase
        .from('technicians')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      // Mettre à jour la liste locale
      setTechnicians(prev => 
        prev.map(tech => tech.id === id ? data : tech)
          .sort((a, b) => a.name.localeCompare(b.name))
      )
      
      return { data, error: null }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du technicien:', err)
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Erreur lors de la mise à jour'
      }
    }
  }

  // Activer/Désactiver un technicien
  const toggleTechnicianStatus = async (id: number, active: boolean) => {
    return updateTechnician(id, { active })
  }

  // Supprimer un technicien (soft delete - désactive seulement)
  const deleteTechnician = async (id: number) => {
    // On préfère désactiver plutôt que supprimer pour garder l'historique
    return toggleTechnicianStatus(id, false)
  }

  // Obtenir les techniciens disponibles à une date/heure donnée
  const getAvailableTechnicians = async (date: string, hour?: number) => {
    try {
      const time = hour !== undefined && hour !== -1 
        ? `${hour.toString().padStart(2, '0')}:00:00`
        : null

      const { data, error: rpcError } = await supabase
        .rpc('get_available_technicians', {
          p_date: date,
          p_time: time
        })

      if (rpcError) throw rpcError

      return { data: data || [], error: null }
    } catch (err) {
      console.error('Erreur lors de la récupération des techniciens disponibles:', err)
      return { 
        data: [], 
        error: err instanceof Error ? err.message : 'Erreur inconnue'
      }
    }
  }

  // Charger les techniciens au montage du composant
  useEffect(() => {
    fetchTechnicians()

    // S'abonner aux changements en temps réel
    const subscription = supabase
      .channel('technicians_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'technicians' 
        },
        (payload) => {
          console.log('Changement détecté dans les techniciens:', payload)
          
          if (payload.eventType === 'INSERT' && payload.new) {
            setTechnicians(prev => 
              [...prev, payload.new as Technician]
                .sort((a, b) => a.name.localeCompare(b.name))
            )
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setTechnicians(prev => 
              prev.map(tech => 
                tech.id === (payload.new as Technician).id 
                  ? payload.new as Technician 
                  : tech
              ).sort((a, b) => a.name.localeCompare(b.name))
            )
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setTechnicians(prev => 
              prev.filter(tech => tech.id !== (payload.old as Technician).id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    technicians,
    loading,
    error,
    createTechnician,
    updateTechnician,
    toggleTechnicianStatus,
    deleteTechnician,
    getAvailableTechnicians,
    refreshTechnicians: fetchTechnicians
  }
}