import { test, expect } from '@playwright/test';

test('Test simple de synchronisation', async ({ page }) => {
  // Configuration du test avec plus de temps
  test.setTimeout(60000);
  
  // Aller à l'application
  await page.goto('http://localhost:3001');
  
  // Attendre que la page se charge complètement
  await page.waitForSelector('h1:has-text("Mon Calendrier avec Drag & Drop")', { timeout: 10000 });
  
  // Créer un nouveau ticket
  await page.fill('input[placeholder="Titre du ticket..."]', 'Test Vue Jour');
  
  // Cliquer sur la première couleur
  const firstColorButton = page.locator('button[style*="background-color"]').first();
  await firstColorButton.click();
  
  // Ajouter le ticket
  await page.click('button:has-text("Ajouter le ticket")');
  
  // Attendre que le ticket apparaisse
  await page.waitForSelector('h3:has-text("Test Vue Jour")', { timeout: 5000 });
  
  // Trouver le ticket
  const ticket = page.locator('div').filter({ hasText: 'Test Vue Jour' }).first();
  
  // Obtenir le jour actuel
  const today = new Date();
  const dayNumber = today.getDate();
  
  // Essayer de trouver la cellule du jour dans le calendrier
  // On cherche une div qui contient le numéro du jour
  const dayCell = page.locator('.calendarGrid > div').filter({ hasText: new RegExp(`^${dayNumber}$`) }).first();
  
  // Vérifier que la cellule existe
  await expect(dayCell).toBeVisible();
  
  // Effectuer le drag and drop
  await ticket.dragTo(dayCell);
  
  // Attendre un peu pour que le state se mette à jour
  await page.waitForTimeout(1000);
  
  // Vérifier que le ticket est dans le calendrier
  const droppedTicket = dayCell.locator('h3:has-text("Test Vue Jour")');
  await expect(droppedTicket).toBeVisible();
  
  // Maintenant passer en vue jour
  await page.click('button:has-text("Jour")');
  
  // Attendre que la vue jour se charge
  await page.waitForSelector('.dayView', { timeout: 5000 });
  
  // Vérifier que le ticket est visible dans la vue jour
  const ticketInDayView = page.locator('.dayView').locator('h3:has-text("Test Vue Jour")');
  await expect(ticketInDayView).toBeVisible();
  
  // Prendre une capture d'écran pour vérifier
  await page.screenshot({ path: 'test-vue-jour-result.png', fullPage: true });
  
  console.log('Test réussi - Le ticket est visible dans la vue jour');
});