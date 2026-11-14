# Quorum : plan initial

Statut : v0.2, à compléter au fil de l'eau.
Dernière mise à jour : 2026-11-14.

## Prochaine action

Le socle tourne : accueil, vote par balayage, chronologie, extraits, chiffres et quiz, arguments, presse, spécialistes, vote final, carte de l'hémicycle, arbre, méthode, archive. Reste à brancher les vraies données Hémicycle à la place du jeu de démonstration, puis les contrôles bloquants.

## Concept

Front statique mobile-first, état dans localStorage. Le front ne change pas : seul le mode de production des JSON change. Projet de hackathon open data.

- **v0 (hackathon) — hors ligne** : édition pré-générée avec les crédits du projet, servie en statique et présentée sans réseau. C'est le livrable de démo.
- **v1 (produit) — backend** : un serveur génère en tâche de fond (Hémicycle + opencode, modèle gratuit) et sert le même front et les mêmes JSON. Corpus partagé, génération une fois pour tous, aucun crédit repayé par lecteur.
- **v2 (business)** : freemium + abo pro + B2B au-dessus du même backend et du même corpus.
- **Option BYO** : chacun branche son propre compte Hémicycle et génère en local. Ce n'est plus la v1 par défaut ; c'est un mode de déploiement possible.
- Un "devoir" = une vraie loi ou un amendement de l'Assemblée nationale.
- Objectif : aider l'utilisateur à se faire un avis éclairé, pas lui donner le nôtre.
- Neutralité stricte.
- L'app ne rédige aucun contenu de fond : elle trie et affiche des phrases officielles. L'utilisateur choisit ce qu'il lit, jusqu'au texte entier.
- Résultat final : une carte de l'hémicycle pour se situer politiquement, pas un tableau de scores.

## Règles non négociables

- Aucun appel IA dans le front. Le contenu vient de fichiers JSON écrits par le générateur (backend en v1, pipeline hors ligne en v0), après contrôles. Le front ne lit que ces fichiers.
- Aucune génération à la demande : presse et ressources sont pré-générées avec la loi. Un bouton « recommandations » lit le JSON ; il n'appelle ni IA ni service externe.
- Le vote de l'utilisateur reste dans le navigateur. Il n'est jamais envoyé au modèle, ni au backend de génération, ni à un service tiers.
- Le générateur vérifie le solde Hémicycle avant de dépenser, s'arrête sous un plancher, et enregistre le coût de chaque devoir (`meta.couts`).
- Aucune relecture humaine, pas même par échantillonnage. La publication dépend de contrôles automatiques bloquants : schéma, chiffres, URL fermée, verbatim, couverture, symétrie, répartition, dispersion. Si un contrôle échoue, la loi n'est pas publiée.
- Les chiffres (décomptes, effectifs, dates) sont copiés depuis Hémicycle, jamais produits par l'IA.
- Source ou silence : sans source, afficher "non documenté".
- Le vote de l'utilisateur est privé. Aucun classement public sur les opinions.
- XP uniquement pour le processus : loi lue, source ouverte, camp opposé lu, question répondue, thème exploré.
- Jamais d'XP pour le contenu du vote, ni pour avoir changé d'avis.
- Progression par thèmes : logement, santé, justice, travail, écologie, institutions, budget et fiscalité, éducation.

## Identité visuelle

Direction retenue : **chambre sombre**. Papier et encre sont abandonnés.

- **Nom** : Quorum.
- **Descripteur** : « De l'aide pour accomplir mon devoir civique. »
- **Tagline** : « Ce qui s'est dit. Ce qui s'est voté. »
- **Unité** : un devoir.

**Palette**

| Rôle | Valeur |
|---|---|
| Fond | `#151110` |
| Fond élevé | `#1E1815` |
| Texte | `#EDE7DC` |
| Texte doux | `#9A8F82` |
| Filet | `#3A322C` |
| Bois | `#A9744B` |
| Bordeaux (action) | `#8E1B22` |
| Siège (décor) | `#8E1B22` |

