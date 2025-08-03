import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ 
      error: 'Configuration Supabase manquante',
      details: 'SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL non défini'
    })
  }

  try {
    console.log('🔧 Utilisation de l\'API REST directe de Supabase...')
    
    // Le SQL complet à exécuter
    const fullSql = `
-- 1. Créer la table technicians
CREATE TABLE IF NOT EXISTS technicians (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(7) NOT NULL DEFAULT '#0070f3',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Insérer les techniciens par défaut
INSERT INTO technicians (name, color) VALUES
  ('Non assigné', '#6c757d'),
  ('Jean Dupont', '#0070f3'),
  ('Marie Martin', '#dc3545'),
  ('Pierre Durand', '#28a745'),
  ('Sophie Bernard', '#6610f2')
ON CONFLICT (name) DO NOTHING;

-- 3. Créer la table schedules
CREATE TABLE IF NOT EXISTS schedules (
  id SERIAL PRIMARY KEY,
  technician_id INTEGER NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- 4. Créer la table migration_history
CREATE TABLE IF NOT EXISTS migration_history (
  id SERIAL PRIMARY KEY,
  version VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  status VARCHAR(50) DEFAULT 'applied' CHECK (status IN ('applied', 'rolled_back', 'failed')),
  checksum VARCHAR(64) NOT NULL,
  execution_time_ms INTEGER
);

-- 5. Ajouter technician_id à tickets si nécessaire
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS technician_id INTEGER REFERENCES technicians(id);

-- 6. Mettre à jour les tickets sans technicien
UPDATE tickets
SET technician_id = (SELECT id FROM technicians WHERE name = 'Non assigné')
WHERE technician_id IS NULL;

-- 7. Créer la vue tickets_with_technician
CREATE OR REPLACE VIEW tickets_with_technician AS
SELECT 
  t.id,
  t.title,
  t.color,
  t.date,
  t.hour,
  t.technician_id,
  tech.name as technician_name,
  tech.color as technician_color,
  tech.is_active as technician_active,
  t.created_at,
  t.updated_at
FROM tickets t
LEFT JOIN technicians tech ON t.technician_id = tech.id;
    `

    // Utiliser l'API REST de Supabase pour exécuter du SQL brut
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Accept-Profile': 'calendar'
      },
      body: JSON.stringify({
        query: fullSql
      })
    })

    if (!response.ok) {
      // Si la fonction query n'existe pas, essayons une approche différente
      console.log('⚠️ La fonction query n\'existe pas, création manuelle des tables...')
      
      // On va créer chaque table individuellement via l'API
      const results = []
      
      // Créer technicians
      const techResponse = await fetch(`${SUPABASE_URL}/rest/v1/technicians`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Accept-Profile': 'public'
        }
      })
      
      if (techResponse.status === 404 || techResponse.status === 400) {
        console.log('❌ Table technicians n\'existe pas')
        results.push({ 
          table: 'technicians', 
          status: 'missing',
          message: 'La table doit être créée manuellement dans Supabase'
        })
      } else {
        results.push({ table: 'technicians', status: 'exists' })
      }
      
      // Vérifier schedules
      const schedResponse = await fetch(`${SUPABASE_URL}/rest/v1/schedules`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Accept-Profile': 'public'
        }
      })
      
      if (schedResponse.status === 404 || schedResponse.status === 400) {
        console.log('❌ Table schedules n\'existe pas')
        results.push({ 
          table: 'schedules', 
          status: 'missing',
          message: 'La table doit être créée manuellement dans Supabase' 
        })
      } else {
        results.push({ table: 'schedules', status: 'exists' })
      }
      
      // Vérifier la vue
      const viewResponse = await fetch(`${SUPABASE_URL}/rest/v1/tickets_with_technician`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Accept-Profile': 'public'
        }
      })
      
      if (viewResponse.status === 404 || viewResponse.status === 400) {
        console.log('❌ Vue tickets_with_technician n\'existe pas')
        results.push({ 
          table: 'tickets_with_technician', 
          status: 'missing',
          message: 'La vue doit être créée manuellement dans Supabase' 
        })
      } else {
        results.push({ table: 'tickets_with_technician', status: 'exists' })
      }
      
      const allExist = results.every(r => r.status === 'exists')
      
      return res.status(200).json({
        success: false,
        message: allExist 
          ? '✅ Toutes les tables existent déjà!' 
          : '❌ Des tables sont manquantes. Veuillez exécuter le SQL manuellement dans Supabase.',
        results,
        sqlToExecute: fullSql,
        instructions: [
          '1. Copiez le SQL ci-dessus',
          `2. Allez sur https://supabase.com/dashboard/project/${SUPABASE_URL.split('//')[1].split('.')[0]}/sql`,
          '3. Collez et exécutez le SQL',
          '4. Rafraîchissez cette page'
        ]
      })
    }
    
    const data = await response.json()
    
    return res.status(200).json({
      success: true,
      message: '✅ Base de données corrigée avec succès!',
      data
    })
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      message: '❌ Erreur lors de la correction. Veuillez exécuter le SQL manuellement.'
    })
  }
}