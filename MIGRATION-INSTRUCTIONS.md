# 📋 Instructions de Migration - Module Horaires Techniciens

## ⚠️ IMPORTANT : Lisez ces instructions avant de commencer !

Cette migration va créer de nouvelles tables et modifier la structure existante pour supporter la gestion des horaires des techniciens.

## 🚀 Étapes de Migration

### 1. Accéder à l'éditeur SQL de Supabase

1. Ouvrez votre navigateur et allez à : https://fmuxjttjlxvrkueaacvy.supabase.co
2. Connectez-vous à votre dashboard Supabase
3. Cliquez sur **SQL Editor** dans le menu de gauche

### 2. Exécuter les scripts dans l'ordre

⚠️ **IMPORTANT** : Exécutez chaque script séparément et vérifiez le résultat avant de passer au suivant.

#### Étape 1 : Créer la table des techniciens
1. Copiez tout le contenu du fichier `supabase/01-create-technicians-table.sql`
2. Collez-le dans l'éditeur SQL
3. Cliquez sur **Run**
4. Vérifiez qu'il n'y a pas d'erreur
5. Testez avec : `SELECT * FROM technicians;`

#### Étape 2 : Créer la table des horaires
1. Copiez tout le contenu du fichier `supabase/02-create-schedules-table.sql`
2. Collez-le dans l'éditeur SQL
3. Cliquez sur **Run**
4. Vérifiez qu'il n'y a pas d'erreur
5. Testez avec : `SELECT * FROM schedules WHERE date = CURRENT_DATE;`

#### Étape 3 : Migrer la table tickets
1. Copiez tout le contenu du fichier `supabase/03-migrate-tickets-table.sql`
2. Collez-le dans l'éditeur SQL
3. Cliquez sur **Run**
4. Vérifiez qu'il n'y a pas d'erreur
5. Testez avec : `SELECT * FROM tickets_with_technician LIMIT 10;`

### 3. Vérifications Post-Migration

Exécutez ces requêtes pour vérifier que tout fonctionne :

```sql
-- Vérifier les techniciens
SELECT * FROM technicians;

-- Vérifier les horaires créés
SELECT COUNT(*) as total_schedules FROM schedules;

-- Vérifier la migration des tickets
SELECT 
  t.id,
  t.title,
  tech.name as technician_name,
  t.date
FROM tickets t
LEFT JOIN technicians tech ON t.technician_id = tech.id
LIMIT 10;

-- Tester la fonction des techniciens disponibles
SELECT * FROM get_available_technicians(CURRENT_DATE);
```

### 4. Finaliser la Migration (OPTIONNEL)

Une fois que vous avez vérifié que tout fonctionne correctement, vous pouvez supprimer l'ancienne colonne :

```sql
-- ⚠️ ATTENTION : Ne faites ceci qu'après avoir testé l'application !
ALTER TABLE tickets DROP COLUMN technician;
```

## 🔧 Prochaines Étapes

1. **Redémarrer l'application** : Arrêtez et redémarrez votre serveur Next.js
2. **Tester les fonctionnalités** : 
   - Les tickets existants doivent toujours s'afficher
   - Les techniciens doivent apparaître dans les filtres
   - Le drag & drop doit continuer à fonctionner

## ❓ En cas de problème

Si quelque chose ne fonctionne pas :

1. **Vérifiez les logs** dans la console Supabase
2. **Testez les requêtes** directement dans l'éditeur SQL
3. **Vérifiez les permissions** RLS si nécessaire

## 📊 Résumé des Changements

- **Nouvelle table `technicians`** : Gère les informations des techniciens
- **Nouvelle table `schedules`** : Gère les horaires et disponibilités
- **Modification de `tickets`** : Utilise maintenant `technician_id` au lieu de `technician`
- **Nouvelles fonctions** : Pour gérer les disponibilités et la charge de travail
- **Nouvelle vue** : `tickets_with_technician` pour faciliter les requêtes

## ✅ Checklist

- [ ] Scripts SQL exécutés dans l'ordre
- [ ] Pas d'erreurs lors de l'exécution
- [ ] Données vérifiées avec les requêtes de test
- [ ] Application redémarrée
- [ ] Fonctionnalités testées

Bonne migration ! 🚀