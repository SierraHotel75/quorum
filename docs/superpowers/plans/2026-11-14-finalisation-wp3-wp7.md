# Finalisation WP3 → WP7 — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer à 17:30 une démo statique vérifiée (parcours de vote, 16 routes, mobile) et une présentation de 7 minutes.

**Architecture:** L'app statique est déjà complète ; il reste à la vérifier, pas à l'étendre. Chaque tâche produit une preuve observable (sortie de commande, capture, texte du DOM), jamais une impression.

**Tech Stack:** HTML/CSS/JS natif, JSON pré-générés, service worker, scripts Node de contrôle, MCP Hémicycle hors ligne uniquement.

**Spec:** `PLAN.md` (§ cut order, §289 presse, §273 ressources) et `README.md` (GATE 2, modèle de sièges).

## Global Constraints

- Neutralité stricte : aucune opinion, source ou silence, sinon « non documenté ».
- Aucun appel IA ni MCP à l'exécution ; le contenu vient des JSON validés.
- Le vote reste dans `localStorage` ; les XP ne récompensent que le processus.
- Aucune dépendance nouvelle sans accord explicite.
- Sortie purement statique, servie par `python -m http.server 8000`.
- `meta.gate` = `2` ; `node scripts/verifier.mjs` et `node scripts/preuve-gate.mjs` doivent rester verts.
- Toute maquette affichée porte la mention « maquette ».

## Review Focus

- Reprise après remise à zéro du stockage : l'écran `/vote` doit proposer Pour/Contre, pas « Vous avez déjà voté ».
- Changement d'avis : `/resultat` doit dire « changé d'avis » et n'accorder aucun gain.
- `Avec vous` sur la carte : le total doit égaler la somme des groupes du camp choisi, sièges vides exclus.
- Rechargement en pleine page : la route de l'URL doit survivre (pas de retour silencieux à `#/arbre`).
- Restes de démonstration : « démo », « démonstration », « spécialiste » ne doivent plus apparaître sur une loi publiée.

---

### Task 1: Parcours de vote complet

**Files:**
- Modify: `js/app.js` seulement si un défaut est prouvé.
- Test: séquence navigateur, aucune dépendance ajoutée.

**Interfaces:**
- Consumes: `quorum.v1` (`{version, votes:{<id>:{v1,v2,date}}, progres, intro}`), routes `#/devoir/<id>/vote`, `/vote-final`, `/resultat`, `/carte`.
- Produces: verdict binaire « parcours conforme » + trace des 4 écrans.

- [ ] **Step 1: Remettre le stockage à zéro et charger `/vote` en pleine page**

```js
localStorage.setItem("quorum.v1", JSON.stringify({version:1,votes:{},progres:{},intro:true}));
navigate("http://127.0.0.1:8000/#/devoir/protection-souverainete-agricoles/vote")
```

Attendu : deux boutons Pour / Contre, pas de texte « Vous avez déjà voté ».

- [ ] **Step 2: Cliquer Pour, vérifier `v1`**

Attendu : `localStorage["quorum.v1"].votes["protection-souverainete-agricoles"].v1 === "pour"` et redirection vers `/vote-final`.

- [ ] **Step 3: Cliquer Contre, vérifier `v2` et `/resultat`**

Attendu : `v2 === "contre"`, texte « Vous avez changé d'avis … Aucun gain n'en dépend. »

- [ ] **Step 4: Ouvrir `/carte`, activer « Avec vous », lire le total**

Attendu : total = 224 (somme des contre des 12 groupes), sièges vides exclus, légende « Non occupés » présente, zéro erreur console.

- [ ] **Step 5: Consigner la preuve**

Écrire dans `docs/superpowers/plans/2026-11-14-preuves.md` la sortie des 4 vérifications, avec la date.

### Task 2: Balayage des 16 routes

**Files:**
- Modify: `js/app.js` (libellés) si un reste de démo est trouvé.

