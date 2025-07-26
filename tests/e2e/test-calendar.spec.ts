import { test, expect } from '@playwright/test';

test('Test synchronisation des tickets entre les vues', async ({ page }) => {
  // Aller à l'application
  await page.goto('http://localhost:3001');
  
  // Attendre que la page se charge
  await page.waitForSelector('h1');
  
  // Créer un nouveau ticket
  await page.fill('input[placeholder="Titre du ticket..."]', 'Test Ticket');
  
  // Sélectionner une couleur (la première)
  await page.locator('button[style*="background-color"]').first().click();
  
  // Cliquer sur Ajouter
  await page.click('button:has-text("Ajouter le ticket")');
  
  // Attendre que le ticket apparaisse
  await page.waitForSelector('text=Test Ticket');
  
  // Obtenir la date du jour
  const today = new Date();
  const dayNumber = today.getDate();
  
  // Trouver le ticket et le glisser sur aujourd'hui dans la vue mois
  const ticket = await page.locator('text=Test Ticket').first();
  const todayCell = await page.locator(`div:has(> div:text-is("${dayNumber}"))`).filter({ hasText: `${dayNumber}` }).first();
  
  // Drag and drop
  await ticket.dragTo(todayCell);
  
  // Vérifier que le ticket est sur le calendrier
  await expect(todayCell.locator('text=Test Ticket')).toBeVisible();
  
  // Passer en vue Semaine
  await page.click('button:has-text("Semaine")');
  await page.waitForTimeout(500);
  
  // Vérifier que le ticket est visible en vue semaine
  const weekTicket = await page.locator('text=Test Ticket');
  await expect(weekTicket).toBeVisible();
  
  // Passer en vue Jour
  await page.click('button:has-text("Jour")');
  await page.waitForTimeout(500);
  
  // Vérifier que le ticket est visible en vue jour
  const dayTicket = await page.locator('text=Test Ticket');
  await expect(dayTicket).toBeVisible();
  
  // Prendre des captures d'écran pour debug
  await page.screenshot({ path: 'vue-jour.png', fullPage: true });
});