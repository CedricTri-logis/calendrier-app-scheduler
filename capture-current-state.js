const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('📸 Capture de l\'état actuel...');
  
  // Aller directement à l'accueil
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(3000);
  
  // Screenshot de l'accueil
  await page.screenshot({ path: 'state-1-home.png', fullPage: true });
  console.log('✓ Screenshot accueil');
  
  // Essayer d'aller sur calendar
  try {
    await page.goto('http://localhost:3000/calendar');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'state-2-calendar.png', fullPage: true });
    console.log('✓ Screenshot calendrier');
    
    // Chercher le bouton Multi-Tech
    const buttons = await page.locator('button').all();
    console.log(`\nNombre de boutons trouvés: ${buttons.length}`);
    
    for (const button of buttons) {
      const text = await button.textContent();
      console.log(`- Bouton: "${text}"`);
    }
    
  } catch (error) {
    console.error('Erreur:', error.message);
  }
  
  await browser.close();
})();