**Interfaces:**
- Consumes: les 16 routes du routeur (`#/`, `#/devoir/<id>`, `/vote`, `/vote-final`, `/resultat`, `/fait`, `/texte`, `/article`, `/chiffres`, `/arguments`, `/presse`, `/experts`, `/carte`, `#/archive`, `#/arbre`, `#/methode`).
- Produces: tableau route → texte présent / absence de mots interdits / erreurs console.

- [ ] **Step 1: Charger chaque route en pleine page et collecter `document.body.innerText`**

- [ ] **Step 2: Échouer si un texte contient « démo », « démonstration » ou « spécialiste » sur la loi publiée**

- [ ] **Step 3: Échouer si la console contient une erreur**

- [ ] **Step 4: Corriger uniquement les écarts prouvés, puis rejouer le balayage**

Attendu : 16/16 routes propres, 0 erreur.

### Task 3: Mobile 390 px et 360 px

**Files:**
- Modify: `styles/app.css` seulement en cas de débordement prouvé.

**Interfaces:**
- Consumes: les mêmes routes ; mesure `document.documentElement.scrollWidth` vs `innerWidth`.
- Produces: captures `/vote` et `/carte` aux deux largeurs.

- [ ] **Step 1: Fixer la fenêtre à 390×844, mesurer le débordement sur `/`, `/vote`, `/carte`, `/fait`**

Attendu : `scrollWidth <= innerWidth` partout.

- [ ] **Step 2: Refaire la mesure à 360×800**

- [ ] **Step 3: Corriger le premier élément qui déborde, re-mesurer**

- [ ] **Step 4: Capturer `/vote` et `/carte` pour la slide**

### Task 4: Décision WP4 (appareil réel)

**Files:** aucun.

**Interfaces:**
- Consumes: `README.md` § adb ; absence de `platform-tools`.
- Produces: choix explicite « DevTools seulement » ou « adb installé ».

- [ ] **Step 1: Demander l'accord d'installer `platform-tools` (adb), seul point bloquant**

- [ ] **Step 2: Sans accord, acter le repli Chrome DevTools et l'écrire dans les preuves**

- [ ] **Step 3: Avec accord, suivre la procédure `adb tcpip 5555` puis `adb connect <ip>:5555`**

### Task 5: Slides et script de démo

**Files:**
- Create: `docs/superpowers/plans/2026-11-14-slides.md` (plan des 7 slides + script mot à mot des 3 manipulations).

**Interfaces:**
- Consumes: chiffres vérifiés (296/224/41/561/520/1, 577 sièges, 15 vides), citations sourcées, captures de Task 3.
- Produces: 7 slides, script de 7 minutes, une seule phrase de clôture.

- [ ] **Step 1: Écrire les 7 titres et la phrase unique de chaque slide**

- [ ] **Step 2: Écrire le script des 3 manipulations (vote, changement d'avis, carte)**

- [ ] **Step 3: Vérifier que chaque chiffre d'une slide existe dans le JSON publié**

- [ ] **Step 4: Bannir toute capture non étiquetée « maquette »**

### Task 6: Répétition chronométrée

**Files:** aucun.

**Interfaces:**
- Consumes: slides et script de Task 5, app servie sur `127.0.0.1:8000`.
- Produces: temps réel, liste des frictions, correctifs.

- [ ] **Step 1: Dérouler le script une fois, chronomètre visible**

- [ ] **Step 2: Noter chaque hésitation et chaque clic manqué**

- [ ] **Step 3: Supprimer ce qui dépasse 7 minutes**

- [ ] **Step 4: Rejouer une fois ; objectif 6 min 30 – 7 min**

---

## Self-review

- Couverture : WP3 (Tasks 1–3), WP4 (Task 4), WP5 (Task 5), WP6 (Task 6). WP7 est la présentation elle-même, hors plan.
- Chaque étape a un résultat vérifiable ; aucune étape « gérer les cas limites ».
- Les noms de routes et de clés (`v1`, `v2`, `sieges_vides`, `quorum.v1`) sont ceux du code existant.
- Review Focus : chaque ligne est couverte par une étape de Task 1, 2 ou 3.
