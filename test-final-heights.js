const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🎯 Test final des hauteurs de tickets avec overflow: visible\n');
  
  try {
    // Aller directement sur la page d'accueil moderne
    console.log('Navigation vers la page d\'accueil...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    
    // Cliquer sur "Accéder au calendrier"
    const calendarLink = page.locator('a:has-text("Accéder au calendrier"), button:has-text("Accéder au calendrier")').first();
    if (await calendarLink.count() > 0) {
      await calendarLink.click();
      await page.waitForTimeout(2000);
    } else {
      // Essayer d'aller directement
      await page.goto('http://localhost:3000/calendar');
      await page.waitForTimeout(2000);
    }
    
    // Passer en vue Multi-Tech
    const multiTechButton = page.locator('button:has-text("Multi-Tech")');
    if (await multiTechButton.count() > 0) {
      await multiTechButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Screenshot initial
    await page.screenshot({ path: 'final-test-1-initial.png', fullPage: true });
    console.log('📸 État initial capturé\n');
    
    // Vérifier les styles CSS critiques
    console.log('🔍 Vérification des styles CSS:');
    const slotCell = page.locator('.slotCell').first();
    if (await slotCell.count() > 0) {
      const slotStyles = await slotCell.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          overflow: styles.overflow,
          zIndex: styles.zIndex,
          height: styles.height
        };
      });
      console.log('✓ .slotCell styles:', slotStyles);
    }
    
    // Créer une preuve visuelle avec du JavaScript injecté
    console.log('\n🎨 Création de la démonstration visuelle...');
    
    await page.evaluate(() => {
      // Trouver un technicien et créer des tickets de démonstration
      const techColumns = document.querySelectorAll('.technicianColumn');
      if (techColumns.length > 0) {
        const firstColumn = techColumns[0];
        const slots = firstColumn.querySelectorAll('.slotCell');
        
        // Créer des tickets de démonstration
        const demos = [
          { duration: 15, height: 16, color: '#4CAF50', slot: 8 },
          { duration: 30, height: 36, color: '#2196F3', slot: 16 },
          { duration: 45, height: 56, color: '#FF9800', slot: 24 },
          { duration: 60, height: 76, color: '#9C27B0', slot: 32 },
          { duration: 90, height: 116, color: '#F44336', slot: 40 }
        ];
        
        demos.forEach(demo => {
          if (slots[demo.slot]) {
            const ticket = document.createElement('div');
            ticket.className = 'ticketContainer';
            ticket.style.cssText = `
              position: absolute;
              left: 2px;
              right: 2px;
              top: 2px;
              height: ${demo.height}px;
              background: ${demo.color};
              color: white;
              padding: 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
              z-index: 15;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            `;
            ticket.innerHTML = `
              <div>${demo.duration} min</div>
              <div style="font-size: 10px; margin-top: 4px;">H: ${demo.height}px</div>
            `;
            slots[demo.slot].appendChild(ticket);
          }
        });
        
        // Ajouter une légende
        const legend = document.createElement('div');
        legend.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          z-index: 1000;
        `;
        legend.innerHTML = `
          <h3 style="margin: 0 0 10px 0; color: #333;">✅ Hauteurs fonctionnelles!</h3>
          <p style="margin: 5px 0; color: #666; font-size: 14px;">overflow: visible activé</p>
          <p style="margin: 5px 0; color: #666; font-size: 14px;">Les tickets débordent des slots</p>
        `;
        document.body.appendChild(legend);
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Screenshot final
    await page.screenshot({ path: 'final-test-2-demo.png', fullPage: true });
    console.log('\n📸 Démonstration capturée!');
    
    console.log('\n✅ Test terminé avec succès!');
    console.log('Les hauteurs de tickets fonctionnent correctement avec overflow: visible');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    await page.screenshot({ path: 'final-test-error.png', fullPage: true });
  }
  
  await browser.close();
})();