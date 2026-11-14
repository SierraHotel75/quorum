/* Quorum — plan du jour.
   Page de pilotage : elle lit data/plan.json, garde les cases cochées dans
   localStorage et se met à jour à l'horloge. Aucune requête réseau hors le
   fichier de plan. */

(function () {
  "use strict";

  var CLE = "quorum.plan.v1";
  var racine = document.getElementById("wp");

  var plan = null;
  var etat = { taches: {} };
  var masquerFaits = false;

  /* ---------- Mémoire ---------- */

  function chargerEtat() {
    try {
      var brut = localStorage.getItem(CLE);
      if (!brut) return { taches: {} };
      var o = JSON.parse(brut);
      if (!o || typeof o !== "object" || typeof o.taches !== "object" || !o.taches) {
        return { taches: {} };
      }
      return o;
    } catch (e) {
      return { taches: {} };
    }
  }

  function sauver() {
    try {
      localStorage.setItem(CLE, JSON.stringify(etat));
    } catch (e) {
      /* stockage plein ou bloqué : la page reste utilisable */
    }
  }

  /* ---------- Temps ---------- */

  function minutes(hhmm) {
    var p = String(hhmm).split(":");
    return Number(p[0]) * 60 + Number(p[1]);
  }

  function heure(m) {
    var h = Math.floor(m / 60);
    var mn = m % 60;
    return (h < 10 ? "0" : "") + h + ":" + (mn < 10 ? "0" : "") + mn;
  }

  function maintenant() {
    var d = new Date();
    return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
  }

  function duree(m) {
    if (m < 0) return "0 min";
    var h = Math.floor(m / 60);
    var mn = Math.round(m % 60);
    if (h && mn) return h + " h " + (mn < 10 ? "0" : "") + mn;
    if (h) return h + " h";
    return mn + " min";
  }

  /* ---------- Modèle ---------- */

  function tachesDe(lot) {
    return lot.taches;
  }

  function faitesDe(lot) {
    return lot.taches.filter(function (t) {
      return etat.taches[lot.code + ":" + t.id] === true;
    }).length;
  }

  function termine(lot) {
    return faitesDe(lot) === lot.taches.length;
  }

  function etatDe(lot, now) {
    if (termine(lot)) return "fait";
    if (now > minutes(lot.fin)) return "retard";
    if (now >= minutes(lot.debut)) return "encours";
    return "avenir";
  }

  function global() {
    var total = 0;
    var faites = 0;
    plan.lots.forEach(function (lot) {
      total += lot.taches.length;
      faites += faitesDe(lot);
    });
    return { total: total, faites: faites };
  }

  /* ---------- Rendu ---------- */

  function echapper(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function ruban() {
    var d = minutes(plan.debut);
    var f = minutes(plan.fin);
    var largeur = f - d;
    return plan.lots
      .map(function (lot) {
        var debut = minutes(lot.debut);
        var fin = minutes(lot.fin);
        var gauche = ((debut - d) / largeur) * 100;
        var pour = ((fin - debut) / largeur) * 100;
        return (
          '<button class="ruban__seg" type="button" data-cible="' +
          echapper(lot.code) +
          '" style="left:' +
          gauche.toFixed(3) +
          "%;width:" +
          pour.toFixed(3) +
          '%" title="' +
          echapper(lot.code + " · " + lot.titre + " · " + lot.debut + "–" + lot.fin) +
          '">' +
          echapper(lot.code) +
          "</button>"
        );
      })
      .join("");
  }

  function carte(lot) {
    var faites = faitesDe(lot);
    var pour = Math.round((faites / lot.taches.length) * 100);
    return (
      '<article class="lot" data-code="' +
      echapper(lot.code) +
      '" data-etat="avenir">' +
      '<header class="lot__tete">' +
      '<span class="lot__code">' +
      echapper(lot.code) +
      "</span>" +
      '<span class="lot__etat" data-role="etat">à venir</span>' +
      "</header>" +
      '<h2 class="lot__titre">' +
      echapper(lot.titre) +
      "</h2>" +
      '<p class="lot__meta">' +
      "<span>" +
      echapper(lot.debut + " – " + lot.fin) +
      "</span>" +
      "<span>" +
      echapper(lot.qui) +
      "</span>" +
      (lot.bloque ? "<span>⚠ " + echapper(lot.bloque) + "</span>" : "") +
      "</p>" +
      '<p class="lot__sortie">' +
      echapper(lot.sortie) +
      "</p>" +
      '<div class="lot__jauge"><span data-role="jauge" style="width:' +
      pour +
      '%"></span></div>' +
      '<ul class="taches">' +
      lot.taches
        .map(function (t) {
          var id = lot.code + ":" + t.id;
          var fait = etat.taches[id] === true;
          return (
            '<li class="tache" data-fait="' +
            fait +
            '">' +
            '<label><input type="checkbox" data-id="' +
            echapper(id) +
            '"' +
            (fait ? " checked" : "") +
            " />" +
            '<span class="tache__num">' +
            echapper(t.id) +
            "</span>" +
            '<span class="tache__nom">' +
            echapper(t.nom) +
            "</span>" +
            "</label>" +
            "</li>"
          );
        })
        .join("") +
      "</ul>" +
      '<div class="lot__pied"><span data-role="compte">' +
      faites +
      "/" +
      lot.taches.length +
      " tâches</span><span>" +
      pour +
      " %</span></div>" +
      "</article>"
    );
  }

  function rendre() {
    racine.innerHTML =
      '<header class="entete">' +
      '<div class="entete__ligne">' +
      '<h1 class="entete__titre">' +
      echapper(plan.titre) +
      "</h1>" +
      '<span class="horloge" id="horloge">--:--</span>' +
      "</div>" +
      '<p class="entete__sous" id="sous"></p>' +
      '<div class="jauge-globale">' +
      '<div class="jauge-globale__rail"><div class="jauge-globale__part" id="jauge-part" style="width:0%"></div></div>' +
      '<span class="jauge-globale__valeur" id="jauge-valeur">0 %</span>' +
      "</div>" +
      '<div class="ruban" id="ruban">' +
      ruban() +
      '<div class="ruban__curseur" id="curseur" hidden></div>' +
      "</div>" +
      '<div class="ruban__heures"><span>' +
      echapper(plan.debut) +
      "</span><span>" +
      echapper(plan.fin) +
      "</span></div>" +
      "</header>" +
      '<section class="prochaine" id="prochaine" aria-live="polite"></section>' +
      '<div class="actions">' +
      '<button class="bouton-plan" type="button" id="basculer-faits" aria-pressed="false">Masquer les lots terminés</button>' +
      '<button class="bouton-plan bouton-plan--danger" type="button" id="reinit">Réinitialiser</button>' +
      "</div>" +
      '<main class="lots" id="lots">' +
      plan.lots.map(carte).join("") +
      "</main>" +
      '<footer class="pied-plan">' +
      "<span>Plan du " +
      echapper(plan.jour) +
      " · " +
      echapper(plan.debut + " → " + plan.fin) +
      "</span>" +
      "<span>Les cases restent dans ce navigateur. Rien n'est envoyé.</span>" +
      "</footer>";

    majGlobal();
    rafraichir();
  }

  function brancher() {
    racine.addEventListener("change", function (e) {
      var c = e.target;
      if (!c.matches || !c.matches('input[type="checkbox"][data-id]')) return;
      var id = c.getAttribute("data-id");
      if (c.checked) etat.taches[id] = true;
      else delete etat.taches[id];
      sauver();

      var li = c.closest(".tache");
      if (li) li.setAttribute("data-fait", String(c.checked));

      var art = c.closest(".lot");
      if (art) {
        var lot = plan.lots.filter(function (l) {
          return l.code === art.getAttribute("data-code");
        })[0];
        if (lot) majCarte(art, lot);
      }
      majGlobal();
      majProchaine();
    });

    racine.addEventListener("click", function (e) {
      var seg = e.target.closest("[data-cible]");
      if (seg) {
        var cible = racine.querySelector('.lot[data-code="' + seg.getAttribute("data-cible") + '"]');
        if (cible) {
          cible.hidden = false;
          cible.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        return;
      }

      if (e.target.id === "reinit") {
        if (!window.confirm("Décocher toutes les tâches ?")) return;
        etat = { taches: {} };
        masquerFaits = false;
        sauver();
        rendre();
        return;
      }

      if (e.target.id === "basculer-faits") {
        masquerFaits = !masquerFaits;
        e.target.setAttribute("aria-pressed", String(masquerFaits));
        e.target.textContent = masquerFaits
          ? "Afficher tous les lots"
          : "Masquer les lots terminés";
        appliquerFiltre();
      }
    });
  }

  function majCarte(art, lot) {
    var faites = faitesDe(lot);
    var pour = Math.round((faites / lot.taches.length) * 100);
    var jauge = art.querySelector('[data-role="jauge"]');
    if (jauge) jauge.style.width = pour + "%";
    var compte = art.querySelector('[data-role="compte"]');
    if (compte) compte.textContent = faites + "/" + lot.taches.length + " tâches";
    var pied = compte && compte.parentElement ? compte.parentElement.lastElementChild : null;
    if (pied) pied.textContent = pour + " %";
  }

  function appliquerFiltre() {
    plan.lots.forEach(function (lot) {
      var art = racine.querySelector('.lot[data-code="' + lot.code + '"]');
      if (!art) return;
      art.hidden = masquerFaits && termine(lot);
    });
  }

  function majGlobal() {
    var g = global();
    var pour = g.total ? Math.round((g.faites / g.total) * 100) : 0;
    var part = document.getElementById("jauge-part");
    var valeur = document.getElementById("jauge-valeur");
    if (part) part.style.width = pour + "%";
    if (valeur) valeur.textContent = pour + " %";
    appliquerFiltre();
  }

  function majProchaine() {
    var bloc = document.getElementById("prochaine");
    if (!bloc) return;

    var restant = plan.lots.filter(function (l) {
      return !termine(l);
    });

    if (!restant.length) {
      bloc.innerHTML =
        '<span class="prochaine__label">Terminé</span>' +
        '<span class="prochaine__texte">Tous les lots sont cochés.</span>' +
        '<span class="prochaine__meta">Il reste à ne rien casser.</span>';
      return;
    }

    var lot = restant[0];
    var tache = lot.taches.filter(function (t) {
      return etat.taches[lot.code + ":" + t.id] !== true;
    })[0];
    var now = maintenant();
    var quand;
    if (now < minutes(lot.debut)) quand = "dans " + duree(minutes(lot.debut) - now);
    else if (now > minutes(lot.fin)) quand = "en retard de " + duree(now - minutes(lot.fin));
    else quand = lot.debut + " – " + lot.fin;

    bloc.innerHTML =
      '<span class="prochaine__label">Prochaine action</span>' +
      '<span class="prochaine__texte">' +
      echapper(lot.code + " · " + tache.id + " — " + tache.nom) +
      "</span>" +
      '<span class="prochaine__meta">' +
      echapper(lot.titre + " · " + quand + " · " + lot.qui) +
      "</span>";
  }

  /* ---------- Horloge ---------- */

  function rafraichir() {
    var now = maintenant();
    var d = minutes(plan.debut);
    var f = minutes(plan.fin);

    var horloge = document.getElementById("horloge");
    if (horloge) horloge.textContent = heure(Math.floor(now));

    var sous = document.getElementById("sous");
    if (sous) {
      var restant = f - now;
      var texteRestant;
      if (restant > 0) texteRestant = "il reste <b>" + duree(restant) + "</b>";
      else texteRestant = "fenêtre dépassée de <b>" + duree(-restant) + "</b>";
      var avance = now < d ? "départ dans <b>" + duree(d - now) + "</b>" : texteRestant;
      sous.innerHTML =
        "<span>" +
        plan.lots.length +
        " lots</span><span>" +
        echapper(plan.debut) +
        " → " +
        echapper(plan.fin) +
        "</span><span>" +
        avance +
        "</span>";
    }

    plan.lots.forEach(function (lot) {
      var art = racine.querySelector('.lot[data-code="' + lot.code + '"]');
      if (!art) return;
      var e = etatDe(lot, now);
      art.setAttribute("data-etat", e);
      var etiquette = art.querySelector('[data-role="etat"]');
      if (etiquette) {
        etiquette.textContent =
          e === "fait" ? "terminé" : e === "encours" ? "en cours" : e === "retard" ? "en retard" : "à venir";
      }

      var seg = racine.querySelector('.ruban__seg[data-cible="' + lot.code + '"]');
      if (seg) seg.setAttribute("data-etat", e);
    });

    var curseur = document.getElementById("curseur");
    if (curseur) {
      if (now >= d && now <= f) {
        curseur.hidden = false;
        curseur.style.left = (((now - d) / (f - d)) * 100).toFixed(4) + "%";
      } else {
        curseur.hidden = true;
      }
    }

    majProchaine();
  }

  /* ---------- Démarrage ---------- */

  etat = chargerEtat();

  fetch("data/plan.json")
    .then(function (r) {
      if (!r.ok) throw new Error("plan.json");
      return r.json();
    })
    .then(function (p) {
      plan = p;
      brancher();
      rendre();
      window.setInterval(rafraichir, 1000);
    })
    .catch(function () {
      racine.innerHTML =
        '<p class="mono">Le plan n\u2019a pas pu être chargé. Ouvrez cette page depuis le serveur local, pas depuis un fichier.</p>';
    });
})();
