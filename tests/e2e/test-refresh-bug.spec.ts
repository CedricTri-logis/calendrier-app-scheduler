import { test, expect } from '@playwright/test';

test('Test avec rafraîchissement - persistance entre les vues', async ({ page }) => {
  test.setTimeout(60000);
  
  // Aller à l'application
  await page.goto('http://localhost:3001');
  await page.waitForSelector('h1', { timeout: 10000 });
  
  // Nettoyer le localStorage
  await page.evaluate(() => {
    localStorage.clear();
  });
  
  await page.reload();
  await page.waitForSelector('h1');
  
  // Créer un ticket
  await page.fill('input[placeholder="Titre du ticket..."]', 'Test Persistance');
  await page.locator('button[style*="background-color"]').nth(1).click(); // Bleu
  await page.click('button:has-text("Ajouter le ticket")');
  await page.waitForSelector('h3:has-text("Test Persistance")');
  
  // Obtenir la date d'aujourd'hui
  const today = new Date();
  const dayNumber = today.getDate();
  
  // Glisser sur aujourd'hui
  const ticket = page.locator('[draggable="true"]').filter({ hasText: 'Test Persistance' });
  const todayCell = page.locator('[class*="dayCell"]').filter({ 
    has: page.locator('[class*="dayNumber"]').filter({ hasText: new RegExp(`^${dayNumber}$`) }) 
  });
  
  await ticket.dragTo(todayCell);
  await page.waitForTimeout(1000);
  
  // Vérifier en vue mois
  const monthViewCheck = await todayCell.locator('h3:has-text("Test Persistance")').isVisible();
  console.log(`Vue mois - Ticket visible sur le ${dayNumber}:`, monthViewCheck);
  
  // RAFRAÎCHIR LA PAGE
  console.log('Rafraîchissement de la page...');
  await page.reload();
  await page.waitForSelector('h1');
  await page.waitForTimeout(1000);
  
  // Vérifier que le ticket est toujours là après rafraîchissement
  const afterRefreshMonth = await page.locator(`[class*="dayCell"]:has-text("${dayNumber}") h3:has-text("Test Persistance")`).isVisible();
  console.log('Vue mois après refresh - Ticket visible:', afterRefreshMonth);
  
  // Passer en vue jour
  await page.click('button:has-text("Jour")');
  await page.waitForSelector('[class*="dayView"]');
  await page.waitForTimeout(1000);
  
  // Vérifier en vue jour
  const dayViewTickets = await page.evaluate(() => {
    const tickets = Array.from(document.querySelectorAll('[class*="dayView"] h3'))
      .map(h3 => h3.textContent)
      .filter(text => text && !text.includes('2025'));
    return tickets;
  });
  
  console.log('Vue jour - Tickets trouvés:', dayViewTickets);
  
  // Revenir en vue mois
  await page.click('button:has-text("Mois")');
  await page.waitForTimeout(500);
  
  // Puis retourner en vue jour
  await page.click('button:has-text("Jour")');
  await page.waitForTimeout(500);
  
  // Vérifier à nouveau
  const secondDayViewCheck = await page.evaluate(() => {
    const tickets = Array.from(document.querySelectorAll('[class*="dayView"] h3'))
      .map(h3 => h3.textContent)
      .filter(text => text && !text.includes('2025'));
    return tickets;
  });
  
  console.log('Vue jour après switch - Tickets:', secondDayViewCheck);
  
  // Vérifier également le localStorage
  const finalStorage = await page.evaluate(() => {
    const data = localStorage.getItem('calendarDroppedTickets');
    return data ? JSON.parse(data) : null;
  });
  
  console.log('LocalStorage final:', JSON.stringify(finalStorage, null, 2));
  
  // Capture d'écran
  await page.screenshot({ path: 'refresh-test.png', fullPage: true });
  
  // Tests
  expect(dayViewTickets).toContain('Test Persistance');
  expect(secondDayViewCheck).toContain('Test Persistance');
});