**Règles**

- Pas de bleu dans l'interface. Le bleu de l'Assemblée (`#4C7BC8` sur fond sombre) et le cyan du Sénat (`#07ADDB`) n'apparaissent que dans la chronologie, parce qu'ils identifient une institution.
- Le bordeaux est la couleur d'action, jamais une donnée.
- Le bois marque l'éditorial : étiquette de thème, onglet actif, liens.
- Les sièges prennent la couleur de leur groupe, d'après la composition publiée. La luminosité est ajustée pour le fond sombre, la teinte ne change pas.
- L'accord avec l'utilisateur ne change jamais la teinte : seulement l'opacité.
- Un thème de lecture clair (`data-theme="lecture"`) existe pour les textes longs.
- Typographie : serif éditorial pour les titres et les citations, sans-serif pour l'interface, mono pour les chiffres, les dates et les sources. Replis locaux, aucune police distante : l'app doit tourner hors ligne.
- Pas de logo, pas de Marianne, pas de tricolore, pas de dégradé, pas d'ombre. Mention obligatoire : « Projet indépendant, non affilié à l'Assemblée nationale ni au Sénat. »

## Parcours d'un devoir

1. Vote 1 par swipe (pour / contre / abstention), avant toute information.
2. **Le fait** : chronologie de ce qui s'est passé à l'Assemblée puis au Sénat (dépôt, commission, débat, vote), avec dates et liens.
3. **Les extraits** : l'IA trie et tague des phrases du texte ("Aujourd'hui", "Si adopté", "Qui est concerné"). Chaque phrase est un verbatim, avec article, contexte et lien. L'utilisateur choisit celles qu'il veut lire.
4. **Les chiffres** : décompte, participation, position des groupes. Quiz gabarit. Gain d'XP.
5. **Les arguments** : un pour, un contre, verbatim du débat, avec couverture. Gain d'XP.
6. **La presse** : les mêmes faits vus par des médias de bords différents. Titres juxtaposés, sans commentaire. Le bord est une classification Wikipedia citée.
7. **Les spécialistes** : ressources pour approfondir, par bord, avec affiliation et lien. L'IA sélectionne dans un référentiel, elle n'invente pas de noms.
8. Vote 2 : même vote ou changement.
9. Résultat, seulement après le vote 2 : carte de l'hémicycle. Groupes placés selon l'ordre officiel, avec logo, sigle et effectif. La position de l'utilisateur est une zone indicative calculée sur ses votes. Le score vote 1 → vote 2 mesure le changement, sans jugement.

## Schéma JSON par loi

```json
{
  "id": "",
  "theme": "",
  "titre_court": "",
  "meta": {
    "source": "",
    "licence": "Licence Ouverte Etalab",
    "genere_le": "",
    "modele": "",
    "prompts_version": "",
    "credits": 0,
    "couts": { "hemicycle_credits": 0 },
    "controles": {
      "schema": true,
      "chiffres": true,
      "urls": true,
      "verbatim": true,
      "symetrie": true,
      "repartition": true,
      "dispersion": true,
      "gabarits": true,
      "chronologie": true,
      "presse": true,
      "ressources": true
    }
  },
  "scrutin": {
    "uid": "",
    "date": "",
    "resultat": "",
    "decompte": { "pour": 0, "contre": 0, "abstention": 0 },
    "url": ""
  },
  "amendement": { "numero": "", "auteur": "", "dispositif": "", "expose_sommaire": "", "url": "" },
  "extraits": [{
    "question": "avant",
    "rang": 1,
    "texte": "",
    "contexte": "",
    "article": "",
    "nature": "dispositif",
    "attribution": "",
    "source_url": ""
  }],
  "articles": {
    "Article 1": { "texte": "", "source_url": "" }
  },
  "chronologie": [{ "date": "", "etape": "", "source_url": "" }],
  "presse": [{
    "media": "",
    "bord": "",
    "titre": "",
    "date": "",
    "url": "",
    "classification_url": ""
  }],
  "ressources": [{
    "nom": "",
    "affiliation": "",
    "bord": "",
    "titre": "",
    "url": "",
    "source_url": ""
  }],
  "stats": [{ "question": "", "options": [], "bonne_reponse": "", "explication": "", "source_url": "" }],
  "arguments": {
    "pour": [{
      "texte": "",
      "orateur": "",
      "groupe": "",
      "date": "",
      "couverture": { "orateurs": 0, "groupes": 0 },
      "source_url": ""
    }],
    "contre": [{
      "texte": "",
      "orateur": "",
      "groupe": "",
      "date": "",
      "couverture": { "orateurs": 0, "groupes": 0 },
      "source_url": ""
    }],
    "ordre_affichage": "pour_first"
  },
  "votes": {
    "groupes": {
      "PO...": { "nom": "", "pour": 0, "contre": 0, "abstention": 0, "position": "" }
    },
    "deputes": {
      "PA...": { "nom": "", "groupe": "", "position": "" }
    }
  }
}
```

