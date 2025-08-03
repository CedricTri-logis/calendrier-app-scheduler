const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Debugging availability status...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Inject console logs
  await page.addInitScript(() => {
    // Intercept getDateAvailabilityStatus calls
    window._availabilityLogs = [];
    
    // Override console.log to capture availability checks
    const originalLog = console.log;
    console.log = (...args) => {
      if (args[0] && args[0].toString().includes('availability')) {
        window._availabilityLogs.push(args);
      }
      originalLog.apply(console, args);
    };
  });
  
  try {
    console.log('📅 Loading calendar page...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Add temporary debug logging
    const debugResult = await page.evaluate(() => {
      // Find the React component and check its props/state
      const calendarDiv = document.querySelector('[class*="ModernCalendar"]');
      
      // Check what dates are being used
      const cells = Array.from(document.querySelectorAll('[class*="dayCell"]'));
      const cellDebugInfo = cells.slice(0, 10).map((cell, index) => {
        const dayNumber = cell.querySelector('[class*="dayNumber"]')?.textContent?.trim();
        
        // Try to extract any data attributes or props
        const dataAttrs = {};
        for (let attr of cell.attributes) {
          if (attr.name.startsWith('data-')) {
            dataAttrs[attr.name] = attr.value;
          }
        }
        
        return {
          index,
          dayNumber,
          attributes: dataAttrs
        };
      });
      
      // Check window for exposed data
      const exposedData = {
        hasSchedules: window._schedules !== undefined,
        availabilityLogs: window._availabilityLogs || []
      };
      
      return {
        cellDebugInfo,
        exposedData
      };
    });
    
    console.log('\n🔍 Debug Info:', JSON.stringify(debugResult, null, 2));
    
    // Test the availability function with known data
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZW5jZmNncXlxdXVqaWVqaW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MDA3OTcsImV4cCI6MjA2NzE3Njc5N30.0vMDpwsnwTo7i7Vcb83yfbW8T60bqYBCcEDgEnGyDG0';
    
    const testResult = await page.evaluate(async (key) => {
      // Import the function we want to test
      const testDate = '2025-08-01'; // Today's date
      
      // Fetch schedules to test with
      const response = await fetch('https://mcencfcgqyquujiejimi.supabase.co/rest/v1/schedules?select=*&date=eq.2025-08-01T00:00:00%2B00:00', {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Accept-Profile': 'calendar',
          'Content-Profile': 'calendar'
        }
      });
      
      const schedules = await response.json();
      
      // Also check for any date in August
      const augustResponse = await fetch('https://mcencfcgqyquujiejimi.supabase.co/rest/v1/schedules?select=*&date=gte.2025-08-01T00:00:00%2B00:00&date=lt.2025-09-01T00:00:00%2B00:00', {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Accept-Profile': 'calendar',
          'Content-Profile': 'calendar'
        }
      });
      
      const augustSchedules = await augustResponse.json();
      
      return {
        todaySchedules: schedules,
        augustSchedules: augustSchedules,
        augustDates: Array.isArray(augustSchedules) ? 
          augustSchedules.map(s => ({ date: s.date, type: s.type, technician_id: s.technician_id })) : []
      };
    }, apiKey);
    
    console.log('\n📊 Schedule Analysis:');
    console.log('Schedules for today (2025-08-01):', testResult.todaySchedules);
    console.log('All August schedules:', testResult.augustSchedules);
    console.log('August schedule dates:', testResult.augustDates);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/availability-debug.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();