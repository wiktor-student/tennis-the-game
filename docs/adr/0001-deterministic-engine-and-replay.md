# ADR 0001 — Deterministyczny silnik i weryfikacja przez replay

- Status: przyjęta
- Data: 2026-10-09

## Kontekst
Gra ma rankingi online, ale rozgrywka musi działać płynnie i offline w przeglądarce. Jeśli wynik kariery liczy klient, łatwo go sfałszować. Jeśli liczy go serwer krok po kroku, każda decyzja wymaga zapytania sieciowego (opóźnienia, brak offline, koszt serwera).

## Decyzja
Cała symulacja to czysty, deterministyczny reducer w pakiecie `@ttg/engine`, współdzielonym przez klienta i serwer. Losowość pochodzi wyłącznie z seedowanego PRNG, którego stan jest częścią stanu kariery. Serwer wydaje seed na start kariery, a po jej zakończeniu otrzymuje log akcji gracza i odtwarza karierę sam (replay) — wynik klienta jest ignorowany.

## Konsekwencje
- ➕ Rozgrywka bez opóźnień i offline; serwer liczy tylko raz na karierę (~1 s CPU w workerze).
- ➕ Zapis gry = seed + log akcji (+ snapshot dla szybkości); pełna audytowalność wyników.
- ➕ Te same testy sprawdzają grę i weryfikację.
- ➖ Każda zmiana wpływająca na wynik wymaga podbicia `ENGINE_VERSION`; kariery rozpoczęte na starej wersji nie przejdą weryfikacji.
- ➖ Gracz może lokalnie przeszukiwać decyzje dla znanego seeda (patrz model zaufania w ARCHITECTURE.md); Kariera Dnia jest chroniona zasadą jednego podejścia rejestrowanego przy starcie.
- ➖ Zakaz `Math.random`/`Date` w silniku musi być pilnowany w code review.
