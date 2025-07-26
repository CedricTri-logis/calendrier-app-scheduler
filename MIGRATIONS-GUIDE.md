# 🚀 Guide du Système de Migration Automatique

## Vue d'ensemble

Le système de migration automatique permet d'exécuter et d'annuler (rollback) des migrations SQL directement depuis l'interface web, sans avoir à copier-coller dans Supabase.

## 🔧 Configuration Initiale

### 1. Ajouter la Service Role Key

Ajoutez cette ligne dans votre fichier `.env.local` :

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtdXhqdHRqbHh2cmt1ZWFhY3Z5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzE0NjkxNCwiZXhwIjoyMDY4NzIyOTE0fQ.xJRLvastt3CkWTTfFPIWLs5pQ17wM51-X3dFLc8vS6U
```

⚠️ **IMPORTANT** : Cette clé donne un accès complet à votre base de données. Ne la partagez JAMAIS et ne la commitez JAMAIS dans Git !

### 2. Créer la fonction RPC dans Supabase

1. Allez sur https://supabase.com/dashboard/project/fmuxjttjlxvrkueaacvy/sql
2. Copiez et exécutez le contenu du fichier `supabase/setup-rpc-function.sql`

### 3. Redémarrer l'application

```bash
# Arrêter le serveur (Ctrl+C) puis :
npm run dev
```

## 📋 Utilisation

### Accéder à l'interface de migration

Allez sur : http://localhost:3001/migrations

### Interface de gestion

L'interface affiche :
- **Résumé** : Total des migrations, appliquées, en attente, échouées
- **Table des migrations** : Liste détaillée avec statut, date, durée
- **Actions** : 
  - Exécuter toutes les migrations en attente
  - Exécuter une migration spécifique
  - Rollback (annuler) une migration

### Première utilisation

1. Cliquez sur "Exécuter toutes les migrations en attente"
2. Les migrations seront exécutées dans l'ordre :
   - `000` : Créer la table d'historique des migrations
   - `001` : Créer la table des techniciens
   - `002` : Créer la table des horaires
   - `003` : Migrer la table des tickets

## 📁 Structure des fichiers de migration

Les migrations sont dans `supabase/migrations/` :

```
000_create_migration_history.up.sql    # Création
000_create_migration_history.down.sql  # Rollback
001_create_technicians_table.up.sql
001_create_technicians_table.down.sql
002_create_schedules_table.up.sql
002_create_schedules_table.down.sql
003_migrate_tickets_table.up.sql
003_migrate_tickets_table.down.sql
```

### Créer une nouvelle migration

1. Créez deux fichiers :
   - `XXX_description.up.sql` (migration)
   - `XXX_description.down.sql` (rollback)
2. `XXX` doit être un nombre à 3 chiffres (004, 005, etc.)
3. Le fichier `.up.sql` contient les changements à appliquer
4. Le fichier `.down.sql` contient les commandes pour annuler

## 🛡️ Sécurité

### Protections intégrées

1. **Transactions** : Chaque migration est exécutée dans une transaction
2. **Checksums** : Détection des modifications non autorisées
3. **Historique** : Tout est tracé dans `migration_history`
4. **Rollback** : Possibilité d'annuler chaque migration

### Bonnes pratiques

1. **Testez en local** avant la production
2. **Sauvegardez** votre base avant des changements majeurs
3. **Vérifiez** le SQL avant d'exécuter
4. **Documentez** vos migrations avec des commentaires

## 🔄 Rollback (Annulation)

Pour annuler une migration :

1. Cliquez sur "↩️ Rollback" à côté de la migration
2. Confirmez l'action
3. Le système exécutera le fichier `.down.sql`

⚠️ **Attention** : Le rollback peut entraîner une perte de données si mal conçu !

## 🐛 Dépannage

### "Table migration_history non trouvée"

Exécutez d'abord la migration `000` qui crée la table d'historique.

### "exec_sql function not found"

Exécutez le script `supabase/setup-rpc-function.sql` dans Supabase.

### "SUPABASE_SERVICE_ROLE_KEY non définie"

Vérifiez que la clé est bien dans `.env.local` et redémarrez le serveur.

## 📊 API Endpoints

- `GET /api/migrations/status` - Statut de toutes les migrations
- `POST /api/migrations/execute` - Exécuter des migrations
- `POST /api/migrations/rollback/[version]` - Annuler une migration

## 🎯 Prochaines étapes

Une fois les migrations exécutées :
1. Vérifiez sur http://localhost:3001/migration-status
2. L'application devrait maintenant utiliser la nouvelle structure
3. Vous pouvez créer la page de gestion des horaires !

## 💡 Tips

- Utilisez `dryRun: true` dans l'API pour tester sans exécuter
- Les migrations sont idempotentes (peuvent être exécutées plusieurs fois)
- Gardez les migrations simples et atomiques
- Documentez toujours le rollback