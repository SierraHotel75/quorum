# Guide : passer à opencode (TUI, Featherless)

Objectif : travailler uniquement dans opencode, en TUI, avec les modèles DeepSeek via Featherless, en gardant les règles et outils utiles.

Ce guide suppose que tu lances tout depuis `C:\Users\PCUSER\hackathon`.

---

## 1. Ce qui part avec toi, et ce qui reste ici

| Élément | Où il est | Transfert |
|---|---|---|
| Plan du hackathon | `D:\Claude\hackathon\PLAN.md` | Copier (étape 6) |
| Règles de neutralité et sources | Dans `PLAN.md` | Inclus avec le plan |
| Instructions globales (ADHD, secrets, encodage JSON, sorties complètes) | `C:\Users\PCUSER\.claude\CLAUDE.md` et `skills\apprentissages\regles-generales.md` | Réécrire dans `AGENTS.md` (étape 5) |
| Hooks de démarrage (mode ADHD, mode Ponytail) | Hooks Claude Code | Non transférables : réécrire leur contenu dans `AGENTS.md` |
| Skills Claude personnels | `~\.claude\skills` | Lus automatiquement par opencode (compatibilité `.claude/skills`) |
| Skills des plugins Claude | `~\.claude\plugins\cache\...` | Non lus automatiquement : liens créés dans `~\.config\opencode\skills` (voir § 9) |
| `huashu-design` | `C:\Users\PCUSER\hackathon\.agents\skills\huashu-design` | Lu automatiquement (projet : `.claude/skills` et `.agents/skills`) |
| MCP Hémicycle | Configuré dans Claude Desktop | Reconfigurer dans `opencode.json` (étape 4) |
| Mémoire Claude | `C:\Users\PCUSER\.claude\projects\...\memory` | Copier à la main les faits utiles dans `AGENTS.md` |
| Clé Featherless | Ton compte | Variable d'environnement uniquement (étape 3) |
| Clé Hémicycle | Ton compte | Variable d'environnement uniquement (étape 3) |

---

## 2. Installer opencode

L'application desktop est installée : `C:\Users\PCUSER\AppData\Local\Programs\ai.opencode.desktop\OpenCode.exe`. Le CLI embarqué est `C:\Users\PCUSER\AppData\Roaming\ai.opencode.desktop\cli\2.3.0-x64\opencode-cli.exe` (version 2.3.0). Il n'est pas dans le `PATH` : appeler ce chemin complet, ou l'ajouter si besoin. Pour installer le CLI seul : `npm i -g opencode-ai`, puis `opencode --version`.

---

## 3. Mettre les clés en variables d'environnement

Ne colle jamais une clé dans le chat ni dans un fichier du projet.

1. Ouvre les variables d'environnement Windows (menu Démarrer → « Modifier les variables d'environnement pour votre compte »).
2. Ajoute `FEATHERLESS_API_KEY` et `HEMICYCLE_API_KEY`, avec leurs valeurs.
3. Ferme et rouvre le terminal.

---

## 4. Créer `opencode.json`

Version vérifiée : opencode 2.3.0 (application desktop). OpenCode V2 utilise `providers` (au pluriel), `package` et `settings`, et range les serveurs MCP sous `mcp.servers`. L'ancien format V1 (`provider`, `npm`, `options`, serveurs directement sous `mcp`) ne s'applique plus.

Crée `C:\Users\PCUSER\hackathon\opencode.json` avec ce contenu :

