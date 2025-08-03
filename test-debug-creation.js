const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Debugging creation issues...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Execute direct Supabase queries to test the issue
    const testResult = await page.evaluate(async () => {
      try {
        // Get the supabase client from window
        const supabase = window.supabase;
        if (!supabase) {
          return { error: 'No supabase client found' };
        }
        
        console.log('Testing direct ticket creation...');
        
        // Test 1: Try to get max ID
        console.log('Step 1: Getting max ID...');
        const { data: maxTicket, error: maxError } = await supabase
          .from('tickets')
          .select('id')
          .order('id', { ascending: false })
          .limit(1)
          .single();
        
        if (maxError) {
          console.error('Max ID error:', maxError);
          return { step: 'max_id', error: maxError.message };
        }
        
        const nextId = (maxTicket?.id || 0) + 1;
        console.log('Next ID will be:', nextId);
        
        // Test 2: Try to create ticket with manual ID
        console.log('Step 2: Creating ticket with manual ID...');
        const ticketWithId = {
          id: nextId,
          title: 'Test Debug Ticket',
          color: '#ff0000',
          technician_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { data: createData, error: createError } = await supabase
          .from('tickets')
          .insert([ticketWithId])
          .select()
          .single();
        
        if (createError) {
          console.error('Create error:', createError);
          
          // Test 3: Try without manual ID
          console.log('Step 3: Trying without manual ID...');
          const ticketWithoutId = {
            title: 'Test Debug Ticket No ID',
            color: '#00ff00',
            technician_id: null
          };
          
          const { data: createData2, error: createError2 } = await supabase
            .from('tickets')
            .insert([ticketWithoutId])
            .select()
            .single();
          
          if (createError2) {
            console.error('Create without ID error:', createError2);
            return { 
              step: 'both_failed', 
              withIdError: createError.message,
              withoutIdError: createError2.message,
              nextId 
            };
          } else {
            return { 
              step: 'success_without_id', 
              data: createData2,
              withIdError: createError.message,
              nextId 
            };
          }
        } else {
          return { step: 'success_with_id', data: createData, nextId };
        }
        
      } catch (err) {
        return { error: err.message };
      }
    });
    
    console.log('🧪 Test result:', JSON.stringify(testResult, null, 2));
    
    // Additional test: Check table structure
    const tableInfo = await page.evaluate(async () => {
      try {
        const supabase = window.supabase;
        
        // Try to get table info by attempting different column selections
        const tests = [
          { name: 'all_columns', query: supabase.from('tickets').select('*').limit(1) },
          { name: 'id_only', query: supabase.from('tickets').select('id').limit(1) },
          { name: 'basic_fields', query: supabase.from('tickets').select('id,title,color').limit(1) }
        ];
        
        const results = {};
        
        for (const test of tests) {
          try {
            const { data, error } = await test.query;
            results[test.name] = { success: !error, error: error?.message, dataCount: data?.length || 0 };
          } catch (err) {
            results[test.name] = { success: false, error: err.message };
          }
        }
        
        return results;
      } catch (err) {
        return { error: err.message };
      }
    });
    
    console.log('📋 Table info:', JSON.stringify(tableInfo, null, 2));
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
  } finally {
    await browser.close();
  }
})();