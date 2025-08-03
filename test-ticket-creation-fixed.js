const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Testing fixed ticket creation...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Track responses
  const responses = [];
  
  page.on('response', response => {
    if (response.url().includes('supabase.co')) {
      responses.push({
        status: response.status(),
        method: response.request().method(),
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
    
    console.log('🎫 Testing ticket creation with fixed hooks...');
    
    // Fill ticket title
    const ticketInput = page.locator('input[placeholder*="Nouveau ticket"]');
    await ticketInput.fill('FIXED Test Ticket ' + Date.now());
    console.log('✅ Filled ticket title');
    
    // Click add button
    const addButton = page.locator('button:has-text("Ajouter le ticket")');
    const beforeResponses = responses.length;
    
    await addButton.click();
    console.log('🖱️ Clicked add ticket button');
    
    // Wait for responses
    await page.waitForTimeout(5000);
    
    const newResponses = responses.slice(beforeResponses);
    console.log(`📡 New responses: ${newResponses.length}`);
    
    newResponses.forEach(res => {
      console.log(`  - ${res.method} ${res.status} ${res.url}`);
    });
    
    // Check for success
    const createdTickets = newResponses.filter(r => r.status === 201 && r.url.includes('/tickets'));
    const insertRequests = newResponses.filter(r => r.method === 'POST' && r.url.includes('/tickets'));
    
    console.log(`\n📊 RESULTS:`);
    console.log(`  Insert requests (POST): ${insertRequests.length}`);
    console.log(`  Successful creations (201): ${createdTickets.length}`);
    
    if (createdTickets.length > 0) {
      console.log('🎉 SUCCESS: Ticket creation is now working!');
    } else if (insertRequests.length > 0) {
      const failedInserts = insertRequests.filter(r => r.status >= 400);
      if (failedInserts.length > 0) {
        console.log('⚠️ Insert attempted but failed:');
        failedInserts.forEach(req => {
          console.log(`  ❌ ${req.status} ${req.url}`);
        });
      } else {
        console.log('⚠️ Insert attempted but no clear success/failure');
      }
    } else {
      console.log('❌ No insert requests detected');
    }
    
    await page.screenshot({ path: 'test-results/ticket-creation-fixed.png', fullPage: true });
    
    // Test navigation to schedule page
    console.log('\n📅 Testing schedule page navigation...');
    
    const scheduleLinks = [
      'a:has-text("Gérer les horaires")',
      'a:has-text("horaires")', 
      'a[href*="schedule"]',
      'text=Gérer les horaires'
    ];
    
    let scheduleLink = null;
    for (const selector of scheduleLinks) {
      const link = page.locator(selector);
      if (await link.isVisible()) {
        console.log(`✅ Found schedule link: ${selector}`);
        scheduleLink = link;
        break;
      }
    }
    
    if (scheduleLink) {
      await scheduleLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const schedulePageTitle = await page.locator('h1:has-text("Gestion des Horaires")').isVisible();
      console.log(`📋 Schedule page loaded: ${schedulePageTitle ? 'YES' : 'NO'}`);
      
      await page.screenshot({ path: 'test-results/schedule-page-navigation.png', fullPage: true });
    } else {
      console.log('❌ No schedule link found');
      
      // Debug: show all links
      const allLinks = await page.locator('a').all();
      console.log(`🔍 Found ${allLinks.length} links total:`);
      
      for (let i = 0; i < Math.min(allLinks.length, 10); i++) {
        const href = await allLinks[i].getAttribute('href');
        const text = await allLinks[i].textContent();
        const isVisible = await allLinks[i].isVisible();
        if (isVisible && text) {
          console.log(`  Link ${i + 1}: "${text.trim()}" -> ${href}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();