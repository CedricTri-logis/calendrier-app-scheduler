import { test, expect } from '@playwright/test';

test('Test manuel avec pause', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes
  
  // Essayer les différents ports
  const ports = [3000, 3001, 3002];
  let connected = false;
  
  for (const port of ports) {
    try {
      await page.goto(`http://localhost:${port}`, { timeout: 5000 });
      console.log(`Connecté sur le port ${port}`);
      connected = true;
      break;
    } catch (e) {
      console.log(`Port ${port} non disponible`);
    }
  }
  
  if (!connected) {
    throw new Error('Impossible de se connecter au serveur de développement');
  }
  
  // Attendre que la page se charge
  await page.waitForSelector('h1', { timeout: 10000 });
  
  // Créer un ticket manuellement
  await page.fill('input[placeholder="Titre du ticket..."]', 'Test Vue Jour');
  await page.locator('button[style*="background-color"]').first().click();
  await page.click('button:has-text("Ajouter le ticket")');
  
  // Attendre que le ticket apparaisse
  await page.waitForSelector('h3:has-text("Test Vue Jour")');
  
  // Obtenir la date actuelle
  const today = new Date();
  const dayNumber = today.getDate();
  
  console.log(`Essayer de glisser sur le jour ${dayNumber}`);
  
  // Essayer différentes approches pour le drag & drop
  const ticket = page.locator('[draggable="true"]').filter({ hasText: 'Test Vue Jour' });
  
  // Approche 1: dragTo simple
  try {
    const targetCell = page.locator(`[class*="dayCell"]:has([class*="dayNumber"]:text("${dayNumber}"))`).first();
    await ticket.dragTo(targetCell);
    console.log('dragTo réussi');
  } catch (e) {
    console.log('dragTo échoué:', e.message);
  }
  
  await page.waitForTimeout(2000);
  
  // Vérifier le localStorage
  const storage = await page.evaluate(() => {
    return localStorage.getItem('calendarDroppedTickets');
  });
  
  console.log('LocalStorage après drag:', storage);
  
  // Passer en vue jour
  await page.click('button:has-text("Jour")');
  await page.waitForTimeout(1000);
  
  // Vérifier ce qui est visible
  const dayViewContent = await page.evaluate(() => {
    const dayView = document.querySelector('[class*="dayView"]');
    if (dayView) {
      const h3s = Array.from(dayView.querySelectorAll('h3'));
      return h3s.map(h3 => h3.textContent);
    }
    return null;
  });
  
  console.log('Contenu de la vue jour:', dayViewContent);
  
  // Pause pour inspection manuelle
  console.log('PAUSE - Inspectez le navigateur manuellement');
  await page.pause();
});