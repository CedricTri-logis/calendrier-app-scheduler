import { test, expect } from '@playwright/test';

test('Test complet: créer ticket et vérifier dans vue jour', async ({ page }) => {
  test.setTimeout(60000);
  
  // Aller à l'application sur le port 3001
  await page.goto('http://localhost:3001');
  
  // Attendre un peu plus longtemps pour le chargement
  await page.waitForTimeout(2000);
  
  // Vérifier que la page est chargée en cherchant le titre
  const title = await page.textContent('h1');
  console.log('Titre trouvé:', title);
  
  if (!title || !title.includes('Calendrier')) {
    throw new Error('Page non chargée correctement');
  }
  
  // Nettoyer le localStorage
  await page.evaluate(() => {
    localStorage.clear();
  });
  
  await page.reload();
  await page.waitForTimeout(2000);
  
  // Créer un ticket
  console.log('Création du ticket...');
  await page.fill('input[placeholder="Titre du ticket..."]', 'Ticket Test Vue Jour');
  
  // Sélectionner une couleur (la deuxième - bleue)
  const colorButtons = page.locator('button[style*="background-color"]');
  await colorButtons.nth(1).click();
  
  // Ajouter le ticket
  await page.click('button:text("Ajouter le ticket")');
  await page.waitForTimeout(1000);
  
  // Vérifier que le ticket est créé
  const ticketCreated = await page.locator('h3:text("Ticket Test Vue Jour")').isVisible();
  console.log('Ticket créé:', ticketCreated);
  
  // Obtenir la date du jour
  const today = new Date();
  const dayNumber = today.getDate();
  console.log('Jour actuel:', dayNumber);
  
  // Glisser le ticket sur aujourd'hui
  console.log('Glissement du ticket...');
  const ticket = page.locator('[draggable="true"]').filter({ hasText: 'Ticket Test Vue Jour' });
  
  // Trouver la cellule du jour en utilisant une approche plus robuste
  const dayCell = page.locator(`[class*="dayCell"]`).filter({ 
    hasText: new RegExp(`^${dayNumber}$`) 
  }).first();
  
  // Vérifier que la cellule existe
  const cellExists = await dayCell.isVisible();
  console.log('Cellule du jour trouvée:', cellExists);
  
  if (cellExists) {
    // Effectuer le drag & drop
    await ticket.hover();
    await page.mouse.down();
    await dayCell.hover();
    await page.mouse.up();
    await page.waitForTimeout(1000);
    
    // Vérifier le localStorage
    const storage = await page.evaluate(() => {
      const data = localStorage.getItem('calendarDroppedTickets');
      return data ? JSON.parse(data) : null;
    });
    console.log('LocalStorage:', JSON.stringify(storage, null, 2));
    
    // Passer en vue jour
    console.log('Passage en vue jour...');
    await page.click('button:text("Jour")');
    await page.waitForTimeout(1000);
    
    // Vérifier la date affichée
    const dayTitle = await page.locator('[class*="dayTitle"]').textContent();
    console.log('Date en vue jour:', dayTitle);
    
    // Chercher le ticket dans la vue jour
    const ticketInDayView = await page.locator('[class*="dayView"] h3:text("Ticket Test Vue Jour")').isVisible();
    console.log('Ticket visible en vue jour:', ticketInDayView);
    
    // Si le ticket n'est pas visible, afficher plus d'informations
    if (!ticketInDayView) {
      const allH3s = await page.locator('[class*="dayView"] h3').allTextContents();
      console.log('Tous les h3 en vue jour:', allH3s);
      
      const allDayContent = await page.locator('[class*="allDayContent"]').textContent();
      console.log('Contenu zone "Toute la journée":', allDayContent);
    }
    
    // Capture d'écran finale
    await page.screenshot({ path: 'test-final-result.png', fullPage: true });
    
    // Test
    expect(ticketInDayView).toBe(true);
  } else {
    throw new Error('Impossible de trouver la cellule du jour');
  }
});