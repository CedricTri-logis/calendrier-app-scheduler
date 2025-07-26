import { useState, useMemo } from 'react'
import { useTechnicians } from '../hooks/useTechnicians'
import { useSchedules, Schedule } from '../hooks/useSchedules'
import styles from '../styles/Schedules.module.css'
import WeekSelector from '../components/schedules/WeekSelector'
import ScheduleGrid from '../components/schedules/ScheduleGrid'
import ScheduleModal, { ScheduleFormData } from '../components/schedules/ScheduleModal'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { LoadingContainer } from '../components/ui/Spinner'

export default function Schedules() {
  const { technicians, loading: loadingTechnicians } = useTechnicians()
  const [currentWeek, setCurrentWeek] = useState(new Date())
  
  // Calculer les dates de la semaine
  const weekDates = useMemo(() => {
    const dates: Date[] = []
    const monday = getMonday(currentWeek)
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      dates.push(date)
    }
    
    return dates
  }, [currentWeek])

  // Calculer les dates de début et fin pour le filtre
  const startDate = weekDates[0].toISOString().split('T')[0]
  const endDate = weekDates[6].toISOString().split('T')[0]

  // Charger les horaires de la semaine
  const { 
    schedules, 
    loading: loadingSchedules, 
    createSchedule, 
    updateSchedule, 
    deleteSchedule,
    createMultipleSchedules 
  } = useSchedules({
    start_date: startDate,
    end_date: endDate
  })

  // État pour le modal
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    schedule?: Schedule | null
    date?: string
    technicianId?: number
  }>({
    isOpen: false
  })

  // État pour la duplication
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)

  const handleAddSchedule = (date: string, technicianId: number) => {
    const technician = technicians.find(t => t.id === technicianId)
    if (technician) {
      setModalState({
        isOpen: true,
        schedule: null,
        date,
        technicianId
      })
    }
  }

  const handleEditSchedule = (schedule: Schedule) => {
    setModalState({
      isOpen: true,
      schedule,
      date: schedule.date,
      technicianId: schedule.technician_id
    })
  }

  const handleDeleteSchedule = async (schedule: Schedule) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet horaire ?')) {
      await deleteSchedule(schedule.id)
    }
  }

  const handleSaveSchedule = async (formData: ScheduleFormData) => {
    console.log('handleSaveSchedule called with:', formData)
    console.log('modalState:', modalState)
    
    try {
      if (modalState.schedule) {
        // Modifier
        const result = await updateSchedule(modalState.schedule.id, {
          date: formData.date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          type: formData.type,
          notes: formData.notes
        })
        console.log('Update result:', result)
      } else {
        // Créer
        const result = await createSchedule({
          technician_id: modalState.technicianId!,
          date: formData.date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          type: formData.type,
          notes: formData.notes
        })
        console.log('Create result:', result)
      }
      
      setModalState({ isOpen: false })
    } catch (error) {
      console.error('Error saving schedule:', error)
    }
  }

  const handleDuplicateWeek = async (targetWeekStart: Date) => {
    // Calculer les dates de la semaine cible
    const targetDates: Date[] = []
    const targetMonday = getMonday(targetWeekStart)
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(targetMonday)
      date.setDate(targetMonday.getDate() + i)
      targetDates.push(date)
    }

    // Créer les nouveaux horaires
    const newSchedules = schedules.map((schedule, index) => {
      const sourceDayIndex = weekDates.findIndex(
        d => d.toISOString().split('T')[0] === schedule.date
      )
      
      if (sourceDayIndex !== -1) {
        return {
          technician_id: schedule.technician_id,
          date: targetDates[sourceDayIndex].toISOString().split('T')[0],
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          type: schedule.type,
          notes: schedule.notes
        }
      }
      return null
    }).filter(Boolean) as any[]

    if (newSchedules.length > 0) {
      await createMultipleSchedules(newSchedules)
      setCurrentWeek(targetWeekStart)
      setShowDuplicateModal(false)
    }
  }

  if (loadingTechnicians || loadingSchedules) {
    return (
      <div className={styles.container}>
        <LoadingContainer text="Chargement des horaires..." size="xlarge" />
      </div>
    )
  }

  const selectedTechnician = modalState.technicianId 
    ? technicians.find(t => t.id === modalState.technicianId) 
    : null

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gestion des Horaires</h1>
        <div className={styles.actions}>
          <Button 
            variant="primary"
            onClick={() => setShowDuplicateModal(true)}
            disabled={schedules.length === 0}
            icon={<span>📋</span>}
          >
            Dupliquer cette semaine
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.location.href = '/'}
            icon={<span>←</span>}
          >
            Retour au calendrier
          </Button>
        </div>
      </div>

      <WeekSelector 
        currentWeek={currentWeek}
        onWeekChange={setCurrentWeek}
      />

      <ScheduleGrid
        weekDates={weekDates}
        schedules={schedules}
        technicians={technicians}
        onAddSchedule={handleAddSchedule}
        onEditSchedule={handleEditSchedule}
        onDeleteSchedule={handleDeleteSchedule}
      />

      {modalState.isOpen && selectedTechnician && (
        <ScheduleModal
          isOpen={modalState.isOpen}
          onClose={() => setModalState({ isOpen: false })}
          onSave={handleSaveSchedule}
          schedule={modalState.schedule}
          date={modalState.date!}
          technicianId={modalState.technicianId!}
          technicianName={selectedTechnician.name}
        />
      )}

      {showDuplicateModal && (
        <DuplicateWeekModal
          currentWeek={currentWeek}
          onClose={() => setShowDuplicateModal(false)}
          onDuplicate={handleDuplicateWeek}
        />
      )}
    </div>
  )
}

// Modal pour dupliquer la semaine
function DuplicateWeekModal({ 
  currentWeek, 
  onClose, 
  onDuplicate 
}: { 
  currentWeek: Date
  onClose: () => void
  onDuplicate: (targetWeek: Date) => void 
}) {
  const [targetWeek, setTargetWeek] = useState(() => {
    const next = new Date(currentWeek)
    next.setDate(currentWeek.getDate() + 7)
    return next
  })

  const formatWeek = (date: Date) => {
    const monday = getMonday(date)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
    return `${monday.toLocaleDateString('fr-FR', options)} - ${sunday.toLocaleDateString('fr-FR', options)}`
  }

  return (
    <Modal isOpen={true} onClose={onClose} size="small">
      <Modal.Header onClose={onClose}>
        <Modal.Title>Dupliquer les horaires</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Copier tous les horaires de la semaine actuelle vers :</p>
        
        <div className={styles.weekPicker}>
          <button 
            onClick={() => {
              const prev = new Date(targetWeek)
              prev.setDate(targetWeek.getDate() - 7)
              setTargetWeek(prev)
            }}
          >
            ‹
          </button>
          <span>{formatWeek(targetWeek)}</span>
          <button 
            onClick={() => {
              const next = new Date(targetWeek)
              next.setDate(targetWeek.getDate() + 7)
              setTargetWeek(next)
            }}
          >
            ›
          </button>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onClose} variant="secondary">
          Annuler
        </Button>
        <Button 
          onClick={() => onDuplicate(targetWeek)} 
          variant="primary"
        >
          Dupliquer
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

// Obtenir le lundi de la semaine
function getMonday(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}