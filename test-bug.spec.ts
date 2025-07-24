import { test, expect } from '@playwright/test';

test('Debug vue jour', async ({ page }) => {
  // Aller à l'application
  await page.goto('http://localhost:3001');
  
  console.log('Page chargée');
  
  // Créer un ticket de test
  await page.fill('input[placeholder="Titre du ticket..."]', 'Mon Test');
  // Utiliser un sélecteur basé sur le style inline
  const colorButtons = await page.locator('button[style*="background-color"]').all();
  if (colorButtons.length > 0) {
    await colorButtons[0].click();
  }
  await page.click('button:text("Ajouter le ticket")');
  
  console.log('Ticket créé');
  
  // Obtenir la date du jour pour le test
  const today = new Date();
  const dayOfMonth = today.getDate();
  
  // Glisser le ticket sur aujourd'hui
  const ticket = page.locator('h3:text("Mon Test")').first();
  await ticket.waitFor();
  
  // Trouver la cellule du jour actuel
  const dayCell = page.locator(`div:has(> div:text("${dayOfMonth}"))`).nth(1); // nth(1) car le premier est dans le header
  
  // Effectuer le drag and drop
  await ticket.hover();
  await page.mouse.down();
  await dayCell.hover();
  await page.mouse.up();
  
  console.log('Drag and drop effectué');
  
  // Attendre un peu
  await page.waitForTimeout(1000);
  
  // Vérifier localStorage pour voir ce qui est stocké
  const droppedTickets = await page.evaluate(() => {
    return localStorage.getItem('calendarDroppedTickets');
  });
  
  console.log('Tickets stockés:', droppedTickets);
  
  // Passer en vue jour
  await page.click('button:text("Jour")');
  await page.waitForTimeout(500);
  
  // Vérifier ce qui est affiché
  const dayViewContent = await page.locator('.dayView').textContent();
  console.log('Contenu vue jour:', dayViewContent);
  
  // Vérifier spécifiquement la zone "Toute la journée"
  const allDayContent = await page.locator('.allDayContent').textContent();
  console.log('Zone toute la journée:', allDayContent);
  
  // Prendre une capture d'écran
  await page.screenshot({ path: 'debug-vue-jour.png', fullPage: true });
});