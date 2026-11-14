# Plan — chronologie, résumé, quiz retiré, directions du deck

Date : 14 novembre 2026. Application Quorum, HTML/CSS/JS natif, aucun backend.
Source de vérité des données : `data/lois/protection-enfants.json` (gate 5).

## Contraintes globales

- Aucune nouvelle dépendance, aucun CDN, aucune police distante.
- Aucun avis sur la loi. Aucun chiffre inventé : tout nombre affiché existe dans le JSON publié.
- Le vote reste dans `localStorage`, privé.
- Les XP ne récompensent que le processus : renommer ou fusionner un écran ne doit jamais
  ajouter de point pour un choix de vote.
- `node scripts/verifier.mjs` et `node scripts/preuve-gate.mjs` doivent rester verts (11/11).
- Aucun agent ne commit. Les captures et `node scripts/mobile.mjs` sont réservés au contrôleur
  (un seul Chrome à la fois).
- Ne pas modifier `data/lois/protection-enfants.json` : le bloc `quiz` reste publié et contrôlé,
  même si l'interface ne l'affiche plus. Le gate et la preuve restent inchangés.
- Cache : passer `v23` → `v24` dans `index.html` et `quorum-v24` dans `service-worker.js`
  seulement à la fin, quand tout le reste est fait.

## Tâche 1 — « Le fait » devient « La chronologie »

- `js/app.js`, `etapesDe` : l'entrée s'appelle « La chronologie » et pointe vers
  `#/devoir/<id>/chronologie`.
- `ecranFait` : barre « La chronologie », thème « La chronologie », titre inchangé
  « Du dépôt au vote ». Le bouton suivant mène à `/resume` et s'appelle « Voir le résumé ».
- Routeur : `chronologie` rend `ecranFait`. L'ancienne route `fait` redirige vers
  `chronologie` (même procédé que `arguments` → `debat`).
- `PARCOURS` : remplacer `"fait"` par `"chronologie"` et `"texte"` par `"resume"`.

## Tâche 2 — « Les extraits » entrent dans « Le résumé »

- `ecranTexte` devient `ecranResume`, route `resume`. Il affiche, dans cet ordre :
  1. titre « Le résumé », chapeau `loi.resume` (texte déjà publié et contrôlé) ;
  2. un bloc « Ce que change le texte » avec `loi.ce_qui_est_vote.texte` (gras via `gras()`)
     et `loi.ce_qui_est_vote.points` en liste ;
  3. un sous-titre « Ce que dit le texte » et les extraits actuels, sans modification ;
  4. le bouton « Lire l'article entier ».
- Aucun nouveau texte rédigé : uniquement des champs déjà présents dans le JSON publié.
- Routeur : `resume` rend `ecranResume`. `texte` redirige vers `resume`.
- `etapesDe` : l'entrée « Les extraits » devient « Le résumé », route `/resume`.
- La barre de `ecranArticle` revient vers `/resume` avec le libellé « Le résumé ».

## Tâche 3 — La section « Vérifier » et le quiz disparaissent de l'interface

- `ecranChiffres` : supprimer le bloc `<p class="etiquette">Vérifier</p>` et l'appel à
  `carteQuiz`. Garder les chiffres, la règle et le bouton vers le débat.
- Supprimer `carteQuiz`, `reponsesDe` et le gestionnaire `action === "quiz"` devenus inutiles.
- Progression : la clé `quiz` est remplacée par `chiffres`.
  - `progresDe` : défaut `{ lu: false, source: false, oppose: false, chiffres: false }` ;
    migration : si `p.quiz` existe, le recopier dans `p.chiffres` puis le supprimer.
  - `ecranChiffres` marque `chiffres` à l'ouverture (`marquer(loi.id, "chiffres")`).
  - `pointsExploration` compte `p.chiffres` au lieu de `p.quiz`.
  - `etapesDe` : `fait: p.chiffres` pour l'étape « Les chiffres ».
- `data/ref/arbre.json` : ne pas toucher (le tronc utilise `fait`, `lu`, `oppose`, `source`).
- CSS : retirer les règles devenues mortes du quiz (`.carte`, `.quiz__option` et ses états)
  uniquement si `carteQuiz` était leur seul usage ; vérifier avant de supprimer.
- Docs : `docs/demo.md` (étape 6, « répondre au quiz »), `docs/slides.md`,
  `docs/presentation/plan-demo.md`, `README.md` (routes et mentions du quiz) sont alignés.
  `docs/pipeline-freemium.md` décrit la génération : le bloc `quiz` reste au schéma, ne pas
  le contredire.

## Tâche 4 — Les directions du deck deviennent lisibles

- Créer `docs/presentation/README.md` : les trois directions en une page courte
  (nom, idée en une phrase, composition, ce qui la distingue, risque), la recommandation A,
  et le lien vers `index.html` et `3-directions.md`.
- Dans `docs/presentation/index.html`, ajouter en tête de page un résumé visible des trois
  directions (une ligne chacune) pour qu'on les lise sans ouvrir le markdown. Le reste de la
  planche ne change pas.
- Ne pas construire les dix diapos finales : l'utilisateur n'a pas encore choisi.

## Tâche 5 — La méthode de collecte et de retraitement, sur un exemple

- Créer `docs/methode-donnees.md` : mode d'emploi reproductible de la collecte (MCP Hémicycle,
  comptes rendus) au retraitement (JSON, gate), déroulé sur UN exemple complet — le scrutin
  8429, une citation et un chiffre.
- Ne pas dupliquer `docs/pipeline-freemium.md` : ici, un seul fil, avec les identifiants,
  les chemins et les commandes réelles du dépôt.
- Aucun nouveau contenu de loi, aucune affirmation non vérifiée.

## Vérification finale (contrôleur)

1. `node scripts/verifier.mjs` vert.
2. `node scripts/preuve-gate.mjs` 11/11.
3. `node scripts/mobile.mjs` sur toutes les routes, dont `chronologie`, `resume`, `chiffres`,
   et les anciennes `fait`, `texte` (redirections). Aucun débordement à 390 et 360 px.
4. Cache v24 cohérent entre `index.html` et `service-worker.js`.
5. Captures régénérées pour les écrans renommés.
