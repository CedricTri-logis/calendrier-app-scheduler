import { test, expect } from '@playwright/test';

test('Test synchronisation cross-month', async ({ page }) => {
  test.setTimeout(60000);
  
  // Aller à l'application
  await page.goto('http://localhost:3001');
  await page.waitForSelector('h1', { timeout: 10000 });
  
  // Créer plusieurs tickets
  const tickets = [
    { name: 'Ticket Juillet', color: 0 },
    { name: 'Ticket Août', color: 1 }
  ];
  
  for (const ticket of tickets) {
    await page.fill('input[placeholder="Titre du ticket..."]', ticket.name);
    await page.locator('button[style*="background-color"]').nth(ticket.color).click();
    await page.click('button:has-text("Ajouter le ticket")');
    await page.waitForSelector(`h3:has-text("${ticket.name}")`);
  }
  
  // Placer le premier ticket sur le 7 juillet (date actuelle)
  const ticket1 = page.locator('[draggable="true"]').filter({ hasText: 'Ticket Juillet' });
  const cell7 = page.locator('[class*="dayCell"]').filter({ has: page.locator('[class*="dayNumber"]').filter({ hasText: /^7$/ }) });
  await ticket1.dragTo(cell7);
  await page.waitForTimeout(500);
  
  // Naviguer au mois suivant
  await page.click('button:has-text("▶")');
  await page.waitForTimeout(500);
  
  // Placer le deuxième ticket sur le 7 août
  const ticket2 = page.locator('[draggable="true"]').filter({ hasText: 'Ticket Août' });
  const cell7August = page.locator('[class*="dayCell"]').filter({ has: page.locator('[class*="dayNumber"]').filter({ hasText: /^7$/ }) });
  await ticket2.dragTo(cell7August);
  await page.waitForTimeout(500);
  
  // Vérifier le localStorage
  const storage = await page.evaluate(() => {
    const data = localStorage.getItem('calendarDroppedTickets');
    return data ? JSON.parse(data) : null;
  });
  
  console.log('Tickets stockés:', JSON.stringify(storage, null, 2));
  
  // Revenir en juillet
  await page.click('button:has-text("◀")');
  await page.waitForTimeout(500);
  
  // Passer en vue jour et naviguer au 7 juillet
  await page.click('button:has-text("Jour")');
  await page.waitForTimeout(500);
  
  // Naviguer jusqu'au 7 juillet (on est actuellement le 24)
  for (let i = 0; i < 17; i++) {
    await page.click('button:has-text("◀")');
    await page.waitForTimeout(100);
  }
  
  // Vérifier que le ticket de juillet est visible
  const julyTickets = await page.evaluate(() => {
    const tickets = document.querySelectorAll('[class*="dayView"] h3');
    return Array.from(tickets).map(t => t.textContent).filter(t => t !== null && !t.includes('juillet'));
  });
  
  console.log('Tickets du 7 juillet en vue jour:', julyTickets);
  
  // Naviguer au 7 août
  for (let i = 0; i < 31; i++) {
    await page.click('button:has-text("▶")');
    await page.waitForTimeout(100);
  }
  
  // Vérifier que le ticket d'août est visible
  const augustTickets = await page.evaluate(() => {
    const tickets = document.querySelectorAll('[class*="dayView"] h3');
    return Array.from(tickets).map(t => t.textContent).filter(t => t !== null && !t.includes('août'));
  });
  
  console.log('Tickets du 7 août en vue jour:', augustTickets);
  
  // Capture d'écran finale
  await page.screenshot({ path: 'cross-month-test.png', fullPage: true });
  
  // Vérifications
  expect(julyTickets).toContain('Ticket Juillet');
  expect(augustTickets).toContain('Ticket Août');
});