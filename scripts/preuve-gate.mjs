#!/usr/bin/env node
/* Quorum — preuve que le passage de contrôles accepte un fichier complet,
   et qu'il refuse les mêmes données dès qu'un chiffre ou un média change.

   Le fichier de test est fabriqué dans le dossier temporaire, jamais dans
   data/lois : rien de faux ne doit traîner dans le dossier publié.

   Usage : node scripts/preuve-gate.mjs
   Code de sortie 0 si les douze attentes sont tenues. */

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VERIFIER = join(RACINE, "scripts", "verifier.mjs");
const DEMO = join(RACINE, "data", "lois", "_demo.json");

const RAPPORT = "https://www.assemblee-nationale.fr/dyn/17/rapports/exemple";
const SEANCE = "https://www.assemblee-nationale.fr/dyn/17/comptes-rendus/exemple";
const SEANCE_REF = "CRSANR5L17S2026E1N099";
const SEANCE_URL = "https://www.assemblee-nationale.fr/dyn/17/comptes-rendus/seance/CRSANR5L17S2026E1N099";
const CITATION_POUR = "Le plafonnement agit surtout sur les nouveaux contrats, pas sur les baux en cours.";
const CITATION_CONTRE = "Le contrôle du dispositif supposera des moyens que les services n'ont pas aujourd'hui.";
const CITATION_CHIFFRE = "Le plafonnement s'applique à 12 % des logements concernés, selon le rapport.";

function fichierComplet() {
  const loi = JSON.parse(readFileSync(DEMO, "utf8"));
  delete loi.demo;
  delete loi.arguments;
  delete loi.experts;

  loi.titre = "Encadrement des loyers dans les zones tendues";
  loi.resume =
    "Le texte plafonne le loyer des nouveaux contrats dans les zones tendues et fixe une date d'entrée en vigueur.";
  loi.nb_phrases = 3;

  loi.source = {
    nom: "Assemblée nationale",
    url: "https://www.assemblee-nationale.fr/dyn/17/scrutins",
    texte_url: "https://www.assemblee-nationale.fr/dyn/17/textes/exemple",
    licence: "Licence Ouverte 2.0",
    consulte_le: "2026-11-14"
  };
  loi.scrutin.id = "demo-0000";

  const extraits = [
    {
      tag: "adopte",
      texte: "Le loyer est encadré dans les zones tendues et pour les logements concernés.",
      article: "Article 1",
      alinea: "alinéa 1"
    },
    {
      tag: "adopte",
      texte: "Le nouveau plafond de loyer s'applique aux contrats conclus après l'entrée en vigueur.",
      article: "Article 2",
      alinea: "alinéa 1"
    },
    {
      tag: "adopte",
      texte: "Le dispositif s'applique aux baux d'habitation signés à compter du 1er janvier 2027.",
      article: "Article 3",
      alinea: null
    }
  ];
  loi.extraits = extraits;
  delete loi.article;
  loi.articles = extraits.map((e) => ({
    reference: e.article,
    paragraphes: [e.texte]
  }));

  loi.ce_qui_est_vote = {
    titre: "Contenu de l'article",
    texte: "Le plafonnement des loyers s'applique aux nouveaux contrats dans les zones tendues."
  };

  loi.presse = {
    pour: [
      {
        media: "Le Monde",
        date: "2026-03-13",
        titre: "Le plafonnement des loyers franchit une étape",
        url: "https://www.lemonde.fr/politique/article/2026/03/13/exemple.html"
      },
      {
        media: "Le Monde",
        date: "2026-03-14",
        titre: "Ce que change le texte pour les locataires",
        url: "https://www.lemonde.fr/immobilier/article/2026/03/14/exemple.html"
      }
    ],
    contre: [
      {
        media: "Le Monde",
        date: "2026-03-13",
        titre: "Les bailleurs s'inquiètent du calendrier",
        url: "https://www.lemonde.fr/immobilier/article/2026/03/13/exemple-2.html"
      },
      {
        media: "Le Monde",
        date: "2026-03-15",
        titre: "Un dispositif jugé difficile à contrôler",
        url: "https://www.lemonde.fr/societe/article/2026/03/15/exemple.html"
      }
    ]
  };

  const fiche = {
    nom: "Camille Perrin",
    role: "Économiste du logement",
    affiliation: "Centre de recherche sur le logement",
    url: "https://www.vie-publique.fr/rapport/1-exemple"
  };

  loi.meta = {
    genere_le: "2026-11-14",
    gate: "5",
    modele: "génération hors ligne",
    controles: [
      { nom: "Schéma du fichier", etat: "ok" },
      { nom: "Chiffres cohérents avec le scrutin", etat: "ok" },
      { nom: "Sièges attribués = 577", etat: "ok" },
      { nom: "Extraits verbatim", etat: "ok" },
      { nom: "Symétrie des bords", etat: "ok" },
      { nom: "Sources des médias", etat: "ok" },
      { nom: "Ressources citées vérifiées", etat: "ok" },
      { nom: "Variante contrôlée", etat: "ok" },
      { nom: "Débat cité", etat: "ok" },
      { nom: "Chiffres vérifiés", etat: "ok" }
    ]
  };

  const debat = (citation) => ({
    nom: fiche.nom,
    role: fiche.role,
    affiliation: fiche.affiliation,
    citation,
    seance: SEANCE_REF,
    date: "2026-03-12",
    url: SEANCE_URL
  });
  loi.debat = {
    pour: [debat(CITATION_POUR)],
    contre: [debat(CITATION_CONTRE)]
  };

  loi.verifications = {
    chiffres: [
      {
        affirmation: "12 % des logements concernés.",
        chiffre: "12 %",
        auteur: fiche.nom,
        role: fiche.role,
        citation: CITATION_CHIFFRE,
        seance: SEANCE_REF,
        date: "2026-03-12",
        url: SEANCE_URL,
        verdict: "confirmé",
        explication:
          "Le rapport de la commission retient ce taux pour les zones tendues, sur le parc locatif privé. Le chiffre est repris tel quel, sans extrapolation.",
        sources: [{ nom: "Rapport de la commission", url: RAPPORT }]
      }
    ]
  };

  const verbatim = {
    verifie_le: "2026-11-14",
    seances: {
      [SEANCE_REF]: { date: "2026-03-12", url: SEANCE_URL }
    },
    citations: [
      { seance: SEANCE_REF, auteur: fiche.nom, texte: CITATION_POUR },
      { seance: SEANCE_REF, auteur: fiche.nom, texte: CITATION_CONTRE },
      { seance: SEANCE_REF, auteur: fiche.nom, texte: CITATION_CHIFFRE }
    ]
  };

  return { loi, fiche, verbatim };
}

