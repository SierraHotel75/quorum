# Fabriquer une fiche de loi — mode d'emploi reproductible

Ce document suit **un seul fil** : comment `data/lois/protection-enfants.json` a été fabriqué, et comment
refaire la même chose pour une autre loi. Identifiants, chemins et valeurs sont ceux du dépôt au
14 novembre 2026 ; `docs/pipeline-freemium.md` décrit le pipeline général et le freemium, pas cette fiche.

Aucun script de génération n'est versionné : la collecte se fait par appels MCP, l'écriture du JSON est
manuelle, puis le gate accepte ou refuse. Un générateur produirait des fichiers que personne n'a lus, et
le gate ne juge pas le sens.

## 1. Le fil conducteur

| Élément | Valeur exacte |
|---|---|
| scrutin | `VTANR5L17V8429`, 21 juillet 2026, seconde délibération sur l'article 11 |
| décompte | 258 pour · 84 contre · 10 abstentions · 1 non-votant ; 352 votants, 342 exprimés |
| sièges vides | 224 (353 présents + 224 = 577) |
| second scrutin, même jour | `VTANR5L17V8428` : 178 · 163 · 5, 346 votants, 341 exprimés |
| dossier | `DLR5L17N54372` |
| textes | adopté `PRJLANR5L17BTA0338` (n° 338), commission `PRJLANR5L17BTC3018` (n° 3018) |
| séances dépouillées | 4 comptes rendus, 9 citations |

Une phrase par étape, de la source à la publication :

1. **Choisir** : un scrutin nominatif dont l'objet désigne un article, deux bords citables (§2).
2. **Collecter** : décompte, groupes, article adopté, chronologie par le MCP, ~8 crédits (§3).
3. **Citer** : les discours, absents du MCP, recopiés des comptes rendus intégraux (§4).
4. **Retraiter** : du décompte brut aux champs de la fiche, par arithmétique vérifiable (§5).
5. **Contrôler** : `scripts/verifier.mjs` refuse, `scripts/preuve-gate.mjs` le prouve (§6).
6. **Publier** : entrée d'index, cache, version (§7).

## 2. Étape 0 — choisir la loi

Six critères objectivables. Si l'un manque, la fiche ne se publie pas, quel que soit l'intérêt du sujet.

1. **Un scrutin public nominatif existe** (`scrutins`), avec un `id` `VTANR5L17V…`.
2. **L'objet du scrutin désigne un article** : ici « l'amendement n° 1 du Gouvernement de
   rétablissement de l'article 11 (supprimé) … (seconde délibération) ». Un vote sur l'ensemble du
   texte ne donne aucun article à lire.
3. **Le texte est moissonné** : `textes_moissonnes.statut` vaut `ok` pour le `texte_uid` visé, sinon
   `articles_textes` ne rend rien : lire le PDF et le dire dans `source.note`.
4. **Deux bords citables** : trois passages de chaque côté, assez longs pour être vérifiables (§4).
   Sans cela `debat` est vide, et un `debat` vide est refusé.
5. **Deux colonnes de presse** : un titre vérifiable de chaque côté dans les 13 flux de
   `data/ref/medias.json`, avec date et URL réelles.
6. **Frais** : dernière étape du dossier récente (ici le 5 novembre 2026).

Ce qui reste **manuel**, et que le gate ne rattrape pas : retenir le texte dans la liste du jour,
choisir **l'article** qui porte le vote, choisir le `theme` parmi 17 valeurs, rédiger `resume` et
`ce_qui_est_vote`, choisir les 3 + 3 citations, classer les titres de presse. Le barème de score
(seuil ≥ 12) est une convention : il ordonne le travail, il ne décide pas de la publication.

## 3. Étape 1 — collecter avec le MCP Hémicycle

Coût : **0 crédit** pour `guide`, `lister_jeux`, `solde_credits` ; **1 crédit par appel de données** et
par page (`interroger` rend 200 lignes au plus) ; **2 crédits** pour `rechercher`. Le trajet minimal
documenté fait **8 crédits** : `rechercher` (2), `lire_texte` (1), `interroger actes` (1),
`interroger articles_textes` (1), `resultat_scrutin` (1), `interroger amendements` (1),
`positions_groupes` (1). Le décompte du 8428 n'a pas été réinterrogé : agrégation déjà payée.

