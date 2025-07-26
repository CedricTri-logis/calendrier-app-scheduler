# 🚨 Instructions pour corriger la base de données

## Problème identifié
Les migrations n'ont pas créé les tables nécessaires dans Supabase. Voici comment corriger le problème.

## Solution rapide

1. **Allez dans l'éditeur SQL de Supabase** :
   https://supabase.com/dashboard/project/fmuxjttjlxvrkueaacvy/sql

2. **Copiez TOUT le contenu du fichier** :
   `supabase/fix-database.sql`

3. **Collez et exécutez** le SQL dans l'éditeur Supabase

4. **Vérifiez que tout est créé** :
   - Table `technicians` ✓
   - Table `schedules` ✓
   - Table `migration_history` ✓
   - Vue `tickets_with_technician` ✓
   - Fonction `get_available_technicians` ✓
   - Fonction `exec_sql` ✓

## Ce que fait le script

1. **Crée toutes les tables manquantes** :
   - `migration_history` : Pour suivre les migrations
   - `technicians` : Pour gérer les techniciens
   - `schedules` : Pour les horaires

2. **Migre les données existantes** :
   - Convertit les anciens noms de techniciens en références ID
   - Préserve tous vos tickets existants

3. **Crée la vue `tickets_with_technician`** :
   - Nécessaire pour que l'application fonctionne
   - Joint automatiquement les tickets avec les infos des techniciens

4. **Configure la sécurité** :
   - Active RLS sur les nouvelles tables
   - Configure les permissions appropriées

## Après l'exécution

1. **Rafraîchissez votre page** : http://localhost:3001
2. **Votre calendrier devrait maintenant fonctionner** ! 🎉
3. **La page des horaires** sera également accessible

## En cas de problème

Si vous avez toujours des erreurs :

1. Vérifiez dans Supabase que toutes les tables sont créées
2. Vérifiez que la vue `tickets_with_technician` existe
3. Essayez de redémarrer le serveur Next.js :
   ```bash
   # Ctrl+C pour arrêter
   npm run dev
   ```

## Note importante

Ce script est idempotent : vous pouvez l'exécuter plusieurs fois sans problème. Il ne créera pas de doublons et ne perdra pas de données.