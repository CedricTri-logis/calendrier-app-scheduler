const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capturer les erreurs de console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('❌ Console Error:', msg.text());
    }
  });
  
  page.on('pageerror', error => {
    console.error('❌ Page Error:', error.message);
  });
  
  console.log('🔍 Vérification des erreurs...\n');
  
  try {
    console.log('Navigation vers localhost:3000...');
    const response = await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    
    console.log(`Status: ${response.status()}`);
    console.log(`URL: ${response.url()}`);
    
    // Attendre un peu pour capturer les erreurs
    await page.waitForTimeout(3000);
    
    // Vérifier le contenu HTML
    const html = await page.content();
    console.log(`\nHTML length: ${html.length} caractères`);
    console.log('HTML preview:', html.substring(0, 200));
    
    // Vérifier s'il y a du contenu visible
    const bodyText = await page.locator('body').textContent();
    console.log(`\nBody text: "${bodyText.trim()}"`);
    
  } catch (error) {
    console.error('\n❌ Erreur de navigation:', error.message);
  }
  
  await browser.close();
})();