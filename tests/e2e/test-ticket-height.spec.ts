import { test, expect } from '@playwright/test';

test.describe('Hauteur des tickets selon la durée', () => {
  test.beforeEach(async ({ page }) => {
    // Naviguer vers l'application
    await page.goto('http://localhost:3000');
    
    // Attendre que la page se charge
    await page.waitForSelector('h1');
    
    // Passer en vue Multi-Tech si nécessaire
    const multiTechButton = page.locator('button:has-text("Multi-Tech")');
    if (await multiTechButton.isVisible()) {
      await multiTechButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('Les tickets doivent avoir une hauteur proportionnelle à leur durée', async ({ page }) => {
    // Configuration des tests avec différentes durées
    const testCases = [
      { title: 'Ticket 15min', duration: 15, expectedHeight: 16 }, // 1 slot * 20px - 4px
      { title: 'Ticket 30min', duration: 30, expectedHeight: 36 }, // 2 slots * 20px - 4px
      { title: 'Ticket 45min', duration: 45, expectedHeight: 56 }, // 3 slots * 20px - 4px
      { title: 'Ticket 60min', duration: 60, expectedHeight: 76 }, // 4 slots * 20px - 4px
      { title: 'Ticket 90min', duration: 90, expectedHeight: 116 }, // 6 slots * 20px - 4px
    ];

    // Créer et tester chaque ticket
    for (const testCase of testCases) {
      // Créer un nouveau ticket
      await page.fill('input[placeholder="Titre du ticket..."]', testCase.title);
      
      // Sélectionner le premier technicien
      const technicianSelect = page.locator('select').first();
      await technicianSelect.selectOption({ index: 1 });
      
      // Sélectionner une couleur
      await page.locator('button[style*="background-color"]').first().click();
      
      // Cliquer sur Ajouter
      await page.click('button:has-text("Ajouter le ticket")');
      
      // Attendre que le ticket apparaisse
      await page.waitForSelector(`text=${testCase.title}`);
      
      // Glisser le ticket sur le calendrier (à 10h00)
      const ticket = page.locator(`text=${testCase.title}`).first();
      const slot10h = page.locator('.slotCell').nth(12); // 3h après 7h = 10h, *4 slots/heure = 12
      
      await ticket.dragTo(slot10h);
      await page.waitForTimeout(500);
      
      // Cliquer sur le ticket pour ouvrir le modal
      const droppedTicket = page.locator(`text=${testCase.title}`).last();
      await droppedTicket.click();
      
      // Attendre que le modal s'ouvre
      await page.waitForSelector('h2:has-text("Détails du ticket")');
      
      // Changer la durée estimée
      const durationSelect = page.locator('select#ticketDuration');
      await durationSelect.selectOption(testCase.duration.toString());
      
      // Sauvegarder
      await page.click('button:has-text("Enregistrer")');
      
      // Attendre que le modal se ferme
      await page.waitForTimeout(500);
      
      // Mesurer la hauteur du ticket
      const ticketElement = page.locator('.ticketContainer').filter({ hasText: testCase.title }).first();
      const boundingBox = await ticketElement.boundingBox();
      
      // Vérifier la hauteur
      expect(boundingBox?.height).toBe(testCase.expectedHeight);
      
      console.log(`✓ ${testCase.title}: hauteur = ${boundingBox?.height}px (attendu: ${testCase.expectedHeight}px)`);
    }
  });

  test('Les tickets doivent pouvoir déborder de leur slot', async ({ page }) => {
    // Créer un ticket de 60 minutes
    await page.fill('input[placeholder="Titre du ticket..."]', 'Ticket Long 60min');
    
    // Sélectionner un technicien et une couleur
    const technicianSelect = page.locator('select').first();
    await technicianSelect.selectOption({ index: 1 });
    await page.locator('button[style*="background-color"]').first().click();
    
    // Ajouter le ticket
    await page.click('button:has-text("Ajouter le ticket")');
    await page.waitForSelector('text=Ticket Long 60min');
    
    // Glisser sur le calendrier
    const ticket = page.locator('text=Ticket Long 60min').first();
    const slot14h = page.locator('.slotCell').nth(28); // 7h après 7h = 14h, *4 = 28
    
    await ticket.dragTo(slot14h);
    await page.waitForTimeout(500);
    
    // Ouvrir le modal et définir la durée
    await page.locator('text=Ticket Long 60min').last().click();
    await page.waitForSelector('h2:has-text("Détails du ticket")');
    
    const durationSelect = page.locator('select#ticketDuration');
    await durationSelect.selectOption('60');
    await page.click('button:has-text("Enregistrer")');
    await page.waitForTimeout(500);
    
    // Vérifier que le ticket déborde visuellement
    const ticketContainer = page.locator('.ticketContainer').filter({ hasText: 'Ticket Long 60min' }).first();
    const slotCell = page.locator('.slotCell').nth(28);
    
    const ticketBox = await ticketContainer.boundingBox();
    const slotBox = await slotCell.boundingBox();
    
    // Le ticket doit être plus haut que son slot parent
    expect(ticketBox?.height).toBeGreaterThan(20); // Plus grand qu'un slot
    expect(ticketBox?.height).toBe(76); // 4 slots * 20px - 4px
    
    console.log(`✓ Ticket déborde: hauteur ticket = ${ticketBox?.height}px, hauteur slot = ${slotBox?.height}px`);
  });

  test('Le changement de durée doit mettre à jour la hauteur immédiatement', async ({ page }) => {
    // Créer un ticket
    await page.fill('input[placeholder="Titre du ticket..."]', 'Ticket Dynamique');
    
    const technicianSelect = page.locator('select').first();
    await technicianSelect.selectOption({ index: 1 });
    await page.locator('button[style*="background-color"]').first().click();
    
    await page.click('button:has-text("Ajouter le ticket")');
    await page.waitForSelector('text=Ticket Dynamique');
    
    // Placer sur le calendrier
    const ticket = page.locator('text=Ticket Dynamique').first();
    const slot = page.locator('.slotCell').nth(16); // 11h
    await ticket.dragTo(slot);
    await page.waitForTimeout(500);
    
    // Mesurer la hauteur initiale (30 min par défaut)
    let ticketElement = page.locator('.ticketContainer').filter({ hasText: 'Ticket Dynamique' }).first();
    let boundingBox = await ticketElement.boundingBox();
    const initialHeight = boundingBox?.height;
    
    expect(initialHeight).toBe(36); // 30 min = 2 slots * 20px - 4px
    
    // Changer la durée à 90 minutes
    await ticketElement.click();
    await page.waitForSelector('h2:has-text("Détails du ticket")');
    
    const durationSelect = page.locator('select#ticketDuration');
    await durationSelect.selectOption('90');
    await page.click('button:has-text("Enregistrer")');
    await page.waitForTimeout(500);
    
    // Mesurer la nouvelle hauteur
    ticketElement = page.locator('.ticketContainer').filter({ hasText: 'Ticket Dynamique' }).first();
    boundingBox = await ticketElement.boundingBox();
    const newHeight = boundingBox?.height;
    
    expect(newHeight).toBe(116); // 90 min = 6 slots * 20px - 4px
    
    console.log(`✓ Hauteur mise à jour: ${initialHeight}px → ${newHeight}px`);
  });

  test('Les tickets doivent avoir le bon z-index', async ({ page }) => {
    // Créer un ticket et le placer
    await page.fill('input[placeholder="Titre du ticket..."]', 'Test Z-Index');
    
    const technicianSelect = page.locator('select').first();
    await technicianSelect.selectOption({ index: 1 });
    await page.locator('button[style*="background-color"]').first().click();
    
    await page.click('button:has-text("Ajouter le ticket")');
    await page.waitForSelector('text=Test Z-Index');
    
    const ticket = page.locator('text=Test Z-Index').first();
    const slot = page.locator('.slotCell').nth(20);
    await ticket.dragTo(slot);
    await page.waitForTimeout(500);
    
    // Vérifier le z-index
    const ticketContainer = page.locator('.ticketContainer').filter({ hasText: 'Test Z-Index' }).first();
    const zIndex = await ticketContainer.evaluate(el => 
      window.getComputedStyle(el).zIndex
    );
    
    expect(zIndex).toBe('15');
    console.log(`✓ Z-index correct: ${zIndex}`);
  });
});