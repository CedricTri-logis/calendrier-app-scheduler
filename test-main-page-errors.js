const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Monitoring main page for 401 errors...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const errors401 = [];
  const schedulesRequests = [];
  
  // Monitor all responses
  page.on('response', response => {
    const url = response.url();
    
    if (url.includes('supabase.co')) {
      if (response.status() === 401) {
        errors401.push({
          status: response.status(),
          url: url,
          timestamp: new Date().toISOString()
        });
        console.error(`❌ 401: ${url}`);
      }
      
      if (url.includes('schedules')) {
        schedulesRequests.push({
          status: response.status(),
          url: url
        });
      }
    }
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('401') || text.includes('Unauthorized')) {
        console.error('❌ Console error:', text);
      }
    }
  });
  
  try {
    console.log('📍 Loading main page...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Wait and monitor
    console.log('⏱️ Monitoring for 10 seconds...');
    await page.waitForTimeout(10000);
    
    console.log('\n📊 RESULTS:');
    console.log(`401 errors found: ${errors401.length}`);
    
    if (errors401.length > 0) {
      console.log('\n❌ 401 ERRORS:');
      errors401.forEach(err => {
        console.log(`  - ${err.url}`);
        console.log(`    Time: ${err.timestamp}`);
      });
    }
    
    console.log(`\n📅 Schedules requests: ${schedulesRequests.length}`);
    schedulesRequests.forEach(req => {
      console.log(`  - ${req.status} ${req.url}`);
    });
    
    // Check for columns parameter
    const columnsRequests = schedulesRequests.filter(r => r.url.includes('columns='));
    if (columnsRequests.length > 0) {
      console.log('\n⚠️ Requests with columns parameter:');
      columnsRequests.forEach(req => {
        console.log(`  - ${req.url}`);
      });
    }
    
    // Try refreshing the page
    console.log('\n🔄 Refreshing page...');
    await page.reload();
    await page.waitForTimeout(5000);
    
    console.log(`\n📊 AFTER REFRESH:`);
    console.log(`Total 401 errors: ${errors401.length}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();