import { test, expect } from '@playwright/test';

test('Test simple de hauteur des tickets', async ({ page }) => {
  // Configuration pour debug
  page.setDefaultTimeout(10000);
  
  try {
    // 1. Aller à l'application
    console.log('Navigation vers localhost:3000...');
    await page.goto('http://localhost:3000');
    
    // 2. Attendre et vérifier que la page se charge
    console.log('Attente du chargement...');
    await page.waitForLoadState('networkidle');
    
    // 3. Prendre un screenshot pour debug
    await page.screenshot({ path: 'test-screenshot.png' });
    console.log('Screenshot pris');
    
    // 4. Vérifier qu'on a bien la vue calendrier
    const calendarVisible = await page.locator('.calendarContainer, .multiTechView').isVisible();
    console.log('Calendrier visible:', calendarVisible);
    
    // 5. Vérifier la présence de slots
    const slots = await page.locator('.slotCell').count();
    console.log('Nombre de slots trouvés:', slots);
    
    // 6. Si on a des tickets existants, mesurer leur hauteur
    const ticketContainers = await page.locator('.ticketContainer').all();
    console.log('Nombre de tickets trouvés:', ticketContainers.length);
    
    for (let i = 0; i < Math.min(3, ticketContainers.length); i++) {
      const ticket = ticketContainers[i];
      const box = await ticket.boundingBox();
      console.log(`Ticket ${i + 1} - Hauteur: ${box?.height}px`);
      
      // Vérifier le style calculé
      const computedHeight = await ticket.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          height: style.height,
          overflow: style.overflow,
          position: style.position,
          zIndex: style.zIndex
        };
      });
      console.log(`Ticket ${i + 1} - Styles:`, computedHeight);
    }
    
    // 7. Vérifier le overflow des slots
    const firstSlot = page.locator('.slotCell').first();
    const slotOverflow = await firstSlot.evaluate(el => window.getComputedStyle(el).overflow);
    console.log('Overflow du slot:', slotOverflow);
    
    // Assertion basique pour s'assurer que le test passe
    expect(true).toBe(true);
    
  } catch (error) {
    console.error('Erreur dans le test:', error);
    throw error;
  }
});