| Outil | Crédits | Ce qu'on lui demande, sur cette loi |
|---|---|---|
| `guide` | 0 | arborescence puis fiche du sujet ; à refaire à chaque version du serveur |
| `lister_jeux` | 0 | noms des jeux et colonnes réellement servies |
| `rechercher` | 2 | `q: "protection des enfants"`, `types: "texte,dossier"` |
| `lire_texte` | 1 | le texte et son dossier, les identifiants officiels |
| `interroger` | 1/page | `actes` (chronologie), `articles_textes` (article 11), `votes` (par groupe) |
| `lire_scrutin` | 1 | objet, date, sort, décompte global |
| `resultat_scrutin` | 1 | décompte + position de chaque groupe |
| `positions_groupes` | 1 | les deux scrutins en un appel, sans le vote nominatif |
| `lire_amendement` | 1 | dispositif, exposé, sort (amendement n° 1, sous-amendement n° 2) |

Exemples de requêtes, tels qu'ils ont été faits :

```
resultat_scrutin({ id: "VTANR5L17V8429" })
→ decompte { pour: 258, contre: 84, abstention: 10, non_votants: 1 }
→ groupes  [{ sigle: "RN", pour: 89, … }, … ]

interroger({ jeu: "actes", filtres: "dossier_ref eq DLR5L17N54372", tri: "date_acte asc" })
interroger({ jeu: "articles_textes", filtres: "texte_uid eq PRJLANR5L17BTA0338", tri: "ordre asc" })
interroger({ jeu: "votes", filtres: "scrutin_ref eq VTANR5L17V8429" })
```

Champs retenus : `actes` → `code_acte`, `libelle_acte`, `date_acte`, `organe_ref` ; `articles_textes` →
`ordre`, `designation`, `titre`, `dispositif`, `expose` ; `votes` → `acteur_ref`, `groupe_ref`, `position`
(agrégés par groupe) ; `resultat_scrutin` → `decompte` et `groupes`.

Deux pièges vérifiés. `lire_scrutin` ne donne que le décompte global : les 12 lignes de `votes_par_groupe`
viennent de `votes` agrégé ou de `resultat_scrutin`. Et le passage du `sigle` MCP aux `id` du fichier est
**manuel** (`LFI-NFP` → `LFI`, `ECO` → `EcoS`). Les 12 `id` sont ceux de `data/ref/groupes.json` :
`LFI, GDR, SOC, EcoS, LIOT, EPR, DEM, HOR, DR, RN, UDR, NI`.

## 4. Étape 2 — le point dur : les discours

Le MCP sert des objets parlementaires : textes, amendements, scrutins, votes, actes. Il **ne sert pas le
texte des discours** : aucun jeu ne contient le compte rendu, aucun outil ne « lit la séance ». Une
citation vient donc des comptes rendus intégraux, et d'un seul endroit, `data/ref/verbatim.json`.

**1. Trouver la référence de séance.** `reunions.compte_rendu_ref` ou `scrutins.seance_ref`, format
observé `CRSANR5L17S2026E1N023`. Ne pas découper ce code : le recopier tel quel.

**2. Télécharger le compte rendu.**

```
https://www.assemblee-nationale.fr/dyn/17/comptes-rendus/seance/CRSANR5L17S2026E1N019
```

C'est l'URL portée par chaque séance de `verbatim.json`. Les quatre séances : `N015` (15 juillet,
19 h 30), `N019` (17 juillet, 7 h), `N020` (17 juillet, 13 h), `N023` (21 juillet, 13 h).

**3. Repérer le passage.** Chercher le nom tel qu'il est imprimé (« Mme Marianne Maximi », « M. Gabriel
Tomatis »), copier de la première à la dernière ligne de la prise de parole, s'arrêter au locataire
suivant. Conserver ponctuation, apostrophes typographiques (`’`) et coquilles : « elle le silencie encore
davantage » est écrit ainsi dans le verbatim ; le corriger ferait échouer la comparaison.

**4. Stocker.** Structure exacte du fichier, réduite à une séance et une citation :

```json
{
  "verifie_le": "2026-11-14",
  "seances": {
    "CRSANR5L17S2026E1N019": {
      "date": "2026-07-17", "heure": "7 h",
      "url": "https://www.assemblee-nationale.fr/dyn/17/comptes-rendus/seance/CRSANR5L17S2026E1N019"
    }
  },
  "citations": [
    {
      "cle": "maximi-trois-pour-cent", "seance": "CRSANR5L17S2026E1N019",
      "auteur": "Marianne Maximi",
      "texte": "Cela a été dit, moins de 3 % des auteurs sont condamnés."
    }
  ]
}
```

