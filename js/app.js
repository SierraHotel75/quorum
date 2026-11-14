/* Quorum — application
   Aucune dépendance, aucune requête réseau hors données locales.
   Le vote reste dans localStorage. Aucune donnée ne quitte l'appareil. */

(function () {
  "use strict";

  var CLE = "quorum.v1";
  var app = document.getElementById("app");

  var THEMES = [
    { id: "logement", nom: "Logement" },
    { id: "budget", nom: "Budget" },
    { id: "sante", nom: "Santé" },
    { id: "education", nom: "Éducation" },
    { id: "travail", nom: "Travail" },
    { id: "environnement", nom: "Environnement" },
    { id: "numerique", nom: "Numérique" },
    { id: "securite", nom: "Sécurité" },
    { id: "institutions", nom: "Institutions" },
    { id: "agriculture", nom: "Agriculture" },
    { id: "transport", nom: "Transport" },
    { id: "energie", nom: "Énergie" },
    { id: "justice", nom: "Justice" },
    { id: "immigration", nom: "Immigration" },
    { id: "social", nom: "Social" },
    { id: "defense", nom: "Défense" },
    { id: "culture", nom: "Culture" }
  ];

  var etat = {
    groupes: [],
    arbre: null,
    index: [],
    loin: null,
    pret: false
  };

  var memoire = charger();
  migrer();

  /* ---------- Mémoire locale ---------- */

  function memoireVierge() {
    return { version: 1, votes: {}, progres: {}, intro: false };
  }

  function charger() {
    try {
      var brut = localStorage.getItem(CLE);
      if (!brut) return memoireVierge();
      var objet = JSON.parse(brut);
      if (!objet || typeof objet !== "object" || objet.version !== 1) return memoireVierge();
      if (!objet.votes || typeof objet.votes !== "object") objet.votes = {};
      if (!objet.progres || typeof objet.progres !== "object") objet.progres = {};
      return objet;
    } catch (e) {
      return memoireVierge();
    }
  }

  function sauver() {
    try {
      localStorage.setItem(CLE, JSON.stringify(memoire));
    } catch (e) {
      /* quota plein ou stockage bloqué : l'app continue sans persister */
    }
  }

  function progresDe(id) {
    if (!memoire.progres[id]) {
      memoire.progres[id] = {
        fait: false,
        lu: false,
        article: false,
        source: false,
        oppose: false,
        chiffres: false,
        verif: false,
        carte: false
      };
    }
    return memoire.progres[id];
  }

  /* Migration : la clé `quiz` notait l'ouverture de l'écran des chiffres.
     Elle devient `chiffres` ; l'ancien compteur de réponses au quiz, retiré
     de l'interface, n'est plus conservé. Rien n'est perdu du parcours fait. */
  function migrer() {
    var change = false;
    Object.keys(memoire.progres).forEach(function (id) {
      var p = memoire.progres[id];
      if (!p || typeof p !== "object" || !("quiz" in p)) return;
      if (!p.chiffres) p.chiffres = !!p.quiz;
      delete p.quiz;
      change = true;
    });
    if (memoire.reponses) {
      delete memoire.reponses;
      change = true;
    }
    if (change) sauver();
  }

  function marquer(id, cle) {
    var p = progresDe(id);
    if (p[cle]) return;
    p[cle] = true;
    sauver();
  }

  function voteDe(id) {
    return memoire.votes[id] || null;
  }

  /* ---------- Utilitaires ---------- */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* Les textes de données peuvent marquer un mot clé avec **…**. On échappe
     d'abord, on remplace ensuite : jamais de HTML venu du fichier. */
  function gras(s) {
    return esc(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  }

  function dateCourte(iso) {
    var d = new Date(iso + "T12:00:00");
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  function dateLongue(iso) {
    var d = new Date(iso + "T12:00:00");
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  }

  function pluriel(n, mot) {
    return n + " " + mot + (n > 1 ? "s" : "");
  }

  function themeNom(id) {
    var t = THEMES.filter(function (x) {
      return x.id === id;
    })[0];
    return t ? t.nom : "Non documenté";
  }

  /* ---------- Fragments ---------- */

  function masthead(lien) {
    return (
      '<header class="masthead">' +
      '<a class="masthead__nom" href="#/">Quorum</a>' +
      '<p class="masthead__descripteur">De l\u2019aide pour accomplir mon devoir civique.</p>' +
      (etat.loi && etat.loi.demo
        ? '<p class="bandeau-demo">Démonstration \u2014 contenu non publié</p>'
        : "") +
      "</header>"
    );
  }

  function surcoucheIntro() {
    return (
      '<div class="surcouche" role="dialog" aria-modal="true" aria-labelledby="intro-titre">' +
      '<div class="surcouche__corps">' +
      '<span class="etiquette">Avant de commencer</span>' +
      '<h2 class="ecran__titre" id="intro-titre">Trois choses à savoir</h2>' +
      '<div class="pile">' +
      '<p><strong>Le vote reste ici.</strong> Aucun vote n\u2019est envoyé, aucun compte n\u2019est créé.</p>' +
      '<p><strong>Chaque phrase a sa source.</strong> Les extraits et les citations sont recopiés des textes officiels, les chiffres viennent du scrutin et de leurs sources.</p>' +
      '<p><strong>Aucun avis.</strong> Quorum montre ce qui a été dit et voté. Il ne dit pas quoi penser.</p>' +
      "</div>" +
      "</div>" +
      '<button class="bouton" type="button" data-action="fermer-intro">Commencer</button>' +
      "</div>"
    );
  }

  /* L'ordre du parcours, pour situer l'écran courant dans la barre haute.
     Aucune étape n'est inventée : c'est exactement la liste des écrans. */
  var PARCOURS = [
    "chronologie",
    "resume",
    "article",
    "vote",
    "chiffres",
    "debat",
    "verif",
    "presse",
    "resultat",
    "carte"
  ];

  function numeroEtape() {
    var p = (location.hash || "").replace(/^#\/?/, "").split("/").filter(Boolean);
    if (p[0] !== "devoir") return 0;
    var i = PARCOURS.indexOf(p[2] || "");
    return i < 0 ? 0 : i + 1;
  }

  /* La barre haute porte deux sorties : l'étape précédente à gauche et le
     sommaire du devoir à droite. Depuis n'importe quelle étape, le sommaire
     est donc à un seul geste au lieu de deux. */
  function barre(retour, etape) {
    var n = numeroEtape();
    var total = PARCOURS.length;
    var progression = n
      ? '<span class="barre__progression" aria-hidden="true">' +
        '<span style="width:' + Math.round((n * 100) / total) + '%"></span></span>' +
        '<span class="sr">Étape ' + n + " sur " + total + "</span>"
      : "";
    var devoir = "#/devoir/" + (etat.loi ? etat.loi.id : "");
    var sous = (location.hash || "").replace(/^#\/?/, "").split("/")[2] || "";
    var droite = "";
    if (sous || n) {
      droite =
        '<a class="barre__etape barre__etape--lien" href="' + devoir + '">Sommaire' +
        '<span class="sr"> du devoir</span></a>';
    } else if (etape) {
      droite = '<span class="barre__etape">' + esc(etape) + "</span>";
    }
    return (
      '<div class="barre">' +
      '<a class="barre__retour" href="' + retour + '">\u2190 Retour</a>' +
      droite +
      progression +
      "</div>"
    );
  }

  function navbas(actif) {
    var items = [
      { href: "#/", nom: "Devoirs" },
      { href: "#/archive", nom: "Archive" },
      { href: "#/arbre", nom: "Arbre" },
      { href: "#/methode", nom: "Méthode" }
    ];
    return (
      '<nav class="navbas" aria-label="Navigation principale">' +
      items
        .map(function (i) {
          var courant = i.href === actif ? ' aria-current="page"' : "";
          return (
            '<a href="' + i.href + '"' + courant + "><span>" + esc(i.nom) + "</span></a>"
          );
        })
        .join("") +
      "</nav>"
    );
  }

  function pied() {
    return (
      '<footer class="pied"><p class="mention-independance">' +
      "Projet indépendant, non affilié à l\u2019Assemblée nationale ni au Sénat. " +
      "Le vote reste sur cet appareil." +
      "</p></footer>"
    );
  }

  function vide(titre, texte, action) {
    return (
      '<div class="vide">' +
      '<p class="vide__titre">' + esc(titre) + "</p>" +
      '<p class="vide__texte">' + esc(texte) + "</p>" +
      (action || "") +
      "</div>"
    );
  }

  /* Un écran d'étape suit une règle unique : le thème en étiquette, le nom de
     l'étape en h1, le titre de la loi en une ligne de contexte. Le titre de la
     loi n'est un h1 que là où il est le sujet : l'accueil et le sommaire. */
  function enteteEtape(loi, titre, chapeau) {
    return (
      '<header class="ecran__entete">' +
      '<span class="theme">' + esc(themeNom(loi.theme)) + "</span>" +
      '<h1 class="ecran__titre">' + esc(titre) + "</h1>" +
      '<p class="ecran__loi">' + esc(loi.titre) + "</p>" +
      (chapeau ? '<p class="ecran__chapeau">' + chapeau + "</p>" : "") +
      "</header>"
    );
  }

  /* ---------- Écrans ---------- */

  function ecranAccueil() {
    var loi = etat.loi;
    var v = voteDe(loi.id);
    var etapes = etapesDe(loi);
    var faites = etapes.filter(function (e) {
      return e.fait;
    }).length;

    return (
      masthead() +
      '<main class="ecran">' +
      '<div class="ecran__entete">' +
      '<span class="theme">Le devoir du jour</span>' +
      '<h1 class="ecran__titre">' + esc(loi.titre) + "</h1>" +
      '<p class="ecran__chapeau">' + esc(loi.resume) + "</p>" +
      "</div>" +
      '<div class="carte">' +
      '<div class="rangee entre">' +
      '<span class="mono">' + esc(themeNom(loi.theme)) + "</span>" +
      '<span class="mono">' + esc(loi.statut) + "</span>" +
      "</div>" +
      '<p class="meta-ligne">' +
      esc(dateLongue(loi.scrutin.date)) + " \u00b7 " + esc(loi.scrutin.chambre) +
      "</p>" +
      (v
        ? '<a class="bouton" href="#/devoir/' + loi.id + '">Reprendre le devoir</a>'
        : '<a class="bouton" href="#/devoir/' + loi.id + '/chronologie">Commencer</a>') +
      "</div>" +
      '<section class="pile" aria-labelledby="parcours-titre">' +
      '<h2 class="etiquette" id="parcours-titre">Le parcours</h2>' +
      '<ul class="etapes">' +
      PHASES.map(function (ph, i) {
        var nombre = etapes.filter(function (e) {
          return e.phase === ph.id;
        }).length;
        return (
          '<li><div class="etape">' +
          '<span class="etape__num" aria-hidden="true">' + (i + 1) + "</span>" +
          '<span class="etape__nom">' + esc(ph.nom) + "</span>" +
          '<span class="etape__compte">' + pluriel(nombre, "étape") + "</span>" +
          "</div></li>"
        );
      }).join("") +
      "</ul>" +
      (faites
        ? '<p class="compteur">' + faites + " étapes faites sur " + etapes.length + "</p>"
        : "") +
      "</section>" +
      "</main>" +
      navbas("#/")
    );
  }

  /* Les trois temps du parcours. La coupure n'est pas décorative : elle dit ce
     qu'on lit avant de voter, le vote lui-même, puis ce qu'on comprend après.
     Chaque écran a son propre état : ouvrir le résumé ne coche plus l'article. */
  var PHASES = [
    { id: "avant", nom: "Avant votre vote" },
    { id: "vote", nom: "Votre premier vote" },
    { id: "apres", nom: "Après votre vote" }
  ];

  function etapesDe(loi) {
    var p = progresDe(loi.id);
    var v = voteDe(loi.id);
    var base = "#/devoir/" + loi.id;
    return [
      { phase: "avant", nom: "La chronologie", fait: p.fait, href: base + "/chronologie" },
      { phase: "avant", nom: "Le résumé", fait: p.lu, href: base + "/resume" },
      { phase: "avant", nom: "L’article entier", fait: p.article, href: base + "/article" },
      { phase: "vote", nom: "Votre vote", fait: !!v, href: base + "/vote" },
      { phase: "apres", nom: "Les chiffres", fait: p.chiffres, href: base + "/chiffres" },
      { phase: "apres", nom: "Le débat, mot pour mot", fait: p.oppose, href: base + "/debat" },
      { phase: "apres", nom: "Les chiffres vérifiés", fait: p.verif, href: base + "/verif" },
      { phase: "apres", nom: "La presse", fait: p.source, href: base + "/presse" },
      { phase: "apres", nom: "Votre vote final", fait: !!(v && v.v2), href: base + "/resultat" },
      { phase: "apres", nom: "La carte", fait: p.carte, href: base + "/carte" }
    ].map(function (e, i) {
      e.rang = i + 1;
      return e;
    });
  }

  function ecranDevoir(loi) {
    var etapes = etapesDe(loi);
    var faites = etapes.filter(function (e) {
      return e.fait;
    }).length;
    var suivante =
      etapes.filter(function (e) {
        return !e.fait;
      })[0] || null;
    var pourcent = Math.round((faites * 100) / etapes.length);

    var phases = PHASES.map(function (ph) {
      var liste = etapes.filter(function (e) {
        return e.phase === ph.id;
      });
      var faitesPhase = liste.filter(function (e) {
        return e.fait;
      }).length;
      return (
        '<section class="phase" aria-labelledby="phase-' + ph.id + '">' +
        '<h2 class="phase__tete" id="phase-' + ph.id + '">' +
        '<span class="phase__nom">' + esc(ph.nom) + "</span>" +
        '<span class="phase__compte">' + faitesPhase + " / " + liste.length + "</span>" +
        "</h2>" +
        '<ol class="etapes">' +
        liste
          .map(function (e) {
            var suite = suivante && e.href === suivante.href;
            var etat = e.fait
              ? '<span class="etape__fait" aria-hidden="true">\u2713</span><span class="sr">fait</span>'
              : suite
                ? '<span class="etape__etat">à suivre</span>'
                : '<span class="sr">à faire</span>';
            return (
              '<li><a class="etape' + (e.fait ? " etape--faite" : "") +
              (suite ? " etape--suivante" : "") + '" href="' + e.href + '">' +
              '<span class="etape__num" aria-hidden="true">' +
              (e.rang < 10 ? "0" : "") + e.rang + "</span>" +
              '<span class="etape__nom">' + esc(e.nom) + "</span>" +
              etat +
              "</a></li>"
            );
          })
          .join("") +
        "</ol></section>"
      );
    }).join("");

    return (
      barre("#/", "") +
      '<main class="ecran">' +
      '<div class="ecran__entete">' +
      '<span class="theme">' + esc(themeNom(loi.theme)) + "</span>" +
      '<h1 class="ecran__titre">' + esc(loi.titre) + "</h1>" +
      "</div>" +
      '<div class="avancement">' +
      '<p class="compteur">' + faites + " étapes faites sur " + etapes.length + "</p>" +
      '<div class="jauge" role="progressbar" aria-valuemin="0" aria-valuemax="' + etapes.length +
      '" aria-valuenow="' + faites + '" aria-label="Étapes faites">' +
      '<span class="jauge__part" style="width:' + pourcent + '%"></span></div>' +
      "</div>" +
      (suivante
        ? '<a class="bouton" href="' + suivante.href + '">' +
          (faites ? "Continuer" : "Commencer") + " : " + esc(suivante.nom) + "</a>"
        : '<a class="bouton" href="#/devoir/' + loi.id + '/resultat">Revoir le résultat</a>') +
      phases +
      "</main>" +
      navbas("#/")
    );
  }

  function ecranVote(loi, final) {
    var v = voteDe(loi.id);
    var deja = final ? v && v.v2 : v && v.v1;
    var question = final
      ? "Après le débat et la presse, que pensez-vous de ce texte ?"
      : "Après avoir lu le texte, que pensez-vous de ce dispositif ?";
    var aide = final
      ? "Votre premier vote est conservé. Un changement d\u2019avis n\u2019ajoute rien."
      : "Glissez la carte, ou utilisez les boutons. Vous pourrez revoter \u00e0 la fin du parcours.";

    return (
      barre("#/devoir/" + loi.id, final ? "Vote final" : "Vote") +
      '<main class="ecran">' +
      enteteEtape(loi, final ? "Votre vote final" : "Votre vote") +
      '<section class="ce-vote" aria-labelledby="ce-vote-titre">' +
      '<h2 class="etiquette" id="ce-vote-titre">Ce qui est voté</h2>' +
      '<p class="ce-vote__texte">' +
      gras(
        (loi.ce_qui_est_vote && loi.ce_qui_est_vote.texte) ||
          "Le texte soumis au vote."
      ) +
      "</p>" +
      "</section>" +
      (deja
        ? vide(
            "Vote enregistré",
            "Vous avez déjà voté. Votre vote reste sur cet appareil.",
            '<a class="bouton bouton--secondaire" href="#/devoir/' + loi.id + (final ? '/resultat' : '/chiffres') + '">Continuer</a>'
          )
        : '<div class="vote">' +
          '<div class="vote__zone" id="zone-vote" role="group" tabindex="0" aria-label="Carte de vote : glissez à gauche pour Contre, vers le bas pour Abstention, à droite pour Pour">' +
          '<div class="vote__carte" id="carte-vote">' +
          '<p class="vote__question">' + esc(question) + "</p>" +
          '<p class="vote__aide">' + esc(aide) + "</p>" +
          "</div>" +
          "</div>" +
          '<p class="vote__sens" aria-hidden="true">' +
          '<span>\u2190 Contre</span><span>\u2193 Abstention</span><span>Pour \u2192</span>' +
          "</p>" +
          '<div class="vote__actions" role="group" aria-label="Votre vote">' +
          '<button class="vote__bouton" type="button" data-choix="contre">Contre</button>' +
          '<button class="vote__bouton" type="button" data-choix="abstention">Abstention</button>' +
          '<button class="vote__bouton" type="button" data-choix="pour">Pour</button>' +
          "</div>" +
          "</div>") +
      "</main>" +
      navbas("#/")
    );
  }

  function ecranFait(loi) {
    marquer(loi.id, "fait");
    return (
      barre("#/devoir/" + loi.id, "La chronologie") +
      '<main class="ecran">' +
      enteteEtape(loi, "Du dépôt au vote") +
      '<ol class="timeline">' +
      loi.chronologie
        .map(function (e) {
          return (
            '<li class="timeline__item">' +
            '<span class="timeline__marqueur" data-chambre="' + esc(e.chambre) + '" aria-hidden="true"></span>' +
            '<div class="timeline__date">' + esc(dateLongue(e.date)) + "</div>" +
            '<div class="timeline__texte">' + esc(e.texte) + "</div>" +
            "</li>"
          );
        })
        .join("") +
      "</ol>" +
      '<div class="legende">' +
      '<span class="legende__item"><span class="legende__pastille" style="background:var(--an)"></span>Assemblée nationale</span>' +
      '<span class="legende__item"><span class="legende__pastille" style="background:var(--senat)"></span>Sénat</span>' +
      '<span class="legende__item"><span class="legende__pastille" style="background:var(--commission)"></span>Commission</span>' +
      "</div>" +
      '<a class="bouton" href="#/devoir/' + loi.id + '/resume">Voir le r\u00e9sum\u00e9</a>' +
      "</main>" +
      navbas("#/")
    );
  }

  /* L'étiquette ne qualifie pas le passage : elle ne reprend que ce que le
     texte adopté déclare lui-même. Un passage ordinaire n'en porte aucune. */
  function badgeExtrait(e) {
    if (e.tag === "supprime") return '<span class="puce puce--bois">Supprimé</span>';
    return "";
  }

  function ecranResume(loi) {
    var p = progresDe(loi.id);
    p.lu = true;
    sauver();
    /* Les deux blocs ne reprennent que des champs publiés : le résumé déjà
       contrôlé, puis le texte voté et ses points. Rien n'est rédigé ici. */
    var contenu = loi.ce_qui_est_vote || {};
    var points = contenu.points || [];
    return (
      barre("#/devoir/" + loi.id, "Le résumé") +
      '<main class="ecran">' +
      enteteEtape(loi, "Le résumé", esc(loi.resume)) +
      '<section class="ce-vote" aria-labelledby="ce-change-titre">' +
      '<h2 class="etiquette" id="ce-change-titre">Ce que change le texte</h2>' +
      '<p class="ce-vote__texte">' + gras(contenu.texte || "Non documenté") + "</p>" +
      (points.length
        ? '<ul class="pile petit">' +
          points
            .map(function (t) {
              return "<li>" + gras(t) + "</li>";
            })
            .join("") +
          "</ul>"
        : "") +
      "</section>" +
      '<div class="ecran__entete">' +
      '<h2 class="article__titre">Ce que dit le texte</h2>' +
      '<p class="compteur">' + loi.extraits.length + " passages retenus" +
      (loi.nb_phrases > loi.extraits.length ? " sur " + loi.nb_phrases + " phrases" : "") + "</p>" +
      "</div>" +
      loi.extraits
        .map(function (e) {
          return (
            '<article class="extrait">' +
            badgeExtrait(e) +
            '<p class="extrait__citation">' + esc(e.texte) + "</p>" +
            '<span class="extrait__source">' + esc(e.article) + (e.alinea ? " \u00b7 " + esc(e.alinea) : "") + "</span>" +
            "</article>"
          );
        })
        .join("") +
      '<a class="bouton bouton--secondaire" href="#/devoir/' + loi.id + '/article">Lire l\u2019article entier</a>' +
      "</main>" +
      navbas("#/")
    );
  }

  function ecranArticle(loi) {
    marquer(loi.id, "article");
    var articles =
      Array.isArray(loi.articles) && loi.articles.length ? loi.articles : [loi.article];
    var multiple = articles.length > 1;
    var corps = articles
      .map(function (a) {
        if (!a) return "";
        var reference = a.reference || "";
        return (
          "<section class=\"article__bloc\">" +
          (reference ? '<p class="article__ref">' + esc(reference) + "</p>" : "") +
          (multiple && a.titre && a.titre !== reference
            ? '<h3 class="article__titre">' + esc(a.titre) + "</h3>"
            : "") +
          (a.note ? '<p class="article__note">' + esc(a.note) + "</p>" : "") +
          (a.paragraphes || [])
            .map(function (p) {
              return "<p>" + esc(p) + "</p>";
            })
            .join("") +
          "</section>"
        );
      })
      .join("");

    var lienOfficiel = "";
    if (loi.demo !== true && loi.source && (loi.source.texte_url || loi.source.url)) {
      var urlTexte = loi.source.texte_url || loi.source.url;
      var hote = "";
      try {
        hote = new URL(urlTexte).hostname.replace(/^www\./, "");
      } catch (e) {
        hote = "";
      }
      lienOfficiel =
        '<p class="article__note">Seuls les articles cités sont reproduits. ' +
        '<a href="' + esc(urlTexte) + '" rel="noopener">Texte officiel sur ' +
        esc(hote || loi.source.nom) + "</a></p>";
    } else if (loi.demo === true) {
      lienOfficiel =
        '<p class="article__note">Texte de démonstration. Aucun article officiel n\u2019est reproduit ici.</p>';
    }

    return (
      barre("#/devoir/" + loi.id + "/resume", "Article entier") +
      '<main class="ecran">' +
      enteteEtape(loi, "Le texte adopté") +
      (multiple
        ? '<p class="compteur">' + articles.length + " articles cités, passages reproduits" + "</p>"
        : "") +
      '<div class="article">' +
      corps +
      "</div>" +
      blocVariante(loi) +
      lienOfficiel +
      '<a class="bouton" href="#/devoir/' + loi.id + '/vote">Voter sur ce texte</a>' +
      "</main>" +
      navbas("#/")
    );
  }

  /* Le bloc « Ce qui a changé » n'apparaît que si le fichier porte `variante`.
     Il ne dit que ce que les contrôles ont prouvé : la phrase citée est dans le
     texte source, elle n'est plus dans le texte adopté, et le scrutin qui l'a
     retirée est nommé. */
  function blocVariante(loi) {
    var v = loi.variante;
    if (!v || !v.avant) return "";
    var s = v.supprimee_par || {};

    var compte = "";
    if (s.numero != null) {
      compte = "Scrutin n° " + esc(s.numero);
      if (s.date) compte += " du " + esc(dateLongue(s.date));
      if (s.pour != null && s.contre != null) {
        compte += " : " + esc(s.pour) + " pour \u00b7 " + esc(s.contre) + " contre";
        if (s.abstention != null) compte += " \u00b7 " + esc(s.abstention) + " abstentions";
      }
      compte += ".";
    }

    var lien = "";
    if (v.source_avant && v.source_avant.url) {
      var hote = "";
      try {
        hote = new URL(v.source_avant.url).hostname.replace(/^www\./, "");
      } catch (e) {
        hote = "";
      }
      lien =
        '<a class="variante__lien" href="' + esc(v.source_avant.url) + '" rel="noopener">' +
        esc(v.source_avant.nom || "Source sur " + hote) + "</a>";
    }

    return (
      '<section class="variante">' +
      '<p class="etiquette">Ce qui a changé</p>' +
      (v.reference ? '<p class="variante__ref">' + esc(v.reference) + "</p>" : "") +
      '<blockquote class="variante__citation">\u00ab\u00a0' + esc(v.avant) + "\u00a0\u00bb</blockquote>" +
      '<p class="variante__note">Rédaction du texte de la commission, avant le vote.</p>' +
      (compte ? '<p class="variante__compte">' + compte + "</p>" : "") +
      '<p class="variante__note">Le texte adopté ne contient plus cette phrase.</p>' +
      lien +
      "</section>"
    );
  }

  function ecranChiffres(loi) {
    marquer(loi.id, "chiffres");
    return (
      barre("#/devoir/" + loi.id, "Les chiffres") +
      '<main class="ecran">' +
      enteteEtape(loi, "Le scrutin") +
      '<p class="compteur">' + esc(dateLongue(loi.scrutin.date)) + " \u00b7 " + esc(loi.scrutin.chambre) + "</p>" +
      '<div class="chiffres">' +
      loi.chiffres
        .map(function (c) {
          return (
            '<div class="chiffre"><span class="chiffre__valeur">' + esc(c.valeur) + "</span>" +
            '<span class="chiffre__libelle">' + esc(c.libelle) + "</span></div>"
          );
        })
        .join("") +
      "</div>" +
      '<p class="petit">Règle appliquée : ' + esc(loi.scrutin.regle) + ".</p>" +
      '<a class="bouton" href="#/devoir/' + loi.id + '/debat">Le débat, mot pour mot</a>' +
      "</main>" +
      navbas("#/")
    );
  }

  function bord(titre, entrees, classe, id) {
    var titreHTML =
      '<h3 class="bord__titre" id="' + esc(id) + '">' + esc(titre) + "</h3>";
    if (!entrees || !entrees.length) {
      return (
        '<section class="bord bord--' + classe + '" aria-labelledby="' + esc(id) + '">' +
        titreHTML +
        vide("Rien pour ce bord", "Aucune entrée publiée pour ce bord. La sélection ne remplace jamais un manque par une invention.", "") +
        "</section>"
      );
    }
    return (
      '<section class="bord bord--' + classe + '" aria-labelledby="' + esc(id) + '">' +
      titreHTML +
      entrees
        .map(function (e) {
          return (
            '<div class="entree">' +
            (e.meta ? '<span class="entree__meta">' + esc(e.meta) + "</span>" : "") +
            '<span class="entree__titre">' +
            (e.url
              ? '<a href="' + esc(e.url) + '" rel="noopener" target="_blank">' + esc(e.titre) +
                '<span class="sr"> (nouvel onglet)</span></a>'
              : esc(e.titre)) +
            "</span>" +
            (e.texte ? '<span class="entree__texte">' + esc(e.texte) + "</span>" : "") +
            "</div>"
          );
        })
        .join("") +
      "</section>"
    );
  }

  /* Les citations du débat ne sont pas reformulées : elles sont recopiées du
     compte rendu, et le contrôle refuse celles qui ne s'y trouvent pas.
     Chaque bord est une section nommée par son titre : le lecteur d'écran
     sait de quel côté il écoute les citations. */
  function blocCitations(cote, titre, liste) {
    var id = "debat-" + cote;
    var nom = cote === "pour" ? "Pour" : "Contre";
    var entete =
      '<header class="debat__tete">' +
      '<span class="debat__cote">' + esc(nom) + "</span>" +
      (liste.length
        ? '<span class="debat__compte">' + liste.length + " intervention" + (liste.length > 1 ? "s" : "") + "</span>"
        : "") +
      "</header>" +
      '<h3 class="debat__titre" id="' + id + '">' + esc(titre) + "</h3>";
    if (!liste.length) {
      return (
        '<section class="debat debat--' + cote + '" aria-labelledby="' + id + '">' +
        entete +
        vide(
          "Rien pour ce bord",
          "Aucune intervention publiée pour ce bord. La sélection ne remplace jamais un manque par une invention.",
          ""
        ) +
        "</section>"
      );
    }
    return (
      '<section class="debat debat--' + cote + '" aria-labelledby="' + id + '">' +
      entete +
      liste
        .map(function (x) {
          return (
            '<figure class="citation">' +
            '<blockquote class="citation__texte">\u00ab\u00a0' + esc(x.citation) + '\u00a0\u00bb</blockquote>' +
            '<figcaption class="citation__auteur">' +
            '<span class="citation__nom">' + esc(x.nom) + "</span>" +
            '<span class="citation__role">' + esc(x.role) + "</span>" +
            "</figcaption>" +
            '<a class="citation__source" href="' + esc(x.url) + '" rel="noopener" target="_blank">' +
            '<span class="citation__date">Compte rendu du ' + esc(dateLongue(x.date)) + "</span>" +
            '<span class="citation__chambre">' + esc(x.affiliation) + "</span>" +
            '<span class="sr"> (nouvel onglet)</span>' +
            "</a>" +
            "</figure>"
          );
        })
        .join("") +
      "</section>"
    );
  }

  function ecranDebat(loi) {
    marquer(loi.id, "oppose");
    var d = loi.debat || {};
    var pour = d.pour || [];
    var contre = d.contre || [];
    return (
      barre("#/devoir/" + loi.id + "/chiffres", "Le débat") +
      '<main class="ecran">' +
      enteteEtape(loi, "Le débat, mot pour mot", d.chapeau ? esc(d.chapeau) : "") +
      '<div class="debat-ensemble">' +
      blocCitations("pour", d.pour_titre || "Pour", pour) +
      blocCitations("contre", d.contre_titre || "Contre", contre) +
      "</div>" +
      (d.note ? '<p class="mono">' + esc(d.note) + "</p>" : "") +
      '<a class="bouton" href="#/devoir/' + loi.id + '/verif">Vérifier les chiffres</a>' +
      "</main>" +
      navbas("#/")
    );
  }

  function libelleVerdict(v) {
    if (v === "confirmé") return "Confirmé";
    if (v === "nuancé") return "Nuancé";
    return "Non documenté";
  }

  function ecranVerif(loi) {
    marquer(loi.id, "verif");
    var v = loi.verifications || {};
    var liste = v.chiffres || [];
    return (
      barre("#/devoir/" + loi.id + "/debat", "Vérification") +
      '<main class="ecran">' +
      enteteEtape(loi, "Les chiffres, vérifiés", v.chapeau ? esc(v.chapeau) : "") +
      liste
        .map(function (x) {
          var sources = x.sources || [];
          return (
            '<article class="verif" data-verdict="' + esc(x.verdict) + '">' +
            '<p class="verif__verdict">' + esc(libelleVerdict(x.verdict)) + "</p>" +
            '<blockquote class="verif__phrase">\u00ab\u00a0' + esc(x.affirmation) + "\u00a0\u00bb</blockquote>" +
            '<p class="verif__auteur">' +
            esc(x.auteur) + " \u2014 " + esc(x.role) + " \u00b7 " +
            '<a href="' + esc(x.url) + '" rel="noopener" target="_blank">compte rendu du ' +
            esc(dateLongue(x.date)) + "</a>" +
            "</p>" +
            '<p class="verif__texte">' + esc(x.explication) + "</p>" +
            (sources.length
              ? '<p class="verif__sources"><span class="sources__titre">Source' +
                (sources.length > 1 ? "s" : "") + " :</span> " +
                sources
                  .map(function (s) {
                    return '<a href="' + esc(s.url) + '" rel="noopener" target="_blank">' + esc(s.nom) + "</a>";
                  })
                  .join(" \u00b7 ") +
                "</p>"
              : '<p class="verif__sources"><span class="sources__titre">Source :</span> aucune source primaire publiée</p>') +
            "</article>"
          );
        })
        .join("") +
      (v.note ? '<p class="mono">' + esc(v.note) + "</p>" : "") +
      '<a class="bouton" href="#/devoir/' + loi.id + '/presse">Voir la presse</a>' +
      "</main>" +
      navbas("#/")
    );
  }

  function ecranPresse(loi) {
    marquer(loi.id, "source");
    return (
      barre("#/devoir/" + loi.id, "La presse") +
      '<main class="ecran">' +
      enteteEtape(loi, "Ce qu\u2019en disent les journaux") +
      bord(
        loi.presse.pour_titre || "Pour",
        loi.presse.pour.map(function (a) {
          return { titre: a.titre, meta: a.media + " \u2014 " + dateLongue(a.date), url: a.url };
        }),
        "neutre",
        "presse-pour"
      ) +
      bord(
        loi.presse.contre_titre || "Contre",
        loi.presse.contre.map(function (a) {
          return { titre: a.titre, meta: a.media + " \u2014 " + dateLongue(a.date), url: a.url };
        }),
        "neutre",
        "presse-contre"
      ) +
      '<p class="mono">' + esc(loi.presse.note) + "</p>" +
      '<a class="bouton" href="#/devoir/' + loi.id + '/resultat">Votre vote final</a>' +
      "</main>" +
      navbas("#/")
    );
  }

  /* Les sièges dessinés sont ceux du scrutin, pas ceux de la composition du
     jour. Les sièges qu'aucun groupe ne représente sont comptés à part :
     aucun absent n'est attribué à un groupe. */
  function groupesDuScrutin(loi) {
    var parId = {};
    (loi.votes_par_groupe || []).forEach(function (d) {
      parId[d.id] = d;
    });
    var liste = etat.groupes
      .filter(function (g) {
        return parId[g.id];
      })
      .map(function (g) {
        return {
          id: g.id,
          nom: g.nom,
          couleur: g.couleur,
          couleur_sombre: g.couleur_sombre,
          sieges: parId[g.id].sieges
        };
      });
    if (loi.sieges_vides > 0) {
      liste.push({
        id: "vides",
        nom: "Sièges non occupés",
        couleur: "#3A322C",
        couleur_sombre: "#3A322C",
        sieges: loi.sieges_vides
      });
    }
    return liste;
  }

  function decomptes(loi) {
    var map = {};
    loi.votes_par_groupe.forEach(function (d) {
      map[d.id] = d;
    });
    return map;
  }

  function libelleChoix(choix) {
    if (choix === "pour") return "Pour";
    if (choix === "contre") return "Contre";
    if (choix === "abstention") return "Abstention";
    return "Non exprimé";
  }

  function ecranResultat(loi) {
    var v = voteDe(loi.id);
    var s = loi.scrutin;
    var texte = "";
    if (v && v.v1 && v.v2) {
      texte =
        v.v1 === v.v2
          ? "Vous avez voté deux fois de la même façon."
          : "Vous avez changé d\u2019avis entre le premier et le second vote. Aucun gain n\u2019en dépend.";
    }
    return (
      barre("#/devoir/" + loi.id, "Votre vote final") +
      '<main class="ecran">' +
      enteteEtape(loi, "Le résultat", texte ? esc(texte) : "") +
      '<p class="compteur">' + esc(dateLongue(s.date)) + " \u00b7 " + esc(s.chambre) + " \u00b7 " + esc(loi.statut) + "</p>" +
      '<div class="chiffres">' +
      '<div class="chiffre"><span class="chiffre__valeur">' + s.pour + '</span><span class="chiffre__libelle">Pour</span></div>' +
      '<div class="chiffre"><span class="chiffre__valeur">' + s.contre + '</span><span class="chiffre__libelle">Contre</span></div>' +
      '<div class="chiffre"><span class="chiffre__valeur">' + s.abstention + '</span><span class="chiffre__libelle">Abstentions</span></div>' +
      "</div>" +
      (v && v.v2
        ? '<p class="petit">Votre vote final : ' + esc(libelleChoix(v.v2)) + ". Il reste sur cet appareil." + "</p>"
        : '<a class="bouton" href="#/devoir/' + loi.id + '/vote-final">Voter une seconde fois</a>') +
      '<a class="bouton bouton--secondaire" href="#/devoir/' + loi.id + '/carte">Voir la carte</a>' +
      "</main>" +
      navbas("#/")
    );
  }

  function ecranCarte(loi) {
    marquer(loi.id, "carte");
    var v = voteDe(loi.id);
    var choix = v ? v.v2 || v.v1 : null;
    var mode = etat.modeCarte || "groupe";
    var d = decomptes(loi);
    var groupes = groupesDuScrutin(loi);
    var svg = window.QuorumHemicycle.svg(groupes, mode, {
      decomptes: d,
      choix: choix
    });
    var commeMoi = choix
      ? window.QuorumHemicycle.combienCommeMoi(groupes, d, choix)
      : 0;

    return (
      barre("#/devoir/" + loi.id, "La carte") +
      '<main class="ecran">' +
      enteteEtape(loi, "L\u2019hémicycle") +
      '<p class="compteur">' + esc(dateLongue(loi.scrutin.date)) + " \u00b7 " + esc(loi.scrutin.chambre) + "</p>" +
      '<div class="bascule" role="group" aria-label="Lecture de la carte">' +
      '<button type="button" data-action="mode-carte" data-mode="groupe" aria-pressed="' + (mode === "groupe") + '">Par groupe</button>' +
      '<button type="button" data-action="mode-carte" data-mode="accord" aria-pressed="' + (mode === "accord") + '">Avec vous</button>' +
      "</div>" +
      '<div class="carte-sieges">' + svg + "</div>" +
      (mode === "groupe"
        ? '<div class="legende legende--groupes">' +
          groupes
            .map(function (g) {
              return (
                '<span class="legende__item"><span class="legende__pastille" aria-hidden="true" style="background:' +
                g.couleur_sombre + '"></span>' +
                '<span class="legende__nom">' + esc(g.nom) + "</span></span>"
              );
            })
            .join("") +
          "</div>" +
          '<p class="mono">Un point est un siège. Les sièges non occupés ne sont attribués à aucun groupe.</p>'
        : choix
          ? '<div class="pile">' +
            '<p class="compteur">' + commeMoi + " sièges ont voté comme vous.</p>" +
            '<p class="mono">Votre vote reste sur cet appareil.</p>' +
            "</div>"
          : vide(
              "Aucun vote enregistré",
              "La lecture « Avec vous » compare la carte à votre vote. Votez d\u2019abord : rien n\u2019est supposé à votre place.",
              '<a class="bouton bouton--secondaire" href="#/devoir/' + loi.id + '/vote">Aller au vote</a>'
            )) +
      '<a class="bouton bouton--secondaire" href="#/devoir/' + loi.id + '/chiffres">Revoir les chiffres</a>' +
      "</main>" +
      navbas("#/")
    );
  }

  /* ---------- Arbre des compétences ---------- */

  /* Un point par action du parcours, jamais par contenu de vote : le premier
     et le second vote rapportent un point quel que soit le choix, et changer
     d'avis n'en rapporte aucun de plus. */
  function pointsExploration(loi) {
    var p = progresDe(loi.id);
    var v = voteDe(loi.id) || {};
    var n = 0;
    if (p.fait) n++;
    if (v.v1) n++;
    if (p.lu) n++;
    if (p.oppose) n++;
    if (p.source) n++;
    if (p.chiffres) n++;
    if (p.carte) n++;
    if (v.v2) n++;
    return n;
  }

  function actionFaite(loi, cle) {
    if (cle === "v1" || cle === "v2") {
      var v = voteDe(loi.id) || {};
      return !!v[cle];
    }
    return !!progresDe(loi.id)[cle];
  }

  function jalon(nom, cle, loi) {
    var ouvert = actionFaite(loi, cle);
    return (
      '<li class="jalon' + (ouvert ? " jalon--ouvert" : "") + '">' +
      '<span class="jalon__marque" aria-hidden="true"></span>' +
      '<span class="jalon__nom">' + esc(nom) + "</span></li>"
    );
  }

  function noeudArbre(nom, seuil, xp) {
    var ouvert = xp >= seuil;
    return (
      '<li class="noeud' + (ouvert ? " noeud--ouvert" : "") + '">' +
      '<span class="noeud__nom">' + esc(nom) + "</span>" +
      (ouvert ? "" : '<span class="noeud__seuil">' + esc(seuil) + " pts</span>") +
      "</li>"
    );
  }

  function essaim(t, xp, themeLoi) {
    var ouvert = xp >= t.seuil;
    var faits = t.branches.filter(function (b) {
      return xp >= b.seuil;
    }).length;
    return (
      '<section class="essaim' + (ouvert ? " essaim--ouvert" : "") + '">' +
      '<div class="essaim__tete">' +
      '<h3 class="essaim__nom">' + esc(t.nom) + "</h3>" +
      (t.id === themeLoi ? '<span class="essaim__loi">loi du jour</span>' : "") +
      '<span class="essaim__etat">' + faits + " / " + t.branches.length + "</span>" +
      "</div>" +
      '<ul class="noeuds">' +
      t.branches
        .map(function (b) {
          return noeudArbre(b.nom, b.seuil, xp);
        })
        .join("") +
      "</ul></section>"
    );
  }

  function ecranArbre() {
    var loi = etat.loi;
    var arbre = etat.arbre;

    if (!arbre) {
      return (
        masthead() +
        '<main class="ecran">' +
        '<div class="ecran__entete">' +
        '<span class="theme">Progression</span>' +
        '<h1 class="ecran__titre">L\u2019arbre</h1>' +
        "</div>" +
        vide(
          "Arbre indisponible",
          "Le fichier data/ref/arbre.json n\u2019a pas pu \u00eatre lu. Aucun n\u0153ud n\u2019est invent\u00e9.",
          ""
        ) +
        "</main>" +
        navbas("#/arbre")
      );
    }

    var xp = pointsExploration(loi);
    var max = arbre.meta.points_max;
    var total = arbre.tronc.length;
    var ouverts = arbre.tronc.filter(function (j) {
      return actionFaite(loi, j.cle);
    }).length;
    arbre.themes.forEach(function (t) {
      total += 1 + t.branches.length;
      if (xp >= t.seuil) ouverts++;
      t.branches.forEach(function (b) {
        if (xp >= b.seuil) ouverts++;
      });
    });

    return (
      masthead() +
      '<main class="ecran">' +
      '<div class="ecran__entete">' +
      '<span class="theme">Progression</span>' +
      '<h1 class="ecran__titre">L\u2019arbre</h1>' +
      '<p class="ecran__chapeau">Il pousse avec ce que vous avez explor\u00e9, jamais avec ce que vous avez vot\u00e9.</p>' +
      "</div>" +
      '<div class="jauge" aria-hidden="true"><span class="jauge__part" style="width:' +
      Math.round((xp * 100) / max) +
      '%"></span></div>' +
      '<p class="compteur">' + xp + " points d\u2019exploration sur " + max + " \u00b7 " + ouverts +
      " comp\u00e9tences ouvertes sur " + total + "</p>" +
      '<section class="tronc">' +
      '<p class="etiquette">Tronc commun</p>' +
      '<ul class="jalons">' +
      arbre.tronc
        .map(function (j) {
          return jalon(j.nom, j.cle, loi);
        })
        .join("") +
      "</ul></section>" +
      '<div class="essaims">' +
      arbre.themes
        .map(function (t) {
          return essaim(t, xp, loi.theme);
        })
        .join("") +
      "</div>" +
      '<section class="tronc">' +
      '<p class="etiquette">Comment gagner un point</p>' +
      '<ul class="actions">' +
      arbre.meta.actions
        .map(function (a) {
          var faite = actionFaite(loi, a.cle);
          return (
            '<li class="action' + (faite ? " action--faite" : "") + '">' +
            '<span class="action__marque" aria-hidden="true">' + (faite ? "\u2713" : "\u00b7") + "</span>" +
            '<span class="action__nom">' + esc(a.nom) + "</span></li>"
          );
        })
        .join("") +
      "</ul></section>" +
      '<p class="mono">' + esc(arbre.meta.regle) + "</p>" +
      "</main>" +
      navbas("#/arbre")
    );
  }


  function ecranMethode(loi) {
    return (
      masthead() +
      '<main class="ecran">' +
      '<div class="ecran__entete">' +
      '<span class="theme">Méthode</span>' +
      '<h1 class="ecran__titre">Comment ce devoir est fabriqué</h1>' +
      "</div>" +
      '<div class="pile">' +
      '<p class="petit">Les phrases des extraits sont copiées du texte, sans reformulation. Le débat est cité mot pour mot depuis les comptes rendus, sans coupe. Les chiffres du scrutin viennent du décompte ; ceux du débat sont confrontés à une source, et rendus « non documentés » quand il n\u2019y en a pas. Les titres de presse sont repris tels quels.</p>' +
      "</div>" +
      '<p class="etiquette">Journal des contrôles</p>' +
      '<ul class="liste">' +
      loi.meta.controles
        .map(function (c) {
          var symbole = c.etat === "ok" ? "\u2713" : c.etat === "demo" ? "\u25cb" : "\u2717";
          return (
            '<li class="ligne ligne--etroit"><span class="ligne__date">' + symbole + '</span><span class="ligne__texte">' +
            esc(c.nom) + "</span></li>"
          );
        })
        .join("") +
      "</ul>" +
      '<p class="mono">\u2713 vérifié \u00b7 \u2717 échec</p>' +
      "</main>" +
      navbas("#/methode")
    );
  }

  /* L'archive montre ce qui est publié, pas un état vide. Le lien de recherche
     n'apparaît qu'à partir de dix lois : en dessous, il menait à un cul-de-sac. */
  function ecranArchive() {
    var lois = etat.index || [];
    return (
      masthead() +
      '<main class="ecran">' +
      '<div class="ecran__entete">' +
      '<span class="theme">Archive</span>' +
      '<h1 class="ecran__titre">Les devoirs</h1>' +
      '<p class="ecran__chapeau">Chaque devoir est une loi publiée après les contrôles. Rien n\u2019est listé ici qui n\u2019ait passé le gate.</p>' +
      "</div>" +
      (lois.length
        ? '<ul class="liste">' +
          lois
            .map(function (l) {
              return (
                '<li><a class="ligne ligne--lien ligne--archive" href="#/devoir/' + esc(l.id) + '">' +
                '<span class="ligne__date">' + esc(themeNom(l.theme)) + "</span>" +
                '<span class="ligne__texte">' + esc(l.titre) + "</span>" +
                "</a></li>"
              );
            })
            .join("") +
          "</ul>" +
          '<p class="compteur">' + lois.length +
          (lois.length > 1 ? " devoirs publiés" : " devoir publié") + "</p>"
        : vide(
            "Aucun devoir publié",
            "L\u2019index des lois est vide. Aucun devoir n\u2019est inventé pour remplir la page.",
            ""
          )) +
      (lois.length >= 10
        ? '<a class="bouton bouton--discret" href="#/recherche">Chercher un devoir</a>'
        : "") +
      "</main>" +
      navbas("#/archive")
    );
  }

  function ecranRecherche() {
    return (
      masthead() +
      '<main class="ecran">' +
      '<div class="ecran__entete">' +
      '<span class="theme">Recherche</span>' +
      '<h1 class="ecran__titre">Chercher un devoir</h1>' +
      "</div>" +
      vide(
        "La recherche s\u2019active à partir de 10 lois",
        "Avec une seule loi, une recherche n\u2019aurait rien à filtrer. Le champ apparaîtra avec l\u2019archive.",
        ""
      ) +
      "</main>" +
      navbas("#/archive")
    );
  }

  /* ---------- Routage ---------- */

  function rendre(html) {
    /* La mention d'indépendance est obligatoire sur chaque page : elle est
       ajoutée une seule fois, ici, au lieu d'être recopiée dans les écrans. */
    if (html.indexOf('class="pied"') < 0) {
      html = html.replace("</main>", "</main>" + pied());
    }
    app.innerHTML = html;
    if (!memoire.intro) app.innerHTML += surcoucheIntro();
    app.scrollTop = 0;
    window.scrollTo(0, 0);

    /* Le titre de l'onglet et de l'historique suit l'écran courant. */
    var titre = app.querySelector("h1");
    document.title = (titre ? titre.textContent.trim() : "Quorum") + " \u00b7 Quorum";

    /* La surcouche d'accueil prend le focus : au clavier, on ne reste pas
       derrière un dialogue ouvert. */
    var entree = app.querySelector('[data-action="fermer-intro"]');
    if (entree) entree.focus({ preventScroll: true });
  }

  function route() {
    var h = (location.hash || "#/").replace(/^#\/?/, "");
    var p = h.split("/").filter(Boolean);

    if (!etat.pret) {
      rendre(
        masthead() +
          '<main class="ecran"><p class="petit" role="status">Chargement…</p></main>'
      );
      return;
    }

    var loi = etat.loi;

    if (p.length === 0) return rendre(ecranAccueil());
    if (p[0] === "arbre") return rendre(ecranArbre());
    if (p[0] === "methode") return rendre(ecranMethode(loi));
    if (p[0] === "archive") return rendre(ecranArchive());
    if (p[0] === "recherche") return rendre(ecranRecherche());

    if (p[0] === "devoir") {
      var sous = p[2] || "";
      if (sous === "vote") return rendre(ecranVote(loi, false));
      if (sous === "vote-final") return rendre(ecranVote(loi, true));
      if (sous === "chronologie") return rendre(ecranFait(loi));
      if (sous === "fait") {
        location.hash = "#/devoir/" + loi.id + "/chronologie";
        return;
      }
      if (sous === "resume") return rendre(ecranResume(loi));
      if (sous === "texte") {
        location.hash = "#/devoir/" + loi.id + "/resume";
        return;
      }
      if (sous === "article") return rendre(ecranArticle(loi));
      if (sous === "chiffres") return rendre(ecranChiffres(loi));
      if (sous === "arguments") {
        location.hash = "#/devoir/" + loi.id + "/debat";
        return;
      }
      if (sous === "debat") return rendre(ecranDebat(loi));
      if (sous === "verif") return rendre(ecranVerif(loi));
      if (sous === "presse") return rendre(ecranPresse(loi));
      if (sous === "experts") {
        location.hash = "#/devoir/" + loi.id + "/presse";
        return;
      }
      if (sous === "resultat") return rendre(ecranResultat(loi));
      if (sous === "carte") return rendre(ecranCarte(loi));
      return rendre(ecranDevoir(loi));
    }

    return rendre(ecranAccueil());
  }

  /* ---------- Actions ---------- */

  function enregistrerVote(loi, choix, final) {
    var v = memoire.votes[loi.id] || { v1: null, v2: null };
    if (final) v.v2 = choix;
    else v.v1 = choix;
    v.date = new Date().toISOString();
    memoire.votes[loi.id] = v;
    sauver();
  }

  function carteVote() {
    var zone = document.getElementById("zone-vote");
    var carte = document.getElementById("carte-vote");
    if (!zone || !carte) return;

    var largeur = zone.clientWidth || 320;
    var seuil = largeur * 0.3;
    var depart = null;
    var dx = 0;
    var actif = false;

    function appliquer() {
      carte.style.transform = "translateX(" + dx + "px) rotate(" + dx / 40 + "deg)";
      carte.style.opacity = String(Math.max(0.35, 1 - Math.abs(dx) / (largeur * 1.6)));
    }

    zone.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      depart = e.clientX;
      dx = 0;
      actif = true;
      carte.setAttribute("data-glisse", "true");
      try {
        zone.setPointerCapture(e.pointerId);
      } catch (err) {
        /* certains navigateurs refusent la capture : le geste reste utilisable */
      }
    });

    zone.addEventListener("pointermove", function (e) {
      if (!actif || depart === null) return;
      dx = e.clientX - depart;
      appliquer();
    });

    function finir() {
      if (!actif) return;
      actif = false;
      carte.removeAttribute("data-glisse");
      if (Math.abs(dx) > seuil) {
        var choix = dx > 0 ? "pour" : "contre";
        carte.style.transform = "translateX(" + (dx > 0 ? largeur : -largeur) + "px)";
        carte.style.opacity = "0";
        window.setTimeout(function () {
          voter(choix);
        }, 140);
      } else {
        carte.style.transform = "";
        carte.style.opacity = "";
      }
      depart = null;
      dx = 0;
    }

    zone.addEventListener("pointerup", finir);
    zone.addEventListener("pointercancel", finir);

    document.querySelectorAll(".vote__bouton").forEach(function (b) {
      b.addEventListener("click", function () {
        voter(b.getAttribute("data-choix"));
      });
    });
  }

  function voter(choix) {
    var loi = etat.loi;
    var final = /vote-final/.test(location.hash);
    enregistrerVote(loi, choix, final);
    /* Le premier vote mène à la suite du parcours, pas en arrière : les chiffres
       du scrutin, puis le débat. Le vote final mène au résultat. */
    if (final) {
      location.hash = "#/devoir/" + loi.id + "/resultat";
    } else {
      location.hash = "#/devoir/" + loi.id + "/chiffres";
    }
  }

  app.addEventListener("click", function (e) {
    var el = e.target.closest("[data-action]");
    if (!el) return;
    var action = el.getAttribute("data-action");

    if (action === "fermer-intro") {
      memoire.intro = true;
      sauver();
      var couche = document.getElementById("surcouche");
      if (couche) couche.remove();
      var n = app.querySelector(".surcouche");
      if (n) n.remove();
      return;
    }

    if (action === "mode-carte") {
      etat.modeCarte = el.getAttribute("data-mode");
      rendre(ecranCarte(etat.loi));
      return;
    }
  });

  window.addEventListener("hashchange", function () {
    route();
  });

  /* Clavier : les flèches ne votent que si le focus est sur la carte de vote.
     Ailleurs — sur un lien de la barre, par exemple — elles doivent continuer
     à faire défiler la page au lieu d'enregistrer un vote. */
  document.addEventListener("keydown", function (e) {
    if (!etat.pret) return;
    if (!document.getElementById("carte-vote")) return;
    var actif = document.activeElement;
    var dansVote = !actif || actif === document.body || actif.closest(".vote");
    if (!dansVote) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      voter("pour");
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      voter("contre");
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      voter("abstention");
    }
  });

  /* ---------- Démarrage ---------- */

  function chargerJson(url) {
    /* no-store : sans cela le navigateur peut servir un JSON périmé depuis son
       cache HTTP, même quand le service worker interroge le réseau. */
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error(url);
      return r.json();
    });
  }

  Promise.all([
    chargerJson("data/ref/groupes.json"),
    chargerJson("data/lois/index.json"),
    /* L'arbre est un ornement de progression : s'il manque, l'application
       fonctionne et l'écran le dit, sans inventer de nœud. */
    chargerJson("data/ref/arbre.json").catch(function () {
      return null;
    })
  ])
    .then(function (res) {
      etat.groupes = res[0].groupes;
      etat.arbre = res[2];
      var index = res[1];
      if (!index || !Array.isArray(index.lois) || !index.lois.length) {
        throw new Error("index des lois vide");
      }
      etat.index = index.lois;
      return chargerJson(index.lois[0].fichier);
    })
    .then(function (loi) {
      etat.loi = loi;
      etat.pret = true;
      progresDe(etat.loi.id);
      route();
    })
    .catch(function () {
      rendre(
        masthead() +
          '<main class="ecran">' +
          vide(
            "Données indisponibles",
            "Les fichiers de données n\u2019ont pas pu être chargés. Ouvrez l\u2019application depuis un serveur local, pas depuis un fichier.",
            ""
          ) +
          "</main>"
      );
    });

  /* Après chaque rendu, on rebranche les interactions de l'écran courant. */
  var rendreOrigine = rendre;
  rendre = function (html) {
    rendreOrigine(html);
    if (/\/vote(-final)?$/.test(location.hash)) carteVote();
  };
})();
