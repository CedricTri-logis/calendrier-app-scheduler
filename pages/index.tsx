import type { NextPage } from "next"
import Head from "next/head"
import React, { useCallback } from "react"
import styles from "../styles/ModernHome.module.css"
import { CalendarProvider, useCalendarState, useCalendarActions } from "../contexts/CalendarContext"
import TicketSidebar from "../components/Sidebar/TicketSidebar"
import CalendarContainer from "../components/Calendar/CalendarContainer"
import TicketDetailsModal from "../components/TicketDetailsModal"
import { LoadingContainer } from "../components/ui/Spinner"
import { useToast } from "../contexts/ToastContext"
import ZoomControls from "../components/ZoomControls"
import { useIsMobile } from "../hooks/useIsMobile"

const ModernHomeContent: React.FC = () => {
  const { showError } = useToast()
  const state = useCalendarState()
  const isMobile = useIsMobile()
  const { 
    updateTicketDetails, 
    removeTicketFromCalendar, 
    removeTechnicianFromTicket,
    dispatch 
  } = useCalendarActions()
  
  const {
    tickets,
    loading,
    error,
    selectedTicketForDetails
  } = state
  
  // Gérer le début du drag
  const handleDragStart = useCallback((e: React.DragEvent, ticketId: number) => {
    if (isMobile) return
    const ticket = tickets.find(t => t.id === ticketId)
    if (ticket) {
      e.dataTransfer.setData('ticket', JSON.stringify(ticket))
      e.dataTransfer.effectAllowed = 'move'
    }
  }, [tickets, isMobile])
  
  // Permettre le drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (isMobile) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [isMobile])
  
  // Gérer le retrait d'un ticket du calendrier
  const handleRemoveTicket = useCallback(async (e: React.DragEvent) => {
    if (isMobile) return
    e.preventDefault()
    const ticketData = e.dataTransfer.getData('ticket')
    if (ticketData) {
      const ticket = JSON.parse(ticketData)
      await removeTicketFromCalendar(ticket.id)
    }
  }, [removeTicketFromCalendar, isMobile])
  
  // Gérer la fermeture du modal de détails
  const handleCloseTicketDetails = useCallback(() => {
    dispatch({ type: 'SET_SELECTED_TICKET_DETAILS', payload: null })
  }, [dispatch])
  
  // Gérer la sauvegarde des détails de ticket
  const handleUpdateTicketDetails = useCallback(async (ticketId: number, description: string | null, estimatedDuration: number | null) => {
    return await updateTicketDetails(ticketId, description, estimatedDuration)
  }, [updateTicketDetails])
  
  // Gérer le retrait de technicien depuis la sidebar
  const handleRemoveTechnicianFromSidebar = useCallback(async (ticketId: number, technicianId: number) => {
    const result = await removeTechnicianFromTicket(ticketId, technicianId)
    if (!result.success) {
      showError(`Erreur lors du retrait du technicien: ${result.error}`)
    }
  }, [removeTechnicianFromTicket, showError])
  
  if (loading) {
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
          <ZoomControls />
          <div className={styles.navSeparator} />
          <a href="/schedules" className={styles.navLink}>
            ⏰ Gérer les horaires
          </a>
          <a href="/migrations" className={styles.navLink}>
            🗃️ Migrations
          </a>
          <a href="/debug-schedules" className={styles.navLink} style={{ backgroundColor: '#ffeaa7', color: '#d63031' }}>
            🐛 Debug 14h
          </a>
        </nav>
      </header>
      
      <main className={styles.main}>
        <TicketSidebar 
          onDragStart={handleDragStart}
          onRemoveTicket={handleRemoveTicket}
        />
        
        <CalendarContainer 
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
        />
      </main>
      
      {/* Modal des détails de ticket */}
      <TicketDetailsModal
        isOpen={selectedTicketForDetails !== null}
        onClose={handleCloseTicketDetails}
        ticket={selectedTicketForDetails ? tickets.find(t => t.id === selectedTicketForDetails) || null : null}
        onSave={handleUpdateTicketDetails}
        loading={loading}
      />
    </div>
  )
}

// Composant principal avec le Provider
const ModernHome: NextPage = () => {
  return (
    <CalendarProvider>
      <ModernHomeContent />
    </CalendarProvider>
  )
}

export default ModernHome