# ADR 0002 — Monorepo TypeScript na npm workspaces

- Status: przyjęta
- Data: 2026-10-09

## Kontekst
Silnik, kontrakty API, serwer i klient muszą dzielić typy i kod bez publikowania paczek. Zespół jest mały; narzędzia powinny być proste.

## Decyzja
Jedno repozytorium z **npm workspaces** (`packages/*`, `apps/*`), TypeScript w trybie `strict` + `noUncheckedIndexedAccess`. Pakiety wewnętrzne (`@ttg/engine`, `@ttg/shared`) są „źródłowe” — eksportują pliki `.ts` bez kroku budowania. Vite (web) i tsup (api, `noExternal: /^@ttg\//`) wkompilowują je w artefakty. Testy: jeden Vitest dla całego repo.

Rozważane: pnpm + Turborepo (szybsze przy dużej liczbie pakietów, ale dodatkowe narzędzia przy 4 pakietach), osobne repozytoria (duplikacja typów, wersjonowanie paczek).

## Konsekwencje
- ➕ Zmiana typu w silniku od razu widoczna w API i UI; jedno `npm run ci`.
- ➕ Zero publikowania paczek, zero kroków `build` dla pakietów wewnętrznych w dev.
- ➖ Brak cache’owania zadań między pakietami — przy rozroście warto dołożyć Turborepo.
