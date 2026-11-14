# Quorum

De l'aide pour accomplir mon devoir civique.
Ce qui s'est dit. Ce qui s'est voté.

Application statique, sans framework, sans backend, sans appel réseau hors fichiers locaux.
Le vote reste dans le navigateur.

## Lancer

```
python -m http.server 8000
```

Ouvrir `http://127.0.0.1:8000/`.

Un serveur est nécessaire : `file://` ne charge ni les JSON ni le service worker.

## Structure

```
index.html              coquille de l'application
wp.html                 plan du jour, page de pilotage
mockups.html            planche des rendus photo
manifest.json           PWA
service-worker.js       hors ligne, réseau d'abord
styles/tokens.css       palette, typographie, thème clair de lecture
styles/app.css          mise en page
styles/wp.css           mise en page du plan
js/hemicycle.js         hémicycle en SVG, sans dépendance
js/app.js               routage, écrans, vote, arbre
js/wp.js                plan du jour, cases cochées, horloge
scripts/verifier.mjs    contrôles bloquants avant publication
scripts/preuve-gate.mjs preuve : accepte un fichier complet, refuse le reste
data/ref/groupes.json   composition de l'Assemblée, datée et sourcée
data/ref/medias.json    médias suivis par flux RSS, liste fermée
data/ref/experts.json   personnes et organisations citables, liste fermée
data/lois/index.json    les lois publiées, une entrée par fichier
data/lois/protection-enfants.json
                        le projet de loi « protection des enfants »,
                        scrutin n° 8429 du 21 juillet 2026
data/lois/_demo.json    jeu de travail, jamais publié (les fichiers en _ sont ignorés)
data/lois/_archive-…json  lois retirées de la publication, gardées pour mémoire
data/plan.json          les sept lots de la journée
assets/mockups/         rendus photo
```

## Contrôles avant publication

```
node scripts/verifier.mjs            # tous les fichiers de data/lois
node scripts/verifier.mjs --reseau   # vérifie aussi que chaque URL répond
node scripts/preuve-gate.mjs         # prouve que le passage accepte et refuse
```

Le script refuse, il ne corrige pas. Code de sortie 1 dès qu'un fichier est refusé.
Il vérifie le schéma, les dates, les décomptes (577 sièges, sièges attribués, votants,
exprimés), le verbatim des extraits, la symétrie des trois bords, les sources, et
l'absence de contenu de démonstration. Un fichier dont le nom commence par `_` est
ignoré : c'est un jeu de travail, pas une publication.

Un extrait ne porte que ce que le texte déclare lui-même : l'étiquette `supprime`
n'est acceptée que sur un passage qui écrit « (Supprimé) », `adopte` sur tout le
reste, et aucune autre. Une étiquette qui qualifierait le passage — « aujourd'hui »,
« si adopté », « qui est concerné » — est refusée : elle ajouterait une lecture que
la source ne porte pas.

Les sièges non occupés ne sont attribués à aucun groupe. Chaque ligne
`votes_par_groupe` porte son nombre de `sieges` présents (pour + contre + abstention +
non-votants volontaires), et le fichier déclare à part `sieges_vides`. Le contrôle
exige `somme(sieges) + sieges_vides = 577` : les absents restent des absents. Ils sont
répartis sur l'arc et peints d'une teinte neutre, jamais empilés d'un côté.

### Le bloc facultatif `variante`

Quand un vote adopté a supprimé une phrase du texte, le fichier peut porter un bloc
`variante` : la citation exacte (`avant`), le texte d'où elle vient (`texte_source`),
et le scrutin qui l'a retirée (`supprimee_par`). Le contrôle `WP1.7` exige que la
phrase soit **mot pour mot** dans `texte_source` et **absente** du texte adopté : si
elle y est encore, le fichier est refusé. Le même décompte est vérifié (`votants =
pour + contre + abstentions`, `exprimés = pour + contre`) et doit venir d'un autre
scrutin que celui de la loi. Le bloc n'apparaît dans l'écran « article entier » que
s'il est présent et validé.

