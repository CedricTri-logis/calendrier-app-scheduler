import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export type ScheduleType = 'available' | 'unavailable' | 'vacation' | 'sick_leave' | 'break'

export interface Schedule {
  id: number
  technician_id: number
  date: string
  start_time: string
  end_time: string
  type: ScheduleType
  notes?: string | null
  created_at: string
  updated_at: string
  // Propriétés jointes optionnelles
  technician?: {
    id: number
    name: string
    color: string
  }
}

export interface CreateScheduleInput {
  technician_id: number
  date: string
  start_time: string
  end_time: string
  type: ScheduleType
  notes?: string
}

export interface ScheduleFilters {
  technician_id?: number
  start_date?: string
  end_date?: string
  type?: ScheduleType
}

export function useSchedules(filters?: ScheduleFilters) {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les horaires avec filtres optionnels
  const fetchSchedules = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('schedules')
        .select(`
          *,
          technician:technicians!technician_id (
            id,
            name,
            color
          )
        `)

      // Appliquer les filtres
      if (filters?.technician_id) {
        query = query.eq('technician_id', filters.technician_id)
      }
      if (filters?.start_date) {
        query = query.gte('date', filters.start_date)
      }
      if (filters?.end_date) {
        query = query.lte('date', filters.end_date)
      }
      if (filters?.type) {
        query = query.eq('type', filters.type)
      }

      // Trier par date et heure
      query = query.order('date').order('start_time')

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setSchedules(data || [])
    } catch (err) {
      console.error('Erreur lors du chargement des horaires:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  // Créer un nouvel horaire
  const createSchedule = async (input: CreateScheduleInput) => {
    try {
      const { data, error: createError } = await supabase
        .from('schedules')
        .insert([input])
        .select(`
          *,
          technician:technicians!technician_id (
            id,
            name,
            color
          )
        `)
        .single()

      if (createError) throw createError

      // Mettre à jour la liste locale
      setSchedules(prev => [...prev, data].sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date)
        if (dateCompare !== 0) return dateCompare
        return a.start_time.localeCompare(b.start_time)
      }))
      
      return { data, error: null }
    } catch (err) {
      console.error('Erreur lors de la création de l\'horaire:', err)
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Erreur lors de la création'
      }
    }
  }

  // Créer plusieurs horaires en une fois (utile pour les horaires récurrents)
  const createMultipleSchedules = async (schedules: CreateScheduleInput[]) => {
    try {
      const { data, error: createError } = await supabase
        .from('schedules')
        .insert(schedules)
        .select(`
          *,
          technician:technicians!technician_id (
            id,
            name,
            color
          )
        `)

      if (createError) throw createError

      // Mettre à jour la liste locale
      setSchedules(prev => [...prev, ...(data || [])].sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date)
        if (dateCompare !== 0) return dateCompare
        return a.start_time.localeCompare(b.start_time)
      }))
      
      return { data, error: null }
    } catch (err) {
      console.error('Erreur lors de la création des horaires:', err)
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Erreur lors de la création'
      }
    }
  }

  // Mettre à jour un horaire
  const updateSchedule = async (
    id: number,
    updates: Partial<Omit<Schedule, 'id' | 'created_at' | 'updated_at' | 'technician'>>
  ) => {
    try {
      const { data, error: updateError } = await supabase
        .from('schedules')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          technician:technicians!technician_id (
            id,
            name,
            color
          )
        `)
        .single()

      if (updateError) throw updateError

      // Mettre à jour la liste locale
      setSchedules(prev => 
        prev.map(schedule => schedule.id === id ? data : schedule)
          .sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date)
            if (dateCompare !== 0) return dateCompare
            return a.start_time.localeCompare(b.start_time)
          })
      )
      
      return { data, error: null }
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'horaire:', err)
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Erreur lors de la mise à jour'
      }
    }
  }

  // Supprimer un horaire
  const deleteSchedule = async (id: number) => {
    try {
      const { error: deleteError } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Mettre à jour la liste locale
      setSchedules(prev => prev.filter(schedule => schedule.id !== id))
      
      return { error: null }
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'horaire:', err)
      return { 
        error: err instanceof Error ? err.message : 'Erreur lors de la suppression'
      }
    }
  }

  // Supprimer plusieurs horaires
  const deleteMultipleSchedules = async (ids: number[]) => {
    try {
      const { error: deleteError } = await supabase
        .from('schedules')
        .delete()
        .in('id', ids)

      if (deleteError) throw deleteError

      // Mettre à jour la liste locale
      setSchedules(prev => prev.filter(schedule => !ids.includes(schedule.id)))
      
      return { error: null }
    } catch (err) {
      console.error('Erreur lors de la suppression des horaires:', err)
      return { 
        error: err instanceof Error ? err.message : 'Erreur lors de la suppression'
      }
    }
  }

  // Créer des horaires récurrents
  const createRecurringSchedules = async (
    baseSchedule: Omit<CreateScheduleInput, 'date'>,
    startDate: string,
    endDate: string,
    daysOfWeek: number[] // 0 = dimanche, 1 = lundi, etc.
  ) => {
    const schedules: CreateScheduleInput[] = []
    const start = new Date(startDate)
    const end = new Date(endDate)

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay()
      if (daysOfWeek.includes(dayOfWeek)) {
        schedules.push({
          ...baseSchedule,
          date: date.toISOString().split('T')[0]
        })
      }
    }

    return createMultipleSchedules(schedules)
  }

  // Obtenir la charge de travail d'un technicien
  const getTechnicianWorkload = async (
    technicianId: number,
    startDate: string,
    endDate: string
  ) => {
    try {
      const { data, error: rpcError } = await supabase
        .rpc('get_technician_workload', {
          p_technician_id: technicianId,
          p_start_date: startDate,
          p_end_date: endDate
        })

      if (rpcError) throw rpcError

      return { data: data || [], error: null }
    } catch (err) {
      console.error('Erreur lors du calcul de la charge de travail:', err)
      return { 
        data: [], 
        error: err instanceof Error ? err.message : 'Erreur inconnue'
      }
    }
  }

  // Charger les horaires au montage et quand les filtres changent
  useEffect(() => {
    fetchSchedules()

    // S'abonner aux changements en temps réel
    const subscription = supabase
      .channel('schedules_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'schedules' 
        },
        (payload) => {
          console.log('Changement détecté dans les horaires:', payload)
          // Recharger les données pour avoir les relations
          fetchSchedules()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [filters?.technician_id, filters?.start_date, filters?.end_date, filters?.type])

  return {
    schedules,
    loading,
    error,
    createSchedule,
    createMultipleSchedules,
    createRecurringSchedules,
    updateSchedule,
    deleteSchedule,
    deleteMultipleSchedules,
    getTechnicianWorkload,
    refreshSchedules: fetchSchedules
  }
}