import type { NextPage } from "next"
import Head from "next/head"
import styles from "../styles/ModernHome.module.css"
import ModernTicket from "../components/ModernTicket"
import ModernCalendar from "../components/ModernCalendar"
import ModernWeekView from "../components/ModernWeekView"
import ModernDayView from "../components/ModernDayView"
import TechnicianQuickAdd from "../components/TechnicianQuickAdd"
import { useState } from "react"
import { useTickets } from "../hooks/useTickets"
import { useTechnicians } from "../hooks/useTechnicians"
import { useSchedules } from "../hooks/useSchedules"
import { formatDateForDB } from "../utils/dateHelpers"
import { getAvailableDates, isHourAvailable, getDateAvailabilityStatus } from "../utils/scheduleHelpers"
import { filterTicketsByTechnician } from "../utils/ticketHelpers"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import { LoadingContainer, SpinnerOverlay } from "../components/ui/Spinner"

const ModernHome: NextPage = () => {
  // Hook Supabase pour gérer les tickets
  const { tickets, loading, error, createTicket, updateTicketPosition, removeTicketFromCalendar, deleteTicket, addTechnicianToTicket, removeTechnicianFromTicket } = useTickets()
  
  // Hook Supabase pour gérer les techniciens
  const { technicians, loading: loadingTechnicians } = useTechnicians()
  
  // Hook Supabase pour gérer les horaires
  const { schedules, loading: loadingSchedules } = useSchedules()
  
  // État pour le formulaire de nouveau ticket
  const [newTicketTitle, setNewTicketTitle] = useState("")
  const [newTicketColor, setNewTicketColor] = useState("#fff3cd")
  const [newTicketTechnicianId, setNewTicketTechnicianId] = useState<number | null>(null)
  
  // État pour la date actuelle
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // État pour la vue actuelle (mois, semaine, jour)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  
  // État pour le filtre technicien
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<number | null>(null)
  
  // État pour le survol de la zone de retrait
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  
  // État pour le popup d'ajout de technicien
  const [technicianAddPopup, setTechnicianAddPopup] = useState<{
    ticketId: number
    position: { x: number; y: number }
    currentTechnicianIds: number[]
  } | null>(null)

  // Filtrer les tickets pour obtenir ceux qui ne sont pas placés (sans filtre)
  const unplacedTickets = tickets.filter(ticket => !ticket.date)
  
  // Filtrer les tickets selon le technicien sélectionné (pour le calendrier uniquement)
  const filteredTicketsForCalendar = filterTicketsByTechnician(tickets, selectedTechnicianId)
  
  // Organiser les tickets placés par date (avec filtre)
  const ticketsByDate = filteredTicketsForCalendar.reduce((acc, ticket) => {
    if (ticket.date) {
      if (!acc[ticket.date]) {
        acc[ticket.date] = []
      }
      acc[ticket.date].push(ticket)
    }
    return acc
  }, {} as { [key: string]: typeof tickets })

  // Gérer le début du drag
  const handleDragStart = (e: React.DragEvent, ticketId: number) => {
    const ticket = tickets.find(t => t.id === ticketId)
    if (ticket) {
      e.dataTransfer.setData('ticket', JSON.stringify(ticket))
      e.dataTransfer.effectAllowed = 'move'
    }
  }

  // Permettre le drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  // Gérer le drop sur une date
  const handleDrop = async (dayNumber: number, ticket: any, year?: number, month?: number) => {
    // Créer la date
    const dropDate = new Date(
      year ?? currentDate.getFullYear(),
      month ?? currentDate.getMonth(),
      dayNumber
    )
    
    const dateString = formatDateForDB(dropDate)
    const hour = ticket.hour ?? -1
    
    // Si un technicien est sélectionné, assigner automatiquement le ticket à ce technicien
    const technicianIdToAssign = selectedTechnicianId !== null ? selectedTechnicianId : ticket.technician_id
    
    // Vérifier la disponibilité
    const availabilityStatus = getDateAvailabilityStatus(dateString, schedules, technicianIdToAssign)
    
    if (availabilityStatus === 'unavailable') {
      alert('Ce technicien n\'est pas disponible à cette date.')
      return
    }
    
    // Si une heure spécifique est définie, vérifier la disponibilité horaire
    if (hour !== -1 && technicianIdToAssign) {
      const isAvailable = isHourAvailable(hour, dateString, schedules, technicianIdToAssign)
      if (!isAvailable) {
        alert(`Ce technicien n'est pas disponible à ${hour}h00 le ${dropDate.toLocaleDateString('fr-FR')}.`)
        return
      }
    }
    
    // Si partiellement disponible, avertir l'utilisateur
    if (availabilityStatus === 'partial' && technicianIdToAssign) {
      const technicianName = technicians.find(t => t.id === technicianIdToAssign)?.name || 'Ce technicien'
      if (!confirm(`${technicianName} a une disponibilité limitée à cette date. Voulez-vous continuer ?`)) {
        return
      }
    }
    
    // Mettre à jour dans Supabase avec le technicien
    await updateTicketPosition(ticket.id, dateString, hour, technicianIdToAssign)
  }

  // Ajouter un nouveau ticket
  const handleAddTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newTicketTitle.trim() === "") return
    
    await createTicket(newTicketTitle, newTicketColor, newTicketTechnicianId || undefined)
    setNewTicketTitle("")
  }

  // Gérer le retrait d'un ticket du calendrier
  const handleRemoveTicket = async (e: React.DragEvent) => {
    e.preventDefault()
    const ticketData = e.dataTransfer.getData('ticket')
    if (ticketData) {
      const ticket = JSON.parse(ticketData)
      await removeTicketFromCalendar(ticket.id)
    }
  }

  // Navigation entre les mois
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  // Navigation entre les semaines
  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  const goToNextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  // Navigation entre les jours
  const goToPreviousDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() - 1)
    setCurrentDate(newDate)
  }

  const goToNextDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + 1)
    setCurrentDate(newDate)
  }
  
  // Aller à aujourd'hui
  const goToToday = () => {
    setCurrentDate(new Date())
  }
  
  // Gestion de l'ajout de technicien
  const handleAddTechnician = (ticketId: number) => {
    const ticket = tickets.find(t => t.id === ticketId)
    if (!ticket) return
    
    // Obtenir les IDs des techniciens actuels
    const currentTechnicianIds = ticket.technicians?.map(t => t.id) || []
    if (ticket.technician_id && !currentTechnicianIds.includes(ticket.technician_id)) {
      currentTechnicianIds.push(ticket.technician_id)
    }
    
    // Obtenir la position pour le popup (centre de l'écran)
    const position = { x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 200 }
    
    setTechnicianAddPopup({
      ticketId,
      position,
      currentTechnicianIds
    })
  }
  
  // Gestion du retrait de technicien
  const handleRemoveTechnician = async (ticketId: number, technicianId: number) => {
    const result = await removeTechnicianFromTicket(ticketId, technicianId)
    if (!result.success) {
      alert(`Erreur lors du retrait du technicien: ${result.error}`)
    }
  }
  
  // Gestion de la sélection de technicien dans le popup
  const handleSelectTechnician = async (technicianId: number) => {
    if (!technicianAddPopup) return
    
    // Trouver le ticket
    const ticket = tickets.find(t => t.id === technicianAddPopup.ticketId)
    if (!ticket || !ticket.date) {
      alert('Erreur: Ticket introuvable ou non planifié')
      setTechnicianAddPopup(null)
      return
    }
    
    // Vérifier la disponibilité du technicien
    const availabilityStatus = getDateAvailabilityStatus(ticket.date, schedules, technicianId)
    
    if (availabilityStatus === 'unavailable') {
      alert('Ce technicien n\'est pas disponible à cette date.')
      return
    }
    
    // Si une heure spécifique est définie, vérifier la disponibilité horaire
    if (ticket.hour !== null && ticket.hour !== -1) {
      const isAvailable = isHourAvailable(ticket.hour, ticket.date, schedules, technicianId)
      if (!isAvailable) {
        alert(`Ce technicien n'est pas disponible à ${ticket.hour}h00 le ${new Date(ticket.date).toLocaleDateString('fr-FR')}.`)
        return
      }
    }
    
    // Si partiellement disponible, avertir l'utilisateur
    if (availabilityStatus === 'partial') {
      const technicianName = technicians.find(t => t.id === technicianId)?.name || 'Ce technicien'
      if (!confirm(`${technicianName} a une disponibilité limitée à cette date. Voulez-vous continuer ?`)) {
        return
      }
    }
    
    const result = await addTechnicianToTicket(technicianAddPopup.ticketId, technicianId, false)
    if (!result.success) {
      alert(`Erreur lors de l'ajout du technicien: ${result.error}`)
    }
    
    setTechnicianAddPopup(null)
  }
  
  // Obtenir le titre de navigation
  const getNavigationTitle = () => {
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]
    
    if (viewMode === 'month') {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    } else if (viewMode === 'week') {
      const monday = new Date(currentDate)
      const day = monday.getDay()
      const diff = monday.getDate() - day + (day === 0 ? -6 : 1)
      monday.setDate(diff)
      return `Semaine du ${monday.getDate()} ${monthNames[monday.getMonth()]}`
    } else {
      const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
      return `${days[currentDate.getDay()]} ${currentDate.getDate()} ${monthNames[currentDate.getMonth()]}`
    }
  }

  if (loading || loadingTechnicians || loadingSchedules) {
    return (
      <div className={styles.container}>
        <LoadingContainer text="Chargement du calendrier..." size="xlarge" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <h1 className={styles.errorTitle}>Erreur de connexion</h1>
          <p className={styles.errorMessage}>{error}</p>
          <p className={styles.errorHint}>
            Vérifiez que vous avez bien configuré vos clés Supabase dans .env.local
          </p>
        </div>
      </div>
    )
  }

  const colorOptions = [
    { value: '#fff3cd', label: 'Jaune' },
    { value: '#d1ecf1', label: 'Bleu' },
    { value: '#f8d7da', label: 'Rouge' },
    { value: '#d4edda', label: 'Vert' },
    { value: '#e2d5f1', label: 'Violet' }
  ]

  return (
    <div className={styles.container}>
      <Head>
        <title>Calendrier Moderne</title>
        <meta
          name="description"
          content="Application calendrier moderne avec drag and drop"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>📅</div>
          <span>Calendrier Pro</span>
        </div>
        <nav className={styles.navigation}>
          <a href="/schedules" className={styles.navLink}>
            ⏰ Gérer les horaires
          </a>
          <a href="/migrations" className={styles.navLink}>
            🗃️ Migrations
          </a>
        </nav>
      </header>

      <main className={styles.main}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Tickets</h2>
            
            {/* Formulaire pour créer un nouveau ticket */}
            <form onSubmit={handleAddTicket} className={styles.addTicketForm}>
              <Input
                label="Titre"
                placeholder="Nouveau ticket..."
                value={newTicketTitle}
                onChange={(e) => setNewTicketTitle(e.target.value)}
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
                      onClick={() => setNewTicketColor(color.value)}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
              
              <Input
                label="Technicien"
                variant="select"
                value={newTicketTechnicianId || ''}
                onChange={(e) => setNewTicketTechnicianId(e.target.value ? parseInt(e.target.value) : null)}
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
            onDrop={(e) => {
              handleRemoveTicket(e)
              setIsDraggingOver(false)
            }}
            onDragOver={(e) => {
              handleDragOver(e)
              setIsDraggingOver(true)
            }}
            onDragLeave={() => setIsDraggingOver(false)}
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
                technicians={ticket.technicians}
                onDragStart={handleDragStart}
                onAddTechnician={(ticketId) => handleAddTechnician(ticketId)}
                onRemoveTechnician={handleRemoveTechnician}
                onDeleteTicket={deleteTicket}
                showActions={true}
                isPlanned={false}
              />
            ))}
          </div>
        </aside>

        {/* Calendar Area */}
        <div className={styles.calendarArea}>
          {/* Calendar Controls */}
          <div className={styles.calendarControls}>
            <div className={styles.navigationGroup}>
              <button onClick={
                viewMode === 'month' ? goToPreviousMonth :
                viewMode === 'week' ? goToPreviousWeek :
                goToPreviousDay
              } className={styles.navButton}>
                ‹
              </button>
              <div className={styles.navigationTitle}>
                {getNavigationTitle()}
              </div>
              <button onClick={
                viewMode === 'month' ? goToNextMonth :
                viewMode === 'week' ? goToNextWeek :
                goToNextDay
              } className={styles.navButton}>
                ›
              </button>
              <button onClick={goToToday} className={styles.todayButton}>
                Aujourd'hui
              </button>
            </div>
            
            <div className={styles.viewControls}>
              <div className={styles.viewButtonGroup}>
                <button 
                  className={`${styles.viewButton} ${viewMode === 'month' ? styles.active : ''}`}
                  onClick={() => setViewMode('month')}
                >
                  Mois
                </button>
                <button 
                  className={`${styles.viewButton} ${viewMode === 'week' ? styles.active : ''}`}
                  onClick={() => setViewMode('week')}
                >
                  Semaine
                </button>
                <button 
                  className={`${styles.viewButton} ${viewMode === 'day' ? styles.active : ''}`}
                  onClick={() => setViewMode('day')}
                >
                  Jour
                </button>
              </div>
            </div>
            
            <div className={styles.filterSection}>
              <label className={styles.filterLabel}>Technicien:</label>
              <div style={{ minWidth: '200px' }}>
                <Input
                  variant="select"
                  value={selectedTechnicianId || ''}
                  onChange={(e) => setSelectedTechnicianId(e.target.value ? parseInt(e.target.value) : null)}
                  options={[
                    { value: '', label: 'Tous les techniciens' },
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
              </div>
            </div>
          </div>
          
          {/* Légende des disponibilités */}
          <div className={styles.availabilityLegend}>
            <span className={styles.legendTitle}>Légende:</span>
            <div className={styles.legendItems}>
              <div className={styles.legendItem}>
                <span className={styles.legendIcon} style={{ backgroundColor: 'var(--success-green)' }}>✓</span>
                <span className={styles.legendText}>Disponible</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendIcon} style={{ backgroundColor: 'var(--warning-orange)' }}>⚡</span>
                <span className={styles.legendText}>Partiellement</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendIcon} style={{ backgroundColor: '#60a5fa' }}>🏖️</span>
                <span className={styles.legendText}>Vacances</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendIcon} style={{ backgroundColor: '#fb923c' }}>🏥</span>
                <span className={styles.legendText}>Congé maladie</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendIcon} style={{ backgroundColor: '#a78bfa' }}>☕</span>
                <span className={styles.legendText}>Pause</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendIcon} style={{ backgroundColor: '#f87171' }}>🚫</span>
                <span className={styles.legendText}>Indisponible</span>
              </div>
            </div>
          </div>
          
          {/* Calendar Content */}
          <div className={styles.calendarContent}>
            {viewMode === 'month' && (
              <ModernCalendar 
                droppedTickets={ticketsByDate}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragStart={handleDragStart}
                currentDate={currentDate}
                onPreviousMonth={goToPreviousMonth}
                onNextMonth={goToNextMonth}
                onToday={goToToday}
                schedules={schedules}
                selectedTechnicianId={selectedTechnicianId}
                onAddTechnician={handleAddTechnician}
                onRemoveTechnician={handleRemoveTechnician}
              />
            )}
            
            {viewMode === 'week' && (
              <ModernWeekView 
                droppedTickets={ticketsByDate}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragStart={handleDragStart}
                currentDate={currentDate}
                onPreviousWeek={goToPreviousWeek}
                onNextWeek={goToNextWeek}
                onToday={goToToday}
                schedules={schedules}
                selectedTechnicianId={selectedTechnicianId}
                onAddTechnician={handleAddTechnician}
                onRemoveTechnician={handleRemoveTechnician}
              />
            )}
            
            {viewMode === 'day' && (
              <ModernDayView 
                droppedTickets={ticketsByDate}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragStart={handleDragStart}
                currentDate={currentDate}
                onPreviousDay={goToPreviousDay}
                onNextDay={goToNextDay}
                onToday={goToToday}
                schedules={schedules}
                selectedTechnicianId={selectedTechnicianId}
                onAddTechnician={handleAddTechnician}
                onRemoveTechnician={handleRemoveTechnician}
              />
            )}
          </div>
        </div>
      </main>
      
      {/* Popup d'ajout de technicien */}
      {technicianAddPopup && (
        <TechnicianQuickAdd
          ticketId={technicianAddPopup.ticketId}
          ticketDate={tickets.find(t => t.id === technicianAddPopup.ticketId)?.date}
          ticketHour={tickets.find(t => t.id === technicianAddPopup.ticketId)?.hour}
          currentTechnicianIds={technicianAddPopup.currentTechnicianIds}
          position={technicianAddPopup.position}
          onSelect={handleSelectTechnician}
          onClose={() => setTechnicianAddPopup(null)}
        />
      )}
    </div>
  )
}

export default ModernHome