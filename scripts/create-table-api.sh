#!/bin/bash

# Script pour créer la table via l'API Supabase
# Nécessite la clé service_role (pas la clé anon)

SUPABASE_URL="https://fmuxjttjlxvrkueaacvy.supabase.co"
# Remplacez par votre clé service_role (trouvable dans Settings > API)
SERVICE_ROLE_KEY="your-service-role-key"

# Le SQL à exécuter
SQL_QUERY="CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  color TEXT NOT NULL,
  date DATE,
  hour INTEGER DEFAULT -1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_date ON tickets(date);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY \"Enable all for tickets\" ON tickets
FOR ALL USING (true);

INSERT INTO tickets (title, color) VALUES
  ('Réunion équipe', '#FFE5B4'),
  ('Appel client', '#B4E5FF'),
  ('Révision projet', '#FFB4B4'),
  ('Planning sprint', '#D4FFB4');"

# Exécuter le SQL via l'API REST
curl -X POST "$SUPABASE_URL/rest/v1/rpc/query" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$SQL_QUERY\"}"