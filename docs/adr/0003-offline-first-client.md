# ADR 0003 — Klient offline-first, React + Vite + Zustand

- Status: przyjęta
- Data: 2026-10-09

## Kontekst
Gra to sekwencja ekranów decyzji z dużą ilością tekstu i tabel. Musi działać bez serwera (np. hosting statyczny, brak sieci), a z serwerem — oferować rankingi.

## Decyzja
- **React 18 + Vite** — dojrzały ekosystem, szybki dev server, prosty build statyczny.
- **Zustand** zamiast Reduxa — logika domenowa jest w silniku; store’y tylko wołają `step()`, persystują i synchronizują z API.
- **HashRouter** — działa na każdym statycznym hostingu bez reguł rewrite.
- **CSS z tokenami** zamiast frameworka CSS/komponentów — pełna kontrola nad estetyką „tablicy wyników”, mały bundle, brak generycznego wyglądu.
- **localStorage**: slot = `{config, seed, actions, snapshot}`; przy braku miejsca zapis bez snapshotu (odtwarzany replayem).
- API jest opcjonalne (`VITE_API_URL`); bez niego gra działa w pełni lokalnie.

## Konsekwencje
- ➕ Natychmiastowa rozgrywka, brak zależności od dostępności serwera.
- ➕ Bundle ~160 kB gzip.
- ➖ Zapisy są per przeglądarka (przeniesienie między urządzeniami — roadmapa v2.0).