Le fichier du dépôt contient 4 séances et 9 citations, toutes de cette loi : la totalité de ce qui est
citable aujourd'hui, pas un échantillon.

**5. Ce que le gate vérifie** (`verifierCitation`, WP1.8 et WP1.9). Une citation de fiche n'entre que si
**toutes** ces conditions tiennent :

- `citation.length >= 40` après normalisation ;
- `seance` existe dans `verbatim.seances`, et `date` et `url` de la fiche sont **égales** à celles de la
  séance ;
- `nom` (ou `auteur`) figure dans `data/ref/experts.json`, comparaison en minuscules ;
- une entrée du verbatim porte **la même séance**, **le même auteur** (chaîne normalisée, casse comprise)
  et `texte.includes(citation)`.

`normaliser()` ramène espaces insécables, apostrophes `’`, guillemets `“ ”`, tirets `– —` et espaces
multiples à une forme unique, puis rogne les bords. Une retouche d'un seul mot échoue quand même : c'est
le cas n° 9 de `preuve-gate.mjs`. Pour le débat, `affiliation` doit aussi être identique, mot pour mot, à
celle de la fiche `experts`.

Depuis le 14 novembre 2026, `affirmation` — la phrase affichée entre guillemets au-dessus du chiffre — est
contrôlée elle aussi (WP1.9) : après normalisation, minuscules et retrait du point final, elle doit être un
**fragment exact** de `citation`. Le point final et la majuscule de début viennent de l'affichage, pas du
verbatim ; tout le reste est refusé. C'est le cas n° 12 de `preuve-gate.mjs`.

Test manuel, avant d'écrire un fichier voué au refus :

```
node -e "const v=require('./data/ref/verbatim.json');console.log(v.citations.some(c=>c.texte.includes('Cela a été dit, moins de 3 %')))"
```

## 5. Étape 3 — retraiter la donnée

### 5.1 L'arithmétique, avant tout champ

```
présents      = 258 + 84 + 10 + 1  = 353
votants       = 258 + 84 + 10      = 352   (un non-votant ne vote pas)
exprimés      = 258 + 84           = 342
majorité absolue des exprimés : ⌊342 / 2⌋ + 1 = 172  → 258 > 172, adopté
sièges vides  = 577 − 353          = 224
variante 8428 : votants 178+163+5 = 346 ; exprimés 178+163 = 341 ;
                majorité ⌊341 / 2⌋ + 1 = 171 ; 178 > 171, adopté
```

Ces égalités sont exactement celles que `verifierNombres` refait : elles s'écrivent dans le fichier,
jamais dans `resume`.

### 5.2 Écrire `scrutin`

```json
"scrutin": {
  "id": "VTANR5L17V8429", "date": "2026-07-21", "chambre": "Assemblée nationale",
  "numero": "n° 8429", "pour": 258, "contre": 84, "abstention": 10, "non_votants": 1,
  "votants": 352, "suffrages_exprimes": 342,
  "regle": "majorité absolue des suffrages exprimés",
  "objet": "l'amendement n° 1 du Gouvernement de rétablissement de l'article 11 (supprimé) du projet de loi relatif à la protection des enfants (seconde délibération) (première lecture).",
  "sort": "adopté"
}
```

`regle` est une valeur fermée (4 choix). `objet` est recopié du titre du scrutin, sans reformulation :
c'est lui qui dit au lecteur ce qui était voté.

### 5.3 Écrire `ce_qui_est_vote`, `extraits`, `articles`

