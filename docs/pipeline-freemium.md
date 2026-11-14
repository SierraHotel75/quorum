# Pipeline freemium — construire une base de lois historiques avec le MCP Hémicycle

Ce document décrit la chaîne qui transforme un texte parlementaire en fiche publiable
(`data/lois/<id>.json`), puis en contenu freemium. Il ne décrit pas une intention :
chaque commande, chaque champ et chaque refus sont ceux du dépôt au 14 novembre 2026.

Deux règles priment sur le reste.

1. **Une seule source parlementaire pendant la génération : le MCP Hémicycle.**
   Aucun appel réseau n'existe à l'exécution de l'application. Les JSON sont écrits
   hors ligne, une fois, puis servis comme des fichiers.
2. **Aucune relecture humaine ne rattrape un fichier.** Le passage
   `scripts/verifier.mjs` accepte ou refuse. Pas d'échantillonnage, pas de comité de
   lecture : un refus est un refus.

---

## 1. Le principe : six temps

```
repérer → collecter → vérifier → générer → contrôler → publier
   ↑          ↑           ↑          ↑          ↑          ↑
  score     MCP + CR    sous-chaîne   JSON     gate 5    index.json
```

| Temps | Entrée | Sortie | Qui décide |
|---|---|---|---|
| Repérer | scrutins, actes, presse | liste classée de candidats | score objectivable + choix éditorial assumé |
| Collecter | MCP Hémicycle, comptes rendus, flux RSS | faits, décomptes, citations | la source, jamais le rédacteur |
| Vérifier | citations brutes | citations acceptées | comparaison de sous-chaîne |
| Générer | faits vérifiés | `data/lois/<id>.json` | rédaction, dans un schéma fermé |
| Contrôler | le fichier | code 0 ou 1 | `scripts/verifier.mjs` |
| Publier | fichier accepté | entrée dans `data/lois/index.json` | le gate, pas l'auteur |

Les trois entrées autorisées sont : le MCP Hémicycle (données parlementaires), les
comptes rendus intégraux de l'Assemblée (texte des discours), et les flux RSS de
`data/ref/medias.json` (titres de presse). Toute autre source citée doit appartenir à
la liste `DOMAINES` de `scripts/verifier.mjs`.

---

## 2. Choisir les lois « importantes » sans goût personnel

### 2.1 Les mesures disponibles

| Mesure | Où | Ce qu'elle compte réellement |
|---|---|---|
| `n_scrutins` | jeu `scrutins`, recherche plein texte sur le titre du texte | votes publics rattachés au texte |
| `n_etapes` | jeu `actes`, filtre `dossier_ref eq …` | dépôts, saisines, nominations, lectures, adoptions |
| `n_lectures` | `actes` (`libelle_acte`) + `senat_textes` (`lecture`) | passages devant l'Assemblée puis le Sénat |
| `n_amendements` | jeu `amendements`, filtre `ref_texte_legislatif eq …` | intensité du travail parlementaire |
| `n_presse` | 13 flux de `data/ref/medias.json`, hors MCP | articles dont le titre cite le texte |
| `actualite` | `date_derniere_etape` du dossier | fraîcheur |

Deux précisions qui évitent de raconter n'importe quoi :

- Le jeu `scrutins` **ne porte pas de colonne de rattachement au dossier**. Le lien se
  fait par recherche plein texte sur `titre` / `objet_libelle`, puis contrôle à la main
  de chaque `objet_libelle`. C'est la seule étape de collecte qui reste fragile.
- Le mot « délibération » n'existe dans aucun jeu. On compte des **séances de
  discussion** (`reunions`) et des **étapes** (`actes`). Appeler cela « délibérations »
  dans un document de travail est une convention, pas un champ de la base.

### 2.2 Le score, et son statut

```
score = 3 × n_lectures          (3 par passage : AN, Sénat, CMP, Conseil constitutionnel)
      + 2 × min(n_scrutins, 5)  (0 à 10)
      + 1 × min(n_etapes/4, 5)  (0 à 5)
      + 2 × min(n_presse/5, 5)  (0 à 10)
      + 1 si dernière étape < 90 jours
```

Seuil de travail proposé : **≥ 12**. Ce barème est une **convention du projet**, pas
une mesure d'importance. Il est écrit ici pour être contesté, pas pour être cité comme
un fait. Le classement produit est un ordre de travail ; la décision de publier reste
éditoriale.

### 2.3 Exemple réel : protection des enfants

