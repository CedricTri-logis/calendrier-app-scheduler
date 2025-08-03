const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Checking mobile detection...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text()
    });
  });
  
  try {
    console.log('📅 Loading calendar page...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check mobile state
    const mobileCheck = await page.evaluate(() => {
      // Check viewport
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Check for touch support
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Check user agent
      const userAgent = navigator.userAgent;
      const isMobileUA = /Mobile|Android|iPhone|iPad/i.test(userAgent);
      
      return {
        viewport: { width, height },
        hasTouch,
        isMobileUA,
        userAgent: userAgent.slice(0, 100)
      };
    });
    
    console.log('\n📱 Mobile Detection:', mobileCheck);
    
    // Try to drag a ticket
    const ticket = await page.$('[draggable="true"]');
    if (ticket) {
      console.log('\n🎯 Attempting drag...');
      await ticket.dispatchEvent('dragstart');
      await page.waitForTimeout(500);
    }
    
    // Check console logs for mobile messages
    const mobileLogs = consoleLogs.filter(log => 
      log.text.includes('mobile') || log.text.includes('Mobile')
    );
    
    console.log('\n📝 Mobile-related logs:', mobileLogs);
    
    // Check React state for isMobile
    const reactState = await page.evaluate(() => {
      // Try to find React fiber
      const app = document.querySelector('#__next');
      if (!app) return { error: 'No app element' };
      
      const reactKey = Object.keys(app).find(key => 
        key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance')
      );
      
      if (!reactKey) return { error: 'No React fiber' };
      
      try {
        let fiber = app[reactKey];
        
        // Traverse up to find component with isMobile state
        while (fiber) {
          if (fiber.memoizedState && typeof fiber.memoizedState === 'object') {
            // Check for hooks
            let hook = fiber.memoizedState;
            while (hook) {
              if (hook.memoizedState !== undefined) {
                // This could be our state
                console.log('Found state:', hook.memoizedState);
              }
              hook = hook.next;
            }
          }
          fiber = fiber.return;
        }
        
        return { checked: true };
      } catch (e) {
        return { error: e.message };
      }
    });
    
    console.log('\n⚛️ React State Check:', reactState);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/mobile-check.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();