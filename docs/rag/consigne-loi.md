# Consigne de génération d'une loi Quorum (mini RAG hors ligne)

Tu produis **une** fiche de loi, au niveau de qualité du cas de référence
`data/lois/protection-enfants.json`. Lis ce fichier en entier avant d'écrire :
c'est le modèle de forme et de preuve. Lis aussi `scripts/verifier.mjs` : il
décide seul de la publication. Il n'y a **aucune relecture humaine** derrière
toi. Un fichier refusé n'est pas publié, et c'est normal.

## Règles non négociables

1. **Source ou silence.** Chaque nombre, date, titre, citation vient d'un
   document que tu as réellement lu. Sans source : « non documenté ». Ne
   jamais inventer, extrapoler ou « reconstruire » une valeur plausible.
2. **Neutralité.** Aucun avis sur la loi, aucun adjectif de jugement, aucune
   recommandation de vote. Le résumé décrit ce que le texte fait, pas ce qu'il
   faut en penser.
3. **Verbatim.** Les extraits sont copiés du texte de loi, les citations du
   débat copiées du compte rendu intégral, les titres de presse copiés des
   articles. Jamais de reformulation entre guillemets.
4. **Pas d'appel IA dans l'app.** Tu écris des fichiers JSON, c'est tout.
5. **Périmètre de fichiers.** Tu n'écris que tes trois fichiers (voir
   ci-dessous) et, si besoin, des fichiers temporaires sous
   `%TEMP%\opencode`. Tu ne modifies **jamais** `data/ref/verbatim.json`,
   `data/ref/experts.json`, `data/ref/groupes.json`, `data/ref/medias.json`,
   `data/lois/index.json`, `data/lois/protection-enfants.json`, ni aucun
   script, ni `js/`, ni `styles/`. Aucune commande git.
6. Si le MCP Hémicycle n'est pas disponible, ou si une donnée indispensable
   est introuvable, **arrête et dis-le** dans ta réponse finale. Ne bouche
   pas le trou.

## Tes trois fichiers

`<slug>` est l'identifiant qui t'est donné (minuscules et tirets).

