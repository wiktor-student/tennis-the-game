# System wizualny

> „Sesja nocna na korcie centralnym.” Gra ma wyglądać jak tablica wyników i program turniejowy, nie jak panel SaaS.

## Kierunek

| Element | Decyzja | Dlaczego |
|---|---|---|
| Tło | głęboka zieleń trawy (`#0a1510` → `#11241b`) | kort trawiasty nocą, tradycja All England Club |
| Linie | kremowa „kreda” (`#efe9d8`, ramki paneli jak linie kortu) | linie kortu, papier programu turniejowego |
| Akcent | optyczna żółć piłki (`#d8ef4a`) — **tylko** CTA, OVR, LEGACY, tytuły | jedna głośna rzecz na ekranie, jak piłka |
| Nawierzchnie | mączka `#c8643b`, trawa `#4f9a4a`, twarda `#3f78bf`, hala `#8676c4` | kolor zawsze niesie znaczenie |
| Wielki Szlem | fiolet `#6c4a93` | prestiż, kolorystyka Wimbledonu |
| Wynik decyzji | super `#a98bdb`, sukces `#5fae69`, porażka `#c98b3a` | czytelne i rozróżnialne także w słabym kontraście |

## Typografia

| Rola | Krój | Użycie |
|---|---|---|
| Display / liczby | **Barlow Condensed** 500–700, wersaliki, tracking | tablica wyników: OVR, statystyki, etykiety, przyciski |
| Narracja | **Source Serif 4** 400/600, kursywa | wydarzenia, sytuacje meczowe, nagłówki gazet, werdykt |
| Interfejs | **Barlow** 400–600 | opisy, tabele, formularze |

Fonty są hostowane lokalnie (`@fontsource`, tylko podzbiory latin + latin-ext — polskie znaki). Cyfry tabelaryczne (`font-feature-settings: 'tnum'`) wszędzie, gdzie są liczby.

## Tokeny

Wszystkie wartości w [`apps/web/src/styles/tokens.css`](../apps/web/src/styles/tokens.css): kolory (`--bg`, `--panel*`, `--line*`, `--chalk*`, `--ball`, nawierzchnie, wyniki), fonty, rozmiary, promienie, odstępy, krzywa `--ease-out`. Komponenty nie używają surowych wartości kolorów poza tokenami.

## Motywy graficzne

- **Kort w perspektywie** (`CourtArt.tsx`) — linie boczne, serwisowe, siatka, pasy koszenia, odbijająca się piłka.
- **Rakieta** (`Racket.tsx`) — SVG z naciągami, malowanie z kolekcji (rama, akcent, owijka).
- **Tablica wyników** — HUD z OVR w „okienku” jak na tablicy, statystyki w ciemnych komórkach.
- **Gazeta** — nagłówek sezonu na kremowym papierze, podwójna linia pod tytułem gazety, lekki obrót.
- **Ruletka szans** — 40 komórek super/sukces/porażka, znacznik przesuwa się do wyniku wylosowanego przez silnik.
- **Bez emoji.** Ikonografia to kształty CSS/SVG (medale osiągnięć, puchary, kropki nawierzchni, flaga PL).

## Ruch

- Przejścia ekranów: View Transitions API (progresywnie), fokus przenoszony na nagłówek ekranu.
- `prefers-reduced-motion` respektowane per animacja; dodatkowo ustawienie gry: **pełne / ograniczone / wyłączone** (`data-motion` na `<html>`).
- Animujemy tylko `opacity`, `translate`, `width` pasków — nic, co wymusza przeliczenie layoutu całej strony.

## Responsywność

- ≥ 900 px: sidebar 300 px + panel główny.
- < 900 px: panel główny nad sidebarem, HUD łamie statystyki do osobnego wiersza.
- < 560 px: roadmapa ukrywa odznaki rangi, siatki kafli przechodzą na 2 kolumny, formularze na 1.
- Cel dotyku ≥ 44 px dla przycisków.

## Dostępność

Natywny `<dialog>` + `showModal()` (fokus, Esc, warstwa top-layer), `aria-pressed` na wyborach, `aria-live="polite"` w panelu rozgrywki, kontrast tekstu na tłach ≥ 4,5:1 dla treści, widoczny `:focus-visible` w kolorze piłki.
