import { test, expect } from '@playwright/test';

test('Reproduire le bug exact - ticket pas visible en vue jour', async ({ page }) => {
  test.setTimeout(60000);
  
  // Aller à l'application
  await page.goto('http://localhost:3001');
  await page.waitForSelector('h1', { timeout: 10000 });
  
  // Nettoyer le localStorage pour partir de zéro
  await page.evaluate(() => {
    localStorage.removeItem('calendarDroppedTickets');
    localStorage.removeItem('calendarTickets');
    localStorage.removeItem('calendarNextId');
  });
  
  await page.reload();
  await page.waitForSelector('h1');
  
  // Créer un ticket pour le 7 juillet
  await page.fill('input[placeholder="Titre du ticket..."]', 'Étiquette 7 Juillet');
  await page.locator('button[style*="background-color"]').first().click();
  await page.click('button:has-text("Ajouter le ticket")');
  await page.waitForSelector('h3:has-text("Étiquette 7 Juillet")');
  
  // Glisser le ticket sur le 7 du mois actuel (juillet 2025)
  const ticket = page.locator('[draggable="true"]').filter({ hasText: 'Étiquette 7 Juillet' });
  const cell7 = page.locator('[class*="dayCell"]').filter({ 
    has: page.locator('[class*="dayNumber"]').filter({ hasText: /^7$/ }) 
  });
  
  console.log('Glissement du ticket sur le 7...');
  await ticket.dragTo(cell7);
  await page.waitForTimeout(1000);
  
  // Vérifier que le ticket est bien visible sur le calendrier en vue mois
  const ticketInMonth = await cell7.locator('h3:has-text("Étiquette 7 Juillet")').isVisible();
  console.log('Ticket visible en vue mois:', ticketInMonth);
  
  // Vérifier le localStorage
  const storageAfterDrop = await page.evaluate(() => {
    const data = localStorage.getItem('calendarDroppedTickets');
    return data ? JSON.parse(data) : null;
  });
  console.log('Données stockées:', JSON.stringify(storageAfterDrop, null, 2));
  
  // Passer en vue jour
  console.log('Passage en vue jour...');
  await page.click('button:has-text("Jour")');
  await page.waitForSelector('[class*="dayView"]');
  await page.waitForTimeout(1000);
  
  // Vérifier la date actuelle affichée
  const currentDateText = await page.locator('[class*="dayTitle"]').textContent();
  console.log('Date actuelle en vue jour:', currentDateText);
  
  // Si on n'est pas sur le 7, naviguer jusqu'au 7
  if (!currentDateText?.includes('7 juillet')) {
    console.log('Navigation vers le 7 juillet...');
    // On est le 24 juillet, donc reculer de 17 jours
    for (let i = 0; i < 17; i++) {
      await page.click('button:has-text("◀")');
      await page.waitForTimeout(200);
    }
  }
  
  // Vérifier à nouveau la date
  const dateAfterNav = await page.locator('[class*="dayTitle"]').textContent();
  console.log('Date après navigation:', dateAfterNav);
  
  // Chercher le ticket dans la vue jour
  const ticketsInDayView = await page.evaluate(() => {
    const dayView = document.querySelector('[class*="dayView"]');
    if (!dayView) return { found: false, reason: 'Pas de vue jour' };
    
    const allTickets = dayView.querySelectorAll('h3');
    const ticketTexts = Array.from(allTickets).map(h3 => h3.textContent);
    
    // Chercher dans toutes les zones (heures et toute la journée)
    const allDayContent = dayView.querySelector('[class*="allDayContent"]');
    const allDayTickets = allDayContent ? Array.from(allDayContent.querySelectorAll('h3')).map(h3 => h3.textContent) : [];
    
    return {
      found: true,
      allTickets: ticketTexts,
      allDayTickets: allDayTickets,
      hasTargetTicket: ticketTexts.includes('Étiquette 7 Juillet')
    };
  });
  
  console.log('Résultat recherche vue jour:', JSON.stringify(ticketsInDayView, null, 2));
  
  // Capture d'écran pour debug
  await page.screenshot({ path: 'bug-vue-jour.png', fullPage: true });
  
  // Test final
  expect(ticketsInDayView.hasTargetTicket).toBe(true);
});