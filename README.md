# Where Is My Delivery?

Extension Firefox qui surveille une page de suivi de livraison Amazon
ouverte dans un onglet et déclenche une notification (avec son) quand
le livreur devient vraiment proche.

## Pourquoi

Amazon affiche un compteur précis ("N livraisons avant la vôtre.") sur
sa carte de suivi en temps réel une fois le colis "En cours de
livraison" — mais ne notifie jamais proactivement sur ce signal. Les
alertes e-mail natives d'Amazon ne couvrent que les changements de
statut globaux (expédié, en cours de livraison, livré), pas la
proximité fine du livreur.

## Installation (usage personnel, non publié)

### Firefox

1. Ouvrir `about:debugging#/runtime/this-firefox` dans Firefox
2. Cliquer sur "Load Temporary Add-on…"
3. Sélectionner le fichier `manifest.json` de ce répertoire

Note : une extension chargée en "temporaire" est retirée à la fermeture
de Firefox et doit être rechargée à chaque session. Pour une
installation permanente, signer l'extension via `web-ext sign` (compte
développeur Mozilla requis, gratuit).

### Chrome / Chromium

1. Ouvrir `chrome://extensions`
2. Activer le "Mode développeur" (interrupteur en haut à droite)
3. Cliquer sur "Charger l'extension non empaquetée"
4. Sélectionner le dossier `chrome/` de ce répertoire

Version adaptée pour Manifest V3 Chrome : service worker au lieu d'un
script d'arrière-plan classique, `chrome.*` au lieu de `browser.*`, et
lecture du son via un document offscreen (`chrome/offscreen.html`)
puisqu'un service worker n'a pas accès à l'API `Audio`. Comme pour
Firefox, une extension chargée ainsi est retirée à la fermeture du
navigateur.

## Configuration

Cliquer sur l'icône de l'extension dans la barre d'outils pour régler le
seuil de déclenchement (nombre de livraisons restantes avant la
vôtre). Par défaut : 0 (notifie quand vous êtes le prochain arrêt).

## Limites connues

- Ne fonctionne que si la page de suivi de livraison est ouverte dans
  un onglet — aucune surveillance en arrière-plan sans onglet ouvert.
- Détection en français uniquement ("En cours de livraison", "N
  livraisons avant la vôtre") — Amazon dans une autre langue
  d'affichage ne sera pas détecté.
- Si Amazon modifie la structure de sa page de suivi (classes CSS,
  texte exact), la détection peut cesser de fonctionner silencieusement
  — pas d'erreur visible, juste une absence de notification. Aucune
  garantie de stabilité à long terme puisque ceci s'appuie sur une page
  non documentée publiquement par Amazon.
- Le stockage interne des livraisons déjà notifiées grossit sans jamais
  être purgé (négligeable à l'échelle d'un usage personnel).
- Deux messages de comptage qualifiants arrivant à quelques millisecondes
  d'intervalle peuvent chacun lire l'état "pas encore notifié" avant que
  l'un des deux ne l'écrive (condition de course sur `storage.local`),
  produisant occasionnellement une notification en double pour la même
  livraison. Sans conséquence (pas de perte de données, pas de plantage)
  et jugé disproportionné à corriger pour un usage personnel — voir
  Task 5 du plan.

## Tests

Les tests unitaires couvrent uniquement la logique pure
(extraction du compteur, décision de notification) :

```bash
node --test tests/*.test.js
```

Le reste (détection DOM, notification navigateur) se vérifie
manuellement — voir `docs/superpowers/plans/2026-09-09-ding-dong-v1.md`,
Task 6.
