import { test, expect } from '@playwright/test'

test.describe('Creation Tests - Tickets and Schedules', () => {
  test.beforeEach(async ({ page }) => {
    // Monitor all errors and requests
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('❌ Console error:', msg.text())
      }
    })
    
    page.on('response', response => {
      if (response.status() >= 400) {
        console.error(`❌ HTTP ${response.status()}: ${response.url()}`)
      } else if (response.url().includes('supabase.co') && (response.url().includes('POST') || response.status() === 201)) {
        console.log(`✅ Success: ${response.status()} ${response.url()}`)
      }
    })
  })

  test('1. Test Ticket Creation Flow', async ({ page }) => {
    console.log('🎫 Testing ticket creation...')
    
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/before-ticket-creation.png', fullPage: true })
    
    // Look for ticket creation UI elements
    console.log('🔍 Looking for ticket creation elements...')
    
    // Try different selectors for ticket creation
    const possibleTicketButtons = [
      'button:has-text("Nouveau ticket")',
      'button:has-text("Ajouter ticket")', 
      'button:has-text("Créer ticket")',
      'button:has-text("+")',
      '[data-testid="create-ticket"]',
      '[aria-label*="ticket"]',
      'button[title*="ticket"]'
    ]
    
    let createButton = null
    for (const selector of possibleTicketButtons) {
      const button = page.locator(selector).first()
      if (await button.isVisible()) {
        console.log(`✅ Found ticket button: ${selector}`)
        createButton = button
        break
      }
    }
    
    if (!createButton) {
      console.log('⚠️ No obvious ticket creation button found, looking for generic buttons...')
      
      // Look for any buttons that might be for creation
      const allButtons = await page.locator('button').all()
      console.log(`📝 Found ${allButtons.length} buttons total`)
      
      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        const buttonText = await allButtons[i].textContent()
        console.log(`  Button ${i + 1}: "${buttonText}"`)
      }
    }
    
    if (createButton) {
      console.log('🖱️ Clicking ticket creation button...')
      await createButton.click()
      await page.waitForTimeout(1000)
      
      // Look for form fields
      const titleInput = page.locator('input[name="title"], input[placeholder*="titre"], input[placeholder*="Titre"], input[type="text"]').first()
      
      if (await titleInput.isVisible()) {
        console.log('✅ Found ticket title input')
        await titleInput.fill('Test Ticket Playwright ' + Date.now())
        
        // Look for save/submit button
        const saveButton = page.locator('button:has-text("Enregistrer"), button:has-text("Sauvegarder"), button:has-text("Créer"), button[type="submit"]').first()
        
        if (await saveButton.isVisible()) {
          console.log('🖱️ Clicking save button...')
          await saveButton.click()
          await page.waitForTimeout(2000)
          
          console.log('✅ Ticket creation attempted')
        } else {
          console.log('❌ No save button found')
        }
      } else {
        console.log('❌ No title input found after clicking create button')
      }
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/after-ticket-creation.png', fullPage: true })
  })

  test('2. Test Schedule Creation Flow', async ({ page }) => {
    console.log('📅 Testing schedule creation...')
    
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/before-schedule-creation.png', fullPage: true })
    
    // Look for schedule/hours creation UI
    console.log('🔍 Looking for schedule creation elements...')
    
    const possibleScheduleButtons = [
      'button:has-text("Nouvel horaire")',
      'button:has-text("Ajouter horaire")',
      'button:has-text("Créer horaire")',
      'button:has-text("Planning")',
      'button:has-text("Horaires")',
      '[data-testid="create-schedule"]',
      'button[title*="horaire"]',
      'button[title*="planning"]'
    ]
    
    let createButton = null
    for (const selector of possibleScheduleButtons) {
      const button = page.locator(selector).first()
      if (await button.isVisible()) {
        console.log(`✅ Found schedule button: ${selector}`)
        createButton = button
        break
      }
    }
    
    // Also try clicking on "Horaires" or "Schedules" tab/section first
    const horairesTab = page.locator('text=Horaires, text=Schedules, text=Planning').first()
    if (await horairesTab.isVisible()) {
      console.log('🖱️ Clicking on Horaires section first...')
      await horairesTab.click()
      await page.waitForTimeout(1000)
      
      // Now look for create button again
      for (const selector of possibleScheduleButtons) {
        const button = page.locator(selector).first()
        if (await button.isVisible()) {
          console.log(`✅ Found schedule button after tab click: ${selector}`)
          createButton = button
          break
        }
      }
    }
    
    if (!createButton) {
      console.log('⚠️ No obvious schedule creation button found, analyzing page structure...')
      
      // Look for time-related inputs that might indicate schedule forms
      const timeInputs = await page.locator('input[type="time"], input[placeholder*="heure"]').count()
      const dateInputs = await page.locator('input[type="date"], input[placeholder*="date"]').count()
      
      console.log(`📝 Found ${timeInputs} time inputs and ${dateInputs} date inputs`)
      
      if (timeInputs > 0 || dateInputs > 0) {
        console.log('✅ Schedule form seems to be already visible')
        
        // Try to fill schedule data directly
        const startTimeInput = page.locator('input[type="time"]').first()
        if (await startTimeInput.isVisible()) {
          console.log('🕐 Filling start time...')
          await startTimeInput.fill('09:00')
        }
        
        const endTimeInput = page.locator('input[type="time"]').nth(1)
        if (await endTimeInput.isVisible()) {
          console.log('🕐 Filling end time...')
          await endTimeInput.fill('17:00')
        }
        
        const dateInput = page.locator('input[type="date"]').first()
        if (await dateInput.isVisible()) {
          console.log('📅 Filling date...')
          await dateInput.fill('2025-08-01')
        }
        
        // Look for technician selector
        const techSelect = page.locator('select, [role="combobox"]').first()
        if (await techSelect.isVisible()) {
          console.log('👥 Selecting technician...')
          await techSelect.click()
          await page.waitForTimeout(500)
          
          // Try to select first option
          const firstOption = page.locator('option, [role="option"]').nth(1)
          if (await firstOption.isVisible()) {
            await firstOption.click()
          }
        }
        
        // Look for save button
        const saveButton = page.locator('button:has-text("Enregistrer"), button:has-text("Sauvegarder"), button:has-text("Créer"), button[type="submit"]').first()
        if (await saveButton.isVisible()) {
          console.log('🖱️ Clicking save button...')
          await saveButton.click()
          await page.waitForTimeout(2000)
          console.log('✅ Schedule creation attempted')
        }
      }
    } else {
      console.log('🖱️ Clicking schedule creation button...')
      await createButton.click()
      await page.waitForTimeout(1000)
      
      // Fill schedule form after clicking create button
      const startTimeInput = page.locator('input[type="time"], input[placeholder*="début"]').first()
      if (await startTimeInput.isVisible()) {
        await startTimeInput.fill('09:00')
        console.log('✅ Filled start time')
      }
      
      const endTimeInput = page.locator('input[type="time"], input[placeholder*="fin"]').first()
      if (await endTimeInput.isVisible()) {
        await endTimeInput.fill('17:00')
        console.log('✅ Filled end time')
      }
      
      const saveButton = page.locator('button:has-text("Enregistrer"), button:has-text("Sauvegarder"), button:has-text("Créer")').first()
      if (await saveButton.isVisible()) {
        await saveButton.click()
        await page.waitForTimeout(2000)
        console.log('✅ Schedule creation attempted')
      }
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/after-schedule-creation.png', fullPage: true })
  })

  test('3. Analyze Page Structure for Creation Elements', async ({ page }) => {
    console.log('🔍 Analyzing page structure for creation elements...')
    
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')
    
    // Get page structure
    const pageStructure = await page.evaluate(() => {
      const findInteractiveElements = (element: Element, path: string = ''): any[] => {
        const results = []
        
        // Check current element
        if (element.tagName === 'BUTTON') {
          results.push({
            type: 'button',
            text: element.textContent?.trim(),
            classes: element.className,
            id: element.id,
            path: path + ' > ' + element.tagName
          })
        }
        
        if (element.tagName === 'INPUT') {
          results.push({
            type: 'input',
            inputType: (element as HTMLInputElement).type,
            placeholder: (element as HTMLInputElement).placeholder,
            name: (element as HTMLInputElement).name,
            path: path + ' > ' + element.tagName
          })
        }
        
        // Recursively check children
        for (const child of element.children) {
          results.push(...findInteractiveElements(child, path + ' > ' + element.tagName))
        }
        
        return results
      }
      
      return findInteractiveElements(document.body)
    })
    
    console.log('📝 Interactive elements found:')
    
    const buttons = pageStructure.filter(el => el.type === 'button')
    const inputs = pageStructure.filter(el => el.type === 'input')
    
    console.log(`\n🔘 Buttons (${buttons.length}):`)
    buttons.slice(0, 15).forEach((btn, i) => {
      console.log(`  ${i + 1}. "${btn.text}" (classes: ${btn.classes})`)
    })
    
    console.log(`\n📝 Inputs (${inputs.length}):`)
    inputs.slice(0, 15).forEach((input, i) => {
      console.log(`  ${i + 1}. ${input.inputType} - placeholder: "${input.placeholder}" - name: "${input.name}"`)
    })
    
    // Take structural screenshot
    await page.screenshot({ path: 'test-results/page-structure-analysis.png', fullPage: true })
    
    console.log('\n✅ Page structure analysis complete')
  })
})