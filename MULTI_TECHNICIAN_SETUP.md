# Configuration Multi-Techniciens

Ce guide explique comment activer la fonctionnalité multi-techniciens dans votre application de calendrier.

## Vue d'ensemble

La fonctionnalité multi-techniciens permet d'assigner plusieurs techniciens à un même ticket, ce qui est utile pour les tâches nécessitant une équipe.

## Étapes d'installation

### 1. Appliquer la migration à la base de données

La migration SQL se trouve dans : `supabase/migrations/004_add_multi_technician_support.up.sql`

Pour l'appliquer à votre base de données Supabase :

1. Connectez-vous à votre tableau de bord Supabase
2. Allez dans l'éditeur SQL
3. Copiez et exécutez le contenu du fichier de migration
4. Vérifiez que les tables et fonctions ont été créées avec succès

### 2. Vérifier l'installation

Après avoir appliqué la migration, vérifiez que :

- La table `ticket_technicians` existe
- La vue `tickets_with_all_technicians` est accessible
- Les fonctions RPC suivantes sont disponibles :
  - `add_technician_to_ticket`
  - `remove_technician_from_ticket`
  - `check_all_technicians_availability`

## Utilisation

### Interface utilisateur

1. **Ajouter un technicien supplémentaire** :
   - Survolez un ticket dans la colonne de gauche
   - Cliquez sur le bouton [+] qui apparaît
   - Sélectionnez un technicien disponible dans le popup

2. **Retirer un technicien** :
   - Survolez un ticket avec plusieurs techniciens
   - Cliquez sur le bouton [×] pour retirer le dernier technicien ajouté

3. **Indicateurs visuels** :
   - 👤 : Un seul technicien assigné
   - 👥 : Plusieurs techniciens assignés
   - Les noms des techniciens sont affichés avec "+N" si plus de 2

### Validation de disponibilité

- Le système vérifie automatiquement la disponibilité de chaque technicien
- Les techniciens non disponibles apparaissent en rouge dans le popup
- Un avertissement apparaît pour les techniciens partiellement disponibles

## Structure de la base de données

### Table `ticket_technicians`
```sql
CREATE TABLE ticket_technicians (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id),
  technician_id INTEGER NOT NULL REFERENCES technicians(id),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### Vue `tickets_with_all_technicians`
Cette vue combine les tickets avec tous leurs techniciens assignés en format JSON.

## Rétrocompatibilité

L'implémentation maintient la compatibilité avec l'ancien système :
- Le champ `technician_id` dans la table `tickets` reste utilisable
- Les tickets existants sont automatiquement migrés vers la nouvelle structure
- L'API continue de supporter les deux formats

## Dépannage

Si la migration n'est pas appliquée correctement :

1. Vérifiez les logs d'erreur dans Supabase
2. Assurez-vous que les politiques RLS sont correctement configurées
3. Vérifiez que la fonction `update_updated_at_column()` existe

## Rollback

Pour annuler la fonctionnalité multi-techniciens :
```sql
-- Exécutez le contenu de 004_add_multi_technician_support.down.sql
```

Note : Le rollback ne restaure pas les anciennes données mais préserve la compatibilité.