import React, { useState, useEffect } from 'react'
import styles from './ScheduleModal.module.css'
import { Schedule, ScheduleType } from '../../hooks/useSchedules'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ScheduleFormData) => void
  schedule?: Schedule | null
  date: string
  technicianId: number
  technicianName: string
}

export interface ScheduleFormData {
  date: string
  start_time: string
  end_time: string
  type: ScheduleType
  notes?: string
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  schedule,
  date,
  technicianId,
  technicianName
}) => {
  const [formData, setFormData] = useState<ScheduleFormData>({
    date: date,
    start_time: '09:00',
    end_time: '17:00',
    type: 'available', // Toujours disponible
    notes: ''
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Mettre à jour le formulaire quand on édite un horaire existant
  useEffect(() => {
    if (schedule) {
      setFormData({
        date: schedule.date,
        start_time: schedule.start_time.substring(0, 5),
        end_time: schedule.end_time.substring(0, 5),
        type: 'available', // Toujours disponible
        notes: schedule.notes || ''
      })
    } else {
      setFormData({
        date: date,
        start_time: '09:00',
        end_time: '17:00',
        type: 'available', // Toujours disponible
        notes: ''
      })
    }
    setErrors({})
  }, [schedule, date])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted', formData)

    // Validation
    const newErrors: { [key: string]: string } = {}

    if (!formData.start_time) {
      newErrors.start_time = 'L\'heure de début est requise'
    }

    if (!formData.end_time) {
      newErrors.end_time = 'L\'heure de fin est requise'
    }

    if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
      newErrors.end_time = 'L\'heure de fin doit être après l\'heure de début'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      console.log('Validation errors:', newErrors)
      return
    }

    console.log('Calling onSave with:', formData)
    onSave(formData)
  }

  if (!isOpen) return null

  // Type toujours 'available' - pas besoin de sélecteur

  const formatDateForDisplay = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }
    return date.toLocaleDateString('fr-FR', options)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Modal isOpen={isOpen} onClose={onClose} size="medium">
        <Modal.Header onClose={onClose}>
          <Modal.Title>{schedule ? 'Modifier l\'horaire' : 'Ajouter un horaire'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className={styles.info}>
            <p><strong>Technicien :</strong> {technicianName}</p>
            <p><strong>Date :</strong> {formatDateForDisplay(formData.date)}</p>
          </div>

          {/* Type d'horaire toujours 'available' - champ retiré */}

          <div className={styles.timeGroup}>
            <Input
              label="Heure de début"
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              error={errors.start_time}
              fullWidth
            />
            <Input
              label="Heure de fin"
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              error={errors.end_time}
              fullWidth
            />
          </div>

          <Input
            label="Notes (optionnel)"
            variant="textarea"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Ex: Formation, réunion, etc."
            {/* @ts-ignore */}
            rows={3}
            fullWidth
          />

        </Modal.Body>
        <Modal.Footer>
          <Button type="button" onClick={onClose} variant="secondary">
            Annuler
          </Button>
          <Button type="submit" variant="primary">
            {schedule ? 'Modifier' : 'Ajouter'}
          </Button>
        </Modal.Footer>
      </Modal>
    </form>
  )
}

export default ScheduleModal