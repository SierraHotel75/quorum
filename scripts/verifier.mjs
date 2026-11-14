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
const FICHIER_VERBATIM = process.env.QUORUM_VERBATIM || join(RACINE, "data", "ref", "verbatim.json");

/* Version du passage obligé. Un fichier produit par une version antérieure
   des contrôles est refusé : les règles ont changé, la preuve ne vaut plus. */
const GATE = "4";

/* Domaines autorisés pour une source. Volontairement court : une source hors
   de cette liste est refusée, pas signalée. */
const DOMAINES = [
  "assemblee-nationale.fr",
  "senat.fr",
  "legifrance.gouv.fr",
  "vie-publique.fr",
  "data.gouv.fr",
  "hemicycle.ai",
  "ciivise.fr",
  "justice.gouv.fr"
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
  "Ressources citées vérifiées": "WP1.6",
  "Variante contrôlée": "WP1.7",
  "Débat cité": "WP1.8",
  "Chiffres vérifiés": "WP1.9"
};

/* ---------- Outils ---------- */

function lireJson(chemin) {
  const brut = readFileSync(chemin, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(brut);
}

function normaliser(s) {
  return String(s == null ? "" : s)
    .replace(/[\u200b-\u200d\u2060\ufeff]/g, "")
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
    "debat", "verifications",
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
    /* L'étiquette ne dit que ce que le texte porte lui-même : « supprime »
       n'est admise que sur un passage qui déclare la suppression, « adopte »
       sur tout le reste. Aucune autre appréciation n'est acceptée. */
    if (!["adopte", "supprime"].includes(e.tag)) {
      r.ajouter("WP1.3", `étiquette inconnue : ${e.tag}`);
    } else if (e.tag === "supprime" && !/\(supprim/i.test(e.texte)) {
      r.ajouter("WP1.3", `étiquette « supprime » sur un passage qui ne déclare aucune suppression : « ${String(e.texte).slice(0, 40)}… »`);
    } else if (e.tag === "adopte" && /\(supprim/i.test(e.texte)) {
      r.ajouter("WP1.3", `passage déclaré supprimé étiqueté « adopte » : « ${String(e.texte).slice(0, 40)}… »`);
    }
  }
}

/* Bloc facultatif : la clause qu'un autre scrutin a supprimée. Il n'existe
   que si le fichier le porte. Présent, il doit tenir les six règles ; absent,
   rien n'est exécuté et le fichier reste valide. */
function verifierVariante(loi, r, domainesAutorises) {
  const v = loi.variante || {};

  /* 1. La clause révélée est rattachée à une référence : sans elle, la
     citation ne désigne aucun article. */
  if (!normaliser(v.reference)) {
    r.ajouter("WP1.7", "variante.reference vide : la clause n'est rattachée à aucun article");
  }

  const avant = normaliser(v.avant);
  const source = normaliser(v.texte_source);

  /* 2. La citation doit figurer mot pour mot dans le texte d'où elle vient,
     avec la même normalisation que le contrôle des extraits. */
  if (!avant) {
    r.ajouter("WP1.7", "variante.avant vide : aucune clause à révéler");
  } else if (!source) {
    r.ajouter("WP1.7", "variante.texte_source vide : la citation ne peut pas être vérifiée");
  } else if (!source.includes(avant)) {
    r.ajouter("WP1.7", `clause absente du texte source : « ${String(v.avant).slice(0, 60)}… »`);
  }

  /* 3. Ce qu'un vote a supprimé ne peut pas figurer dans le texte adopté. */
  if (avant) {
    const adopte = normaliser(
      articlesDe(loi).map((a) => (a.paragraphes || []).join(" ")).join(" ")
    );
    if (adopte.includes(avant)) {
      r.ajouter("WP1.7", `clause encore présente dans le texte adopté : « ${String(v.avant).slice(0, 60)}… »`);
    }
  }

  /* 4. Le décompte de la suppression doit tomber juste et être un vote adopté. */
  const s = v.supprimee_par || {};
  const entiers = ["pour", "contre", "abstention", "votants", "suffrages_exprimes", "non_votants"];
  const invalides = entiers.filter((c) => !Number.isInteger(s[c]) || s[c] < 0);
  if (invalides.length) {
    r.ajouter("WP1.7", `supprimee_par : entier positif ou nul attendu pour ${invalides.join(", ")}`);
  } else {
    if (s.pour + s.contre + s.abstention !== s.votants) {
      r.ajouter("WP1.7", `supprimee_par : votants = ${s.votants}, attendu ${s.pour + s.contre + s.abstention}`);
    }
    if (s.pour + s.contre !== s.suffrages_exprimes) {
      r.ajouter("WP1.7", `supprimee_par : suffrages exprimés = ${s.suffrages_exprimes}, attendu ${s.pour + s.contre}`);
    }
    if (s.pour <= s.contre) {
      r.ajouter("WP1.7", `supprimee_par : pour = ${s.pour}, contre = ${s.contre}, un scrutin adopté exige pour > contre`);
    }
  }
  if (s.sort !== "adopté") {
    r.ajouter("WP1.7", `supprimee_par.sort = ${s.sort}, attendu « adopté »`);
  }

  /* 5. La source de la citation est jugée comme toutes les autres sources. */
  const sa = v.source_avant || {};
  const url = normaliser(sa.url);
  if (!url) {
    r.ajouter("WP1.7", "source_avant.url absente : la citation n'a pas de source");
  } else {
    let u = null;
    try {
      u = new URL(url);
    } catch {
      u = null;
    }
    if (!u) {
      r.ajouter("WP1.7", `source_avant.url invalide : ${sa.url}`);
    } else {
      if (u.protocol !== "https:") {
        r.ajouter("WP1.7", "source_avant.url : HTTPS attendu");
      }
      const d = domaineDe(url);
      const connu = domainesAutorises.some((a) => d === a || d?.endsWith("." + a));
      if (!connu) {
        r.ajouter("WP1.7", `source_avant.url : domaine hors liste (${d})`);
      }
    }
  }

  /* 6. Une clause ne peut pas avoir été supprimée par le vote qui la rétablit. */
  const scrutin = normaliser(s.scrutin);
  if (!scrutin) {
    r.ajouter("WP1.7", "supprimee_par.scrutin absent");
  } else if (scrutin === normaliser(loi.scrutin?.id)) {
    r.ajouter(
      "WP1.7",
      `supprimee_par.scrutin = ${scrutin} : identique au scrutin de la loi, qui ne peut pas avoir supprimé la clause`
    );
  }
}

function longueurEntree(e) {
  return normaliser(e.texte || e.titre || e.argument || e.citation || "").length;
}

/* Un débat n'est publiable que si chaque citation se retrouve dans le
   verbatim officiel, avec la même séance et le même auteur. Le contrôle ne
   croit pas la fiche : il compare. */
function verifierCitation(quoi, x, refs, r, code) {
  const citation = normaliser(x.citation);
  if (!citation) {
    r.ajouter(code, `${quoi} : citation vide`);
    return;
  }
  if (citation.length < 40) {
    r.ajouter(code, `${quoi} : citation trop courte pour être vérifiable`);
    return;
  }

  const nom = normaliser(x.nom || x.auteur);
  if (!nom) {
    r.ajouter(code, `${quoi} : auteur absent`);
    return;
  }
  if (!normaliser(x.role)) r.ajouter(code, `${quoi} : rôle absent`);

  const seance = normaliser(x.seance);
  const s = refs.seances.get(seance);
  if (!s) {
    r.ajouter(code, `${quoi} : séance inconnue (${seance || "vide"})`);
    return;
  }
  if (x.date !== s.date) r.ajouter(code, `${quoi} : date ${x.date}, séance du ${s.date}`);
  if (x.url !== s.url) r.ajouter(code, `${quoi} : URL différente de celle du compte rendu`);

  if (refs.experts.size && !refs.experts.has(nom.toLowerCase())) {
    r.ajouter(code, `${quoi} : nom hors liste (${nom})`);
  }

  const trouvee = refs.verbatim.some(
    (c) => c.seance === seance && c.auteur === nom && c.texte.includes(citation)
  );
  if (!trouvee) r.ajouter(code, `${quoi} : citation absente du verbatim officiel`);
}

function verifierDebat(loi, r, refs) {
  const d = loi.debat || {};
  if (!refs.verbatim.length || !refs.seances.size) {
    r.ajouter("WP1.8", "verbatim officiel absent ou vide (data/ref/verbatim.json) : débat non publiable");
  }
  if (!Array.isArray(d.pour) || !Array.isArray(d.contre)) {
    r.ajouter("WP1.8", "debat : les deux bords doivent être des listes");
    return;
  }
  verifierBord("debat", d.pour, d.contre, r, "WP1.8", { total: true });

  for (const x of [...d.pour, ...d.contre]) {
    const quoi = `débat « ${String(x.nom).slice(0, 30)} »`;
    if (!normaliser(x.affiliation)) {
      r.ajouter("WP1.8", `${quoi} : affiliation absente`);
    } else {
      const fiche = refs.experts.get(normaliser(x.nom).toLowerCase());
      if (fiche && normaliser(fiche.affiliation).toLowerCase() !== normaliser(x.affiliation).toLowerCase()) {
        r.ajouter("WP1.8", `${quoi} : affiliation divergente (${x.affiliation}), liste « ${fiche.affiliation} »`);
      }
    }
    verifierCitation(quoi, x, refs, r, "WP1.8");
  }
}

const VERDICTS = ["confirmé", "nuancé", "non documenté"];

/* Un chiffre n'est repris que s'il a été prononcé dans l'hémicycle, que la
   citation est authentique, et qu'une source autorisée soutient le verdict.
   « Non documenté » est un verdict, pas un trou : il interdit d'avoir une
   source, puisque aucune n'a été trouvée. */
function verifierVerifications(loi, r, refs) {
  const v = loi.verifications || {};
  const liste = Array.isArray(v.chiffres) ? v.chiffres : null;
  if (!liste || !liste.length) {
    r.ajouter("WP1.9", "aucun chiffre vérifié : la page n'a rien à prouver");
    return;
  }

  for (const x of liste) {
    const quoi = `chiffre « ${String(x.chiffre || x.affirmation || "").slice(0, 30)} »`;
    if (!normaliser(x.affirmation)) r.ajouter("WP1.9", `${quoi} : affirmation vide`);
    if (!normaliser(x.chiffre)) r.ajouter("WP1.9", `${quoi} : chiffre vide`);
    if (!VERDICTS.includes(x.verdict)) {
      r.ajouter("WP1.9", `${quoi} : verdict hors liste (${x.verdict})`);
      continue;
    }
    if (normaliser(x.explication).length < 80) {
      r.ajouter("WP1.9", `${quoi} : explication absente ou trop courte`);
    }

    verifierCitation(quoi, x, refs, r, "WP1.9");

    const sources = Array.isArray(x.sources) ? x.sources : [];
    if (x.verdict === "non documenté") {
      if (sources.length) {
        r.ajouter("WP1.9", `${quoi} : « non documenté » avec une source, contradiction`);
      }
    } else {
      if (!sources.length) {
        r.ajouter("WP1.9", `${quoi} : verdict « ${x.verdict} » sans source`);
      }
      for (const s of sources) {
        if (!normaliser(s.nom)) r.ajouter("WP1.9", `${quoi} : source sans nom`);
        let u;
        try {
          u = new URL(s.url);
        } catch {
          r.ajouter("WP1.9", `${quoi} : source sans URL valide`);
          continue;
        }
        if (u.protocol !== "https:") r.ajouter("WP1.9", `${quoi} : source non HTTPS`);
        const d = domaineDe(s.url);
        const connu = refs.domaines.some((a) => d === a || d?.endsWith("." + a));
        if (!connu) r.ajouter("WP1.9", `${quoi} : source hors domaines autorisés (${d})`);
      }
    }

    /* Le chiffre vérifié doit être celui que l'orateur a prononcé : un chiffre
       ajouté à côté de la citation n'est pas vérifiable. */
    if (normaliser(x.chiffre) && !normaliser(x.citation).includes(normaliser(x.chiffre))) {
      r.ajouter("WP1.9", `${quoi} : le chiffre n'apparaît pas dans la citation`);
    }
  }
}

function verifierBord(nom, pour, contre, r, code, options) {
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

  /* Des citations authentiques n'ont pas la même longueur : pour le débat,
     l'équilibre se juge sur le total de chaque bord, pas sur chaque extrait. */
  if (options && options.total) {
    const total = (liste) => liste.reduce((a, e) => a + longueurEntree(e), 0);
    const tp = total(pour);
    const tc = total(contre);
    if (tp > 0 && tc > 0 && Math.max(tp, tc) / Math.min(tp, tc) > 2.5) {
      r.ajouter(code, `${nom} : total trop inégal (${tp} contre ${tc} caractères)`);
    }
    return;
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
     exécuté, et il doit les citer tous. « Variante contrôlée » n'est exigé
     que si le fichier porte un bloc variante ; le déclarer sans bloc serait
     une preuve sans objet. */
  const avecVariante = loi.variante != null;
  const noms = (loi.meta?.controles || []).map((c) => c.nom);
  for (const n of noms) {
    if (!CONTROLES[n]) r.ajouter("WP1.6", `contrôle inconnu au journal : ${n}`);
  }
  for (const n of Object.keys(CONTROLES)) {
    if (n === "Variante contrôlée" && !avecVariante) continue;
    if (!noms.includes(n)) r.ajouter("WP1.6", `contrôle absent du journal : ${n}`);
  }
  if (!avecVariante && noms.includes("Variante contrôlée")) {
    r.ajouter("WP1.6", "contrôle « Variante contrôlée » déclaré sans bloc variante dans le fichier");
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
  const refs = { medias: new Map(), experts: new Map(), seances: new Map(), verbatim: [], domaines: [] };

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

  if (existsSync(FICHIER_VERBATIM)) {
    try {
      const v = lireJson(FICHIER_VERBATIM);
      for (const [ref, s] of Object.entries(v.seances || {})) {
        refs.seances.set(normaliser(ref), { date: s.date, url: s.url });
      }
      for (const c of v.citations || []) {
        refs.verbatim.push({
          seance: normaliser(c.seance),
          auteur: normaliser(c.auteur),
          texte: normaliser(c.texte)
        });
      }
    } catch {
      console.error("Note : data/ref/verbatim.json illisible, débat non publiable.");
    }
  }
  refs.domaines = domainesAutorises;

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
      /* Bloc facultatif : sans variante, les contrôles 1 à 6 ne s'exécutent pas. */
      if (loi.variante != null) verifierVariante(loi, r, domainesAutorises);
      verifierSymetrie(loi, r);
      verifierDebat(loi, r, refs);
      verifierVerifications(loi, r, refs);
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
        ...(loi.presse?.contre || []).map((x) => x.url),
        ...(loi.debat?.pour || []).map((x) => x.url),
        ...(loi.debat?.contre || []).map((x) => x.url),
        ...(loi.verifications?.chiffres || []).flatMap((x) => (x.sources || []).map((s) => s.url))
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
