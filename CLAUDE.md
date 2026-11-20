## Délégation

- Tâche simple (recherche, petite modification, lancer les tests, refactor mécanique) : la déléguer à un worker opencode.
- Commande : `orca orchestration worker-start --agent opencode --model opencode/deepseek-v4.1-flash --worktree <worktree existant> --spec "..."`.
- Le choix du modèle opencode exige un worktree existant (pas `new-child`) ; l'effort n'est pas supporté.
- Travail complexe ou risqué : reste avec claude.
