# Design — la clause révélée dans les extraits (loi « protection des enfants »)

**Date :** 2026-11-14
**Statut :** proposé, en attente d'accord
**Remplace :** la loi agricole comme loi publiée de la démo

## But

Publier une seule loi, le **projet de loi relatif à la protection des enfants**, sur le scrutin
**n° 8429** (21 juillet 2026, article 11), et rendre visible une subtilité que les chiffres
du vote ne montrent pas.

## Le fait, vérifié sur Hémicycle le 14 novembre 2026

| Élément | Valeur | Source |
|---|---|---|
| Scrutin principal | `VTANR5L17V8429`, 21/07/2026, adopté | scrutin 8429 |
| Décompte principal | 258 pour · 84 contre · 10 abstentions · 352 votants · 342 exprimés · 1 non-votant | scrutin 8429 |
| Objet | rétablir l'article 11, supprimé, en seconde délibération | titre du scrutin |
| Texte adopté | `PRJLANR5L17BTA0338`, art. 11 : « b) (Supprimé) » | `articles_textes` |
| Second scrutin, même jour | `VTANR5L17V8428`, sous-amendement n° 2 : 178 pour · 163 contre · 5 abstentions · 346 votants · 341 exprimés · 1 non-votant | scrutin 8428 |
| Clause concernée | « La cour d'assises peut toutefois, par décision spéciale, porter la période de sûreté jusqu'à trente ans. » | texte de la commission `PRJLANR5L17BTC3018`, art. 11, 1° b) |

Deux nombres, deux lectures : 258 contre 84 paraît large ; 178 contre 163, le même jour, sur la
clause de sûreté, ne l'est pas. Le texte adopté porte la trace de la suppression.

**Neutralité :** aucun des deux scrutins n'est qualifié de bon ou de mauvais. On publie les
décomptes, la rédaction et l'alinéa. Rien d'autre.

## Non-objectifs

- Pas d'écran nouveau, pas de route nouvelle.
- Pas de seconde hémicycle à l'écran.
- Pas de commentaire sur l'opportunité de la perpétuité.
- Pas de presse inventée : si aucun titre vérifié n'existe dans la liste suivie, la page le dit.

## Contrat de données : le bloc `variante`

Ajout d'un champ **facultatif** `variante` au fichier de loi. Absent = aucun contrôle, aucun
affichage. Présent = deux contrôles bloquants et un bloc dans l'écran de lecture.

```json
"variante": {
  "reference": "Article 11, 1° b)",
  "avant": "La cour d’assises peut toutefois, par décision spéciale, porter la période de sûreté jusqu’à trente ans.",
  "texte_source": "<article 11 complet, verbatim, texte de la commission>",
  "source_avant": {
    "nom": "Assemblée nationale — texte de la commission n° 3018",
    "url": "https://www.assemblee-nationale.fr/dyn/17/textes/l17b3018_texte-adopte-commission",
    "licence": "Licence Ouverte (Etalab)"
  },
  "supprimee_par": {
    "scrutin": "VTANR5L17V8428",
    "numero": 8428,
    "date": "2026-07-21",
    "objet": "le sous-amendement n° 2 de Mme Perrine Goulet à l’amendement n° 1 du Gouvernement",
    "sort": "adopté",
    "pour": 178, "contre": 163, "abstention": 5,
    "votants": 346, "suffrages_exprimes": 341, "non_votants": 1
  }
}
```

### Contrôles bloquants ajoutés (`WP1.7`, code `scripts/verifier.mjs`)

1. `variante.reference` non vide.
2. `variante.avant` présent **mot pour mot** dans `variante.texte_source` (normalisation identique au contrôle WP1.3).
3. `variante.avant` **absent** des `articles[].paragraphes` : la clause citée n'est pas dans le texte adopté.
4. `supprimee_par` : `pour + contre + abstention == votants`, `pour + contre == suffrages_exprimes`, `sort == "adopté"`, `pour > contre`, tous entiers positifs ou nuls.
5. `source_avant.url` en HTTPS et domaine autorisé.
6. `supprimee_par.scrutin` différent de `scrutin.id` : une clause ne peut pas avoir été supprimée par le vote qui l'a rétablie.

