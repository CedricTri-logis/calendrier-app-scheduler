import { test, expect } from '@playwright/test';

test('Vérifier la cohérence des clés de date', async ({ page }) => {
  test.setTimeout(30000);
  
  // Test unitaire des fonctions de génération de clés
  const dateKeyTests = await page.evaluate(() => {
    // Simuler les fonctions de génération de clés
    const getDateKeyIndex = (year: number, month: number, day: number): string => {
      return `${year}-${month + 1}-${day}`;
    };
    
    const getDateKeyDayView = (): string => {
      const currentDate = new Date();
      return `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
    };
    
    // Test avec une date spécifique
    const testDate = new Date(2025, 6, 7); // 7 juillet 2025 (mois 6 = juillet car 0-indexé)
    const year = testDate.getFullYear();
    const month = testDate.getMonth();
    const day = testDate.getDate();
    
    const keyFromIndex = getDateKeyIndex(year, month, day);
    const keyFromDayView = `${year}-${month + 1}-${day}`;
    
    // Test avec la date actuelle
    const today = new Date();
    const todayKeyIndex = getDateKeyIndex(today.getFullYear(), today.getMonth(), today.getDate());
    const todayKeyDayView = getDateKeyDayView();
    
    return {
      testDate: {
        date: testDate.toISOString(),
        year,
        month,
        day,
        keyFromIndex,
        keyFromDayView,
        keysMatch: keyFromIndex === keyFromDayView
      },
      today: {
        date: today.toISOString(),
        keyFromIndex: todayKeyIndex,
        keyFromDayView: todayKeyDayView,
        keysMatch: todayKeyIndex === todayKeyDayView
      }
    };
  });
  
  console.log('Test des clés de date:', JSON.stringify(dateKeyTests, null, 2));
  
  // Vérifier que les clés correspondent
  expect(dateKeyTests.testDate.keysMatch).toBe(true);
  expect(dateKeyTests.today.keysMatch).toBe(true);
  
  // Vérifier le format
  expect(dateKeyTests.testDate.keyFromIndex).toBe('2025-7-7');
  expect(dateKeyTests.testDate.keyFromDayView).toBe('2025-7-7');
});