const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Checking handler functions...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    if (msg.text().includes('Debug day')) {
      consoleLogs.push(msg.text());
    }
  });
  
  try {
    console.log('📅 Loading calendar page...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('\n📝 Debug logs:');
    consoleLogs.forEach(log => console.log(log));
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/handler-functions.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();