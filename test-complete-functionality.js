const { chromium } = require('playwright');

(async () => {
  console.log('🎯 Testing complete functionality...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Track requests
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
    // Test 1: Ticket creation on main page
    console.log('\n🎫 === TESTING TICKET CREATION ===');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Fill ticket title
    const ticketInput = page.locator('input[placeholder*="Nouveau ticket"]');
    await ticketInput.fill('Test Ticket Complete ' + Date.now());
    console.log('✅ Filled ticket title');
    
    // Click add button
    const addButton = page.locator('button:has-text("Ajouter le ticket")');
    const beforeResponses = responses.length;
    await addButton.click();
    console.log('🖱️ Clicked add ticket button');
    
    // Wait and analyze responses
    await page.waitForTimeout(5000);
    const newResponses = responses.slice(beforeResponses);
    
    console.log(`📡 Ticket creation responses: ${newResponses.length}`);
    newResponses.forEach(res => {
      console.log(`  - ${res.status} ${res.url}`);
    });
    
    const ticketCreationSuccess = newResponses.some(r => r.status === 201 && r.url.includes('/tickets'));
    console.log(`🎫 Ticket creation ${ticketCreationSuccess ? 'SUCCESS' : 'FAILED'}`);
    
    await page.screenshot({ path: 'test-results/ticket-creation-complete.png', fullPage: true });
    
    // Test 2: Navigate to schedules page
    console.log('\n📅 === TESTING SCHEDULE PAGE NAVIGATION ===');
    
    const scheduleLink = page.locator('a:has-text("Gérer les horaires")');
    if (await scheduleLink.isVisible()) {
      console.log('✅ Found schedule management link');
      await scheduleLink.click();
      await page.waitForLoadState('networkidle');
      console.log('✅ Navigated to schedules page');
      
      // Wait for page to load
      await page.waitForTimeout(3000);
      
      // Check if schedules page loaded
      const scheduleTitle = await page.locator('h1:has-text("Gestion des Horaires")').isVisible();
      console.log(`📋 Schedules page loaded: ${scheduleTitle ? 'YES' : 'NO'}`);
      
      if (scheduleTitle) {
        // Test 3: Schedule creation
        console.log('\n⏰ === TESTING SCHEDULE CREATION ===');
        
        await page.screenshot({ path: 'test-results/schedules-page-loaded.png', fullPage: true });
        
        // Look for clickable schedule cells or add buttons
        const addableElements = await page.locator('[data-testid*="add"], [class*="add"], button:has-text("Ajouter"), [class*="cell"]:not([class*="occupied"])').count();
        console.log(`📋 Found ${addableElements} potential add elements`);
        
        // Try clicking on a schedule grid cell
        const firstCell = page.locator('[class*="cell"]').first();
        if (await firstCell.isVisible()) {
          console.log('🖱️ Clicking on first schedule cell...');
          await firstCell.click();
          await page.waitForTimeout(2000);
          
          // Look for modal or form
          const modal = await page.locator('[class*="modal"], [role="dialog"]').isVisible();
          console.log(`📋 Schedule modal opened: ${modal ? 'YES' : 'NO'}`);
          
          if (modal) {
            // Try to fill schedule form
            const startTimeInput = page.locator('input[type="time"]').first();
            if (await startTimeInput.isVisible()) {
              await startTimeInput.fill('09:00');
              console.log('✅ Filled start time');
            }
            
            const endTimeInput = page.locator('input[type="time"]').nth(1);
            if (await endTimeInput.isVisible()) {
              await endTimeInput.fill('17:00');
              console.log('✅ Filled end time');
            }
            
            // Look for save button
            const saveButton = page.locator('button:has-text("Enregistrer"), button:has-text("Sauvegarder"), button:has-text("Créer")').first();
            if (await saveButton.isVisible()) {
              const beforeScheduleResponses = responses.length;
              await saveButton.click();
              console.log('🖱️ Clicked save schedule button');
              
              await page.waitForTimeout(3000);
              
              const newScheduleResponses = responses.slice(beforeScheduleResponses);
              console.log(`📡 Schedule creation responses: ${newScheduleResponses.length}`);
              newScheduleResponses.forEach(res => {
                console.log(`  - ${res.status} ${res.url}`);
              });
              
              const scheduleCreationSuccess = newScheduleResponses.some(r => r.status === 201 && r.url.includes('/schedules'));
              console.log(`📅 Schedule creation ${scheduleCreationSuccess ? 'SUCCESS' : 'FAILED'}`);
            } else {
              console.log('❌ No save button found in schedule modal');
            }
          }
        } else {
          console.log('❌ No schedule cells found');
        }
        
        await page.screenshot({ path: 'test-results/schedule-creation-complete.png', fullPage: true });
      }
    } else {
      console.log('❌ Schedule management link not found');
    }
    
    // Final analysis
    console.log('\n📊 === FINAL ANALYSIS ===');
    
    const totalRequests = requests.length;
    const totalResponses = responses.length;
    const successfulCreations = responses.filter(r => r.status === 201);
    const errors = responses.filter(r => r.status >= 400);
    
    console.log(`📡 Total requests: ${totalRequests}`);
    console.log(`📡 Total responses: ${totalResponses}`);
    console.log(`✅ Successful creations (201): ${successfulCreations.length}`);
    console.log(`❌ Errors (4xx/5xx): ${errors.length}`);
    
    if (successfulCreations.length > 0) {
      console.log('\n🎉 CREATION SUCCESSES:');
      successfulCreations.forEach(res => {
        console.log(`  ✅ ${res.status} ${res.url}`);
      });
    }
    
    if (errors.length > 0) {
      console.log('\n⚠️ ERRORS FOUND:');
      errors.forEach(res => {
        console.log(`  ❌ ${res.status} ${res.url}`);
      });
      
      // Analyze error patterns
      const errorPatterns = {
        count_errors: errors.filter(e => e.url.includes('count')).length,
        insert_errors: errors.filter(e => e.url.includes('columns=')).length,
        other_errors: errors.filter(e => !e.url.includes('count') && !e.url.includes('columns=')).length
      };
      
      console.log('\n🔍 ERROR ANALYSIS:');
      console.log(`  Count query errors: ${errorPatterns.count_errors}`);
      console.log(`  Insert/column errors: ${errorPatterns.insert_errors}`);
      console.log(`  Other errors: ${errorPatterns.other_errors}`);
      
      if (errorPatterns.insert_errors > 0) {
        console.log('\n💡 LIKELY ISSUE: Insert queries are failing');
        console.log('   This suggests ID auto-increment or column mismatch issues');
      }
    }
    
    // Overall verdict
    const overallSuccess = successfulCreations.length > 0 && errors.length === 0;
    console.log(`\n🏆 OVERALL STATUS: ${overallSuccess ? '✅ FULLY WORKING' : '⚠️ ISSUES DETECTED'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();