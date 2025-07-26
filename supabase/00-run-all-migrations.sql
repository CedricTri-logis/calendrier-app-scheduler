-- Script principal pour exécuter toutes les migrations dans l'ordre
-- À exécuter dans l'éditeur SQL de Supabase

-- IMPORTANT : Exécutez ce script étape par étape pour pouvoir vérifier chaque migration

-- =====================================================
-- ÉTAPE 1 : Créer la table des techniciens
-- =====================================================
-- Copiez et exécutez le contenu de 01-create-technicians-table.sql

-- Vérification :
-- SELECT * FROM technicians;

-- =====================================================
-- ÉTAPE 2 : Créer la table des horaires
-- =====================================================
-- Copiez et exécutez le contenu de 02-create-schedules-table.sql

-- Vérification :
-- SELECT * FROM schedules WHERE date = CURRENT_DATE;
-- SELECT * FROM get_available_technicians(CURRENT_DATE);

-- =====================================================
-- ÉTAPE 3 : Migrer la table tickets
-- =====================================================
-- Copiez et exécutez le contenu de 03-migrate-tickets-table.sql

-- Vérification :
-- SELECT * FROM tickets_with_technician LIMIT 10;

-- =====================================================
-- ÉTAPE 4 : Supprimer l'ancienne colonne (APRÈS TESTS)
-- =====================================================
-- Une fois que tout fonctionne correctement, exécutez :
-- ALTER TABLE tickets DROP COLUMN technician;

-- =====================================================
-- RÉSUMÉ DES CHANGEMENTS
-- =====================================================
/*
Nouvelles tables :
- technicians : Gestion des techniciens avec leurs informations
- schedules : Gestion des horaires et disponibilités

Nouvelles colonnes :
- tickets.technician_id : Référence vers technicians.id

Nouvelles fonctions :
- get_available_technicians() : Obtenir les techniciens disponibles
- get_technician_workload() : Calculer la charge de travail
- check_ticket_assignment() : Vérifier la disponibilité lors de l'assignation
- check_schedule_overlap() : Empêcher les chevauchements d'horaires

Nouvelles vues :
- tickets_with_technician : Vue complète des tickets avec infos technicien
*/

-- =====================================================
-- DONNÉES DE TEST (OPTIONNEL)
-- =====================================================
-- Pour tester le système, vous pouvez ajouter quelques indisponibilités :

/*
-- Exemple : Marie Martin en réunion demain matin
INSERT INTO schedules (technician_id, date, start_time, end_time, type, notes)
VALUES (
  (SELECT id FROM technicians WHERE name = 'Marie Martin'),
  CURRENT_DATE + INTERVAL '1 day',
  '09:00',
  '11:00',
  'unavailable',
  'Réunion client importante'
);

-- Exemple : Jean Dupont en vacances la semaine prochaine
INSERT INTO schedules (technician_id, date, start_time, end_time, type, notes)
SELECT 
  (SELECT id FROM technicians WHERE name = 'Jean Dupont'),
  date_series::date,
  '00:00',
  '23:59',
  'vacation',
  'Vacances d''été'
FROM generate_series(
  CURRENT_DATE + INTERVAL '7 days',
  CURRENT_DATE + INTERVAL '14 days',
  '1 day'::interval
) AS date_series;
*/