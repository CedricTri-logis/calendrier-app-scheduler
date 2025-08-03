const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Testing schedules display after fix...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.text().includes('schedule') || msg.text().includes('Schedule')) {
      console.log('📝 Console:', msg.text());
    }
  });
  
  try {
    console.log('📅 Navigating to schedules page...');
    await page.goto('http://localhost:3000/schedules');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check occupied cells now
    const scheduleInfo = await page.evaluate(() => {
      const occupiedCells = document.querySelectorAll('[class*="occupied"], [class*="scheduleCell"]');
      const gridCells = document.querySelectorAll('[class*="cell"]');
      const timeRanges = Array.from(document.querySelectorAll('[class*="timeRange"]')).map(el => el.textContent);
      
      // Check for schedule content
      const scheduleContent = Array.from(document.querySelectorAll('*'))
        .filter(el => {
          const text = el.textContent || '';
          return text.includes('09:00') || text.includes('17:00') || text.includes('Disponible');
        })
        .slice(0, 10)
        .map(el => ({
          text: el.textContent?.trim().slice(0, 50),
          class: el.className
        }));
      
      return {
        occupiedCellsCount: occupiedCells.length,
        gridCellsCount: gridCells.length,
        timeRanges: timeRanges,
        scheduleContent: scheduleContent
      };
    });
    
    console.log('\n📊 Updated Analysis:');
    console.log('Occupied/Schedule cells:', scheduleInfo.occupiedCellsCount);
    console.log('Total grid cells:', scheduleInfo.gridCellsCount);
    console.log('Time ranges found:', scheduleInfo.timeRanges);
    console.log('Schedule content found:', scheduleInfo.scheduleContent);
    
    // Check weekly totals
    const weeklyTotals = await page.evaluate(() => {
      const totalCells = Array.from(document.querySelectorAll('[class*="totalCell"]'));
      return totalCells.map(cell => cell.textContent);
    });
    
    console.log('\n📊 Weekly totals:', weeklyTotals);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/schedules-after-fix.png', fullPage: true });
    
    console.log('\n✅ Test complete - check screenshot!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();