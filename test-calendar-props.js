const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Checking calendar props...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture all console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('ModernCalendar') || text.includes('props') || text.includes('handler')) {
      consoleLogs.push({
        type: msg.type(),
        text: text
      });
    }
  });
  
  try {
    console.log('📅 Loading calendar page...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('\n📝 Console logs:');
    consoleLogs.forEach(log => {
      console.log(`[${log.type}] ${log.text}`);
    });
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/calendar-props.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();