| Mesure | Valeur constatée | Preuve |
|---|---|---|
| scrutins | 2 (`VTANR5L17V8428`, `VTANR5L17V8429`), le même jour | `data/lois/protection-enfants.json` |
| étapes | 13 | `chronologie` du même fichier |
| lectures | AN 1re lecture, Sénat 1re lecture, CMP convoquée | idem |
| séances dépouillées | 4 comptes rendus | `data/ref/verbatim.json` (`seances`) |
| citations | 9 | `citations` du même fichier |
| presse | 2 + 2 titres | bloc `presse` |
| actualité | dernière étape le 2026-11-05 | `chronologie` |

Score avec ce barème : 3×3 + 2×2 + 1×3 + 2×0 (la presse n'est pas un comptage MCP) + 1 = 17.

### 2.4 Ce qui reste manuel, et pourquoi

| Décision | Automatisable ? | Conséquence si elle est fausse |
|---|---|---|
| retenir le texte dans la liste du jour | non | mauvais sujet, pas de donnée fausse |
| choisir **l'article** qui porte le vote | non | l'écran montre un vote sans rapport avec le texte |
| choisir le `theme` (liste de 17) | non | refus du gate si hors liste |
| rédiger `resume`, `ce_qui_est_vote` | non | reformulation non sourcée = risque de biais |
| choisir 3 citations par bord | non | déséquilibre réel, invisible au gate |
| classer un titre de presse dans une colonne | non | **non contrôlé par le gate** |
| recopier une citation | non (mais vérifiable) | refus immédiat |

Le point le plus honnête : **le gate ne vérifie pas qu'un titre de presse est bien à sa
place**. Il vérifie le nombre d'entrées, la longueur des titres, le média et son domaine.
Le classement éditorial reste donc le seul endroit où un biais peut entrer sans être
refusé. C'est assumé, et c'est la raison pour laquelle les colonnes affichées ne sont pas
des bords politiques : dans `protection-enfants.json`, `pour_titre` vaut « Presse
quotidienne nationale » et `contre_titre` « Presse hebdomadaire et numérique ». Les clés
JSON `pour` / `contre` sont une contrainte de schéma, pas un jugement.

---

## 3. Les outils MCP, vérifiés

Toujours commencer par `guide`, gratuit, sans argument (arborescence) puis avec
`sujet` (fiche). Les noms ci-dessous viennent de `lister_jeux` et de `guide`, pas de
mémoire.

```
guide({})                         0 crédit
guide({ sujet: "outils" })        0
guide({ sujet: "suivre-un-texte"})0
guide({ sujet: "analyser-un-vote"})0
lister_jeux({})                   0
solde_credits({})                 0
```

### 3.1 Catalogue utile au pipeline

| Outil | Coût | Usage exact dans la chaîne |
|---|---|---|
| `rechercher({ q, types })` | 2 | trouver le texte, le dossier, un amendement par mot |
| `lire_texte({ id })` | 1 | texte + dossier législatif, identifiants officiels |
| `interroger({ jeu, filtres, recherche, tri, limite, decalage })` | 1/page | toute liste : 200 lignes maximum par page |
| `lire_amendement({ id })` | 1 | dispositif, exposé, auteurs, sort |
| `lire_scrutin({ id })` | 1 | objet, date, résultat, décompte |
| `resultat_scrutin({ id })` | 1 | décompte + position de chaque groupe + vote nominatif |
| `positions_groupes({ scrutins })` | 1 | jusqu'à 100 scrutins, sans le vote nominatif |
| `lire_acteur({ id })` | 1 | fiche d'un parlementaire |
| `classement_auteurs({ texte, … })` | 5 | qui a déposé le plus d'amendements sur ce texte |

Écartés du pipeline, et pourquoi : `accord_groupes` et `loyaute_deputes` (5 crédits,
réponse à une autre question), `predire_vote` (50 crédits, une estimation n'est pas un
fait), `chercher_entreprise` (2, hors sujet), `lire_donnees_publiques` (2, hors sujet).

### 3.2 Jeux et colonnes à utiliser

| Étape | Jeu | Colonnes | Filtres |
|---|---|---|---|
| identifier le texte | `rechercher` types `texte,dossier` | ids officiels | requête en français |
| dossier | `dossiers` | `uid`, `titre`, `titre_chemin`, `procedure_libelle`, `initiateur` | `legislature eq 17`, `recherche` |
| chronologie | `actes` | `dossier_ref`, `code_acte`, `libelle_acte`, `date_acte`, `organe_ref`, `texte_associe`, `texte_adopte` | `dossier_ref eq DLR5L17N…`, tri `date_acte asc` |
| documents | `documents` | `uid`, `dossier_ref`, `titre_principal`, `date_depot`, `type_libelle`, `auteur_qualite` | `dossier_ref eq …` |
| couverture du texte | `textes_moissonnes` | `texte_uid`, `statut`, `nb_articles`, `moissonne_le` | `texte_uid eq PIONANR5L17B…` |
| articles | `articles_textes` | `texte_uid`, `ordre`, `designation`, `titre`, `dispositif`, `expose` | `texte_uid eq …`, tri `ordre asc` |
| amendements | `amendements` | `uid`, `numero`, `article_designation_courte`, `division_titre`, `dispositif`, `expose_sommaire`, `sort_en_seance`, `date_sort`, `auteur_ref`, `groupe_politique`, `discussion_identique`, `discussion_commune` | `ref_texte_legislatif eq …` |
| votes | `votes` | `scrutin_ref`, `acteur_ref`, `groupe_ref`, `position`, `par_delegation` | **filtre `eq`/`in` obligatoire** sur `scrutin_ref` ou `acteur_ref` ou `groupe_ref` |
| séances | `reunions` | `uid`, `type_reunion`, `debut`, `odj`, `compte_rendu_ref`, `dossier_refs` | `like` sur `dossier_refs` |

Deux contrôles de couverture avant de générer :

1. `textes_moissonnes.statut` doit valoir `ok`. Les valeurs `sans_article` et `absent`
   signifient que `articles_textes` ne rendra rien : il faut alors lire le PDF officiel,
   et le dire dans `source.note`.
2. Une page d'`interroger` rend **200 lignes au plus**. Un texte de plus de 200
   amendements exige plusieurs pages (`decalage`). Ne jamais conclure un total depuis une
   seule page : c'est précisément ce que `classement_auteurs` évite, pour 5 crédits.

### 3.3 Récupérer les décomptes d'un vote

Pour un scrutin, `resultat_scrutin` rend tout en un appel (1 crédit) :

```
resultat_scrutin({ id: "VTANR5L17V8429" })
→ decompte { pour: 258, contre: 84, abstention: 10, non_votants: 1 }
→ groupes  [{ sigle: "RN", pour: 89, … }, …]
```

`lire_scrutin` ne rend que le décompte global. Le passage de `sigle` MCP aux `id` du
fichier est **manuel** : `LFI-NFP` → `LFI`, `ECOS` → `EcoS`, `SOC` → `SOC`. Les 12 `id`
doivent être ceux de `data/ref/groupes.json` : `LFI, GDR, SOC, EcoS, LIOT, EPR, DEM,
HOR, DR, RN, UDR, NI`.

---

## 4. Le point dur : les discours ne sont pas dans le MCP

Le MCP sert des objets parlementaires : textes, amendements, scrutins, votes, actes.
Il **ne sert pas le texte des discours**. Aucun jeu ne contient le compte rendu intégral,
et il n'existe aucun outil de type « lire la séance ». Une citation doit donc venir
d'ailleurs, et d'un endroit unique.

### 4.1 La méthode

1. Trouver la référence de séance : `reunions.compte_rendu_ref` ou `scrutins.seance_ref`.
   Format observé : `CRSANR5L17S2026E1N023`. Ne pas découper ce code à l'aveugle : le
   recopier tel quel dans l'URL.
2. Télécharger le compte rendu intégral :
   `https://www.assemblee-nationale.fr/dyn/17/comptes-rendus/seance/<ref>`
   — c'est exactement l'URL portée par chaque séance de `data/ref/verbatim.json`.
3. Extraire le passage exact, avec son auteur tel qu'il est nommé dans la séance
   (« Alexandra Martin (Alpes-Maritimes) », pas « Mme Martin »).
4. Stocker dans `data/ref/verbatim.json` :

```json
{
  "verifie_le": "2026-11-14",
  "seances": {
    "CRSANR5L17S2026E1N023": {
      "date": "2026-07-21",
      "heure": "13 h",
      "url": "https://www.assemblee-nationale.fr/dyn/17/comptes-rendus/seance/CRSANR5L17S2026E1N023"
    }
  },
  "citations": [
    { "cle": "tomatis-recidive", "seance": "CRSANR5L17S2026E1N020",
      "auteur": "Gabriel Tomatis",
      "texte": "Lorsqu’il s’agit de pédocriminalité, le moindre risque de récidive est déjà un risque de trop." }
  ]
}
```

Le verbatim du dépôt contient 4 séances et 9 citations, toutes de la même loi. Ce n'est
pas un échantillon : c'est la totalité de ce qui est citable aujourd'hui.

### 4.2 La règle d'acceptation

Une citation du fichier de loi n'est acceptée que si **toutes** ces conditions tiennent :

- elle est une **sous-chaîne** d'une entrée de `verbatim.citations` (`texte.includes(citation)`),
- avec la **même séance** (`c.seance === citation.seance`),
- avec le **même auteur** (`c.auteur === citation.nom`),
- `date` et `url` de la fiche égales à celles de la séance,
- longueur ≥ 40 caractères,
- nom présent dans `data/ref/experts.json`.

La comparaison passe par `normaliser()` : espaces insécables, apostrophes typographiques,
tirets et espaces multiples sont ramenés à une forme unique. Une retouche d'un seul mot
échoue quand même — c'est le cas n° 9 de `preuve-gate.mjs` (« citation retouchée
refusée »).