Règle de génération : un champ sans source reçoit "non documenté", il n'est jamais inventé. Tout texte de fond — extrait, contexte, article, argument — est un verbatim : sous-chaîne exacte d'un document officiel, jamais une reformulation. L'IA trie, tague et classe ; elle ne rédige pas. Le quiz est un gabarit fixe rempli avec les chiffres du scrutin.

Valeurs fermées : `question` ∈ `avant`, `si_adopte`, `concernes` ; `nature` ∈ `dispositif`, `expose`, `rapport`, `debat`.

## Données

Source unique pendant la génération : **API/MCP Hémicycle**, qui reprend les données publiques de l'Assemblée nationale (Licence Ouverte Etalab). La génération se fait hors du front : pipeline hors ligne en v0, backend en v1. Le front ne contacte jamais Hémicycle.

- Accès REST : `https://api.hemicycle.ai/v1`
- Accès MCP : `https://api.hemicycle.ai/mcp` (outils en lecture seule)
- Documentation : `https://hemicycle.ai/docs-md/donnees.md`
- Identifiants officiels : `https://hemicycle.ai/docs-md/identifiants.md`
- Licence : `https://data.assemblee-nationale.fr/licence-ouverte-open-licence`
- Solde actuel : 1000 crédits (1 crédit = 0,01 €).

Jeux et outils utiles. Tous les jeux coûtent 1 crédit par page, 200 lignes maximum.

| Besoin | Jeu ou outil | Champs clés |
|---|---|---|
| Scrutin | `scrutins` | `uid`, `date_scrutin`, `titre`, `sort_libelle`, `nb_pour`, `nb_contre`, `nb_abstentions` |
| Vote nominatif | `votes` (filtre obligatoire sur `scrutin_ref`, `acteur_ref` ou `groupe_ref`) | `scrutin_ref`, `acteur_ref`, `groupe_ref`, `position` |
| Amendement | `amendements` | `uid`, `numero`, `dispositif`, `expose_sommaire`, `sort_en_seance`, `acteur_ref`, `groupe_politique_ref` |
| Dossier et débat | `dossiers`, `documents`, `actes`, `articles_textes` | titre, procédure, étapes, articles |
| Élus et groupes | `deputes`, `organes`, `mandats` | identité, groupe, mandat |
| Recherche plein texte | outil `rechercher` (2 crédits) | textes, dossiers, amendements |
| Page filtrée | outil `interroger` (1 crédit par page) | filtres, tri, pagination |
| Résultat complet d'un scrutin | outil `resultat_scrutin` (1 crédit) | décompte, position de chaque groupe et de chaque député |

Liens de citation : chaque réponse Hémicycle fournit un `source.url` vers la pièce d'origine (scrutin, amendement, texte, débat). On l'utilise tel quel, sans le reconstruire.

