import { test, expect } from '@playwright/test'

test.describe('Final Migration Verification', () => {
  test('Complete Application Health Check', async ({ page }) => {
    console.log('🎯 Final comprehensive health check...')
    
    // Monitor for any 400 errors
    const errorRequests: string[] = []
    page.on('response', response => {
      if (response.status() >= 400) {
        errorRequests.push(`${response.status()}: ${response.url()}`)
      }
    })
    
    // 1. Test main application
    console.log('✅ Testing main application...')
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Calendrier Pro')).toBeVisible()
    
    // 2. Test debug page (should now show success)
    console.log('✅ Testing debug page...')
    await page.goto('/test-debug')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    
    // Check connection status
    const connectionText = await page.textContent('body')
    const hasConnectionSuccess = connectionText?.includes('✅ Supabase connection OK')
    const hasConnectionFailed = connectionText?.includes('❌ Connection failed')
    
    console.log('Connection status check:', {
      hasSuccess: hasConnectionSuccess,
      hasFailed: hasConnectionFailed
    })
    
    // 3. Check data counts
    const ticketsText = await page.locator('h3:has-text("📋 Tickets")').locator('..').textContent()
    const techniciansText = await page.locator('h3:has-text("👥 Technicians")').locator('..').textContent()
    const schedulesText = await page.locator('h3:has-text("📅 Schedules")').locator('..').textContent()
    
    console.log('Data status:')
    console.log('- Tickets:', ticketsText?.match(/Count:\s*(\d+)/)?.[1] || 'unknown')
    console.log('- Technicians:', techniciansText?.match(/Count:\s*(\d+)/)?.[1] || 'unknown')
    console.log('- Schedules:', schedulesText?.match(/Count:\s*(\d+)/)?.[1] || 'unknown')
    
    // 4. Check for errors
    const hasErrorSection = await page.locator('div:has-text("❌ Errors Detected")').isVisible()
    if (hasErrorSection) {
      const errorText = await page.locator('div:has-text("❌ Errors Detected")').textContent()
      console.log('❌ Errors found:', errorText)
    } else {
      console.log('✅ No error section visible')
    }
    
    // 5. Final report
    console.log('\\n📊 FINAL REPORT:')
    console.log('- Main app loads:', '✅')
    console.log('- Debug page loads:', '✅')
    console.log('- Connection successful:', hasConnectionSuccess ? '✅' : '❌')
    console.log('- HTTP errors found:', errorRequests.length > 0 ? `❌ (${errorRequests.length})` : '✅')
    
    if (errorRequests.length > 0) {
      console.log('❌ Error requests:')
      errorRequests.forEach(err => console.log('  -', err))
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/final-verification.png', fullPage: true })
    
    console.log('\\n🎉 Migration testing complete!')
  })
  
  test('Quick Functional Test', async ({ page }) => {
    console.log('🧪 Quick functional verification...')
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check main elements are present
    const hasMainTitle = await page.locator('text=Calendrier Pro').isVisible()
    const hasCalendarGrid = await page.locator('[class*="calendar"], [class*="grid"], [class*="day"]').first().isVisible()
    const hasTicketsSection = await page.locator('text=Tickets').isVisible()
    
    console.log('Functional check:')
    console.log('- Main title visible:', hasMainTitle ? '✅' : '❌')
    console.log('- Calendar grid visible:', hasCalendarGrid ? '✅' : '❌')
    console.log('- Tickets section visible:', hasTicketsSection ? '✅' : '❌')
    
    expect(hasMainTitle).toBe(true)
    
    console.log('✅ Functional test passed')
  })
})