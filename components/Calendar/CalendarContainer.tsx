import React, { useCallback } from 'react'
import styles from '../../styles/ModernHome.module.css'
import ModernCalendar from '../ModernCalendar'
import ModernWeekView from '../ModernWeekView'
import ModernDayView from '../ModernDayView'
import ModernMultiTechView from '../ModernMultiTechView'
import TechnicianQuickAdd from '../TechnicianQuickAdd'
import CalendarControls, { AvailabilityLegend } from '../Controls/CalendarControls'
import { useCalendarState, useCalendarActions } from '../../contexts/CalendarContext'
import { formatDateForDB } from '../../utils/dateHelpers'
import { getDateAvailabilityStatus, isHourAvailable } from '../../utils/scheduleHelpers'
import { filterTicketsByTechnician, checkTicketConflicts, checkMultiTechnicianConflicts } from '../../utils/ticketHelpers'
import { useToast } from '../../contexts/ToastContext'

interface CalendarContainerProps {
  onDragStart: (e: React.DragEvent, ticketId: number) => void
  onDragOver: (e: React.DragEvent) => void
}

export default function CalendarContainer({ onDragStart, onDragOver }: CalendarContainerProps) {
  const { showError, showWarning, showConflictError } = useToast()
  const state = useCalendarState()
  const { 
    updateTicketPosition, 
    addTechnicianToTicket, 
    removeTechnicianFromTicket,
    dispatch 
  } = useCalendarActions()
  
  const {
    tickets,
    technicians,
    schedules,
    currentDate,
    viewMode,
    selectedTechnicianId,
    technicianAddPopup
  } = state
  
  // Filtrer les tickets selon le technicien sélectionné
  const filteredTicketsForCalendar = filterTicketsByTechnician(tickets, selectedTechnicianId)
  
  // Organiser les tickets placés par date
  const ticketsByDate = filteredTicketsForCalendar.reduce((acc, ticket) => {
    if (ticket.date) {
      // Extraire seulement la partie date (YYYY-MM-DD) de l'ISO string
      const dateKey = ticket.date.split('T')[0]
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(ticket)
    }
    return acc
  }, {} as { [key: string]: typeof tickets })
  
  // Gérer le drop sur une date
  const handleDrop = useCallback(async (dayNumber: number, ticket: any, year?: number, month?: number) => {
    const dropDate = new Date(
      year ?? currentDate.getFullYear(),
      month ?? currentDate.getMonth(),
      dayNumber
    )
    
    const dateString = formatDateForDB(dropDate)
    const hour = ticket.hour ?? -1
    const minutes = ticket.minutes ?? 0
    
    // Déterminer le technicien à assigner
    const technicianIdToAssign = (viewMode !== 'multiTech' && selectedTechnicianId !== null) 
      ? selectedTechnicianId 
      : ticket.technician_id
    
    // Vérifier la disponibilité
    const availabilityStatus = getDateAvailabilityStatus(dateString, schedules, technicianIdToAssign)
    
    if (availabilityStatus === 'unavailable') {
      showWarning('Ce technicien n\'est pas disponible à cette date.')
      return
    }
    
    // Vérifier la disponibilité horaire si nécessaire
    if (hour !== -1 && technicianIdToAssign) {
      const isAvailable = isHourAvailable(hour, dateString, schedules, technicianIdToAssign)
      if (!isAvailable) {
        showWarning(`Ce technicien n'est pas disponible à ${hour}h00 le ${dropDate.toLocaleDateString('fr-FR')}.`)
        return
      }
    }
    
    // Avertir si disponibilité partielle
    if (availabilityStatus === 'partial' && technicianIdToAssign) {
      const technicianName = technicians.find(t => t.id === technicianIdToAssign)?.name || 'Ce technicien'
      if (!confirm(`${technicianName} a une disponibilité limitée à cette date. Voulez-vous continuer ?`)) {
        return
      }
    }
    
    // Vérifier les conflits d'horaire avec d'autres tickets
    if (hour !== -1) { // Ne vérifier que pour les tickets avec une heure spécifique
      const originalTicket = tickets.find(t => t.id === ticket.id)
      if (!originalTicket) return
      
      // Déterminer si c'est un ticket multi-techniciens
      const isMultiTech = originalTicket.technicians && originalTicket.technicians.length > 1
      
      let conflictResult
      if (isMultiTech) {
        conflictResult = checkMultiTechnicianConflicts(
          originalTicket,
          tickets,
          dateString,
          hour,
          minutes
        )
      } else {
        conflictResult = checkTicketConflicts(
          originalTicket,
          tickets,
          dateString,
          hour,
          minutes,
          technicianIdToAssign
        )
      }
      
      if (conflictResult.hasConflict) {
        showConflictError(conflictResult.message || 'Conflit d\'horaire détecté')
        return
      }
    }
    
    // Gérer le cas multi-technicien
    if (viewMode === 'multiTech') {
      const originalTicket = tickets.find(t => t.id === ticket.id)
      const hasMultipleTechnicians = originalTicket && originalTicket.technicians && originalTicket.technicians.length > 1
      
      if (hasMultipleTechnicians) {
        await updateTicketPosition(ticket.id, dateString, hour, undefined, minutes)
      } else {
        await updateTicketPosition(ticket.id, dateString, hour, technicianIdToAssign, minutes)
      }
    } else if (ticket.technician_id !== technicianIdToAssign) {
      await updateTicketPosition(ticket.id, dateString, hour, technicianIdToAssign, minutes)
    } else {
      await updateTicketPosition(ticket.id, dateString, hour, undefined, minutes)
    }
  }, [currentDate, viewMode, selectedTechnicianId, schedules, technicians, tickets, updateTicketPosition])
  
  // Gérer le clic sur un jour (pour passer en vue multi-tech)
  const handleDayClick = useCallback((date: Date) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: 'multiTech' })
    dispatch({ type: 'SET_CURRENT_DATE', payload: date })
  }, [dispatch])
  
  // Gérer l'ajout de technicien
  const handleAddTechnician = useCallback((ticketId: number) => {
    const ticket = tickets.find(t => t.id === ticketId)
    if (!ticket) return
    
    const currentTechnicianIds = ticket.technicians?.map(t => t.id) || []
    if (ticket.technician_id && !currentTechnicianIds.includes(ticket.technician_id)) {
      currentTechnicianIds.push(ticket.technician_id)
    }
    
    const position = { x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 200 }
    
    dispatch({
      type: 'SET_TECHNICIAN_ADD_POPUP',
      payload: {
        ticketId,
        position,
        currentTechnicianIds
      }
    })
  }, [tickets, dispatch])
  
  // Gérer le retrait de technicien
  const handleRemoveTechnician = useCallback(async (ticketId: number, technicianId: number) => {
    const result = await removeTechnicianFromTicket(ticketId, technicianId)
    if (!result.success) {
      showError(`Erreur lors du retrait du technicien: ${result.error}`)
    }
  }, [removeTechnicianFromTicket])
  
  // Gérer le clic sur un ticket
  const handleTicketClick = useCallback((ticketId: number) => {
    dispatch({ type: 'SET_SELECTED_TICKET_DETAILS', payload: ticketId })
  }, [dispatch])
  
  // Gérer la sélection de technicien dans le popup
  const handleSelectTechnician = useCallback(async (technicianId: number) => {
    if (!technicianAddPopup) return
    
    const ticket = tickets.find(t => t.id === technicianAddPopup.ticketId)
    if (!ticket || !ticket.date) {
      showError('Erreur: Ticket introuvable ou non planifié')
      dispatch({ type: 'SET_TECHNICIAN_ADD_POPUP', payload: null })
      return
    }
    
    // Vérifier la disponibilité
    const availabilityStatus = getDateAvailabilityStatus(ticket.date, schedules, technicianId)
    
    if (availabilityStatus === 'unavailable') {
      showWarning('Ce technicien n\'est pas disponible à cette date.')
      return
    }
    
    // Vérifier la disponibilité horaire
    if (ticket.hour !== null && ticket.hour !== undefined && ticket.hour !== -1) {
      const isAvailable = isHourAvailable(ticket.hour, ticket.date, schedules, technicianId)
      if (!isAvailable) {
        showWarning(`Ce technicien n'est pas disponible à ${ticket.hour}h00 le ${new Date(ticket.date).toLocaleDateString('fr-FR')}.`)
        return
      }
    }
    
    // Avertir si disponibilité partielle
    if (availabilityStatus === 'partial') {
      const technicianName = technicians.find(t => t.id === technicianId)?.name || 'Ce technicien'
      if (!confirm(`${technicianName} a une disponibilité limitée à cette date. Voulez-vous continuer ?`)) {
        return
      }
    }
    
    // Vérifier les conflits d'horaire avant d'ajouter le technicien
    if (ticket.hour !== null && ticket.hour !== undefined && ticket.hour !== -1) {
      const conflictResult = checkTicketConflicts(
        ticket,
        tickets,
        ticket.date,
        ticket.hour,
        ticket.minutes || 0,
        technicianId
      )
      
      if (conflictResult.hasConflict) {
        showConflictError(conflictResult.message || 'Ce technicien a déjà un ticket sur ce créneau horaire')
        return
      }
    }
    
    const result = await addTechnicianToTicket(technicianAddPopup.ticketId, technicianId, false)
    if (!result.success) {
      showError(`Erreur lors de l'ajout du technicien: ${result.error}`)
    }
    
    dispatch({ type: 'SET_TECHNICIAN_ADD_POPUP', payload: null })
  }, [technicianAddPopup, tickets, schedules, technicians, addTechnicianToTicket, dispatch])
  
  // Props communes pour toutes les vues
  const commonViewProps = {
    droppedTickets: ticketsByDate,
    onDrop: handleDrop,
    onDragOver,
    onDragStart,
    currentDate,
    schedules,
    onAddTechnician: handleAddTechnician,
    onRemoveTechnician: handleRemoveTechnician,
    onTicketClick: handleTicketClick
  }
  
  return (
    <div className={styles.calendarArea}>
      <CalendarControls />
      <AvailabilityLegend />
      
      <div className={styles.calendarContent}>
        {viewMode === 'month' && (
          <ModernCalendar 
            {...commonViewProps}
            onPreviousMonth={() => dispatch({ type: 'GO_TO_PREVIOUS_PERIOD' })}
            onNextMonth={() => dispatch({ type: 'GO_TO_NEXT_PERIOD' })}
            onToday={() => dispatch({ type: 'GO_TO_TODAY' })}
            selectedTechnicianId={selectedTechnicianId}
            onDayClick={handleDayClick}
          />
        )}
        
        {viewMode === 'week' && (
          <ModernWeekView 
            {...commonViewProps}
            onPreviousWeek={() => dispatch({ type: 'GO_TO_PREVIOUS_PERIOD' })}
            onNextWeek={() => dispatch({ type: 'GO_TO_NEXT_PERIOD' })}
            onToday={() => dispatch({ type: 'GO_TO_TODAY' })}
            selectedTechnicianId={selectedTechnicianId}
          />
        )}
        
        {viewMode === 'day' && (
          <ModernDayView 
            {...commonViewProps}
            onPreviousDay={() => dispatch({ type: 'GO_TO_PREVIOUS_PERIOD' })}
            onNextDay={() => dispatch({ type: 'GO_TO_NEXT_PERIOD' })}
            onToday={() => dispatch({ type: 'GO_TO_TODAY' })}
            selectedTechnicianId={selectedTechnicianId}
          />
        )}
        
        {viewMode === 'multiTech' && (
          <ModernMultiTechView 
            {...commonViewProps}
            onPreviousDay={() => dispatch({ type: 'GO_TO_PREVIOUS_PERIOD' })}
            onNextDay={() => dispatch({ type: 'GO_TO_NEXT_PERIOD' })}
            onToday={() => dispatch({ type: 'GO_TO_TODAY' })}
            technicians={technicians}
          />
        )}
      </div>
      
      {/* Popup d'ajout de technicien */}
      {technicianAddPopup && (
        <TechnicianQuickAdd
          ticketId={technicianAddPopup.ticketId}
          ticketDate={tickets.find(t => t.id === technicianAddPopup.ticketId)?.date}
          ticketHour={tickets.find(t => t.id === technicianAddPopup.ticketId)?.hour}
          currentTechnicianIds={technicianAddPopup.currentTechnicianIds}
          position={technicianAddPopup.position}
          onSelect={handleSelectTechnician}
          onClose={() => dispatch({ type: 'SET_TECHNICIAN_ADD_POPUP', payload: null })}
        />
      )}
    </div>
  )
}