### 4.3 Vérifier à la main avant de lancer le gate

```bash
node -e "const v=require('./data/ref/verbatim.json');const q='Lorsqu’il s’agit de pédocriminalité';const ok=v.citations.some(c=>c.texte.includes(q));console.log(ok?'dans le verbatim':'ABSENTE')"
```

Le gate refait ce test, et refuse. Ce one-liner sert seulement à éviter d'écrire un
fichier voué au refus.

### 4.4 Ce qu'on ne fait pas

- Pas de citation reconstituée depuis un article de presse.
- Pas de citation « résumée » puis présentée entre guillemets.
- Pas de traduction d'un passage.
- Pas de coupe pour équilibrer les bords : le gate juge la symétrie sur le **total de
  caractères par bord** (rapport maximal 2,5), pas sur chaque extrait ; tronquer la plus
  longue pour équilibrer serait une falsification.
- Pas de citation d'un ministre ou d'un rapporteur qui n'est pas dans `experts.json`.

---

## 5. Générer le fichier de loi

### 5.1 Schéma

Champs obligatoires pour `scripts/verifier.mjs` (contrôle WP1.1) :

| Champ | Type | Contrainte |
|---|---|---|
| `id` | string | `^[a-z0-9]+(-[a-z0-9]+)*$` |
| `titre` | string | non vide |
| `theme` | string | l'un des 17 de `THEMES` |
| `statut` | string | `Adopté`, `Rejeté`, `En discussion`, `Promulgué`, `Retiré`, `Non documenté` |
| `resume` | string | non vide, reformulé, sourcé par les faits |
| `nb_phrases` | integer | **égal** au nombre de phrases des paragraphes d'articles |
| `source` | objet | `nom`, `url`, `licence`, `texte_url`, `consulte_le` ; HTTPS + domaine autorisé |
| `scrutin` | objet | `id`, `date`, `chambre`, `numero`, `pour`, `contre`, `abstention`, `non_votants`, `votants`, `suffrages_exprimes`, `regle` |
| `sieges_vides` | integer ≥ 0 | `présents + sièges_vides = 577` |
| `chronologie` | array | dates croissantes, `chambre` dans `AN, SENAT, CMP, COMMISSION, GOUVERNEMENT, CONSEIL_CONSTITUTIONNEL` |
| `extraits` | array non vide | `texte` sous-chaîne du texte, `article`, `tag` ∈ `adopte`, `supprime` |
| `articles` (ou objet `article`) | array | chaque article a `reference` et `paragraphes` non vides |
| `chiffres` | array | chaque libellé doit correspondre à un décompte du scrutin |
| `quiz` | array | ≥ 2 options, `bonne` dans les bornes, `source` non vide |
| `ce_qui_est_vote` | objet | `texte` obligatoire ; `titre`, `points` facultatifs |
| `presse` | objet | `pour` et `contre` : listes de même longueur, non vides |
| `debat` | objet | `pour` et `contre` : listes de même longueur, non vides |
| `verifications` | objet | `chiffres` non vide |
| `votes_par_groupe` | array non vide | les 12 groupes, `sieges = pour+contre+abstention+non_votants` |
| `meta` | objet | `genere_le` (date), `gate: "5"`, `controles` (les 10 noms, tous `ok`) |
| `variante` | objet, **facultatif** | si présent : 6 règles WP1.7 |

