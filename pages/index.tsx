import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import Ticket from "../components/Ticket";
import Calendar from "../components/Calendar";
import WeekView from "../components/WeekView";
import DayView from "../components/DayView";
import { useState, useEffect } from "react";

const Home: NextPage = () => {
  // Données des tickets
  const [tickets, setTickets] = useState([
    { id: 1, title: "Réunion équipe", color: "#FFE5B4" },
    { id: 2, title: "Appel client", color: "#B4E5FF" },
    { id: 3, title: "Révision projet", color: "#FFB4B4" },
    { id: 4, title: "Nouveau ticket", color: "#D4FFB4" },
  ]);

  // État pour stocker les tickets déposés sur le calendrier (plusieurs par jour)
  // Changé pour utiliser des clés string (date) au lieu de number (jour)
  const [droppedTickets, setDroppedTickets] = useState<{ [key: string]: any[] }>({});
  
  // État pour le formulaire de nouveau ticket
  const [newTicketTitle, setNewTicketTitle] = useState("");
  const [newTicketColor, setNewTicketColor] = useState("#FFE5B4");
  const [nextId, setNextId] = useState(5); // Commence à 5 car on a déjà 4 tickets
  
  // État pour la date actuelle
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // État pour la vue actuelle (mois, semaine, jour)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  // Fonction pour créer une clé unique basée sur la date complète
  const getDateKey = (year: number, month: number, day: number): string => {
    return `${year}-${month + 1}-${day}`;
  };

  // Fonction pour créer une clé à partir d'une Date
  const getDateKeyFromDate = (date: Date): string => {
    return getDateKey(date.getFullYear(), date.getMonth(), date.getDate());
  };

  // Charger les données sauvegardées au démarrage
  useEffect(() => {
    // Charger les tickets disponibles
    const savedTickets = localStorage.getItem('calendarTickets');
    if (savedTickets) {
      setTickets(JSON.parse(savedTickets));
    }

    // Charger les tickets déposés
    const savedDroppedTickets = localStorage.getItem('calendarDroppedTickets');
    if (savedDroppedTickets) {
      setDroppedTickets(JSON.parse(savedDroppedTickets));
    }

    // Charger le prochain ID
    const savedNextId = localStorage.getItem('calendarNextId');
    if (savedNextId) {
      setNextId(parseInt(savedNextId));
    }
  }, []); // [] signifie : exécute seulement au démarrage

  // Sauvegarder les tickets quand ils changent
  useEffect(() => {
    localStorage.setItem('calendarTickets', JSON.stringify(tickets));
  }, [tickets]);

  // Sauvegarder les tickets déposés quand ils changent
  useEffect(() => {
    localStorage.setItem('calendarDroppedTickets', JSON.stringify(droppedTickets));
  }, [droppedTickets]);

  // Sauvegarder le prochain ID quand il change
  useEffect(() => {
    localStorage.setItem('calendarNextId', nextId.toString());
  }, [nextId]);

  // Gérer le début du drag
  const handleDragStart = (e: React.DragEvent, ticketId: number) => {
    // Chercher d'abord dans les tickets non placés
    let ticket = tickets.find(t => t.id === ticketId);
    
    // Si pas trouvé, chercher dans les tickets déposés
    if (!ticket) {
      for (const dateTickets of Object.values(droppedTickets)) {
        ticket = dateTickets.find(t => t.id === ticketId);
        if (ticket) break;
      }
    }
    
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
  const handleDrop = (dayNumber: number, ticket: any, year?: number, month?: number) => {
    // Créer la clé en fonction du contexte
    let dateKey: string;
    if (year !== undefined && month !== undefined) {
      dateKey = getDateKey(year, month, dayNumber);
    } else {
      // Pour la compatibilité avec l'ancien système
      dateKey = getDateKey(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
    }

    setDroppedTickets(prev => {
      // Si la date a déjà des tickets, ajoute le nouveau
      const existingTickets = prev[dateKey] || [];
      return {
        ...prev,
        [dateKey]: [...existingTickets, ticket]
      };
    });
    
    // Retirer le ticket de la liste originale
    setTickets(prev => prev.filter(t => t.id !== ticket.id));
  };

  // Ajouter un nouveau ticket
  const handleAddTicket = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newTicketTitle.trim() === "") return;
    
    const newTicket = {
      id: nextId,
      title: newTicketTitle,
      color: newTicketColor
    };
    
    setTickets(prev => [...prev, newTicket]);
    setNextId(prev => prev + 1);
    setNewTicketTitle("");
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
              
              <button type="submit" className={styles.addButton}>
                Ajouter le ticket
              </button>
            </form>
            
            <div className={styles.ticketsList}>
              {tickets.map((ticket) => (
                <Ticket
                  key={ticket.id}
                  id={ticket.id}
                  title={ticket.title}
                  color={ticket.color}
                  onDragStart={handleDragStart}
                />
              ))}
            </div>
          </div>

          <div className={styles.calendarColumn}>
            <div className={styles.calendarHeader}>
              <h2>Calendrier</h2>
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
                droppedTickets={droppedTickets}
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
                droppedTickets={droppedTickets}
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
                droppedTickets={droppedTickets}
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
