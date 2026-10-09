# Game Design Document — Zeszyt Tenisisty

> Wersja dokumentu: 2.0 · silnik: `ENGINE_VERSION = 2.0.0`
> Dokument opisuje **zamysł gry** — pętle, systemy, liczby i ton. Szczegóły implementacyjne silnika są w [ENGINE.md](./ENGINE.md), model danych w [DATABASE.md](./DATABASE.md).

---

## 1. Wizja w jednym akapicie

Masz 8 lat. Tata naciągnął w piwnicy starą rakietę, mama mówi, że to „tylko hobby”. Grasz o każdy punkt — najpierw pod blokiem, potem w regionalnych turniejach Tenis 10, w Mistrzostwach Polski, na wyjazdach Tennis Europe, w juniorskich Szlemach, aż w końcu w kwalifikacjach do ITF-ów za 15 tysięcy dolarów puli. Każdy sezon to decyzje: **co trenujesz, kogo zatrudniasz, które turnieje grasz, które kontrakty podpisujesz i jaką kartę planu gry wyciągasz przed finałem**. Wszystko zapisuje się w jednym zeszycie — od pierwszej strony z wiekiem „8” po hasło w encyklopedii. Historia ocenia cię jedną liczbą: **Dorobkiem**.

**Gatunek:** tekstowy symulator kariery (career sim / „idle-decision RPG”), sesja 10–25 minut na całą karierę.
**Punkt wyjścia:** gatunek krótkich symulatorów kariery z czytelnymi szansami i wspólnymi rankingami. Autorskie wyróżniki: **metafora zeszytu zawodnika** (cały interfejs to jeden zeszyt na zielonym biurku), **talia kart taktyk** czytana przez raport skauta, **trening blokowy** zamiast wyboru jednego skilla.
**Platforma:** przeglądarka (desktop + mobile), offline-first, opcjonalne rankingi online.

## 2. Filary projektu

1. **Każda decyzja ma cenę i szansę.** Gracz zawsze widzi procent sukcesu przed wyborem — losowość jest uczciwa i deterministyczna (seed).
2. **Tenis, nie abstrakcja.** Prawdziwa struktura punktów/gemów/setów/tie-breaków, nawierzchnie, rolling ranking 52 tygodni, cutoffy wejścia do turniejów, kwalifikacje, dzikie karty, best-of-5 w Szlemach mężczyzn.
3. **Polska perspektywa.** Rodzinne finanse, PZT, korty w hali pneumatycznej, Szczecin i Poznań w kalendarzu, media, które raz cię kochają, raz piszą „kolejny talent, który się nie przebił”.
4. **Krótko, ale głęboko.** Cała kariera mieści się w przerwie obiadowej, a mimo to systemy (forma, zmęczenie, kontuzje, sztab, sponsorzy, kalendarz) dają tysiące różnych historii.
5. **Rywalizacja asynchroniczna.** Kariera Dnia — wszyscy dostają ten sam seed i tego samego zawodnika; liczy się pierwsze podejście.

## 3. Pętla gry

```
                ┌────────────────────────── KARIERA ───────────────────────────┐
                │                                                              │
 Karta          │  POZA SEZONEM                         SEZON                   │ → Hasło w
 zgłoszenia →   │  1. Wycinek z gazety (podsumowanie)   6. Turniej po turnieju  │   encyklopedii
 (imię, tour,   │  2. List od bliskich (wybór)          7. Raport skauta przed  │ → Dorobek
  start, poziom)│  3. Trening: rozdziel bloki,             ważnym meczem →      │ → Tablica wyników
                │     naucz się nowej karty taktyki        zagraj kartę taktyki │ → Gablota
                │  4. Sztab (kto czego uczy)            8. Protokół turnieju    │
                │  5. Umowy + terminarz (pieczątki)     9. Wiadomości w sezonie │
                │                                                              │
                └───────────────────── wiek +1, kolejny sezon ─────────────────┘
```

Jeden sezon = jeden rok kalendarzowy. Gracz zaczyna w wieku 8 lat (sezon 2026) i może grać do 38 lat — maksymalnie 31 sezonów, typowo 20–26.

## 4. Tworzenie kariery

