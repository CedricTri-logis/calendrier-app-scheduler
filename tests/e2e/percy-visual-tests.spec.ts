import { test } from '@playwright/test'
import percySnapshot from '@percy/playwright'

test.describe('Tests Visuels Percy - Calendrier App', () => {
  test.beforeEach(async ({ page }) => {
    // Aller à la page principale
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
  })

  test('Vue Calendrier - Mois', async ({ page }) => {
    await percySnapshot(page, 'Calendrier - Vue Mois')
  })

  test('Vue Calendrier - Semaine', async ({ page }) => {
    await page.click('button:has-text("Semaine")')
    await page.waitForTimeout(500)
    await percySnapshot(page, 'Calendrier - Vue Semaine')
  })

  test('Vue Calendrier - Jour', async ({ page }) => {
    await page.click('button:has-text("Jour")')
    await page.waitForTimeout(500)
    await percySnapshot(page, 'Calendrier - Vue Jour')
  })

  test('Vue Multi-Tech - Complète', async ({ page }) => {
    await page.click('button:has-text("Multi-Tech")')
    await page.waitForTimeout(1000)
    await percySnapshot(page, 'Multi-Tech - Vue Complète')
  })

  test('Vue Multi-Tech - Zone critique 14h-17h', async ({ page }) => {
    await page.click('button:has-text("Multi-Tech")')
    await page.waitForTimeout(1000)
    
    // Scroll pour centrer sur 14h
    await page.evaluate(() => {
      const labels = document.querySelectorAll('.timeLabel')
      const targetLabel = Array.from(labels).find(label => label.textContent?.trim() === '14:00')
      if (targetLabel) {
        targetLabel.scrollIntoView({ behavior: 'instant', block: 'center' })
      }
    })
    
    await page.waitForTimeout(300)
    await percySnapshot(page, 'Multi-Tech - Zone 14h-17h avec fond')
  })

  test('Vue Multi-Tech - Vérification bordures verticales', async ({ page }) => {
    await page.click('button:has-text("Multi-Tech")')
    await page.waitForTimeout(1000)
    
    // Scroll jusqu'en bas pour voir si les bordures continuent
    await page.evaluate(() => {
      const mainGrid = document.querySelector('[class*="mainGrid"]')
      if (mainGrid) {
        mainGrid.scrollTop = mainGrid.scrollHeight
      }
    })
    
    await page.waitForTimeout(300)
    await percySnapshot(page, 'Multi-Tech - Bordures verticales bas de page')
  })

  test('Tickets - Non planifiés', async ({ page }) => {
    // Capturer la sidebar avec les tickets
    await percySnapshot(page, 'Sidebar - Tickets non planifiés', {
      scope: '[class*="sidebar"]'
    })
  })

  test('Tickets - Avec équipe multi-techniciens', async ({ page }) => {
    // Si vous avez des tickets avec plusieurs techniciens, capturez-les
    await page.click('button:has-text("Multi-Tech")')
    await page.waitForTimeout(1000)
    
    // Chercher un ticket avec plusieurs badges de techniciens
    const multiTechTicket = await page.locator('[class*="ticket"]').first()
    if (await multiTechTicket.isVisible()) {
      await percySnapshot(page, 'Ticket - Affichage multi-techniciens', {
        scope: '[class*="technicianColumns"]'
      })
    }
  })

  test('Modal - Ajout de technicien', async ({ page }) => {
    // Créer un nouveau ticket pour tester
    await page.fill('input[placeholder*="Nouveau ticket"]', 'Test Percy')
    await page.click('button:has-text("Ajouter le ticket")')
    await page.waitForTimeout(500)
    
    // Glisser le ticket sur le calendrier
    const ticket = await page.locator('[class*="ticket"]:has-text("Test Percy")').first()
    const targetDay = await page.locator('[class*="dayCell"]').nth(15) // Milieu du mois
    
    if (await ticket.isVisible() && await targetDay.isVisible()) {
      await ticket.dragTo(targetDay)
      await page.waitForTimeout(500)
      
      // Cliquer sur le bouton + pour ouvrir le modal
      const addButton = await page.locator('[class*="ticket"]:has-text("Test Percy") button[title*="Ajouter"]').first()
      if (await addButton.isVisible()) {
        await addButton.click()
        await page.waitForTimeout(300)
        await percySnapshot(page, 'Modal - Ajout technicien')
      }
    }
  })

  test('États de disponibilité', async ({ page }) => {
    // Aller sur la page de gestion des horaires
    await page.click('a:has-text("Gérer les horaires")')
    await page.waitForLoadState('networkidle')
    await percySnapshot(page, 'Gestion Horaires - Vue complète')
  })
})