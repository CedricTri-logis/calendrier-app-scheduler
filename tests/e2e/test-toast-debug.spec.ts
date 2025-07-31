import { test, expect } from '@playwright/test'

test.describe('Debug Toast', () => {
  test('Debug toast system', async ({ page }) => {
    // Activer les logs console
    page.on('console', msg => console.log('Browser console:', msg.type(), msg.text()))
    page.on('pageerror', err => console.log('Page error:', err))
    
    await page.goto('http://localhost:3000/test-toast')
    
    // Attendre que la page soit chargée
    await expect(page.locator('h1')).toContainText('Test du système de Toast')
    
    // Prendre une capture avant le clic
    await page.screenshot({ path: 'before-click.png' })
    
    // Cliquer sur le bouton success
    await page.click('button:has-text("Toast Success")')
    
    // Attendre un peu
    await page.waitForTimeout(1000)
    
    // Prendre une capture après le clic
    await page.screenshot({ path: 'after-click.png' })
    
    // Vérifier s'il y a des éléments toast dans le DOM
    const toastCount = await page.locator('.toast').count()
    console.log('Nombre de toasts trouvés:', toastCount)
    
    // Vérifier s'il y a des éléments avec la classe du module CSS
    const moduleToasts = await page.locator('[class*="toast"]').count()
    console.log('Nombre d\'éléments avec "toast" dans la classe:', moduleToasts)
    
    // Vérifier le HTML complet pour déboguer
    const bodyHTML = await page.locator('body').innerHTML()
    console.log('HTML du body (extrait):', bodyHTML.substring(0, 500))
  })
})