| Pole | Opcje | Wpływ |
|---|---|---|
| Imię i nazwisko | dowolne / „Wylosuj” (generator polskich imion i nazwisk wg płci) | kosmetyka |
| Tour | **ATP** (chłopak) / **WTA** (dziewczyna) | osobne pule rywali, nazwy kategorii, best-of-5 w Szlemach tylko ATP |
| Punkt startowy | patrz niżej | potencjał, budżet, mnożnik wyniku |
| Poziom trudności | Normalny ×1,0 / Trudny ×1,10 | sponsorzy –30%, koszty +20%, ryzyko kontuzji +30% |

### Punkty startowe

| ID | Nazwa | Opis | Potencjał | Budżet | Mnożnik LEGACY |
|---|---|---|---|---|---|
| `wall` | **Ściana za blokiem** | Talent losowy, w portfelu pusto. | 55–95 | 15 tys. zł | ×1,0 |
| `sponsor_kid` | **Dziecko prezesa** | Pieniądze i kamery są, talent jak wypadnie. | 45–90 | 120 tys. zł, media +15 | ×1,0 |
| `academy` | **Talent z akademii** | Talent ponad przeciętną, pieniędzy tyle, co trzeba. | 75–95 | 40 tys. zł, skille +5 | ×0,6 |
| `chosen` | **Wybraniec** | Talent nie z tej ziemi — tytuły przychodzą same. | 97–99 | 80 tys. zł | BEZ RANKINGU |

**Zaplecze finansowe rodziny** jest ukryte i losowane (brak / skromne / solidne → 0 / 12 / 30 tys. zł rocznie wsparcia). Gracz poznaje je „przy pierwszych rachunkach” — w raporcie budżetu pierwszego sezonu.

**Warunki fizyczne** (wzrost) są losowane na starcie, ale ujawniane dopiero wydarzeniem w wieku 15 lat („Rośniesz: 193 cm”). Wysoki zawodnik ma wyższy sufit serwisu, niski — lepszą kondycję i bekhend.

## 5. Zawodnik

### 5.1 Umiejętności (skille, 1–100)

| ID | PL | EN | Co robi w symulacji |
|---|---|---|---|
| `serve` | Serwis | Serve | szansa wygrania punktu przy własnym podaniu |
| `return` | Return | Return | odbieranie serwisu, breaki |
| `forehand` | Forhend | Forehand | wymiany, siła ataku, część serwisu (+1) |
| `backhand` | Bekhend | Backhand | wymiany, obrona, return |
| `net` | Gra przy siatce | Net play | trawa, serve-and-volley, decyzje „do siatki” |
| `fitness` | Kondycja | Fitness | zmęczenie, długie mecze, mączka, ryzyko kontuzji |
| `mental` | Psychika | Mental | punkty pod presją (break pointy, tie-breaki, decydujący set) |

**OVR** = 0,18·serwis + 0,16·return + 0,18·forhend + 0,15·bekhend + 0,08·siatka + 0,12·kondycja + 0,13·psychika.

### 5.2 Ukryte cechy

- **Potencjał** (per skill) — sufit rozwoju; tło + losowy profil („bombardier”, „ściana”, „artysta siatki”).
- **Wzrost** — modyfikuje potencjał serwisu (+0,4 pkt / cm powyżej 185) i kondycji.
- **Ręka** — prawo-/leworęczny (leworęczni: +1,5% punktów przy serwisie na returnie rywala, bo „rywale nie są przyzwyczajeni”).

### 5.3 Stan zawodnika

| Parametr | Zakres | Znaczenie |
|---|---|---|
| Forma sezonu | Kryzys formy … Sezon życia | losowana na starcie sezonu (psychika i morale przesuwają rozkład), ±4% punktów |
| Zmęczenie | 0–100 | rośnie z każdym setem, spada w tygodnie przerwy; podnosi ryzyko kontuzji |
| Kontuzja | brak / X tygodni | wyklucza z turniejów, poważne obniżają kondycję |
| Morale | 0–100 | wpływa na losowanie formy i niektóre decyzje |
| Media | 0–100 | dzikie karty, oferty sponsorskie |
| Reputacja | 0–100 | zaproszenia, jakość trenerów, sponsorzy premium |
| Nawierzchnie | 0–100 ×3 (mączka/trawa/twarda) | biegłość rośnie z rozegranymi meczami na danej nawierzchni |

### 5.4 Rozwój

