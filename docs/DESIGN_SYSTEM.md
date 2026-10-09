# System wizualny — „Zeszyt Tenisisty”

> Cała gra to jeden zeszyt zawodnika, leżący na biurku obitym zielonym suknem w kolorze kortu. Żadnych ciemnych dashboardów, żadnych pasków postępu z aplikacji SaaS — wszystko ma swój odpowiednik w prawdziwym przedmiocie.

## Mapa metafor

| Element gry | Przedmiot w zeszycie |
|---|---|
| Menu główne | okładka zeszytu z naklejką „Własność:” i gumką, obok karteczki i karty katalogowe |
| Zapisy | trzy zeszyty na biurku |
| Nowa kariera | karta zgłoszenia zawodnika (pola do wpisania odręcznie, kratki do zaznaczenia) |
| Statystyki zawodnika | **legitymacja** na lewej stronie: polaroid, radar umiejętności, pogoda = forma, bateria = zmęczenie, mini-korty = czucie nawierzchni |
| Nawigacja w grze | kolorowe zakładki wystające z góry zeszytu |
| Trening | planer bloków: kolorowe kafelki wypełniają rząd pustych pól |
| Sztab | karty z cytatem trenera pisanym odręcznie |
| Sponsorzy | umowy przyklejone taśmą, z linią podpisu (podpis „pisze się” animacją) |
| Terminarz | turnieje jako **pieczątki pocztowe** — kolor tuszu = nawierzchnia, odbite = zaplanowane/rozegrane |
| Sezon | oś kółek z wynikami pisanymi długopisem + **protokół turnieju** jak arkusz sędziowski |
| Ważny mecz | **teczka skauta** + ręka **kart taktyk** (karty do gry z diagramem kortu) |
| Wydarzenia | listy (poza sezonem) i SMS-y na telefonie (w sezonie) |
| Koniec sezonu | wycinek z gazety o postrzępionych brzegach |
| Emerytura | **hasło w encyklopedii** generowane z kariery + pieczęć „Dorobek” |
| Osiągnięcia | gablota z drewnianymi półkami i mosiężnymi tabliczkami |
| Rakiety | stojak na rakiety z przywieszkami |

## Paleta (tokens.css)

| Token | Wartość | Rola |
|---|---|---|
| `--desk` | `#1e3a2c` | biurko / sukno w kolorze kortu |
| `--paper`, `--paper-2`, `--card` | `#f5f0e4`, `#ece5d3`, `#fbf8f0` | papier zeszytu, lewa strona, karty |
| `--grid`, `--rule` | granat 7,5% / 16% | kratka i linie |
| `--margin` | `#d65a4a` | czerwony margines, akcenty, ✓ |
| `--ink`, `--ink-2`, `--pencil` | `#1d2a47`, `#3c4864`, `#737b8c` | atrament i ołówek |
| `--highlight` | `#f6e35a` | zakreślacz — jedyny jaskrawy akcent (CTA, aktywna zakładka, tytuły) |
| `--clay`, `--grass`, `--hard`, `--indoor` | `#c4552d`, `#2f6b3a`, `#2f5f9e`, `#6b5aa6` | tusz pieczątek i kropki nawierzchni |

## Typografia

| Rola | Krój | Gdzie |
|---|---|---|
| Nagłówki, encyklopedia | **Instrument Serif** | tytuły stron, nazwy turniejów, hasło w encyklopedii |
| Interfejs | **IBM Plex Sans** | opisy, przyciski, tabele |
| Dane | **IBM Plex Mono** | etykiety, wyniki setów, punkty, protokoły |
| Odręczne | **Caveat** | podpisy, oceny, wyniki na osi sezonu, notatki skauta i trenera |

Fonty hostowane lokalnie (`@fontsource`, tylko latin + latin-ext).

## Komponenty

- **Przycisk** — obrys „rysowany piórem” (nierówny `border-radius`), po najechaniu cień offsetowy jak przesunięta kartka; warianty: atrament, zakreślacz, ostrzeżenie.
- **Wybór** (`.pick`) — karta, po zaznaczeniu czerwony odręczny ✓ i cień zakreślacza.
- **Kratka** (`.tick`) — natywny checkbox/radio z odręcznym ✓.
- **Stamp** — SVG z tekstem po okręgu, filtr `feTurbulence` daje nierówny tusz; nieodbita pieczątka = przerywany ołówek.
- **TacticCard** — karta do gry: przewaga w rogu, diagram kortu, motto odręczne, skala −4…+4 z rozrzutem, kreski ryzyka, trzy piłki mistrzostwa.
- **Radar** — 7 osi, kreskowanie atramentem, czerwone punkty pomiarowe.
- **Weather** — sześć ikon formy: burza, deszcz, chmura, przejaśnienia, słońce, upał.

## Ruch i dostępność

- Przejścia ekranów: View Transitions (kartka przesuwa się w bok), fokus na nagłówek ekranu po nawigacji.
- Protokół turnieju „spada” na stronę, podpis na umowie pisze się, kropka na zakładce pulsuje, gdy coś czeka na decyzję.
- `prefers-reduced-motion` + ustawienie gry (pełne / ograniczone / wyłączone).
- Natywny `<dialog>`, `aria-pressed` na wyborach, `aria-live` na prawej stronie zeszytu, wyraźny fokus (czerwona przerywana ramka).
- Układ: ≥ 1000 px — rozkładówka; poniżej strona bieżąca nad legitymacją; < 560 px — margines zwęża się, kafle w jednej kolumnie.
