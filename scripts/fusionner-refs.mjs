#!/usr/bin/env node
/* Fusionne les fragments produits par les agents de génération dans les
   références communes. Seuls les fragments nommés en argument entrent dans la
   fusion : un agent qui n'a pas fini ne pollue pas les autres.

   Usage : node scripts/fusionner-refs.mjs slug1 slug2 …
   Sans argument : tous les fragments présents. */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function lire(chemin, defaut) {
  if (!existsSync(chemin)) return defaut;
  return JSON.parse(readFileSync(chemin, "utf8").replace(/^﻿/, ""));
}

function ecrire(chemin, objet) {
  writeFileSync(chemin, JSON.stringify(objet, null, 2) + "\n", "utf8");
}

const slugs = process.argv.slice(2);
const dossierVerbatim = join(RACINE, "data", "ref", "verbatim");
const dossierExperts = join(RACINE, "data", "ref", "experts");

const presents = existsSync(dossierVerbatim)
  ? readdirSync(dossierVerbatim).filter((f) => f.startsWith("_") && f.endsWith(".json")).map((f) => f.slice(1, -5))
  : [];
const retenus = slugs.length ? slugs : presents;

const verbatim = lire(join(RACINE, "data", "ref", "verbatim.json"), { seances: {}, citations: [] });
const experts = lire(join(RACINE, "data", "ref", "experts.json"), { experts: [] });

const nomsVus = new Set((experts.experts || []).map((e) => e.nom.toLowerCase()));
const clesVues = new Set((verbatim.citations || []).map((c) => c.cle));
let ajoutsCitations = 0;
let ajoutsExperts = 0;

for (const slug of retenus) {
  const v = lire(join(dossierVerbatim, "_" + slug + ".json"), null);
  const e = lire(join(dossierExperts, "_" + slug + ".json"), null);
  if (v) {
    Object.assign(verbatim.seances, v.seances || {});
    for (const c of v.citations || []) {
      if (c.cle && clesVues.has(c.cle)) continue;
      verbatim.citations.push(c);
      if (c.cle) clesVues.add(c.cle);
      ajoutsCitations++;
    }
  }
  if (e) {
    for (const x of e.experts || []) {
      const cle = String(x.nom || "").toLowerCase();
      if (!cle || nomsVus.has(cle)) continue;
      experts.experts.push(x);
      nomsVus.add(cle);
      ajoutsExperts++;
    }
  }
}

ecrire(join(RACINE, "data", "ref", "verbatim.json"), verbatim);
ecrire(join(RACINE, "data", "ref", "experts.json"), experts);
console.log(`Fusion : ${retenus.length} fragment(s), ${ajoutsCitations} citation(s), ${ajoutsExperts} orateur(s).`);
console.log(`Total : ${verbatim.citations.length} citations, ${experts.experts.length} orateurs.`);
