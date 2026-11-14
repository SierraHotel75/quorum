# Déroulé oral — 3 minutes, 5 diapos

Deck : [`deck-3min.html`](deck-3min.html) (flèches ← →, clic gauche/droite).
Démo : **intégrée à la diapo 3**, application Quorum servie en local.
Avant l'oral, à la racine du dépôt : `python -m http.server 8000`, puis ouvrir
`http://127.0.0.1:8000/docs/presentation/deck-3min.html`.
Le bouton **Recommencer ce devoir** (écrans résultat et carte) efface le vote et la
progression de la loi : plus besoin de navigation privée entre deux passages.

| # | Temps | Diapo | Critère |
|---|---|---|---|
| 1 | 0:00–0:30 | La politique intéresse. L'actualité se délaisse. | Utilité · 25 |
| 2 | 0:30–1:05 | Lire. Voter. Vérifier. Revoter. | Utilité + Données · 25 + bonus MCP · 5 |
| 3 | 1:05–2:15 | Démo. | Démo · 20 |
| 4 | 2:15–2:45 | Le corpus gratuit. La veille payante. | Ambition · 20 |
| 5 | 2:45–3:00 | Lire. Voter. Vérifier. Revoter. | Présentation · 10 |

## 1 · Utilité — 0:00–0:30

« Cinquante-trois pour cent des Français s'intéressent à la politique, un niveau stable
depuis deux mille neuf. Mais seulement trente-six pour cent s'intéressent à l'actualité,
contre cinquante-huit en deux mille quinze. L'intérêt est là, la lecture ne suit plus.
Et c'est chez les moins de trente-cinq ans que l'intérêt pour la politique progresse :
c'est la cible de Quorum. Quorum prend une loi réellement votée à l'Assemblée et la donne
à lire en dix minutes — la chronologie, le texte, les chiffres, le débat — puis vous votez,
et vous voyez où vous vous situez. »

Rien à cliquer. Lire les deux chiffres de gauche à droite, désigner la bande du bas pour
les moins de 35 ans, puis la phrase du bas. Si les 30 secondes dépassent : couper
« un niveau stable depuis deux mille neuf ».

## 2 · La solution — 0:30–1:05

« Quorum tient en quatre gestes. Lire : la loi se déroule, du dépôt au vote. Voter : après
avoir lu, pas avant, et le vote reste dans le navigateur. Vérifier : les chiffres du
scrutin, et chaque affirmation confrontée à sa source — sinon, "non documenté". Revoter :
après le débat, puis la carte montre où est votre voix. Derrière ces écrans, tout vient du
MCP Hémicycle, dix contrôles bloquants décident de la publication — douze fautes testées,
douze refus — et l'application ne contient aucun modèle : elle lit des fichiers. »

Suivre les quatre captures de gauche à droite, une phrase par capture, puis la ligne
technique du bas.

## 3 · Démo — 1:05–2:15

La démo est **dans la diapo**. Cliquer dans l'écran pour interagir ; les flèches ← →
continuent de changer de diapo, même le focus dans l'application. Un geste par phrase.

| Geste | Phrase |
|---|---|
| **Commencer** | « Voici le devoir du jour. » |
| Chronologie, défiler | « Treize étapes datées, du dépôt à la commission mixte paritaire. » |
| Résumé, puis **Lire l'article entier** | « L'article onze, mot pour mot, avec la mention supprimée. » |
| **Voter sur ce texte**, cliquer **Pour** | « Je vote après avoir lu. Le vote reste dans ce navigateur. » |
| Les chiffres | « Deux cent cinquante-huit pour, quatre-vingt-quatre contre, dix abstentions. » |
| Le débat | « Trois voix de chaque côté, recopiées du compte rendu. » |
| **Votre vote final**, cliquer **Contre** | « Je revote, après le débat. » |
| **Voir la carte**, basculer **Avec vous** | « Cinq cent soixante-dix-sept sièges, deux cent vingt-quatre non occupés. Et voilà où est ma voix. » |
| **Recommencer ce devoir**, confirmer | « Et ce bouton remet le devoir à zéro : on peut le refaire devant vous. » |

Si le temps manque : sauter le débat et l'article entier, garder le vote et la carte.
Ne pas utiliser les flèches pour voter dans l'application : elles changent de diapo.

## 4 · Le modèle — 2:15–2:45

« La base, c'est le corpus : plus de dix mille scrutins publics sur des lois et des
amendements. Traiter dix mille fiches coûterait huit cents à mille cinq cents euros, une
fois. Les textes sont choisis pour leur couverture médiatique : "controversé" mesure le
débat, pas un avis. Au-dessus, la veille pro : une loi par jour, des textes suivis dans
un tableau de bord. L'abonnement paie les appels Hémicycle et l'IA : vingt-neuf à
cinquante-cinq euros par an ; un abonné à cinq euros par mois — hypothèse — couvre
l'année. Le vote n'est jamais vendu. »

Dire « coûterait » et « hypothèse » à voix haute : le corpus entier n'a pas été traité et
le prix n'est pas validé. Présenter la veille et le tableau de bord comme le produit
cible, pas comme livrés.

## 5 · Clôture — 2:45–3:00

« Quorum : lire, voter, vérifier, revoter. Aucun avis sur la loi, aucune donnée qui sort
de l'appareil. Le débat continue — avec vous, cette fois. »

Le slogan est seul à l'écran : le laisser respirer, une pause avant la dernière phrase.

## Filets

- **Serveur local éteint** : la démo ne s'affiche pas, rester sur les captures de la
  diapo 2 et faire le parcours à la voix. Relancer `python -m http.server 8000`.
- **Vote déjà fait** : bouton **Recommencer ce devoir**, sinon
  `localStorage.removeItem("quorum.v1")` puis rechargement.
- **Retard à 2:15** : sauter la diapo 4 et dire sur la 5 : « Une loi coûte quinze
  centimes, un abonné paie une année. »
- **Question sur les deux chiffres d'ouverture** : « Deux sources et deux questions
  différentes, on ne les soustrait pas. L'intérêt pour la politique est stable depuis
  2009, pas en hausse : moins deux points entre 2025 et 2026. »
- **Question sur « 10 000 + »** : « Le jeu scrutins de l'API Hémicycle renvoie une ligne
  au rang 10 001 ; le total exact n'est pas publié. Ce ne sont pas dix mille amendements
  déjà analysés : le coût est une projection pour dix mille fiches. »
- **Question sur « controversé »** : « Un critère de sélection mesuré sur la couverture
  médiatique, pas un jugement sur la loi. »
- **Question sur le prix de l'abonnement** : « Hypothèse, non validée. »
- **Question sur la revente des données** : « Redistribution commerciale Hémicycle :
  non documenté. »
- **Question sur la neutralité** : dix contrôles bloquants, aucune relecture humaine,
  texte entier accessible à tout moment, aucun point pour le contenu du vote.

Volume parlé : environ 380 mots, démo comprise.
