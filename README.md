# 📅 Calendrier App - Application de gestion de techniciens

Application moderne de gestion de calendrier pour techniciens avec système multi-techniciens, drag & drop, et validation en temps réel.

## 🚀 Fonctionnalités principales

- **Calendrier interactif** avec vues Mois/Semaine/Jour/Multi-Tech
- **Drag & Drop** intuitif pour la planification
- **Multi-techniciens** - Assignation de plusieurs techniciens par ticket
- **Gestion des disponibilités** - Horaires, vacances, pauses
- **Validation en temps réel** - Empêche les conflits d'horaires
- **Architecture modulaire** - Code maintenable et testable

## 🛠️ Technologies utilisées

- **Next.js 15** - Framework React
- **TypeScript** - Type safety
- **Supabase** - Base de données et temps réel
- **Zod** - Validation des schémas
- **Jest** - Tests unitaires
- **CSS Modules** - Styles scopés

## 📦 Installation

```bash
# Cloner le repo
git clone https://github.com/CedricTri-logis/calendrier-app.git
cd calendrier-app

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env.local

# Configurer les variables dans .env.local
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 🚀 Démarrage

```bash
# Mode développement
npm run dev

# Build production
npm run build
npm start

# Tests
npm test
npm run test:coverage
```

## 📁 Structure du projet

```
calendrier-app/
├── components/         # Composants React
│   ├── Calendar/      # Conteneur principal du calendrier
│   ├── Controls/      # Contrôles de navigation
│   ├── Sidebar/       # Barre latérale des tickets
│   └── Toast/         # Notifications
├── contexts/          # Context API
│   └── CalendarContext.tsx
├── hooks/             # Hooks personnalisés
├── pages/             # Pages Next.js
├── services/          # Logique métier
├── styles/            # CSS Modules
├── utils/             # Utilitaires
└── __tests__/         # Tests unitaires
```

## 🔧 Configuration Vercel

1. Connectez votre repo GitHub à Vercel
2. Configurez les variables d'environnement :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Déployez depuis la branche `main` ou `nouvelle-branche`

## 📚 Documentation

- [Guide d'installation Supabase](./README-SUPABASE.md)
- [Guide des migrations](./MIGRATIONS-GUIDE.md)
- [Système multi-techniciens](./MULTI_TECHNICIAN_SETUP.md)
- [Résumé du refactoring](./REFACTORING-SUMMARY.md)

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch

# Tests E2E
npm run test:e2e
```

## 🤝 Contribution

1. Fork le projet
2. Créez votre branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📝 License

Ce projet est sous licence privée.