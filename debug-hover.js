// Script de débogage pour vérifier l'état hover
// À exécuter dans la console du navigateur

function debugHover() {
  const tickets = document.querySelectorAll('[class*="ticket"]');
  console.log(`Nombre de tickets trouvés: ${tickets.length}`);
  
  tickets.forEach((ticket, index) => {
    const actionButtons = ticket.querySelector('[class*="actionButtons"]');
    if (actionButtons) {
      const style = window.getComputedStyle(actionButtons);
      console.log(`Ticket ${index + 1}:`);
      console.log(`  - Opacity: ${style.opacity}`);
      console.log(`  - Display: ${style.display}`);
      console.log(`  - Z-index: ${style.zIndex}`);
      console.log(`  - Position: ${style.position}`);
      console.log(`  - Visibility: ${style.visibility}`);
      console.log(`  - Pointer-events: ${style.pointerEvents}`);
      
      // Vérifier si le ticket a showActions
      const reactProps = ticket._reactInternalFiber || ticket._reactInternalInstance;
      if (reactProps) {
        console.log(`  - React props:`, reactProps);
      }
    } else {
      console.log(`Ticket ${index + 1}: Pas de boutons d'action trouvés`);
    }
  });
  
  // Ajouter des écouteurs pour déboguer
  tickets.forEach((ticket, index) => {
    ticket.addEventListener('mouseenter', () => {
      console.log(`Mouse enter ticket ${index + 1}`);
      const actionButtons = ticket.querySelector('[class*="actionButtons"]');
      if (actionButtons) {
        console.log(`  - Opacity après hover: ${window.getComputedStyle(actionButtons).opacity}`);
      }
    });
  });
}

// Fonction pour forcer l'affichage des boutons
function forceShowButtons() {
  const actionButtons = document.querySelectorAll('[class*="actionButtons"]');
  actionButtons.forEach(btn => {
    btn.style.opacity = '1';
    btn.style.display = 'flex';
  });
  console.log(`Forcé l'affichage de ${actionButtons.length} groupes de boutons`);
}

// Exécuter le débogage
debugHover();

// Pour forcer l'affichage, exécuter:
// forceShowButtons();