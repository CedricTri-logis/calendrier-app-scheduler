const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting creation tests...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Monitor errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('❌ Console error:', msg.text());
    }
  });
  
  page.on('response', response => {
    if (response.status() >= 400) {
      console.error(`❌ HTTP ${response.status()}: ${response.url()}`);
    } else if (response.url().includes('supabase.co') && response.status() === 201) {
      console.log(`✅ Created: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    console.log('📍 Navigating to app...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    console.log('📸 Taking initial screenshot...');
    await page.screenshot({ path: 'test-results/creation-test-start.png', fullPage: true });
    
    // Test 1: Look for ticket creation elements
    console.log('\n🎫 === TICKET CREATION TEST ===');
    
    const allButtons = await page.locator('button').all();
    console.log(`Found ${allButtons.length} buttons on page`);
    
    for (let i = 0; i < Math.min(allButtons.length, 20); i++) {
      const text = await allButtons[i].textContent();
      const isVisible = await allButtons[i].isVisible();
      if (isVisible && text) {
        console.log(`  Button ${i + 1}: "${text.trim()}"`);
      }
    }
    
    // Test 2: Look for input fields
    console.log('\n📝 === INPUT FIELDS ANALYSIS ===');
    
    const allInputs = await page.locator('input').all();
    console.log(`Found ${allInputs.length} input fields`);
    
    for (let i = 0; i < Math.min(allInputs.length, 15); i++) {
      const type = await allInputs[i].getAttribute('type');
      const placeholder = await allInputs[i].getAttribute('placeholder');
      const name = await allInputs[i].getAttribute('name');
      const isVisible = await allInputs[i].isVisible();
      
      if (isVisible) {
        console.log(`  Input ${i + 1}: type="${type}" placeholder="${placeholder}" name="${name}"`);
      }
    }
    
    // Test 3: Try to find and interact with creation elements
    console.log('\n🔧 === INTERACTION TEST ===');
    
    // Look for obvious creation buttons
    const createButtons = [
      'button:has-text("Nouveau")',
      'button:has-text("Ajouter")',
      'button:has-text("Créer")',
      'button:has-text("+")',
      'button[title*="nouveau"]',
      'button[title*="ajouter"]'
    ];
    
    for (const selector of createButtons) {
      const button = page.locator(selector).first();
      if (await button.isVisible()) {
        console.log(`✅ Found creation button: ${selector}`);
        const text = await button.textContent();
        console.log(`   Text: "${text}"`);
        
        // Try clicking it
        try {
          await button.click();
          await page.waitForTimeout(1000);
          console.log(`✅ Successfully clicked: ${selector}`);
          
          // Take screenshot after click
          await page.screenshot({ path: `test-results/after-click-${selector.replace(/[^a-zA-Z]/g, '')}.png` });
          
          break; // Stop after first successful click
        } catch (error) {
          console.log(`❌ Failed to click ${selector}: ${error.message}`);
        }
      }
    }
    
    // Test 4: Look for any forms that might be for creation
    console.log('\n📋 === FORM ANALYSIS ===');
    
    const forms = await page.locator('form').all();
    console.log(`Found ${forms.length} forms`);
    
    for (let i = 0; i < forms.length; i++) {
      const formInputs = await forms[i].locator('input').count();
      const formButtons = await forms[i].locator('button').count();
      console.log(`  Form ${i + 1}: ${formInputs} inputs, ${formButtons} buttons`);
    }
    
    console.log('\n📸 Taking final screenshot...');
    await page.screenshot({ path: 'test-results/creation-test-final.png', fullPage: true });
    
    console.log('\n✅ Creation test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();