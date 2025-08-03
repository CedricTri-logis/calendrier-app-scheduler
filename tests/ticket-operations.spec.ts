import { test, expect } from '@playwright/test'

test.describe('Ticket Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001')
    // Attendre que la page soit chargée
    await page.waitForLoadState('networkidle')
  })

  test('should create a new ticket and show it in the left column', async ({ page }) => {
    // Cliquer sur le bouton pour créer un nouveau ticket
    await page.click('button:has-text("Nouveau ticket")')
    
    // Attendre que le modal apparaisse
    await page.waitForSelector('input[placeholder="Nom du ticket"]')
    
    // Remplir le formulaire
    const ticketName = `Test Ticket ${Date.now()}`
    await page.fill('input[placeholder="Nom du ticket"]', ticketName)
    
    // Sélectionner une couleur (cliquer sur la première option de couleur)
    await page.click('.grid.grid-cols-5 button:first-child')
    
    // Soumettre le formulaire
    await page.click('button:has-text("Créer")')
    
    // Attendre que le modal se ferme
    await page.waitForSelector('input[placeholder="Nom du ticket"]', { state: 'hidden' })
    
    // Vérifier que le ticket apparaît dans la colonne de gauche
    await expect(page.locator(`text="${ticketName}"`)).toBeVisible({ timeout: 10000 })
    
    // Capturer les erreurs console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text())
      }
    })
  })

  test('should remove ticket from calendar', async ({ page }) => {
    // D'abord créer un ticket
    await page.click('button:has-text("Nouveau ticket")')
    await page.waitForSelector('input[placeholder="Nom du ticket"]')
    
    const ticketName = `Drag Test ${Date.now()}`
    await page.fill('input[placeholder="Nom du ticket"]', ticketName)
    await page.click('.grid.grid-cols-5 button:first-child')
    await page.click('button:has-text("Créer")')
    
    // Attendre que le ticket soit créé
    await page.waitForSelector(`text="${ticketName}"`)
    
    // Faire glisser le ticket sur le calendrier
    const ticket = page.locator(`div:has-text("${ticketName}")`).first()
    const targetCell = page.locator('.schedule-grid .grid-cell').first()
    
    await ticket.dragTo(targetCell)
    
    // Attendre que le ticket soit dans le calendrier
    await page.waitForTimeout(1000)
    
    // Maintenant essayer de retirer le ticket du calendrier
    const calendarTicket = page.locator(`.calendar-day div:has-text("${ticketName}")`).first()
    await calendarTicket.hover()
    
    // Cliquer sur le bouton de suppression (X)
    await page.click(`.calendar-day div:has-text("${ticketName}") button[title="Retirer du calendrier"]`)
    
    // Capturer les erreurs réseau
    page.on('response', response => {
      if (!response.ok()) {
        console.log(`Error response: ${response.status()} ${response.url()}`)
      }
    })
    
    // Vérifier que le ticket est de retour dans la colonne de gauche
    await expect(page.locator(`.ticket-item:has-text("${ticketName}")`)).toBeVisible({ timeout: 10000 })
  })

  test('should check console errors during ticket creation', async ({ page }) => {
    const errors: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    page.on('response', response => {
      if (!response.ok() && response.url().includes('supabase')) {
        console.log(`Supabase error: ${response.status()} ${response.url()}`)
        response.text().then(text => console.log('Response body:', text))
      }
    })
    
    // Créer un ticket
    await page.click('button:has-text("Nouveau ticket")')
    await page.waitForSelector('input[placeholder="Nom du ticket"]')
    
    await page.fill('input[placeholder="Nom du ticket"]', 'Test Error Check')
    await page.click('.grid.grid-cols-5 button:first-child')
    await page.click('button:has-text("Créer")')
    
    await page.waitForTimeout(2000)
    
    // Afficher toutes les erreurs capturées
    if (errors.length > 0) {
      console.log('Console errors found:')
      errors.forEach(error => console.log(error))
    }
  })
})