```json
{
  "$schema": "https://opencode.ai/config.json",
  "providers": {
    "featherless": {
      "name": "Featherless",
      "env": ["FEATHERLESS_API_KEY"],
      "package": "@opencode/ai/providers/openai-compatible",
      "settings": {
        "baseURL": "https://api.featherless.ai/v1"
      },
      "models": {
        "deepseek-ai/DeepSeek-V4.1-Flash": { "name": "DeepSeek V4.1 Flash" },
        "deepseek-ai/DeepSeek-V4.1-Flash-1017": { "name": "DeepSeek V4.1 Flash 1017" },
        "deepseek-ai/DeepSeek-V4-Flash": { "name": "DeepSeek V4 Flash" },
        "moonshotai/Kimi-K3.1-Pro": { "name": "Kimi K3.1 Pro" },
        "Qwen/Qwen3.8-27B": { "name": "Qwen3.8 27B" },
        "zai-org/GLM-5.3": { "name": "GLM 5.3" }
      }
    }
  },
  "model": "featherless/deepseek-ai/DeepSeek-V4.1-Flash",
  "mcp": {
    "servers": {
      "hemicycle": {
        "type": "remote",
        "url": "https://api.hemicycle.ai/mcp",
        "oauth": false,
        "headers": {
          "Authorization": "Bearer {env:HEMICYCLE_API_KEY}"
        }
      }
    }
  }
}
```

Ce qu'il faut confirmer au premier lancement :
- `env` fournit bien la clé Featherless au provider.
- `oauth: false` force l'authentification Hémicycle par en-tête, pas par OAuth.
- `opencode mcp list` voit `hemicycle` (état `connected` seulement après avoir défini la clé).

### Vérifié le 14 novembre 2026

- La clé Featherless est valide : `GET https://api.featherless.ai/v1/models` répond 200 et sert 50 modèles.
- Les identifiants de modèles ci-dessus existent réellement chez Featherless. Trois anciens identifiants n'existent pas : `DeepSeek-V4-Pro`, `Kimi-K2.5`, `MiniMax-M2.5`. Ne pas les remettre.
- Un appel réel a fonctionné : `opencode run --standalone -m featherless/deepseek-ai/DeepSeek-V4.1-Flash "…"` a répondu.
- La clé Hémicycle est valide : `tools/list` et `solde_credits` répondent 200, solde de 1 000 crédits (10 €).
- **La variable d'environnement doit exister avant le démarrage de l'application.** Le service en arrière-plan garde l'environnement de son lancement : sans redémarrage, `opencode mcp list` renvoie 401 « Clé d'accès absente ou invalide » même si la clé est bien définie au niveau Utilisateur.

### La CLI

Le binaire est livré avec l'application desktop, il n'est pas dans le `PATH` :

```
C:\Users\PCUSER\AppData\Local\Programs\ai.opencode.desktop\resources\opencode-cli.exe
```

Commandes utiles :

```powershell
$cli = "C:\Users\PCUSER\AppData\Local\Programs\ai.opencode.desktop\resources\opencode-cli.exe"

# modèles visibles
& $cli models

# état des serveurs MCP
$env:HEMICYCLE_API_KEY = [Environment]::GetEnvironmentVariable('HEMICYCLE_API_KEY','User')
& $cli mcp list

# appel réel, dans un processus neuf qui voit les variables d'environnement
$env:FEATHERLESS_API_KEY = [Environment]::GetEnvironmentVariable('FEATHERLESS_API_KEY','User')
& $cli --standalone run --archived -m "featherless/deepseek-ai/DeepSeek-V4.1-Flash" "Réponds uniquement par OK."
```

`--standalone` lance un serveur privé au lieu de joindre le service en arrière-plan : c'est le moyen de tester une clé fraîchement définie sans redémarrer l'application. Le code de sortie peut valoir 1 alors que la réponse est correcte : la CLI écrit sa progression sur stderr, et PowerShell le traite comme une erreur.

---

## 5. Créer `AGENTS.md`

Crée `C:\Users\PCUSER\hackathon\AGENTS.md`. Ce fichier remplace les instructions que Claude Code chargeait au démarrage. Contenu de départ :

