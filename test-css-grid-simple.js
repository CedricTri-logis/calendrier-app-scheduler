const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Test simple de CSS Grid...');
  
  try {
    // Navigation
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);
    
    // Aller sur la page calendrier
    await page.goto('http://localhost:3000/calendar');
    await page.waitForTimeout(2000);
    
    // Cliquer sur Multi-Tech
    const multiTechButton = page.locator('button:has-text("Multi-Tech")');
    if (await multiTechButton.count() > 0) {
      await multiTechButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Analyser la structure CSS
    console.log('\n📊 Analyse de la structure CSS:');
    
    // Vérifier si technicianColumn utilise grid
    const techColumn = page.locator('.technicianColumn').first();
    if (await techColumn.count() > 0) {
      const display = await techColumn.evaluate(el => window.getComputedStyle(el).display);
      console.log(`✓ .technicianColumn display: ${display}`);
      
      if (display === 'grid') {
        const gridTemplate = await techColumn.evaluate(el => window.getComputedStyle(el).gridTemplateRows);
        console.log(`✓ Grid template rows: ${gridTemplate}`);
      }
    }
    
    // Vérifier les slots
    const slotCell = page.locator('.slotCell').first();
    if (await slotCell.count() > 0) {
      const slotStyles = await slotCell.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          height: styles.height,
          gridRow: styles.gridRow,
          display: styles.display
        };
      });
      console.log(`✓ .slotCell styles:`, slotStyles);
    }
    
    // Vérifier s'il y a des tickets
    const tickets = await page.locator('.ticketContainer').count();
    console.log(`\n📦 Nombre de tickets trouvés: ${tickets}`);
    
    if (tickets > 0) {
      const firstTicket = page.locator('.ticketContainer').first();
      const ticketStyles = await firstTicket.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          gridRowStart: styles.gridRowStart,
          gridRowEnd: styles.gridRowEnd,
          height: styles.height,
          position: styles.position
        };
      });
      console.log(`✓ Premier ticket styles:`, ticketStyles);
    }
    
    // Screenshot
    await page.screenshot({ path: 'css-grid-analysis.png', fullPage: true });
    console.log('\n📸 Screenshot sauvegardé: css-grid-analysis.png');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await page.screenshot({ path: 'css-grid-error.png', fullPage: true });
  }
  
  console.log('\n✅ Analyse terminée');
  await browser.close();
})();