`WP1.7` s'ajoute au journal `meta.controles` et à `CONTROLES` ; `meta.gate` passe de `2` à `3`.
`scripts/preuve-gate.mjs` gagne un cas négatif : une variante dont la clause est absente du
`texte_source` doit être refusée, et une variante dont la clause est encore dans le texte adopté
doit être refusée.

### Effet sur le fichier existant

La loi agricole passe au gate 3 sans bloc `variante` : contrôles 1 à 6 non exécutés, aucun
affichage. `node scripts/verifier.mjs` doit rester vert sur les deux fichiers, ou la loi agricole
est retirée de `data/lois/` et de `index.json`.

## Affichage : dans l'écran de lecture, sans route nouvelle

Dans `#/devoir/<id>/article`, après le texte de l'article et avant les sources :

```
CE QUI A CHANGÉ
Article 11, 1° b)
« La cour d’assises peut toutefois, par décision spéciale, porter la période
  de sûreté jusqu’à trente ans. »          [ texte de la commission ]

Supprimé le 21 juillet 2026 par le scrutin n° 8428 :
178 pour · 163 contre · 5 abstentions.
Texte adopté : b) (Supprimé).
[ Voir le scrutin sur le site de l’Assemblée nationale ]
```

- Aucune couleur d'opinion : le bloc utilise le bois éditorial, pas le bordeaux d'action.
- Le décompte 178/163 n'entre pas dans `chiffres` (le contrôle WP1.2 refuserait un chiffre sans équivalent au scrutin).
- Le lien sortant est une source, pas une action.

## Données à produire (hors ligne, MCP Hémicycle)

| Donnée | Où | Comment |
|---|---|---|
| Décompte 8429 et 8428, par groupe | `votes_par_groupe` + `variante.supprimee_par` | jeu `votes`, agrégation par `groupe_ref` |
| Article 11 adopté (texte des `paragraphes`) | `articles[]` | `articles_textes` de `PRJLANR5L17BTA0338` |
| Article 11 de la commission (`texte_source`) | `variante.texte_source` | `articles_textes` de `PRJLANR5L17BTC3018` |
| Chronologie | `chronologie` | jeu `actes`, dossier `DLR5L17N54372` |
| Arguments pour / contre | `arguments` | rapports AN et Sénat, sites officiels |
| Presse | `presse` | liste `data/ref/medias.json` + flux RSS vérifiés |
| Ressources citées | `experts` | liste `data/ref/experts.json`, à étendre |

`sieges_vides` attendu : `577 − 353 = 224` (352 votants + 1 non-votant déclaré).

## Découpage pour sous-agents (périmètres d'écriture disjoints)

| Lot | Fichiers possédés | Dépend de |
|---|---|---|
| **A — contrôle** | `scripts/verifier.mjs`, `scripts/preuve-gate.mjs`, `data/ref/groupes.json` si besoin | contrat ci-dessus |
| **B — données** | `data/lois/protection-enfants.json`, `data/lois/index.json`, `data/ref/medias.json`, `data/ref/experts.json` | contrat ci-dessus, MCP |
| **C — lecture** | `js/app.js`, `styles/app.css` | A (contrôles) et B (fichier) |
| **D — intégration** | `index.html`, `service-worker.js`, `README.md` | A, B, C |

Aucun lot ne touche les fichiers d'un autre. `js/app.js` n'appartient qu'à C.

## Critères d'acceptation

1. `node scripts/verifier.mjs` vert sur `data/lois/protection-enfants.json` avec gate 3.
2. `node scripts/preuve-gate.mjs` : 7 cas sur 7 (5 existants + 2 nouveaux).
3. `#/devoir/protection-enfants/article` affiche la clause, le scrutin 8428 et « b) (Supprimé) ».
4. Les 16 routes rendent sans erreur console, avec la nouvelle loi.
5. `scripts/mobile.mjs` : aucun débordement à 390 et 360 px sur l'écran de lecture.
6. Aucun chiffre affiché qui ne soit ni dans le JSON publié ni dans `variante.supprimee_par`.
