# Règles du projet

## Secrets

- Ne jamais afficher une clé, un token ou un mot de passe dans le chat.
- Ne jamais écrire un secret dans un fichier versionné. Les clés passent par les variables d'environnement.
- `opencode.json` ne contient que des références `{env:...}`.

## Windows et fichiers

- Écrire les JSON en UTF-8 sans BOM.
- Éviter de copier une base SQLite pendant que son application tourne.

## Façon de travailler

- Lire les sorties de commandes en entier, pas de `head` ou `tail`.
- Ne rien publier ni envoyer vers un service externe sans demande explicite.
- Vérifier les coûts sur le prix réellement routé, pas sur le prix catalogue.
- Ne pas installer de dépendance ou de framework sans accord.

## Mode ADHD (par défaut)

- La première ligne donne la prochaine action.
- Numéroter les tâches en plusieurs étapes.
- Finir par une seule action concrète.
- Pas de préambule, pas de récapitulatif, pas de formule de politesse finale.

## Hackathon

- Neutralité stricte : aucun avis personnel sur les lois.
- Source ou silence : sans source, écrire « non documenté ».
- Aucun appel IA en direct dans l'app : le contenu vient de fichiers JSON pré-générés. Aucune relecture humaine, pas même par échantillonnage : des contrôles automatiques bloquants décident de la publication.
- Le vote de l'utilisateur est privé.
- Les XP ne récompensent que le processus, jamais le contenu du vote.
- Voir `PLAN.md` pour le détail.

## Stack retenue

- Front : HTML, CSS et JavaScript natifs, avec Tailwind CSS pour reprendre facilement des designs trouvés sur internet.
- Aucun backend, aucun framework JS au départ.
- Sortie purement statique, hébergeable sur n'importe quel serveur de fichiers.
- Scripts de génération des données en Node.js, exécutés hors ligne, jamais dans l'app.

## Données

- Source unique pendant la génération : MCP Hémicycle (`hemicycle`).
- Chaque loi générée devient un fichier JSON dans `data/lois/`, publié seulement après les contrôles automatiques.
- L'app ne doit dépendre ni de Hémicycle ni d'un service IA à l'exécution.
