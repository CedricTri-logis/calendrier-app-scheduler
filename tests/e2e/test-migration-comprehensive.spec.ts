import { test, expect } from '@playwright/test'

test.describe('Migration Tests - Complete Application Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Monitor console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text())
      }
    })
    
    // Monitor network failures
    page.on('response', response => {
      if (response.status() >= 400) {
        console.error(`HTTP ${response.status()}: ${response.url()}`)
      }
    })
  })

  test('1. Basic Connection and Environment Test', async ({ page }) => {
    console.log('🧪 Testing basic connection...')
    
    await page.goto('/')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Check that we don't have connection errors
    const hasConnectionError = await page.locator('h1:has-text("Erreur de connexion")').isVisible()
    if (hasConnectionError) {
      await page.screenshot({ path: 'test-results/connection-error.png' })
      const errorMsg = await page.locator('p').first().textContent()
      console.error('Connection error found:', errorMsg)
    }
    expect(hasConnectionError).toBe(false)
    
    // Check main app elements are visible
    await expect(page.locator('text=Calendrier Pro')).toBeVisible({ timeout: 10000 })
    console.log('✅ Main app loaded successfully')
  })

  test('2. Debug Page Verification', async ({ page }) => {
    console.log('🧪 Testing debug page...')
    
    await page.goto('/test-debug')
    await page.waitForLoadState('networkidle')
    
    // Check debug page loads
    await expect(page.locator('h1:has-text("Debug Calendar Application")')).toBeVisible()
    
    // Wait for connection status to update
    await page.waitForTimeout(3000)
    
    // Check connection status
    const connectionStatus = await page.locator('text=Connection Status').locator('..').locator('p').textContent()
    console.log('Connection status:', connectionStatus)
    
    // Check data counts
    const ticketsSection = page.locator('h3:has-text("📋 Tickets")').locator('..')
    const techniciansSection = page.locator('h3:has-text("👥 Technicians")').locator('..')
    const schedulesSection = page.locator('h3:has-text("📅 Schedules")').locator('..')
    
    const ticketsCount = await ticketsSection.locator('text=Count:').textContent()
    const techniciansCount = await techniciansSection.locator('text=Count:').textContent()
    const schedulesCount = await schedulesSection.locator('text=Count:').textContent()
    
    console.log('Data counts:', { ticketsCount, techniciansCount, schedulesCount })
    
    // Take screenshot for reference
    await page.screenshot({ path: 'test-results/debug-page.png', fullPage: true })
    
    console.log('✅ Debug page verification complete')
  })

  test('3. Technician Creation Test', async ({ page }) => {
    console.log('🧪 Testing technician creation...')
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Look for technician management UI
    const technicianButton = page.locator('button:has-text("Technicien"), button:has-text("Ajouter"), text=Techniciens').first()
    if (await technicianButton.isVisible()) {
      await technicianButton.click()
      
      // Try to create a test technician
      const nameInput = page.locator('input[placeholder*="Nom"], input[name*="name"], input[type="text"]').first()
      if (await nameInput.isVisible()) {
        await nameInput.fill('Test Technicien Playwright')
        
        const saveButton = page.locator('button:has-text("Sauvegarder"), button:has-text("Créer"), button:has-text("Ajouter")').first()
        if (await saveButton.isVisible()) {
          await saveButton.click()
          await page.waitForTimeout(2000)
          console.log('✅ Technician creation attempted')
        }
      }
    }
    
    await page.screenshot({ path: 'test-results/technician-test.png' })
  })

  test('4. Ticket Creation Test', async ({ page }) => {
    console.log('🧪 Testing ticket creation...')
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Look for ticket creation UI
    const ticketButton = page.locator('button:has-text("Ticket"), button:has-text("Nouveau"), text=Tickets').first()
    if (await ticketButton.isVisible()) {
      await ticketButton.click()
      
      // Try to create test ticket
      const titleInput = page.locator('input[placeholder*="Titre"], input[name*="title"], input[type="text"]').first()
      if (await titleInput.isVisible()) {
        await titleInput.fill('Test Ticket Playwright')
        
        const saveButton = page.locator('button:has-text("Sauvegarder"), button:has-text("Créer"), button:has-text("Ajouter")').first()
        if (await saveButton.isVisible()) {
          await saveButton.click()
          await page.waitForTimeout(2000)
          console.log('✅ Ticket creation attempted')
        }
      }
    }
    
    await page.screenshot({ path: 'test-results/ticket-test.png' })
  })

  test('5. Schedule Creation Test', async ({ page }) => {
    console.log('🧪 Testing schedule creation...')
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Look for schedule/hours management
    const scheduleButton = page.locator('button:has-text("Horaire"), button:has-text("Planning"), text=Horaires').first()
    if (await scheduleButton.isVisible()) {
      await scheduleButton.click()
      
      // Try to create test schedule
      const timeInput = page.locator('input[type="time"], input[placeholder*="heure"]').first()
      if (await timeInput.isVisible()) {
        await timeInput.fill('09:00')
        
        const saveButton = page.locator('button:has-text("Sauvegarder"), button:has-text("Créer"), button:has-text("Ajouter")').first()
        if (await saveButton.isVisible()) {
          await saveButton.click()
          await page.waitForTimeout(2000)
          console.log('✅ Schedule creation attempted')
        }
      }
    }
    
    await page.screenshot({ path: 'test-results/schedule-test.png' })
  })

  test('6. Calendar Display Test', async ({ page }) => {
    console.log('🧪 Testing calendar display...')
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Wait for calendar to load
    await page.waitForTimeout(3000)
    
    // Check for calendar grid or date elements
    const hasCalendarGrid = await page.locator('[class*="calendar"], [class*="grid"], [class*="day"]').first().isVisible()
    const hasDateElements = await page.locator('text=2025, text=août, text=janvier').first().isVisible()
    const hasTicketElements = await page.locator('[class*="ticket"], [draggable="true"]').first().isVisible()
    
    console.log('Calendar elements found:', {
      hasCalendarGrid,
      hasDateElements, 
      hasTicketElements
    })
    
    // Take full page screenshot
    await page.screenshot({ path: 'test-results/calendar-display.png', fullPage: true })
    
    console.log('✅ Calendar display test complete')
  })

  test('7. Network and Database Test', async ({ page }) => {
    console.log('🧪 Testing network requests and database connectivity...')
    
    const requests: string[] = []
    const responses: { url: string; status: number }[] = []
    
    page.on('request', request => {
      if (request.url().includes('supabase.co') || request.url().includes('api/')) {
        requests.push(request.url())
      }
    })
    
    page.on('response', response => {
      if (response.url().includes('supabase.co') || response.url().includes('api/')) {
        responses.push({ url: response.url(), status: response.status() })
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000)
    
    console.log('Network requests made:', requests.length)
    console.log('Network responses:', responses)
    
    // Check for failed requests
    const failedRequests = responses.filter(r => r.status >= 400)
    if (failedRequests.length > 0) {
      console.error('Failed requests:', failedRequests)
    }
    
    expect(requests.length).toBeGreaterThan(0)
    console.log('✅ Network connectivity test complete')
  })

  test('8. Complete Flow Test', async ({ page }) => {
    console.log('🧪 Testing complete application flow...')
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Test navigation between sections
    const sections = ['Tickets', 'Techniciens', 'Horaires', 'Calendrier']
    
    for (const section of sections) {
      const sectionElement = page.locator(`text=${section}`).first()
      if (await sectionElement.isVisible()) {
        await sectionElement.click()
        await page.waitForTimeout(1000)
        console.log(`✅ Navigated to ${section}`)
      }
    }
    
    // Final screenshot
    await page.screenshot({ path: 'test-results/complete-flow.png', fullPage: true })
    
    console.log('✅ Complete flow test finished')
  })
})