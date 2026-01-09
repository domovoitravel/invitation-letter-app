# Système d'Invitation Domovoi Travel - TODO

## Fonctionnalités principales
- [x] Schéma de base de données pour les lettres générées
- [x] Service OCR pour extraction des données du passeport
- [x] Service de génération PDF à partir du modèle arménien
- [x] API d'upload et traitement des images de passeport
- [x] Interface d'upload avec validation de format (JPEG, PNG, PDF)
- [x] Composant de prévisualisation et correction des données extraites
- [x] Génération et téléchargement du PDF
- [x] Page d'historique des lettres générées
- [ ] Tests unitaires pour les services critiques
- [ ] Intégration complète et tests end-to-end

## Bugs et améliorations
- [x] Erreur JSON lors de l'upload du passeport ("Unexpected token '<'") - Corrigé en simplifiant le service OCR
- [x] Vérifier la réponse du serveur pour l'extraction OCR - Limitation: PDF non supporté pour le moment, utiliser JPEG/PNG
- [x] OCR ne lit pas correctement les données du passeport - Précision insuffisante - Améliorée avec meilleure reconnaissance
- [x] Améliorer la reconnaissance des formats de passeport (indien, etc.) - Support des formats Surname/Given Name
- [ ] Extraction OCR encore imprécise sur passeport indien - Confond les champs (Surname/Given Name, Date of Birth/Date of Issue)
- [x] Pattern de numéro de passeport ne reconnait pas le format "P5261473" - Corrigé
