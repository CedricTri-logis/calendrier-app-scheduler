import type { NextPage } from "next"
import Head from "next/head"
import styles from "../styles/ModernHome.module.css"
import ModernTicket from "../components/ModernTicket"
import ModernCalendar from "../components/ModernCalendar"
import ModernWeekView from "../components/ModernWeekView"
import ModernDayView from "../components/ModernDayView"
import { useState } from "react"
import { useTickets } from "../hooks/useTickets"
import { formatDateForDB } from "../utils/dateHelpers"
import { TECHNICIANS } from "../data/technicians"

const ModernHome: NextPage = () => {
  // Hook Supabase pour gérer les tickets
  const { tickets, loading, error, createTicket, updateTicketPosition, removeTicketFromCalendar } = useTickets()
  
  // État pour le formulaire de nouveau ticket
  const [newTicketTitle, setNewTicketTitle] = useState("")
  const [newTicketColor, setNewTicketColor] = useState("#fff3cd")
  const [newTicketTechnician, setNewTicketTechnician] = useState("Non assigné")
  
  // État pour la date actuelle
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // État pour la vue actuelle (mois, semaine, jour)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  
  // État pour le filtre technicien
  const [selectedTechnician, setSelectedTechnician] = useState<string>("Tous")
  
  // État pour le survol de la zone de retrait
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  // Filtrer les tickets pour obtenir ceux qui ne sont pas placés (sans filtre)
  const unplacedTickets = tickets.filter(ticket => !ticket.date)
  
  // Filtrer les tickets selon le technicien sélectionné (pour le calendrier uniquement)
  const filteredTicketsForCalendar = selectedTechnician === "Tous" 
    ? tickets 
    : tickets.filter(ticket => ticket.technician === selectedTechnician)
  
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
    
    // Si un technicien est sélectionné et que ce n'est pas "Tous", 
    // assigner automatiquement le ticket à ce technicien
    const technicianToAssign = selectedTechnician !== "Tous" ? selectedTechnician : ticket.technician
    
    // Mettre à jour dans Supabase avec le technicien
    await updateTicketPosition(ticket.id, dateString, hour, technicianToAssign)
  }

  // Ajouter un nouveau ticket
  const handleAddTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newTicketTitle.trim() === "") return
    
    await createTicket(newTicketTitle, newTicketColor, newTicketTechnician)
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

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <div className={styles.loadingText}>Chargement du calendrier...</div>
        </div>
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
      </header>

      <main className={styles.main}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Tickets</h2>
            
            {/* Formulaire pour créer un nouveau ticket */}
            <form onSubmit={handleAddTicket} className={styles.addTicketForm}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Titre</label>
                <input
                  type="text"
                  placeholder="Nouveau ticket..."
                  value={newTicketTitle}
                  onChange={(e) => setNewTicketTitle(e.target.value)}
                  className="modern-input"
                />
              </div>
              
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
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Technicien</label>
                <select 
                  value={newTicketTechnician}
                  onChange={(e) => setNewTicketTechnician(e.target.value)}
                  className="modern-select"
                >
                  {TECHNICIANS.map(tech => (
                    <option key={tech} value={tech}>{tech}</option>
                  ))}
                </select>
              </div>
              
              <button type="submit" className="modern-button modern-button-primary">
                Ajouter le ticket
              </button>
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
                technician={ticket.technician}
                onDragStart={handleDragStart}
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
              <select 
                value={selectedTechnician}
                onChange={(e) => setSelectedTechnician(e.target.value)}
                className={`modern-select ${styles.technicianFilter}`}
              >
                <option value="Tous">Tous les techniciens</option>
                {TECHNICIANS.map(tech => (
                  <option key={tech} value={tech}>{tech}</option>
                ))}
              </select>
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
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default ModernHome