#!/usr/bin/env node
/* Quorum — contrôles bloquants avant publication d'une loi.

   Ce script lit, vérifie et refuse. Il n'écrit rien et n'appelle personne,
   sauf avec --reseau, qui teste que chaque URL répond.

   Un contenu qui échoue ici ne doit jamais être publié. Il n'y a pas de
   relecture humaine pour rattraper : le refus est la seule issue.

   Usage :
     node scripts/verifier.mjs                     tous les fichiers de data/lois
     node scripts/verifier.mjs data/lois/ma-loi.json  un seul fichier
     node scripts/verifier.mjs --reseau             avec test des URL

   Code de sortie 0 si tout est vert, 1 dès qu'un fichier est refusé.
*/

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, basename, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DOSSIER_LOIS = join(RACINE, "data", "lois");
const FICHIER_GROUPES = join(RACINE, "data", "ref", "groupes.json");
const FICHIER_MEDIAS = process.env.QUORUM_MEDIAS || join(RACINE, "data", "ref", "medias.json");
const FICHIER_EXPERTS = process.env.QUORUM_EXPERTS || join(RACINE, "data", "ref", "experts.json");

/* Version du passage obligé. Un fichier produit par une version antérieure
   des contrôles est refusé : les règles ont changé, la preuve ne vaut plus. */
const GATE = "2";

/* Domaines autorisés pour une source. Volontairement court : une source hors
   de cette liste est refusée, pas signalée. */
const DOMAINES = [
  "assemblee-nationale.fr",
  "senat.fr",
  "legifrance.gouv.fr",
  "vie-publique.fr",
  "data.gouv.fr",
  "hemicycle.ai"
];

/* Valeurs fermées. Une valeur hors liste est refusée : elle vient d'une
   convention, pas d'une saisie libre. */
const THEMES = [
  "logement", "budget", "sante", "education", "travail", "environnement",
  "numerique", "securite", "institutions", "agriculture", "transport",
  "energie", "justice", "immigration", "social", "defense", "culture"
];
const STATUTS = [
  "Adopté", "Rejeté", "En discussion", "Promulgué", "Retiré", "Non documenté"
];
const CHAMBRES = ["Assemblée nationale", "Sénat"];
const REGLES = [
  "majorité des suffrages exprimés",
  "majorité absolue des suffrages exprimés",
  "majorité absolue des membres",
  "majorité des trois cinquièmes"
];
const MAILLONS = [
  "AN", "SENAT", "CMP", "COMMISSION", "GOUVERNEMENT", "CONSEIL_CONSTITUTIONNEL"
];

/* Journal des contrôles attendu dans meta.controles. Le nom affiché par
   l'application est lié au contrôle qui l'a réellement produit. */
const CONTROLES = {
  "Schéma du fichier": "WP1.1",
  "Chiffres cohérents avec le scrutin": "WP1.2",
  "Sièges attribués = 577": "WP1.2",
  "Extraits verbatim": "WP1.3",
  "Symétrie des bords": "WP1.4",
  "Sources des médias": "WP1.5",
  "Ressources citées vérifiées": "WP1.6"
};

/* ---------- Outils ---------- */

