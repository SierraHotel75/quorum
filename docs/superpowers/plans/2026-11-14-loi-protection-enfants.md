# Plan — loi « protection des enfants », clause révélée

> **Pour les agents :** exécuter lot par lot. Chaque lot possède ses fichiers ; aucun lot n'écrit dans les fichiers d'un autre. Aucun commit n'est fait par un lot.

**Spec :** `docs/superpowers/specs/2026-11-14-clause-revelee-design.md`
**Objectif :** une seule loi publiée, le scrutin 8429, avec le bloc `variante` qui montre la clause supprimée par le scrutin 8428.

**Contraintes globales**
- Neutralité stricte : aucun jugement sur la perpétuité, la sûreté ou les auteurs d'amendement.
- Aucun chiffre qui ne vienne de Hémicycle, recopié tel quel.
- Aucun appel MCP ni IA à l'exécution de l'app.
- Aucune dépendance nouvelle.
- JSON en UTF-8 sans BOM. Écrire avec `[IO.File]::WriteAllText($p, $t, (New-Object Text.UTF8Encoding($false)))` sous PowerShell.
- Le trait d'union non sécable `U+2011` des textes officiels est conservé tel quel.

---

## Lot A — contrôles (sous-agent)

**Fichiers possédés :** `scripts/verifier.mjs`, `scripts/preuve-gate.mjs`, `data/lois/_demo.json`, `data/lois/_archive-protection-souverainete-agricoles.json`

**Tâches**
- [ ] A1. `GATE = "3"`. Ajouter `"Variante contrôlée": "WP1.7"` à `CONTROLES`.
- [ ] A2. Écrire `verifierVariante(loi, r)` avec les six règles de la spec :
      1. `reference` non vide ;
      2. `avant` verbatim dans `texte_source` (via `normaliser`) ;
      3. `avant` absent du texte des `articles[].paragraphes` ;
      4. `supprimee_par` : `pour+contre+abstention == votants`, `pour+contre == suffrages_exprimes`, `sort === "adopté"`, `pour > contre`, entiers ≥ 0 ;
      5. `source_avant.url` HTTPS + domaine autorisé ;
      6. `supprimee_par.scrutin !== scrutin.id`.
- [ ] A3. Appeler `verifierVariante` seulement si `loi.variante` existe. Un fichier sans `variante` reste valide.
- [ ] A4. `meta.controles` doit citer « Variante contrôlée » **seulement** quand le bloc existe ; sinon le journal reste à 7 entrées. Adapter la vérification du journal pour ne pas exiger WP1.7 sur un fichier sans variante.
- [ ] A5. `data/lois/_demo.json` : passer `meta.gate` à `"3"`, ajouter un bloc `variante` minimal et cohérent (clause inventée mais placée dans son `texte_source`, absente des articles).
- [ ] A6. `scripts/preuve-gate.mjs` : ajouter deux cas négatifs.
      - variante dont `avant` est absent de `texte_source` → refus, code WP1.7 ;
      - variante dont `avant` est encore présent dans les articles adoptés → refus, code WP1.7.
      Porter le total à 7 cas sur 7.
- [ ] A7. Déplacer `data/lois/protection-souverainete-agricoles.json` vers `data/lois/_archive-protection-souverainete-agricoles.json` et y passer `meta.gate` à `"3"`.

**Acceptation**
```
node scripts/verifier.mjs data/lois/_demo.json
node scripts/preuve-gate.mjs
```
Doit afficher la variante acceptée en positif et les deux refus attendus, `7 cas sur 7`.

---

## Lot B — données (sous-agent)

**Fichiers possédés :** `data/lois/protection-enfants.json`, `data/lois/index.json`, `data/ref/medias.json`, `data/ref/experts.json`

**Décomptes déjà agrégés (ne pas re-payer) — scrutin 8429**

| groupe | id | pour | contre | abst | non-votants |
|---|---|---|---|---|---|
| LFI-NFP | LFI | 0 | 43 | 1 | 0 |
| Écologiste et Social | ECO | 1 | 16 | 5 | 0 |
| Gauche Démocrate et Républicaine | GDR | 3 | 2 | 0 | 0 |
| Socialistes et apparentés | SOC | 9 | 20 | 4 | 0 |
| Libertés, Indépendants, Outre-mer | LIOT | 9 | 1 | 0 | 0 |
| Les Démocrates | DEM | 21 | 1 | 0 | 0 |
| Ensemble pour la République | EPR | 53 | 1 | 0 | 1 |
| Horizons & Indépendants | HOR | 22 | 0 | 0 | 0 |
| Droite Républicaine | DR | 37 | 0 | 0 | 0 |
| Rassemblement National | RN | 89 | 0 | 0 | 0 |
| Union des droites pour la République | UDR | 8 | 0 | 0 | 0 |
| Non inscrit | NI | 6 | 0 | 0 | 0 |

