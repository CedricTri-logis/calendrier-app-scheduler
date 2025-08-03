import { useState, useEffect } from 'react'
import styles from '../styles/Home.module.css'
import { useToast } from '../contexts/ToastContext'

export default function DatabaseStatus() {
  const { showSuccess } = useToast()
  const [status, setStatus] = useState<any>({
    checking: true,
    tables: {},
    error: null
  })

  const checkTables = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!baseUrl || !anonKey) {
        throw new Error('Configuration Supabase manquante')
      }

      const headers = {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Accept-Profile': 'calendar'
      }

      // Vérifier chaque table/vue
      const checks = [
        { name: 'tickets', type: 'table' },
        { name: 'technicians', type: 'table' },
        { name: 'schedules', type: 'table' },
        { name: 'migration_history', type: 'table' },
        { name: 'tickets_with_technician', type: 'view' }
      ]

      const results: any = {}

      for (const check of checks) {
        try {
          const response = await fetch(`${baseUrl}/rest/v1/${check.name}?limit=1`, {
            headers
          })
          
          results[check.name] = {
            exists: response.ok,
            type: check.type,
            status: response.status,
            statusText: response.statusText
          }
        } catch (error) {
          results[check.name] = {
            exists: false,
            type: check.type,
            error: error instanceof Error ? error.message : 'Erreur inconnue'
          }
        }
      }

      setStatus({
        checking: false,
        tables: results,
        error: null
      })
    } catch (error) {
      setStatus({
        checking: false,
        tables: {},
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    }
  }

  useEffect(() => {
    checkTables()
  }, [])

  const allTablesExist = Object.values(status.tables).every((table: any) => table.exists)
  const missingTables = Object.entries(status.tables).filter(([_, table]: [string, any]) => !table.exists)

  const sqlToExecute = `-- Copier et exécuter ce SQL dans Supabase SQL Editor
-- https://supabase.com/dashboard/project/fmuxjttjlxvrkueaacvy/sql

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
  status VARCHAR(50) DEFAULT 'applied',
  checksum VARCHAR(64) NOT NULL,
  execution_time_ms INTEGER
);

-- 5. Ajouter technician_id à tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS technician_id INTEGER REFERENCES technicians(id);

-- 6. Mettre à jour les tickets existants
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

-- 8. Activer RLS
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- 9. Créer les politiques
CREATE POLICY "Read for all" ON technicians FOR SELECT USING (true);
CREATE POLICY "Read for all" ON schedules FOR SELECT USING (true);`

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          🔍 État de la Base de Données
        </h1>

        {status.checking ? (
          <div style={{ marginTop: '2rem' }}>
            ⏳ Vérification en cours...
          </div>
        ) : status.error ? (
          <div style={{ 
            marginTop: '2rem',
            padding: '2rem',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '8px'
          }}>
            <h2>❌ Erreur</h2>
            <p>{status.error}</p>
          </div>
        ) : (
          <div style={{ marginTop: '2rem', width: '100%', maxWidth: '800px' }}>
            <div style={{
              padding: '2rem',
              backgroundColor: allTablesExist ? '#d4edda' : '#fff3cd',
              color: allTablesExist ? '#155724' : '#856404',
              borderRadius: '8px',
              marginBottom: '2rem'
            }}>
              <h2>
                {allTablesExist 
                  ? '✅ Toutes les tables sont présentes !' 
                  : `⚠️ ${missingTables.length} table(s) manquante(s)`}
              </h2>
            </div>

            <h3>État des tables :</h3>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              marginBottom: '2rem'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Table/Vue</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Type</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>État</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Détails</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(status.tables).map(([name, info]: [string, any]) => (
                  <tr key={name} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <code>{name}</code>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {info.type}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {info.exists ? '✅ Existe' : '❌ Manquante'}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: '#6c757d' }}>
                      {info.error || `HTTP ${info.status}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!allTablesExist && (
              <>
                <div style={{
                  padding: '2rem',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '8px',
                  marginBottom: '2rem'
                }}>
                  <h3>📋 Instructions pour corriger :</h3>
                  <ol style={{ marginBottom: '1rem' }}>
                    <li>Cliquez sur le bouton "Copier le SQL" ci-dessous</li>
                    <li>Ouvrez l'éditeur SQL de Supabase</li>
                    <li>Collez le SQL et cliquez sur "Run"</li>
                    <li>Revenez ici et cliquez sur "Revérifier"</li>
                  </ol>
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(sqlToExecute)
                        showSuccess('SQL copié dans le presse-papier!')
                      }}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#0070f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '1rem'
                      }}
                    >
                      📋 Copier le SQL
                    </button>
                    
                    <a
                      href="https://supabase.com/dashboard/project/fmuxjttjlxvrkueaacvy/sql"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#28a745',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}
                    >
                      🚀 Ouvrir Supabase SQL
                    </a>
                  </div>
                </div>

                <details>
                  <summary style={{ cursor: 'pointer', marginBottom: '1rem' }}>
                    Voir le SQL à exécuter
                  </summary>
                  <pre style={{
                    padding: '1rem',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    overflow: 'auto',
                    fontSize: '0.85rem'
                  }}>
                    {sqlToExecute}
                  </pre>
                </details>
              </>
            )}

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button
                onClick={checkTables}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🔄 Revérifier
              </button>
              
              <a href="/" style={{ 
                padding: '0.5rem 1rem',
                color: '#0070f3', 
                textDecoration: 'none',
                display: 'inline-block'
              }}>
                ← Retour au calendrier
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}