Thèmes retenus (8) : logement, santé, justice, travail, écologie, institutions, budget et fiscalité, éducation.

### Pipeline quotidien (v1)

1. `interroger` sur les scrutins du jour (1 crédit).
2. Sélection : scrutin public, au moins deux groupes majoritairement opposés, débat documenté, thème parmi les 8. Si aucun thème ne dépasse le seuil, la loi est écartée.
3. `resultat_scrutin` (1 crédit) : décompte, position des groupes, votes nominatifs.
4. `lire_amendement`, `lire_texte` et `articles_textes` (2 à 3 crédits).
5. Documents du débat (0 à 1 crédit) : exposé des motifs, rapport, compte rendu.
6. opencode (modèle gratuit) : thème, segmentation en phrases, tags, classement, choix des citations les plus représentatives. Aucune rédaction.
7. Presse et ressources : flux RSS filtrés par mots-clés, sélection dans `data/ref/experts.json`. Aucune rédaction.
8. Contrôles bloquants. En cas d'échec : deux nouvelles tentatives avec l'erreur en entrée, puis abandon de la loi. En cas de succès : écriture de `data/lois/` et de `data/feed.json`.

Budget : 5 à 8 crédits par jour pour une loi. 1000 crédits ≈ 4 à 6 mois à une loi par jour. Effectifs et ordre des groupes rafraîchis une fois par semaine, pas chaque jour.

### Contrôles bloquants

Aucune étape humaine. Chaque contrôle est recalculé par le script, jamais déclaré par le modèle.

- **Schéma** : JSON valide, champs requis présents, types corrects.
- **Chiffres** : décompte et positions identiques à `resultat_scrutin`, comparaison stricte.
- **URL fermée** : chaque `source_url` appartient à la liste des URLs retournées par Hémicycle pour cette loi.
- **Verbatim total** : chaque `texte`, `contexte` et article — extraits comme arguments — est une sous-chaîne exacte d'un document officiel, à la normalisation des espaces près. Aucun texte affiché n'est rédigé.
- **Couverture** : `orateurs` et `groupes` recalculés depuis le document, pas déclarés par l'IA.
- **Symétrie** : un argument par camp, écart de longueur ≤ 20 %, même nombre de phrases à une près, ordre tiré au sort.
- **Répartition** : au moins un extrait par question ; si une question n'a rien, elle affiche "non documenté". Si aucune question n'a d'extrait, la loi est écartée.
- **Dispersion** : les extraits viennent d'au moins deux articles ou documents différents.
- **Sélection visible** : le nombre de phrases retenues et le nombre total de phrases du texte sont recalculés ; l'UI affiche les deux.
- **Gabarits** : les questions et explications du quiz sont des modèles fixes remplis par les chiffres du scrutin, jamais du texte libre.
- **Chronologie** : chaque date et chaque étape correspond à une réponse Hémicycle, avec son lien.
- **Presse** : titre verbatim du flux, média présent dans `data/ref/medias.json`, URL 200, même nombre d'articles par bord à un près, aucun résumé.
- **Ressources** : chaque entrée existe dans `data/ref/experts.json`, URL 200, au moins deux bords représentés, aucun nom inventé.

Un contrôle qui échoue n'est jamais contourné : deux tentatives avec le message d'erreur, puis la loi est abandonnée pour la journée. Mieux vaut un trou dans le flux qu'une phrase non vérifiée.

Les contrôles ne prouvent pas que la sélection est neutre : ils prouvent que rien n'est inventé et que la sélection est visible. Le biais restant est celui du choix des phrases, borné par l'ordre du texte, le compteur et l'accès au texte entier.

### Citations représentatives

Pour chaque camp :

1. Collecter les interventions sur l'article ou l'amendement dans le compte rendu.
2. Regrouper par argument et compter les orateurs et les groupes qui le portent.
3. Choisir l'argument le plus couvert, puis la phrase qui l'énonce le plus complètement.
4. Stocker le verbatim, l'orateur, le groupe, la date, l'URL et la couverture (`orateurs`, `groupes`).
5. Contrôle : le texte est une sous-chaîne exacte de la source.

