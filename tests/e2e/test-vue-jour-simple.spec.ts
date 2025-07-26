import { test, expect } from '@playwright/test';

test('Vérifier affichage étiquette dans vue jour', async ({ page }) => {
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
  
  // Créer une étiquette
  await page.fill('input[placeholder="Titre du ticket..."]', 'Mon Étiquette Test');
  await page.locator('button[style*="background-color"]').first().click();
  await page.click('button:has-text("Ajouter le ticket")');
  await page.waitForSelector('h3:has-text("Mon Étiquette Test")');
  
  // Obtenir la date du jour
  const today = new Date();
  const dayNumber = today.getDate();
  const monthName = today.toLocaleDateString('fr-FR', { month: 'long' });
  const year = today.getFullYear();
  
  console.log(`Date du jour: ${dayNumber} ${monthName} ${year}`);
  
  // Glisser l'étiquette sur aujourd'hui
  const ticket = page.locator('[draggable="true"]').filter({ hasText: 'Mon Étiquette Test' });
  const todayCell = page.locator('[class*="dayCell"]').filter({ 
    has: page.locator('[class*="dayNumber"]').filter({ hasText: new RegExp(`^${dayNumber}$`) }) 
  });
  
  await ticket.dragTo(todayCell);
  await page.waitForTimeout(1000);
  
  // Vérifier que l'étiquette est visible en vue mois
  const ticketInMonth = await todayCell.locator('h3:has-text("Mon Étiquette Test")').isVisible();
  console.log('Étiquette visible en vue mois:', ticketInMonth);
  
  // Vérifier le localStorage
  const storageBeforeSwitch = await page.evaluate(() => {
    const data = localStorage.getItem('calendarDroppedTickets');
    return data ? JSON.parse(data) : null;
  });
  console.log('LocalStorage avant switch:', JSON.stringify(storageBeforeSwitch, null, 2));
  
  // Passer en vue jour
  await page.click('button:has-text("Jour")');
  await page.waitForSelector('[class*="dayView"]');
  await page.waitForTimeout(1000);
  
  // Vérifier la date affichée
  const dateInDayView = await page.locator('[class*="dayTitle"]').textContent();
  console.log('Date affichée en vue jour:', dateInDayView);
  
  // Vérifier que l'étiquette est visible
  const ticketsInDayView = await page.evaluate(() => {
    const tickets = Array.from(document.querySelectorAll('[class*="dayView"] h3'))
      .filter(h3 => !h3.textContent?.includes('2025') && !h3.textContent?.includes('2024'))
      .map(h3 => ({
        text: h3.textContent,
        parent: h3.parentElement?.className
      }));
    return tickets;
  });
  
  console.log('Étiquettes trouvées en vue jour:', JSON.stringify(ticketsInDayView, null, 2));
  
  // Vérifier également la clé de date utilisée dans DayView
  const dateKeyInfo = await page.evaluate(() => {
    const date = new Date();
    const dayViewKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const data = localStorage.getItem('calendarDroppedTickets');
    const parsed = data ? JSON.parse(data) : {};
    
    return {
      currentDate: date.toISOString(),
      expectedKey: dayViewKey,
      storageKeys: Object.keys(parsed),
      hasMatchingKey: Object.keys(parsed).includes(dayViewKey)
    };
  });
  
  console.log('Info clés de date:', JSON.stringify(dateKeyInfo, null, 2));
  
  // Capture d'écran
  await page.screenshot({ path: 'vue-jour-simple.png', fullPage: true });
  
  // Test
  const hasTicket = ticketsInDayView.some(t => t.text === 'Mon Étiquette Test');
  expect(hasTicket).toBe(true);
});