# Schemat bazy danych

> PostgreSQL 16+ · ORM: Prisma 6 · źródło prawdy: [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma) · migracje: [`apps/api/prisma/migrations`](../apps/api/prisma/migrations)

Baza przechowuje **wyłącznie metagrę**: konta, zweryfikowane kariery, rankingi, osiągnięcia i cele. Sama rozgrywka nie trafia do bazy w trakcie — klient wysyła log akcji raz, po zakończeniu kariery.

## Diagram ER

```mermaid
erDiagram
  Player ||--o{ Career : "gra"
  Player ||--o{ DailyAttempt : "podejście dnia"
  Player ||--o{ PlayerAchievement : "zdobywa"
  Player ||--o{ GoalProgress : "postęp celów"
  Player ||--o{ PeriodChampion : "wygrywa okres"
  Career ||--o| DailyAttempt : "jest podejściem"
  Career ||--o{ PeriodChampion : "zwycięska kariera"

  Player {
    string id PK "cuid"
    varchar24 displayName
    char64 tokenHash UK "SHA-256 tokenu"
    enum locale "pl | en"
    varchar32 selectedRacket
    int streakDays
    char10 lastPlayedDay "YYYY-MM-DD (Warszawa)"
    timestamp createdAt
    timestamp lastSeenAt
  }

  Career {
    string id PK
    string playerId FK
    enum mode "NORMAL | DAILY"
    enum status "ACTIVE | FINISHED | REJECTED"
    varchar64 seed "wydany przez serwer"
    varchar16 engineVersion
    json config "imię, płeć, start, poziom"
    char10 dayKey "dzień Kariery Dnia"
    char10 finishDay "dzień zakończenia"
    varchar8 weekKey "tydzień ISO zakończenia"
    varchar64 name
    enum gender "M | F"
    varchar16 background
    varchar8 difficulty
    int legacy
    bool rankable
    varchar32 verdict
    int seasons
    int peakRank
    int slamTitles
    int titles
    bigint prizeMoney
    json summary "CareerSummary z silnika"
    json actions "zweryfikowany log akcji"
    int actionCount
    varchar200 rejectReason
    timestamp startedAt
    timestamp finishedAt
  }

  DailyAttempt {
    string playerId PK,FK
    char10 dayKey PK
    string careerId UK,FK
    timestamp createdAt
  }

  PlayerAchievement {
    string playerId PK,FK
    varchar32 achievementId PK
    string careerId
    timestamp unlockedAt
  }

  GoalProgress {
    string playerId PK,FK
    varchar32 goalKey PK "daily:2026-10-09:0 / weekly:2026-W41"
    int value
    int target
    timestamp completedAt
    timestamp updatedAt
  }

  PeriodChampion {
    string id PK
    enum board "DAILY | TODAY | WEEK"
    varchar10 periodKey "dzień lub tydzień"
    string careerId FK
    string playerId FK
    int legacy
    timestamp settledAt
  }
```

## Tabele

### `Player`
Anonimowe konto przypisane do urządzenia. Klient dostaje losowy token (32 bajty, base64url) **jeden raz**; w bazie leży tylko `tokenHash = sha256(token)`. Wyciek bazy nie pozwala więc podszyć się pod gracza. Seria (`streakDays`) rośnie, gdy gracz kończy karierę w kolejnych dniach (strefa Europe/Warsaw); `lastPlayedDay` to ostatni taki dzień.

### `Career`
Jedna kariera = jeden wiersz, tworzony przy **starcie** (status `ACTIVE`, seed wydany przez serwer).
Po wysłaniu logu serwer odtwarza karierę i:
- przy sukcesie ustawia `FINISHED`, wypełnia zdenormalizowane kolumny wyniku (`legacy`, `peakRank`, `slamTitles`…), pełne `summary` i zweryfikowany `actions`,
- przy błędzie ustawia `REJECTED` i `rejectReason` (np. `illegal_action:412:Option unavailable`).