### 5.2 Les blocs qui restent vides plutôt qu'inventés

Le gate **refuse** un `presse` vide (`aucun contenu, la page doit rester vide et le
dire`), un `debat` vide, un `verifications.chiffres` vide. La règle n'est donc pas
« laisser le bloc vide » : c'est **ne pas publier la loi**. Trois cas concrets :

| Situation | Ce qu'on écrit | Ce qu'on n'écrit pas |
|---|---|---|
| aucune citation des deux bords dans les comptes rendus | fichier en `_` (jeu de travail), jamais dans `index.json` | une citation de presse mise entre guillemets |
| aucun titre de presse dans les 13 flux | idem : pas de publication | un titre « proche » d'un autre média |
| chiffre sans source officielle | verdict `non documenté`, `sources: []` | une source approximative, ou un verdict `confirmé` |
| pas de bloc `variante` | champ absent, et `meta.controles` sans « Variante contrôlée » | un bloc vide avec `avant: ""` |
| article non moissonné (`sans_article`) | lire le PDF et remplir `articles` | laisser `articles: []` en publiant |

Seuls champs réellement facultatifs dans un fichier publié : `variante`,
`ce_qui_est_vote.points`, `debat.chapeau`, `presse.note`, `source.note`. `chiffres: []`
est toléré (l'écran décompte vit du scrutin) mais ne doit pas servir à masquer un
décompte absent.

### 5.3 Exemple : le scrutin de `protection-enfants.json`

```json
"scrutin": {
  "id": "VTANR5L17V8429",
  "date": "2026-07-21",
  "chambre": "Assemblée nationale",
  "numero": "n° 8429",
  "pour": 258, "contre": 84, "abstention": 10, "non_votants": 1,
  "votants": 352, "suffrages_exprimes": 342,
  "regle": "majorité absolue des suffrages exprimés",
  "objet": "l'amendement n° 1 du Gouvernement de rétablissement de l'article 11 (supprimé) …",
  "sort": "adopté"
},
"sieges_vides": 224
```

Vérification arithmétique : `258 + 84 + 10 + 1 = 353` présents ; `353 + 224 = 577` ;
`352 votants = 258 + 84 + 10` ; `342 exprimés = 258 + 84`. Les 224 sièges vides ne sont
attribués à aucun groupe : ils sont peints d'une teinte neutre, jamais empilés d'un côté.

Aucun groupe ne porte son effectif statutaire : `votes_par_groupe[].sieges` est le
nombre de **sièges présents** (votants + non-votants volontaires). Le RN y vaut 89,
pas 122.

### 5.4 Exemple : la variante

```json
"variante": {
  "reference": "Article 11, 1° b)",
  "avant": "La cour d’assises peut toutefois, par décision spéciale, porter la période de sûreté jusqu’à trente ans.",
  "texte_source": "…texte intégral de la commission n° 3018…",
  "source_avant": { "nom": "…", "url": "https://www.assemblee-nationale.fr/dyn/17/textes/l17b3018_texte-adopte-commission", "licence": "Licence Ouverte (Etalab)" },
  "supprimee_par": {
    "scrutin": "VTANR5L17V8428", "numero": 8428, "date": "2026-07-21",
    "sort": "adopté", "pour": 178, "contre": 163, "abstention": 5,
    "votants": 346, "suffrages_exprimes": 341, "non_votants": 1
  }
}
```

Six règles : référence non vide ; `avant` mot pour mot dans `texte_source` ; `avant`
**absente** du texte adopté ; décompte juste et `pour > contre` ; URL source HTTPS dans
un domaine autorisé ; `supprimee_par.scrutin` différent du scrutin de la loi.

---

## 6. Les contrôles bloquants

### 6.1 `scripts/verifier.mjs` — gate 5

```
node scripts/verifier.mjs                    # tous les fichiers de data/lois
node scripts/verifier.mjs data/lois/x.json   # un seul
node scripts/verifier.mjs --reseau           # teste aussi que chaque URL répond
```

Code de sortie 1 dès qu'un fichier est refusé. Les fichiers commençant par `_` sont
ignorés, ainsi que `index.json`.

| Code | Contrôle | Ce qu'il refuse |
|---|---|---|
| WP1.1 | schéma, dates, valeurs fermées | champ absent, thème hors liste, `gate` ≠ 5 |
| WP1.2 | chiffres et sièges | `pour` faux d'une unité, siège vide non déclaré, groupe absent |
| WP1.3 | extraits verbatim | phrase absente du texte, étiquette `supprime` sur un passage ordinaire |
| WP1.4 | symétrie | 2 titres pour contre 3, longueurs dans un rapport > 2,5 |
| WP1.5 | sources | HTTP au lieu de HTTPS, domaine hors liste, URL de média hors de son domaine |
| WP1.6 | ressources et journal | média hors liste, affiliation divergente, contrôle non vert |
| WP1.7 | variante | clause absente de sa source, encore présente dans le texte adopté |
| WP1.8 | débat | citation retouchée, mauvaise séance, auteur absent de la liste |
| WP1.9 | chiffres vérifiés | `confirmé` sans source, `non documenté` avec source, chiffre absent de la citation |

`meta.controles` doit lister les 10 noms **exactement** :
`Schéma du fichier`, `Chiffres cohérents avec le scrutin`, `Sièges attribués = 577`,
`Extraits verbatim`, `Symétrie des bords`, `Sources des médias`,
`Ressources citées vérifiées`, `Variante contrôlée` (seulement si `variante` existe),
`Débat cité`, `Chiffres vérifiés` — tous avec `etat: "ok"`.

### 6.2 `scripts/preuve-gate.mjs` — 11 cas

```
node scripts/preuve-gate.mjs
```

Il fabrique un fichier complet dans le dossier temporaire, le fait accepter, puis
introduit une faute à la fois et exige le refus. Résultat au 14/11/2026 :

```
[OK] fichier complet accepté
[OK] un siège de trop refusé
[OK] un siège vide non déclaré refusé
[OK] un siège de groupe inventé refusé
[OK] média hors liste refusé
[OK] variante absente de son texte source refusée
[OK] variante encore présente dans le texte adopté refusée
[OK] étiquette « supprime » sur un passage ordinaire refusée
[OK] citation retouchée refusée
[OK] verdict « confirmé » sans source refusé
[OK] « non documenté » avec source refusé
Preuve tenue : 11 cas sur 11.
```

Ce script ne prouve pas que la base est vraie ; il prouve que le passage **refuse**.
C'est la seule preuve que le projet s'autorise.

### 6.3 Listes fermées et domaines

| Liste | Fichier | Contenu | Effet d'une absence |
|---|---|---|---|
| médias | `data/ref/medias.json` | 13 médias, domaine, flux RSS | titre refusé |
| personnes citables | `data/ref/experts.json` | 14 fiches (nom, rôle, affiliation) | citation refusée |
| verbatim | `data/ref/verbatim.json` | 4 séances, 9 passages | débat non publiable |

Domaines autorisés en dur (`DOMAINES`) : `assemblee-nationale.fr`, `senat.fr`,
`legifrance.gouv.fr`, `vie-publique.fr`, `data.gouv.fr`, `hemicycle.ai`, `ciivise.fr`,
`justice.gouv.fr` — plus les domaines de `medias.json` et sa clé `domaines`.

### 6.4 Verdicts

Trois valeurs seulement : `confirmé`, `nuancé`, `non documenté`. Une explication de
**80 caractères minimum**. `confirmé` et `nuancé` exigent au moins une source HTTPS dans
un domaine autorisé. `non documenté` **interdit** toute source : c'est une contradiction,
pas une nuance. Le chiffre doit apparaître littéralement dans la citation qu'il commente.

Le verdict ne dit jamais si la loi est bonne. Il est rendu en typographie, jamais en vert
ni en rouge, pour que « vrai » ne se lise pas comme « pour ». Le 70 % de
`protection-enfants.json` est `non documenté` : le rapport inter-inspections de juillet
2022 n'est publié sur aucun site officiel, donc il n'est pas repris comme un fait.

---

## 7. Coûts et limites

### 7.1 Ce qui est mesuré

Relevé le 14 novembre 2026 par `solde_credits` : **893 crédits** avant les deux appels de
contrôle de ce pipeline, **891** après, à `valeur_eur: 0.01` le crédit, soit **8,91 €**.
L'estimation de 870 crédits utilisée en interne était basse ; c'est le solde renvoyé par
l'outil qui fait foi, et il change à chaque appel.

| Trajet | Appels | Crédits |
|---|---|---|
| minimal | `rechercher` 2, `lire_texte` 1, `interroger actes` 1, `interroger articles_textes` 1, `resultat_scrutin` 1, `interroger amendements` 1, `positions_groupes` 1 | **8** |
| complet | minimal + `interroger documents` 1, `interroger textes_moissonnes` 1, `lire_amendement` 1, 2 à 4 pages d'amendements en plus | **13 à 15** |
| avec agrégats | + `classement_auteurs` 5 et `accord_groupes` 5 | 23 à 25 |

À 0,08–0,15 € par loi, les 893 crédits couvrent **60 à 110 lois**. Les appels en erreur
(400, 401, 402, 404, 429, 5xx) ne sont pas facturés ; une recherche qui aboutit sans
résultat l'est.

### 7.2 Ce qui n'est pas documenté

| Point | État |
|---|---|
| prix public d'un crédit à la recharge | `valeur_eur: 0.01` renvoyé par `solde_credits` ; la recharge commence à 100 € HT, sans équivalent en crédits publié — **non documenté** |
| conditions de redistribution commerciale des données Hémicycle | **non documentées à ce jour** ; bloquant pour un usage payant |
| licence des données Sénat (`senat_reunions`, `senat_collaborateurs`) | « conditions de réutilisation non confirmées » dans `lister_jeux` |
| rapport IGJ de juillet 2022 sur les violences sexuelles faites aux enfants | introuvable en ligne, **non documenté** ; d'où le verdict du 70 % |
| Sénat votable dans l'application | impossible : le gate exige `data/ref/senat.json`, absent ; un scrutin `chambre: "Sénat"` est refusé (`WP1.2`) |
| texte des discours dans le MCP | **non servi** ; seule voie : comptes rendus intégraux |

Le Sénat mérite une phrase de plus : le MCP **sert** les scrutins, votes, amendements,
dossiers et textes du Sénat. Ce qui manque est côté application : sans composition de
référence datée, `somme(sieges) + sieges_vides = total` n'a pas de total. On peut donc
raconter une étape sénatoriale dans `chronologie` (comme pour `protection-enfants`),
jamais publier un vote sénatorial comme vote principal.

---

## 8. Mode d'emploi reproductible

### 8.1 Structure

```
data/ref/medias.json         liste fermée des 13 médias + flux
data/ref/experts.json        liste fermée des personnes citables
data/ref/verbatim.json       séances + citations exactes
data/ref/groupes.json        composition de l'Assemblée, 577 sièges
data/lois/index.json         1 entrée par loi publiée
data/lois/<id>.json          la loi
data/lois/_<id>.json         jeu de travail, jamais publié
scripts/verifier.mjs         gate 5
scripts/preuve-gate.mjs      11 cas de refus
```

Aucun script de génération n'est versionné. La collecte se fait par appels MCP dans une
session d'assistant ; l'écriture du JSON est manuelle, ou faite par un script jetable
hors du dépôt. Ce choix est volontaire : un générateur automatique produirait des
fichiers que personne n'a lus, et le gate ne juge pas le sens.

### 8.2 Ordre des étapes

1. `guide({})` puis `guide({ sujet: "outils" })` — gratuit, et à refaire à chaque
   changement de version du serveur.
2. `solde_credits({})` — noter le solde de départ.
3. `rechercher({ q: "<titre du texte>", types: "texte,dossier" })` — 2 crédits.
4. `lire_texte({ id })` — 1 crédit.
5. `interroger` sur `actes`, `documents`, `textes_moissonnes`, `articles_textes`,
   `amendements` — 1 crédit par page.
6. `resultat_scrutin({ id })` pour chaque scrutin retenu — 1 crédit chacun.
7. Télécharger les comptes rendus, extraire les passages, écrire `verbatim.json`.
8. Relever les titres dans les flux RSS, avec date et URL.
9. Écrire `data/lois/_<id>.json`, puis le renommer sans `_` quand il est complet.
10. `node scripts/verifier.mjs data/lois/<id>.json` — doit rendre `[OK]`.
11. `node scripts/verifier.mjs --reseau` — une fois, avant publication.
12. `node scripts/preuve-gate.mjs` — doit rendre 11/11.
13. Ajouter l'entrée dans `data/lois/index.json`.
14. `node scripts/verifier.mjs` — tous les fichiers, doit rendre 0.

### 8.3 Checklist de publication

- [ ] `meta.gate` vaut `"5"` et `meta.genere_le` est la date du jour.
- [ ] `sieges_vides` déclaré, `somme(sieges) + sieges_vides = 577`.
- [ ] chaque `votes_par_groupe[].sieges` = pour + contre + abstention + non-votants.
- [ ] les 12 groupes de `groupes.json` sont présents, aucun autre.
- [ ] `source.texte_url` pointe le texte officiel, en HTTPS.
- [ ] `nb_phrases` recalculé après la dernière modification des articles.
- [ ] chaque `extraits[].texte` est dans `articles[].paragraphes`.
- [ ] `tag: "supprime"` réservé aux passages qui écrivent « (Supprimé) ».
- [ ] `presse` : mêmes nombres à gauche et à droite, médias dans la liste, URL sur leur domaine.
- [ ] `debat` : mêmes nombres, citations dans le verbatim, même séance, même auteur.
- [ ] rapport des totaux de caractères du débat ≤ 2,5.
- [ ] chaque verdict a sa source, ou n'en a aucune s'il est `non documenté`.
- [ ] `meta.controles` : 10 noms, tous `ok`, « Variante contrôlée » seulement si `variante`.
- [ ] fichier renommé sans `_`, puis `index.json` mis à jour, puis gate vert.

### 8.4 Ajouter une loi à `index.json`

Une entrée, cinq champs, dans l'ordre des lois publiées :

```json
{
  "id": "protection-enfants",
  "fichier": "data/lois/protection-enfants.json",
  "titre": "Projet de loi relatif à la protection des enfants",
  "theme": "social",
  "scrutin": "VTANR5L17V8429"
}
```

`id` et `fichier` doivent désigner le même nom de base. Un fichier `_…` ne s'indexe
jamais. L'index est lu par l'application, pas par le gate : une entrée fausse casse
l'écran sans être refusée. D'où l'ordre : gate vert **d'abord**, index ensuite.

---

## 9. Freemium : ce qui est gratuit, ce qui peut être payant

Le freemium ne porte jamais sur le contenu du vote de l'utilisateur, qui reste dans le
navigateur et n'est transmis à personne. Il ne porte pas non plus sur des données
personnelles : l'application n'a ni compte, ni mesure d'audience, ni identifiant.

| Gratuit | Payant (envisageable) |
|---|---|
| la loi du jour, en entier | archive thématique au-delà de la loi du jour |
| le fait, les extraits, l'article entier | séries historiques (« les lois de… ») |
| le premier vote, les chiffres, le quiz | recherche plein texte dans l'archive |
| le débat mot pour mot | export, dossiers de travail |
| les chiffres vérifiés, la presse | — |
| `#/methode`, `#/arbre` | — |

Trois interdits structurent l'offre :

1. **On ne vend pas le résultat d'un vote.** Le vote de l'utilisateur n'est ni collecté
   ni monnayable ; les XP ne récompensent que le parcours (lire, comparer, voter), jamais
   le contenu du vote.
2. **Le fait ne dépend pas du paiement.** Le fait, le vote et le débat de la loi du jour
   restent gratuits : payer ne change pas ce qui est vrai.
3. **On ne vend pas de données personnelles.** Il n'y en a pas.

Contrainte technique à ne pas masquer : l'application est un service statique. Un fichier
servi est téléchargeable ; le JavaScript ne peut pas protéger une archive. Un accès payant
exige donc un hébergeur qui authentifie avant de servir le fichier. Tant que ce n'est pas
le cas, la partie payante reste une arborescence vide, avec un état explicite — jamais un
faux contenu.

Dernière limite, bloquante pour la partie payante : les **conditions de redistribution
commerciale des données Hémicycle ne sont pas documentées à ce jour**. Vendre une archive
construite sur ces données avant de les connaître reviendrait à publier d'abord et à
vérifier ensuite.

---

## Annexe — ce qui reste incertain

| Sujet | Statut |
|---|---|
| prix réel d'un crédit à la recharge | non documenté ; seul `valeur_eur: 0.01` du solde est mesuré |
| redistribution commerciale des données Hémicycle | non documentée |
| licence des données Sénat issues de `agenda.senat.fr` | non confirmée |
| rapport inter-inspections de juillet 2022 | introuvable en ligne |
| rattachement automatique scrutin ↔ dossier | pas de colonne dédiée ; recherche plein texte + contrôle manuel |
| loyauté des députés, accords entre groupes | outils existants, non utilisés ici |

Rien dans ce document n'est une opinion sur une loi. Les seules phrases qui qualifient
sont des citations, et une citation n'entre dans un fichier que si elle est une
sous-chaîne d'un compte rendu officiel, même séance, même auteur.
