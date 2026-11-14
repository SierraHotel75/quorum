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
    loin: null,
    pret: false
  };

  var memoire = charger();

  /* ---------- Mémoire locale ---------- */

  function memoireVierge() {
    return { version: 1, votes: {}, progres: {}, reponses: {}, intro: false };
  }

  function charger() {
    try {
      var brut = localStorage.getItem(CLE);
      if (!brut) return memoireVierge();
      var objet = JSON.parse(brut);
      if (!objet || typeof objet !== "object" || objet.version !== 1) return memoireVierge();
      if (!objet.votes || typeof objet.votes !== "object") objet.votes = {};
      if (!objet.progres || typeof objet.progres !== "object") objet.progres = {};
      if (!objet.reponses || typeof objet.reponses !== "object") objet.reponses = {};
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
      memoire.progres[id] = { lu: false, source: false, oppose: false, quiz: false };
    }
    return memoire.progres[id];
  }

  function marquer(id, cle) {
    var p = progresDe(id);
    if (p[cle]) return;
    p[cle] = true;
    sauver();
  }

  /* Les réponses au quiz sont gardées pour que l'état « juste / faux » survive
     à un changement d'écran. Elles ne quittent pas l'appareil. */
  function reponsesDe(id) {
    if (!memoire.reponses[id]) memoire.reponses[id] = {};
    return memoire.reponses[id];
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
      '<p><strong>Chaque phrase a sa source.</strong> Les extraits sont copiés du texte, les chiffres viennent du scrutin.</p>' +
      '<p><strong>Aucun avis.</strong> Quorum montre ce qui a été dit et voté. Il ne dit pas quoi penser.</p>' +
      "</div>" +
      "</div>" +
      '<button class="bouton" type="button" data-action="fermer-intro">Commencer</button>' +
      "</div>"
    );
  }

  function barre(retour, etape) {
    return (
      '<div class="barre">' +
      '<a class="barre__retour" href="' + retour + '">\u2190 Retour</a>' +
      (etape ? '<span class="barre__etape">' + esc(etape) + "</span>" : "") +
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

  /* ---------- Écrans ---------- */

  function ecranAccueil() {
    var loi = etat.loi;
    var v = voteDe(loi.id);

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
      '<div class="puces">' +
      '<span class="puce">' + esc(dateLongue(loi.scrutin.date)) + "</span>" +
      '<span class="puce">' + esc(loi.scrutin.chambre) + "</span>" +
      "</div>" +
      (v
        ? '<a class="bouton" href="#/devoir/' + loi.id + '">Reprendre le devoir</a>'
        : '<a class="bouton" href="#/devoir/' + loi.id + '/vote">Commencer</a>') +
      "</div>" +
      '<div class="pile">' +
      '<p class="etiquette">Ce qui vient ensuite</p>' +
      '<p class="petit">Une loi, un parcours : voter, lire le fait, les extraits, les chiffres, les arguments, la presse, les ressources, puis voir où se situe votre voix.</p>' +
      "</div>" +
      '<p class="mention-independance">Projet indépendant, non affilié à l\u2019Assemblée nationale ni au Sénat. Le vote reste sur cet appareil.</p>' +
      "</main>" +
      navbas("#/")
    );
  }

  function etapesDe(loi) {
    var p = progresDe(loi.id);
    var v = voteDe(loi.id);
    return [
      { cle: "vote", nom: "Votre vote", fait: !!v, href: "#/devoir/" + loi.id + "/vote" },
      { cle: "fait", nom: "Le fait", fait: p.lu, href: "#/devoir/" + loi.id + "/fait" },
      { cle: "texte", nom: "Les extraits", fait: p.lu, href: "#/devoir/" + loi.id + "/texte" },
      { cle: "article", nom: "L\u2019article entier", fait: p.lu, href: "#/devoir/" + loi.id + "/article" },
      { cle: "chiffres", nom: "Les chiffres", fait: p.quiz, href: "#/devoir/" + loi.id + "/chiffres" },
      { cle: "arguments", nom: "Les arguments", fait: p.oppose, href: "#/devoir/" + loi.id + "/arguments" },
      { cle: "presse", nom: "La presse", fait: p.source, href: "#/devoir/" + loi.id + "/presse" },
      { cle: "experts", nom: "Les ressources", fait: false, href: "#/devoir/" + loi.id + "/experts" },
      { cle: "resultat", nom: "Votre vote final", fait: v && v.v2, href: "#/devoir/" + loi.id + "/resultat" },
      { cle: "carte", nom: "La carte", fait: false, href: "#/devoir/" + loi.id + "/carte" }
    ];
  }

  function ecranDevoir(loi) {
    var etapes = etapesDe(loi);
    return (
      barre("#/", "Devoir") +
      '<main class="ecran">' +
      '<div class="ecran__entete">' +
      '<span class="theme">' + esc(themeNom(loi.theme)) + "</span>" +
      '<h1 class="ecran__titre">' + esc(loi.titre) + "</h1>" +
      '<p class="ecran__chapeau">' + esc(loi.resume) + "</p>" +
      "</div>" +
      '<ul class="liste">' +
      etapes
        .map(function (e) {
          return (
            '<li><a class="ligne ligne--lien ligne--etroit" href="' + e.href + '">' +
            '<span class="ligne__date">' + (e.fait ? "\u2713" : "\u00b7") + "</span>" +
            '<span class="ligne__texte">' + esc(e.nom) + "</span>" +
            "</a></li>"
          );
        })
        .join("") +
      "</ul>" +
      "</main>" +
      navbas("#/")
    );
  }

  function ecranVote(loi, final) {
    var v = voteDe(loi.id);
    var deja = final ? v && v.v2 : v && v.v1;
    var question = final
      ? "Après avoir lu, que pensez-vous de ce texte ?"
      : "Avant de lire, que pensez-vous de ce texte ?";
    var aide = final
      ? "Votre premier vote est conservé. Un changement d\u2019avis n\u2019ajoute rien."
      : "Glissez la carte, ou utilisez les boutons.";

    return (
      barre("#/devoir/" + loi.id, final ? "Vote final" : "Vote") +
      '<main class="ecran">' +
      '<div class="ecran__entete">' +
      '<span class="theme">' + (final ? "Vote final" : "Vote initial") + "</span>" +
      '<h2 class="ecran__titre">' + esc(loi.titre) + "</h2>" +
      "</div>" +
      (deja
        ? vide(
            "Vote enregistré",
            "Vous avez déjà voté. Le vote est définitif et reste sur cet appareil.",
            '<a class="bouton bouton--secondaire" href="#/devoir/' + loi.id + '/fait">Continuer</a>'
          )
        : '<div class="vote">' +
          '<div class="vote__zone" id="zone-vote">' +
          '<div class="vote__carte" id="carte-vote">' +
          '<p class="vote__question">' + esc(question) + "</p>" +
          '<p class="vote__aide">' + esc(aide) + "</p>" +
          "</div>" +
          "</div>" +
          '<div class="vote__actions">' +
          '<button class="vote__bouton" type="button" data-choix="pour">Pour</button>' +
          '<button class="vote__bouton" type="button" data-choix="abstention">Abstention</button>' +
          '<button class="vote__bouton" type="button" data-choix="contre">Contre</button>' +
          "</div>" +
          "</div>") +
      "</main>" +
      navbas("#/")
    );
  }

  function ecranFait(loi) {
    marquer(loi.id, "fait");
    return (
      barre("#/devoir/" + loi.id, "Le fait") +
      '<main class="ecran">' +
      '<div class="ecran__entete">' +
      '<span class="theme">Le fait</span>' +
      '<h2 class="ecran__titre">Du dépôt au vote</h2>' +
      "</div>" +
      '<ol class="timeline">' +
      loi.chronologie
        .map(function (e) {
          return (
            '<li class="timeline__item">' +
            '<span class="timeline__marqueur" data-chambre="' + esc(e.chambre) + '"></span>' +
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
      '<a class="bouton" href="#/devoir/' + loi.id + '/texte">Voir les extraits</a>' +
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

  function ecranTexte(loi) {
    var p = progresDe(loi.id);
    p.lu = true;
    sauver();
    return (
      barre("#/devoir/" + loi.id, "Les extraits") +
      '<main class="ecran">' +
      '<div class="ecran__entete">' +
      '<span class="theme">Les extraits</span>' +
      '<h2 class="ecran__titre">Ce que dit le texte</h2>' +
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
      barre("#/devoir/" + loi.id + "/texte", "Article entier") +
      '<main class="ecran">' +
      '<div class="ecran__entete">' +
      '<span class="theme">Texte</span>' +
      '<h2 class="ecran__titre">' +
      esc(multiple ? "Le texte, article par article" : (articles[0] && articles[0].titre) || "Le texte adopté") +
      "</h2>" +
      (multiple
        ? '<p class="compteur">' + articles.length + " articles cités, passages reproduits" + "</p>"
        : "") +
      "</div>" +
      '<div class="article">' +
      corps +
      "</div>" +
      blocVariante(loi) +
      lienOfficiel +
      '<a class="bouton" href="#/devoir/' + loi.id + '/chiffres">Passer aux chiffres</a>' +
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

  function carteQuiz(loi, q, qi) {
    var donnee = reponsesDe(loi.id)[qi];
    var repondu = donnee != null;
    return (
      '<div class="carte" data-quiz="' + qi + '">' +
      '<p>' + esc(q.question) + "</p>" +
      q.options
        .map(function (o, oi) {
          var marque = "";
          if (repondu) {
            if (oi === q.bonne) marque = ' data-etat="juste"';
            else if (oi === donnee) marque = ' data-etat="faux"';
          }
          return (
            '<button class="quiz__option" type="button" data-action="quiz" data-quiz="' + qi +
            '" data-option="' + oi + '"' + (repondu ? " disabled" : "") + marque + ">" +
            esc(o) + "</button>"
          );
        })
        .join("") +
      '<p class="mono" data-source' + (repondu ? "" : " hidden") + ">" + esc(q.source) + "</p>" +
      "</div>"
    );
  }

  function ecranChiffres(loi) {
    return (
      barre("#/devoir/" + loi.id, "Les chiffres") +
      '<main class="ecran">' +
      '<div class="ecran__entete">' +
      '<span class="theme">Les chiffres</span>' +
      '<h2 class="ecran__titre">Le scrutin</h2>' +
      '<p class="compteur">' + esc(dateLongue(loi.scrutin.date)) + " \u00b7 " + esc(loi.scrutin.chambre) + "</p>" +
      "</div>" +
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
      '<div class="pile">' +
      '<p class="etiquette">Vérifier</p>' +
      loi.quiz
        .map(function (q, qi) {
          return carteQuiz(loi, q, qi);
        })
        .join("") +
      "</div>" +
      '<a class="bouton" href="#/devoir/' + loi.id + '/arguments">Voir les arguments</a>' +
      "</main>" +
      navbas("#/")
    );
  }

  function bord(id, titre, entrees, classe) {
    if (!entrees || !entrees.length) {
      return (
        '<div class="bord bord--' + classe + '">' +
        '<p class="bord__titre">' + esc(titre) + "</p>" +
        vide("Rien pour ce bord", "Aucune entrée publiée pour ce bord. La sélection ne remplace jamais un manque par une invention.", "") +
        "</div>"
      );
    }
    return (
      '<div class="bord bord--' + classe + '">' +
      '<p class="bord__titre">' + esc(titre) + "</p>" +
      entrees
        .map(function (e) {
          return (
            '<div class="entree">' +
            (e.meta ? '<span class="entree__meta">' + esc(e.meta) + "</span>" : "") +
            '<span class="entree__titre">' +
            (e.url
              ? '<a href="' + esc(e.url) + '" rel="noopener" target="_blank">' + esc(e.titre) + "</a>"
              : esc(e.titre)) +
            "</span>" +
            (e.texte ? '<span class="entree__texte">' + esc(e.texte) + "</span>" : "") +
            "</div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function ecranArguments(loi) {
    var a = loi.arguments || {};
    var contenu = a.contenu || {};
    var pour = a.pour || [];
    var contre = a.contre || [];

    function blocDebat(cote, titre, liste) {
      if (!liste.length) {
        return (
          '<section class="debat debat--' + cote + '">' +
          vide(
            "Rien pour ce bord",
            "Aucune position publiée pour ce bord. La sélection ne remplace jamais un manque par une invention.",
            ""
          ) +
          "</section>"
        );
      }
      return (
        '<section class="debat debat--' + cote + '" aria-label="' + esc(titre) + '">' +
        liste
          .map(function (x) {
            return '<p class="debat__texte">' + gras(x.texte) + "</p>";
          })
          .join("") +
        "</section>"
      );
    }

    var sources = pour.concat(contre).filter(function (x) {
      return x.url;
    });

    return (
      barre("#/devoir/" + loi.id, "Les arguments") +
      '<main class="ecran">' +
      '<div class="ecran__entete">' +
      '<span class="theme">Les arguments</span>' +
      '<h2 class="ecran__titre">Comprendre en une minute</h2>' +
      (a.chapeau ? '<p class="ecran__chapeau">' + esc(a.chapeau) + "</p>" : "") +
      "</div>" +
      '<section class="contenu">' +
      '<p class="contenu__titre">' + esc(contenu.titre || "Contenu de l’article") + " :</p>" +
      (contenu.texte ? '<p class="contenu__texte">' + gras(contenu.texte) + "</p>" : "") +
      (contenu.points && contenu.points.length
        ? '<ul class="contenu__points">' +
          contenu.points
            .map(function (p) {
              return "<li>" + gras(p) + "</li>";
            })
            .join("") +
          "</ul>"
        : "") +
      "</section>" +
      '<div class="debat-ensemble">' +
      '<div class="bande-debat">' +
      '<span class="bande-debat__cote bande-debat__cote--pour">Pour</span>' +
      '<span class="bande-debat__titre">Le débat, en bref :</span>' +
      '<span class="bande-debat__cote bande-debat__cote--contre">Contre</span>' +
      "</div>" +
      blocDebat("pour", a.pour_titre || "Pour", pour) +
      blocDebat("contre", a.contre_titre || "Contre", contre) +
      "</div>" +
      (sources.length
        ? '<p class="sources">' +
          '<span class="sources__titre">Sources :</span> ' +
          sources
            .map(function (x) {
              return (
                '<a href="' + esc(x.url) + '" rel="noopener" target="_blank">' +
                esc(x.court || x.source || x.titre) +
                "</a>"
              );
            })
            .join(" · ") +
          "</p>"
        : "") +
      (a.note ? '<p class="mono">' + esc(a.note) + "</p>" : "") +
      '<a class="bouton" href="#/devoir/' + loi.id + '/presse" data-action="oppose">Voir la presse</a>' +
      "</main>" +
      navbas("#/")
    );
  }

  function ecranPresse(loi) {
    marquer(loi.id, "source");
    return (
      barre("#/devoir/" + loi.id, "La presse") +
      '<main class="ecran">' +
      '<div class="ecran__entete">' +
      '<span class="theme">La presse</span>' +
      '<h2 class="ecran__titre">Ce qu\u2019en disent les journaux</h2>' +
      "</div>" +
      bord(
        "pour",
        loi.presse.pour_titre || "Pour",
        loi.presse.pour.map(function (a) {
          return { titre: a.titre, meta: a.media + " \u2014 " + dateLongue(a.date), url: a.url };
        }),
        "neutre"
      ) +
      bord(
        "contre",
        loi.presse.contre_titre || "Contre",
        loi.presse.contre.map(function (a) {
          return { titre: a.titre, meta: a.media + " \u2014 " + dateLongue(a.date), url: a.url };
        }),
        "neutre"
      ) +
      '<p class="mono">' + esc(loi.presse.note) + "</p>" +
      '<a class="bouton" href="#/devoir/' + loi.id + '/experts">Voir les ressources</a>' +
      "</main>" +
      navbas("#/")
    );
  }

  function ecranExperts(loi) {
    return (
      barre("#/devoir/" + loi.id, "Les ressources") +
      '<main class="ecran">' +
      '<div class="ecran__entete">' +
      '<span class="theme">Les ressources</span>' +
      '<h2 class="ecran__titre">Les voix cit\u00e9es</h2>' +
      "</div>" +
      bord(
        "pour",
        loi.experts.pour_titre || "Pour",
        loi.experts.pour.map(function (a) {
          return { titre: a.nom + " \u2014 " + a.role, meta: a.affiliation, texte: a.argument, url: a.url };
        }),
        "pour"
      ) +
      bord(
        "contre",
        loi.experts.contre_titre || "Contre",
        loi.experts.contre.map(function (a) {
          return { titre: a.nom + " \u2014 " + a.role, meta: a.affiliation, texte: a.argument, url: a.url };
        }),
        "contre"
      ) +
      '<p class="mono">' + esc(loi.experts.note) + "</p>" +
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
      '<div class="ecran__entete">' +
      '<span class="theme">Votre vote final</span>' +
      '<h2 class="ecran__titre">Le résultat</h2>' +
      (texte ? '<p class="ecran__chapeau">' + esc(texte) + "</p>" : "") +
      "</div>" +
      '<div class="chiffres">' +
      '<div class="chiffre"><span class="chiffre__valeur">' + s.pour + '</span><span class="chiffre__libelle">Pour</span></div>' +
      '<div class="chiffre"><span class="chiffre__valeur">' + s.contre + '</span><span class="chiffre__libelle">Contre</span></div>' +
      '<div class="chiffre"><span class="chiffre__valeur">' + s.abstention + '</span><span class="chiffre__libelle">Abstentions</span></div>' +
      "</div>" +
      (v && v.v2
        ? '<p class="petit">Votre vote : ' + esc(v.v2) + ". Il reste sur cet appareil." + "</p>"
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
      '<div class="ecran__entete">' +
      '<span class="theme">Le vote</span>' +
      '<h2 class="ecran__titre">Le scrutin</h2>' +
      "</div>" +
      '<div class="bascule" role="group" aria-label="Lecture de la carte">' +
      '<button type="button" data-action="mode-carte" data-mode="groupe" aria-pressed="' + (mode === "groupe") + '">Par groupe</button>' +
      '<button type="button" data-action="mode-carte" data-mode="accord" aria-pressed="' + (mode === "accord") + '">Avec vous</button>' +
      "</div>" +
      '<div class="carte-sieges">' + svg + "</div>" +
      (mode === "groupe"
        ? '<div class="legende">' +
          groupes
            .map(function (g) {
              return (
                '<span class="legende__item"><span class="legende__pastille" style="background:' +
                g.couleur_sombre + '"></span>' +
                esc(g.id === "vides" ? "Non occupés" : g.id) + "</span>"
              );
            })
            .join("") +
          "</div>"
        : '<div class="pile">' +
          '<p class="compteur">' + commeMoi + " sièges ont voté comme vous.</p>" +
          '<p class="mono">Votre vote reste sur cet appareil.</p>' +
          "</div>") +
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
    if (p.quiz) n++;
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
        '<h2 class="ecran__titre">L\u2019arbre</h2>' +
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
      '<h2 class="ecran__titre">L\u2019arbre</h2>' +
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
      '<h2 class="ecran__titre">Comment ce devoir est fabriqué</h2>' +
      "</div>" +
      '<div class="pile">' +
      '<p class="petit">Les phrases des extraits sont copiées du texte, sans reformulation. Les arguments pour et contre sont reformulés en clair à partir des exposés sommaires, avec leur source ; les citations exactes sont dans « Les voix citées ». Les chiffres viennent du scrutin. Les titres de presse sont repris tels quels. Quand une information manque, l\u2019application écrit « non documenté ».</p>' +
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
      '<p class="mention-independance">Projet indépendant, non affilié à l\u2019Assemblée nationale ni au Sénat.</p>' +
      "</main>" +
      navbas("#/methode")
    );
  }

  function ecranArchive() {
    return (
      masthead() +
      '<main class="ecran">' +
      '<div class="ecran__entete">' +
      '<span class="theme">Archive</span>' +
      '<h2 class="ecran__titre">Les devoirs</h2>' +
      "</div>" +
      vide(
        "1 loi publiée",
        "Une seule loi est publiée dans cette version. Le devoir du jour est ouvert.",
        '<a class="bouton bouton--secondaire" href="#/devoir/' + etat.loi.id + '">Ouvrir le devoir</a>'
      ) +
      '<a class="bouton bouton--discret" href="#/recherche">Chercher un devoir</a>' +
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
      '<h2 class="ecran__titre">Chercher un devoir</h2>' +
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
    app.innerHTML = html;
    if (!memoire.intro) app.innerHTML += surcoucheIntro();
    app.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  function route() {
    var h = (location.hash || "#/").replace(/^#\/?/, "");
    var p = h.split("/").filter(Boolean);

    if (!etat.pret) {
      rendre(masthead() + '<main class="ecran"><p class="petit">Chargement…</p></main>');
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
      if (sous === "fait") return rendre(ecranFait(loi));
      if (sous === "texte") return rendre(ecranTexte(loi));
      if (sous === "article") return rendre(ecranArticle(loi));
      if (sous === "chiffres") return rendre(ecranChiffres(loi));
      if (sous === "arguments") return rendre(ecranArguments(loi));
      if (sous === "presse") return rendre(ecranPresse(loi));
      if (sous === "experts") return rendre(ecranExperts(loi));
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
    if (final) {
      location.hash = "#/devoir/" + loi.id + "/resultat";
    } else {
      location.hash = "#/devoir/" + loi.id + "/fait";
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

    if (action === "quiz") {
      var qi = Number(el.getAttribute("data-quiz"));
      var oi = Number(el.getAttribute("data-option"));
      var q = etat.loi.quiz[qi];
      var deja = reponsesDe(etat.loi.id);
      if (deja[qi] != null) return;
      deja[qi] = oi;
      sauver();
      var bloc = el.closest("[data-quiz='" + qi + "']");
      if (bloc) {
        bloc.querySelectorAll(".quiz__option").forEach(function (b) {
          b.disabled = true;
          var j = Number(b.getAttribute("data-option"));
          if (j === q.bonne) b.setAttribute("data-etat", "juste");
          else if (j === oi) b.setAttribute("data-etat", "faux");
        });
        var src = bloc.querySelector("[data-source]");
        if (src) src.hidden = false;
      }
      marquer(etat.loi.id, "quiz");
      return;
    }
  });

  /* Le passage par les arguments vaut lecture du camp opposé. */
  window.addEventListener("hashchange", function () {
    if (etat.pret && /\/arguments/.test(location.hash)) {
      marquer(etat.loi.id, "oppose");
    }
    route();
  });

  /* Clavier : flèches sur l'écran de vote, indépendamment du rendu. */
  document.addEventListener("keydown", function (e) {
    if (!etat.pret) return;
    if (!document.getElementById("carte-vote")) return;
    if (e.key === "ArrowRight") voter("pour");
    else if (e.key === "ArrowLeft") voter("contre");
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") voter("abstention");
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
