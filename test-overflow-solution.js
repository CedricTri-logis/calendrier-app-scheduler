const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Test de la solution overflow: visible...');
  
  try {
    // Navigation vers calendrier
    await page.goto('http://localhost:3000/calendar');
    await page.waitForTimeout(2000);
    
    // Passer en vue Multi-Tech
    const multiTechButton = page.locator('button:has-text("Multi-Tech")');
    if (await multiTechButton.count() > 0) {
      await multiTechButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Screenshot initial
    await page.screenshot({ path: 'overflow-test-1-initial.png', fullPage: true });
    console.log('📸 Screenshot initial capturé');
    
    // Créer un ticket de test
    console.log('\n📝 Création d\'un ticket de test...');
    
    // Remplir le formulaire
    const titleInput = page.locator('input[placeholder*="ticket" i], input[placeholder*="titre" i]').first();
    await titleInput.fill('Test Overflow 90min');
    
    // Sélectionner un technicien
    const techSelect = page.locator('select').first();
    const options = await techSelect.locator('option').count();
    if (options > 1) {
      await techSelect.selectOption({ index: 1 });
    }
    
    // Cliquer sur le bouton ajouter
    const addButton = page.locator('button').filter({ hasText: /ajouter/i }).first();
    await addButton.click();
    await page.waitForTimeout(500);
    
    // Drag le ticket sur le calendrier
    const ticket = page.locator('text="Test Overflow 90min"').first();
    const targetSlot = page.locator('.slotCell').nth(20); // 10h
    
    await ticket.dragTo(targetSlot);
    await page.waitForTimeout(1000);
    
    // Ouvrir le modal et changer la durée
    const droppedTicket = page.locator('.ticketContainer').filter({ hasText: 'Test Overflow 90min' }).first();
    await droppedTicket.click();
    await page.waitForTimeout(500);
    
    // Changer la durée à 90 minutes
    const durationSelect = page.locator('select').filter({ has: page.locator('option[value="90"]') }).first();
    if (await durationSelect.count() > 0) {
      await durationSelect.selectOption('90');
      
      // Sauvegarder
      const saveButton = page.locator('button').filter({ hasText: /enregistrer|sauvegarder/i }).first();
      if (await saveButton.count() > 0) {
        await saveButton.click();
      }
    }
    
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    // Screenshot final
    await page.screenshot({ path: 'overflow-test-2-with-ticket.png', fullPage: true });
    console.log('\n📸 Screenshot final capturé');
    
    // Mesurer la hauteur
    const ticketBox = await droppedTicket.boundingBox();
    if (ticketBox) {
      console.log('\n📏 MESURE DU TICKET:');
      console.log(`Hauteur mesurée: ${ticketBox.height}px`);
      console.log(`Hauteur attendue pour 90min: ~116px (6 slots × 20px - 4px)`);
      
      const isCorrect = Math.abs(ticketBox.height - 116) < 5;
      console.log(`Status: ${isCorrect ? '✅ CORRECT!' : '❌ Incorrect'}`);
    }
    
    // Vérifier les styles CSS
    const slotStyles = await page.locator('.slotCell').first().evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        overflow: styles.overflow,
        zIndex: styles.zIndex
      };
    });
    
    console.log('\n📊 Styles CSS des slots:');
    console.log(`overflow: ${slotStyles.overflow}`);
    console.log(`z-index: ${slotStyles.zIndex}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await page.screenshot({ path: 'overflow-test-error.png', fullPage: true });
  }
  
  console.log('\n✅ Test terminé');
  console.log('Regardez les screenshots pour voir le résultat visuel');
  
  await browser.close();
})();