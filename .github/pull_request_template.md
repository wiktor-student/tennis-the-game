## Co i dlaczego

<!-- Krótki opis zmiany i motywacji. -->

## Rodzaj zmiany
- [ ] Funkcja gry / treść
- [ ] Balans (dołączam `npm run balance -- 40` przed i po)
- [ ] Poprawka błędu
- [ ] Infrastruktura / dokumentacja

## Checklista
- [ ] `npm run ci` przechodzi lokalnie
- [ ] Teksty w PL i EN, odmiana przez płeć (`[[m|f]]`)
- [ ] Zmiana wpływa na wynik istniejących seedów → podbity `ENGINE_VERSION` + wpis w `CHANGELOG.md`
- [ ] Zmiana schematu bazy → nowa migracja Prisma + aktualizacja `docs/DATABASE.md`
