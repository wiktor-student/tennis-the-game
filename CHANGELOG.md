# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/pl/1.1.0/) · wersjonowanie: [SemVer](https://semver.org/lang/pl/). Zmiany wpływające na wynik istniejących seedów oznaczamy **[engine]**.

## [2.0.0] — 2026-10-09 — „Zeszyt Tenisisty”

### Zmienione
- **Nowa tożsamość i interfejs:** gra nazywa się *Zeszyt Tenisisty*. Cały UI to zeszyt zawodnika na zielonym biurku — okładka jako menu, legitymacja z radarem umiejętności, zakładki, pieczątki turniejów, protokoły, listy i SMS-y, wycinki z gazet, gablota, hasło w encyklopedii. Nowe kroje: Instrument Serif, IBM Plex Sans/Mono, Caveat.
- **[engine] Talia taktyk zamiast decyzji w trakcie meczu:** przed ważnym meczem raport skauta (styl rywala, siła, ręka, nawierzchnia) i wybór jednej z 12 kart planu gry. Karty mają skuteczność wobec stylów, ryzyko (rozrzut w secie) i mistrzostwo zdobywane wygranymi. Uczą ich trenerzy.
- **[engine] Trening blokowy:** zamiast jednego skilla — 5–7 bloków do rozdzielenia między umiejętności (malejące zyski), odpoczynek i naukę nowych kart; plan na co dzień gra w zwykłych meczach.
- „LEGACY” w interfejsie to teraz **Dorobek**; „Kariera Dnia” to **Zawodnik dnia**.
- Osiągnięcia: usunięte „Instynkt”, dodane „Taktyk”, „Pełna talia”, „Gracz na wielkie mecze” (razem 50).

### Usunięte
- Sytuacje meczowe i ruletka szans (zastąpione taktykami).

## [1.0.0] — 2026-10-09

### Dodane
- Pełna ścieżka kariery: Tenis 10 → ranking krajowy → Tennis Europe → ITF Juniors → zawodowstwo (ITF, Challengery, 250/500/1000, Wielkie Szlemy, Finały, Igrzyska) — 195 turniejów w kalendarzach.
- Model meczu punkt po punkcie z nawierzchniami, tie-breakami, best-of-5 w Szlemach mężczyzn, punktami pod presją.
- Rolling ranking 52 tygodni dla 420 zawodników AI, cutoffy, kwalifikacje, dzikie karty, junior exempt.
- Decyzje meczowe z ruletką szans (super / sukces / porażka), 19 sytuacji.
- 41 wydarzeń fabularnych, Nemesis z juniorów, sponsorzy (19 marek fikcyjnych), sztab, ekonomia, kontuzje, forma sezonu.
- LEGACY, 13 werdyktów, 48 osiągnięć, 15 malowań rakiet, Muzeum kariery.
- Kariera Dnia (jedno podejście), cele dnia, wyzwanie tygodnia, seria.
- API: konta anonimowe, weryfikacja replayem w workerach, rankingi dzień/tydzień/wszech czasów, panujący mistrzowie.
- Interfejs PL/EN, tryb offline, ustawienia animacji i tempa symulacji.
