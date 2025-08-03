const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Testing simple handler attachment...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('📅 Loading calendar page...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Test with a simpler selector
    const result = await page.evaluate(() => {
      // Find all divs that might be day cells
      const allDivs = Array.from(document.querySelectorAll('div'));
      
      // Filter to find potential day cells
      const dayCells = allDivs.filter(div => {
        const text = div.textContent || '';
        // Look for divs that contain just a number (day)
        const dayMatch = text.match(/^(\d{1,2})✓?$/);
        return dayMatch && parseInt(dayMatch[1]) >= 1 && parseInt(dayMatch[1]) <= 31;
      });
      
      // Get info about these cells
      return dayCells.slice(0, 10).map(cell => {
        const parent = cell.parentElement;
        const grandparent = parent?.parentElement;
        
        return {
          text: cell.textContent,
          hasOnDrop: !!parent?.ondrop,
          hasOnDragOver: !!parent?.ondragover,
          parentClass: parent?.className?.slice(0, 50),
          grandparentHasHandlers: !!(grandparent?.ondrop || grandparent?.ondragover),
          attributes: Array.from(parent?.attributes || []).map(attr => ({
            name: attr.name,
            value: attr.value.slice(0, 20)
          }))
        };
      });
    });
    
    console.log('\n📊 Day cells analysis:');
    result.forEach(cell => {
      console.log(`${cell.text}:`, {
        hasOnDrop: cell.hasOnDrop,
        hasOnDragOver: cell.hasOnDragOver,
        parentClass: cell.parentClass,
        grandparentHasHandlers: cell.grandparentHasHandlers
      });
    });
    
    // Try to manually attach a handler and see if it works
    const manualTest = await page.evaluate(() => {
      const cell = document.querySelector('[data-can-drop="true"]');
      if (!cell) return { error: 'No cell with data-can-drop="true" found' };
      
      // Try to add handler directly
      let dropFired = false;
      cell.ondrop = (e) => {
        dropFired = true;
        e.preventDefault();
      };
      
      // Simulate drop
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true
      });
      
      cell.dispatchEvent(dropEvent);
      
      return {
        cellFound: true,
        handlerAttached: !!cell.ondrop,
        dropFired,
        cellClass: cell.className
      };
    });
    
    console.log('\n🎯 Manual handler test:', manualTest);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/simple-handler.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();