import { test, expect } from '@playwright/test';

test('Test drag depuis le calendrier', async ({ page }) => {
  test.setTimeout(60000);
  
  // Aller à l'application
  await page.goto('http://localhost:3001');
  await page.waitForSelector('h1', { timeout: 10000 });
  
  // Nettoyer
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload();
  await page.waitForSelector('h1');
  
  // Créer deux tickets
  await page.fill('input[placeholder="Titre du ticket..."]', 'Ticket A');
  await page.locator('button[style*="background-color"]').first().click();
  await page.click('button:has-text("Ajouter le ticket")');
  
  await page.fill('input[placeholder="Titre du ticket..."]', 'Ticket B');
  await page.locator('button[style*="background-color"]').nth(1).click();
  await page.click('button:has-text("Ajouter le ticket")');
  
  await page.waitForSelector('h3:has-text("Ticket A")');
  await page.waitForSelector('h3:has-text("Ticket B")');
  
  // Placer Ticket A sur le jour 10
  const ticketA = page.locator('[draggable="true"]').filter({ hasText: 'Ticket A' });
  const cell10 = page.locator('[class*="dayCell"]').filter({ 
    has: page.locator('[class*="dayNumber"]').filter({ hasText: /^10$/ }) 
  });
  
  await ticketA.dragTo(cell10);
  await page.waitForTimeout(1000);
  
  // Vérifier que Ticket A est sur le jour 10
  const ticketAInCell10 = await cell10.locator('h3:has-text("Ticket A")').isVisible();
  console.log('Ticket A sur jour 10:', ticketAInCell10);
  
  // Maintenant essayer de déplacer Ticket A du jour 10 vers le jour 15
  const ticketAInCalendar = cell10.locator('[draggable="true"]').filter({ hasText: 'Ticket A' });
  const cell15 = page.locator('[class*="dayCell"]').filter({ 
    has: page.locator('[class*="dayNumber"]').filter({ hasText: /^15$/ }) 
  });
  
  console.log('Tentative de déplacement de Ticket A vers jour 15...');
  await ticketAInCalendar.dragTo(cell15);
  await page.waitForTimeout(1000);
  
  // Vérifier que Ticket A est maintenant sur le jour 15
  const ticketAInCell15 = await cell15.locator('h3:has-text("Ticket A")').isVisible();
  const ticketAStillInCell10 = await cell10.locator('h3:has-text("Ticket A")').isVisible();
  
  console.log('Ticket A sur jour 15:', ticketAInCell15);
  console.log('Ticket A encore sur jour 10:', ticketAStillInCell10);
  
  // Vérifier le localStorage
  const storage = await page.evaluate(() => {
    const data = localStorage.getItem('calendarDroppedTickets');
    return data ? JSON.parse(data) : null;
  });
  
  console.log('État du localStorage:', JSON.stringify(storage, null, 2));
  
  // Tester aussi en vue jour
  await page.click('button:has-text("Jour")');
  await page.waitForSelector('[class*="dayView"]');
  
  // Naviguer au jour 15
  const currentDay = new Date().getDate();
  const daysToNavigate = 15 - currentDay;
  
  if (daysToNavigate > 0) {
    for (let i = 0; i < daysToNavigate; i++) {
      await page.click('button:has-text("▶")');
      await page.waitForTimeout(100);
    }
  } else if (daysToNavigate < 0) {
    for (let i = 0; i < Math.abs(daysToNavigate); i++) {
      await page.click('button:has-text("◀")');
      await page.waitForTimeout(100);
    }
  }
  
  // Vérifier que le ticket est visible
  const ticketInDayView = await page.locator('[class*="dayView"] h3:has-text("Ticket A")').isVisible();
  console.log('Ticket A visible en vue jour sur le 15:', ticketInDayView);
  
  // Capture d'écran
  await page.screenshot({ path: 'drag-from-calendar.png', fullPage: true });
  
  // Tests
  expect(ticketAInCell15).toBe(true);
  expect(ticketAStillInCell10).toBe(false);
  expect(ticketInDayView).toBe(true);
});