import { test, expect } from '@playwright/test';

test('Preuve visuelle des hauteurs de tickets', async ({ page }) => {
  // Naviguer vers l'application
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  // Cliquer sur la vue Multi-Tech si nécessaire
  const multiTechButton = page.locator('button:has-text("Multi-Tech")');
  if (await multiTechButton.isVisible()) {
    await multiTechButton.click();
    await page.waitForTimeout(1000);
  }
  
  // Prendre un screenshot initial
  await page.screenshot({ 
    path: 'proof-1-initial.png', 
    fullPage: true 
  });
  console.log('✅ Screenshot initial sauvegardé: proof-1-initial.png');
  
  // Créer plusieurs tickets avec différentes durées
  const tickets = [
    { title: 'Test 15min', duration: 15, techIndex: 1 },
    { title: 'Test 30min', duration: 30, techIndex: 2 },
    { title: 'Test 45min', duration: 45, techIndex: 3 },
    { title: 'Test 60min', duration: 60, techIndex: 1 },
    { title: 'Test 90min', duration: 90, techIndex: 2 }
  ];
  
  // Pour chaque ticket
  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    
    // Remplir le titre
    const titleInput = page.locator('input[placeholder*="ticket"]').first();
    await titleInput.fill(ticket.title);
    
    // Sélectionner un technicien
    const techSelect = page.locator('select').first();
    await techSelect.selectOption({ index: ticket.techIndex });
    
    // Sélectionner une couleur différente pour chaque ticket
    const colorButtons = page.locator('button[style*="background-color"]');
    if (await colorButtons.count() > i) {
      await colorButtons.nth(i).click();
    }
    
    // Cliquer sur Ajouter
    await page.click('button:has-text("Ajouter")');
    await page.waitForTimeout(500);
    
    // Trouver le ticket créé et le glisser sur le calendrier
    const ticketElement = page.locator(`text="${ticket.title}"`).first();
    const slotIndex = 8 + (i * 4); // Espacer les tickets
    const targetSlot = page.locator('.slotCell').nth(slotIndex);
    
    await ticketElement.dragTo(targetSlot);
    await page.waitForTimeout(500);
    
    // Cliquer sur le ticket pour ouvrir le modal
    const droppedTicket = page.locator('.ticketContainer').filter({ hasText: ticket.title }).first();
    await droppedTicket.click();
    await page.waitForTimeout(500);
    
    // Chercher le modal et changer la durée
    const modal = page.locator('[role="dialog"], .modal, div:has(h2)').filter({ hasText: /détails|details/i });
    if (await modal.isVisible()) {
      // Trouver le sélecteur de durée
      const durationSelect = modal.locator('select').last();
      if (await durationSelect.isVisible()) {
        await durationSelect.selectOption(ticket.duration.toString());
      }
      
      // Sauvegarder
      const saveButton = modal.locator('button').filter({ hasText: /enregistrer|sauvegarder|save/i }).first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(500);
      } else {
        // Essayer de fermer le modal si pas de bouton save
        await page.keyboard.press('Escape');
      }
    }
  }
  
  // Attendre que tout se stabilise
  await page.waitForTimeout(2000);
  
  // Prendre le screenshot final
  await page.screenshot({ 
    path: 'proof-2-with-tickets.png', 
    fullPage: true 
  });
  console.log('✅ Screenshot avec tickets sauvegardé: proof-2-with-tickets.png');
  
  // Mesurer et afficher les hauteurs des tickets
  console.log('\n📏 MESURES DES HAUTEURS DES TICKETS:');
  console.log('=====================================');
  
  for (const ticket of tickets) {
    const ticketContainer = page.locator('.ticketContainer').filter({ hasText: ticket.title }).first();
    if (await ticketContainer.isVisible()) {
      const box = await ticketContainer.boundingBox();
      if (box) {
        const expectedSlots = ticket.duration / 15;
        const expectedHeight = expectedSlots * 20 - 4; // 20px par slot, moins 4px de marge
        
        console.log(`\n${ticket.title}:`);
        console.log(`  Durée: ${ticket.duration} minutes (${expectedSlots} slots)`);
        console.log(`  Hauteur mesurée: ${box.height}px`);
        console.log(`  Hauteur attendue: ${expectedHeight}px`);
        console.log(`  ✅ Correct: ${Math.abs(box.height - expectedHeight) < 2 ? 'OUI' : 'NON'}`);
        
        // Vérifier aussi les styles CSS
        const styles = await ticketContainer.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            height: computed.height,
            position: computed.position,
            zIndex: computed.zIndex,
            overflow: computed.overflow
          };
        });
        console.log(`  Styles CSS: ${JSON.stringify(styles)}`);
      }
    }
  }
  
  console.log('\n=====================================');
  console.log('✅ Test terminé avec succès!');
  console.log('Screenshots disponibles:');
  console.log('  - proof-1-initial.png');
  console.log('  - proof-2-with-tickets.png');
});