Na koniec każdego sezonu każdy skill rośnie wg wzoru:

```
przyrost = (potencjał − skill) × 0,14 × współczynnikWieku × mnożnikTrenera × losowość(0,8–1,2)
```

| Wiek | 8–12 | 13–16 | 17–20 | 21–24 | 25–28 | 29–31 | 32+ |
|---|---|---|---|---|---|---|---|
| współczynnik | 1,0 | 1,15 | 1,0 | 0,75 | 0,35 | spadek –0,5…–1,5 | spadek –1…–3 |

Kondycja spada szybciej (od 29 lat).

### 5.5 Trening blokowy (zima)

Każdej zimy gracz rozdziela **bloki treningowe** (5, +1 z akademią lub lepszym trenerem, +1 z trenerem przygotowania fizycznego):

| Przeznaczenie | Efekt |
|---|---|
| Blok na umiejętność | `bonus_trenera × max(0,45; f(wiek)) × 0,3 × zapas_do_potencjału` — **każdy kolejny blok na ten sam skill działa słabiej** (1 · 0,75 · 0,56 · 0,42…) |
| Odpoczynek | −6 zmęczenia, +3 humoru, −7% ryzyka kontuzji w sezonie (za blok) |
| Nowa karta taktyki | 2 bloki — tylko karty, których uczy obecny trener |

Do tego wybór **planu na co dzień** — karty, którą zawodnik gra „na autopilocie” w zwykłych meczach (z połową siły). Decyzja zimowa to więc kompromis: wąska specjalizacja kontra wszechstronność kontra zdrowie kontra rozbudowa talii.

## 6. Ścieżka kariery — od bloku do Wimbledonu

| Etap | Wiek | Rozgrywki | Turnieje / sezon | Drabinka | Ranking |
|---|---|---|---|---|---|
| 1. **Tenis 10** | 8–10 | turnieje regionalne PZT (Orlik / Tenis 10), Mistrzostwa Polski Skrzatów | 6 | 16 | punkty sezonu wśród 39 rywali |
| 2. **Ranking krajowy** | 11–13 | turnieje ogólnopolskie kat. A/B, Halowe i Letnie Mistrzostwa Polski | 8 | 32 | punkty sezonu |
| 3. **Tennis Europe** | 14–15 | kat. 3/2/1 i Super Category: Les Petits As (Tarbes), Avvenire (Mediolan), Mistrzostwa Europy | 9 | 32 | punkty sezonu (pula europejska) |
| 4. **ITF Juniors** | 16–17 | J60–J500, Orange Bowl, **juniorski Australian Open, Roland Garros, Wimbledon, US Open** | 10 | 32 / 64 | ranking juniorów ITF |
| 5. **Zawodowstwo** | 18+ | ITF M15/M25 (W15/W35), Challengery / WTA 125, ATP/WTA 250, 500, 1000, **Wielki Szlem**, Finały, Igrzyska | plan gracza (do ~25) | 32–128 | **rolling ranking 52 tygodni**, best 19 wyników |

**Awans** między etapami następuje z wiekiem. Zawodnik z TOP 3 swojej klasyfikacji może dostać propozycję **wcześniejszego awansu** (wydarzenie). W wieku 17 lat pojawia się decyzja **„Przejść na zawodowstwo?”** — rok wcześniej w zawodowym tourze to szybszy ranking, ale koniec juniorskich szans na Szlema juniorów.

**Rangi turniejów mają znaczenie od pierwszego sezonu.** Turniej regionalny, kat. B czy J60 zbiera słabszą część rówieśników, a Mistrzostwa Polski, Super Category czy juniorski Szlem — najlepszych. Ośmiolatek z podwórka zaczyna od turniejów lokalnych i dopiero potem jedzie na mistrzostwa.

Rywale z juniorów są **trwali**: ten sam „Kacper Wiśniewski”, który ogrywał cię w Tenis 10, może być twoim rywalem w finale Challengera w Szczecinie 12 lat później. Najgroźniejszy z nich zostaje oznaczony jako **Nemesis** i ma własne wydarzenia.

## 7. Zawodowy tour

### 7.1 Kalendarz

