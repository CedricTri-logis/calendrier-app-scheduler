import React from 'react'
import styles from './Ticket.module.css'

interface TicketProps {
  id: number
  title: string
  color: string
  onDragStart?: (e: React.DragEvent, id: number) => void
}

const Ticket: React.FC<TicketProps> = ({ id, title, color, onDragStart }) => {
  const handleDragStart = (e: React.DragEvent) => {
    // Toujours définir les données du ticket dans le dataTransfer
    const ticketData = {
      id,
      title,
      color
    }
    e.dataTransfer.setData('ticket', JSON.stringify(ticketData))
    e.dataTransfer.effectAllowed = 'move'
    
    // Appeler onDragStart si fourni
    if (onDragStart) {
      onDragStart(e, id)
    }
  }

  return (
    <div 
      className={styles.ticket} 
      style={{ backgroundColor: color }}
      draggable
      onDragStart={handleDragStart}
      data-id={id}
    >
      <div className={styles.ticketNumber}>#{id}</div>
      <h3 className={styles.ticketTitle}>{title}</h3>
    </div>
  )
}

export default Ticket