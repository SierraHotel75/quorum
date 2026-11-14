# Questions hostiles — réponses courtes

Chaque réponse tient en trois phrases maximum. Aucune opinion sur la loi.

**1. « Vous choisissez les extraits : comment savez-vous qu'ils ne sont pas orientés ? »**
La liste des bords est symétrique et le contrôle refuse un fichier où un bord a plus d'entrées que l'autre. Chaque extrait est comparé mot pour mot au texte officiel : une reformulation est refusée. Ce n'est pas une garantie d'objectivité, c'est une contrainte vérifiable.

**2. « 178 contre 163, c'est vous qui l'avez calculé ? »**
Non. C'est le décompte du scrutin n° 8428, recopié tel quel, avec son identifiant Hémicycle et sa source amont. L'app ne calcule aucun résultat de vote ; elle recompose seulement les sièges à partir des chiffres officiels.

**3. « Et si Hémicycle se trompe ? »**
Chaque chiffre porte l'identifiant du scrutin et la source amont, l'Assemblée nationale sous Licence Ouverte. Les contrôles vérifient l'arithmétique interne : votants = pour + contre + abstentions, exprimés = pour + contre, sièges attribués + sièges vides = 577. Une incohérence bloque la publication.

**4. « Vous dites “aucune IA dans l'app”, mais le contenu est produit par une IA. »**
Le contenu est produit hors ligne, puis jugé par des contrôles automatiques qui acceptent ou refusent le fichier. À l'exécution, l'app ne fait aucun appel : elle lit des JSON statiques. Les nombres, les dates, les extraits du texte et les titres de presse sont recopiés tels quels ; les arguments pour et contre sont reformulés, et chaque reformulation garde l'exposé sommaire dont elle vient.

**5. « Le vote est privé, mais il est écrit sur le téléphone. »**
Il est dans `localStorage`, jamais transmis, et effaçable en un geste. Quelqu'un qui tient l'appareil déverrouillé peut le lire : c'est la limite, elle est assumée. Il n'y a ni compte, ni serveur, ni identifiant.

**6. « Pourquoi une seule loi ? »**
Parce qu'une loi vérifiée vaut mieux que dix approximatives, et parce que chaque loi coûte des crédits de données. La règle de coupe du projet dit quoi sacrifier en premier : les ressources, puis la presse, jamais le fait ni les chiffres.

**7. « La perpétuité pour les viols sur mineurs, vous en pensez quoi ? »**
Quorum ne prend pas position et je ne parle pas à sa place. L'app publie le texte voté, les deux décomptes et les arguments des deux bords, avec leurs sources.

**8. « Le Sénat a voté, pourquoi n'est-il pas dans l'app ? »**
Parce que la composition du Sénat n'est pas encore dans le référentiel : le contrôle refuse explicitement un scrutin sénatorial plutôt que d'inventer une répartition. C'est une lacune déclarée, pas un oubli.