Sezon zawodowy to **40 tygodni turniejowych** (styczeń–listopad). W każdym tygodniu dostępne są zwykle 2–4 turnieje różnych rang (np. tydzień Rzymu: Masters 1000 Rzym, Challenger w Turynie, ITF M25 w Polsce). Kalendarz bazuje na realnym kalendarzu 2026 (uproszczonym), z polskimi akcentami: **Challenger Wrocław** (luty, hala), **Poznań Open** (czerwiec, mączka), **Pekao Szczecin Open** (wrzesień, mączka), **ITF-y w Bytomiu, Kozerkach, Gdyni**, a dla WTA **Warsaw Open** i **Polish Open**.

Gracz układa plan sezonu w ekranie **„Plan sezonu”**: zaznacza tygodnie, w których gra, i wybiera turniej. Przy każdym turnieju zeszyt pokazuje **prognozę**: szansę na wygranie pierwszego meczu z typowym rywalem i ocenę (*faworyt / wyrównany / outsider / bez szans*). Przycisk **„Ułóż za mnie”** wybiera turnieje o najwyższych oczekiwanych punktach. W trakcie sezonu karta **„Następny przystanek”** pokazuje drogę wejścia (drabinka / kwalifikacje / dzika karta), typowego rywala, szansę i typowy wynik, a protokół po porażce wyjaśnia, czy rywal był po prostu silniejszy. Obsady są realistyczne: ITF M15 grają zawodnicy z miejsc ~350–3000, a nie czołowa setka. Ograniczenia:

- **Wejście**: ranking ≤ cutoff turnieju → drabinka główna; ranking ≤ cutoff kwalifikacji → kwalifikacje; w przeciwnym razie tylko **dzika karta** (szansa zależna od mediów i reputacji, wyższa w turniejach w Polsce).
- **Koszty**: każdy wyjazd kosztuje (Europa < Ameryki < Azja/Australia), od rangi 250 wzwyż organizator pokrywa hotel.
- **Zmęczenie**: granie 4+ tygodni pod rząd podnosi ryzyko kontuzji.

### 7.2 Rangi turniejów i punkty (zwycięzca / finał / półfinał / ćwierćfinał / 1/8 / 1/16 / 1/32 / 1/64)

| Ranga (ATP / WTA) | W | F | SF | QF | R16 | R32 | R64 | R128 | Drabinka | Cutoff MD / Q |
|---|---|---|---|---|---|---|---|---|---|---|
| Wielki Szlem | 2000 | 1300 | 800 | 400 | 200 | 100 | 50 | 10 | 128 | 104 / 230 |
| Masters 1000 / WTA 1000 | 1000 | 650 | 400 | 200 | 100 | 50 | 30 | — | 64 | 50 / 110 |
| ATP 500 / WTA 500 | 500 | 330 | 200 | 100 | 50 | 25 | — | — | 32 | 40 / 90 |
| ATP 250 / WTA 250 | 250 | 165 | 100 | 50 | 25 | 13 | — | — | 32 | 80 / 180 |
| Challenger 175 / W100 | 175 | 90 | 50 | 25 | 13 | 6 | — | — | 32 | 130 / 260 |
| Challenger 125 / WTA 125 | 125 | 64 | 35 | 16 | 8 | 5 | — | — | 32 | 190 / 360 |
| Challenger 75 / W75 | 75 | 44 | 22 | 12 | 6 | 3 | — | — | 32 | 280 / 520 |
| ITF M25 / W35 | 25 | 16 | 8 | 3 | 1 | 0 | — | — | 32 | 650 / ∞ |
| ITF M15 / W15 | 15 | 8 | 4 | 2 | 1 | 0 | — | — | 32 | ∞ |
| ATP / WTA Finals | 200 za zwycięstwo w grupie, +400 SF, +500 F | | | | | | | | 8 (2 grupy) | TOP 8 rankingu |
| Igrzyska Olimpijskie (2028, 2032, 2036) | medale zamiast punktów | | | | | | | | 64 | TOP 56 + 1 os./kraj z 2 |

Kwalifikacje: 2 rundy (3 w Szlemach), przejście daje punkty za kwalifikację (Szlem 25, 1000: 20, 500: 20, 250: 12, Challenger: 6, ITF: 1).

### 7.3 Ranking

Rolling ranking: suma **19 najlepszych wyników z ostatnich 52 tygodni**. Ranking przeliczany co tydzień dla ~400 zawodników puli AI + gracza. Liczymy **tygodnie na pozycji nr 1** i **ranking na koniec roku**. TOP 8 na koniec sezonu gra w Finałach.

