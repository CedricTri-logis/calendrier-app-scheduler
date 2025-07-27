import { test, expect } from '@playwright/test';

test('Test drag and drop manuel', async ({ page }) => {
  test.setTimeout(60000);
  
  // Aller à l'application
  await page.goto('http://localhost:3001');
  
  // Attendre que la page se charge
  await page.waitForSelector('h1', { timeout: 10000 });
  
  // Créer un ticket
  await page.fill('input[placeholder="Titre du ticket..."]', 'Test Manuel');
  await page.locator('button[style*="background-color"]').first().click();
  await page.click('button:has-text("Ajouter le ticket")');
  
  // Attendre que le ticket apparaisse
  await page.waitForSelector('h3:has-text("Test Manuel")');
  
  const today = new Date();
  const dayNumber = today.getDate();
  
  // Utiliser une approche différente pour le drag & drop
  // Simuler les événements manuellement
  await page.evaluate(async (day) => {
    // Trouver le ticket
    const ticketElement = Array.from(document.querySelectorAll('h3')).find(h3 => h3.textContent === 'Test Manuel');
    const ticketDiv = ticketElement?.closest('[draggable="true"]');
    
    // Trouver la cellule du jour
    const cells = document.querySelectorAll('[class*="dayCell"]');
    let targetCell = null;
    for (const cell of Array.from(cells)) {
      const dayDiv = cell.querySelector('[class*="dayNumber"]');
      if (dayDiv && dayDiv.textContent?.trim() === day.toString()) {
        targetCell = cell;
        break;
      }
    }
    
    if (ticketDiv && targetCell) {
      // Créer un objet DataTransfer
      const dataTransfer = new DataTransfer();
      
      // Simuler dragstart sur le ticket
      const dragStartEvent = new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dataTransfer
      });
      
      // Récupérer les données du ticket
      const ticketData = {
        id: parseInt(ticketDiv.getAttribute('data-id') || '0'),
        title: ticketElement?.textContent || '',
        color: (ticketDiv as HTMLElement).style.backgroundColor
      };
      
      dataTransfer.setData('ticket', JSON.stringify(ticketData));
      ticketDiv.dispatchEvent(dragStartEvent);
      
      // Simuler dragover sur la cellule cible
      const dragOverEvent = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dataTransfer
      });
      targetCell.dispatchEvent(dragOverEvent);
      
      // Simuler drop sur la cellule cible
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dataTransfer
      });
      targetCell.dispatchEvent(dropEvent);
      
      return { success: true, ticketData, cellText: targetCell.textContent };
    }
    
    return { success: false };
  }, dayNumber);
  
  // Attendre un peu pour que React se mette à jour
  await page.waitForTimeout(2000);
  
  // Vérifier le localStorage
  const storage = await page.evaluate(() => {
    const data = localStorage.getItem('calendarDroppedTickets');
    return data ? JSON.parse(data) : null;
  });
  
  console.log('Données après drag:', JSON.stringify(storage, null, 2));
  
  // Vérifier visuellement si le ticket est sur le calendrier
  const ticketInCalendar = await page.evaluate((day) => {
    const cells = document.querySelectorAll('[class*="dayCell"]');
    for (const cell of Array.from(cells)) {
      const dayDiv = cell.querySelector('[class*="dayNumber"]');
      if (dayDiv && dayDiv.textContent?.trim() === day.toString()) {
        const tickets = cell.querySelectorAll('h3');
        return {
          found: tickets.length > 0,
          tickets: Array.from(tickets).map((t: any) => t.textContent)
        };
      }
    }
    return { found: false };
  }, dayNumber);
  
  console.log('Tickets dans le calendrier:', ticketInCalendar);
  
  // Si le ticket n'est pas visible, essayons une approche différente
  if (!ticketInCalendar.found || storage === null || Object.keys(storage).length === 0) {
    console.log('Drag & drop échoué, essayons avec la méthode Playwright native');
    
    // Recharger la page pour recommencer
    await page.reload();
    await page.waitForSelector('h1');
    
    // Recréer le ticket
    await page.fill('input[placeholder="Titre du ticket..."]', 'Test Playwright');
    await page.locator('button[style*="background-color"]').first().click();
    await page.click('button:has-text("Ajouter le ticket")');
    await page.waitForSelector('h3:has-text("Test Playwright")');
    
    // Utiliser la méthode dragTo de Playwright
    const ticket = page.locator('[draggable="true"]').filter({ hasText: 'Test Playwright' });
    const targetCell = page.locator(`[class*="dayCell"]:has([class*="dayNumber"]:has-text("${dayNumber}"))`);
    
    await ticket.hover();
    await page.mouse.down();
    await targetCell.hover();
    await page.mouse.up();
    
    await page.waitForTimeout(1000);
  }
  
  // Passer en vue jour
  await page.click('button:has-text("Jour")');
  await page.waitForTimeout(1000);
  
  // Vérifier la vue jour
  const dayViewTickets = await page.evaluate(() => {
    const allTickets = document.querySelectorAll('[class*="dayView"] h3');
    return Array.from(allTickets).map(t => ({
      text: t.textContent,
      parent: t.parentElement?.className
    }));
  });
  
  console.log('Tickets en vue jour:', dayViewTickets);
  
  // Capture d'écran finale
  await page.screenshot({ path: 'drag-drop-result.png', fullPage: true });
});