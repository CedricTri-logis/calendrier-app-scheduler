const { chromium } = require('playwright');

(async () => {
  console.log('🔧 Testing direct Supabase insert...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Monitor responses
  page.on('response', response => {
    if (response.url().includes('supabase.co')) {
      console.log(`📡 ${response.request().method()} ${response.status()} ${response.url()}`);
    }
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('❌ Console error:', msg.text());
    }
  });
  
  try {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Test direct insert in browser console
    const result = await page.evaluate(async () => {
      try {
        // Access the modules
        const { createClient } = await import('@supabase/supabase-js');
        
        // Get env variables
        const supabaseUrl = 'https://mcencfcgqyquujiejimi.supabase.co';
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseKey) {
          return { error: 'No anon key found' };
        }
        
        // Create direct client
        const directClient = createClient(supabaseUrl, supabaseKey, {
          global: {
            headers: {
              'Accept-Profile': 'calendar',
              'Content-Profile': 'calendar'
            }
          }
        });
        
        console.log('Testing direct ticket insert...');
        
        // Test simple insert
        const { data, error } = await directClient
          .from('tickets')
          .insert({
            title: 'Direct Test Ticket',
            color: '#ff0000',
            technician_id: null
          })
          .select();
        
        if (error) {
          return { 
            step: 'direct_insert_failed',
            error: error.message,
            code: error.code,
            details: error.details
          };
        }
        
        return { 
          step: 'direct_insert_success',
          data: data
        };
        
      } catch (err) {
        return { 
          step: 'javascript_error',
          error: err.message 
        };
      }
    });
    
    console.log('🧪 Direct insert result:', JSON.stringify(result, null, 2));
    
    // Also test with curl-like approach
    console.log('\\n🌐 Testing with fetch API...');
    
    const fetchResult = await page.evaluate(async () => {
      try {
        const response = await fetch('https://mcencfcgqyquujiejimi.supabase.co/rest/v1/tickets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept-Profile': 'calendar',
            'Content-Profile': 'calendar',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            title: 'Fetch Test Ticket',
            color: '#00ff00',
            technician_id: null
          })
        });
        
        const responseText = await response.text();
        
        return {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseText
        };
      } catch (err) {
        return {
          error: err.message
        };
      }
    });
    
    console.log('🌐 Fetch result:', JSON.stringify(fetchResult, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();