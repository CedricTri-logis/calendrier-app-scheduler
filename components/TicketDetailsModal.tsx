import React, { useState, useEffect } from 'react'
import Modal from './ui/Modal'
import styles from './TicketDetailsModal.module.css'
import { Ticket } from '../utils/ticketHelpers'

interface TicketDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  ticket: Ticket | null
  onSave: (ticketId: number, description: string | null, estimatedDuration: number | null) => Promise<boolean>
  loading?: boolean
}

const TicketDetailsModal: React.FC<TicketDetailsModalProps> = ({
  isOpen,
  onClose,
  ticket,
  onSave,
  loading = false
}) => {
  const [description, setDescription] = useState('')
  const [estimatedDuration, setEstimatedDuration] = useState('')
  const [editedDate, setEditedDate] = useState('')
  const [editedTime, setEditedTime] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Synchroniser avec les données du ticket
  useEffect(() => {
    if (ticket) {
      setDescription(ticket.description || '')
      setEstimatedDuration(ticket.estimated_duration ? ticket.estimated_duration.toString() : '')
      
      // Initialiser la date et l'heure d'édition
      if (ticket.date) {
        setEditedDate(ticket.date)
        if (ticket.hour !== null && ticket.hour !== undefined && ticket.hour !== -1) {
          setEditedTime(String(ticket.hour).padStart(2, '0') + ':00')
        } else {
          setEditedTime('')
        }
      } else {
        setEditedDate('')
        setEditedTime('')
      }
    }
  }, [ticket])

  // Réinitialiser quand le modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setDescription('')
      setEstimatedDuration('')
      setEditedDate('')
      setEditedTime('')
      setIsSaving(false)
    }
  }, [isOpen])

  if (!ticket) return null

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      const duration = estimatedDuration.trim() === '' ? null : parseInt(estimatedDuration)
      const desc = description.trim() === '' ? null : description.trim()
      
      // Validation
      if (duration !== null && (isNaN(duration) || duration < 0)) {
        alert('La durée estimée doit être un nombre positif')
        return
      }

      if (desc && desc.length > 500) {
        alert('La description ne peut pas dépasser 500 caractères')
        return
      }

      const success = await onSave(ticket.id, desc, duration)
      if (success) {
        onClose()
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      alert('Erreur lors de la sauvegarde des détails du ticket')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // Restaurer les valeurs originales
    setDescription(ticket.description || '')
    setEstimatedDuration(ticket.estimated_duration ? ticket.estimated_duration.toString() : '')
    
    // Restaurer date et heure
    if (ticket.date) {
      setEditedDate(ticket.date)
      if (ticket.hour !== null && ticket.hour !== undefined && ticket.hour !== -1) {
        setEditedTime(String(ticket.hour).padStart(2, '0') + ':00')
      } else {
        setEditedTime('')
      }
    } else {
      setEditedDate('')
      setEditedTime('')
    }
    
    onClose()
  }

  const formatDateTime = () => {
    if (!ticket.date) return 'Non planifié'
    
    const date = new Date(ticket.date)
    const formattedDate = date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    if (ticket.hour !== null && ticket.hour !== undefined && ticket.hour !== -1) {
      return `${formattedDate} à ${ticket.hour}:00`
    }
    
    return `${formattedDate} (toute la journée)`
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Non définie'
    
    if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`
    }
    
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (remainingMinutes === 0) {
      return `${hours} heure${hours > 1 ? 's' : ''}`
    }
    
    return `${hours}h ${remainingMinutes}min`
  }

  const characterCount = description.length
  const characterCountClass = characterCount > 450 ? styles.error : 
                              characterCount > 400 ? styles.warning : ''

  const hasChanges = description !== (ticket.description || '') || 
                     estimatedDuration !== (ticket.estimated_duration ? ticket.estimated_duration.toString() : '') ||
                     editedDate !== (ticket.date || '') ||
                     editedTime !== (ticket.hour !== null && ticket.hour !== undefined && ticket.hour !== -1 ? String(ticket.hour).padStart(2, '0') + ':00' : '')

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <Modal.Header>
        <div className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div 
              className={styles.ticketColorDot} 
              style={{ backgroundColor: ticket.color }}
            />
            <h2 className={styles.ticketTitle}>{ticket.title}</h2>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body>
        <div className={`${styles.detailsForm} ${loading || isSaving ? styles.loading : ''}`}>
          
          {/* Informations générales */}
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>ℹ️</span>
              Informations générales
            </h3>
            
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label className={styles.infoLabel} htmlFor="ticketDate">Date (YYYY-MM-DD)</label>
                <input
                  id="ticketDate"
                  type="date"
                  className={styles.editableInfoValue}
                  value={editedDate}
                  onChange={(e) => setEditedDate(e.target.value)}
                  disabled={loading || isSaving}
                />
              </div>
              
              <div className={styles.infoItem}>
                <label className={styles.infoLabel} htmlFor="ticketTime">Heure (HH:MM)</label>
                <input
                  id="ticketTime"
                  type="time"
                  className={styles.editableInfoValue}
                  value={editedTime}
                  onChange={(e) => setEditedTime(e.target.value)}
                  disabled={loading || isSaving}
                />
              </div>

              <div className={styles.infoItem}>
                <label className={styles.infoLabel} htmlFor="ticketDuration">Durée estimée (minutes)</label>
                <input
                  id="ticketDuration"
                  type="number"
                  className={styles.editableInfoValue}
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  placeholder="0"
                  min="0"
                  max="9999"
                  disabled={loading || isSaving}
                />
              </div>
            </div>
          </div>

          {/* Techniciens assignés */}
          {ticket.technicians && ticket.technicians.length > 0 && (
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>👥</span>
                Techniciens assignés
              </h3>
              
              <div className={styles.techniciansSection}>
                <div className={styles.techniciansList}>
                  {ticket.technicians.map((tech) => (
                    <div 
                      key={tech.id}
                      className={styles.technicianChip}
                      style={{ backgroundColor: tech.color }}
                    >
                      <span className={styles.technicianIcon}>
                        {tech.is_primary ? '👤' : '👥'}
                      </span>
                      {tech.name}
                      {tech.is_primary && (
                        <span className={styles.primaryBadge}>Principal</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>✏️</span>
              Description du travail
            </h3>
            
            <div className={styles.textareaField}>
              <textarea
                id="description"
                className={styles.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez le travail à effectuer pour ce ticket..."
                maxLength={500}
                disabled={loading || isSaving}
              />
              <div className={`${styles.characterCount} ${characterCountClass}`}>
                {characterCount}/500 caractères
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <div className={styles.modalFooter}>
          <button
            className={`${styles.footerButton} ${styles.cancelButton}`}
            onClick={handleCancel}
            disabled={isSaving}
          >
            Annuler
          </button>
          <button
            className={`${styles.footerButton} ${styles.saveButton}`}
            onClick={handleSave}
            disabled={!hasChanges || isSaving || loading}
          >
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  )
}

export default TicketDetailsModal