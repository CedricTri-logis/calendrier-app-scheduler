import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
import { useTickets } from '../hooks/useTickets'
import { useTechnicians } from '../hooks/useTechnicians'
import { useSchedules } from '../hooks/useSchedules'
import { Ticket } from '../utils/ticketHelpers'
import { Technician } from '../hooks/useTechnicians'
import { Schedule } from '../hooks/useSchedules'

// Types pour l'état du calendrier
interface CalendarState {
  // Données
  tickets: Ticket[]
  technicians: Technician[]
  schedules: Schedule[]
  
  // État UI
  currentDate: Date
  viewMode: 'month' | 'week' | 'day' | 'multiTech'
  selectedTechnicianId: number | null
  
  // État du formulaire
  newTicketTitle: string
  newTicketColor: string
  newTicketTechnicianId: number | null
  
  // État des modals/popups
  technicianAddPopup: {
    ticketId: number
    position: { x: number; y: number }
    currentTechnicianIds: number[]
  } | null
  selectedTicketForDetails: number | null
  
  // État du drag & drop
  isDraggingOver: boolean
  
  // État de chargement et erreurs
  loading: boolean
  error: string | null
}

// Actions disponibles
type CalendarAction =
  | { type: 'SET_TICKETS'; payload: Ticket[] }
  | { type: 'SET_TECHNICIANS'; payload: Technician[] }
  | { type: 'SET_SCHEDULES'; payload: Schedule[] }
  | { type: 'SET_CURRENT_DATE'; payload: Date }
  | { type: 'SET_VIEW_MODE'; payload: CalendarState['viewMode'] }
  | { type: 'SET_SELECTED_TECHNICIAN'; payload: number | null }
  | { type: 'SET_NEW_TICKET_TITLE'; payload: string }
  | { type: 'SET_NEW_TICKET_COLOR'; payload: string }
  | { type: 'SET_NEW_TICKET_TECHNICIAN'; payload: number | null }
  | { type: 'SET_TECHNICIAN_ADD_POPUP'; payload: CalendarState['technicianAddPopup'] }
  | { type: 'SET_SELECTED_TICKET_DETAILS'; payload: number | null }
  | { type: 'SET_DRAGGING_OVER'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_NEW_TICKET_FORM' }
  | { type: 'GO_TO_PREVIOUS_PERIOD' }
  | { type: 'GO_TO_NEXT_PERIOD' }
  | { type: 'GO_TO_TODAY' }

// État initial
const initialState: CalendarState = {
  tickets: [],
  technicians: [],
  schedules: [],
  currentDate: new Date(),
  viewMode: 'month',
  selectedTechnicianId: null,
  newTicketTitle: '',
  newTicketColor: '#fff3cd',
  newTicketTechnicianId: null,
  technicianAddPopup: null,
  selectedTicketForDetails: null,
  isDraggingOver: false,
  loading: true,
  error: null
}

// Reducer
function calendarReducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case 'SET_TICKETS':
      return { ...state, tickets: action.payload }
    
    case 'SET_TECHNICIANS':
      return { ...state, technicians: action.payload }
    
    case 'SET_SCHEDULES':
      return { ...state, schedules: action.payload }
    
    case 'SET_CURRENT_DATE':
      return { ...state, currentDate: action.payload }
    
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload }
    
    case 'SET_SELECTED_TECHNICIAN':
      return { ...state, selectedTechnicianId: action.payload }
    
    case 'SET_NEW_TICKET_TITLE':
      return { ...state, newTicketTitle: action.payload }
    
    case 'SET_NEW_TICKET_COLOR':
      return { ...state, newTicketColor: action.payload }
    
    case 'SET_NEW_TICKET_TECHNICIAN':
      return { ...state, newTicketTechnicianId: action.payload }
    
    case 'SET_TECHNICIAN_ADD_POPUP':
      return { ...state, technicianAddPopup: action.payload }
    
    case 'SET_SELECTED_TICKET_DETAILS':
      return { ...state, selectedTicketForDetails: action.payload }
    
    case 'SET_DRAGGING_OVER':
      return { ...state, isDraggingOver: action.payload }
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    
    case 'RESET_NEW_TICKET_FORM':
      return {
        ...state,
        newTicketTitle: '',
        newTicketColor: '#fff3cd',
        newTicketTechnicianId: null
      }
    
    case 'GO_TO_PREVIOUS_PERIOD':
      const prevDate = new Date(state.currentDate)
      if (state.viewMode === 'month') {
        prevDate.setMonth(prevDate.getMonth() - 1)
      } else if (state.viewMode === 'week') {
        prevDate.setDate(prevDate.getDate() - 7)
      } else {
        prevDate.setDate(prevDate.getDate() - 1)
      }
      return { ...state, currentDate: prevDate }
    
    case 'GO_TO_NEXT_PERIOD':
      const nextDate = new Date(state.currentDate)
      if (state.viewMode === 'month') {
        nextDate.setMonth(nextDate.getMonth() + 1)
      } else if (state.viewMode === 'week') {
        nextDate.setDate(nextDate.getDate() + 7)
      } else {
        nextDate.setDate(nextDate.getDate() + 1)
      }
      return { ...state, currentDate: nextDate }
    
    case 'GO_TO_TODAY':
      return { ...state, currentDate: new Date() }
    
    default:
      return state
  }
}