### 7.4 Pieniądze

Pule nagród (w przeliczeniu na złotówki, kurs 4,0) — zwycięzca: Szlem 12 mln, 1000: 4 mln, 500: 1,6 mln, 250: 450 tys., Challenger 175: 120 tys., 125: 85 tys., 75: 50 tys., ITF M25: 16 tys., M15: 10 tys. Odpadnięcie w 1. rundzie Szlema to ~400 tys. zł — dlatego **wejście do drabinki Szlema to przełom finansowy kariery**.

Koszty sezonu: trener, fizjoterapeuta, podróże, naciągi i sprzęt, wpisowe juniorskie. Budżet poniżej **–150 tys. zł** na koniec sezonu w zawodowstwie oznacza **koniec kariery na długach** (chyba że wydarzenie „rodzina sprzedaje działkę” uratuje sytuację).

## 8. Mecz — model symulacji

Każdy mecz zawodnika jest symulowany **punkt po punkcie**: gemy, sety, tie-break do 7 (w decydującym secie Szlema super tie-break do 10 przy 6:6). Mecze AI vs AI są symulowane **gem po gemie** z analitycznej szansy utrzymania podania.

Prawdopodobieństwo wygrania punktu przez serwującego:

```
p = baza[nawierzchnia]
  + 0,22 × (SerwisA − ReturnB) / 100
  + 0,15 × (WymianyA − WymianyB) / 100
  + 0,0012 × (BiegłośćNawierzchniA − BiegłośćNawierzchniB)
  + forma + dzieńMeczowy(±N(0; 0,02)) + momentum − zmęczenie
  [+ 0,0015 × (PsychikaA − PsychikaB) przy punktach pod presją]
```

| Nawierzchnia | baza | charakter |
|---|---|---|
| Mączka | 0,57 | długie wymiany, waga kondycji i bekhendu ↑ |
| Twarda | 0,61 | neutralna |
| Hala | 0,63 | szybka, serwis ↑ |
| Trawa | 0,65 | serwis i siatka ↑↑ |

## 9. Talia taktyk i raport skauta

Zamiast losowych sytuacji w trakcie meczu gra stawia na **przygotowanie przed meczem**. Przed każdym ważnym meczem (półfinał i finał, duże turnieje od 1/8, mecz z Nemesis, losowo ~15% pozostałych) zeszyt otwiera **raport skauta**: kim jest rywal, jaki ma **styl gry**, czy jest silniejszy, którą ręką gra, na jakiej nawierzchni zagracie — i notatkę skauta o jego słabościach.

Gracz zagrywa jedną **kartę taktyki** ze swojej talii. Talia startowa: *Solidnie z głębi*, *Atak na bekhend*, *Serwis i pierwszy forhend*. Kolejne karty uczą trenerzy (klubowy: *Wojna na wyniszczenie*; z licencją: *Wysokie topspiny*, *Return w nogi*; akademia: *Skróty i loby*, *Forhend z odwrotnego krosa*; trener z touru: *Serwis i wolej*, *Chip and charge*, *Gra w głowie rywala*; superkoch: *Wszystko albo nic*) — 12 kart.

Przewaga karty (w punktach procentowych szansy na punkt przy serwisie) to:

```
przewaga = (dopasowanie_do_stylu_rywala + nawierzchnia) × 0,35
         + (średnia_skilli_karty − OVR) × 0,05     // czy plan pasuje do twoich mocnych stron
         + mistrzostwo × 0,15                       // 0–3 poziomy za 6/18/40 wygranych meczów
         ∈ [−4; +4] pkt %
```

Każda karta ma też **ryzyko** — rozrzut przewagi w każdym secie (od „Wojny na wyniszczenie” ~0,15 pkt % po „Wszystko albo nic” ~2,4 pkt %). Ryzykowna karta potrafi wygrać seta z dużo lepszym rywalem albo oddać go słabszemu.

Style rywali: **bombardier serwisowy**, **ściana z głębi kortu**, **wszechstronny**, **siatkarz**. Każda karta ma tabelę skuteczności wobec stylów (np. *Return w nogi* niszczy bombardierów, a na ścianę nie działa; *Serwis i wolej* rozbija ścianę na trawie, ale na mączce jest samobójstwem). Uczy to czytania rywala zamiast klikania „najwyższego procentu”.

