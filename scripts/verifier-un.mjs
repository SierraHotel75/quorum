#!/usr/bin/env node
/* Vérifie une seule fiche de loi en cours de génération, sans toucher aux
   références communes. Les fragments de l'agent sont fusionnés avec
   data/ref/verbatim.json et data/ref/experts.json dans des fichiers
   temporaires, puis le gate officiel tourne sur cette fiche seule.

   Usage : node scripts/verifier-un.mjs data/lois/_ma-loi.json */

import { readFileSync, writeFileSync, existsSync, mkdtempSync } from "node:fs";
import { join, resolve, basename, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cible = process.argv[2];

if (!cible) {
  console.error("Usage : node scripts/verifier-un.mjs data/lois/_ma-loi.json");
  process.exit(1);
}

const slug = basename(cible, ".json").replace(/^_/, "");

function lire(chemin, defaut) {
  if (!existsSync(chemin)) return defaut;
  return JSON.parse(readFileSync(chemin, "utf8").replace(/^﻿/, ""));
}

const temp = mkdtempSync(join(tmpdir(), "quorum-gate-"));

const verbatimBase = lire(join(RACINE, "data", "ref", "verbatim.json"), { seances: {}, citations: [] });
const verbatimFrag = lire(join(RACINE, "data", "ref", "verbatim", "_" + slug + ".json"), { seances: {}, citations: [] });
const expertsBase = lire(join(RACINE, "data", "ref", "experts.json"), { experts: [] });
const expertsFrag = lire(join(RACINE, "data", "ref", "experts", "_" + slug + ".json"), { experts: [] });

const verbatim = {
  seances: { ...(verbatimBase.seances || {}), ...(verbatimFrag.seances || {}) },
  citations: [...(verbatimBase.citations || []), ...(verbatimFrag.citations || [])]
};
const experts = { experts: [...(expertsBase.experts || []), ...(expertsFrag.experts || [])] };

const cheminVerbatim = join(temp, "verbatim.json");
const cheminExperts = join(temp, "experts.json");
writeFileSync(cheminVerbatim, JSON.stringify(verbatim), "utf8");
writeFileSync(cheminExperts, JSON.stringify(experts), "utf8");

const r = spawnSync(process.execPath, [join(RACINE, "scripts", "verifier.mjs"), cible], {
  cwd: RACINE,
  env: { ...process.env, QUORUM_VERBATIM: cheminVerbatim, QUORUM_EXPERTS: cheminExperts },
  encoding: "utf8"
});

process.stdout.write(r.stdout || "");
process.stderr.write(r.stderr || "");
process.exit(r.status == null ? 1 : r.status);
