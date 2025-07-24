// Script de débogage pour la vue jour
// À exécuter dans la console du navigateur

// 1. Créer un ticket de test
async function createTestTicket() {
  const input = document.querySelector('input[placeholder="Titre du ticket..."]');
  const colorButton = document.querySelector('button[style*="background-color"]');
  const addButton = document.querySelector('button:has-text("Ajouter le ticket")') || 
                    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Ajouter'));
  
  if (input && colorButton && addButton) {
    input.value = 'Test Debug Vue Jour';
    input.dispatchEvent(new Event('change', { bubbles: true }));
    colorButton.click();
    addButton.click();
    console.log('Ticket créé');
  } else {
    console.error('Impossible de créer le ticket');
  }
}

// 2. Simuler un drag & drop
async function simulateDragDrop() {
  const ticket = Array.from(document.querySelectorAll('h3')).find(h3 => h3.textContent === 'Test Debug Vue Jour');
  if (!ticket) {
    console.error('Ticket non trouvé');
    return;
  }
  
  const ticketDiv = ticket.closest('[draggable="true"]');
  const today = new Date().getDate();
  const dayCell = Array.from(document.querySelectorAll('[class*="dayCell"]')).find(cell => {
    const dayNumber = cell.querySelector('[class*="dayNumber"]');
    return dayNumber && dayNumber.textContent === today.toString();
  });
  
  if (!ticketDiv || !dayCell) {
    console.error('Éléments non trouvés');
    return;
  }
  
  // Créer les événements manuellement
  const dataTransfer = new DataTransfer();
  const ticketData = {
    id: parseInt(ticketDiv.getAttribute('data-id') || '1'),
    title: 'Test Debug Vue Jour',
    color: ticketDiv.style.backgroundColor
  };
  
  dataTransfer.setData('ticket', JSON.stringify(ticketData));
  
  // Simuler dragstart
  const dragStartEvent = new DragEvent('dragstart', {
    bubbles: true,
    cancelable: true,
    dataTransfer: dataTransfer
  });
  ticketDiv.dispatchEvent(dragStartEvent);
  
  // Simuler dragover
  const dragOverEvent = new DragEvent('dragover', {
    bubbles: true,
    cancelable: true,
    dataTransfer: dataTransfer
  });
  dayCell.dispatchEvent(dragOverEvent);
  
  // Simuler drop
  const dropEvent = new DragEvent('drop', {
    bubbles: true,
    cancelable: true,
    dataTransfer: dataTransfer
  });
  dayCell.dispatchEvent(dropEvent);
  
  console.log('Drag & drop simulé');
}

// 3. Vérifier le localStorage
function checkStorage() {
  const data = localStorage.getItem('calendarDroppedTickets');
  console.log('LocalStorage:', data ? JSON.parse(data) : 'vide');
}

// 4. Passer en vue jour et vérifier
function switchToDayView() {
  const dayButton = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Jour');
  if (dayButton) {
    dayButton.click();
    setTimeout(() => {
      const dayView = document.querySelector('[class*="dayView"]');
      if (dayView) {
        const tickets = Array.from(dayView.querySelectorAll('h3')).map(h3 => h3.textContent);
        console.log('Tickets en vue jour:', tickets);
        
        // Vérifier la date affichée
        const dateTitle = dayView.querySelector('[class*="dayTitle"]');
        console.log('Date affichée:', dateTitle?.textContent);
      }
    }, 500);
  }
}

// Exécuter le test
async function runTest() {
  console.log('=== Test de débogage vue jour ===');
  
  // Étape 1: Créer le ticket
  await createTestTicket();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Étape 2: Drag & drop
  await simulateDragDrop();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Étape 3: Vérifier le storage
  checkStorage();
  
  // Étape 4: Passer en vue jour
  switchToDayView();
}

// Lancer le test
runTest();