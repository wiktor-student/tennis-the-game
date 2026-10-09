# ADR 0004 — PostgreSQL + Prisma + Fastify

- Status: przyjęta
- Data: 2026-10-09

## Kontekst
Backend obsługuje konta anonimowe, rankingi okresowe, osiągnięcia i weryfikację karier. Rankingi to zapytania „najlepsza kariera gracza w okresie”, potrzebne są transakcje (Kariera Dnia: kariera + podejście atomowo) i JSON dla podsumowań.

## Decyzja
- **PostgreSQL** — `DISTINCT ON`, indeksy złożone z kierunkiem sortowania, `jsonb`, transakcje.
- **Prisma** — typowany klient, migracje SQL w repozytorium, czytelny schemat jako dokumentacja. Rankingi przez `$queryRaw` z `Prisma.sql` (parametryzowane).
- **Fastify 5** — wydajność, hooki (auth), pluginy rate-limit/helmet/CORS, łatwe testy przez `inject`.
- **worker_threads** do replayu — CPU-bound praca poza pętlą zdarzeń.

Rozważane: SQLite (prostsze, ale słabsze przy współbieżnych zapisach i brak `DISTINCT ON`), Redis na rankingi (zbędny przy tej skali — indeksy wystarczą).

## Konsekwencje
- ➕ Proste wdrożenie (jeden kontener API + Postgres), migracje przy starcie kontenera.
- ➕ Zdenormalizowane kolumny wyniku w `Career` → rankingi bez parsowania JSON.
- ➖ Przy bardzo dużym ruchu rankingi warto materializować (widok/cache) — opisane w ROADMAP.
