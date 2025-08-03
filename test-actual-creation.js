const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Testing actual ticket and schedule creation...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Monitor all requests
  const requests = [];
  const responses = [];
  
  page.on('request', request => {
    if (request.url().includes('supabase.co')) {
      requests.push({
        method: request.method(),
        url: request.url(),
        timestamp: Date.now()
      });
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('supabase.co')) {
      responses.push({
        status: response.status(),
        url: response.url(),
        timestamp: Date.now()
      });
      
      if (response.status() >= 400) {
        console.error(`❌ HTTP ${response.status()}: ${response.url()}`);
      } else if (response.status() === 201) {
        console.log(`✅ CREATED: ${response.status()} ${response.url()}`);
      }
    }
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('❌ Console error:', msg.text());
    }
  });
  
  try {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    console.log('\n🎫 === TESTING TICKET CREATION ===');
    
    // Step 1: Find and fill the ticket input
    const ticketInput = page.locator('input[placeholder*="Nouveau ticket"]');
    if (await ticketInput.isVisible()) {
      console.log('✅ Found ticket input field');
      await ticketInput.fill('Test Ticket from Playwright ' + Date.now());
      console.log('✅ Filled ticket title');
      
      // Step 2: Click the "Ajouter le ticket" button
      const addButton = page.locator('button:has-text("Ajouter le ticket")');
      if (await addButton.isVisible()) {
        console.log('✅ Found "Ajouter le ticket" button');
        
        const beforeCount = responses.length;
        await addButton.click();
        console.log('🖱️ Clicked "Ajouter le ticket" button');
        
        // Wait for potential network requests
        await page.waitForTimeout(3000);
        
        const afterCount = responses.length;
        const newRequests = responses.slice(beforeCount);
        
        console.log(`📡 New requests made: ${newRequests.length}`);
        newRequests.forEach(req => {
          console.log(`  - ${req.status} ${req.url}`);
        });
        
        // Check if ticket was created (look for success indicators)
        const createdRequests = newRequests.filter(r => r.status === 201);
        if (createdRequests.length > 0) {
          console.log('✅ Ticket creation appeared successful!');
        } else {
          console.log('⚠️ No 201 status codes detected for ticket creation');
        }
      } else {
        console.log('❌ "Ajouter le ticket" button not found');
      }
    } else {
      console.log('❌ Ticket input field not found');
    }
    
    await page.screenshot({ path: 'test-results/after-ticket-creation-attempt.png', fullPage: true });
    
    console.log('\n📅 === TESTING SCHEDULE CREATION ===');
    
    // Look for schedule/hours section
    const sectionsToTry = ['Horaires', 'Planning', 'Schedules'];
    let scheduleSection = null;
    
    for (const sectionName of sectionsToTry) {
      const section = page.locator(`text=${sectionName}`);
      if (await section.isVisible()) {
        console.log(`✅ Found ${sectionName} section`);
        await section.click();
        await page.waitForTimeout(1000);
        scheduleSection = sectionName;
        break;
      }
    }
    
    if (!scheduleSection) {
      console.log('⚠️ No schedule section found, looking for time inputs directly...');
    }
    
    // Look for time and date inputs
    const timeInputs = await page.locator('input[type="time"]').count();
    const dateInputs = await page.locator('input[type="date"]').count();
    
    console.log(`📅 Found ${dateInputs} date inputs and ${timeInputs} time inputs`);
    
    if (timeInputs > 0 || dateInputs > 0) {
      console.log('✅ Schedule form elements found, attempting to fill...');
      
      // Fill date if available
      const dateInput = page.locator('input[type="date"]').first();
      if (await dateInput.isVisible()) {
        await dateInput.fill('2025-08-01');
        console.log('✅ Filled date: 2025-08-01');
      }
      
      // Fill start time if available
      const startTimeInput = page.locator('input[type="time"]').first();
      if (await startTimeInput.isVisible()) {
        await startTimeInput.fill('09:00');
        console.log('✅ Filled start time: 09:00');
      }
      
      // Fill end time if available
      const endTimeInput = page.locator('input[type="time"]').nth(1);
      if (await endTimeInput.isVisible()) {
        await endTimeInput.fill('17:00');
        console.log('✅ Filled end time: 17:00');
      }
      
      // Look for technician selection
      const selects = await page.locator('select').count();
      console.log(`📋 Found ${selects} select dropdowns`);
      
      if (selects > 0) {
        const techSelect = page.locator('select').first();
        await techSelect.click();
        await page.waitForTimeout(500);
        
        // Try to select second option (first is usually empty)
        const options = await page.locator('select option').count();
        if (options > 1) {
          await techSelect.selectOption({ index: 1 });
          console.log('✅ Selected technician');
        }
      }
      
      // Look for save/create button
      const saveButtons = [
        'button:has-text("Enregistrer")',
        'button:has-text("Sauvegarder")',
        'button:has-text("Créer")',
        'button:has-text("Ajouter")',
        'button[type="submit"]'
      ];
      
      let saveButton = null;
      for (const selector of saveButtons) {
        const btn = page.locator(selector);
        if (await btn.isVisible()) {
          console.log(`✅ Found save button: ${selector}`);
          saveButton = btn;
          break;
        }
      }
      
      if (saveButton) {
        const beforeCount = responses.length;
        await saveButton.click();
        console.log('🖱️ Clicked save button');
        
        await page.waitForTimeout(3000);
        
        const afterCount = responses.length;
        const newRequests = responses.slice(beforeCount);
        
        console.log(`📡 New requests for schedule: ${newRequests.length}`);
        newRequests.forEach(req => {
          console.log(`  - ${req.status} ${req.url}`);
        });
        
        const createdRequests = newRequests.filter(r => r.status === 201);
        if (createdRequests.length > 0) {
          console.log('✅ Schedule creation appeared successful!');
        } else {
          console.log('⚠️ No 201 status codes detected for schedule creation');
        }
      } else {
        console.log('❌ No save button found for schedule');
      }
    } else {
      console.log('❌ No schedule form elements found');
    }
    
    await page.screenshot({ path: 'test-results/after-schedule-creation-attempt.png', fullPage: true });
    
    console.log('\n📊 === FINAL SUMMARY ===');
    console.log(`Total Supabase requests: ${requests.length}`);
    console.log(`Total Supabase responses: ${responses.length}`);
    
    const successfulCreations = responses.filter(r => r.status === 201);
    const errors = responses.filter(r => r.status >= 400);
    
    console.log(`✅ Successful creations (201): ${successfulCreations.length}`);
    console.log(`❌ Errors (4xx/5xx): ${errors.length}`);
    
    if (successfulCreations.length > 0) {
      console.log('\n🎉 SUCCESS: At least one creation request was successful!');
      successfulCreations.forEach(req => {
        console.log(`  ✅ ${req.status} ${req.url}`);
      });
    }
    
    if (errors.length > 0) {
      console.log('\n⚠️ ERRORS detected:');
      errors.forEach(req => {
        console.log(`  ❌ ${req.status} ${req.url}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();