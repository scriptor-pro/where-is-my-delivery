# Ding-Dong — extension Firefox de proximité de livraison Amazon

Date : 2026-09-09

## Contexte et objectif

Amazon affiche, sur sa page de suivi de livraison en temps réel (statut
« En cours de livraison »), une carte avec un texte de proximité précis :
« N livraisons avant la vôtre. » (élément `.H_ib_content`). Cette donnée
n'est exploitée nulle part par Amazon pour notifier l'utilisateur de façon
proactive au moment où le livreur devient effectivement proche — seule une
consultation manuelle de la page permet de le savoir.

Ding-Dong est une extension Firefox qui surveille cette page pendant
qu'elle est ouverte et déclenche une notification système (avec son)
lorsque le nombre de livraisons restantes avant la vôtre descend à ou
sous un seuil configurable.

Ce n'est pas un remplacement des alertes e-mail Amazon existantes
(« En cours de livraison », déjà actives) : c'est un signal plus fin,
qui n'existe dans aucun canal natif Amazon ni dans l'écosystème
d'extensions Firefox/Chrome actuel (vérifié — aucun concurrent connu).

## Portée

- Fonctionne sur les pages de suivi de livraison Amazon, sur une liste
  explicite des principaux domaines Amazon (.fr, .be, .com, .de, .co.uk,
  .it, .es, .nl, .ca)
- Nécessite que la page de suivi reste ouverte dans un onglet (pas de
  surveillance en arrière-plan sans onglet ouvert — limite acceptée,
  documentée dans le README)
- Une seule notification par livraison suivie, même si la page est
  rechargée ou revisitée après coup (anti-doublon persistant)
- Seuil de déclenchement configurable par l'utilisateur (défaut : 0 —
  notifie quand c'est le prochain arrêt)

## Hors périmètre (explicitement exclu)

- Pas de surveillance sans onglet ouvert (nécessiterait un accès API
  Amazon non public — hors de portée)
- Pas de multi-langue au lancement (le texte détecté est en français ;
  le support d'autres langues Amazon nécessiterait des regex
  supplémentaires, à ajouter plus tard si besoin)
- Pas de synchronisation multi-appareils des préférences (stockage
  `storage.local`, pas `storage.sync`, pour rester simple v1)

## Architecture

Manifest V3, avec une page d'arrière-plan persistante (supportée par
Firefox contrairement à Chrome MV3 — nécessaire ici pour jouer un son
de façon fiable).

```
manifest.json
background.js       — logique de notification, stockage, anti-doublon
content.js          — détection DOM sur la page de suivi
options.html         — popup de configuration du seuil
options.js
sounds/alert.mp3
icons/
  icon-48.png
  icon-96.png
```

### content.js — détection

- Ne s'active que si `.pt-status-main-status` est présent sur la page
  ET contient le texte « En cours de livraison » (évite de réagir sur
  n'importe quelle page Amazon)
- `MutationObserver` sur le conteneur parent de la carte de statut,
  observant l'ajout/changement de `.H_ib_content`
- Extraction du nombre via regex sur le texte de `.H_ib_content` :
  `/(\d+)\s+livraisons?\s+avant la vôtre/i`
- Construit une clé unique pour cette livraison à partir de l'URL de
  la page actuelle (`location.href`, normalisée en retirant les
  paramètres de tracking volatils si besoin)
- Envoie `{type: "delivery-count", trackingKey, count}` au background
  via `browser.runtime.sendMessage` à chaque détection/changement

### background.js — décision et notification

- Reçoit les messages du content script
- Lit le seuil configuré depuis `browser.storage.local`
  (`{ threshold: number }`, défaut 0)
- Lit l'état de notification déjà envoyée pour cette `trackingKey`
  depuis `browser.storage.local`
  (`{ notified: { [trackingKey]: true } }`)
- Si `count <= threshold` ET `notified[trackingKey]` n'est pas déjà
  vrai :
  - Déclenche `browser.notifications.create` (titre : « Livraison
    Amazon proche ! », message reprenant le texte exact détecté)
  - Joue `sounds/alert.mp3` depuis le contexte de la page
    d'arrière-plan (`new Audio(...).play()`)
  - Marque `notified[trackingKey] = true` dans le storage

### options.html/js — configuration

- Un champ numérique unique : « Me notifier quand il reste ≤ [N]
  livraisons avant la mienne » (défaut 0, min 0)
- Sauvegarde immédiate dans `browser.storage.local` au changement

## Permissions manifest.json

Note : le format WebExtension `match pattern` n'autorise qu'un seul
wildcard `*` en préfixe de sous-domaine (`*.exemple.com`), jamais un
wildcard dans le TLD lui-même (`*.amazon.*` est invalide et rejeté par
Firefox au chargement). Les domaines Amazon sont donc listés
explicitement.

```json
{
  "manifest_version": 3,
  "permissions": ["storage", "notifications"],
  "host_permissions": [
    "*://*.amazon.fr/*",
    "*://*.amazon.be/*",
    "*://*.amazon.com/*",
    "*://*.amazon.de/*",
    "*://*.amazon.co.uk/*",
    "*://*.amazon.it/*",
    "*://*.amazon.es/*",
    "*://*.amazon.nl/*",
    "*://*.amazon.ca/*"
  ],
  "background": { "scripts": ["background.js"], "persistent": true },
  "content_scripts": [
    {
      "matches": [
        "*://*.amazon.fr/*",
        "*://*.amazon.be/*",
        "*://*.amazon.com/*",
        "*://*.amazon.de/*",
        "*://*.amazon.co.uk/*",
        "*://*.amazon.it/*",
        "*://*.amazon.es/*",
        "*://*.amazon.nl/*",
        "*://*.amazon.ca/*"
      ],
      "js": ["content.js"]
    }
  ]
}
```

## Gestion des erreurs et robustesse

- Si `.H_ib_content` ou `.pt-status-main-status` disparaissent ou
  changent de structure (Amazon peut modifier son DOM sans préavis),
  le content script échoue silencieusement (pas d'erreur bloquante) —
  aucune notification n'est envoyée, comportement dégradé mais sûr.
  Documenté dans le README comme limite connue à surveiller.
- Le stockage `notified` n'est jamais purgé automatiquement dans cette
  v1 — il grossit avec le nombre de livraisons suivies au fil du
  temps. Pas un problème pratique à l'échelle d'un usage personnel
  (quelques dizaines/centaines d'entrées), mais noté comme
  amélioration possible (purge après N jours) si besoin plus tard.

## Tests

- Tests manuels en conditions réelles (pas de suite automatisée
  prévue pour ce projet personnel de petite taille) :
  - Vérifier la détection sur une vraie page de suivi en « En cours de
    livraison »
  - Vérifier qu'aucune notification n'apparaît tant que le compteur
    est au-dessus du seuil
  - Vérifier la notification + son au passage sous le seuil
  - Vérifier l'absence de double notification après rechargement de
    la page
  - Vérifier le changement de seuil via la popup d'options

## Distribution

- Usage personnel uniquement — chargement en tant qu'extension
  temporaire (`about:debugging`) ou signée pour usage personnel via
  `web-ext sign`. Pas de publication sur addons.mozilla.org prévue au
  lancement.
