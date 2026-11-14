# Démo Quorum — 9 étapes, 4 minutes

Serveur : `python -m http.server 8000` dans le dossier du projet, puis `http://127.0.0.1:8000/`.
Avant de commencer : `localStorage.clear()` dans la console, ou navigation privée, pour que le vote soit vierge.

| # | Écran | Geste | Ce qui est dit | Temps |
|---|---|---|---|---|
| 1 | Accueil | aucune | « Une loi, un devoir. On vous montre ce qui s'est dit, ce qui s'est voté, et où vous vous situez. » | 20 s |
| 2 | Votre vote | cliquer **Pour** | « Premier vote, à froid. Il reste dans ce navigateur : pas de compte, pas de serveur, pas de trace. » | 20 s |
| 3 | Le fait | défiler la chronologie | « Treize étapes, du dépôt au Journal officiel. Les couleurs ne désignent que l'institution : Assemblée, Sénat, commission. » | 30 s |
| 4 | Les extraits | défiler, ouvrir **L'article entier** | « Neuf phrases retenues sur vingt-quatre, copiées mot pour mot. Le texte officiel est à un clic. » | 30 s |
| 5 | Les chiffres | répondre au quiz | « 296 pour, 224 contre, 41 abstentions. Le quiz ne donne pas de points de contenu : il vérifie la lecture. » | 25 s |
| 6 | La presse | survoler les deux colonnes | « Deux titres de chaque côté, avec leur date et leur lien. Aucun commentaire, aucun classement politique. » | 25 s |
| 7 | Les ressources | lire une citation de chaque bord | « Les voix citées : le ministère, les rapporteurs, France Nature Environnement, la LPO. Liste fermée, citations vérifiées. » | 30 s |
| 8 | Votre vote final | cliquer **Contre**, puis lire le résultat | « Deuxième vote, après avoir lu. Changer d'avis ne rapporte rien : les points ne récompensent que le parcours. » | 25 s |
| 9 | La carte | basculer **Avec vous** | « 577 sièges, 15 non occupés, jamais attribués à un groupe. 224 sièges ont voté comme vous. Voilà où est votre voix. » | 25 s |

Clôture (15 s) : « Aucun appel IA dans l'app. Le contenu est publié par des contrôles automatiques : un siège de trop, un média hors liste, un extrait absent du texte, et le fichier est refusé. »

## Filet

- **Serveur éteint** : les captures de `docs/captures/` remplacent la démo, et `wp.html` montre l'état du plan.
- **Donnée manquante** : on ne comble pas. On dit « non documenté » et on passe à l'écran suivant.
- **Vote déjà fait** : navigation privée, ou `localStorage.clear()` puis rechargement.

## Ce qu'on ne montre pas

- L'arbre de progression et la méthode : ils existent, ils tiennent en une phrase si on les demande.
- `wp.html` : outil de pilotage, pas un écran du produit.
