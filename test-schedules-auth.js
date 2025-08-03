const { chromium } = require('playwright');

(async () => {
  console.log('🔐 Testing schedules authentication issue...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Monitor all responses
  page.on('response', response => {
    if (response.url().includes('schedules')) {
      console.log(`📡 Schedules request: ${response.status()} ${response.url()}`);
      
      if (response.status() === 401) {
        console.error('❌ 401 Unauthorized - Authentication issue detected');
        
        // Log request headers
        response.request().headers().then(headers => {
          console.log('Request headers:', headers);
        });
      }
    }
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error' && msg.text().includes('schedules')) {
      console.error('❌ Console error:', msg.text());
    }
  });
  
  try {
    // Go to schedules page directly
    console.log('📅 Navigating to schedules page...');
    await page.goto('http://localhost:3000/schedules');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Check if page loaded
    const pageTitle = await page.locator('h1').first().textContent();
    console.log('Page title:', pageTitle);
    
    // Try direct API test
    console.log('\n🌐 Testing direct API call...');
    
    const apiResult = await page.evaluate(async () => {
      try {
        // Test with fetch
        const response = await fetch('https://mcencfcgqyquujiejimi.supabase.co/rest/v1/schedules?select=*', {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
            'Accept-Profile': 'calendar',
            'Content-Profile': 'calendar'
          }
        });
        
        return {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        };
      } catch (err) {
        return { error: err.message };
      }
    });
    
    console.log('Direct API result:', apiResult);
    
    // Check if it's specific to schedules or all tables
    console.log('\n🔍 Testing other tables...');
    
    const tablesTest = await page.evaluate(async () => {
      const results = {};
      const tables = ['tickets', 'technicians', 'schedules'];
      
      for (const table of tables) {
        try {
          const response = await fetch(`https://mcencfcgqyquujiejimi.supabase.co/rest/v1/${table}?select=*&limit=1`, {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
              'Accept-Profile': 'calendar',
              'Content-Profile': 'calendar'
            }
          });
          
          results[table] = {
            status: response.status,
            ok: response.ok
          };
        } catch (err) {
          results[table] = { error: err.message };
        }
      }
      
      return results;
    });
    
    console.log('Tables test results:', JSON.stringify(tablesTest, null, 2));
    
    // Check environment variables
    const envCheck = await page.evaluate(() => {
      return {
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL
      };
    });
    
    console.log('\n🔑 Environment check:', envCheck);
    
    await page.screenshot({ path: 'test-results/schedules-auth-test.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();