const { chromium } = require('playwright');

(async () => {
  console.log('🎫 Testing ticket display on calendar...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Monitor console errors
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('ticket')) {
      console.log('📝 Console:', msg.text());
    }
  });
  
  try {
    console.log('📅 Loading main calendar page...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check for tickets in different locations
    const ticketInfo = await page.evaluate(() => {
      // Check sidebar tickets
      const sidebarTickets = document.querySelectorAll('[class*="ticket"]:not([class*="input"])');
      
      // Check calendar tickets
      const calendarTickets = document.querySelectorAll('[draggable="true"]');
      
      // Check for ticket text
      const ticketTexts = Array.from(document.querySelectorAll('*'))
        .filter(el => {
          const text = el.textContent || '';
          return text.includes('Test') || text.includes('Ticket') || text.includes('FIXED');
        })
        .slice(0, 10)
        .map(el => ({
          text: el.textContent?.trim().slice(0, 50),
          class: el.className
        }));
      
      // Check date cells
      const dateCells = document.querySelectorAll('[class*="dayCell"], [class*="day-cell"], [class*="calendar-cell"]');
      
      return {
        sidebarTicketsCount: sidebarTickets.length,
        calendarTicketsCount: calendarTickets.length,
        ticketTexts: ticketTexts,
        dateCellsCount: dateCells.length,
        calendarStructure: {
          hasCalendarGrid: !!document.querySelector('[class*="calendar"], [class*="Calendar"]'),
          hasWeekView: !!document.querySelector('[class*="week"], [class*="Week"]'),
          hasMonthView: !!document.querySelector('[class*="month"], [class*="Month"]')
        }
      };
    });
    
    console.log('\n📊 Ticket Display Analysis:');
    console.log('Sidebar tickets:', ticketInfo.sidebarTicketsCount);
    console.log('Calendar tickets:', ticketInfo.calendarTicketsCount);
    console.log('Date cells found:', ticketInfo.dateCellsCount);
    console.log('Calendar structure:', ticketInfo.calendarStructure);
    console.log('Ticket-related text found:', ticketInfo.ticketTexts);
    
    // Check if tickets are loaded from API
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZW5jZmNncXlxdXVqaWVqaW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjIzNTUzMzMsImV4cCI6MjAzNzkzMTMzM30.2O1-0p-9HkOOIv3gBgKOfisjCuZk5f-J9gBBqwyoJNg';
    const apiResponse = await page.evaluate(async (key) => {
      try {
        const response = await fetch('https://mcencfcgqyquujiejimi.supabase.co/rest/v1/tickets?select=*&order=created_at.desc&limit=5', {
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
          ticketCount: Array.isArray(data) ? data.length : 0,
          firstTickets: Array.isArray(data) ? data.slice(0, 3).map(t => ({
            id: t.id,
            title: t.title,
            date: t.date,
            hour: t.hour,
            technician_id: t.technician_id
          })) : []
        };
      } catch (err) {
        return { error: err.message };
      }
    }, apiKey);
    
    console.log('\n📡 API Check:');
    console.log('API response:', apiResponse);
    
    // Check specific date where tickets should be
    const currentDate = new Date().toISOString().split('T')[0];
    console.log('\n📅 Checking for tickets on date:', currentDate);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/ticket-display-calendar.png', fullPage: true });
    
    // Check sidebar specifically
    const sidebarInfo = await page.evaluate(() => {
      const sidebar = document.querySelector('[class*="sidebar"], [class*="Sidebar"]');
      if (!sidebar) return { found: false };
      
      const ticketElements = sidebar.querySelectorAll('[class*="ticket"]');
      const ticketTitles = Array.from(ticketElements).map(el => el.textContent?.trim());
      
      return {
        found: true,
        ticketCount: ticketElements.length,
        titles: ticketTitles.slice(0, 5)
      };
    });
    
    console.log('\n📋 Sidebar Analysis:', sidebarInfo);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();