import { test, expect } from '@playwright/test'

test('Debug CSS classes', async ({ page }) => {
  await page.goto('http://localhost:3000/test-toast')
  
  // Cliquer sur le bouton
  await page.click('button:has-text("Toast Success")')
  await page.waitForTimeout(500)
  
  // Chercher tous les éléments qui pourraient être des toasts
  const toastContainers = await page.locator('[class*="container"]').allInnerTexts()
  console.log('Containers trouvés:', toastContainers)
  
  // Chercher spécifiquement le container de toast
  const toastModuleContainer = await page.locator('[class*="ToastContainer"]').count()
  console.log('Containers ToastContainer:', toastModuleContainer)
  
  // Obtenir toutes les classes qui contiennent "toast"
  const toastElements = await page.$$('[class*="toast" i]')
  for (const element of toastElements) {
    const className = await element.getAttribute('class')
    const text = await element.innerText().catch(() => 'No text')
    console.log('Element toast trouvé:', { className, text })
  }
  
  // Vérifier le wrapper
  const wrapper = await page.locator('body > div > div:last-child').innerHTML()
  console.log('Dernier div (devrait être ToastWrapper):', wrapper.substring(0, 200))
})