import { test, expect } from '@playwright/test'

test.describe('Debug Ticket Creation', () => {
  test('debug ticket creation and console errors', async ({ page }) => {
    // Capturer tous les logs console
    const consoleLogs: string[] = []
    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`
      consoleLogs.push(text)
      console.log(text)
    })

    // Capturer toutes les requêtes réseau vers Supabase
    const supabaseRequests: any[] = []
    page.on('request', request => {
      if (request.url().includes('supabase')) {
        supabaseRequests.push({
          method: request.method(),
          url: request.url(),
          postData: request.postData()
        })
      }
    })

    // Capturer toutes les réponses Supabase
    page.on('response', async response => {
      if (response.url().includes('supabase')) {
        const status = response.status()
        const text = await response.text().catch(() => 'Unable to get response text')
        console.log(`\nSupabase Response: ${response.url()}`)
        console.log(`Status: ${status}`)
        console.log(`Body: ${text}`)
      }
    })

    // Aller sur la page
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')

    // Attendre que les tickets se chargent
    await page.waitForTimeout(2000)

    // Compter les tickets avant création
    const ticketCountBefore = await page.locator('.ticketsList > div').count()
    console.log(`\nTickets before creation: ${ticketCountBefore}`)

    // Créer un nouveau ticket
    console.log('\n--- Creating new ticket ---')
    
    // Remplir le formulaire
    await page.fill('input[placeholder="Nouveau ticket..."]', 'Test Debug Ticket')
    
    // Sélectionner une couleur
    await page.click('.colorPicker button:first-child')
    
    // Cliquer sur le bouton de création
    await page.click('button:has-text("Ajouter le ticket")')
    
    // Attendre un peu pour voir les requêtes
    await page.waitForTimeout(3000)

    // Compter les tickets après création
    const ticketCountAfter = await page.locator('.ticketsList > div').count()
    console.log(`\nTickets after creation: ${ticketCountAfter}`)

    // Afficher tous les logs console
    console.log('\n--- All console logs ---')
    consoleLogs.forEach(log => console.log(log))

    // Afficher toutes les requêtes Supabase
    console.log('\n--- Supabase requests ---')
    supabaseRequests.forEach(req => {
      console.log(`${req.method} ${req.url}`)
      if (req.postData) {
        console.log(`Body: ${req.postData}`)
      }
    })

    // Vérifier si le ticket a été créé
    expect(ticketCountAfter).toBeGreaterThan(ticketCountBefore)
  })

  test('debug ticket removal from calendar', async ({ page }) => {
    // Capturer les erreurs
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Console error: ${msg.text()}`)
      }
    })

    page.on('response', async response => {
      if (response.url().includes('supabase') && !response.ok()) {
        console.log(`\nError response from: ${response.url()}`)
        console.log(`Status: ${response.status()}`)
        const text = await response.text().catch(() => 'Unable to get response text')
        console.log(`Body: ${text}`)
      }
    })

    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')

    // Attendre que la page soit chargée
    await page.waitForTimeout(2000)

    // Chercher un ticket dans le calendrier
    const calendarTicket = page.locator('.calendar-day .modern-ticket').first()
    
    if (await calendarTicket.count() > 0) {
      console.log('Found ticket in calendar, attempting to remove...')
      
      // Hover sur le ticket
      await calendarTicket.hover()
      
      // Chercher et cliquer sur le bouton X
      const removeButton = calendarTicket.locator('button[title="Retirer du calendrier"]')
      if (await removeButton.count() > 0) {
        await removeButton.click()
        console.log('Clicked remove button')
        
        // Attendre pour voir la réponse
        await page.waitForTimeout(2000)
      } else {
        console.log('Remove button not found')
      }
    } else {
      console.log('No ticket found in calendar')
    }
  })
})