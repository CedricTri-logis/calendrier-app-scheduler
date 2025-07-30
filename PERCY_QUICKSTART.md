# Guide Rapide Percy - Tests Visuels

## 🚀 Démarrage Rapide

### 1. Créez un compte Percy
1. Allez sur https://percy.io/signup
2. Connectez-vous avec GitHub (recommandé)
3. Créez un nouveau projet "calendrier-app"
4. Copiez votre `PERCY_TOKEN` depuis Project Settings

### 2. Configurez votre token
```bash
# Ajoutez dans .env.local
echo "PERCY_TOKEN=percy_xxxxxx" >> .env.local
```

### 3. Lancez vos premiers tests visuels
```bash
# Terminal 1 : Lancez l'app
npm run dev

# Terminal 2 : Lancez Percy (après que l'app soit accessible)
export PERCY_TOKEN=percy_xxxxxx  # Ou utilisez votre .env.local
npm run test:visual
```

## 📸 Ce que Percy va capturer

1. **Vue Calendrier** : Mois, Semaine, Jour
2. **Vue Multi-Tech** : 
   - Vue complète
   - Zone critique 14h-17h (pour vérifier le fond)
   - Bas de page (pour vérifier les bordures)
3. **Tickets** : Non planifiés et multi-techniciens
4. **Modals** : Ajout de technicien
5. **Gestion horaires** : Page complète

## 🔍 Voir les résultats

1. Allez sur https://percy.io
2. Cliquez sur votre projet "calendrier-app"
3. Vous verrez :
   - Les nouveaux screenshots (première fois)
   - Les différences visuelles (runs suivants)
   - Un slider pour comparer avant/après

## 💡 Workflow recommandé

### Avant de coder une feature UI :
```bash
npm run test:visual  # Capture l'état actuel
```

### Après vos changements :
```bash
npm run test:visual  # Percy détecte les changements
```

### Pour débugger visuellement :
```bash
npm run test:visual:ui  # Lance Playwright en mode UI
```

## 🎯 Tests spécifiques pour vos bugs

### Bug du fond gris après 14h
Percy capturera automatiquement :
- "Multi-Tech - Zone 14h-17h avec fond"
- Vous pourrez voir si le fond reste blanc ou devient gris

### Bug des bordures verticales
Percy capturera :
- "Multi-Tech - Bordures verticales bas de page"
- Vous verrez si les bordures continuent jusqu'en bas

## 📊 Intégration GitHub (optionnel)

1. Dans Percy : Settings → Integrations → GitHub
2. Connectez votre repo
3. Percy ajoutera automatiquement des checks sur vos PRs
4. Vous verrez les changements visuels directement dans GitHub

## 🆓 Limites du plan gratuit

- 5,000 screenshots/mois
- Historique de 7 jours
- 1 utilisateur

Pour votre projet, c'est largement suffisant !

## ❓ Problèmes courants

### "PERCY_TOKEN not set"
```bash
export PERCY_TOKEN=percy_xxxxxx
# Ou assurez-vous que .env.local est chargé
```

### "Failed to launch browser"
```bash
# Installez les dépendances Playwright
npx playwright install chromium
```

### "Connection refused on localhost:3000"
```bash
# Assurez-vous que l'app tourne
npm run dev
```

## 🎉 C'est tout !

Percy va maintenant :
- Capturer vos écrans automatiquement
- Détecter les moindres changements visuels
- Vous alerter des régressions
- Garder un historique visuel de votre app

Parfait pour éviter des bugs visuels comme celui du fond gris ! 🚀