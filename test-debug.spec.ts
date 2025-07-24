import { test, expect } from '@playwright/test';

test('Debug structure et synchronisation', async ({ page }) => {
  test.setTimeout(60000);
  
  // Aller à l'application
  await page.goto('http://localhost:3001');
  
  // Attendre que la page se charge
  await page.waitForSelector('h1', { timeout: 10000 });
  
  // Créer un ticket
  await page.fill('input[placeholder="Titre du ticket..."]', 'Test Debug');
  await page.locator('button[style*="background-color"]').first().click();
  await page.click('button:has-text("Ajouter le ticket")');
  
  // Attendre que le ticket apparaisse
  await page.waitForSelector('h3:has-text("Test Debug")');
  
  // Debug: afficher la structure du calendrier
  const calendarStructure = await page.evaluate(() => {
    const calendar = document.querySelector('[class*="daysGrid"]');
    if (calendar) {
      const cells = calendar.querySelectorAll('[class*="dayCell"]');
      return {
        found: true,
        cellCount: cells.length,
        firstCells: Array.from(cells).slice(0, 10).map(cell => ({
          text: cell.textContent?.trim(),
          classes: cell.className
        }))
      };
    }
    return { found: false };
  });
  
  console.log('Structure calendrier:', JSON.stringify(calendarStructure, null, 2));
  
  // Obtenir la date du jour
  const today = new Date();
  const dayNumber = today.getDate();
  console.log('Jour actuel:', dayNumber);
  
  // Trouver la cellule du jour actuel avec une approche différente
  const dayCell = await page.evaluate((day) => {
    const cells = document.querySelectorAll('[class*="dayCell"]');
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const dayDiv = cell.querySelector('[class*="dayNumber"]');
      if (dayDiv && dayDiv.textContent?.trim() === day.toString()) {
        return {
          found: true,
          index: i,
          text: cell.textContent?.trim()
        };
      }
    }
    return { found: false };
  }, dayNumber);
  
  console.log('Cellule trouvée:', dayCell);
  
  if (dayCell.found) {
    // Drag and drop du ticket
    const ticket = page.locator('h3:has-text("Test Debug")').first();
    const targetCell = page.locator('[class*="dayCell"]').nth(dayCell.index);
    
    await ticket.dragTo(targetCell);
    await page.waitForTimeout(1000);
    
    // Vérifier le localStorage
    const storage = await page.evaluate(() => {
      const data = localStorage.getItem('calendarDroppedTickets');
      return data ? JSON.parse(data) : null;
    });
    
    console.log('Données stockées:', JSON.stringify(storage, null, 2));
    
    // Passer en vue jour
    await page.click('button:has-text("Jour")');
    await page.waitForTimeout(1000);
    
    // Vérifier ce qui est affiché
    const dayViewData = await page.evaluate(() => {
      const dayView = document.querySelector('[class*="dayView"]');
      if (dayView) {
        const allTickets = dayView.querySelectorAll('h3');
        return {
          found: true,
          ticketCount: allTickets.length,
          tickets: Array.from(allTickets).map(t => t.textContent)
        };
      }
      return { found: false };
    });
    
    console.log('Vue jour:', JSON.stringify(dayViewData, null, 2));
    
    // Capture d'écran
    await page.screenshot({ path: 'debug-sync.png', fullPage: true });
  }
});