Kolumny wynikowe są zdenormalizowane celowo — rankingi czytają tylko proste kolumny z indeksów, bez parsowania JSON-a. `summary` i `actions` zostają do audytu i ponownej weryfikacji po zmianach silnika.

`rankable = false` dla punktu startowego „Wybraniec” (gra bez rankingu).

### `DailyAttempt`
Realizuje zasadę „liczy się pierwsze podejście”. Wiersz `(playerId, dayKey)` powstaje **w tej samej transakcji co kariera dnia** — drugie `POST /v1/careers {mode:"daily"}` tego dnia kończy się `409`. Porzucenie kariery nie zwraca podejścia.

### `PlayerAchievement`
Osiągnięcia zdobyte przez gracza (identyfikatory z `packages/engine/src/content/achievements.ts`). Klucz złożony gwarantuje, że każde osiągnięcie zapisuje się raz; `careerId` wskazuje karierę, w której zostało zdobyte.

### `GoalProgress`
Postęp celów dnia i wyzwania tygodnia. Klucze są deterministyczne (`daily:{dzień}:{indeks}`, `weekly:{tydzień ISO}`), a definicje celów wylicza silnik z daty — baza trzyma tylko wartości. Postęp jest przeliczany po każdej zakończonej karierze z podsumowań karier danego okresu.

### `PeriodChampion`
Zwycięzcy zamkniętych okresów („Panujący mistrz”) i trofea w Muzeum. `@@unique([board, periodKey])` czyni rozliczenie idempotentnym — kilka instancji API może je uruchamiać równolegle.

## Indeksy i zapytania

| Indeks | Zapytanie |
|---|---|
| `Career (mode, dayKey, legacy DESC)` | ranking Kariery Dnia |
| `Career (mode, finishDay, legacy DESC)` | ranking „tryb zwykły · dziś” |
| `Career (weekKey, legacy DESC)` | ranking tygodniowy |
| `Career (status, legacy DESC)` | ranking wszech czasów |
| `Career (mode, status, finishedAt DESC)` | ostatnie kariery |
| `Career (playerId, status)`, `(playerId, finishDay)` | muzeum, cele gracza |
| `Player (tokenHash)` UNIQUE | uwierzytelnienie każdego żądania |

Ranking „najlepsza kariera gracza w okresie”:

```sql
SELECT * FROM (
  SELECT DISTINCT ON (c."playerId") c.*, p."displayName"
  FROM "Career" c JOIN "Player" p ON p.id = c."playerId"
  WHERE c.status = 'FINISHED' AND c.rankable AND c."mode" = 'NORMAL' AND c."finishDay" = $1
  ORDER BY c."playerId", c.legacy DESC, c."finishedAt" ASC
) best
ORDER BY best.legacy DESC
LIMIT 10;
```

## Cykl życia kariery

```mermaid
stateDiagram-v2
  [*] --> ACTIVE: POST /v1/careers (seed)
  ACTIVE --> FINISHED: POST /finish — replay OK
  ACTIVE --> REJECTED: POST /finish — replay odrzucony
  FINISHED --> [*]
  REJECTED --> [*]
```

## Migracje

```bash
npm run db:up                 # PostgreSQL w Dockerze
npm run db:migrate            # prisma migrate dev (nowa migracja z diffu schematu)
npx -w @ttg/api prisma migrate deploy   # produkcja (robi to też kontener API przy starcie)
```

Zasady: migracje są tylko „do przodu”, każda zmiana schematu = nowy katalog w `prisma/migrations`, nigdy nie edytujemy zastosowanych migracji.

## Retencja i prywatność

- Brak danych osobowych: nazwa wyświetlana jest dowolna, konto jest anonimowe.
- Kariery `ACTIVE` starsze niż 30 dni można bezpiecznie usuwać (porzucone) — zadanie porządkowe opisane w [ROADMAP.md](./ROADMAP.md).
- Usunięcie gracza kaskadowo usuwa jego kariery, osiągnięcia, cele i trofea (`onDelete: Cascade`).