W zwykłych meczach gra **plan na co dzień** z połową przewagi. Każdy mecz zagrany kartą liczy się do jej bilansu i mistrzostwa.

## 10. Sztab i sprzęt

| Trener | Koszt / sezon | Mnożnik rozwoju | Bonus treningu | Uwagi |
|---|---|---|---|---|
| Tata z YouTube | 0 zł | ×0,75 | +3 | start dla `wall` |
| Trener klubowy | 12 tys. | ×0,95 | +4 | |
| Trener z licencją PZT | 35 tys. | ×1,10 | +4 | |
| Akademia zagraniczna | 120 tys. | ×1,25 | +5 | wymaga reputacji 30 |
| Trener z touru (ex TOP 50) | 280 tys. | ×1,30 | +5 | wymaga reputacji 50, +2% w decyzjach |
| Superkoch (ex mistrz Szlema) | 900 tys. | ×1,40 | +6 | wymaga reputacji 75, +4% w decyzjach, media +5/sez. |

Dodatkowo: **fizjoterapeuta** (60 tys./sez.; ryzyko kontuzji –35%, regeneracja +30%), **trener przygotowania fizycznego** (45 tys.; kondycja spada wolniej). Sprzęt (rakiety, naciągi) to stały koszt etapu, chyba że masz kontrakt sprzętowy.

## 11. Sponsorzy

Oferty pojawiają się w każdym okresie przygotowawczym, zależnie od mediów, reputacji, rankingu i poziomu trudności. Kategorie (max 1 umowa w kategorii): **odzież**, **rakiety**, **lokalny / główny**, **zegarek / lifestyle** (tylko TOP 50). Umowa ma kwotę roczną, długość (1–3 sezony) i czasem **warunek** (np. „TOP 100 na koniec roku, inaczej –50%”) lub zabawny obowiązek („zdjęcie z prezesem na festynie gminnym”). Sponsorzy są fikcyjni — od „Auto-Myjni Perła” po globalne marki sportowe z wymyślonymi nazwami.

## 12. Wydarzenia fabularne

Wydarzenia to krótkie scenki z 2–3 wyborami i jawnymi skutkami (+2 Psychiki, –8 tys. zł, media +3…). Pojawiają się na początku okresu przygotowawczego i 1–3 razy w trakcie sezonu. Są filtrowane po etapie, wieku, płci, rankingu i flagach (np. „ma Nemesis”, „ma kontuzję”). Część ma rzut na sukces (np. „Proponujesz rozmowę trenerowi” — szansa zależna od psychiki).

Przykłady: tata kłóci się z sędzią na turnieju Orlików · hala pneumatyczna przecieka przed Mistrzostwami Polski · stypendium ministerialne · propozycja akademii w Barcelonie · reprezentacja w Pucharze Davisa / Billie Jean King Cup · obietnica dzikiej karty od dyrektora turnieju w Szczecinie · hejt po porażce w pierwszej rundzie Szlema · telewizja śniadaniowa · menedżer z Monako · kontuzja nadgarstka · Nemesis wygrywa juniorski Wimbledon.

## 13. Koniec kariery i Dorobek (LEGACY)

Kariera kończy się, gdy:
- gracz wybierze **emeryturę** (dostępna od 28 lat po każdym sezonie),
- zawodnik skończy **38 lat**,
- **długi** przekroczą limit,
- **kontuzja kończąca karierę** (bardzo rzadka, możliwa przy wysokim zmęczeniu i wieku 30+).

### Dorobek (w kodzie: LEGACY)

| Składnik | Punkty |
|---|---|
| Tytuł Wielkiego Szlema | 600 (finał 200, SF 80, QF 30) |
| Tytuł ATP/WTA Finals | 350 |
| Tytuł 1000 / 500 / 250 | 180 / 90 / 50 |
| Tytuł Challenger / ITF | 12 / 3 |
| Złoto / srebro / brąz olimpijski | 400 / 220 / 150 |
| Tydzień na pozycji nr 1 | 8 |
| Rok zakończony na nr 1 | 250 |
| Najwyższy ranking | nr 1: 300 · TOP 5: 200 · TOP 10: 150 · TOP 20: 100 · TOP 50: 60 · TOP 100: 35 · TOP 200: 15 · TOP 500: 5 |
| Juniorski Szlem | 40 |
| Nr 1 juniorów na koniec roku | 30 |
| Mistrzostwo Polski (junior) | 5 |
| Tytuł juniorski (inny) | 2 |
| Zwycięstwo w meczu zawodowym | 0,5 |
| Zarobki | 10 za każdy 1 mln zł |
| Puchar Davisa / BJK Cup | 50 |

