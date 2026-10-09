# Jak pracować z repozytorium

## Wymagania
- Node.js ≥ 20.11 (zalecany 22, patrz `.nvmrc`)
- Docker (opcjonalnie — PostgreSQL dla API)

## Start
```bash
npm install
npm run dev            # gra offline: http://localhost:5173
```

Z rankingami online:
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
npm run db:up && npm run db:migrate
npm run dev:api        # http://localhost:4000
npm run dev
```

## Skrypty
| Komenda | Co robi |
|---|---|
| `npm run dev` / `dev:api` | serwer deweloperski klienta / API |
| `npm test` | Vitest (silnik + API) |
| `npm run lint` · `typecheck` · `format` | jakość kodu |
| `npm run balance -- 40` | raport balansu (40 karier botem na tło) |
| `npm run ci` | to samo co CI: lint → typecheck → test → build |

## Konwencje
- **Commity**: Conventional Commits (`feat(engine): …`, `fix(web): …`, `docs: …`).
- **Gałęzie**: `feat/…`, `fix/…`, `content/…`; PR do `main`, CI musi być zielone.
- **Silnik**: żadnego `Math.random`, `Date.now`, I/O ani zależności. Cała losowość przez `Rng` ze stanu.
- **Treść**: zasady w [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md).
- **UI**: tylko tokeny z `styles/tokens.css`, bez emoji, dostępność zgodnie z [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md).
- **Kontrakty API**: zmiana w `packages/shared` = zmiana w obu aplikacjach w tym samym PR.
