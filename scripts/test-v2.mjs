#!/usr/bin/env node
/* Tests sans dépendance de l'archive v2 et du chargement des devoirs.
   Ils exécutent le vrai js/app.js avec les vrais JSON locaux. */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";
import { spawnSync } from "node:child_process";

const RACINE = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const sourceApp = readFileSync(resolve(RACINE, "js/app.js"), "utf8");
const pause = () => new Promise((resolvePause) => setImmediate(resolvePause));

function json(chemin) {
  return JSON.parse(readFileSync(resolve(RACINE, chemin), "utf8"));
}

async function application(hash = "#/archive", deuxLois = false) {
  const evenements = {};
  const resultats = { innerHTML: "" };
  const app = {
    innerHTML: "",
    scrollTop: 0,
    addEventListener(type, callback) {
      (evenements[type] ||= []).push(callback);
    },
    querySelector(selecteur) {
      if (selecteur === "#resultats-recherche") return resultats;
      return null;
    }
  };
  const index = json("data/lois/index.json");
  if (deuxLois) {
    index.lois.push({
      id: "deuxieme-loi",
      fichier: "data/lois/deuxieme-loi.json",
      titre: "Deuxième loi réellement chargée",
      theme: "budget",
      scrutin: "VTANR5L17V0002"
    });
  }
  const requetes = [];
  const contexte = {
    console,
    Promise,
    Date,
    Math,
    JSON,
    localStorage: {
      getItem() {
        return JSON.stringify({ version: 1, votes: {}, progres: {}, intro: true });
      },
      setItem() {}
    },
    location: { hash },
    document: {
      title: "",
      body: {},
      activeElement: null,
      getElementById(id) {
        return id === "app" ? app : null;
      },
      addEventListener() {}
    },
    window: {
      addEventListener(type, callback) {
        (evenements[type] ||= []).push(callback);
      },
      scrollTo() {}
    },
    async fetch(url) {
      requetes.push(url);
      let corps;
      if (url === "data/lois/index.json") corps = index;
      else if (url === "data/lois/deuxieme-loi.json") {
        corps = json("data/lois/protection-enfants.json");
        corps.id = "deuxieme-loi";
        corps.titre = "Deuxième loi réellement chargée";
      } else corps = json(url);
      return { ok: true, async json() { return corps; } };
    }
  };
  vm.createContext(contexte);
  vm.runInContext(sourceApp, contexte, { filename: "js/app.js" });
  for (let i = 0; i < 6; i++) await pause();
  return {
    app,
    requetes,
    resultats,
    async aller(nouveauHash) {
      contexte.location.hash = nouveauHash;
      for (const callback of evenements.hashchange || []) callback();
      for (let i = 0; i < 6; i++) await pause();
    },
    async saisir(value) {
      for (const callback of evenements.input || []) {
        callback({ target: { id: "recherche", value } });
      }
      await pause();
    }
  };
}

const tests = [];
function test(nom, fonction) {
  tests.push({ nom, fonction });
}

test("les vingt textes suivis sont sourcés, v2 et sans date inventée", () => {
  const suivi = json("data/lois/suivis.json");
  assert.equal(suivi.textes.length, 20);
  assert.equal(new Set(suivi.textes.map((t) => t.id)).size, 20);
  assert.equal(suivi.source.nom, "Assemblée nationale");
  assert.match(suivi.source.licence, /Licence Ouverte/);
  for (const texte of suivi.textes) {
    assert.equal(texte.version, "v2");
    assert.match(texte.dossier, /^DLR5L17N\d+$/);
    assert.ok(texte.actes.length > 0, texte.id);
    for (const acte of texte.actes) {
      assert.match(acte.date, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(acte.libelle.length > 0);
      assert.ok(acte.code.length > 0);
    }
  }
});

test("l'archive sépare les devoirs contrôlés des textes suivis v2", async () => {
  const { app } = await application();
  assert.match(app.innerHTML, /Devoirs publiés/);
  assert.match(app.innerHTML, /Textes suivis/);
  assert.match(app.innerHTML, /class="v2"/);
  assert.match(app.innerHTML, /secteur nucléaire/);
  assert.match(app.innerHTML, /#\/suivi\/DLR5L17N55122/);
});

test("la recherche filtre les titres publiés et suivis sans appel réseau", async () => {
  const env = await application("#/recherche");
  assert.match(env.app.innerHTML, /<input[^>]+id="recherche"/);
  const avant = env.requetes.length;
  await env.saisir("nucléaire");
  assert.match(env.resultats.innerHTML, /secteur nucléaire/);
  assert.doesNotMatch(env.resultats.innerHTML, /port du casque/);
  assert.equal(env.requetes.length, avant);
});

test("une fiche suivie expose les actes et trois sections non documentées", async () => {
  const { app } = await application("#/suivi/DLR5L17N55122");
  assert.match(app.innerHTML, /secteur nucléaire/);
  assert.match(app.innerHTML, /14 octobre 2026/);
  assert.match(app.innerHTML, /Chronologie/);
  for (const section of ["Débat", "Chiffres", "Vote"]) {
    assert.match(app.innerHTML, new RegExp(section));
  }
  assert.ok((app.innerHTML.match(/non documenté/g) || []).length >= 3);
  assert.doesNotMatch(app.innerHTML, /carte-vote/);
});

test("la route d'un devoir charge le fichier de la loi demandée", async () => {
  const env = await application("#/archive", true);
  await env.aller("#/devoir/deuxieme-loi");
  assert.ok(env.requetes.includes("data/lois/deuxieme-loi.json"));
  assert.match(env.app.innerHTML, /Deuxième loi réellement chargée/);
  assert.doesNotMatch(env.app.innerHTML, /Protection des enfants/);
});

test("le gate des lois publie les devoirs sans valider le corpus suivi comme une loi", () => {
  const resultat = spawnSync(process.execPath, ["scripts/verifier.mjs"], {
    cwd: RACINE,
    encoding: "utf8"
  });
  assert.equal(resultat.status, 0, resultat.stdout + resultat.stderr);
  assert.doesNotMatch(resultat.stdout, /data\\lois\\suivis\.json/);
});

test("le service worker précache les textes suivis pour le mode avion", async () => {
  const evenements = {};
  let fichiers = [];
  const contexte = {
    self: { addEventListener(type, callback) { evenements[type] = callback; } },
    caches: {
      async open() {
        return { async addAll(liste) { fichiers = liste; } };
      }
    },
    Promise,
    URL,
    location: { origin: "http://localhost" },
    fetch
  };
  vm.createContext(contexte);
  vm.runInContext(readFileSync(resolve(RACINE, "service-worker.js"), "utf8"), contexte);
  let installation;
  evenements.install({ waitUntil(promesse) { installation = promesse; } });
  await installation;
  assert.ok(fichiers.includes("./data/lois/suivis.json"));
});

let echecs = 0;
for (const { nom, fonction } of tests) {
  try {
    await fonction();
    console.log("OK", nom);
  } catch (erreur) {
    echecs++;
    console.error("ÉCHEC", nom);
    console.error(erreur.stack || erreur);
  }
}
console.log(`\n${tests.length - echecs}/${tests.length} tests réussis.`);
process.exitCode = echecs ? 1 : 0;
