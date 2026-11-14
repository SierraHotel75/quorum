# Trois directions de deck — Quorum

Document de travail. Les trois directions sont montrées en vraies diapos dans
`docs/presentation/index.html`. Aucune n'est le deck final.

## Cadre commun

| | |
|---|---|
| Audience | jury de hackathon, debout, 2 minutes, questions ensuite |
| Format | 16:9, 1920 × 1080, 10 diapos, corps ≥ 24 px, étiquettes ≥ 16 px |
| Contenu | `data/lois/protection-enfants.json` (scrutins n° 8429 et n° 8428), `data/ref/*`, `docs/demo.md`, `docs/slides.md`, `docs/questions.md` |
| Règle de fond | aucun avis sur la loi, aucun jugement sur les camps ; chaque chiffre est tracé dans le dépôt, sinon « non documenté » |
| Captures | `docs/captures/*.png` sont des captures de l'application (390 px), pas des maquettes. `assets/mockups/*` sont des maquettes et ne sont pas utilisées ici. |
| Statut | direction recommandée, pas encore choisie : aucun utilisateur n'était disponible pour trancher |

Les trois directions partagent le même contenu et le même ordre de démonstration.
Elles diffèrent par la structure de page, pas par la couleur.

---

## Direction A — Le compte rendu

| | |
|---|---|
| Idée | Le deck est traité comme un compte rendu imprimé : une marge de cote, deux colonnes, des chiffres dans la colonne. La neutralité se voit dans la forme du document, pas dans un slogan. |
| Composition | Grille à 12 colonnes avec une marge de 186 px réservée aux cotes (numéro de scrutin, date, source). Deux colonnes de texte, filets horizontaux fins, aucune carte flottante. Les chiffres occupent la colonne, les citations occupent la ligne. |
| Typographie | Serif pour les titres et les citations (pile `--serif` de `styles/tokens.css`), sans-serif pour le corps, mono pour les cotes et les libellés. Titres 96–148 px, corps 30–34 px, cotes 18 px. Aucune capitale espacée au-dessus de chaque titre : la cote est dans la marge, pas en décoration. |
| Palette (tokens) | `--fond #151110`, `--texte #ede7dc`, `--texte-doux #9a8f82`, `--bois #a9744b` pour les filets éditoriaux, `--bordeaux #8e1b22` réservé à l'action (jamais une donnée). `--pour #4e9a72` et `--contre #cf6357` uniquement sur les décomptes. |
| Traitement des chiffres | Chiffres alignés à gauche, en serif, avec leur libellé en mono sous la ligne de base. Un seul rapport par diapo : 258 / 84 / 10 puis 178 / 163 / 5. L'écart de 15 voix est écrit, pas dessiné. Aucun camembert, aucune barre. |
| Rôle des captures | Une capture est une pièce jointe : petite, encadrée d'un filet, légendée avec son écran et sa largeur. Elle prouve un écran, elle ne décore pas la page. Une seule capture par diapo, au maximum. |
| La phrase qui porte | « Deux décomptes, le même jour, sur le même article. » |

### Structure — 10 diapos

| # | À l'écran | Phrase qui porte |
|---|---|---|
| 1 | Couverture : masthead `QUORUM`, titre serif sur deux lignes, cote `n° 8429 · 21 juillet 2026`, mention « texte non définitivement adopté — CMP convoquée le 5 novembre 2026 ». | « Ce qui s'est dit. Ce qui s'est voté. » |
| 2 | Chronologie en 13 entrées, du dépôt du 27 mai 2026 à la CMP du 5 novembre 2026, filet vertical. | « Le texte n'est pas définitif : une commission mixte paritaire est convoquée. » |
| 3 | Neuf extraits de l'article 11, puis `b) (Supprimé)`, puis la phrase retirée citée mot pour mot et le renvoi au scrutin n° 8428. | « Une seule mention est marquée supprimée : b). » |
| 4 | Le premier vote, placé après le texte : stockage local, aucun envoi. | « Le vote arrive après le texte et reste dans le navigateur. » |
| 5 | Les deux décomptes face à face, 8429 et 8428, avec l'écart de 15 voix entre 178 et 163. | « 258 contre 84. 178 contre 163, le même jour. » |
| 6 | Six citations, trois par bord, chacune avec son compte rendu et sa date ; une note sur le rapport de 2,5 entre les totaux de caractères. | « Chaque phrase est recopiée ; une seule erreur refuse le fichier. » |
| 7 | Trois chiffres vérifiés : 3 % et 1 % confirmés par la CIIVISE, 70 % non documenté. | « Un chiffre sans source reste non documenté. » |
| 8 | Quatre titres de presse en deux colonnes : quotidienne nationale, hebdomadaire et numérique. | « Les colonnes sont classées par type de publication, pas par bord. » |
| 9 | Le vote final et le parcours : huit actions, changement d'avis sans point. | « Changer d'avis ne rapporte rien ; les points ne récompensent que le parcours. » |
| 10 | La carte : 577 sièges, 353 présents, 224 non occupés ; les dix contrôles et `gate 5`. | « Les absents restent des absents. » |

