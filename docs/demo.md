# Démo Quorum — 9 étapes, 4 minutes

Loi : **projet de loi relatif à la protection des enfants**, scrutin **n° 8429** du 21 juillet 2026.
Serveur : `python -m http.server 8000` dans le dossier du projet, puis `http://127.0.0.1:8000/`.
Avant de commencer : navigation privée, ou `localStorage.removeItem("quorum.v1")` puis rechargement.

| # | Écran | Geste | Ce qui est dit | Temps |
|---|---|---|---|---|
| 1 | Accueil | aucune | « Une loi, un devoir. Ce qui s'est dit, ce qui s'est voté, et où vous vous situez. » | 20 s |
| 2 | Votre vote | cliquer **Pour** | « Premier vote, à froid. Il reste dans ce navigateur : pas de compte, pas de serveur, pas de trace. » | 20 s |
| 3 | Le fait | défiler la chronologie | « Du dépôt au 5 novembre : le texte n'est pas encore définitif, une commission mixte paritaire est convoquée. » | 30 s |
| 4 | Les extraits | défiler, ouvrir **L'article entier** | « L'article 11, mot pour mot. La peine passe à la perpétuité quand la victime a moins de quinze ans. Une seule mention est marquée “supprimé” : b). » | 30 s |
| 5 | **Ce qui a changé** | montrer le bloc sous l'article | « Le même jour, un sous-amendement a supprimé une phrase : la cour d'assises pouvait porter la période de sûreté à trente ans. 178 pour, 163 contre. Le texte adopté porte “b) (Supprimé)”. » | 40 s |
| 6 | Les chiffres | répondre au quiz | « 258 pour, 84 contre : ça mesure le rétablissement de l'article 11. La clause de sûreté, elle, est tombée par 178 contre 163, le même jour. Quinze voix d'écart. » | 25 s |
| 7 | La presse | survoler les deux colonnes | « Des titres réels, datés, liés. Aucun commentaire, aucun classement politique. » | 25 s |
| 8 | Votre vote final | cliquer **Contre**, lire le résultat | « Deuxième vote, après avoir lu. Changer d'avis ne rapporte rien : les points ne récompensent que le parcours. » | 25 s |
| 9 | La carte | basculer **Avec vous** | « 577 sièges, 224 non occupés, jamais attribués à un groupe. Voilà où est votre voix. » | 25 s |

Clôture (15 s) : « Aucun appel IA dans l'app. Le contenu est publié par des contrôles automatiques : si la phrase citée était encore dans le texte adopté, ou si elle manquait au texte source, le fichier serait refusé. »

## Le point qui porte la démo

Deux décomptes, le même jour, sur le même article :

- **n° 8429** — rétablir l'article 11 : **258 pour, 84 contre, 10 abstentions**.
- **n° 8428** — supprimer l'alinéa 5 (la période de sûreté à trente ans) : **178 pour, 163 contre, 5 abstentions**.
- Texte adopté : **« b) (Supprimé) »**.

Ni le titre ni les chiffres du scrutin principal ne le disent. Il faut lire le texte adopté et l'alinéa.

## Filet

- **Serveur éteint** : les captures de `docs/captures/` remplacent la démo, et `wp.html` montre l'état du plan.
- **Donnée manquante** : on ne comble pas. On dit « non documenté » et on passe à l'écran suivant.
- **Vote déjà fait** : navigation privée, ou `localStorage.removeItem("quorum.v1")` puis rechargement.
- **Question piège sur 8428** : « le sous-amendement a été adopté par 178 voix contre 163, majorité requise 171. » Chiffres du scrutin, recopiés.

## Ce qu'on ne montre pas

- L'arbre de progression et la méthode : une phrase suffit si on les demande.
- `wp.html` : outil de pilotage, pas un écran du produit.
