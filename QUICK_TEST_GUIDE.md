# 🧪 Guide de Test Rapide - Système Multi-Techniciens

## Tests à effectuer manuellement

### ✅ Test 1 : Création et assignation simple
1. Créer un nouveau ticket "Test installation"
2. Assigner à Tech 1
3. Glisser dans le calendrier au 15 du mois
4. **Vérifier** : Le ticket apparaît avec la couleur de Tech 1

### ✅ Test 2 : Ajout d'un deuxième technicien
1. Survoler le ticket planifié
2. **Vérifier** : Le bouton [+] apparaît
3. Cliquer sur [+]
4. Sélectionner Tech 2 dans le popup
5. **Vérifier** : 
   - L'icône 👥 apparaît sur le ticket
   - Le ticket garde la couleur de Tech 1 (principal)

### ✅ Test 3 : Filtrage par technicien
1. Sélectionner "Tech 1" dans le filtre
2. **Vérifier** : Le ticket multi-tech est visible
3. Sélectionner "Tech 2" dans le filtre
4. **Vérifier** : Le même ticket est toujours visible
5. Sélectionner "Tech 3" dans le filtre
6. **Vérifier** : Le ticket n'est PAS visible

### ✅ Test 4 : Retrait de technicien
1. Glisser le ticket vers "📥 Retirer du calendrier"
2. **Vérifier** : Le ticket apparaît dans la colonne gauche
3. Survoler le ticket
4. **Vérifier** : Le bouton [×] apparaît (pas de [+])
5. Cliquer sur [×]
6. **Vérifier** : Un technicien est retiré, l'icône 👥 disparaît si 1 seul reste

### ✅ Test 5 : Validation des disponibilités
1. Créer un horaire d'indisponibilité pour Tech 3 au 20 du mois
2. Planifier un ticket au 20 du mois
3. Essayer d'ajouter Tech 3
4. **Vérifier** : Message "Ce technicien n'est pas disponible"

### ✅ Test 6 : Edge cases
1. Essayer d'ajouter un technicien déjà assigné
   - **Vérifier** : Le technicien n'apparaît pas dans la liste
2. Essayer de retirer le dernier technicien d'un ticket
   - **Vérifier** : Pas de bouton [×] si 1 seul technicien
3. Essayer d'ajouter un 6e technicien (créer un ticket avec 5 tech)
   - **Vérifier** : Message d'erreur "Maximum 5 techniciens"

## 🎯 Points de vérification clés

| Élément | État attendu | ✓ |
|---------|--------------|---|
| Icône 👥 | Visible si 2+ techniciens | ☐ |
| Bouton [+] | Seulement sur tickets planifiés | ☐ |
| Bouton [×] | Seulement sur tickets non planifiés multi-tech | ☐ |
| Filtrage | Tickets partagés visibles pour tous les tech | ☐ |
| Disponibilité | Validation lors de l'ajout | ☐ |
| Couleur | Toujours celle du tech principal | ☐ |

## 🚨 Si quelque chose ne fonctionne pas

1. **Vérifier la console** : F12 → Console pour les erreurs
2. **Rafraîchir la page** : Ctrl+F5 pour un rechargement complet
3. **Vérifier la base de données** : 
   - Table `ticket_technicians` doit exister
   - Les fonctions RPC doivent être créées
4. **Inspecter l'élément** : Vérifier les classes CSS et les propriétés

## ✅ Validation finale

Si tous les tests passent, le système est fonctionnel à 100% ! 🎉

---
*Guide créé pour validation rapide - 5-10 minutes de test*