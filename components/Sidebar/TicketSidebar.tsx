import React, { useCallback } from 'react'
import styles from '../../styles/ModernHome.module.css'
import ModernTicket from '../ModernTicket'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { useCalendar, useCalendarState, useCalendarActions } from '../../contexts/CalendarContext'
import { formatDateForDB } from '../../utils/dateHelpers'
import { getDateAvailabilityStatus } from '../../utils/scheduleHelpers'

interface TicketSidebarProps {
  onDragStart: (e: React.DragEvent, ticketId: number) => void
  onRemoveTicket: (e: React.DragEvent) => void
}

const colorOptions = [
  { value: '#fff3cd', label: 'Jaune' },
  { value: '#d1ecf1', label: 'Bleu' },
  { value: '#f8d7da', label: 'Rouge' },
  { value: '#d4edda', label: 'Vert' },
  { value: '#e2d5f1', label: 'Violet' }
]

export default function TicketSidebar({ onDragStart, onRemoveTicket }: TicketSidebarProps) {
  const state = useCalendarState()
  const { createTicket, deleteTicket, removeTechnicianFromTicket, dispatch } = useCalendarActions()
  
  const {
    tickets,
    technicians,
    schedules,
    newTicketTitle,
    newTicketColor,
    newTicketTechnicianId,
    isDraggingOver
  } = state
  
  // Filtrer les tickets non placés
  const unplacedTickets = tickets.filter(ticket => !ticket.date)
  
  // Gérer la soumission du formulaire
  const handleAddTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newTicketTitle.trim() === "") return
    
    await createTicket(newTicketTitle, newTicketColor, newTicketTechnicianId || undefined)
    dispatch({ type: 'RESET_NEW_TICKET_FORM' })
  }
  
  // Gérer l'ajout de technicien
  const handleAddTechnician = (ticketId: number) => {
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
  }
  
  // Gérer le clic sur un ticket
  const handleTicketClick = (ticketId: number) => {
    dispatch({ type: 'SET_SELECTED_TICKET_DETAILS', payload: ticketId })
  }
  
  // Gérer le drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    dispatch({ type: 'SET_DRAGGING_OVER', payload: true })
  }
  
  // Gérer le drag leave
  const handleDragLeave = () => {
    dispatch({ type: 'SET_DRAGGING_OVER', payload: false })
  }
  
  // Gérer le drop
  const handleDrop = (e: React.DragEvent) => {
    onRemoveTicket(e)
    dispatch({ type: 'SET_DRAGGING_OVER', payload: false })
  }
  
  // Gérer le retrait de technicien
  const handleRemoveTechnician = useCallback(async (ticketId: number, technicianId: number) => {
    const result = await removeTechnicianFromTicket(ticketId, technicianId)
    if (!result.success) {
      alert(`Erreur lors du retrait du technicien: ${result.error}`)
    }
  }, [removeTechnicianFromTicket])
  
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h2 className={styles.sidebarTitle}>Tickets</h2>
        
        {/* Formulaire pour créer un nouveau ticket */}
        <form onSubmit={handleAddTicket} className={styles.addTicketForm}>
          <Input
            label="Titre"
            placeholder="Nouveau ticket..."
            value={newTicketTitle}
            onChange={(e) => dispatch({ type: 'SET_NEW_TICKET_TITLE', payload: e.target.value })}
            fullWidth
          />
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Couleur</label>
            <div className={styles.colorPicker}>
              {colorOptions.map(color => (
                <button
                  key={color.value}
                  type="button"
                  className={`${styles.colorButton} ${newTicketColor === color.value ? styles.selected : ""}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => dispatch({ type: 'SET_NEW_TICKET_COLOR', payload: color.value })}
                  title={color.label}
                />
              ))}
            </div>
          </div>
          
          <Input
            label="Technicien"
            variant="select"
            value={newTicketTechnicianId || ''}
            onChange={(e) => dispatch({ 
              type: 'SET_NEW_TICKET_TECHNICIAN', 
              payload: e.target.value ? parseInt(e.target.value) : null 
            })}
            options={[
              { value: '', label: 'Non assigné' },
              ...technicians.filter(tech => tech.active).map(tech => {
                const todayKey = formatDateForDB(new Date())
                const todayStatus = getDateAvailabilityStatus(todayKey, schedules, tech.id)
                let statusEmoji = ''
                if (todayStatus === 'available') statusEmoji = '✅ '
                else if (todayStatus === 'partial') statusEmoji = '⚡ '
                else if (todayStatus === 'unavailable') statusEmoji = '🚫 '
                return {
                  value: tech.id.toString(),
                  label: `${statusEmoji}${tech.name}`
                }
              })
            ]}
            fullWidth
          />
          
          <Button type="submit" variant="primary" fullWidth>
            Ajouter le ticket
          </Button>
        </form>
      </div>
      
      {/* Zone de dépôt pour retirer les tickets du calendrier */}
      <div 
        className={`${styles.removeDropZone} ${isDraggingOver ? styles.dragOver : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className={styles.removeIcon}>📥</div>
        <p className={styles.removeText}>Glissez ici pour retirer du calendrier</p>
      </div>
      
      <div className={styles.ticketsList}>
        {unplacedTickets.map((ticket) => (
          <ModernTicket
            key={ticket.id}
            id={ticket.id}
            title={ticket.title}
            color={ticket.color}
            technician_id={ticket.technician_id}
            technician_name={ticket.technician_name}
            technician_color={ticket.technician_color}
            technicians={ticket.technicians?.map(t => ({
              ...t,
              is_primary: t.is_primary ?? false
            }))}
            onDragStart={onDragStart}
            onAddTechnician={handleAddTechnician}
            onRemoveTechnician={handleRemoveTechnician}
            onDeleteTicket={deleteTicket}
            onTicketClick={handleTicketClick}
            showActions={true}
            isPlanned={false}
          />
        ))}
      </div>
    </aside>
  )
}