// Context
interface CalendarContextValue {
  state: CalendarState
  dispatch: React.Dispatch<CalendarAction>
  actions: {
    createTicket: (title: string, color: string, technicianId?: number) => Promise<any>
    updateTicketPosition: (id: number, date: string | null, hour: number, technicianId?: number, minutes?: number) => Promise<boolean>
    removeTicketFromCalendar: (id: number) => Promise<boolean>
    deleteTicket: (id: number) => Promise<boolean>
    addTechnicianToTicket: (ticketId: number, technicianId: number, isPrimary?: boolean) => Promise<{ success: boolean; error: string | null }>
    removeTechnicianFromTicket: (ticketId: number, technicianId: number) => Promise<{ success: boolean; error: string | null }>
  }
}

const CalendarContext = createContext<CalendarContextValue | null>(null)

// Provider component
export function CalendarProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(calendarReducer, initialState)
  
  // Hooks Supabase
  const {
    tickets,
    loading: loadingTickets,
    error: ticketsError,
    createTicket,
    updateTicketPosition,
    removeTicketFromCalendar,
    deleteTicket,
    addTechnicianToTicket,
    removeTechnicianFromTicket
  } = useTickets()
  
  const { technicians, loading: loadingTechnicians } = useTechnicians()
  const { schedules, loading: loadingSchedules } = useSchedules()
  
  // Synchroniser les données avec l'état local
  useEffect(() => {
    dispatch({ type: 'SET_TICKETS', payload: tickets })
  }, [tickets])
  
  useEffect(() => {
    dispatch({ type: 'SET_TECHNICIANS', payload: technicians })
    // Stocker les techniciens dans window pour y accéder depuis useTickets
    if (technicians && technicians.length > 0) {
      (window as any).__technicians = technicians
    }
  }, [technicians])
  
  useEffect(() => {
    dispatch({ type: 'SET_SCHEDULES', payload: schedules })
  }, [schedules])
  
  // Gérer l'état de chargement
  useEffect(() => {
    const isLoading = loadingTickets || loadingTechnicians || loadingSchedules
    dispatch({ type: 'SET_LOADING', payload: isLoading })
  }, [loadingTickets, loadingTechnicians, loadingSchedules])
  
  // Gérer les erreurs
  useEffect(() => {
    dispatch({ type: 'SET_ERROR', payload: ticketsError })
  }, [ticketsError])
  
  const value: CalendarContextValue = {
    state,
    dispatch,
    actions: {
      createTicket,
      updateTicketPosition,
      removeTicketFromCalendar,
      deleteTicket,
      addTechnicianToTicket,
      removeTechnicianFromTicket
    }
  }
  
  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  )
}

// Hook personnalisé pour utiliser le contexte
export function useCalendar() {
  const context = useContext(CalendarContext)
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider')
  }
  return context
}

// Hooks utilitaires pour des accès simplifiés
export function useCalendarState() {
  const { state } = useCalendar()
  return state
}

export function useCalendarActions() {
  const { actions, dispatch } = useCalendar()
  return { ...actions, dispatch }
}