function lireJson(chemin) {
  const brut = readFileSync(chemin, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(brut);
}

function normaliser(s) {
  return String(s == null ? "" : s)
    .replace(/\u00a0/g, " ")
    .replace(/[\u2018\u2019\u201a\u201b]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function estDate(iso) {
  if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = new Date(iso + "T12:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
}

function nombre(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function domaineDe(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/* Un article de loi, qu'il soit seul (article) ou dans une liste (articles).
   Le vérificateur ne devine pas : il lit ce que le fichier donne. */
function articlesDe(loi) {
  if (Array.isArray(loi.articles) && loi.articles.length) return loi.articles;
  if (loi.article && Array.isArray(loi.article.paragraphes)) {
    return [
      {
        reference: loi.article.reference || loi.article.titre || "Article unique",
        titre: loi.article.titre,
        paragraphes: loi.article.paragraphes
      }
    ];
  }
  return [];
}

function compterPhrases(texte) {
  const t = normaliser(texte);
  if (!t) return 0;
  return (t.match(/[^.!?]+[.!?]+/g) || []).length || 1;
}

/* « Article 1er », « article 1 » et « Article 1 » désignent le même article.
   La comparaison ne doit pas refuser une différence de typographie officielle. */
function cleArticle(s) {
  return normaliser(s)
    .toLowerCase()
    .replace(/^article\s+/, "")
    .replace(/^1er$/, "1")
    .trim();
}

/* ---------- Contrôles ---------- */

function verifierSchema(loi, r) {
  const obligatoires = [
    "id", "titre", "theme", "statut", "resume", "nb_phrases",
    "source", "scrutin", "chronologie", "extraits",
    "chiffres", "quiz", "arguments", "presse", "experts",
    "votes_par_groupe", "meta"
  ];
  const manquants = obligatoires.filter((c) => loi[c] == null);
  if (manquants.length) {
    r.ajouter("WP1.1", `champs absents : ${manquants.join(", ")}`);
    return false;
  }

  if (loi.articles == null && loi.article == null) {
    r.ajouter("WP1.1", "texte absent : ni article ni articles");
    return false;
  }
  if (loi.articles != null && (!Array.isArray(loi.articles) || !loi.articles.length)) {
    r.ajouter("WP1.1", "articles présent mais vide");
  }
  for (const a of articlesDe(loi)) {
    if (!a || !normaliser(a.reference)) {
      r.ajouter("WP1.1", "article sans référence");
      continue;
    }
    if (!Array.isArray(a.paragraphes) || !a.paragraphes.length) {
      r.ajouter("WP1.1", `article sans paragraphe : ${a.reference}`);
    }
  }

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(loi.id)) {
    r.ajouter("WP1.1", `identifiant non conforme (minuscules et tirets attendus) : ${loi.id}`);
  }
  if (!normaliser(loi.titre)) r.ajouter("WP1.1", "titre vide");
  if (!normaliser(loi.resume)) r.ajouter("WP1.1", "résumé vide");
  if (!THEMES.includes(loi.theme)) {
    r.ajouter("WP1.1", `thème hors liste : ${loi.theme}`);
  }
  if (!STATUTS.includes(loi.statut)) {
    r.ajouter("WP1.1", `statut hors liste : ${loi.statut}`);
  }

  const s = loi.scrutin || {};
  for (const c of ["id", "date", "chambre", "numero", "pour", "contre", "abstention", "non_votants", "votants", "suffrages_exprimes", "regle"]) {
    if (s[c] == null || (typeof s[c] === "string" && !normaliser(s[c]))) {
      r.ajouter("WP1.1", `scrutin.${c} absent`);
    }
  }
  if (!CHAMBRES.includes(s.chambre)) {
    r.ajouter("WP1.1", `scrutin.chambre hors liste : ${s.chambre}`);
  }
  if (!REGLES.includes(s.regle)) {
    r.ajouter("WP1.1", `scrutin.regle hors liste : ${s.regle}`);
  }

  if (!Array.isArray(loi.chronologie) || !loi.chronologie.length) {
    r.ajouter("WP1.1", "chronologie vide");
  } else {
    for (const e of loi.chronologie) {
      if (!MAILLONS.includes(e.chambre)) {
        r.ajouter("WP1.1", `maillon hors liste : ${e.chambre}`);
      }
      if (!normaliser(e.texte)) {
        r.ajouter("WP1.1", `étape de chronologie sans texte : ${e.date}`);
      }
    }
  }
  if (!Array.isArray(loi.extraits) || !loi.extraits.length) {
    r.ajouter("WP1.1", "extraits vides");
  }
  if (!Array.isArray(loi.votes_par_groupe) || !loi.votes_par_groupe.length) {
    r.ajouter("WP1.1", "votes_par_groupe vides");
  }
  if (!loi.source || !loi.source.nom || !loi.source.url || !loi.source.licence) {
    r.ajouter("WP1.1", "source incomplète : nom, url et licence obligatoires");
  }
  if (!loi.source?.texte_url) {
    r.ajouter("WP1.1", "source.texte_url absent : le lien vers le texte officiel manque");
  }
  if (!loi.source?.consulte_le) {
    r.ajouter("WP1.1", "source.consulte_le absent");
  }
  /* Les sièges non attribués ne sont imputés à aucun groupe : le fichier doit
     les déclarer à part, avec un nombre entier positif ou nul. */
  if (!Number.isInteger(loi.sieges_vides) || loi.sieges_vides < 0) {
    r.ajouter("WP1.1", `sieges_vides absent ou invalide : ${loi.sieges_vides}`);
  }
  if (!loi.meta || !Array.isArray(loi.meta.controles)) {
    r.ajouter("WP1.1", "meta.controles absent");
  }
  if (loi.meta?.gate !== GATE) {
    r.ajouter("WP1.1", `fichier produit par un autre passage de contrôles : gate ${loi.meta?.gate}, attendu ${GATE}`);
  }
  return true;
}

function verifierDates(loi, r) {
  if (!estDate(loi.scrutin?.date)) {
    r.ajouter("WP1.1", `date de scrutin invalide : ${loi.scrutin?.date}`);
  }
  if (loi.source?.consulte_le && !estDate(loi.source.consulte_le)) {
    r.ajouter("WP1.1", `date de consultation invalide : ${loi.source.consulte_le}`);
  }
  if (!estDate(loi.meta?.genere_le)) {
    r.ajouter("WP1.1", `date de génération invalide : ${loi.meta?.genere_le}`);
  }

  let precedente = null;
  for (const e of loi.chronologie || []) {
    if (!estDate(e.date)) {
      r.ajouter("WP1.1", `chronologie, date invalide : ${e.date}`);
      continue;
    }
    if (precedente && e.date < precedente) {
      r.ajouter("WP1.1", `chronologie non croissante : ${e.date} après ${precedente}`);
    }
    precedente = e.date;
  }
}

function verifierNombres(loi, groupes, r) {
  const s = loi.scrutin || {};

  if (s.chambre === "Sénat") {
    r.ajouter("WP1.2", "scrutin au Sénat : composition de référence absente (data/ref/senat.json), contrôle impossible");
    return;
  }

  const phrases = compterPhrases(
    articlesDe(loi).map((a) => (a.paragraphes || []).join(" ")).join(" ")
  );
  if (nombre(loi.nb_phrases) !== phrases) {
    r.ajouter("WP1.2", `nb_phrases = ${loi.nb_phrases}, texte fourni = ${phrases} phrases`);
  }

  const pour = nombre(s.pour);
  const contre = nombre(s.contre);
  const abst = nombre(s.abstention);
  const nv = nombre(s.non_votants);
  const votants = nombre(s.votants);
  const exprimes = nombre(s.suffrages_exprimes);

  if ([pour, contre, abst, nv, votants, exprimes].some(Number.isNaN)) {
    r.ajouter("WP1.2", "un décompte du scrutin n'est pas un nombre");
    return;
  }

  const total = groupes.total;
  const presents = pour + contre + abst + nv;
  const vides = nombre(loi.sieges_vides);
  if (presents > total) {
    r.ajouter("WP1.2", `présents = ${presents}, supérieur aux ${total} sièges`);
  }
  if (Number.isNaN(vides)) {
    r.ajouter("WP1.2", "sieges_vides n'est pas un nombre");
  } else if (presents + vides !== total) {
    r.ajouter("WP1.2", `présents + sièges vides = ${presents + vides}, attendu ${total}`);
  }
  if (votants !== pour + contre + abst) {
    r.ajouter("WP1.2", `votants = ${votants}, attendu ${pour + contre + abst}`);
  }
  if (exprimes !== pour + contre) {
    r.ajouter("WP1.2", `suffrages exprimés = ${exprimes}, attendu ${pour + contre}`);
  }
  if (pour < 0 || contre < 0 || abst < 0 || nv < 0) {
    r.ajouter("WP1.2", "un décompte est négatif");
  }

  /* Les chiffres affichés doivent être ceux du scrutin, pas des valeurs libres. */
  const attendus = {
    pour: pour,
    contre: contre,
    abstentions: abst,
    votants: votants,
    exprimes: exprimes,
    "non-votants": nv
  };
  const cle = (libelle) =>
    normaliser(libelle).toLowerCase()
      .replace(/[ée]s?$/, (m) => (m.startsWith("é") ? "e" : "s"))
      .replace(/s$/, "");

  for (const c of loi.chiffres || []) {
    const k = normaliser(c.libelle).toLowerCase();
    let cible = null;
    if (/^pour/.test(k)) cible = "pour";
    else if (/^contre/.test(k)) cible = "contre";
    else if (/abstention/.test(k)) cible = "abstentions";
    else if (/non-?votant/.test(k)) cible = "non-votants";
    else if (/votant/.test(k)) cible = "votants";
    else if (/exprim/.test(k)) cible = "exprimes";
    if (cible && nombre(c.valeur) !== attendus[cible]) {
      r.ajouter("WP1.2", `chiffre « ${c.libelle} » = ${c.valeur}, scrutin = ${attendus[cible]}`);
    }
    if (cible === null) {
      r.ajouter("WP1.2", `chiffre sans équivalent au scrutin : « ${c.libelle} »`);
    }
    if (cle(c.libelle) && !String(c.libelle).trim()) {
      r.ajouter("WP1.2", "libellé de chiffre vide");
    }
  }
}

function verifierGroupes(loi, groupes, r) {
  if (loi.scrutin?.chambre === "Sénat") return;
  const parId = groupes.parId;
  const vus = new Set();

  for (const ligne of loi.votes_par_groupe || []) {
    if (!parId[ligne.id]) {
      r.ajouter("WP1.2", `groupe inconnu : ${ligne.id}`);
      continue;
    }
    vus.add(ligne.id);
    const statutaire = parId[ligne.id];
    const somme =
      nombre(ligne.pour) + nombre(ligne.contre) +
      nombre(ligne.abstention) + nombre(ligne.non_votants);
    /* Le siège attribué au groupe est le siège présent : votant, abstentionniste
       ou non-votant volontaire. Il ne peut dépasser l'effectif statutaire. */
    if (nombre(ligne.sieges) !== somme) {
      r.ajouter("WP1.2", `${ligne.id} : sieges = ${ligne.sieges}, décompte = ${somme}`);
    }
    /* L'effectif statutaire du fichier de composition est daté d'un autre jour
       que le scrutin : un groupe peut avoir gagné ou perdu un membre entre les
       deux. Seul le décompte du scrutin fait foi, et il est contrôlé plus bas. */
  }

  for (const id of Object.keys(parId)) {
    if (!vus.has(id)) r.ajouter("WP1.2", `groupe absent du décompte : ${id}`);
  }

  const somme = (cle) =>
    (loi.votes_par_groupe || []).reduce((a, l) => a + (nombre(l[cle]) || 0), 0);

  for (const cle of ["pour", "contre", "abstention", "non_votants"]) {
    const attendu = nombre(loi.scrutin?.[cle]);
    const obtenu = somme(cle);
    if (obtenu !== attendu) {
      r.ajouter("WP1.2", `somme des groupes, ${cle} = ${obtenu}, scrutin = ${attendu}`);
    }
  }

  /* Les sièges qu'aucun groupe ne représente restent comptés, mais à part.
     C'est le seul moyen de ne pas inventer leur répartition. */
  const attribues = somme("sieges") + (nombre(loi.sieges_vides) || 0);
  if (attribues !== groupes.total) {
    r.ajouter("WP1.2", `sièges attribués + sièges vides = ${attribues}, attendu ${groupes.total}`);
  }
}

function verifierVerbatim(loi, r) {
  const articles = articlesDe(loi);
  const texte = normaliser(articles.map((a) => (a.paragraphes || []).join(" ")).join(" "));
  if (!texte) return;

  const multiple = Array.isArray(loi.articles) && loi.articles.length > 1;
  const references = articles.map((a) => cleArticle(a.reference));

  for (const e of loi.extraits || []) {
    if (!normaliser(e.texte)) {
      r.ajouter("WP1.3", "extrait vide");
      continue;
    }
    if (!texte.includes(normaliser(e.texte))) {
      r.ajouter("WP1.3", `phrase absente du texte source : « ${String(e.texte).slice(0, 60)}… »`);
    }
    if (!e.article) {
      r.ajouter("WP1.3", `extrait sans référence d'article : « ${String(e.texte).slice(0, 40)}… »`);
    } else if (multiple && !references.includes(cleArticle(e.article))) {
      r.ajouter("WP1.3", `extrait rattaché à un article inconnu : ${e.article}`);
    }
    if (!["aujourdhui", "si_adopte", "concerne"].includes(e.tag)) {
      r.ajouter("WP1.3", `étiquette inconnue : ${e.tag}`);
    }
  }
}

function longueurEntree(e) {
  return normaliser(e.texte || e.titre || e.argument || "").length;
}

function verifierBord(nom, pour, contre, r, code) {
  if (!Array.isArray(pour) || !Array.isArray(contre)) {
    r.ajouter(code, `${nom} : les deux bords doivent être des listes`);
    return;
  }
  if (pour.length !== contre.length) {
    r.ajouter(code, `${nom} : ${pour.length} pour contre ${contre.length} contre, la symétrie est rompue`);
  }
  if (pour.length === 0) {
    r.ajouter(code, `${nom} : aucun contenu, la page doit rester vide et le dire`);
  }

  const longueurs = [...pour, ...contre].map(longueurEntree).filter((n) => n > 0);
  if (longueurs.length) {
    const min = Math.min(...longueurs);
    const max = Math.max(...longueurs);
    if (max / min > 2.5) {
      r.ajouter(code, `${nom} : longueurs trop inégales (${min} à ${max} caractères)`);
    }
  }
}

function verifierSymetrie(loi, r) {
  verifierBord("arguments", loi.arguments?.pour, loi.arguments?.contre, r, "WP1.4");
  verifierBord("presse", loi.presse?.pour, loi.presse?.contre, r, "WP1.4");
  verifierBord("experts", loi.experts?.pour, loi.experts?.contre, r, "WP1.4");

  for (const a of [...(loi.arguments?.pour || []), ...(loi.arguments?.contre || [])]) {
    if (!normaliser(a.titre)) r.ajouter("WP1.4", "argument sans titre");
    if (!normaliser(a.source)) r.ajouter("WP1.4", `argument sans source : « ${String(a.titre).slice(0, 40)} »`);
    if (!normaliser(a.url)) r.ajouter("WP1.5", `argument sans URL de source : « ${String(a.titre).slice(0, 40)} »`);
  }

  for (const q of loi.quiz || []) {
    if (!Array.isArray(q.options) || q.options.length < 2) {
      r.ajouter("WP1.4", "question de quiz avec moins de deux options");
      continue;
    }
    if (!Number.isInteger(q.bonne) || q.bonne < 0 || q.bonne >= q.options.length) {
      r.ajouter("WP1.4", `bonne réponse hors des options : ${q.bonne}`);
    }
    if (!normaliser(q.source)) r.ajouter("WP1.4", "question de quiz sans source");
  }
}

function verifierSources(loi, r, domainesAutorises) {
  const urls = [];
  if (loi.source?.url) urls.push({ quoi: "source de la loi", url: loi.source.url });
  if (loi.source?.texte_url) urls.push({ quoi: "texte officiel", url: loi.source.texte_url });
  for (const a of [...(loi.arguments?.pour || []), ...(loi.arguments?.contre || [])]) {
    if (a.url) urls.push({ quoi: `argument « ${String(a.titre).slice(0, 30)} »`, url: a.url });
  }
  for (const x of [...(loi.presse?.pour || []), ...(loi.presse?.contre || [])]) {
    if (x.url) urls.push({ quoi: `presse « ${x.media} »`, url: x.url });
  }
  for (const x of [...(loi.experts?.pour || []), ...(loi.experts?.contre || [])]) {
    if (x.url) urls.push({ quoi: `expert « ${x.nom} »`, url: x.url });
  }

  for (const { quoi, url } of urls) {
    let u;
    try {
      u = new URL(url);
    } catch {
      r.ajouter("WP1.5", `${quoi} : URL invalide`);
      continue;
    }
    if (u.protocol !== "https:") {
      r.ajouter("WP1.5", `${quoi} : HTTPS attendu`);
    }
    const d = domaineDe(url);
    const connu = domainesAutorises.some((a) => d === a || d?.endsWith("." + a));
    if (!connu) {
      r.ajouter("WP1.5", `${quoi} : domaine hors liste (${d})`);
    }
  }
}

function verifierMarqueurs(loi, r, refs) {
  if (loi.demo === true) {
    r.ajouter("WP1.6", "marqueur de démonstration présent");
  }
  if (loi.meta?.modele && /d[ée]monstration|maquette|fictif|test/i.test(loi.meta.modele)) {
    r.ajouter("WP1.6", `le champ modele trahit un contenu non réel : ${loi.meta.modele}`);
  }

  const textes = [
    loi.titre, loi.resume,
    ...(loi.arguments?.pour || []).flatMap((a) => [a.titre, a.texte]),
    ...(loi.arguments?.contre || []).flatMap((a) => [a.titre, a.texte]),
    ...(loi.presse?.pour || []).map((a) => a.titre),
    ...(loi.presse?.contre || []).map((a) => a.titre),
    ...(loi.experts?.pour || []).map((a) => a.argument),
    ...(loi.experts?.contre || []).map((a) => a.argument)
  ].map(normaliser);

  for (const t of textes) {
    if (!t) continue;
    if (/d[ée]monstration/i.test(t)) r.ajouter("WP1.6", `texte de démonstration : « ${t.slice(0, 50)}… »`);
    if (/maquette/i.test(t)) r.ajouter("WP1.6", `texte de maquette : « ${t.slice(0, 50)}… »`);
  }

  /* Presse : le média doit figurer dans la liste de flux suivie, et l'URL
     doit appartenir à son domaine. Le drapeau media_fictif n'est plus une
     preuve : l'absence de la liste refuse, même sans drapeau. */
  const presse = [...(loi.presse?.pour || []), ...(loi.presse?.contre || [])];
  if (presse.length && !refs.medias.size) {
    r.ajouter("WP1.6", "liste des médias absente ou vide (data/ref/medias.json) : presse non publiable");
  }
  for (const x of presse) {
    if (x.media_fictif === true) r.ajouter("WP1.6", `média fictif : ${x.media}`);
    if (!x.url) {
      r.ajouter("WP1.5", `titre de presse sans URL : « ${String(x.titre).slice(0, 40)} »`);
      continue;
    }
    const cle = normaliser(x.media).toLowerCase();
    const domaine = refs.medias.get(cle);
    if (refs.medias.size && !domaine) {
      r.ajouter("WP1.6", `média hors liste : ${x.media}`);
      continue;
    }
    if (domaine && domaineDe(x.url) !== domaine) {
      r.ajouter("WP1.5", `URL de « ${x.media} » hors de son domaine (${domaineDe(x.url)}, attendu ${domaine})`);
    }
  }

  /* Spécialistes : nom et affiliation doivent correspondre à la liste
     curatée. Un nom absent est refusé, avec ou sans drapeau. */
  const experts = [...(loi.experts?.pour || []), ...(loi.experts?.contre || [])];
  if (experts.length && !refs.experts.size) {
    r.ajouter("WP1.6", "liste des spécialistes absente ou vide (data/ref/experts.json) : experts non publiables");
  }
  for (const x of experts) {
    if (x.fictif === true) r.ajouter("WP1.6", `spécialiste fictif : ${x.nom}`);
    if (!x.url) r.ajouter("WP1.5", `spécialiste sans URL : ${x.nom}`);
    if (!normaliser(x.role)) r.ajouter("WP1.6", `spécialiste sans rôle : ${x.nom}`);
    const fiche = refs.experts.get(normaliser(x.nom).toLowerCase());
    if (refs.experts.size && !fiche) {
      r.ajouter("WP1.6", `spécialiste hors liste : ${x.nom}`);
      continue;
    }
    if (fiche && normaliser(fiche.affiliation).toLowerCase() !== normaliser(x.affiliation).toLowerCase()) {
      r.ajouter("WP1.6", `affiliation divergente pour ${x.nom} : « ${x.affiliation} », liste « ${fiche.affiliation} »`);
    }
  }

  /* Journal des contrôles : il ne peut citer qu'un contrôle réellement
     exécuté, et il doit les citer tous. */
  const noms = (loi.meta?.controles || []).map((c) => c.nom);
  for (const n of noms) {
    if (!CONTROLES[n]) r.ajouter("WP1.6", `contrôle inconnu au journal : ${n}`);
  }
  for (const n of Object.keys(CONTROLES)) {
    if (!noms.includes(n)) r.ajouter("WP1.6", `contrôle absent du journal : ${n}`);
  }
  for (const c of loi.meta?.controles || []) {
    if (c.etat !== "ok") {
      r.ajouter("WP1.6", `contrôle non vert : ${c.nom} (${c.etat})`);
    }
  }
}

/* ---------- Rapport ---------- */

function nouveauRapport() {
  const erreurs = [];
  return {
    erreurs,
    ajouter(code, message) {
      erreurs.push({ code, message });
    },
    get ok() {
      return erreurs.length === 0;
    }
  };
}

/* ---------- Test réseau, facultatif ---------- */

async function verifierReponse(url) {
  const controle = AbortSignal.timeout(8000);
  try {
    const rep = await fetch(url, { method: "GET", redirect: "follow", signal: controle });
    return rep.ok || rep.status === 403 || rep.status === 429;
  } catch {
    return false;
  }
}

/* ---------- Programme ---------- */

async function main() {
  const args = process.argv.slice(2);
  const avecReseau = args.includes("--reseau");
  const chemins = args.filter((a) => !a.startsWith("--"));

  if (!existsSync(FICHIER_GROUPES)) {
    console.error(`Refus : ${relative(RACINE, FICHIER_GROUPES)} introuvable.`);
    process.exit(1);
  }

  const brut = lireJson(FICHIER_GROUPES);
  const liste = Array.isArray(brut.groupes) ? brut.groupes : [];
  const groupes = {
    parId: Object.fromEntries(liste.map((g) => [g.id, g.sieges])),
    total: liste.reduce((a, g) => a + g.sieges, 0)
  };
  if (!groupes.total) {
    console.error("Refus : composition des groupes vide.");
    process.exit(1);
  }

  let domainesAutorises = [...DOMAINES];
  const refs = { medias: new Map(), experts: new Map() };

  if (existsSync(FICHIER_MEDIAS)) {
    try {
      const m = lireJson(FICHIER_MEDIAS);
      if (Array.isArray(m.domaines)) domainesAutorises = [...domainesAutorises, ...m.domaines];
      for (const x of m.medias || []) {
        if (!normaliser(x.nom) || !normaliser(x.domaine)) continue;
        refs.medias.set(normaliser(x.nom).toLowerCase(), normaliser(x.domaine).toLowerCase());
        domainesAutorises.push(normaliser(x.domaine).toLowerCase());
      }
    } catch {
      console.error("Note : data/ref/medias.json illisible, liste de domaines par défaut.");
    }
  }

  if (existsSync(FICHIER_EXPERTS)) {
    try {
      const e = lireJson(FICHIER_EXPERTS);
      for (const x of e.experts || []) {
        if (!normaliser(x.nom)) continue;
        refs.experts.set(normaliser(x.nom).toLowerCase(), x);
      }
    } catch {
      console.error("Note : data/ref/experts.json illisible, liste des spécialistes vide.");
    }
  }

  let fichiers;
  if (chemins.length) {
    fichiers = chemins.map((c) => resolve(process.cwd(), c));
  } else {
    fichiers = readdirSync(DOSSIER_LOIS)
      .filter((f) => f.endsWith(".json") && !f.startsWith("_") && f !== "index.json")
      .map((f) => join(DOSSIER_LOIS, f));
  }

  if (!fichiers.length) {
    console.error("Refus : aucun fichier de loi à vérifier.");
    process.exit(1);
  }

  let refuses = 0;

  for (const fichier of fichiers) {
    const nom = relative(RACINE, fichier);
    const r = nouveauRapport();

    let loi;
    try {
      loi = lireJson(fichier);
    } catch (e) {
      console.log(`\n${nom}`);
      console.log(`  [X] WP1.1  JSON illisible : ${e.message}`);
      refuses++;
      continue;
    }

    const schemaOk = verifierSchema(loi, r);
    if (schemaOk) {
      verifierDates(loi, r);
      verifierNombres(loi, groupes, r);
      verifierGroupes(loi, groupes, r);
      verifierVerbatim(loi, r);
      verifierSymetrie(loi, r);
      verifierSources(loi, r, domainesAutorises);
      verifierMarqueurs(loi, r, refs);
    }

    if (avecReseau && schemaOk && r.erreurs.length === 0) {
      const urls = [
        loi.source?.url,
        loi.source?.texte_url,
        ...(loi.arguments?.pour || []).map((x) => x.url),
        ...(loi.arguments?.contre || []).map((x) => x.url),
        ...(loi.presse?.pour || []).map((x) => x.url),
        ...(loi.presse?.contre || []).map((x) => x.url)
      ].filter(Boolean);
      for (const u of urls) {
        const ok = await verifierReponse(u);
        if (!ok) r.ajouter("WP1.5", `URL ne répond pas : ${u}`);
      }
    }

    console.log(`\n${nom}`);
    if (r.ok) {
      console.log(`  [OK] ${loi.titre} — ${groupes.total} sièges, décompte cohérent`);
    } else {
      refuses++;
      for (const e of r.erreurs) {
        console.log(`  [X] ${e.code}  ${e.message}`);
      }
    }
  }

  console.log("");
  if (refuses) {
    console.log(`Verdict : ${refuses} fichier(s) refusé(s) sur ${fichiers.length}. Publication interdite.`);
    process.exit(1);
  }
  console.log(`Verdict : ${fichiers.length} fichier(s) conforme(s). Publication autorisée.`);
}

main().catch((e) => {
  console.error("Erreur inattendue du vérificateur :", e.message);
  process.exit(1);
});