Si la couverture vaut 1, l'argument est affiché comme isolé, pas comme représentatif. L'IA sélectionne, elle ne réécrit jamais. Aucune intervention humaine : la couverture est recalculée par le script, pas déclarée par le modèle.

### Carte de l'hémicycle

- Référentiel `data/ref/groupes.json` : sigle, nom, effectif, couleur, logo, ordre de placement, URL de source.
- Logos locaux dans `assets/partis/`, repli sur un disque avec le sigle.
- Ordre gauche-droite = placement officiel des groupes. Sans source : ordre alphabétique et mention "non documenté".
- Position de l'utilisateur : barycentre des groupes avec lesquels il est d'accord, pondéré par le nombre de votes communs. Affiché comme une zone, pas un point, avec N.
- Par loi : l'arc est coloré selon le vote de chaque groupe (pour, contre, abstention).

### Presse et ressources

Deux natures de données, à ne pas confondre :

- **Par loi** (généré, contrôlé) : chronologie, extraits, chiffres, arguments, sélection de presse et de ressources.
- **Référentiel** (curé une fois, versionné) : `data/ref/medias.json` (média, bord, URL Wikipedia, date de consultation, URL du flux RSS), `data/ref/experts.json` (thème, nom, affiliation, bord, URL, source du bord). La règle « aucune relecture humaine » porte sur la génération par loi, pas sur la constitution du référentiel.

Presse :

- Titre + média + date + lien. Aucun résumé, aucune synthèse.
- Le bord est la classification Wikipedia, affichée comme telle avec son lien et sa date de consultation. Ce n'est pas un fait officiel.
- Même nombre d'articles par bord, à un près. Si un bord n'a rien : « pas d'article trouvé », jamais un article hors sujet.
- Aucune personnalisation selon le vote de l'utilisateur : tout le monde voit la même sélection.
- Les titres sont verbatim du flux ; l'URL répond 200.

Ressources :

- Sélection dans `data/ref/experts.json` par thème et par pertinence. L'IA ne propose jamais un nom absent du référentiel.
- Au moins deux bords représentés. Affiliation et bord affichés avec leur source.
- Lien vérifié (200), pas de résumé généré.

Récupération : uniquement les flux RSS des médias du référentiel, filtrés par mots-clés et fenêtre de date. Pas de recherche externe, pas d'API payante. Un flux vide ou absent : « pas d'article trouvé ».

### Génération et coûts

- Le générateur est un pipeline versionné (`agent/` ou `scripts/`, `prompts/`) : exécuté par le backend en v1, à la main hors ligne en v0.
- Auth : OAuth Hémicycle du compte projet en v1, du compte utilisateur en mode BYO. Un seul service payant : Hémicycle. Aucun fournisseur de modèle à configurer.
- Il écrit `data/lois/` après les contrôles. Le front ne lit que des fichiers validés.
- Coût : `meta.couts` + `solde_credits` avant/après. Plafond quotidien (`--max-credits`). Sous le plancher, le pipeline s'arrête.
- Planification : worker/cron côté serveur en v1. Rattrapage des jours manqués dans la limite du plafond.
- Publication : le backend sert le front statique et les JSON. En v0, tout est pré-généré et servi sans réseau.
- Les prompts sont des fichiers versionnés, pas des chaînes cachées : `meta.prompts_version` permet de savoir ce qui a produit un devoir.

## Modèle économique

Deux voies, qui ne s'excluent pas ; la seconde est la trajectoire par défaut. Le point commun : le coût est **par loi générée**, pas par lecteur. Une loi coûte 5 à 8 crédits (0,05 à 0,08 € HT) une seule fois, puis se sert à l'infini depuis le cache. 100 € HT ≈ 10 000 crédits ≈ 1 600 lois, soit plus de quatre ans à une loi par jour. Générer n'est pas le coût du produit ; héberger, payer et supporter le sont.

