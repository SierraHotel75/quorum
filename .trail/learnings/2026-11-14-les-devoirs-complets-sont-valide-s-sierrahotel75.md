---
title: Les devoirs complets sont validés sans approbation supplémentaire
author: SierraHotel75
date: 2026-11-14
branch: master
id: l-9b639c7c
scope: repo
status: active
touches:
  - AGENTS.md
  - data/ref/arbre.json
  - docs/captures/mobile-360-archive.png
  - docs/captures/mobile-360-recherche.png
  - docs/captures/mobile-390-archive.png
  - docs/captures/mobile-390-recherche.png
  - docs/demo.md
  - docs/presentation/deck-a.html
  - docs/presentation/plan-demo.md
  - index.html
---

## Decided
- Les fiches de `data/lois/` doivent ??tre compar??es au devoir local complet `data/lois/protection-enfants.json`, avec d??bat, chiffres et vote effectivement document??s, because l???utilisateur a d??sign?? ce fichier comme le meilleur comparatif ; le coordinateur les publie d??s que les contr??les et la relecture sont favorables.
- Le coordinateur ne doit pas attendre une validation utilisateur suppl??mentaire pour cette publication locale, because l???utilisateur a explicitement demand?? une validation directe et autonome ; les interdictions de commit et de push restent inchang??es.

## Tried and ruled out
- Un gate JSON vert seul ne suffit pas, because il ne d??tecte pas toutes les omissions factuelles ou juridiques ; la comparaison au mod??le et la relecture restent donc n??cessaires.
