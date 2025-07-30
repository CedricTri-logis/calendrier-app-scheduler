import { test, expect } from '@playwright/test'

test.describe('Système de Toast', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/test-toast')
  })

  test('La page de test se charge correctement', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Test du système de Toast')
    // Il devrait y avoir 5 boutons principaux (peut y avoir des boutons de fermeture en plus)
    const mainButtons = await page.locator('button').filter({ hasText: /Toast|Tester/ }).count()
    expect(mainButtons).toBe(5)
  })

  test('Toast Success s\'affiche correctement', async ({ page }) => {
    await page.click('button:has-text("Toast Success")')
    
    // Vérifier que le toast apparaît (utiliser un sélecteur plus flexible pour CSS modules)
    const toast = page.locator('[class*="toast"]').filter({ hasText: 'Action réussie' })
    await expect(toast).toBeVisible()
    
    // Vérifier la couleur de succès (couleur de fond du success toast)
    await expect(toast).toHaveCSS('background-color', 'rgb(241, 248, 241)')
    
    // Vérifier que le toast disparaît après quelques secondes
    await expect(toast).toBeHidden({ timeout: 6000 })
  })

  test('Toast Error s\'affiche correctement', async ({ page }) => {
    await page.click('button:has-text("Toast Error")')
    
    const toast = page.locator('[class*="toast"]').filter({ hasText: 'Erreur lors de la sauvegarde' })
    await expect(toast).toBeVisible()
    await expect(toast).toHaveCSS('background-color', 'rgb(254, 241, 241)')
  })

  test('Toast Warning s\'affiche correctement', async ({ page }) => {
    await page.click('button:has-text("Toast Warning")')
    
    const toast = page.locator('[class*="toast"]').filter({ hasText: 'Ce technicien' })
    await expect(toast).toBeVisible()
    await expect(toast).toHaveCSS('background-color', 'rgb(255, 248, 225)')
  })

  test('Toast Info s\'affiche correctement', async ({ page }) => {
    await page.click('button:has-text("Toast Info")')
    
    const toast = page.locator('[class*="toast"]').filter({ hasText: 'Information' })
    await expect(toast).toBeVisible()
    await expect(toast).toHaveCSS('background-color', 'rgb(227, 242, 253)')
  })

  test('Plusieurs toasts peuvent s\'empiler', async ({ page }) => {
    await page.click('button:has-text("Tester plusieurs toasts")')
    
    // Attendre un peu pour que tous les toasts apparaissent
    await page.waitForTimeout(2000)
    
    // Vérifier qu'il y a 4 toasts visibles (chercher les éléments toast individuels)
    const toasts = page.locator('[class*="toast"]').filter({ has: page.locator('[class*="message"]') })
    await expect(toasts).toHaveCount(4)
  })

  test('Toast dans le calendrier principal', async ({ page }) => {
    // Aller sur la page principale
    await page.goto('http://localhost:3000/')
    
    // Attendre que la page se charge
    await page.waitForSelector('[class*="calendarArea"]', { timeout: 10000 })
    
    // Essayer de déplacer un ticket sur une date non disponible
    // Cela devrait déclencher un toast d'avertissement
    
    // Vérifier si des tickets sont visibles dans la sidebar
    const tickets = page.locator('[data-testid="sidebar-ticket"]')
    const ticketCount = await tickets.count()
    
    if (ticketCount > 0) {
      // Simuler un drag & drop qui échouerait
      const firstTicket = tickets.first()
      const targetDate = page.locator('.dayCell').first()
      
      await firstTicket.dragTo(targetDate)
      
      // Vérifier si un toast d'erreur ou d'avertissement apparaît
      const errorToast = page.locator('[class*="toast"]')
      const toastVisible = await errorToast.isVisible().catch(() => false)
      
      if (toastVisible) {
        console.log('Toast affiché lors du drag & drop')
      }
    }
  })
})