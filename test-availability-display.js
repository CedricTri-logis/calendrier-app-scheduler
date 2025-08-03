const { chromium } = require('playwright');

(async () => {
  console.log('🗓️ Testing availability display and drag & drop...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('📅 Loading calendar page...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check calendar cells for availability indicators
    const availabilityInfo = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('[class*="dayCell"]'));
      
      return cells.map((cell, index) => {
        const dayNumber = cell.querySelector('[class*="dayNumber"]')?.textContent?.trim();
        const availableBadge = cell.querySelector('[class*="availableBadge"]');
        const partialBadge = cell.querySelector('[class*="partialBadge"]');
        const unavailableBadge = cell.querySelector('[class*="unavailabilityBadge"]');
        
        // Check if cell has drop handlers
        const hasDropHandler = !!cell.ondrop;
        const hasDragOver = !!cell.ondragover;
        
        // Check cell classes
        const classes = cell.className;
        const isUnavailable = classes.includes('unavailable');
        const isPartial = classes.includes('partial');
        const hasEvents = classes.includes('hasEvents');
        
        return {
          index,
          dayNumber,
          hasAvailableBadge: !!availableBadge,
          hasPartialBadge: !!partialBadge,
          hasUnavailableBadge: !!unavailableBadge,
          hasDropHandler,
          hasDragOver,
          isUnavailable,
          isPartial,
          hasEvents,
          cellClasses: classes
        };
      }).filter(cell => cell.dayNumber && parseInt(cell.dayNumber) > 0);
    });
    
    console.log('\n📊 Availability Analysis:');
    console.log('Cells with availability info:', availabilityInfo.filter(c => 
      c.hasAvailableBadge || c.hasPartialBadge || c.hasUnavailableBadge
    ).length);
    console.log('Cells with drop handlers:', availabilityInfo.filter(c => c.hasDropHandler).length);
    console.log('\nFirst 10 cells:', availabilityInfo.slice(0, 10));
    
    // Check schedules API data
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZW5jZmNncXlxdXVqaWVqaW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MDA3OTcsImV4cCI6MjA2NzE3Njc5N30.0vMDpwsnwTo7i7Vcb83yfbW8T60bqYBCcEDgEnGyDG0';
    
    const schedulesData = await page.evaluate(async (key) => {
      const response = await fetch('https://mcencfcgqyquujiejimi.supabase.co/rest/v1/schedules?select=*&order=date.asc', {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Accept-Profile': 'calendar',
          'Content-Profile': 'calendar'
        }
      });
      
      const data = await response.json();
      return {
        status: response.status,
        count: Array.isArray(data) ? data.length : 0,
        sample: Array.isArray(data) ? data.slice(0, 5) : []
      };
    }, apiKey);
    
    console.log('\n📡 Schedules API:');
    console.log('Status:', schedulesData.status);
    console.log('Total schedules:', schedulesData.count);
    console.log('Sample:', schedulesData.sample);
    
    // Test drag functionality
    const dragTestResult = await page.evaluate(() => {
      // Find a ticket
      const ticket = document.querySelector('[draggable="true"]');
      if (!ticket) return { ticketFound: false };
      
      // Find a day cell
      const cells = Array.from(document.querySelectorAll('[class*="dayCell"]'));
      const targetCell = cells.find(cell => {
        const dayNum = cell.querySelector('[class*="dayNumber"]')?.textContent?.trim();
        return dayNum === '5'; // Try to drop on day 5
      });
      
      if (!targetCell) return { ticketFound: true, targetCellFound: false };
      
      // Check if DataTransfer is available
      const hasDataTransfer = typeof DataTransfer !== 'undefined';
      
      return {
        ticketFound: true,
        targetCellFound: true,
        ticketId: ticket.getAttribute('data-ticket-id') || ticket.textContent,
        targetCellDropHandler: !!targetCell.ondrop,
        targetCellDragOverHandler: !!targetCell.ondragover,
        hasDataTransfer
      };
    });
    
    console.log('\n🎯 Drag & Drop Test:', dragTestResult);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/availability-display.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();