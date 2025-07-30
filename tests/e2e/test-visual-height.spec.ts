import { test, expect } from '@playwright/test';

test('Capture visuelle de la hauteur des tickets', async ({ page }) => {
  // Aller à l'application
  await page.goto('http://localhost:3000');
  
  // Attendre le chargement complet
  await page.waitForLoadState('networkidle');
  
  // Passer en vue Multi-Tech
  const multiTechButton = page.locator('button').filter({ hasText: 'Multi-Tech' });
  if (await multiTechButton.count() > 0) {
    await multiTechButton.click();
    await page.waitForTimeout(1000);
  }
  
  // Prendre un screenshot initial
  await page.screenshot({ 
    path: 'screenshot-height-test-initial.png',
    fullPage: true 
  });
  
  // Créer plusieurs tickets avec différentes durées
  const tickets = [
    { title: 'Ticket 15 minutes', duration: 15 },
    { title: 'Ticket 30 minutes', duration: 30 },
    { title: 'Ticket 45 minutes', duration: 45 },
    { title: 'Ticket 60 minutes', duration: 60 },
    { title: 'Ticket 90 minutes', duration: 90 }
  ];
  
  // Créer et placer chaque ticket
  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    
    // Créer le ticket
    await page.fill('input[placeholder="Titre du ticket..."]', ticket.title);
    
    // Sélectionner un technicien si possible
    const techSelect = page.locator('select').first();
    if (await techSelect.count() > 0) {
      const options = await techSelect.locator('option').all();
      if (options.length > 1) {
        await techSelect.selectOption({ index: 1 });
      }
    }
    
    // Sélectionner une couleur
    const colorButton = page.locator('button[style*="background-color"]').nth(i % 5);
    if (await colorButton.count() > 0) {
      await colorButton.click();
    }
    
    // Ajouter le ticket
    await page.click('button:has-text("Ajouter")');
    await page.waitForTimeout(500);
    
    // Glisser le ticket sur le calendrier
    const ticketElement = page.locator(`text="${ticket.title}"`).first();
    const slotTarget = page.locator('.slotCell').nth(8 + i * 8); // Espacer les tickets
    
    if (await ticketElement.count() > 0 && await slotTarget.count() > 0) {
      await ticketElement.dragTo(slotTarget);
      await page.waitForTimeout(500);
      
      // Ouvrir le modal et changer la durée
      const droppedTicket = page.locator(`text="${ticket.title}"`).last();
      await droppedTicket.click();
      
      // Attendre le modal
      const modal = page.locator('[role="dialog"], .modal, div:has(> h2:text("Détails"))');
      if (await modal.count() > 0) {
        // Changer la durée
        const durationSelect = page.locator('select').filter({ has: page.locator('option[value="15"]') }).first();
        if (await durationSelect.count() > 0) {
          await durationSelect.selectOption(ticket.duration.toString());
        }
        
        // Sauvegarder
        const saveButton = page.locator('button').filter({ hasText: /enregistrer|sauvegarder|save/i }).first();
        if (await saveButton.count() > 0) {
          await saveButton.click();
          await page.waitForTimeout(500);
        }
      }
    }
  }
  
  // Attendre un peu pour que tout se stabilise
  await page.waitForTimeout(2000);
  
  // Prendre le screenshot final avec tous les tickets
  await page.screenshot({ 
    path: 'screenshot-height-test-final.png',
    fullPage: true 
  });
  
  // Mesurer et logger les hauteurs réelles
  const ticketContainers = await page.locator('.ticketContainer').all();
  console.log(`\n=== MESURE DES HAUTEURS DES TICKETS ===`);
  
  for (const container of ticketContainers) {
    const titleText = await container.locator('.ticketTitle').textContent() || 'Sans titre';
    const boundingBox = await container.boundingBox();
    
    if (boundingBox) {
      console.log(`${titleText}: ${boundingBox.height}px de hauteur`);
      
      // Vérifier aussi les styles CSS
      const styles = await container.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          height: computed.height,
          overflow: computed.overflow,
          position: computed.position,
          zIndex: computed.zIndex
        };
      });
      console.log(`  Styles: height=${styles.height}, overflow=${styles.overflow}, position=${styles.position}, z-index=${styles.zIndex}`);
    }
  }
  
  // Vérifier le overflow des slots
  const firstSlot = page.locator('.slotCell').first();
  if (await firstSlot.count() > 0) {
    const slotOverflow = await firstSlot.evaluate(el => window.getComputedStyle(el).overflow);
    console.log(`\nOverflow des slots: ${slotOverflow}`);
  }
  
  console.log('\n✅ Screenshots sauvegardés:');
  console.log('- screenshot-height-test-initial.png');
  console.log('- screenshot-height-test-final.png');
});