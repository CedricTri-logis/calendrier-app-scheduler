import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import Ticket from "../components/Ticket";
import Calendar from "../components/Calendar";
import WeekView from "../components/WeekView";
import DayView from "../components/DayView";
import { useState } from "react";
import { useTickets } from "../hooks/useTickets";
import { formatDateForDB } from "../utils/dateHelpers";
import { TECHNICIANS } from "../data/technicians";

const Home: NextPage = () => {
  // Hook Supabase pour gérer les tickets
  const { tickets, loading, error, createTicket, updateTicketPosition, removeTicketFromCalendar } = useTickets();
  
  // État pour le formulaire de nouveau ticket
  const [newTicketTitle, setNewTicketTitle] = useState("");
  const [newTicketColor, setNewTicketColor] = useState("#FFE5B4");
  const [newTicketTechnician, setNewTicketTechnician] = useState("Non assigné");
  
  // État pour la date actuelle
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // État pour la vue actuelle (mois, semaine, jour)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  
  // État pour le filtre technicien
  const [selectedTechnician, setSelectedTechnician] = useState<string>("Tous");
  
  // État pour le survol de la zone de retrait
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Filtrer les tickets pour obtenir ceux qui ne sont pas placés (sans filtre)
  const unplacedTickets = tickets.filter(ticket => !ticket.date);
  
  // Filtrer les tickets selon le technicien sélectionné (pour le calendrier uniquement)
  const filteredTicketsForCalendar = selectedTechnician === "Tous" 
    ? tickets 
    : tickets.filter(ticket => ticket.technician_name === selectedTechnician);
  
  // Organiser les tickets placés par date (avec filtre)
  const ticketsByDate = filteredTicketsForCalendar.reduce((acc, ticket) => {
    if (ticket.date) {
      if (!acc[ticket.date]) {
        acc[ticket.date] = [];
      }
      acc[ticket.date].push(ticket);
    }
    return acc;
  }, {} as { [key: string]: typeof tickets });

  // Gérer le début du drag
  const handleDragStart = (e: React.DragEvent, ticketId: number) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      e.dataTransfer.setData('ticket', JSON.stringify(ticket));
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  // Permettre le drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Gérer le drop sur une date
  const handleDrop = async (dayNumber: number, ticket: any, year?: number, month?: number) => {
    // Créer la date
    const dropDate = new Date(
      year ?? currentDate.getFullYear(),
      month ?? currentDate.getMonth(),
      dayNumber
    );
    
    const dateString = formatDateForDB(dropDate);
    const hour = ticket.hour ?? -1;
    
    // Si un technicien est sélectionné et que ce n'est pas "Tous", 
    // assigner automatiquement le ticket à ce technicien
    const technicianToAssign = selectedTechnician !== "Tous" ? selectedTechnician : ticket.technician_name;
    
    // Mettre à jour dans Supabase avec le technicien
    await updateTicketPosition(ticket.id, dateString, hour);
  };

  // Ajouter un nouveau ticket
  const handleAddTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newTicketTitle.trim() === "") return;
    
    await createTicket(newTicketTitle, newTicketColor);
    setNewTicketTitle("");
  };

  // Gérer le retrait d'un ticket du calendrier
  const handleRemoveTicket = async (e: React.DragEvent) => {
    e.preventDefault();
    const ticketData = e.dataTransfer.getData('ticket');
    if (ticketData) {
      const ticket = JSON.parse(ticketData);
      await removeTicketFromCalendar(ticket.id);
    }
  };

  // Navigation entre les mois
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  // Navigation entre les semaines
  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  // Navigation entre les jours
  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <h1 className={styles.title}>Chargement...</h1>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <h1 className={styles.title}>Erreur</h1>
          <p>{error}</p>
          <p className={styles.error}>
            Vérifiez que vous avez bien configuré vos clés Supabase dans .env.local
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Mon Calendrier</title>
        <meta
          name="description"
          content="Application calendrier avec drag and drop"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Mon Calendrier avec Drag & Drop</h1>

        <div className={styles.content}>
          <div className={styles.ticketsColumn}>
            <h2>Tickets</h2>
            
            {/* Formulaire pour créer un nouveau ticket */}
            <form onSubmit={handleAddTicket} className={styles.addTicketForm}>
              <input
                type="text"
                placeholder="Titre du ticket..."
                value={newTicketTitle}
                onChange={(e) => setNewTicketTitle(e.target.value)}
                className={styles.ticketInput}
              />
              
              <div className={styles.colorPicker}>
                <label>Couleur:</label>
                <div className={styles.colorOptions}>
                  <button
                    type="button"
                    className={`${styles.colorButton} ${newTicketColor === "#FFE5B4" ? styles.selectedColor : ""}`}
                    style={{ backgroundColor: "#FFE5B4" }}
                    onClick={() => setNewTicketColor("#FFE5B4")}
                  />
                  <button
                    type="button"
                    className={`${styles.colorButton} ${newTicketColor === "#B4E5FF" ? styles.selectedColor : ""}`}
                    style={{ backgroundColor: "#B4E5FF" }}
                    onClick={() => setNewTicketColor("#B4E5FF")}
                  />
                  <button
                    type="button"
                    className={`${styles.colorButton} ${newTicketColor === "#FFB4B4" ? styles.selectedColor : ""}`}
                    style={{ backgroundColor: "#FFB4B4" }}
                    onClick={() => setNewTicketColor("#FFB4B4")}
                  />
                  <button
                    type="button"
                    className={`${styles.colorButton} ${newTicketColor === "#D4FFB4" ? styles.selectedColor : ""}`}
                    style={{ backgroundColor: "#D4FFB4" }}
                    onClick={() => setNewTicketColor("#D4FFB4")}
                  />
                  <button
                    type="button"
                    className={`${styles.colorButton} ${newTicketColor === "#E5B4FF" ? styles.selectedColor : ""}`}
                    style={{ backgroundColor: "#E5B4FF" }}
                    onClick={() => setNewTicketColor("#E5B4FF")}
                  />
                </div>
              </div>
              
              <div className={styles.technicianPicker}>
                <label>Technicien:</label>
                <select 
                  value={newTicketTechnician}
                  onChange={(e) => setNewTicketTechnician(e.target.value)}
                  className={styles.technicianSelect}
                >
                  {TECHNICIANS.map(tech => (
                    <option key={tech} value={tech}>{tech}</option>
                  ))}
                </select>
              </div>
              
              <button type="submit" className={styles.addButton}>
                Ajouter le ticket
              </button>
            </form>
            
            {/* Zone de dépôt pour retirer les tickets du calendrier */}
            <div 
              className={`${styles.removeDropZone} ${isDraggingOver ? styles.dragOver : ''}`}
              onDrop={(e) => {
                handleRemoveTicket(e);
                setIsDraggingOver(false);
              }}
              onDragOver={(e) => {
                handleDragOver(e);
                setIsDraggingOver(true);
              }}
              onDragLeave={() => setIsDraggingOver(false)}
            >
              <div className={styles.removeIcon}>📥</div>
              <p>Glissez ici pour retirer du calendrier</p>
            </div>
            
            <div className={styles.ticketsList}>
              {unplacedTickets.map((ticket) => (
                <Ticket
                  key={ticket.id}
                  id={ticket.id}
                  title={ticket.title}
                  color={ticket.color}
                  technician={ticket.technician_name}
                  onDragStart={handleDragStart}
                />
              ))}
            </div>
          </div>

          <div className={styles.calendarColumn}>
            <div className={styles.calendarHeader}>
              <h2>Calendrier</h2>
              <div className={styles.filterSection}>
                <label>Filtrer par technicien:</label>
                <select 
                  value={selectedTechnician}
                  onChange={(e) => setSelectedTechnician(e.target.value)}
                  className={styles.technicianFilter}
                >
                  <option value="Tous">Tous les techniciens</option>
                  {TECHNICIANS.map(tech => (
                    <option key={tech} value={tech}>{tech}</option>
                  ))}
                </select>
              </div>
              <div className={styles.viewButtons}>
                <button 
                  className={`${styles.viewButton} ${viewMode === 'month' ? styles.activeView : ''}`}
                  onClick={() => setViewMode('month')}
                >
                  Mois
                </button>
                <button 
                  className={`${styles.viewButton} ${viewMode === 'week' ? styles.activeView : ''}`}
                  onClick={() => setViewMode('week')}
                >
                  Semaine
                </button>
                <button 
                  className={`${styles.viewButton} ${viewMode === 'day' ? styles.activeView : ''}`}
                  onClick={() => setViewMode('day')}
                >
                  Jour
                </button>
              </div>
            </div>
            
            {viewMode === 'month' && (
              <Calendar 
                droppedTickets={ticketsByDate}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragStart={handleDragStart}
                currentDate={currentDate}
                onPreviousMonth={goToPreviousMonth}
                onNextMonth={goToNextMonth}
              />
            )}
            
            {viewMode === 'week' && (
              <WeekView 
                droppedTickets={ticketsByDate}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragStart={handleDragStart}
                currentDate={currentDate}
                onPreviousWeek={goToPreviousWeek}
                onNextWeek={goToNextWeek}
              />
            )}
            
            {viewMode === 'day' && (
              <DayView 
                droppedTickets={ticketsByDate}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragStart={handleDragStart}
                currentDate={currentDate}
                onPreviousDay={goToPreviousDay}
                onNextDay={goToNextDay}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;