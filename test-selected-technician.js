const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Testing selected technician and availability...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('📅 Loading calendar page...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check technician selector
    const technicianInfo = await page.evaluate(() => {
      // Find technician selector
      const selector = document.querySelector('select[id*="technician"], select[class*="technician"]');
      let selectedValue = null;
      let options = [];
      
      if (selector) {
        selectedValue = selector.value;
        options = Array.from(selector.options).map(opt => ({
          value: opt.value,
          text: opt.text,
          selected: opt.selected
        }));
      }
      
      // Check for any technician display
      const technicianElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && el.textContent.includes('Tous les techniciens')
      );
      
      return {
        selectorFound: !!selector,
        selectedValue,
        options,
        technicianTextFound: technicianElements.length > 0
      };
    });
    
    console.log('\n👷 Technician Selector:', technicianInfo);
    
    // Try to select "Tous les techniciens" if available
    if (technicianInfo.selectorFound) {
      await page.selectOption('select', { value: '' }); // Empty value usually means "all"
      await page.waitForTimeout(1000);
      
      console.log('\n✅ Selected "Tous les techniciens"');
    }
    
    // Check availability after selection
    const afterSelectionInfo = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('[class*="dayCell"]'));
      
      return cells.slice(4, 10).map((cell, index) => {
        const dayNumber = cell.querySelector('[class*="dayNumber"]')?.textContent?.trim();
        const hasAvailableBadge = !!cell.querySelector('[class*="availableBadge"]');
        
        // Check handlers
        const hasDropHandler = !!cell.ondrop;
        const hasDragOver = !!cell.ondragover;
        
        // Check classes
        const classes = cell.className;
        
        return {
          dayNumber,
          hasAvailableBadge,
          hasDropHandler,
          hasDragOver,
          hasAvailableClass: classes.includes('available'),
          hasPartialClass: classes.includes('partial')
        };
      });
    });
    
    console.log('\n📊 After Selection:', afterSelectionInfo);
    
    // Try manual drag test
    const dragTest = await page.evaluate(() => {
      // Find a ticket
      const ticket = document.querySelector('[draggable="true"]');
      if (!ticket) return { error: 'No draggable ticket found' };
      
      // Find a cell with availability badge
      const availableCell = Array.from(document.querySelectorAll('[class*="dayCell"]'))
        .find(cell => cell.querySelector('[class*="availableBadge"]'));
      
      if (!availableCell) return { error: 'No available cell found' };
      
      // Create drag event
      const dragEvent = new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer()
      });
      
      // Try to trigger drag
      ticket.dispatchEvent(dragEvent);
      
      return {
        ticketFound: true,
        availableCellFound: true,
        dragStarted: dragEvent.defaultPrevented
      };
    });
    
    console.log('\n🎯 Manual Drag Test:', dragTest);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/selected-technician.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();