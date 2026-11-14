/* Quorum — hémicycle en SVG, sans dépendance.
   Entrée : groupes dans l'ordre de placement, gauche vers droite, chacun avec
   son effectif ; et le décompte du scrutin par groupe.
   Sortie : un SVG de 220 × 122 unités, largeur fluide.

   Placement : des rangées concentriques, du centre vers l'extérieur. Chaque
   rangée reçoit sa part de chaque groupe au prorata de ce qu'il lui reste à
   placer, ce qui donne des frontières radiales nettes et des effectifs exacts.

   Deux lectures :
   - "groupe" : chaque siège prend la couleur de son groupe ;
   - "accord" : chaque siège prend la couleur de son vote réel, et l'opacité
     sépare ceux qui ont voté comme l'utilisateur de ceux qui ont voté autrement. */

(function () {
  "use strict";

  var RANGEES = 16;
  var RAYON_MIN = 24;
  var RAYON_MAX = 100;
  var ECART_GROUPE = 2.4;
  var CX = 110;
  var CY = 108;
  var LARGEUR = 220;
  var HAUTEUR = 118;

  var COULEUR_POUR = "#4e9a72";
  var COULEUR_CONTRE = "#cf6357";
  var COULEUR_ABSTENTION = "#a39c8c";
  var COULEUR_NON_VOTANT = "#5a5049";

  /* Répartit un total sur les rangées, au prorata du rayon. */
  function repartir(total, rayons) {
    var somme = rayons.reduce(function (a, b) {
      return a + b;
    }, 0);
    var counts = rayons.map(function (r) {
      return Math.max(3, Math.round((total * r) / somme));
    });
    var diff = total - counts.reduce(function (a, b) {
      return a + b;
    }, 0);
    var i = counts.length - 1;
    var garde = 0;
    while (diff !== 0 && garde < 10000) {
      garde++;
      var pas = diff > 0 ? 1 : -1;
      if (counts[i] + pas >= 3) {
        counts[i] += pas;
        diff -= pas;
      }
      i = i === 0 ? counts.length - 1 : i - 1;
    }
    return counts;
  }

  /* Répartit n sièges d'une rangée entre les groupes, selon ce qu'il leur
     reste à placer. Méthode du plus fort reste. */
  function allouer(restants, n) {
    var totalRestant = restants.reduce(function (a, b) {
      return a + b;
    }, 0);
    var alloc = restants.map(function (v) {
      return totalRestant > 0 ? Math.floor((v * n) / totalRestant) : 0;
    });
    var place = alloc.reduce(function (a, b) {
      return a + b;
    }, 0);
    var manque = n - place;

    var ordre = restants
      .map(function (v, i) {
        var brut = totalRestant > 0 ? (v * n) / totalRestant : 0;
        return { i: i, reste: brut - Math.floor(brut) };
      })
      .sort(function (a, b) {
        return b.reste - a.reste;
      });

    var k = 0;
    var garde = 0;
    while (manque > 0 && garde < 10000) {
      garde++;
      var cible = ordre[k % ordre.length].i;
      if (alloc[cible] < restants[cible]) {
        alloc[cible] += 1;
        manque -= 1;
      }
      k++;
      if (k > ordre.length * 40) break;
    }

    /* Retrait de ce qui a été placé, en respectant les restants. */
    var posés = alloc.reduce(function (a, b) {
      return a + b;
    }, 0);
    while (posés < n) {
      var choisi = -1;
      for (var j = 0; j < restants.length; j++) {
        if (alloc[j] < restants[j] && (choisi === -1 || restants[j] - alloc[j] > restants[choisi] - alloc[choisi])) {
          choisi = j;
        }
      }
      if (choisi === -1) break;
      alloc[choisi] += 1;
      posés += 1;
    }

    return alloc;
  }

  function construire(groupes) {
    var total = groupes.reduce(function (s, g) {
      return s + g.sieges;
    }, 0);

    var rayons = [];
    for (var i = 0; i < RANGEES; i++) {
      rayons.push(RAYON_MIN + ((RAYON_MAX - RAYON_MIN) * i) / (RANGEES - 1));
    }
    var counts = repartir(total, rayons);
    var restants = groupes.map(function (g) {
      return g.sieges;
    });

    var sieges = [];

    counts.forEach(function (count, ri) {
      var alloc = allouer(restants, count);
      restants = restants.map(function (v, i) {
        return v - alloc[i];
      });

      /* suite des groupes dans la rangée, de gauche à droite */
      var suite = [];
      alloc.forEach(function (n, gi) {
        for (var q = 0; q < n; q++) suite.push(gi);
      });

      var frontieres = 0;
      for (var j = 1; j < suite.length; j++) if (suite[j] !== suite[j - 1]) frontieres++;

      var r = rayons[ri];
      var arc = Math.PI * r;
      var pas = (arc - ECART_GROUPE * frontieres) / suite.length;
      var pos = 0;

      /* bornes de chaque groupe dans la rangée, pour situer le vote */
      var debut = {};
      var longueur = {};
      for (var k = 0; k < suite.length; k++) {
        if (debut[suite[k]] === undefined) debut[suite[k]] = k;
        longueur[suite[k]] = (longueur[suite[k]] || 0) + 1;
      }

      for (var m = 0; m < suite.length; m++) {
        if (m > 0 && suite[m] !== suite[m - 1]) pos += ECART_GROUPE;
        var centre = pos + pas / 2;
        var angle = Math.PI - centre / r;
        var gi = suite[m];
        var u = longueur[gi] > 1 ? (m - debut[gi]) / (longueur[gi] - 1) : 0.5;

        sieges.push({
          x: CX + r * Math.cos(angle),
          y: CY - r * Math.sin(angle),
          r: Math.min(pas * 0.36, 2.6),
          groupe: gi,
          u: u,
          rangee: ri
        });
        pos += pas;
      }
    });

    return { sieges: sieges, largeur: LARGEUR, hauteur: HAUTEUR };
  }

  function voteDuSiege(decompte, u) {
    if (!decompte) return "inconnu";
    var total = decompte.pour + decompte.contre + decompte.abstention + (decompte.non_votants || 0);
    if (!total) return "inconnu";
    var a = decompte.pour / total;
    var b = a + decompte.contre / total;
    var c = b + decompte.abstention / total;
    if (u < a) return "pour";
    if (u < b) return "contre";
    if (u < c) return "abstention";
    return "non_votant";
  }

  function couleurVote(v) {
    if (v === "pour") return COULEUR_POUR;
    if (v === "contre") return COULEUR_CONTRE;
    if (v === "abstention") return COULEUR_ABSTENTION;
    return COULEUR_NON_VOTANT;
  }

  function svg(groupes, mode, options) {
    var opts = options || {};
    var d = construire(groupes);
    var decomptes = opts.decomptes || {};
    var choix = opts.choix || null;
    var parts = [];

    d.sieges.forEach(function (s) {
      var g = groupes[s.groupe];
      var couleur;
      var opacite = 1;

      if (mode === "accord" && choix) {
        var v = voteDuSiege(decomptes[g.id], s.u);
        couleur = couleurVote(v);
        opacite = v === choix ? 1 : 0.12;
      } else if (mode === "vote") {
        couleur = couleurVote(voteDuSiege(decomptes[g.id], s.u));
      } else {
        couleur = g.couleur_sombre;
      }

      parts.push(
        '<circle cx="' + s.x.toFixed(2) + '" cy="' + s.y.toFixed(2) + '" r="' +
          s.r.toFixed(2) + '" fill="' + couleur + '"' +
          (opacite !== 1 ? ' opacity="' + opacite + '"' : "") + "/>"
      );
    });

    var totalSieges = groupes.reduce(function (s, g) {
      return s + g.sieges;
    }, 0);
    var libelle =
      mode === "accord" && choix
        ? "Sièges ayant voté " + choix
        : "Hémicycle, " + totalSieges + " sièges";

    return (
      '<svg viewBox="0 0 ' + d.largeur + " " + d.hauteur + '" role="img" aria-label="' +
      libelle + '">' + parts.join("") + "</svg>"
    );
  }

  function combienCommeMoi(groupes, decomptes, choix) {
    if (!choix) return 0;
    return groupes.reduce(function (acc, g) {
      var d = decomptes[g.id];
      return acc + (d && d[choix] ? d[choix] : 0);
    }, 0);
  }

  window.QuorumHemicycle = {
    construire: construire,
    svg: svg,
    combienCommeMoi: combienCommeMoi
  };
})();
