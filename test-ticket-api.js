const { chromium } = require('playwright');

(async () => {
  console.log('🎫 Testing ticket API and display...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('📅 Loading calendar page...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Test direct API call with correct key
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZW5jZmNncXlxdXVqaWVqaW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MDA3OTcsImV4cCI6MjA2NzE3Njc5N30.0vMDpwsnwTo7i7Vcb83yfbW8T60bqYBCcEDgEnGyDG0';
    
    const apiData = await page.evaluate(async (key) => {
      const response = await fetch('https://mcencfcgqyquujiejimi.supabase.co/rest/v1/tickets?select=*&order=created_at.desc', {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Accept-Profile': 'calendar',
          'Content-Profile': 'calendar'
        }
      });
      
      const data = await response.json();
      console.log('Raw API response:', data);
      
      return {
        status: response.status,
        data: data,
        headers: Object.fromEntries(response.headers.entries())
      };
    }, apiKey);
    
    console.log('\n📡 API Response:');
    console.log('Status:', apiData.status);
    console.log('Headers:', apiData.headers);
    console.log('Data:', JSON.stringify(apiData.data, null, 2));
    
    // Check tickets in React state
    const reactTickets = await page.evaluate(() => {
      // Try to access React DevTools globals
      const components = document.querySelectorAll('[class*="ModernHome"]');
      if (components.length > 0) {
        // Check window for any exposed data
        return {
          hasReactDevTools: typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined',
          windowKeys: Object.keys(window).filter(k => k.includes('ticket') || k.includes('Ticket'))
        };
      }
      return null;
    });
    
    console.log('\n🔍 React State Check:', reactTickets);
    
    // Check ticketsByDate in DOM
    const calendarData = await page.evaluate(() => {
      // Look for calendar cells with data attributes
      const cells = Array.from(document.querySelectorAll('[class*="dayCell"]'));
      const cellsWithData = cells.map((cell, index) => {
        const dayNumber = cell.querySelector('[class*="dayNumber"]')?.textContent;
        const tickets = cell.querySelectorAll('[class*="ticket"]');
        const content = cell.querySelector('[class*="dayContent"]');
        
        return {
          index,
          dayNumber,
          hasContent: !!content,
          ticketCount: tickets.length,
          cellClasses: cell.className,
          hasDropHandler: !!cell.ondrop
        };
      }).filter(cell => cell.dayNumber && parseInt(cell.dayNumber) > 0);
      
      return {
        totalCells: cells.length,
        cellsWithData: cellsWithData.slice(0, 10) // First 10 cells
      };
    });
    
    console.log('\n📊 Calendar Cells Analysis:');
    console.log('Total cells:', calendarData.totalCells);
    console.log('Sample cells:', calendarData.cellsWithData);
    
    // Check localStorage
    const localStorageData = await page.evaluate(() => {
      return {
        droppedTickets: localStorage.getItem('calendarDroppedTickets'),
        allKeys: Object.keys(localStorage)
      };
    });
    
    console.log('\n💾 LocalStorage:');
    console.log('Keys:', localStorageData.allKeys);
    console.log('Dropped tickets:', localStorageData.droppedTickets);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/ticket-api-debug.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();