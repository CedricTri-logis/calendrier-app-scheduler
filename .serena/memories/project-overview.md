# Projet Calendrier - Vue d'ensemble

## Description
Application calendrier avec drag & drop créée par un débutant en programmation.
Stack : Next.js, TypeScript, React

## Architecture
- **Frontend only** : Pas de backend pour l'instant
- **2 colonnes** : Tickets (30%) | Calendrier (70%)
- **Composants principaux** :
  - `Ticket` : Carte draggable avec id, titre, couleur
  - `Calendar` : Grille mensuelle avec navigation
  - `index.tsx` : Page principale avec état et logique

## Fonctionnalités actuelles
1. **Drag & Drop** : HTML5 natif (pas de librairie)
2. **Tickets** : Création avec formulaire (titre + 5 couleurs)
3. **Calendrier** : Vraies dates, navigation mois par mois
4. **État** : useState pour tickets et positions (pas de persistance)

## État du développement
- Créateur : Débutant complet (première app)
- Phase : MVP fonctionnel
- Prochaines étapes possibles :
  - Sauvegarde locale (localStorage)
  - Suppression de tickets
  - Multiple tickets par jour
  - Déplacer tickets déjà posés

## Points techniques
- TypeScript configuré mais types basiques
- CSS Modules pour le style
- Pas de tests
- Git initialisé, repo sur GitHub