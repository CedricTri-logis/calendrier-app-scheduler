-- Table pour suivre l'historique des migrations
CREATE TABLE IF NOT EXISTS migration_history (
  id SERIAL PRIMARY KEY,
  version VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  executed_by VARCHAR(255) DEFAULT 'system',
  rollback_sql TEXT,
  status VARCHAR(50) DEFAULT 'applied' CHECK (status IN ('applied', 'rolled_back', 'failed')),
  checksum VARCHAR(64) NOT NULL,
  execution_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index pour améliorer les performances
CREATE INDEX idx_migration_history_version ON migration_history(version);
CREATE INDEX idx_migration_history_status ON migration_history(status);
CREATE INDEX idx_migration_history_executed_at ON migration_history(executed_at DESC);

-- Fonction pour vérifier si une migration a déjà été exécutée
CREATE OR REPLACE FUNCTION is_migration_applied(p_version VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM migration_history 
    WHERE version = p_version 
    AND status = 'applied'
  );
END;
$$ LANGUAGE plpgsql;

-- Commentaires
COMMENT ON TABLE migration_history IS 'Historique des migrations SQL exécutées sur la base de données';
COMMENT ON COLUMN migration_history.version IS 'Version de la migration (ex: 001, 002, etc.)';
COMMENT ON COLUMN migration_history.checksum IS 'Hash SHA256 du contenu SQL pour détecter les modifications';
COMMENT ON COLUMN migration_history.rollback_sql IS 'Commandes SQL pour annuler cette migration';