function lancer(fichier, dossier) {
  const r = spawnSync(process.execPath, [VERIFIER, fichier], {
    cwd: RACINE,
    encoding: "utf8",
    env: {
      ...process.env,
      QUORUM_MEDIAS: join(dossier, "medias.json"),
      QUORUM_EXPERTS: join(dossier, "experts.json"),
      QUORUM_VERBATIM: join(dossier, "verbatim.json")
    }
  });
  return { code: r.status, sortie: (r.stdout || "") + (r.stderr || "") };
}

const dossier = mkdtempSync(join(tmpdir(), "quorum-gate-"));
const resultats = [];

try {
  const { loi, fiche, verbatim } = fichierComplet();

  writeFileSync(
    join(dossier, "medias.json"),
    JSON.stringify(
      {
        verifie_le: "2026-11-14",
        domaines: ["lemonde.fr"],
        medias: [
          { nom: "Le Monde", domaine: "lemonde.fr", flux: "https://www.lemonde.fr/rss/une.xml" }
        ]
      },
      null,
      2
    ),
    "utf8"
  );
  writeFileSync(
    join(dossier, "experts.json"),
    JSON.stringify({ verifie_le: "2026-11-14", experts: [fiche] }, null, 2),
    "utf8"
  );
  writeFileSync(join(dossier, "verbatim.json"), JSON.stringify(verbatim, null, 2), "utf8");

  const complet = join(dossier, "complet.json");
  writeFileSync(complet, JSON.stringify(loi, null, 2), "utf8");

  const cas1 = lancer(complet, dossier);
  resultats.push({
    nom: "fichier complet accepté",
    attendu: "code 0 et publication autorisée",
    tenu: cas1.code === 0 && /Publication autorisée/.test(cas1.sortie),
    sortie: cas1.sortie
  });

  const faux = JSON.parse(JSON.stringify(loi));
  faux.scrutin.pour += 1;
  const fausse = join(dossier, "faux-chiffre.json");
  writeFileSync(fausse, JSON.stringify(faux, null, 2), "utf8");
  const cas2 = lancer(fausse, dossier);
  resultats.push({
    nom: "un siège de trop refusé",
    attendu: "code 1 et contrôle WP1.2",
    tenu: cas2.code === 1 && /WP1\.2/.test(cas2.sortie),
    sortie: cas2.sortie
  });

  const vide = JSON.parse(JSON.stringify(loi));
  vide.sieges_vides = 1;
  const fausseVide = join(dossier, "faux-siege-vide.json");
  writeFileSync(fausseVide, JSON.stringify(vide, null, 2), "utf8");
  const casVide = lancer(fausseVide, dossier);
  resultats.push({
    nom: "un siège vide non déclaré refusé",
    attendu: "code 1 et contrôle WP1.2",
    tenu: casVide.code === 1 && /WP1\.2/.test(casVide.sortie),
    sortie: casVide.sortie
  });

  const groupe = JSON.parse(JSON.stringify(loi));
  groupe.votes_par_groupe[0].sieges += 1;
  const fauxGroupe = join(dossier, "faux-siege-groupe.json");
  writeFileSync(fauxGroupe, JSON.stringify(groupe, null, 2), "utf8");
  const casGroupe = lancer(fauxGroupe, dossier);
  resultats.push({
    nom: "un siège de groupe inventé refusé",
    attendu: "code 1 et contrôle WP1.2",
    tenu: casGroupe.code === 1 && /WP1\.2/.test(casGroupe.sortie),
    sortie: casGroupe.sortie
  });

  const inconnu = JSON.parse(JSON.stringify(loi));
  inconnu.presse.pour[0].media = "Le Matin de Lyon";  const mediaInconnu = join(dossier, "faux-media.json");
  writeFileSync(mediaInconnu, JSON.stringify(inconnu, null, 2), "utf8");
  const cas3 = lancer(mediaInconnu, dossier);
  resultats.push({
    nom: "média hors liste refusé",
    attendu: "code 1 et média hors liste",
    tenu: cas3.code === 1 && /média hors liste/.test(cas3.sortie),
    sortie: cas3.sortie
  });

  /* WP1.7 — la clause révélée doit figurer mot pour mot dans son texte source. */
  const horsSource = JSON.parse(JSON.stringify(loi));
  horsSource.variante.avant =
    "Le bailleur peut, sans décision spéciale, supprimer la révision annuelle du loyer.";
  const fauxHorsSource = join(dossier, "faux-variante-hors-source.json");
  writeFileSync(fauxHorsSource, JSON.stringify(horsSource, null, 2), "utf8");
  const casVarianteSource = lancer(fauxHorsSource, dossier);
  resultats.push({
    nom: "variante absente de son texte source refusée",
    attendu: "code 1 et contrôle WP1.7",
    tenu: casVarianteSource.code === 1 && /clause absente du texte source/.test(casVarianteSource.sortie),
    sortie: casVarianteSource.sortie
  });

  /* WP1.7 — une clause encore dans le texte adopté n'a pas été supprimée. */
  const encoreAdoptee = JSON.parse(JSON.stringify(loi));
  const clauseAdoptee = encoreAdoptee.articles[0].paragraphes[0];
  encoreAdoptee.variante.avant = clauseAdoptee;
  encoreAdoptee.variante.texte_source = `Article 1 — ${clauseAdoptee}`;
  const fauxEncoreAdoptee = join(dossier, "faux-variante-encore-adoptee.json");
  writeFileSync(fauxEncoreAdoptee, JSON.stringify(encoreAdoptee, null, 2), "utf8");
  const casVarianteAdoptee = lancer(fauxEncoreAdoptee, dossier);
  resultats.push({
    nom: "variante encore présente dans le texte adopté refusée",
    attendu: "code 1 et contrôle WP1.7",
    tenu:
      casVarianteAdoptee.code === 1 &&
      /encore présente dans le texte adopté/.test(casVarianteAdoptee.sortie),
    sortie: casVarianteAdoptee.sortie
  });

  /* WP1.3 — une étiquette ne peut pas qualifier un passage qu'il ne déclare pas. */
  const malEtiquete = JSON.parse(JSON.stringify(loi));
  malEtiquete.extraits[0].tag = "supprime";
  const fauxEtiquette = join(dossier, "faux-etiquette.json");
  writeFileSync(fauxEtiquette, JSON.stringify(malEtiquete, null, 2), "utf8");
  const casEtiquette = lancer(fauxEtiquette, dossier);
  resultats.push({
    nom: "étiquette « supprime » sur un passage ordinaire refusée",
    attendu: "code 1 et contrôle WP1.3",
    tenu: casEtiquette.code === 1 && /WP1\.3/.test(casEtiquette.sortie),
    sortie: casEtiquette.sortie
  });
  /* WP1.8 — une citation retouchée n'est plus la citation prononcée. */
  const citationFausse = JSON.parse(JSON.stringify(loi));
  citationFausse.debat.pour[0].citation = CITATION_POUR.replace("nouveaux", "anciens");
  const fauxCitation = join(dossier, "faux-citation.json");
  writeFileSync(fauxCitation, JSON.stringify(citationFausse, null, 2), "utf8");
  const casCitation = lancer(fauxCitation, dossier);
  resultats.push({
    nom: "citation retouchée refusée",
    attendu: "code 1 et citation absente du verbatim",
    tenu: casCitation.code === 1 && /citation absente du verbatim/.test(casCitation.sortie),
    sortie: casCitation.sortie
  });

  /* WP1.9 — un verdict favorable sans source n'est pas une vérification. */
  const sansSource = JSON.parse(JSON.stringify(loi));
  sansSource.verifications.chiffres[0].sources = [];
  const fauxSansSource = join(dossier, "faux-sans-source.json");
  writeFileSync(fauxSansSource, JSON.stringify(sansSource, null, 2), "utf8");
  const casSansSource = lancer(fauxSansSource, dossier);
  resultats.push({
    nom: "verdict « confirmé » sans source refusé",
    attendu: "code 1 et verdict sans source",
    tenu: casSansSource.code === 1 && /sans source/.test(casSansSource.sortie),
    sortie: casSansSource.sortie
  });

  /* WP1.9 — « non documenté » ne peut pas porter une source : ce serait
     un verdict qui se contredit. */
  const contradiction = JSON.parse(JSON.stringify(loi));
  contradiction.verifications.chiffres[0].verdict = "non documenté";
  const fauxContradiction = join(dossier, "faux-contradiction.json");
  writeFileSync(fauxContradiction, JSON.stringify(contradiction, null, 2), "utf8");
  const casContradiction = lancer(fauxContradiction, dossier);
  resultats.push({
    nom: "« non documenté » avec source refusé",
    attendu: "code 1 et contradiction",
    tenu: casContradiction.code === 1 && /contradiction/.test(casContradiction.sortie),
    sortie: casContradiction.sortie
  });

  /* WP1.9 — l'affirmation affichée entre guillemets doit être un fragment exact
     de la citation prononcée : la retoucher, c'est citer faux. */
  const affirmationFausse = JSON.parse(JSON.stringify(loi));
  affirmationFausse.verifications.chiffres[0].affirmation = "12 % des loyers sont concernés.";
  const fauxAffirmation = join(dossier, "faux-affirmation.json");
  writeFileSync(fauxAffirmation, JSON.stringify(affirmationFausse, null, 2), "utf8");
  const casAffirmation = lancer(fauxAffirmation, dossier);
  resultats.push({
    nom: "affirmation retouchée refusée",
    attendu: "code 1 et affirmation absente de la citation",
    tenu:
      casAffirmation.code === 1 && /affirmation absente de la citation/.test(casAffirmation.sortie),
    sortie: casAffirmation.sortie
  });
} finally {
  rmSync(dossier, { recursive: true, force: true });
}

let echecs = 0;
for (const r of resultats) {
  if (r.tenu) {
    console.log(`[OK] ${r.nom} — ${r.attendu}`);
  } else {
    echecs++;
    console.log(`[X]  ${r.nom} — attendu : ${r.attendu}`);
    console.log(
      r.sortie
        .split("\n")
        .filter((l) => l.trim())
        .map((l) => "     " + l)
        .join("\n")
    );
  }
}

console.log("");
if (echecs) {
  console.log(`Preuve non tenue : ${echecs} cas sur ${resultats.length}.`);
  process.exit(1);
}
console.log(`Preuve tenue : ${resultats.length} cas sur ${resultats.length}.`);
