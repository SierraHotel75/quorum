/* Quorum — service worker.
   L'application doit fonctionner sans lui : il ne fait qu'accélérer et
   permettre le mode avion. Toute erreur ici est rattrapable en le désactivant. */

var CACHE = "quorum-v21";

var FICHIERS = [
  "./",
  "./index.html",
  "./styles/tokens.css",
  "./styles/app.css",
  "./js/hemicycle.js",
  "./js/app.js",
  "./data/ref/groupes.json",
  "./data/ref/arbre.json",
  "./data/lois/index.json",
  "./data/lois/protection-enfants.json",
  "./manifest.json",
  "./assets/icone.svg",
  "./assets/icone-maskable.svg"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(function (cache) {
        return cache.addAll(FICHIERS);
      })
      .then(function () {
        return self.skipWaiting();
      })
      .catch(function () {
        /* un fichier manquant ne doit pas bloquer l'installation */
      })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (noms) {
        return Promise.all(
          noms
            .filter(function (n) {
              return n !== CACHE;
            })
            .map(function (n) {
              return caches.delete(n);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", function (event) {
  var requete = event.request;
  if (requete.method !== "GET") return;

  var url = new URL(requete.url);
  if (url.origin !== location.origin) return;

  /* Réseau d'abord, cache en secours : en développement on voit tout de suite
     une modification, hors ligne l'application continue de tourner. */
  event.respondWith(
    fetch(requete, { cache: "no-store" })
      .then(function (reponse) {
        if (reponse && reponse.ok) {
          var copie = reponse.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(requete, copie);
          });
        }
        return reponse;
      })
      .catch(function () {
        return caches.match(requete, { ignoreSearch: true }).then(function (enCache) {
          return enCache || caches.match("./index.html");
        });
      })
  );
});

