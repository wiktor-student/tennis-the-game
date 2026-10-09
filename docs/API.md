# API (v1)

> Fastify · JSON · bazowy URL np. `http://localhost:4000` · kontrakty: [`packages/shared/src/index.ts`](../packages/shared/src/index.ts) (zod — te same schematy waliduje serwer i klient)

## Uwierzytelnienie

Konta są anonimowe. Token z `POST /v1/auth/anonymous` przesyłamy w nagłówku:

```
Authorization: Bearer <token>
```

Endpointy oznaczone 🔒 wymagają tokenu; pozostałe działają też anonimowo (np. ranking, z tokenem dostaje pole `isMe`).

## Błędy

Każdy błąd ma ten sam kształt:

```json
{ "error": "verification_failed", "message": "Career could not be verified", "details": { "reason": "illegal_action:412:Option unavailable" } }
```

| HTTP | `error` | Kiedy |
|---|---|---|
| 400 | `validation_error` / `bad_request` | niepoprawne body lub query (szczegóły zod w `details`) |
| 401 | `unauthorized` | brak / zły token |
| 404 | `not_found` | kariera nie istnieje lub nie należy do gracza |
| 409 | `daily_already_attempted` | druga Kariera Dnia tego samego dnia |
| 409 | `already_finished` | kariera już wysłana |
| 413 | `bad_request` | body > 2 MB |
| 422 | `verification_failed` | replay odrzucił log akcji |
| 429 | `rate_limited` | przekroczony limit żądań |

## Limity

| Zakres | Limit |
|---|---|
| globalnie | 240 żądań / min / IP |
| `POST /v1/auth/anonymous` | 10 / godz. / IP |
| `POST /v1/careers/:id/finish` | 12 / min / IP, ≤ 25 000 akcji, body ≤ 2 MB |

---

## Endpointy

### `GET /health`
Stan procesu, wersja silnika, długość kolejki weryfikacji.
```json
{ "status": "ok", "engine": "1.0.0", "queue": 0 }
```

### `GET /health/db`
Sprawdza połączenie z bazą (`SELECT 1`).

### `POST /v1/auth/anonymous`
Tworzy konto. Body opcjonalne: `{ "displayName": "Kibic z Radomia" }`.
```json
// 201
{ "token": "q3W…", "player": { "id": "cm…", "displayName": "Kibic 4821", "locale": "pl", "selectedRacket": null, "streakDays": 0, "createdAt": "2026-10-09T11:00:00.000Z" } }
```

### 🔒 `GET /v1/me` · 🔒 `PATCH /v1/me`
Profil gracza. `PATCH` przyjmuje `{ displayName?, locale?, selectedRacket? }`.

### 🔒 `POST /v1/careers`
Rozpoczyna karierę i wydaje seed.

```json
// tryb zwykły
{ "mode": "normal", "config": { "name": { "first": "Iga", "last": "Nowak" }, "gender": "F", "background": "wall", "difficulty": "normal", "mode": "normal" } }
// Kariera Dnia — konfiguracja i seed są wspólne dla wszystkich
{ "mode": "daily" }
```
```json
// 201
{ "careerId": "cm…", "seed": "9f2c…", "config": { … }, "engineVersion": "1.0.0", "dayKey": null }
```

### 🔒 `POST /v1/careers/:id/finish`
Wysyła log akcji zakończonej kariery. Serwer odtwarza ją w workerze i zapisuje wynik.

```json
{ "actions": [ { "t": "train", "skill": "serve" }, { "t": "team", "coach": "club", "physio": false, "fitnessCoach": false }, { "t": "sponsors", "accept": [] }, { "t": "schedule", "plan": ["mini-lodz", null, …] }, { "t": "play" }, { "t": "choose", "option": 1 }, { "t": "continue" }, …, { "t": "retire" } ] }
```
```json
// 200
{
  "verified": true,
  "career": { "careerId": "cm…", "mode": "normal", "name": "Iga Nowak", "legacy": 2140, "verdict": "slam_champion", "seasons": 24, "peakRank": 3, "slamTitles": 1, "titles": 14, "prizeMoney": 61500000, "finishedAt": "…", "rankable": true, … },
  "newAchievements": ["slam", "rg", "top10"],
  "positions": { "daily": null, "today": 2, "week": 5 },
  "streakDays": 3
}
```

Typy akcji (`ActionSchema`):

| `t` | Pola | Faza |
|---|---|---|
| `train` | `skill` | trening zimowy |
| `team` | `coach`, `physio`, `fitnessCoach` | sztab |
| `sponsors` | `accept: string[]` | sponsorzy |
| `schedule` | `plan: (tournamentId \| null)[]` | plan sezonu |
| `play` | — | sezon (następny turniej) |
| `choose` | `option` | wydarzenie / decyzja meczowa |
| `continue` | — | po wydarzeniu, decyzji, końcu sezonu |
| `retire` | — | koniec sezonu (od 28 lat) |

### `GET /v1/careers/:id`
Publiczna karta zakończonej kariery + pełne `summary`.

### `GET /v1/leaderboards?board=today&limit=10`
`board`: `daily` (Kariera Dnia dziś) · `today` (tryb zwykły dziś) · `week` (bieżący tydzień ISO) · `all`.
Najlepsza kariera każdego gracza w okresie, malejąco po LEGACY, plus „panujący mistrz” poprzedniego okresu.

```json
{
  "board": "today",
  "periodKey": "2026-10-09",
  "entries": [ { "position": 1, "careerId": "cm…", "owner": "Kibic 4821", "name": "Hubert Testowy", "gender": "M", "legacy": 1390, "seasons": 27, "peakRank": 6, "slamTitles": 0, "verdict": "elite", "isMe": true } ],
  "reigning": { "board": "today", "periodKey": "2026-10-08", "name": "Arkadiusz Gąsior", "owner": "…", "legacy": 4147 }
}
```

### `GET /v1/daily`
Konfiguracja i seed Kariery Dnia, cele dnia, wyzwanie tygodnia, czas do północy (Warszawa). Z tokenem: `attempted` i postęp celów.

```json
{
  "dayKey": "2026-10-09", "weekKey": "2026-W41", "seed": "daily:2026-10-09",
  "config": { "name": { "first": "Amelia", "last": "Czerwińska" }, "gender": "F", "background": "wall", "difficulty": "normal", "mode": "daily" },
  "attempted": false,
  "goals": [ { "key": "daily:2026-10-09:0", "templateId": "grass", "target": 2, "value": 0, "done": false } ],
  "weekly": { "key": "weekly:2026-W41", "templateId": "wall_top50", "done": false },
  "secondsLeft": 37800
}
```

### 🔒 `GET /v1/me/progress`
Muzeum: osiągnięcia, ostatnie 100 karier, rekordy i trofea rankingowe.

---

## Przykład: pełny przepływ z `curl`

```bash
TOKEN=$(curl -s -X POST localhost:4000/v1/auth/anonymous -H 'content-type: application/json' -d '{}' | jq -r .token)
curl -s -X POST localhost:4000/v1/careers -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"mode":"daily"}'
curl -s "localhost:4000/v1/leaderboards?board=daily" -H "authorization: Bearer $TOKEN"
```

Kompletny scenariusz (rejestracja → kariera botem → weryfikacja → rankingi → odrzucenie zmanipulowanego logu → zasada jednego podejścia) uruchamia:

```bash
API_URL=http://localhost:4000 npx tsx apps/api/scripts/smoke.ts
```