### Voie A — Chacun paie son compte Hémicycle (BYO)

- L'utilisateur branche son propre compte OAuth Hémicycle dans opencode ; le pipeline tourne chez lui. Le projet ne paie ni crédits ni serveur.
- L'app reste statique et gratuite : elle ne lit que les JSON produits localement.
- Conditions à vérifier : Hémicycle autorise-t-il un compte API à un particulier, et la redistribution des JSON produits ? **Non documenté** à ce jour.
- Frein réel : la recharge démarre à 100 € HT. C'est un produit pour militant, association, étudiant avancé ou rédaction, pas pour le grand public.
- Avantage : zéro coût d'infrastructure, zéro modération, zéro donnée utilisateur chez le projet.

### Voie B — Édition hébergée, la structure paie (freemium)

- Un backend génère chaque loi **une fois pour tous** et sert un corpus partagé : chronologie, extraits, chiffres, arguments, presse, ressources. Aucun crédit n'est repayé par lecteur.
- **Gratuit** : archive complète, la loi du jour, les 8 thèmes, vote privé, carte de l'hémicycle. Financement par pub non ciblée ou sponsor, clairement séparé du contenu du devoir.
- **Pro (abonnement)** : suivi quotidien des lois votées, alertes par thème, historique, comparaison dans le temps, export. On ne paye pas l'information civique de base, on paye le suivi.
- **B2B** : licence du même corpus pour rédactions, associations, collectivités, établissements. Accès API ou marque blanche.
- Ce mode suppose un backend, des comptes et un paiement : c'est la **v1** côté technique et la **v2** côté business. Le hackathon reste la v0 statique et hors ligne.

### Garde-fous de neutralité, quel que soit le modèle

- Aucun ciblage publicitaire par opinion, vote ou thème. Pas de pub politique, même indirecte.
- Aucun sponsor dans le corps d'un devoir : ni dans les extraits, ni dans les arguments, ni dans la presse.
- Aucun paywall sur le fait, les chiffres et les arguments. Le payant porte sur le suivi et les alertes.
- Le vote reste privé en v1 comme en v2 ; il ne sert ni à la pub, ni au classement, ni au modèle.

## Ordre de travail

1. Schéma v2 + pipeline d'une seule loi, de bout en bout
2. Contrôles bloquants + 3 lois complètes
3. Boucle front + carte de l'hémicycle
4. Presse et ressources : référentiels + flux RSS
5. Flux quotidien (`data/feed.json`) sur 7 jours
6. Backend de génération + coûts (v1)
7. XP, thèmes, carte de résultat partageable

## Règle de coupe

Si on est en retard : couper les ressources spécialisées, puis la presse, puis réduire la chronologie. Garder le fait, les chiffres, les arguments, le vote 2 et la carte.
Mieux vaut peu de choses fiables que beaucoup de bancal.

## Questions ouvertes