- `articles[].paragraphes` : les 9 alinéas de l'article 11 du texte **adopté** (`PRJLANR5L17BTA0338`),
  un paragraphe par alinéa, `U+2011` (trait d'union insécable) conservé.
- `extraits` : 9 passages **verbatim** de ces paragraphes, avec `article` et un `tag` ∈ `adopte` /
  `supprime`, ce dernier réservé à un passage qui écrit « (Supprimé) » (ici `b) (Supprimé)`). Chaque
  `texte` doit être une sous-chaîne des paragraphes, après normalisation.
- `ce_qui_est_vote` : `texte` obligatoire ; le gras s'écrit `**…**` et est rendu par `gras()` dans
  `js/app.js`. `points` est facultatif. C'est une reformulation courte, jamais une citation.
- `nb_phrases` : recalculé par la fonction du gate (`[^.!?]+[.!?]+`). Les 9 alinéas donnent **3** phrases,
  car un alinéa qui finit par « : » n'en produit aucune. Écrire 9 ferait refuser le fichier.

### 5.4 Écrire `chiffres` et `votes_par_groupe`

`chiffres` ne contient **que** des décomptes du scrutin principal, avec un libellé que le gate sait
rattacher : `Pour` 258, `Contre` 84, `Abstentions` 10, `Votants` 352, `Exprimés` 342, `Non-votants` 1.
Les 178 / 163 du 8428 vivent dans `variante.supprimee_par` ; dans `chiffres`, `WP1.2` les refuserait.

`votes_par_groupe` : 12 lignes, `sieges = pour + contre + abstention + non_votants`. C'est le nombre de
**sièges présents**, pas l'effectif statutaire : le RN vaut 89 dans la fiche, 122 dans `groupes.json`.
Somme des `sieges` = 353 ; plus `sieges_vides` 224 = 577.

### 5.5 Écrire `debat` et `verifications`

`debat` : 3 entrées par bord, `nom`, `role`, `affiliation`, `citation`, `seance`, `date`, `url`. Totaux
de caractères : 360 à gauche, 734 à droite, rapport 2,039 (limite 2,5). On ne tronque pas la plus longue
pour équilibrer : ce serait falsifier.

`verifications` : une entrée par chiffre **prononcé dans l'hémicycle**, avec `citation` (contrôlée comme
ci-dessus), `verdict` ∈ `confirmé` / `nuancé` / `non documenté`, `explication` ≥ 80 caractères et
`sources`. Trois entrées : 3 % et 1 % (confirmés, sources CIIVISE) et 70 % (`non documenté`).

### 5.6 Ce qui reste vide, ou s'écrit « non documenté »

| Situation | Ce qu'on écrit | Ce qu'on n'écrit pas |
|---|---|---|
| aucune citation des deux bords | pas de publication ; fichier en `_` | une citation de presse entre guillemets |
| aucun titre dans les 13 flux | pas de publication | un titre « proche » d'un autre média |
| chiffre sans source officielle | `verdict: "non documenté"`, `sources: []` | une source approximative, ou `confirmé` |
| pas de bloc `variante` | champ absent, journal sans « Variante contrôlée » | un bloc vide |
| article non moissonné | lire le PDF et remplir `articles` | publier `articles: []` |

Seuls champs réellement facultatifs dans un fichier publié : `variante`, `ce_qui_est_vote.points`,
`debat.chapeau`, `presse.note`, `source.note`. Les blocs `arguments` et `experts` de l'ancienne fiche
agricole ne sont pas repris : les positions sont citées, pas résumées.

## 6. Étape 4 — les contrôles

```
node scripts/verifier.mjs data/lois/protection-enfants.json
node scripts/preuve-gate.mjs
```

Sortie réelle du 14 novembre 2026 :

```
data\lois\protection-enfants.json
  [OK] Projet de loi relatif à la protection des enfants — 577 sièges, décompte cohérent

Verdict : 1 fichier(s) conforme(s). Publication autorisée.
```

La preuve rend `Preuve tenue : 12 cas sur 12.` : fichier complet accepté, puis un siège de trop, un siège
vide non déclaré, un siège de groupe inventé, un média hors liste, une variante absente de sa source, une
variante encore dans le texte adopté, une étiquette `supprime` sur un passage ordinaire, une citation
retouchée, un `confirmé` sans source, un `non documenté` avec source, une affirmation retouchée — tous
refusés.

Deux refus réellement produits, sur une copie de la fiche dans un dossier temporaire :

```
  [X] WP1.2  chiffre « Pour du sous-amendement » = 178, scrutin = 258
  [X] WP1.8  débat « Gabriel Tomatis » : citation absente du verbatim officiel
```

| Code | Contrôle | Refuse |
|---|---|---|
| WP1.1 | schéma, dates, valeurs fermées | champ absent, thème hors liste, `gate` ≠ `"5"` |
| WP1.2 | chiffres et sièges | `pour` faux d'une unité, siège vide non déclaré, groupe absent |
| WP1.3 | extraits verbatim | phrase absente du texte, `supprime` sur un passage ordinaire |
| WP1.4 | symétrie | 2 titres contre 3, longueur max/min > 2,5 |
| WP1.5 | sources | HTTP, domaine hors liste, URL de média hors de son domaine |
| WP1.6 | ressources et journal | média hors liste, affiliation divergente, contrôle non `ok` |
| WP1.7 | variante | clause absente de sa source, encore dans le texte adopté |
| WP1.8 | débat | citation retouchée, mauvaise séance, auteur hors liste |
| WP1.9 | chiffres vérifiés | `confirmé` sans source, `non documenté` avec source, chiffre ou affirmation absents de la citation |

