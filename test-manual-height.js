// Script manuel pour tester visuellement la hauteur des tickets
// Usage: node test-manual-height.js

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Navigation vers l\'application...');
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  // S'assurer qu'on est en vue Multi-Tech
  const multiTechButton = page.locator('button:has-text("Multi-Tech")');
  if (await multiTechButton.isVisible()) {
    await multiTechButton.click();
    await page.waitForTimeout(1000);
  }
  
  console.log('\n📸 Screenshot initial sauvegardé: manual-test-1-initial.png');
  await page.screenshot({ path: 'manual-test-1-initial.png', fullPage: true });
  
  // Instructions pour l'utilisateur
  console.log('\n📝 INSTRUCTIONS MANUELLES:');
  console.log('1. Créez plusieurs tickets avec les titres suivants:');
  console.log('   - "Test 15min"');
  console.log('   - "Test 30min"'); 
  console.log('   - "Test 45min"');
  console.log('   - "Test 60min"');
  console.log('   - "Test 90min"');
  console.log('2. Placez-les sur le calendrier à différentes heures');
  console.log('3. Pour chaque ticket, cliquez dessus et changez la durée estimée selon le nom');
  console.log('4. Appuyez sur ENTER quand vous avez terminé...\n');
  
  // Attendre que l'utilisateur appuie sur Enter
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });
  
  console.log('\n📸 Capture en cours...');
  await page.waitForTimeout(2000);
  
  // Prendre le screenshot final
  await page.screenshot({ path: 'manual-test-2-with-tickets.png', fullPage: true });
  console.log('Screenshot final sauvegardé: manual-test-2-with-tickets.png');
  
  // Mesurer les hauteurs
  console.log('\n📏 MESURE DES HAUTEURS:');
  const ticketContainers = await page.locator('.ticketContainer').all();
  
  for (const container of ticketContainers) {
    try {
      const text = await container.textContent();
      const box = await container.boundingBox();
      
      if (box) {
        console.log(`\nTicket "${text.trim()}":`);
        console.log(`  Hauteur: ${box.height}px`);
        
        // Vérifier les styles
        const styles = await container.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            height: computed.height,
            position: computed.position,
            zIndex: computed.zIndex,
            overflow: computed.overflow
          };
        });
        console.log(`  Styles: ${JSON.stringify(styles, null, 2)}`);
      }
    } catch (e) {
      // Ignorer les erreurs
    }
  }
  
  // Vérifier un slot
  const slot = page.locator('.slotCell').first();
  if (await slot.count() > 0) {
    const slotStyles = await slot.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        height: computed.height,
        overflow: computed.overflow,
        zIndex: computed.zIndex
      };
    });
    console.log('\n📋 STYLES D\'UN SLOT:');
    console.log(JSON.stringify(slotStyles, null, 2));
  }
  
  console.log('\n✅ Test terminé! Gardez le navigateur ouvert pour examiner.');
  console.log('Appuyez sur ENTER pour fermer...');
  
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });
  
  await browser.close();
})();