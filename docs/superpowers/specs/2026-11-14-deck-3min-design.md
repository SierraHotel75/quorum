# Deck 3 minutes + bouton Recommencer — design court

Date : 14 novembre 2026. Approuvé oralement par l'utilisateur, puis révisé : la démo
locale est intégrée à la diapo 3 (avec un bouton pour recommencer un cas), la diapo 2
présente la solution en écrans et la diapo 4 le produit final et sa viabilité, sans
v0 / v1 / v2.

## Intent

Un oral de 3:00 qui coche la grille du jury : Utilité 25, Données publiques 25,
Ambition 20, Démo 20, Présentation 10, +5 si l'API/MCP Hémicycle est au cœur.
Une idée par diapo, un grand chiffre, une phrase, une source. La diapo 2 présente la
solution en écrans avec une ligne technique, la diapo 4 est marketing.

## Approches

- A — 5 diapos, une par critère, démo en direct : retenu. La structure est la réponse
  à la grille.
- B — démo en captures : écarté, perd les 20 points du direct.
- C — garder les 10 diapos de `deck-a.html` et écrire seulement un script : écarté,
  l'utilisateur veut moins de texte à l'écran.

## Les 5 diapos

| # | Titre | Critère | Temps |
|---|---|---|---|
| 1 | La politique intéresse. L'actualité se délaisse. | Utilité | 0:00–0:30 |
| 2 | Lire. Voter. Vérifier. Revoter. | Solution + Données + bonus MCP | 0:30–1:05 |
| 3 | Démo (application locale intégrée en iframe). | Démo | 1:05–2:15 |
| 4 | Le corpus gratuit. La veille payante. | Ambition | 2:15–2:45 |
| 5 | Lire. Voter. Vérifier. Revoter. | Présentation | 2:45–3:00 |

Révisions du 14 novembre, validées par l'utilisateur :
- Diapo 1 : contraste 53 % politique (CEVIPOF v17, Q23, stable depuis 2009, −2 pts sur un
  an — jamais présenté comme une hausse) contre 36 % actualité (Reuters DNR 2026, 58 % en
  2015) ; bande basse « La cible de Quorum · les moins de 35 ans », écart avec les 60 +
  passé de −25 à −7 points en dix ans (Fractures françaises 2025).
- Diapo 2 : la solution en quatre captures (chronologie, vote, vérif, carte), ligne
  technique condensée MCP Hémicycle → 10 contrôles → JSON → app, 12 / 12 preuves.
- Diapo 3 : iframe `http://127.0.0.1:8000/`, même origine que le deck ; un écouteur
  clavier dans l'iframe renvoie ← → vers la navigation du deck.
- Diapo 4 : corpus (**10 000 + scrutins publics sur des lois et amendements**, ligne au
  rang 10 001 vérifiée dans le jeu `scrutins` de l'API Hémicycle le 14/11/2026 ; total
  exact non publié), coût projeté de **800 à 1 500 € pour 10 000 fiches** (10 000 ×
  0,08–0,15 €, pas un corpus déjà traité), couverture médiatique mesurée et étiquette
  « controversé » ; veille pro (une loi par jour, textes suivis, tableau de bord, produit
  cible non implémenté) ; viabilité (appels Hémicycle + traitement IA). Ne jamais
  transformer ce volume en « 10 000 amendements analysés ».
- Diapo 5 : conclusion minimaliste. L'ancien titre « Ce qui s'est dit. Ce qui s'est voté. »
  est supprimé ; **« Lire. Voter. Vérifier. Revoter. » devient le slogan principal**, très
  grand et centré, avec « QUORUM » discret en haut. La marge et les mentions secondaires
  disparaissent. L'option « slogan seul » a été proposée puis écartée par l'utilisateur :
  conserver uniquement la chute « Le débat continue. Avec vous, cette fois. » en bas.

Forme : direction A déjà approuvée (marge de cote, filets, captures en pièces jointes,
cote source). CSS et script de navigation repris de `deck-a.html`. Aucune nouvelle
dépendance.

## Viabilité (diapo 4), chiffres du dépôt

- Coût mesuré : **0,08 à 0,15 € par loi**, payé une fois, la fiche est ensuite servie
  à tous sans nouveau crédit (`docs/pipeline-freemium.md`, § 7).
- La loi du jour, 365 jours : **29 à 55 € par an**, pour tous les lecteurs.
- Abonnement **5 €/mois = 60 €/an** : un seul abonné couvre la génération quotidienne.
  **Hypothèse de prix, affichée comme telle** : aucun prix n'est documenté dans le dépôt.
- Gratuit : le fait, les chiffres, le débat, le vote. Payant : la veille, l'archive,
  l'export. B2B : licence du même corpus.
- Mention conservée : redistribution commerciale des données Hémicycle **non documentée**.
- Clôture de la diapo : « Ce qui n'est pas vendu : le vote. »

## Bouton Recommencer (app)

`data-action="recommencer"` sur les écrans résultat et carte. Efface `memoire.votes[id]`
et `memoire.progres[id]` pour la loi courante uniquement, replace la carte en mode
`groupe`, sauvegarde, renvoie sur `#/devoir/<id>/chronologie`. Confirmation native
`window.confirm`. Les autres lois et l'intro ne sont pas touchées. Aucune donnée ne
quitte l'appareil.

Cache : `?v=30` dans `index.html`, `quorum-v30` dans `service-worker.js`.

## Livrables

- `js/app.js` : bouton + gestionnaire.
- `index.html`, `service-worker.js` : version de cache.
- `docs/presentation/deck-3min.html` : 5 diapos.
- `docs/presentation/deroule-3min.md` : script mot à mot, chemin de clics local,
  filets (serveur, vote déjà fait, retard).

## Hors périmètre

Pas de modification de `deck-a.html`, de `plan-demo.md`, des données ou des contrôles.
Pas de déploiement Vercel effectué ici.