1. `data/lois/_<slug>.json` — la fiche de loi (le tiret bas la tient hors de
   la publication tant que le gate n'est pas vert).
2. `data/ref/verbatim/_<slug>.json` — fragment de verbatim officiel :
   `{ "seances": { "<id_seance>": { "date": "AAAA-MM-JJ", "url": "https://…" } }, "citations": [ { "cle": "<slug>-<n>", "seance": "<id_seance>", "auteur": "<Nom exact>", "texte": "<passage du compte rendu>" } ] }`.
   Chaque `texte` est un passage **mot pour mot** du compte rendu de cette
   séance, attribué à cet auteur. Toutes tes citations de débat et de chiffres
   doivent être des sous-chaînes exactes de ces passages (apostrophes
   typographiques et espaces compris : le gate normalise les espaces, les
   apostrophes ‘ ’ et les tirets, mais pas les mots).
3. `data/ref/experts/_<slug>.json` — `{ "experts": [ { "nom": "<Nom exact>", "role": "Député", "affiliation": "Assemblée nationale", "bord": "pour" | "contre", "url": "<URL du compte rendu ou de la fiche du député>" } ] }`.
   Un objet par orateur cité, y compris ceux des chiffres vérifiés. Le `nom`
   doit être **strictement identique** à celui utilisé dans la fiche de loi
   (casse et accents compris), et `affiliation` aussi.

JSON en UTF-8 **sans BOM**.

## La donnée : MCP Hémicycle uniquement

Dans `execute`, appelle `tools.hemicycle.<outil>({...})`. Prix : `interroger`
1 crédit par page, `resultat_scrutin` 1, `rechercher` 2, `lire_texte` 1,
`lister_jeux` et `guide` 0. Reste sous **15 crédits** pour ta loi. Ne lance
jamais `predire_vote` (50 crédits) ni les outils d'agrégat (5).

Signatures utiles :

```js
await tools.hemicycle.interroger({
  jeu: "dossiers" | "actes" | "documents" | "articles_textes" | "reunions" | "scrutins",
  colonnes: ["uid", "titre"],                 // toutes par défaut
  filtres: [{ colonne: "dossier_ref", op: "eq", valeur: "DLR5L17…" }],
  recherche: "mots du titre",                 // plein texte, jeux qui le proposent
  tri: "date_acte", ordre: "asc", limite: 200
});
await tools.hemicycle.resultat_scrutin({ id: "VTANR5L17V8431" });
await tools.hemicycle.rechercher({ q: "protéger les mineurs réseaux sociaux", types: "texte,dossier", limit: 10 });
await tools.hemicycle.lire_texte({ id: "PRJLANR5L17B…" });
```

Chaque réponse porte sa source et sa licence : cite-les.

### Étapes

1. **Le scrutin.** `resultat_scrutin({ id })` : décompte global et vote de
   chaque groupe. Vérifie que le décompte correspond à celui donné dans ta
   consigne individuelle. `votants = pour + contre + abstention`,
   `suffrages_exprimes = pour + contre`.
2. **Le dossier.** Retrouve le dossier législatif (`interroger` sur
   `dossiers` avec `recherche`, ou `rechercher`). Note son `uid` et son titre
   officiel. Si plusieurs dossiers se ressemblent, choisis celui dont les
   actes contiennent le scrutin : ne devine pas.
3. **La chronologie.** `actes` filtré sur `dossier_ref`, trié par `date_acte`.
   Chaque étape de ta `chronologie` vient d'un acte réel : date, maillon
   (`AN`, `SENAT`, `CMP`, `COMMISSION`, `GOUVERNEMENT`,
   `CONSEIL_CONSTITUTIONNEL`), texte factuel. 8 à 14 étapes, dates
   strictement croissantes. `texte_associe` et `texte_adopte` donnent les
   identifiants des textes : garde-les.
4. **Le texte.** `articles_textes` filtré sur le `texte_uid` retenu (le texte
   adopté pour un texte de CMP ou une lecture définitive, sinon le texte
   voté). Prends **un article central** (1 à 3 articles), avec ses alinéas
   complets dans `paragraphes`. `nb_phrases` = nombre de phrases du texte que
   tu fournis, compté comme le gate : segments terminés par `.`, `!` ou `?`.
   Compte-le avec `node`, pas à la main.
5. **Les extraits.** 6 à 10 phrases copiées de ces alinéas, avec `article` et
   `alinea`. `tag: "adopte"` partout, sauf si le passage porte littéralement
   `(supprimé…)`, auquel cas `tag: "supprime"`.
6. **Le débat.** Les séances du dossier se trouvent dans `reunions`
   (`compte_rendu_ref`, `debut`, `dossier_refs`). Le compte rendu intégral se
   lit à `https://www.assemblee-nationale.fr/dyn/17/comptes-rendus/seance/<id>`
   (via `webfetch`, ou par téléchargement dans `%TEMP%\opencode` si la
   réponse est tronquée). Choisis **2 orateurs pour** et **2 contre** (ou 1 et
   1 si la séance est pauvre), avec des citations de **40 caractères minimum**,
   copiées du compte rendu. Le total des caractères des deux bords ne doit pas
   dépasser un rapport de 2,5. Un orateur « contre » est un orateur qui
   s'oppose au texte ou à son adoption ; ne prête jamais une position à
   quelqu'un qui ne l'a pas exprimée. S'il n'y a pas d'opposition dans le
   compte rendu, dis-le au lieu d'en fabriquer.
7. **Les chiffres vérifiés.** 2 ou 3 affirmations chiffrées **prononcées dans
   l'hémicycle**, reprises mot pour mot : `affirmation` est un fragment exact
   de `citation`, et `chiffre` apparaît dans `citation`. Verdict `confirmé`
   ou `nuancé` seulement avec une source HTTPS sur un domaine autorisé
   (`assemblee-nationale.fr`, `senat.fr`, `legifrance.gouv.fr`,
   `vie-publique.fr`, `data.gouv.fr`, `hemicycle.ai`, `ciivise.fr`,
   `justice.gouv.fr`, ou un domaine de `data/ref/medias.json`). Sinon verdict
   `non documenté`, **sans aucune source**. `explication` : 80 caractères au
   moins, factuelle.
8. **La presse.** 2 articles côté `pour` et 2 côté `contre` (ou 1 et 1).
   Comme le modèle, les deux colonnes sont **des types de publication**, pas
   des bords politiques : `pour_titre: "Presse quotidienne nationale"`,
   `contre_titre: "Presse hebdomadaire et numérique"`. Médias autorisés :
   `data/ref/medias.json` uniquement, avec une URL du domaine exact du média.
   Titres et dates copiés, jamais traduits ni raccourcis. Utilise `websearch`
   puis `webfetch` pour vérifier que l'article parle bien de ce texte. Les
   longueurs de titres des deux colonnes doivent rester dans un rapport de
   2,5. Garde la `note` du modèle.
9. **Le quiz.** 3 questions factuelles, 3 options chacune, `bonne` = index de
   la bonne réponse, `source` = référence précise (scrutin, article, acte).
   Aucune question d'opinion.
10. **Le reste.** `resume` factuel en 2 ou 3 phrases, `ce_qui_est_vote.texte`
    en une phrase avec du gras `**…**`, 2 ou 3 `points`. `statut` : `Adopté`
    si le texte est définitivement adopté (CMP, lecture définitive), sinon
    `En discussion`. `theme` : celui de ta consigne, sans le changer.
    `sieges_vides` = 577 − (pour + contre + abstention + non_votants).
    `votes_par_groupe` : les 12 groupes de `data/ref/groupes.json`, chacun
    avec `sieges = pour + contre + abstention + non_votants` **du scrutin**,
    jamais l'effectif statutaire. Les sommes par colonne doivent retomber sur
    le décompte global.
    `source` : dossier AN, URL du texte officiel, `licence: "Licence Ouverte
    (Etalab)"`, `consulte_le` = date du jour, `note` précisant le scrutin et
    le numéro du texte. `meta.genere_le` = date du jour, `meta.gate: "5"`,
    `meta.modele: "génération hors ligne, MCP Hémicycle"`, et les dix
    contrôles du modèle à `etat: "ok"` (sans « Variante contrôlée » si tu n'as
    pas de bloc `variante`).
11. **Variante.** Bloc facultatif. Ne l'ajoute que si tu as réellement un
    autre scrutin qui a supprimé une clause, avec son décompte et sa source.
    Sinon : pas de bloc, pas de contrôle « Variante contrôlée ».

## Vérification, obligatoire avant de finir

```powershell
node scripts/verifier-un.mjs data/lois/_<slug>.json
```

Ce script fusionne tes fragments avec les références communes **dans des
fichiers temporaires**, puis lance le gate sur ta seule fiche. Il doit
répondre `Verdict : 1 fichier(s) conforme(s). Publication autorisée.`

Corrige et relance jusqu'au vert. Si un contrôle reste rouge parce que la
donnée n'existe pas, **ne triche pas** : laisse le fichier en l'état et
explique dans ta réponse finale quel contrôle bloque et pourquoi.

## Réponse finale attendue

Cinq lignes : slug, titre officiel, scrutin, verdict du gate, crédits MCP
consommés. Rien d'autre. Si échec : ce qui manque, sans justification.
