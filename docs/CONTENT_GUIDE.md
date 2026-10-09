# Przewodnik po treści

> Jak dodawać wydarzenia, sytuacje meczowe, turnieje, sponsorów, osiągnięcia i cele.
> Cała treść żyje w [`packages/engine/src/content`](../packages/engine/src/content) jako typowany TypeScript.

## Zasady pisania

1. **Dwa języki zawsze.** Każdy tekst to `l('polski', 'English')`. Nazwy własne mogą mieć jedną wersję: `l('Wrocław')`.
2. **Płeć przez znaczniki.** Rywale zawsze są tej samej płci co gracz, więc jeden przełącznik obsługuje wszystkich: `[[rywal|rywalka]]`, `[[zmęczony|zmęczona]]`, `[[his|her]]`. Pusty wariant też działa: `zmienił[[|a]]`.
3. **Zmienne w klamrach.** `{opp}` (rywal), `{score}` (wynik), `{nemesis}`, `{height}`, `{name}`, `{first}`, `{debt}` — dostarczane przez silnik.
4. **Ton**: ciepła ironia, polska codzienność, szacunek do sportu. Bez wulgaryzmów i memów. Krótko — 1–3 zdania.
5. **Fikcja**: żadnych prawdziwych zawodników, trenerów ani marek sponsorskich. Prawdziwe turnieje wyłącznie jako tło.
6. **Skutki są jawne.** UI generuje podsumowanie skutków z `effects` — nie dubluj ich w tekście opcji.

## Wydarzenie fabularne (`events.ts`)

```ts
{
  id: 'nat_air_dome',                 // unikalne, snake_case
  context: 'midseason',               // 'offseason' (przed treningiem) | 'midseason' (między turniejami)
  stages: ['national'],               // opcjonalnie: etapy kariery
  minAge: 11, maxAge: 13,             // opcjonalnie
  weight: 5,                          // waga losowania
  once: true,                         // raz na karierę (albo oncePerSeason: true)
  priority: false,                    // true = pokaż zawsze, gdy warunek spełniony
  condition: (s) => s.finance.budget > 0,
  vars: (s) => ({ debt: … }),
  text: l('…', '…'),
  options: [
    {
      label: l('Trenujesz na zewnątrz', 'Train outdoors'),
      hint: l('twarda szkoła', 'hard school'),            // opcjonalny dopisek
      cost: 6000,                                          // opcja niedostępna bez budżetu
      roll: { skills: { fitness: 1 }, base: 0.7 },         // opcjonalny rzut
      effects: [skill('fitness', 2)],                      // sukces / brak rzutu
      failEffects: [{ kind: 'injury', weeks: 3, injury: 'back' }],
      result: l('…', '…'),
      failResult: l('…', '…'),
    },
  ],
}
```

Dostępne efekty (`EffectTarget`): `skill`, `potential`, `budget`, `media`, `reputation`, `morale`, `fatigue`, `surface`, `injury`, `coach`, `flag`, `davis_cup`, `turn_pro`, `exempt`, `reveal_height`, `retire_forced`, `promote`.

Szansa rzutu: `base + Σ wᵢ · (skillᵢ − OVR) · 0,012 + (stat − 40) · 0,005`, przycięta do 5–95%.

## Sytuacja meczowa (`situations.ts`)

```ts
{
  id: 'clay_grind',
  text: l('Mączka, upał, wymiany po 25 uderzeń. {opp} nie chybia. Wynik {score}.', '…'),
  when: { moment: 'any', surfaces: ['clay'] },   // 'first' | 'deciding' | 'any', leading, trailing,
                                                 // afterTiebreak, minStage, maxStage
  weight: 8,
  options: [
    {
      label: l('Topspin w bekhend', '…'), desc: l('wygrywasz cierpliwością', '…'),
      risky: false,
      skills: { backhand: 0.35, forehand: 0.25, fitness: 0.4 },   // wagi sumujące się do ~1
      base: 0.6,                                                   // szansa przy skillu = rating rywala
      result: { super: l('…'), success: l('…'), fail: l('…') },
      side: { fail: [{ kind: 'fatigue', delta: 6 }] },             // opcjonalne skutki poza meczem
    },
  ],
}
```
Każda sytuacja powinna mieć opcję bezpieczną (`base` ~0,55–0,66) i ryzykowną (`base` ~0,36–0,45).

## Turnieje (`tournaments.ts`)

- **Tour** (`TOUR`): wiersz `[id, nazwa, miasto, kraj, region, ranga, nawierzchnia, tydzień, długość, 'M'|'F'|'MF', slam?]`.
- **Challengery / ITF**: tabela tydzień → miasto. Id generuje się stabilnie (`ch-w23-poznan`) — **nie zmieniaj miast w istniejących tygodniach** bez podbicia `ENGINE_VERSION`, bo zapisane plany sezonu wskazują na id.
- **Juniorzy** (`JUNIOR`): kalendarz na etap.
- Region steruje kosztem podróży (`pl` 0,55 · `eu` 1,0 · `am` 1,7 · `as` 1,8 · `oc` 2,0).

## Sponsorzy (`sponsors.ts`)

Szablon: nazwa (fikcyjna!), kategoria (`apparel`/`racket`/`main`/`lifestyle`), tier 1–4, widełki kwoty, długość kontraktu, „obowiązek” (perk) i opcjonalny warunek `rank_top`. Tier dostępny wg `marketability = media·0,5 + reputacja·0,3 + bonus_rankingu`.

## Osiągnięcia, werdykty, cele, rakiety

- `achievements.ts` — predykat na `CareerSummary`; `secret: true` ukrywa nazwę do odblokowania; tier steruje kolorem medalu.
- `verdicts.ts` — lista **uporządkowana**, wygrywa pierwszy pasujący werdykt.
- `goals.ts` — cele dnia (`sum` lub `max` po karierach okresu) i wyzwania tygodnia (jedna kariera spełnia wszystkie warunki).
- `rackets.ts` — malowanie (`frame`, `accent`, `grip`) + osiągnięcie odblokowujące.

## Checklista przed PR

- [ ] `npm test` — testy integralności treści sprawdzają unikalność id i domknięcie znaczników `[[ ]]`.
- [ ] Obie wersje językowe, poprawna odmiana przez płeć.
- [ ] Zmiana wpływa na wynik istniejących karier? → podbij `ENGINE_VERSION` i dopisz `CHANGELOG.md`.
- [ ] Dla zmian balansu: wynik `npm run balance -- 40` przed i po w opisie PR.
