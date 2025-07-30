# Intégration de Percy pour les Tests Visuels

## Qu'est-ce que Percy ?

Percy est un outil de test visuel qui capture des screenshots de votre application et détecte automatiquement les changements visuels entre les versions. C'est parfait pour :
- Détecter les régressions visuelles (comme le problème du fond gris après 14h)
- Valider les changements UI avant de merger
- Maintenir la cohérence visuelle

## Installation

### 1. Installer les dépendances Percy

```bash
npm install --save-dev @percy/cli @percy/playwright
```

### 2. Créer un compte Percy (si pas déjà fait)

1. Allez sur https://percy.io
2. Créez un compte gratuit (100 screenshots/mois)
3. Créez un nouveau projet pour "calendrier-app"
4. Récupérez votre `PERCY_TOKEN` dans les settings du projet

### 3. Configurer les variables d'environnement

Ajoutez dans `.env.local` :
```
PERCY_TOKEN=votre_token_percy_ici
```

## Configuration avec Playwright

### 1. Créer un fichier de configuration Percy

Créez `.percy.yml` à la racine :

```yaml
version: 2
snapshot:
  widths:
    - 375   # Mobile
    - 768   # Tablet
    - 1280  # Desktop
    - 1920  # Large desktop
  minHeight: 1024
  percyCSS: |
    /* Masquer les éléments dynamiques */
    .currentTimeLine { display: none !important; }
    /* Fixer l'heure pour les tests */
    .currentTimeText { content: '14:30' !important; }
```

### 2. Créer des tests visuels Percy

Créez `tests/e2e/percy-visual-tests.spec.ts` :

```typescript
import { test } from '@playwright/test'
import percySnapshot from '@percy/playwright'

test.describe('Tests Visuels Percy', () => {
  test('Vue Calendrier - Mois', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    await percySnapshot(page, 'Calendrier - Vue Mois')
  })

  test('Vue Calendrier - Semaine', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.click('button:has-text("Semaine")')
    await page.waitForTimeout(500)
    await percySnapshot(page, 'Calendrier - Vue Semaine')
  })

  test('Vue Calendrier - Jour', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.click('button:has-text("Jour")')
    await page.waitForTimeout(500)
    await percySnapshot(page, 'Calendrier - Vue Jour')
  })

  test('Vue Multi-Tech - Vérification 14h', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.click('button:has-text("Multi-Tech")')
    await page.waitForTimeout(1000)
    
    // Capturer spécifiquement la zone autour de 14h
    await percySnapshot(page, 'Multi-Tech - Vue Complète')
    
    // Scroll pour voir 14h-17h
    await page.evaluate(() => {
      const element = document.querySelector('[class*="timeLabel"]:has-text("14:00")')
      element?.scrollIntoView({ behavior: 'instant', block: 'center' })
    })
    
    await percySnapshot(page, 'Multi-Tech - Zone 14h-17h')
  })

  test('Ticket avec équipe', async ({ page }) => {
    await page.goto('http://localhost:3000')
    // Ajouter un test pour vérifier l'affichage des tickets multi-techniciens
    await percySnapshot(page, 'Tickets - Affichage équipe')
  })
})
```

### 3. Ajouter les scripts NPM

Ajoutez dans `package.json` :

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test:visual": "percy exec -- playwright test tests/e2e/percy-visual-tests.spec.ts",
    "test:visual:update": "percy exec -- playwright test tests/e2e/percy-visual-tests.spec.ts --update-snapshots"
  }
}
```

## Utilisation

### 1. Lancer les tests visuels localement

```bash
# Assurez-vous que l'app tourne sur localhost:3000
npm run dev

# Dans un autre terminal
npm run test:visual
```

### 2. Workflow recommandé

1. **Avant de commencer une feature** :
   - Lancez `npm run test:visual` pour capturer l'état actuel
   
2. **Après vos changements** :
   - Lancez `npm run test:visual` à nouveau
   - Percy va détecter automatiquement les différences
   
3. **Review dans Percy** :
   - Allez sur percy.io pour voir les changements visuels
   - Approuvez ou rejetez les changements

### 3. Intégration GitHub (optionnel)

Percy s'intègre automatiquement avec GitHub :
1. Il ajoute des checks sur vos PRs
2. Montre les changements visuels directement dans la PR
3. Bloque le merge si des changements visuels non approuvés

## Tests spécifiques pour les problèmes actuels

### Test pour le problème 14h

```typescript
test('Vérifier fond après 14h', async ({ page }) => {
  await page.goto('http://localhost:3000')
  await page.click('button:has-text("Multi-Tech")')
  await page.waitForTimeout(1000)
  
  // Capturer et vérifier que le fond reste blanc après 14h
  const element14h = await page.locator('[class*="hourCell"]').nth(7) // 14h est le 8e élément (index 7)
  await element14h.scrollIntoView()
  
  await percySnapshot(page, 'Multi-Tech - Vérification fond 14h', {
    scope: '[class*="technicianColumns"]'
  })
})
```

### Test pour les bordures verticales

```typescript
test('Vérifier bordures complètes', async ({ page }) => {
  await page.goto('http://localhost:3000')
  await page.click('button:has-text("Multi-Tech")')
  await page.waitForTimeout(1000)
  
  // Scroll jusqu'en bas pour vérifier les bordures
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  
  await percySnapshot(page, 'Multi-Tech - Bordures verticales complètes')
})
```

## Avantages de Percy

1. **Détection automatique** : Percy détecte même les plus petits changements visuels
2. **Historique visuel** : Garde un historique de l'évolution de votre UI
3. **Collaboration** : L'équipe peut approuver/rejeter les changements visuels
4. **Cross-browser** : Teste sur différentes tailles d'écran automatiquement
5. **Intégration CI/CD** : S'intègre facilement avec GitHub Actions

## Coûts

- **Gratuit** : 5,000 screenshots/mois (largement suffisant pour un petit projet)
- **Team** : 50$/mois pour 25,000 screenshots
- **Business** : Prix sur demande

Pour votre projet calendrier, le plan gratuit devrait largement suffire !