`sieges` par groupe = pour+contre+abst+non-votants. `sieges_vides = 224`.
Scrutin : 258 / 84 / 10 / 1 non-votant / 352 votants / 342 exprimés, majorité absolue des suffrages exprimés, `VTANR5L17V8429`, 2026-07-21.

**Décompte 8428 (pour `variante.supprimee_par`)** : 178 / 163 / 5 / 1 non-votant / 346 votants / 341 exprimés, `VTANR5L17V8428`.

**Tâches**
- [ ] B1. Récupérer par MCP l'article 11 du texte **adopté** `PRJLANR5L17BTA0338` (jeu `articles_textes`) et le recopier intégralement dans `articles[0].paragraphes`, un paragraphe par alinéa, sans reformulation.
- [ ] B2. Récupérer l'article 11 du texte de la **commission** `PRJLANR5L17BTC3018` et le recopier dans `variante.texte_source`. `variante.avant` = la phrase exacte « La cour d'assises peut toutefois, par décision spéciale, porter la période de sûreté jusqu'à trente ans. » telle qu'elle figure dans ce texte (trait d'union U+2011 conservé).
- [ ] B3. `nb_phrases` = nombre de phrases du seul champ `articles[].paragraphes`, compté avec la règle du vérificateur (`[^.!?]+[.!?]+` sur le texte normalisé).
- [ ] B4. Chronologie depuis `actes` du dossier `DLR5L17N54372`, dates croissantes, maillons `AN` / `SENAT` / `CMP` / `COMMISSION` / `GOUVERNEMENT` uniquement. Ne garder que les étapes datées.
- [ ] B5. `extraits` : 6 à 9 passages **verbatim** de l'article 11 adopté, dont un extrait sur la mention « (Supprimé) ». Chaque extrait porte `article: "Article 11"` et une étiquette `aujourdhui` / `si_adopte` / `concerne`.
- [ ] B6. `arguments` : 2 pour, 2 contre, chacun avec titre, texte, `source` et `url` sur `assemblee-nationale.fr` ou `senat.fr`. Aucun jugement.
- [ ] B7. `presse` : étendre `data/ref/medias.json` avec les médias nationalaux les plus connus, de tous les bords, chacun avec nom, domaine et `rss` vérifié. Deux colonnes classées par **catégorie observable** (quotidienne nationale / hebdomadaire et numérique), jamais par bord politique. 2 titres par colonne, date et URL réelles. Si un titre ne peut pas être vérifié, ne pas l'inventer.
- [ ] B8. `experts` : étendre `data/ref/experts.json` (nom, affiliation, rôle, url officielle) puis 2 ressources par colonne.
- [ ] B9. `quiz` : 2 questions dont une porte sur le scrutin 8428 et une sur le contenu de l'article 11 adopté.
- [ ] B10. `data/lois/index.json` : une seule entrée, `protection-enfants`. Retirer l'entrée agricole.
- [ ] B11. `meta.gate = "3"`, `meta.controles` avec les 8 entrées (dont « Variante contrôlée »).

**Acceptation** : `node scripts/verifier.mjs` ne signale que les écarts de schéma corrigeables par B. Le lot A doit être passé avant de conclure.

---

## Lot C — lecture (moi, après B)

**Fichiers possédés :** `js/app.js`, `styles/app.css`

- [ ] C1. Dans l'écran `article`, si `loi.variante`, rendre le bloc « Ce qui a changé » (référence, citation, décompte 8428, « b) (Supprimé) », lien source).
- [ ] C2. Échappement HTML systématique (`esc`), aucun `innerHTML` de donnée brute.
- [ ] C3. Styles : bois éditorial, pas de bordeaux, pas de couleur d'opinion.
- [ ] C4. Vérifier 390 et 360 px avec `node scripts/mobile.mjs`.

## Lot D — intégration (moi, en dernier)

- [ ] D1. `index.html` : `?v=10`, `service-worker.js` : `quorum-v10`.
- [ ] D2. `README.md` : nouveau fichier de loi, gate 3, bloc `variante`.
- [ ] D3. Balayage des 16 routes + parcours de vote + captures.
- [ ] D4. `docs/demo.md` et `docs/slides.md` : remplacer les chiffres agricoles par 258/84/10 et 178/163.

---

## Self-review

- Chaque lot a une liste de fichiers fermée et une commande d'acceptation.
- Aucun lot ne dépend d'un fichier qu'un autre écrit, sauf C et D qui viennent après.
- Le bloc `variante` est optionnel : la loi archivée et `_demo.json` restent valides.
- Tous les chiffres du plan viennent des scrutins 8428 et 8429 déjà interrogés.
