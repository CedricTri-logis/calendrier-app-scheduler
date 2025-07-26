-- Rollback: Supprimer la table d'historique des migrations
-- ATTENTION : Ceci supprimera tout l'historique des migrations !

DROP FUNCTION IF EXISTS is_migration_applied(VARCHAR);
DROP TABLE IF EXISTS migration_history;