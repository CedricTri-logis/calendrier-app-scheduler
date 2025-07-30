const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🚀 Test des hauteurs avec CSS Grid...');
  
  // Navigation
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  // Passer en vue Multi-Tech
  const multiTechButton = page.locator('button:has-text("Multi-Tech")');
  if (await multiTechButton.isVisible()) {
    await multiTechButton.click();
    await page.waitForTimeout(1000);
  }
  
  // Screenshot initial
  await page.screenshot({ path: 'grid-test-1-initial.png', fullPage: true });
  console.log('📸 Screenshot initial capturé');
  
  // Créer des tickets de test
  const testTickets = [
    { title: 'Grid 15min', duration: 15 },
    { title: 'Grid 30min', duration: 30 },
    { title: 'Grid 45min', duration: 45 },
    { title: 'Grid 60min', duration: 60 },
    { title: 'Grid 90min', duration: 90 }
  ];
  
  console.log('\n📝 Création des tickets de test...');
  
  for (let i = 0; i < testTickets.length; i++) {
    const ticket = testTickets[i];
    
    // Remplir le titre
    await page.fill('input[placeholder*="ticket"]', ticket.title);
    
    // Sélectionner un technicien
    const techSelect = page.locator('select').first();
    const options = await techSelect.locator('option').all();
    if (options.length > 1) {
      await techSelect.selectOption({ index: (i % 3) + 1 }); // Alterner entre techniciens
    }
    
    // Sélectionner une couleur
    const colorButtons = await page.locator('button[style*="background-color"]').all();
    if (colorButtons.length > i) {
      await colorButtons[i].click();
    }
    
    // Ajouter le ticket
    await page.click('button:has-text("Ajouter")');
    await page.waitForTimeout(500);
    
    console.log(`✅ Ticket "${ticket.title}" créé`);
  }
  
  // Placer les tickets sur le calendrier
  console.log('\n🎯 Placement des tickets sur le calendrier...');
  
  for (let i = 0; i < testTickets.length; i++) {
    const ticket = testTickets[i];
    
    // Trouver le ticket dans la liste
    const ticketElement = page.locator(`text="${ticket.title}"`).first();
    
    // Trouver un slot cible (espacement vertical)
    const slotIndex = 8 + (i * 6); // Commencer à 9h, espacer de 1h30
    const targetSlot = page.locator('.slotCell').nth(slotIndex);
    
    try {
      await ticketElement.dragTo(targetSlot);
      await page.waitForTimeout(500);
      
      // Ouvrir le modal et changer la durée
      const droppedTicket = page.locator('.ticketContainer').filter({ hasText: ticket.title }).first();
      await droppedTicket.click();
      await page.waitForTimeout(300);
      
      // Chercher le sélecteur de durée dans le modal
      const durationSelect = page.locator('select').last();
      if (await durationSelect.isVisible()) {
        await durationSelect.selectOption(ticket.duration.toString());
        
        // Sauvegarder
        const saveButton = page.locator('button').filter({ hasText: /enregistrer|sauvegarder|save/i }).first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
        }
      }
      
      // Fermer le modal si toujours ouvert
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      
      console.log(`✅ "${ticket.title}" placé et configuré`);
    } catch (e) {
      console.log(`⚠️  Erreur avec "${ticket.title}": ${e.message}`);
    }
  }
  
  await page.waitForTimeout(2000);
  
  // Screenshot final
  await page.screenshot({ path: 'grid-test-2-with-tickets.png', fullPage: true });
  console.log('\n📸 Screenshot final capturé');
  
  // Mesurer les hauteurs
  console.log('\n📏 MESURE DES HAUTEURS:');
  console.log('================================');
  
  const ticketContainers = await page.locator('.ticketContainer').all();
  
  for (const container of ticketContainers) {
    try {
      const titleElement = await container.locator('.ticketTitle').first();
      const title = await titleElement.textContent();
      const box = await container.boundingBox();
      
      if (box && title) {
        // Extraire la durée du titre
        const durationMatch = title.match(/(\d+)min/);
        if (durationMatch) {
          const duration = parseInt(durationMatch[1]);
          const expectedSlots = duration / 15;
          const expectedHeight = expectedSlots * 20;
          
          console.log(`\n${title.trim()}:`);
          console.log(`  Hauteur mesurée: ${box.height}px`);
          console.log(`  Hauteur attendue: ~${expectedHeight}px`);
          console.log(`  Différence: ${Math.abs(box.height - expectedHeight)}px`);
          
          // Vérifier si la hauteur est correcte (tolérance de 5px)
          const isCorrect = Math.abs(box.height - expectedHeight) <= 5;
          console.log(`  Status: ${isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
        }
      }
    } catch (e) {
      // Ignorer les erreurs
    }
  }
  
  console.log('\n================================');
  console.log('\n✅ Test terminé!');
  console.log('Screenshots disponibles:');
  console.log('  - grid-test-1-initial.png');
  console.log('  - grid-test-2-with-tickets.png');
  
  await browser.close();
})();