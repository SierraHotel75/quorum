#!/usr/bin/env node
/* Quorum — capture et mesure mobile sans dépendance.
   Pilote le Chrome installé par le protocole DevTools : émulation 390 et 360 px,
   mesure du débordement horizontal, captures pour les slides.

   Usage : node scripts/mobile.mjs [route ...]
   Sortie : docs/captures/mobile-<largeur>-<route>.png + tableau dans la console. */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 9333;
const CHROMES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
].filter(Boolean);
const chrome = CHROMES.find((p) => existsSync(p));
if (!chrome) {
  console.error("Chrome introuvable : définir CHROME_PATH.");
  process.exit(1);
}

const ROUTES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      "",
      "devoir/protection-enfants/vote",
      "devoir/protection-enfants/carte",
      "devoir/protection-enfants/article",
      "devoir/protection-enfants/presse"
    ];
const LARGEURS = [390, 360];
const profil = join(tmpdir(), "quorum-chrome-" + process.pid);

const enfant = spawn(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-first-run",
  "--remote-debugging-port=" + PORT,
  "--user-data-dir=" + profil,
  "about:blank"
], { stdio: "ignore" });

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

async function navigateur() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      return (await r.json()).webSocketDebuggerUrl;
    } catch {
      await attendre(250);
    }
  }
  throw new Error("Chrome n'a pas ouvert son port de débogage");
}

const ws = new WebSocket(await navigateur());
await new Promise((ok, ko) => {
  ws.addEventListener("open", ok, { once: true });
  ws.addEventListener("error", ko, { once: true });
});

let suivant = 0;
const attentes = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && attentes.has(m.id)) {
    attentes.get(m.id)(m);
    attentes.delete(m.id);
  }
});

function envoyer(methode, params = {}, sessionId) {
  const id = ++suivant;
  ws.send(JSON.stringify({ id, method: methode, params, sessionId }));
  return new Promise((ok, ko) => {
    attentes.set(id, (m) => (m.error ? ko(new Error(method + " : " + m.error.message)) : ok(m.result)));
  });
}

async function evaluer(expression, sessionId) {
  const r = await envoyer("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, sessionId);
  return r.result.value;
}

const { targetId } = await envoyer("Target.createTarget", { url: "about:blank" });
const { sessionId } = await envoyer("Target.attachToTarget", { targetId, flatten: true });
await envoyer("Page.enable", {}, sessionId);
await envoyer("Page.navigate", { url: `http://127.0.0.1:8000/?m=init#/` }, sessionId);
await attendre(1200);
await evaluer(
  `localStorage.setItem("quorum.v1", JSON.stringify({version:1,votes:{},progres:{},intro:true}))`,
  sessionId
);

mkdirSync(join(RACINE, "docs", "captures"), { recursive: true });
const lignes = [];

for (const largeur of LARGEURS) {
  await envoyer("Emulation.setDeviceMetricsOverride",
    { width: largeur, height: 844, deviceScaleFactor: 2, mobile: true }, sessionId);
  await envoyer("Emulation.setTouchEmulationEnabled", { enabled: true }, sessionId);

  for (const route of ROUTES) {
    await envoyer("Page.navigate",
      { url: `http://127.0.0.1:8000/?w=${largeur}#/${route}` }, sessionId);
    let pret = false;
    for (let i = 0; i < 40 && !pret; i++) {
      await attendre(150);
      pret = (await evaluer(`document.body.innerText.length > 40`, sessionId)) === true;
    }
    await attendre(300);

    const mesure = JSON.parse(await evaluer(`JSON.stringify({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
      largeur: window.innerWidth,
      trop: Array.from(document.querySelectorAll("body *"))
        .filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.right > window.innerWidth + 1; })
        .slice(0, 4).map(e => (e.className || e.tagName) + " r=" + Math.round(e.getBoundingClientRect().right))
    })`, sessionId));

    const nuance = pret ? "" : " (contenu absent)";
    const deborde = mesure.scroll > mesure.client ? "DÉBORDE" : "ok";
    lignes.push({ largeur, route: route || "accueil", vue: mesure.largeur, scroll: mesure.scroll, etat: deborde + nuance, trop: mesure.trop });

    const nom = "mobile-" + largeur + "-" + (route.split("/").pop() || "accueil") + ".png";
    const shot = await envoyer("Page.captureScreenshot", { format: "png" }, sessionId);
    writeFileSync(join(RACINE, "docs", "captures", nom), Buffer.from(shot.data, "base64"));
  }
}

console.table(lignes);
const pb = lignes.filter((l) => l.etat !== "ok");
ws.close();
enfant.kill();
try { rmSync(profil, { recursive: true, force: true }); } catch {}
if (pb.length) {
  console.error(`${pb.length} écran(s) en défaut.`);
  process.exit(1);
}
console.log(`${lignes.length} écrans mesurés, aucun débordement.`);
