const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Testing schedules display issue...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Monitor console logs
  page.on('console', msg => {
    if (msg.text().includes('schedule') || msg.text().includes('Schedule')) {
      console.log('📝 Console:', msg.text());
    }
  });
  
  // Monitor network responses
  page.on('response', response => {
    if (response.url().includes('schedules')) {
      console.log(`📡 Schedules response: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    // Navigate to schedules page
    console.log('📅 Navigating to schedules page...');
    await page.goto('http://localhost:3000/schedules');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check page title
    const pageTitle = await page.locator('h1').first().textContent();
    console.log('Page title:', pageTitle);
    
    // Execute JavaScript to check schedules data
    const schedulesData = await page.evaluate(() => {
      // Try to access React component data
      const reactRoot = document.querySelector('#__next');
      
      // Check if schedules are in the DOM
      const scheduleCells = document.querySelectorAll('[class*="schedule"], [class*="Schedule"]');
      const gridCells = document.querySelectorAll('[class*="cell"], [class*="Cell"]');
      const occupiedCells = document.querySelectorAll('[class*="occupied"]');
      
      return {
        scheduleCellsCount: scheduleCells.length,
        gridCellsCount: gridCells.length,
        occupiedCellsCount: occupiedCells.length,
        anyScheduleText: Array.from(document.body.querySelectorAll('*'))
          .map(el => el.textContent)
          .filter(text => text && (text.includes('09:00') || text.includes('17:00')))
          .slice(0, 5)
      };
    });
    
    console.log('\n📊 DOM Analysis:');
    console.log('Schedule cells found:', schedulesData.scheduleCellsCount);
    console.log('Grid cells found:', schedulesData.gridCellsCount);
    console.log('Occupied cells found:', schedulesData.occupiedCellsCount);
    console.log('Time-related text found:', schedulesData.anyScheduleText);
    
    // Check the actual API response data
    const apiData = await page.evaluate(async () => {
      try {
        const response = await fetch('https://mcencfcgqyquujiejimi.supabase.co/rest/v1/schedules?select=*&order=created_at.desc&limit=5', {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
            'Accept-Profile': 'calendar',
            'Content-Profile': 'calendar'
          }
        });
        
        const data = await response.json();
        return {
          status: response.status,
          dataLength: Array.isArray(data) ? data.length : 0,
          firstItem: Array.isArray(data) && data.length > 0 ? data[0] : null
        };
      } catch (err) {
        return { error: err.message };
      }
    });
    
    console.log('\n📡 Direct API Check:');
    console.log('API response:', apiData);
    
    // Check for loading indicators
    const loadingElements = await page.locator('text=Chargement, text=Loading, [class*="loading"], [class*="spinner"]').count();
    console.log('\n⏳ Loading elements found:', loadingElements);
    
    // Check for error messages
    const errorElements = await page.locator('text=Erreur, text=Error, [class*="error"]').count();
    console.log('❌ Error elements found:', errorElements);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/schedules-display-debug.png', fullPage: true });
    
    // Check week selector
    const weekInfo = await page.evaluate(() => {
      const weekText = Array.from(document.querySelectorAll('*'))
        .map(el => el.textContent)
        .filter(text => text && (text.includes('juillet') || text.includes('août')))
        .slice(0, 3);
      
      return weekText;
    });
    
    console.log('\n📅 Week selector info:', weekInfo);
    
    // Check specific grid structure
    const gridStructure = await page.evaluate(() => {
      const grid = document.querySelector('[class*="grid"], [class*="Grid"]');
      if (!grid) return { found: false };
      
      const rows = grid.querySelectorAll('[class*="row"], tr');
      const cells = grid.querySelectorAll('[class*="cell"], td');
      
      return {
        found: true,
        rowCount: rows.length,
        cellCount: cells.length,
        gridClasses: grid.className
      };
    });
    
    console.log('\n🏗️ Grid structure:', gridStructure);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();