const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Checking console logs for availability debug...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    if (msg.text().includes('Debug day') || msg.text().includes('availability')) {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text()
      });
    }
  });
  
  try {
    console.log('📅 Loading calendar page...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('\n📝 Console logs:', consoleLogs);
    
    // Check what schedules are passed to calendar
    const calendarProps = await page.evaluate(() => {
      // Try to access React Fiber to get component props
      const calendarElement = document.querySelector('[class*="ModernCalendar"]');
      if (!calendarElement) return { error: 'No calendar element found' };
      
      // Check for React internal properties
      const reactPropsKey = Object.keys(calendarElement).find(key => 
        key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance')
      );
      
      if (reactPropsKey) {
        try {
          const fiber = calendarElement[reactPropsKey];
          const props = fiber.memoizedProps || fiber.pendingProps;
          return {
            hasProps: true,
            schedulesCount: props?.schedules?.length || 0,
            selectedTechnicianId: props?.selectedTechnicianId,
            propsKeys: Object.keys(props || {})
          };
        } catch (e) {
          return { error: 'Could not access React props', details: e.message };
        }
      }
      
      return { error: 'No React fiber found' };
    });
    
    console.log('\n🔧 Calendar Props:', calendarProps);
    
    // Check if we have a technician filter UI
    const filterUI = await page.evaluate(() => {
      // Look for filter elements
      const filters = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent || '';
        return text.includes('Tous les techniciens') || 
               text.includes('Sélectionner un technicien') ||
               text.includes('Technicien :');
      });
      
      return {
        filterElementsFound: filters.length,
        filterTexts: filters.slice(0, 3).map(el => el.textContent?.trim())
      };
    });
    
    console.log('\n🎛️ Filter UI:', filterUI);
    
    // Try clicking on "Tous les techniciens" if found
    const allTechniciansButton = await page.$('text=Tous les techniciens');
    if (allTechniciansButton) {
      console.log('\n✅ Found "Tous les techniciens" button, clicking...');
      await allTechniciansButton.click();
      await page.waitForTimeout(1000);
      
      // Check console logs after click
      console.log('\n📝 Console logs after click:', consoleLogs.slice(-5));
    }
    
    // Final check of availability
    const finalCheck = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('[class*="dayCell"]'));
      const day1Cell = cells.find(cell => {
        const dayNum = cell.querySelector('[class*="dayNumber"]')?.textContent?.trim();
        return dayNum?.startsWith('1');
      });
      
      if (!day1Cell) return { error: 'Day 1 cell not found' };
      
      return {
        hasDropHandler: !!day1Cell.ondrop,
        hasDragOverHandler: !!day1Cell.ondragover,
        className: day1Cell.className,
        hasAvailableBadge: !!day1Cell.querySelector('[class*="availableBadge"]')
      };
    });
    
    console.log('\n🎯 Final Day 1 Check:', finalCheck);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/console-debug.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();