- Méthode de placement sur la carte : barycentre pondéré, avec zone et N affiché. Seuils fixés dans le code et journalisés dans `meta` ; ajustement par les données, pas par validation humaine.
- "Creuser" : devient « lire l'article entier » dans le lecteur d'extraits. Résolu.
- Hébergement statique : à préciser (le chargement de `data/feed.json` demande un serveur, pas `file://`).
- Fréquence : une loi par jour tient le budget. Deux lois par jour divisent l'autonomie par deux.
- Logos des partis : vérification juridique unique au setup, sans lien avec la relecture de contenu.
- Presse : flux RSS des médias du référentiel ou recherche par mots-clés. À trancher au premier essai, sans API payante.
- Orientation des médias : Wikipedia est la source citée, mais la classification est contestée. Elle est affichée comme une classification, pas comme un fait.
- Référentiel experts : une liste par thème, versionnée et sourcée. Qui la constitue reste à définir ; elle ne dépend pas de la génération quotidienne.
- Sénat : la chronologie inclut ses étapes, mais le vote de l'app reste celui de l'Assemblée.
- Modèle gratuit : vérifier les limites de débit et la disponibilité ; prévoir un modèle de repli si le gratuit tombe.
- Backend v1 : hébergement et planification (worker/cron). À trancher.
- Mode BYO : packaging local (Node + dépôt, ou binaire). Optionnel, plus la v1.
- Publication : le backend sert le front et les JSON en v1 ; la v0 est pré-générée et hors ligne. Le mode BYO sert en local.
- Modèle économique : BYO (chacun paie son compte) ou hébergé freemium (la structure paie, pub + pro + B2B). Les deux peuvent coexister ; le corpus partagé est le même.
- Hémicycle : conditions de redistribution commerciale des données et des JSON dérivés **non documentées**. À vérifier avant toute v2 payante.
- BYO : un particulier peut-il ouvrir un compte API, et la recharge de 100 € HT est-elle le seul seuil ? **Non documenté**.
- Pub : format et règles à écrire noir sur blanc (pas de ciblage politique, pas de sponsor dans le devoir). Sinon la neutralité devient invendable.
- Hémicycle OAuth dans opencode : passer `oauth: true` et retirer le header Bearer. À tester.

## Mon contexte (à compléter)

<!-- Ajouter ici, au fil de l'eau : contraintes, décisions, retours. -->

- 2026-11-14 : setup opencode 2.3.0 terminé (`opencode.json` V2, `AGENTS.md`). MCP Hémicycle configuré et testé (18 outils, solde 1000 crédits). Featherless mis de côté : retiré de `opencode.json`, à réactiver quand la clé existera.
- 2026-11-14 : stack front tranchée : HTML/CSS/JS natifs + Tailwind CSS, sans framework JS, sortie statique.
- 2026-11-14 : décisions — génération 100 % automatisée en v1 (Hémicycle + opencode, modèle gratuit), app statique ; résultat = carte de l'hémicycle ; arguments = verbatim le plus représentatif, avec couverture ; seules les lois avec scrutin public et débat documenté sont retenues.
- 2026-11-14 : aucune relecture humaine, pas même par échantillonnage. La neutralité repose sur des contrôles automatiques bloquants et sur la traçabilité (`meta.controles`, `source_url`).
- 2026-11-14 : pivot extractif. L'IA ne rédige plus le contenu de fond : elle segmente, tague et classe des phrases du texte. Tout texte de fond est un verbatim, contexte et article inclus ; le quiz est un gabarit à chiffres. L'utilisateur choisit les phrases à lire et peut ouvrir l'article entier. La garantie devient mécanique : sous-chaîne exacte d'un document officiel.
- 2026-11-14 : parcours d'approfondissement — fait (chronologie Assemblée + Sénat), chiffres, arguments, presse par bord, ressources spécialisées par bord, puis vote 2 et carte. Presse et ressources sont pré-générées : aucun appel IA à la demande. Le référentiel médias/experts est curé une fois, hors génération quotidienne.
- 2026-11-14 : architecture — v0 hors ligne (démo statique pré-générée), v1 backend (génération planifiée + service du front et des JSON), v2 business (freemium + pro). Le mode BYO (compte Hémicycle personnel, génération locale) devient une option, pas la v1. Le vote reste dans le navigateur.
- 2026-11-14 : Featherless abandonné. Presse par flux RSS de sources prédéfinies, sans recherche externe. Le coût par devoir se limite aux crédits Hémicycle.
- 2026-11-14 : modèle économique à deux voies — BYO (compte Hémicycle personnel) ou hébergé freemium (corpus partagé généré une fois, pub non ciblée + abo pro pour le suivi + licence B2B). Coût réel par loi 0,05 à 0,08 € HT ; le coût du produit est l'hébergement et le paiement, pas la génération. Redistribution commerciale Hémicycle non documentée.
