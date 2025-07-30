# Instructions de Debug pour le problème 14h

## Comment utiliser la page de debug

1. **Accédez à la page de debug** :
   - Cliquez sur le bouton "🐛 Debug 14h" dans la barre de navigation (en jaune/rouge)
   - Ou allez directement à : http://localhost:3000/debug-schedules

2. **Sur la page de debug** :
   - Sélectionnez la date d'aujourd'hui (ou la date problématique)
   - Observez le premier tableau qui montre les horaires dans la base de données
   - Observez le second tableau qui montre la disponibilité calculée pour chaque heure

3. **Ouvrez la console du navigateur** (F12 ou Cmd+Option+I) :
   - Les logs détaillés pour l'heure 14h s'afficheront
   - Cherchez les messages commençant par "[isHourAvailable] Debug 14h"

4. **Vérifiez spécifiquement** :
   - Est-ce que l'heure 14 est marquée comme disponible (✓) ou non (✗) ?
   - Y a-t-il un horaire qui se termine à 14:00 au lieu de 17:00 ?
   - Y a-t-il un horaire de type "unavailable" ou "break" qui commence à 14:00 ?

## Retour sur la vue multi-tech

Après avoir consulté la page de debug, retournez sur la vue multi-tech :
1. Cliquez sur "Calendrier Pro" pour revenir à l'accueil
2. Cliquez sur "Multi-Tech" dans les contrôles de vue
3. Vérifiez si les heures après 14h sont toujours grisées

## Résolution potentielle

Selon ce que vous voyez dans la page de debug :

- **Si les horaires se terminent à 14:00** : Il faudra modifier les données dans la base
- **Si un slot "unavailable" commence à 14:00** : Il faudra le supprimer ou le modifier
- **Si tout semble correct mais que c'est toujours grisé** : Il y a peut-être un problème de cache ou de synchronisation

Faites-moi savoir ce que vous observez !