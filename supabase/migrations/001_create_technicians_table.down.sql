-- Rollback Migration 001: Supprimer la table des techniciens

-- 1. Sauvegarder les données des techniciens existants (optionnel)
-- CREATE TABLE technicians_backup AS SELECT * FROM technicians;

-- 2. Supprimer les politiques RLS
DROP POLICY IF EXISTS "Allow all operations on technicians" ON technicians;

-- 3. Supprimer le trigger
DROP TRIGGER IF EXISTS update_technicians_updated_at ON technicians;

-- 4. Supprimer les index
DROP INDEX IF EXISTS idx_technicians_name;
DROP INDEX IF EXISTS idx_technicians_active;

-- 5. Supprimer la table
DROP TABLE IF EXISTS technicians CASCADE;

-- Note: CASCADE supprimera aussi toutes les références foreign key