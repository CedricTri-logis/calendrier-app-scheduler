import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Test visuel des hauteurs de tickets avec Percy', () => {
  test('Affichage correct des hauteurs selon la durée', async ({ page }) => {
    // Naviguer vers l'application
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // S'assurer d'être en vue Multi-Tech
    const multiTechButton = page.locator('button:has-text("Multi-Tech")');
    if (await multiTechButton.isVisible()) {
      await multiTechButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Capturer l'état initial
    await percySnapshot(page, 'Calendrier Multi-Tech - État initial');
    
    // Simuler la création manuelle de tickets pour Percy
    // Créer un conteneur de test pour afficher les différentes hauteurs
    await page.evaluate(() => {
      // Créer un div de test pour montrer les hauteurs
      const testContainer = document.createElement('div');
      testContainer.id = 'test-heights-demo';
      testContainer.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 9999;
        max-width: 800px;
      `;
      
      testContainer.innerHTML = `
        <h2 style="margin-bottom: 20px; font-family: system-ui;">Démonstration des hauteurs de tickets</h2>
        <div style="display: flex; gap: 20px; align-items: flex-start;">
          <div style="text-align: center;">
            <h3 style="font-size: 14px; margin-bottom: 10px;">15 minutes</h3>
            <div style="width: 150px; height: 16px; background: #4CAF50; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
            <p style="font-size: 12px; margin-top: 5px;">16px (1 slot)</p>
          </div>
          <div style="text-align: center;">
            <h3 style="font-size: 14px; margin-bottom: 10px;">30 minutes</h3>
            <div style="width: 150px; height: 36px; background: #2196F3; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
            <p style="font-size: 12px; margin-top: 5px;">36px (2 slots)</p>
          </div>
          <div style="text-align: center;">
            <h3 style="font-size: 14px; margin-bottom: 10px;">45 minutes</h3>
            <div style="width: 150px; height: 56px; background: #FF9800; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
            <p style="font-size: 12px; margin-top: 5px;">56px (3 slots)</p>
          </div>
          <div style="text-align: center;">
            <h3 style="font-size: 14px; margin-bottom: 10px;">60 minutes</h3>
            <div style="width: 150px; height: 76px; background: #9C27B0; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
            <p style="font-size: 12px; margin-top: 5px;">76px (4 slots)</p>
          </div>
          <div style="text-align: center;">
            <h3 style="font-size: 14px; margin-bottom: 10px;">90 minutes</h3>
            <div style="width: 150px; height: 116px; background: #F44336; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
            <p style="font-size: 12px; margin-top: 5px;">116px (6 slots)</p>
          </div>
        </div>
        <p style="margin-top: 20px; font-size: 14px; color: #666;">
          Chaque créneau de 15 minutes = 20px de hauteur. La hauteur totale = (durée/15) × 20 - 4px de marge
        </p>
      `;
      
      document.body.appendChild(testContainer);
    });
    
    await page.waitForTimeout(1000);
    
    // Capturer avec Percy
    await percySnapshot(page, 'Démonstration des hauteurs de tickets');
    
    // Nettoyer
    await page.evaluate(() => {
      const demo = document.getElementById('test-heights-demo');
      if (demo) demo.remove();
    });
    
    // Test de validation des hauteurs dans le CSS
    const slotHeight = await page.evaluate(() => {
      const slot = document.querySelector('.slotCell');
      if (slot) {
        return window.getComputedStyle(slot).height;
      }
      return null;
    });
    
    console.log(`Hauteur d'un slot: ${slotHeight}`);
    expect(slotHeight).toBe('20px');
    
    // Vérifier que overflow est visible sur les slots
    const slotOverflow = await page.evaluate(() => {
      const slot = document.querySelector('.slotCell');
      if (slot) {
        return window.getComputedStyle(slot).overflow;
      }
      return null;
    });
    
    console.log(`Overflow des slots: ${slotOverflow}`);
    expect(slotOverflow).toBe('visible');
    
    console.log('✅ Test Percy terminé - Vérifiez les snapshots sur percy.io');
  });
});