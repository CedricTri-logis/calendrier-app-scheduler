import { test, expect } from '@playwright/test'

test.describe('Specific Issue Investigation', () => {
  test('Database Connection Issue Analysis', async ({ page }) => {
    console.log('🔍 Investigating the 400 error on tickets count...')
    
    // Monitor all requests
    const requests: any[] = []
    const responses: any[] = []
    
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      })
    })
    
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      })
    })
    
    // Go to debug page to get detailed info
    await page.goto('/test-debug')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000)
    
    // Check what the debug page shows
    const connectionStatus = await page.locator('div:has-text("Connection Status")').textContent()
    console.log('Debug page connection status:', connectionStatus)
    
    // Check environment variables shown
    const envSection = await page.locator('div:has-text("Environment")').textContent()
    console.log('Environment info:', envSection)
    
    // Look at the actual errors
    const errorSection = await page.locator('div:has-text("Errors Detected")').first()
    if (await errorSection.isVisible()) {
      const errorText = await errorSection.textContent()
      console.log('Error details:', errorText)
    }
    
    // Analyze the specific 400 requests
    const failedRequests = responses.filter(r => r.status === 400)
    console.log('Failed requests details:')
    failedRequests.forEach(req => {
      console.log('- URL:', req.url)
      console.log('- Status:', req.status, req.statusText)
    })
    
    // Check if it's a schema header issue
    const supabaseRequests = requests.filter(r => r.url.includes('supabase.co'))
    console.log('\\nSupabase requests headers:')
    supabaseRequests.forEach(req => {
      console.log('- URL:', req.url)
      console.log('- Headers:', req.headers)
      console.log('---')
    })
    
    await page.screenshot({ path: 'test-results/specific-issue-debug.png', fullPage: true })
  })
  
  test('Direct Supabase Connection Test', async ({ page }) => {
    console.log('🔍 Testing direct Supabase connection...')
    
    await page.goto('/')
    
    // Execute JavaScript to test Supabase directly
    const supabaseTest = await page.evaluate(async () => {
      try {
        // Access the global supabase instance
        const supabase = (window as any).supabase || null
        if (!supabase) {
          return { error: 'Supabase client not found on window' }
        }
        
        // Try a simple query
        const { data, error } = await supabase
          .from('tickets')
          .select('id, title')
          .limit(1)
        
        return {
          success: !error,
          error: error?.message || null,
          data: data || null,
          clientExists: !!supabase
        }
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          clientExists: false
        }
      }
    })
    
    console.log('Direct Supabase test result:', supabaseTest)
    
    // Also test the count query that's failing
    const countTest = await page.evaluate(async () => {
      try {
        const supabase = (window as any).supabase
        if (!supabase) return { error: 'No supabase client' }
        
        const { count, error } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
        
        return {
          success: !error,
          error: error?.message || null,
          count
        }
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        }
      }
    })
    
    console.log('Count query test result:', countTest)
  })
})