Suma × mnożnik punktu startowego × mnożnik trudności. **Werdykt** (np. „Legenda kortu”, „Mistrz wielkoszlemowy”, „Challengerowy wojownik”, „Juniorski meteor”, „Kariera na kredyt”) zależy od struktury dorobku, nie tylko od liczby.

## 14. Metagra

| System | Opis |
|---|---|
| **Zawodnik dnia** | Wspólny seed i wspólna karta zgłoszenia na dany dzień (Europe/Warsaw). Liczy się pierwsze podejście. Osobna tablica. |
| **Tablica wyników** | Dzisiaj, ten tydzień, zawodnik dnia, wszech czasów; „wczoraj wygrał(a)” — zwycięzca poprzedniego okresu. |
| **Na dziś (karteczka)** | 3 cele losowane deterministycznie z daty (np. „Zarób łącznie 35 mln zł”, „Wygraj 2 turnieje na trawie”). |
| **Wyzwanie tygodnia** | 1 cel złożony (np. „Zarób 15 mln zł i zakończ karierę bez poważnej kontuzji”). |
| **Seria** | Liczba kolejnych dni z zamkniętym zeszytem. |
| **Gablota** | 50 trofeów na czterech półkach (brąz, srebro, złoto, legenda), m.in. „Taktyk” (3 karty na pełnym mistrzostwie), „Pełna talia”, „Złoty Szlem”. |
| **Kronika** | Rekordy gracza i lista zamkniętych zeszytów z werdyktami; trofea z tablicy wyników. |
| **Rakiety** | 15 malowań odblokowywanych trofeami; wybrana rakieta leży na okładce zeszytu. |
| **Ustawienia** | Język PL/EN, animacje (pełne / ograniczone / wyłączone), tempo autopilota, dane. |

## 15. Ton i estetyka — „Zeszyt Tenisisty”

- **Metafora:** cała gra to **zeszyt zawodnika leżący na biurku obitym zielonym suknem** (kolor kortu). Okładka to menu, otwarty zeszyt to rozgrywka: lewa strona — **legitymacja zawodnika** (polaroid, radar umiejętności, prognoza formy jako pogoda, bateria, czucie nawierzchni jako mini-korty), prawa — bieżący tydzień. Zakładki w kolorach (terminarz, ranking, talia, kasa, kronika) wystają z góry jak w prawdziwym zeszycie.
- **Materiały:** papier w kratkę z czerwonym marginesem, granatowy atrament, taśma washi, żółte karteczki samoprzylepne, zakreślacz, pieczątki pocztowe (turnieje), wycinki z gazet (koniec sezonu), listy i SMS-y (wydarzenia), teczka skauta, karty do gry (taktyki), umowy z podpisem, hasło w encyklopedii (emerytura), gablota z półkami (trofea).
- **Typografia:** Instrument Serif (nagłówki, encyklopedia), IBM Plex Sans (interfejs), IBM Plex Mono (protokoły, liczby, etykiety jak z maszyny do pisania), Caveat (odręczne notatki, wyniki, podpisy).
- **Ton:** ciepła, lekko ironiczna polska narracja. Bez memów, bez emoji — ikonografia rysowana w SVG.

## 16. Zakres wersji 2.0 i dalej

Wersja 2.0 obejmuje wszystko z sekcji 3–14 w singlach. Plan rozwoju: [ROADMAP.md](./ROADMAP.md).

---

*Nieoficjalna gra fanowska. Nazwy turniejów, rozgrywek i obiektów służą wyłącznie identyfikacji rzeczywistości sportowej. Projekt niepowiązany z ATP, WTA, ITF, PZT, AELTC ani żadną organizacją tenisową. Wszyscy zawodnicy, trenerzy i sponsorzy w grze są fikcyjni.*
