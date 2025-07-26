import { test, expect } from '@playwright/test'

test.describe('Application Connection Tests', () => {
  test('should load the application without connection errors', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3002')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check if there's a connection error
    const errorTitle = await page.locator('h1:has-text("Erreur de connexion")').isVisible()
    
    if (errorTitle) {
      // If there's an error, log the error message
      const errorMessage = await page.locator('p:has-text("Erreur lors du chargement")').textContent()
      console.log('Connection error found:', errorMessage)
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'connection-error.png' })
      
      // Check console for errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log('Console error:', msg.text())
        }
      })
      
      // Fail the test with helpful information
      expect(errorTitle).toBe(false)
    }
    
    // If no error, check that the calendar loads
    await expect(page.locator('text=Calendrier Pro')).toBeVisible()
    await expect(page.locator('text=Tickets')).toBeVisible()
  })
  
  test('should verify Supabase environment variables', async ({ page }) => {
    // Create a test page to check environment variables
    await page.goto('http://localhost:3002')
    
    // Execute JavaScript in the browser context to check env vars
    const envCheck = await page.evaluate(() => {
      return {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT_SET',
        keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
      }
    })
    
    console.log('Environment check:', envCheck)
    
    expect(envCheck.hasSupabaseUrl).toBe(true)
    expect(envCheck.hasSupabaseKey).toBe(true)
    expect(envCheck.supabaseUrl).toContain('supabase.co')
    expect(envCheck.keyLength).toBeGreaterThan(100)
  })
  
  test('should check network requests to Supabase', async ({ page }) => {
    const supabaseRequests: string[] = []
    
    // Monitor network requests
    page.on('request', request => {
      if (request.url().includes('supabase.co')) {
        supabaseRequests.push(request.url())
      }
    })
    
    page.on('response', response => {
      if (response.url().includes('supabase.co')) {
        console.log(`Supabase response: ${response.url()} - Status: ${response.status()}`)
        if (response.status() >= 400) {
          console.error(`Error response from Supabase: ${response.status()} ${response.statusText()}`)
        }
      }
    })
    
    await page.goto('http://localhost:3002')
    await page.waitForLoadState('networkidle')
    
    // Wait a bit for requests to complete
    await page.waitForTimeout(2000)
    
    console.log('Supabase requests made:', supabaseRequests)
    
    // Check that at least one request was made to Supabase
    expect(supabaseRequests.length).toBeGreaterThan(0)
  })
})