```markdown
# Règles du projet

## Secrets
- Ne jamais afficher de clé, token ou mot de passe dans le chat.
- Ne jamais écrire de secret dans un fichier versionné. Utiliser les variables d'environnement.

## Windows et fichiers
- Écrire les JSON en UTF-8 sans BOM.
- Ne pas copier une base SQLite pendant que son application tourne.

## Façon de travailler
- Lire les sorties de commandes en entier, pas de `head` ou `tail`.
- Ne rien publier ni envoyer vers un service externe sans demande explicite.
- Vérifier les coûts sur le prix réellement routé, pas sur le prix catalogue.

## Mode ADHD (par défaut)
- La première ligne donne la prochaine action.
- Numéroter les tâches en plusieurs étapes.
- Finir par une seule action concrète.
- Pas de préambule, pas de récapitulatif, pas de formule de politesse finale.

## Hackathon
- Neutralité stricte : aucun avis personnel sur les lois.
- Source ou silence : sans source, écrire « non documenté ».
- Aucun appel IA en direct dans l'app : le contenu vient de fichiers JSON relus.
- Le vote de l'utilisateur est privé.
- Les XP ne récompensent que le processus, jamais le contenu du vote.
- Voir `PLAN.md` pour le détail.
```

---

## 6. Copier le plan

Dans le terminal :

```bash
copy "D:\Claude\hackathon\PLAN.md" "C:\Users\PCUSER\hackathon\PLAN.md"
```

---

## 7. Lancer opencode

1. `cd C:\Users\PCUSER\hackathon`
2. `opencode`
3. Dans le TUI, ouvre la sélection de modèle et vérifie que `deepseek-ai/DeepSeek-V4.1-Flash` apparaît sous Featherless.
4. Vérifie que le MCP Hémicycle est chargé.

---

## 8. Premier test

1. Demande une tâche courte, qui appelle Hémicycle, par exemple : « Utilise lister_jeux et donne-moi les 5 premiers jeux. »
2. Vérifie que la réponse cite la source.
3. Vérifie le solde : demande à l'agent d'appeler `solde_credits`, ou ouvre le compte Featherless.

---

## 9. Ce que tu ne transfères pas

- Les subagents Claude : à réécrire ou à remplacer.
- Les commandes Claude (`.claude/commands`, plugins `commands/`) : à réécrire en commandes opencode.
- La mémoire automatique de Claude : tout ce qui compte est dans `AGENTS.md`.
- L'interface Claude Desktop : elle reste disponible, mais ne fait plus partie du flux.

### Skills : ce qui marche déjà

opencode lit automatiquement, sans configuration :

- `~\.claude\skills` (global)
- `.claude\skills` et `.agents\skills` dans le projet (et chaque dossier parent jusqu'à la racine)

Les skills avec `disable-model-invocation: true` (ex. `i-have-adhd`, `review-animations`, `learn`, `reset`) ne sont pas proposés au modèle mais restent chargeables par leur ID, par exemple `@i-have-adhd`.

### Skills des plugins Claude

Les plugins installés rangent leurs skills dans `~\.claude\plugins\cache\...`, que opencode ne scanne pas. Solution retenue : un lien (junction Windows) par skill dans `~\.config\opencode\skills`, qui est un dossier global lu par opencode et ignoré par Claude.

```powershell
$root = "$env:USERPROFILE\.config\opencode\skills"
$vw = "$env:USERPROFILE\.claude\plugins\cache\anthropic-plugin-directory\vibe-wise\0.1.44-eefb53df406a\skills"
$co = "$env:USERPROFILE\.claude\plugins\cache\council-of-high-intelligence\council\1.2.0"
New-Item -ItemType Directory -Path $root -Force | Out-Null
New-Item -ItemType Junction -Path "$root\learn"   -Target "$vw\learn" | Out-Null
New-Item -ItemType Junction -Path "$root\reset"   -Target "$vw\reset" | Out-Null
New-Item -ItemType Junction -Path "$root\council" -Target $co        | Out-Null
```

Les chemins contiennent le numéro de version du plugin : après une mise à jour de plugin, recréer le lien avec le nouveau chemin. Le rechargement est immédiat, pas besoin de redémarrer opencode.

---

## Checklist

- [x] opencode installé et `opencode-cli --version` répond (2.3.0)
- [ ] `FEATHERLESS_API_KEY` et `HEMICYCLE_API_KEY` définies dans l'environnement utilisateur, application relancée
- [x] `opencode.json` créé (format V2) et modèles Featherless listés par `opencode models`
- [x] `AGENTS.md` créé
- [x] `PLAN.md` copié
- [ ] Premier test réussi, solde vérifié
