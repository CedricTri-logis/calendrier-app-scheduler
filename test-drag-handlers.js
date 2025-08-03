const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Testing drag handlers and data attributes...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('📅 Loading calendar page...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check data attributes
    const cellData = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('[class*="dayCell"]'));
      
      return cells.slice(0, 10).map((cell, index) => {
        const dayNumber = cell.querySelector('[class*="dayNumber"]')?.textContent?.trim();
        
        return {
          index,
          dayNumber,
          canDrop: cell.getAttribute('data-can-drop'),
          availability: cell.getAttribute('data-availability'),
          hasOnDrop: !!cell.ondrop,
          hasOnDragOver: !!cell.ondragover,
          dropHandler: cell.ondrop ? cell.ondrop.toString().slice(0, 50) : null,
          dragOverHandler: cell.ondragover ? cell.ondragover.toString().slice(0, 50) : null
        };
      });
    });
    
    console.log('\n📊 Cell Data Attributes:');
    cellData.forEach(cell => {
      if (cell.dayNumber && parseInt(cell.dayNumber) > 0) {
        console.log(`Day ${cell.dayNumber}:`, {
          canDrop: cell.canDrop,
          availability: cell.availability,
          hasHandlers: cell.hasOnDrop && cell.hasOnDragOver
        });
      }
    });
    
    // Try a different approach - check event listeners
    const eventListeners = await page.evaluate(() => {
      const cell = Array.from(document.querySelectorAll('[class*="dayCell"]'))
        .find(c => c.querySelector('[class*="dayNumber"]')?.textContent?.includes('1'));
      
      if (!cell) return { error: 'Cell not found' };
      
      // Try to get event listeners (this might not work in all browsers)
      const listeners = {
        hasEventListeners: false,
        cellHTML: cell.outerHTML.slice(0, 200)
      };
      
      // Test if we can manually trigger events
      try {
        const dropEvent = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer: new DataTransfer()
        });
        
        // Add a test listener
        let dropCalled = false;
        const testListener = (e) => { dropCalled = true; };
        cell.addEventListener('drop', testListener);
        cell.dispatchEvent(dropEvent);
        cell.removeEventListener('drop', testListener);
        
        listeners.manualDropWorks = dropCalled;
      } catch (e) {
        listeners.error = e.message;
      }
      
      return listeners;
    });
    
    console.log('\n🎯 Event Listener Test:', eventListeners);
    
    // Test if handlers are defined but not attached
    const handlerCheck = await page.evaluate(() => {
      // Check if onDragOver function exists in scope
      return {
        hasReactInternals: !!document.querySelector('[class*="ModernCalendar"]')?.__reactInternalInstance,
        reactVersion: window.React?.version || 'Unknown'
      };
    });
    
    console.log('\n⚛️ React Check:', handlerCheck);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/drag-handlers.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();