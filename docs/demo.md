# Démo Quorum — 11 étapes, 4 minutes

Loi : **projet de loi relatif à la protection des enfants**, scrutin **n° 8429** du 21 juillet 2026.
Serveur : `python -m http.server 8000` dans le dossier du projet, puis `http://127.0.0.1:8000/`.
Avant de commencer : navigation privée, ou `localStorage.removeItem("quorum.v1")` puis rechargement.

| # | Écran | Geste | Ce qui est dit | Temps |
|---|---|---|---|---|
| 1 | Accueil | cliquer **Commencer** | « Une loi, un devoir. Ce qui s'est dit, ce qui s'est voté, et où vous vous situez. » | 10 s |
| 2 | Le fait | défiler la chronologie | « Du dépôt au 5 novembre : le texte n'est pas encore définitif, une commission mixte paritaire est convoquée. » | 20 s |
| 3 | Les extraits | défiler | « L'article 11, mot pour mot. La peine passe à la perpétuité quand la victime a moins de quinze ans. » | 20 s |
| 4 | L'article entier | montrer **Ce qui a changé** | « Une seule mention est marquée “supprimé” : b). Le même jour, un sous-amendement a retiré la période de sûreté à trente ans : 178 pour, 163 contre. » | 20 s |
| 5 | Votre vote | cliquer **Pour** | « Le vote arrive maintenant, une fois le texte lu. Il reste dans ce navigateur : pas de compte, pas de serveur, pas de trace. » | 15 s |
| 6 | Les chiffres | répondre au quiz | « 258 pour, 84 contre : ça mesure le rétablissement de l'article 11. La clause de sûreté, elle, est tombée par 178 contre 163, le même jour. Quinze voix d'écart. » | 20 s |
| 7 | Le débat, mot pour mot | montrer une citation, ouvrir un compte rendu | « Ici, aucune reformulation : trois voix de chaque côté, chacune recopiée du compte rendu. Le contrôle refuse le fichier si un seul mot change. » | 35 s |
| 8 | Les chiffres vérifiés | lire les trois cartes | « 3 % et 1 % : confirmés par la CIIVISE. 70 % : non documenté, parce que le rapport de 2022 n'a pas été retrouvé. Un chiffre sans source ne devient pas un fait. » | 30 s |
| 9 | La presse | survoler les deux colonnes | « Des titres réels, datés, liés. Aucun commentaire, aucun classement politique. » | 15 s |
| 10 | Votre vote final | cliquer **Contre**, lire le résultat | « Deuxième vote, après le débat. Changer d'avis ne rapporte rien : les points ne récompensent que le parcours. » | 15 s |
| 11 | La carte | basculer **Avec vous** | « 577 sièges, 224 non occupés, jamais attribués à un groupe. Voilà où est votre voix. » | 20 s |

Clôture (15 s) : « Aucun appel IA dans l'app. Le contenu est publié par des contrôles automatiques : une phrase citée absente du compte rendu, un verdict sans source, un “non documenté” avec une source — chacun de ces cas refuse le fichier entier. »

## Le point qui porte la démo

Deux décomptes, le même jour, sur le même article :

- **n° 8429** — rétablir l'article 11 : **258 pour, 84 contre, 10 abstentions**.
- **n° 8428** — supprimer l'alinéa 5 (la période de sûreté à trente ans) : **178 pour, 163 contre, 5 abstentions**.
- Texte adopté : **« b) (Supprimé) »**.

Ni le titre ni les chiffres du scrutin principal ne le disent. Il faut lire le texte adopté et l'alinéa.

## Le second point : un chiffre n'est pas un fait

- « Moins de 3 % des auteurs sont condamnés » → **confirmé** par la CIIVISE.
- « Moins de 1 % des agresseurs incestueux sont condamnés » → **confirmé**, même source.
- « 70 % des affaires de viol sans acte d'enquête » → **non documenté** : le rapport de juillet 2022 n'est publié sur aucun site officiel.

Le verdict ne dit jamais si la loi est bonne. Il dit ce que la source établit, et rien de plus. Rien n'est colorié en vert ni en rouge : « confirmé » ne doit pas se lire comme « pour ».

## Filet

- **Serveur éteint** : les captures de `docs/captures/` remplacent la démo, et `wp.html` montre l'état du plan.
- **Donnée manquante** : on ne comble pas. On dit « non documenté » et on passe à l'écran suivant.
- **Vote déjà fait** : navigation privée, ou `localStorage.removeItem("quorum.v1")` puis rechargement.
- **Question piège sur 8428** : « le sous-amendement a été adopté par 178 voix contre 163, majorité requise 171. » Chiffres du scrutin, recopiés.

## Ce qu'on ne montre pas

- L'arbre de progression et la méthode : une phrase suffit si on les demande.
- `wp.html` : outil de pilotage, pas un écran du produit.