Trois listes ferment la publication : `data/ref/medias.json` et
`data/ref/experts.json` doivent contenir le média, la personne ou l'organisation citée,
avec son domaine, son affiliation ou son rôle. Une entrée absente est refusée, avec ou
sans drapeau. Le champ `meta.gate` doit valoir la version courante du passage de
contrôles (`3` aujourd'hui) : un fichier produit par une règle plus ancienne est refusé.
`source.texte_url` est obligatoire : c'est le lien vers le texte officiel, affiché
en bas de l'écran « article entier » pour un fichier publié.

## Cache et versions

`index.html` charge les styles et les scripts avec `?v=N`, et `service-worker.js`
déclare `quorum-vN`. Les deux numéros avancent ensemble à chaque modification de
code, sinon le navigateur peut servir une ancienne version. Les JSON sont lus avec
`cache: "no-store"` : une donnée modifiée est visible au rechargement.

## Écrans

`#/` accueil · `#/devoir/<id>` sommaire · `/vote` vote initial · `/fait` chronologie ·
`/texte` extraits · `/article` texte entier · `/chiffres` décompte et quiz ·
`/arguments` · `/presse` · `/experts` · `/resultat` vote final · `/carte` hémicycle ·
`#/arbre` progression · `#/methode` contrôles · `#/archive` · `#/recherche`

## Ce qui est vrai, ce qui ne l'est pas

- **Vrai** : la composition de l'Assemblée dans `data/ref/groupes.json`, avec sa source et sa date ; le scrutin n° 8429, le scrutin n° 8428 cité dans `variante`, la chronologie et les passages reproduits de `data/lois/protection-enfants.json`, tirés du MCP Hémicycle ; les titres de presse et les citations, avec leur lien.
- **Faux, assumé** : le contenu de `data/lois/_demo.json`. Il n'est pas publié ; l'index ne le cite pas.
- **Règle** : aucun contenu de démonstration ne doit être présenté comme vérifié dans une slide. Les images de `assets/mockups/` sont des maquettes.

## Plan du jour

`http://127.0.0.1:8000/wp.html` — les sept lots, leur fenêtre horaire, leurs tâches.
Les cases sont gardées dans le navigateur (`quorum.plan.v1`), la page se met à jour à
l'horloge et signale le lot en cours et le lot en retard. Le contenu vient de
`data/plan.json` : on modifie le plan en modifiant ce fichier.

## Test sur téléphone réel

`adb` n'a pas de transport Bluetooth. Le Bluetooth ne transporte qu'un **réseau IP**
(partage de connexion), et ADB passe ensuite en TCP sur cette adresse. Deux conséquences :

1. Il faut `platform-tools` (zip officiel Google, à décompresser, aucun installateur).
   Absent de cette machine au 14 novembre.
2. Il faut activer le débogage USB sur le téléphone. Le passage en TCP se fait par
   `adb tcpip 5555` après un premier branchement USB, ou par « Débogage sans fil »
   avec code d'appairage à partir d'Android 11.

Marche à suivre, Bluetooth comme transport :

```
adb pair <ip-du-telephone>:<port>      # Android 11 et plus, une seule fois
adb connect <ip-du-telephone>:5555
adb devices                            # l'appareil doit apparaître
adb reverse tcp:8000 tcp:8000          # le téléphone joint le serveur du PC
```

Puis, sur le téléphone, ouvrir `http://localhost:8000`. La redirection inverse évite de
relier le serveur à `0.0.0.0` et de l'exposer au réseau.

Preuve à garder pour la soutenance :

```
adb exec-out screencap -p > capture-telephone.png
```

Repli si le Bluetooth ne porte pas le réseau : Chrome DevTools en mode appareil,
390 px et 360 px. C'est plus rapide et ça ne dépend d'aucun appairage.

## Hors ligne

Le service worker met en cache la coquille et les données. En développement il sert le réseau
d'abord, pour que toute modification soit visible. Installer la PWA depuis Chrome, puis couper
le réseau : l'application doit continuer de fonctionner.

## Contraintes tenues

- Aucune dépendance, aucun build, aucun CDN, aucune police distante.
- Aucun appel à un service d'IA à l'exécution.
- Le vote n'est jamais transmis.
- Chaque écran sans donnée affiche un état vide explicite, jamais un faux contenu.