Listes fermées : `medias.json` (13 médias), `experts.json` (14 fiches), `verbatim.json` (4 séances,
9 passages), `groupes.json` (12 groupes, 577 sièges). Domaines autorisés en dur dans `verifier.mjs` :
`assemblee-nationale.fr`, `senat.fr`, `legifrance.gouv.fr`, `vie-publique.fr`, `data.gouv.fr`,
`hemicycle.ai`, `ciivise.fr`, `justice.gouv.fr`, plus les domaines de `medias.json` et sa clé `domaines`.

`meta.controles` doit lister les 10 noms exacts, tous `etat: "ok"`, « Variante contrôlée » seulement si
le bloc existe. Un fichier produit sous un ancien passage (`gate: "3"`) est refusé : les règles ont
changé, la preuve ne vaut plus.

## 7. Étape 5 — publier

Deux fichiers : la fiche, renommée sans `_`, et une entrée de cinq champs dans `data/lois/index.json` —
`{"id": "protection-enfants", "fichier": "data/lois/protection-enfants.json", "titre": "Projet de loi
relatif à la protection des enfants", "theme": "social", "scrutin": "VTANR5L17V8429"}`.

L'index n'est pas lu par le gate : une entrée fausse casse l'écran sans être refusée. D'où l'ordre : gate
vert **d'abord**, index ensuite, puis gate global.

Trois gestes de cache pour une nouvelle loi :

1. `service-worker.js` : ajouter `./data/lois/<id>.json` dans `FICHIERS` (liste en dur) et incrémenter
   `CACHE = "quorum-v24"` → `v25`.
2. `index.html` : `?v=24` → `?v=25` sur `tokens.css`, `app.css`, `hemicycle.js`, `app.js`.
3. Rien pour la donnée : les JSON sont lus avec `cache: "no-store"`, une modification est visible au
   rechargement. Le bump concerne le code.

Captures : `node scripts/mobile.mjs`, Chrome headless piloté par CDP, serveur sur `http://127.0.0.1:8000` ;
sortie dans `docs/captures/mobile-390-*.png` et `mobile-360-*.png`, plus un tableau de débordement. Les
images de `assets/mockups/` sont des maquettes, elles ne prouvent rien.

Ce qu'on ne publie pas : tout fichier `_…` (`_demo.json`, `_archive-…json`), un fichier dont un contrôle est
rouge, une fiche dont un bloc obligatoire serait vide.

## 8. Un exemple complet, pas à pas

### 8.1 Le chiffre « 3 % »

1. **Source** : compte rendu `CRSANR5L17S2026E1N019`, séance du 17 juillet 2026 à 7 h,
   `https://www.assemblee-nationale.fr/dyn/17/comptes-rendus/seance/CRSANR5L17S2026E1N019`.
2. **Extraction** : la phrase de Marianne Maximi, 56 caractères, recopiée dans `verbatim.json`
   (`cle: "maximi-trois-pour-cent"`, `auteur: "Marianne Maximi"`).
3. **Ligne JSON**, `verifications.chiffres[0]` :

```json
{
  "affirmation": "Moins de 3 % des auteurs sont condamnés.", "chiffre": "3 %",
  "auteur": "Marianne Maximi", "role": "Députée, rapporteure",
  "citation": "Cela a été dit, moins de 3 % des auteurs sont condamnés.",
  "seance": "CRSANR5L17S2026E1N019", "date": "2026-07-17",
  "url": "https://www.assemblee-nationale.fr/dyn/17/comptes-rendus/seance/CRSANR5L17S2026E1N019",
  "verdict": "confirmé",
  "explication": "La CIIVISE retient 3 % dans son rapport public de novembre 2023 …",
  "sources": [
    { "nom": "CIIVISE — rapport public, novembre 2023", "url": "https://www.ciivise.fr/le-rapport-public-de-2023" },
    { "nom": "CIIVISE — bilan de mise en œuvre, 15 juin 2026", "url": "https://www.ciivise.fr/le-bilan-de-mise-en-oeuvre-des-82-recommandations" }]
}
```

