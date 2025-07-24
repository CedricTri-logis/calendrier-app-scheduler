# Guide de configuration du calendrier

## Problème: Erreur 500 au démarrage

Si vous voyez une erreur 500 au démarrage de l'application, c'est probablement parce que la table `tickets` n'existe pas encore dans Supabase.

## Solution rapide

### 1. Vérifier la connexion Supabase
Visitez: http://localhost:3000/test-supabase

Cette page vous indiquera si:
- ✅ La connexion fonctionne et la table existe
- ⚠️ La table n'existe pas (le plus probable)
- ❌ Problème de connexion

### 2. Créer la table dans Supabase

1. Allez sur l'éditeur SQL de Supabase:
   https://supabase.com/dashboard/project/fmuxjttjlxvrkueaacvy/sql/new

2. Copiez tout le contenu du fichier `supabase/create-complete-table.sql`

3. Collez-le dans l'éditeur SQL et cliquez sur "Run"

4. Rechargez la page de test pour vérifier que tout fonctionne

### 3. Retourner à l'application
Une fois la table créée avec succès, vous pouvez retourner à la page principale:
http://localhost:3000

## Structure de la table

La table `tickets` contient:
- `id`: Identifiant unique
- `title`: Titre du ticket
- `color`: Couleur du ticket
- `technician`: Technicien assigné
- `date`: Date planifiée (format YYYY-MM-DD)
- `hour`: Heure (-1 pour toute la journée, 0-23 pour une heure spécifique)
- `created_at`: Date de création
- `updated_at`: Date de dernière modification

## Fonctionnalités disponibles

- ✅ Drag & drop des tickets sur le calendrier
- ✅ Assignation de techniciens
- ✅ Filtrage par technicien
- ✅ Retrait des tickets du calendrier (drag vers la zone de retrait)
- ✅ Synchronisation en temps réel avec Supabase