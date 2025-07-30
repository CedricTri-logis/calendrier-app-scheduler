import { test, expect } from '@playwright/test'

test('Inspecter visuellement le problème à 14h15', async ({ page }) => {
  // Aller à la page
  await page.goto('http://localhost:3000')
  
  // Attendre le chargement
  await page.waitForLoadState('networkidle')
  
  // Passer en vue multi-tech
  await page.click('button:has-text("Multi-Tech")')
  
  // Attendre que la vue se charge
  await page.waitForTimeout(1000)
  
  // Prendre une capture d'écran complète
  await page.screenshot({ 
    path: 'screenshot-multi-tech-full.png', 
    fullPage: true 
  })
  
  // Zoomer sur la zone autour de 14h
  const timeColumn = page.locator('.timeColumn').first()
  const hourCells = page.locator('.hourCell')
  
  // Trouver la cellule de 14h
  const cell14h = await page.locator('.timeLabel:has-text("14:00")').first()
  if (await cell14h.isVisible()) {
    const box = await cell14h.boundingBox()
    if (box) {
      // Prendre une capture centrée sur 14h
      await page.screenshot({
        path: 'screenshot-14h-zone.png',
        clip: {
          x: box.x - 100,
          y: box.y - 50,
          width: 800,
          height: 200
        }
      })
    }
  }
  
  // Inspecter les éléments avec les devtools
  console.log('=== Inspection des éléments autour de 14h ===')
  
  // Obtenir tous les hourCell
  const allHourCells = await page.locator('[class*="hourCell"]').all()
  
  for (let i = 0; i < allHourCells.length; i++) {
    const cell = allHourCells[i]
    const classes = await cell.getAttribute('class')
    
    // Vérifier si c'est une cellule autour de 14h
    const parentRow = await cell.locator('..').first()
    const timeLabel = await parentRow.locator('[class*="timeLabel"]').textContent().catch(() => '')
    
    if (timeLabel && (timeLabel.includes('13:') || timeLabel.includes('14:') || timeLabel.includes('15:'))) {
      console.log(`Cell ${timeLabel}: classes="${classes}"`)
      
      // Vérifier le computed style
      const computedStyle = await cell.evaluate(el => {
        const style = window.getComputedStyle(el)
        return {
          background: style.background,
          backgroundColor: style.backgroundColor,
          opacity: style.opacity,
          zIndex: style.zIndex,
          position: style.position
        }
      })
      
      console.log(`  Computed style:`, computedStyle)
    }
  }
  
  // Vérifier la ligne de temps actuelle
  const currentTimeLine = page.locator('[class*="currentTimeLine"]').first()
  if (await currentTimeLine.isVisible()) {
    const position = await currentTimeLine.evaluate(el => {
      const style = window.getComputedStyle(el)
      return {
        top: style.top,
        zIndex: style.zIndex,
        position: style.position
      }
    })
    
    console.log('=== Ligne de temps actuelle ===')
    console.log('Position:', position)
    
    // Calculer où devrait être 14h15
    const expected14h15Position = ((14.25 - 7) / 11) * 100 // 14.25h = 14h15
    console.log(`Position attendue pour 14h15: ${expected14h15Position}%`)
  }
  
  // Inspecter les superpositions potentielles
  const overlappingElements = await page.evaluate(() => {
    const elements = document.querySelectorAll('*')
    const overlaps = []
    
    // Chercher les éléments qui pourraient se superposer autour de 14h
    elements.forEach(el => {
      const rect = el.getBoundingClientRect()
      const style = window.getComputedStyle(el)
      
      // Si l'élément est positionné et a un z-index
      if (style.position !== 'static' && style.zIndex !== 'auto') {
        // Calculer approximativement si c'est dans la zone de 14h (environ 65% de la hauteur)
        const viewportHeight = window.innerHeight
        const relativeTop = rect.top / viewportHeight
        
        if (relativeTop > 0.6 && relativeTop < 0.7) {
          overlaps.push({
            tagName: el.tagName,
            className: el.className,
            position: style.position,
            zIndex: style.zIndex,
            top: style.top,
            background: style.background || style.backgroundColor
          })
        }
      }
    })
    
    return overlaps
  })
  
  console.log('=== Éléments qui pourraient se superposer ===')
  console.log(overlappingElements)
  
  // Pause pour inspection manuelle si nécessaire
  // await page.pause()
})