---

## Direction B — La chambre

| | |
|---|---|
| Idée | Le deck prend l'échelle des sièges comme unité de composition. L'arc apparaît une seule fois, en capture réelle de la carte, comme témoin du second décompte ; le reste est typographique. |
| Composition | Pleine page sombre, un seul objet par diapo. Les nombres occupent les angles, jamais une grille de cartes. Les diapos de citation passent en deux colonnes verticales, sans arc. |
| Typographie | Très gros serif pour les nombres (196–420 px), sans-serif pour le corps, mono pour les identifiants de scrutin. Les titres sont courts et font 72–110 px. |
| Palette (tokens) | `--fond #151110`, `--texte #ede7dc`. Le vert `--pour #4e9a72` et le rouge `--contre #cf6357` sont admis parce qu'ils portent une donnée de vote, jamais un jugement. `--abstention #a39c8c`, `--filet #3a322c`. `--bordeaux` absent des diapos de données. |
| Traitement des chiffres | Les nombres sont le décor : 577 en couverture, puis 353 / 224 / 0. La carte de l'app, en capture, est le seul visuel : elle montre les 577 sièges et les 224 points gris non occupés. Le second scrutin (178–163) est un bandeau, pas un second arc. Une idée chiffrée par diapo. |
| Rôle des captures | Une capture est une fenêtre de preuve : recadrée, posée sur le fond, avec sa légende. Elle montre l'écran que les nombres ne peuvent pas montrer (la carte, le débat). Jamais de capture en fond plein. |
| La phrase qui porte | « Trois cent cinquante-trois sièges présents. Deux cent vingt-quatre vides. » |

### Structure — 10 diapos

| # | À l'écran | Phrase qui porte |
|---|---|---|
| 1 | Couverture : `577` en 420 px, `353 présents` / `224 non occupés` / `0 absent attribué`, 258 / 84 / 10 en pied. | « Trois cent cinquante-trois sièges présents. Deux cent vingt-quatre vides. » |
| 2 | Chronologie verticale, 13 dates, la CMP du 5 novembre en dernier. | « Le texte n'est pas définitif : une commission mixte paritaire est convoquée. » |
| 3 | L'article 11 en gros serif, avec `b) (Supprimé)` seul au centre et la phrase retirée en dessous. | « Le texte adopté porte “b) (Supprimé)”. » |
| 4 | Un point isolé hors de l'arc, barré, avec la mention « vote non transmis ». | « Votre vote n'est pas un siège. » |
| 5 | Les deux décomptes : bandeau 8429, bandeau 8428 avec l'écart de 15 voix, et la carte en capture recadrée comme témoin. | « Deux votes, le même jour, sur le même article. » |
| 6 | Deux colonnes verticales, fond `--pour-fond` et `--contre-fond`, trois citations chacune, sources en bas. | « Trois voix de chaque côté, recopiées. » |
| 7 | Deux mots en 196 px : `Confirmé`, `Non documenté`, sans couleur ; 3 %, 1 %, 70 % en note. | « Confirmé n'est pas pour. » |
| 8 | Quatre titres de presse en deux colonnes, dates en mono, aucun commentaire. | « Quatre titres, deux types de publication, aucun classement politique. » |
| 9 | Huit actions du parcours en ligne, `0` point pour un changement d'avis. | « Les points comptent des actions, jamais un choix. » |
| 10 | Les dix contrôles en colonne, `gate 5`, une citation refusée en exemple. | « La neutralité n'est pas une intention : c'est un passage obligé. » |

---

## Direction C — Le dossier

| | |
|---|---|
| Idée | Le deck est la chemise du dossier : pièces numérotées, bordereau, tampon de contrôle. Le passage `gate 5` est un tampon sur le fichier, jamais sur la loi. |
| Composition | Thème clair de lecture (`[data-theme="lecture"]`) : papier `#f6f4ef`, encre `#161616`. Une cote de pièce, un rail de pièces à gauche, une pièce justificative à droite. Les tableaux remplacent les cartes. |
| Typographie | Serif pour les titres (96–132 px), sans-serif pour le corps (28–32 px), mono pour les numéros de pièce, les montants et les contrôles (20–26 px). |
| Palette (tokens light) | `--fond #f6f4ef`, `--texte #161616`, `--bois #8a5a34` pour les filets, `--bordeaux #8e1b22` pour le tampon et l'action uniquement. `--pour #2f6b4f` / `--contre #9b3a32` seulement dans le bordereau de vote. |
| Traitement des chiffres | Tableau aligné à droite, chiffres tabulaires, chaque ligne suivie de son contrôle arithmétique : `258 + 84 + 10 = 352`, `258 + 84 = 342`, `353 + 224 = 577`. L'addition est la démonstration. |
| Rôle des captures | Une capture est une pièce du dossier : encadrée, numérotée, légendée avec sa date et sa largeur. Elle est posée, pas collée ; aucun ruban adhésif, aucun trombone dessiné. |
| La phrase qui porte | « Un dossier, pas un flux. » |