4. **Contrôle** : 56 ≥ 40 ; séance connue ; `date` et `url` égales à celles de la séance ; `Marianne Maximi`
   dans `experts.json` avec le rôle « Députée, rapporteure » ; sous-chaîne exacte du verbatim, même séance,
   même auteur ; `"3 %"` littéralement présent dans la citation ; `confirmé` exige une source, ici deux URL
   `ciivise.fr` en HTTPS ; `explication` de 485 caractères.
5. **Affichage** : `ecranVerif` rend « Confirmé » (typographie, jamais vert ni rouge), la citation entre
   guillemets, « Marianne Maximi — Députée, rapporteure · compte rendu du 17 juillet 2026 » et son lien,
   l'explication, puis les deux sources.

### 8.2 Le chiffre « 258 »

1. **Source** : `resultat_scrutin({ id: "VTANR5L17V8429" })` → `pour: 258` ; on écrit `scrutin.pour = 258`
   et `chiffres[0] = { "valeur": "258", "libelle": "Pour" }`, la somme des `pour` des 12 groupes valant 258.
2. **Contrôle** : `WP1.2` compare `chiffres[0].valeur` à `scrutin.pour`, la somme des groupes à
   `scrutin.pour`, `votants` à `258 + 84 + 10`, `exprimés` à `258 + 84`, puis `somme(sieges) +
   sieges_vides` à 577.
3. **Affichage** : `ecranChiffres` affiche `258` sur le libellé `Pour`, à côté de 84, 10, 352, 342 et 1,
   puis « Règle appliquée : majorité absolue des suffrages exprimés. »

## 9. Checklist de reproduction

```
node scripts/verifier.mjs data/lois/_ma-loi.json   # brouillon, chemin explicite
node scripts/verifier.mjs data/lois/ma-loi.json     # fiche complète
node scripts/verifier.mjs --reseau data/lois/ma-loi.json
node scripts/preuve-gate.mjs                        # 12 cas sur 12
node scripts/verifier.mjs                           # tous les fichiers publiés
```

Un chemin donné explicitement est vérifié même si le nom commence par `_` : seul moyen de contrôler un
brouillon sans le publier.

```
data/ref/verbatim.json + experts.json + medias.json (si un média manque)
data/lois/_ma-loi.json → data/lois/ma-loi.json (renommage, sans « _ »)
data/lois/index.json (une entrée, cinq champs)
service-worker.js (FICHIERS + CACHE) et index.html (?v=N), pour une nouvelle loi
```

Doit être vert avant de publier : gate sur le fichier seul et sur l'ensemble, 11/11 sur la preuve,
`sieges_vides` déclaré, 12 groupes, `nb_phrases` recalculé, chaque extrait sous-chaîne du texte, `presse`
et `debat` de même longueur, rapport des caractères ≤ 2,5, chaque verdict avec sa source ou sans aucune,
journal des contrôles complet.

## 10. Limites et cas non documentés

| Point | État |
|---|---|
| rapport inter-inspections de juillet 2022 (chiffre des 70 %) | introuvable sur un site officiel : **non documenté**, donc non repris comme un fait |
| vote du Sénat comme vote principal | impossible : `verifierNombres` refuse `chambre: "Sénat"` faute de `data/ref/senat.json`. Une étape sénatoriale reste possible dans `chronologie` |
| redistribution commerciale des données Hémicycle | **non documentée** à ce jour ; bloquant pour un usage payant |
| prix d'un crédit à la recharge | **non documenté** ; seul `valeur_eur: 0.01` du solde est mesuré |
| licence des jeux Sénat (`senat_reunions`, `senat_collaborateurs`) | conditions de réutilisation non confirmées |
| rattachement scrutin ↔ dossier | aucune colonne dédiée : recherche plein texte, puis contrôle manuel de chaque `objet_libelle` |
| une citation refusée | toute phrase absente du verbatim, d'un autre auteur ou d'une autre séance. Exemple réel : un mot changé chez Tomatis donne `WP1.8 citation absente du verbatim officiel` |
| champ `affirmation` des chiffres vérifiés | contrôlé depuis le 14/11/2026 (fragment exact de `citation`, WP1.9) ; la majuscule initiale et le point final restent ceux de l'affichage |
| classement des titres de presse | vérifié sur le média, le domaine et le nombre, **pas** sur la colonne choisie |
| génération automatique | aucun générateur versionné : écriture manuelle, le gate seul décide |

Rien dans ce document n'est une opinion sur une loi. Les seules phrases qui qualifient sont des citations,
et une citation n'entre dans un fichier que si elle est une sous-chaîne d'un compte rendu officiel, même
séance, même auteur.
