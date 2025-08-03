-- Script simple pour créer les séquences manquantes dans Supabase
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Créer les séquences si elles n'existent pas
CREATE SEQUENCE IF NOT EXISTS calendar.tickets_id_seq;
CREATE SEQUENCE IF NOT EXISTS calendar.schedules_id_seq;
CREATE SEQUENCE IF NOT EXISTS calendar.technicians_id_seq;

-- 2. Définir les valeurs de départ basées sur les données existantes
SELECT setval('calendar.tickets_id_seq', COALESCE(MAX(id), 0) + 1, false) FROM calendar.tickets;
SELECT setval('calendar.schedules_id_seq', COALESCE(MAX(id), 0) + 1, false) FROM calendar.schedules;
SELECT setval('calendar.technicians_id_seq', COALESCE(MAX(id), 0) + 1, false) FROM calendar.technicians;

-- 3. Configurer l'auto-incrémentation
ALTER TABLE calendar.tickets ALTER COLUMN id SET DEFAULT nextval('calendar.tickets_id_seq');
ALTER TABLE calendar.schedules ALTER COLUMN id SET DEFAULT nextval('calendar.schedules_id_seq');
ALTER TABLE calendar.technicians ALTER COLUMN id SET DEFAULT nextval('calendar.technicians_id_seq');

-- 4. Donner les permissions nécessaires
GRANT USAGE ON SEQUENCE calendar.tickets_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE calendar.schedules_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE calendar.technicians_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE calendar.tickets_id_seq TO anon;
GRANT USAGE ON SEQUENCE calendar.schedules_id_seq TO anon;
GRANT USAGE ON SEQUENCE calendar.technicians_id_seq TO anon;

-- 5. Vérifier que tout est configuré
SELECT 
  'tickets' as table_name, 
  pg_get_serial_sequence('calendar.tickets', 'id') as sequence,
  currval(pg_get_serial_sequence('calendar.tickets', 'id')) as current_value
UNION ALL
SELECT 
  'schedules' as table_name, 
  pg_get_serial_sequence('calendar.schedules', 'id') as sequence,
  currval(pg_get_serial_sequence('calendar.schedules', 'id')) as current_value
UNION ALL
SELECT 
  'technicians' as table_name, 
  pg_get_serial_sequence('calendar.technicians', 'id') as sequence,
  currval(pg_get_serial_sequence('calendar.technicians', 'id')) as current_value;