### Structure — 10 diapos

| # | À l'écran | Phrase qui porte |
|---|---|---|
| 1 | Chemise : cote `n° 8429`, titre, quatre blocs de pièces (9 extraits, 6 citations, 4 titres, 3 chiffres vérifiés), capture de l'article à droite, tampon `GATE 5`. | « Un dossier, pas un flux. » |
| 2 | Chronologie en 13 lignes, du 27 mai au 5 novembre 2026, avec la mention CMP. | « Du dépôt à la commission mixte paritaire. » |
| 3 | L'article 11, la citation de l'alinéa a), `b) (Supprimé)`, et la phrase retirée. | « Une seule mention supprimée, citée mot pour mot. » |
| 4 | Fiche « premier vote » : stockage local, aucun envoi. | « Le vote ne quitte pas l'appareil. » |
| 5 | Bordereau du scrutin : 258 / 84 / 10 / 352 / 342 / 353 / 224 / 577, avec les trois additions vérifiées. | « L'arithmétique est vérifiée avant publication. » |
| 6 | Six citations en fiches, trois par bord, avec séance et date. | « Aucune reformulation. » |
| 7 | Trois fiches de vérification : 3 % confirmé, 1 % confirmé, 70 % non documenté. | « La source manque : le chiffre reste non documenté. » |
| 8 | Quatre titres de presse, classés par type de publication. | « Titres réels, datés, liés. » |
| 9 | Fiche « vote final » : huit actions, changement d'avis sans point. | « Le parcours compte, le choix ne compte pas. » |
| 10 | Carte 577 / 353 / 224 et tampon `GATE 5 — contrôles du fichier`. | « Le tampon porte sur le fichier, pas sur la loi. » |

---

## Comparaison

| Axe | A — Le compte rendu | B — La chambre | C — Le dossier |
|---|---|---|---|
| Structure | page imprimée, marge de cote, deux colonnes | un objet par page, arc et nombres | chemise, rail de pièces, bordereau |
| Température | neutre, documentaire | démonstrative, physique | calme, administrative |
| Risque principal | monotonie du spread | lecture « campagne » par le vert/rouge | pastiche papier et tampon ambigu |
| Dépendance aux visuels | faible | forte (l'arc) | moyenne (les captures-pièces) |
| Tenue à 2 minutes | forte : une idée par page | forte si l'arc reste unique | forte si le bordereau reste lisible |
| Neutralité par construction | montrée par la cote et le contrôle | montrée par l'échelle des sièges | montrée par le tampon de fichier |

## Recommandation

**Direction A — Le compte rendu.**

1. Le sujet est un document : un texte adopté, deux décomptes, des citations. A met le document au centre et évite de transformer la soutenance en campagne.
2. La neutralité par construction est une affaire de typographie et de contrôle. A peut montrer les dix contrôles et `gate 5` sans slogan, dans la marge, à leur place.
3. La capture y est une pièce, pas un décor. Elle ne concurrence pas les chiffres et reste lisible à sa taille réelle (390 px).
4. A tient avec une seule loi et peu de visuels. B dépend de son arc ; C dépend de sa métaphore. Si un élément tombe, A reste un document lisible.
5. A prolonge l'identité de l'app (fond chambre, bordeaux d'action, bois éditorial) sans la copier : le deck ne prétend pas être l'écran.

### Risques de A

- Deux colonnes répétées peuvent devenir monotones : garder une seule idée par diapo et varier le rapport entre texte, chiffre et citation.
- Le pastiche « vieux journal » guette : pas de texture, pas de faux grain, pas de titre en caractères d'imprimerie d'époque.
- La densité peut rendre le texte illisible au fond de la salle : corps à 30 px minimum, jamais plus de six lignes par bloc.

### Risques de B

- Le vert et le rouge peuvent se lire comme bien et mal, alors qu'ils ne disent que pour et contre. Le risque augmente quand ils couvrent la page.
- L'arc vient d'une capture de la carte : les couleurs y sont celles des groupes, alors que le vert et le rouge disent pour et contre ailleurs. Deux systèmes de couleur sur la même page se confondent vite.
- Avec un seul motif, la cinquième diapo ressemble à la première. B doit réserver l'arc à une seule page et accepter des pages purement typographiques.

### Risques de C

- Papier clair, serif et bordeaux forment la combinaison la plus standard des pages générées en 2026 ; sans une structure de dossier réelle, C devient un habillage.
- La métaphore administrative peut embellir la bureaucratie au lieu d'expliquer le contrôle.
- Le tampon peut être lu comme une approbation de la loi. Il doit toujours porter la mention « contrôles du fichier » et jamais « adopté ».

## Décision

Aucun choix utilisateur n'est enregistré à ce stade. La direction recommandée est A.
Quand l'utilisateur tranche, écrire `direction-approved.md` avec les diapos
montrées et sa phrase exacte, puis construire les dix diapos de A. Les deux autres
directions restent dans `index.html` comme alternatives documentées.
