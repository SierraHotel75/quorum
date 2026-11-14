# Déroulé oral — 2 minutes, 10 diapos

Version courte de la démo en 11 étapes de `docs/demo.md`. Même loi, mêmes écrans,
mêmes chiffres ; seules les étapes 3 et 4 sont montrées sur la même diapo. Les
étapes 10 et 11 restent distinctes. Rien n'est ajouté qui ne soit dans le dépôt.

Loi : **projet de loi relatif à la protection des enfants**, scrutin **n° 8429** du
21 juillet 2026. Serveur : `python -m http.server 8000`, puis
`http://127.0.0.1:8000/`. Avant : navigation privée, ou
`localStorage.removeItem("quorum.v1")` puis rechargement.

| # | Temps | Ce qu'on dit — une phrase | Ce qu'on montre | Preuve chiffrée |
|---|---|---|---|---|
| 1 | 0:00–0:08 | « Une loi, un devoir : ce qui s'est dit, ce qui s'est voté, et où vous vous situez. » | Accueil, puis **Commencer** ; écran du devoir. | Scrutin n° 8429 du 21 juillet 2026 (`protection-enfants.json`). |
| 2 | 0:08–0:20 | « Du dépôt au 5 novembre, le texte n'est pas définitif : une commission mixte paritaire est convoquée. » | La chronologie, défiler. | 13 entrées datées, du 27 mai au 5 novembre 2026. |
| 3 | 0:20–0:38 | « L'article 11, mot pour mot : la perpétuité pour un mineur de quinze ans, et une seule mention marquée supprimée, b). » | Le résumé, puis l'article entier et **Ce qui a changé**. | 9 extraits ; 1 mention `b) (Supprimé)` ; le même jour, 8428 : 178 pour, 163 contre, 5 abstentions, 15 voix d'écart. |
| 4 | 0:38–0:48 | « Le premier vote arrive après le texte, et il reste dans ce navigateur : pas de compte, pas de serveur, pas d'envoi. » | Écran **Votre vote**, cliquer **Pour**. | 2 votes dans le parcours, aucun publié ; stockage `localStorage` uniquement. |
| 5 | 0:48–1:02 | « 258 pour, 84 contre : c'est le rétablissement de l'article 11 ; la clause de sûreté est tombée par 178 contre 163, le même jour. » | Les chiffres, lire le décompte. | 258 / 84 / 10 ; 352 votants ; 342 exprimés ; 1 non-votant ; majorité absolue des 342 exprimés, soit 172. |
| 6 | 1:02–1:18 | « Ici, aucune reformulation : trois voix de chaque côté, chacune recopiée du compte rendu. » | Le débat, mot pour mot ; ouvrir un compte rendu. | 6 citations (3 + 3) ; rapport maximal de 2,5 entre les totaux de caractères par bord. |
| 7 | 1:18–1:32 | « 3 % et 1 % sont confirmés par la CIIVISE ; 70 % reste non documenté, parce que le rapport de 2022 n'a pas été retrouvé. » | Les chiffres vérifiés, trois cartes. | 3 % et 1 % confirmés ; 70 % non documenté ; 0 source pour le 70 %. |
| 8 | 1:32–1:40 | « Des titres réels, datés, liés : deux colonnes classées par type de publication, jamais par bord politique. » | La presse, survol des deux colonnes. | 4 titres (2 + 2) ; 2 types de publication. |
| 9 | 1:40–1:48 | « Deuxième vote, après le débat : changer d'avis ne rapporte rien, les points ne récompensent que le parcours. » | Votre vote final, cliquer **Contre**, lire le résultat. | 8 actions ; 0 point pour un changement d'avis. |
| 10 | 1:48–2:00 | « 577 sièges, 224 non occupés, jamais attribués à un groupe : voilà où est votre voix. » | La carte, basculer **Avec vous**. | 577 sièges ; 353 présents ; 224 non occupés ; 10 contrôles ; `gate 5`. |

## Correspondance avec les 11 étapes de `docs/demo.md`

| `docs/demo.md` | Diapo | Traitement |
|---|---|---|
| 1 Accueil | 1 | même phrase, même geste |
| 2 La chronologie | 2 | idem |
| 3 Le résumé | 3 | fusionné avec l'étape 4 |
| 4 L'article entier | 3 | même écran, même mention `b)` |
| 5 Votre vote | 4 | idem |
| 6 Les chiffres | 5 | idem |
| 7 Le débat | 6 | idem |
| 8 Les chiffres vérifiés | 7 | idem |
| 9 La presse | 8 | idem |
| 10 Votre vote final | 9 | idem |
| 11 La carte | 10 | la clôture de `demo.md` est fondue dans la diapo |

## Ce qu'on ne dit pas

- Aucun jugement sur la perpétuité, sur les auteurs des amendements ou sur les groupes.
- Aucune prédiction de vote, aucun “les Français pensent que”.
- Aucun chiffre non tracé : si une question sort du dépôt, répondre « non documenté ».
- Aucune capture de `docs/captures/` présentée comme une maquette, et aucune maquette
  présentée comme le produit fini. Les visuels de `assets/mockups/` ne sont pas dans ce déroulé.
## Filet pendant l'oral

- **Serveur éteint** : les captures de `docs/captures/` remplacent la démo ; `wp.html`
  reste un outil de pilotage, pas un écran du produit.
- **Vote déjà fait** : navigation privée, ou `localStorage.removeItem("quorum.v1")`.
- **Retard à 1:30** : sauter la diapo 8 (presse), garder la 10 et sa clôture.
- **Question piège sur 8428** : « le sous-amendement a été adopté par 178 voix contre
  163, majorité requise 171 » — chiffres du scrutin, recopiés.

## Clôture si le temps le permet (15 s, hors des 2 minutes)

« Aucun appel IA dans l'app. Le contenu est publié par des contrôles automatiques :
une phrase citée absente du compte rendu, un verdict « confirmé » sans source, un
“non documenté” avec une source — chacun de ces cas refuse le fichier entier. »
