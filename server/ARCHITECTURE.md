# Server Architecture

Backend only. See `client/ARCHITECTURE.md` and `SHARED-ARCHITECTURE.md`.

## 1. Stack

- TypeScript strict, Node 22, Fastify, `ws`, Zod, Vitest.
- One process on one VPS. Target: <50 games. No microservices.

## 2. Layout

```
server/src/index.ts - routes + sockets
server/src/lobby/   - codes, players, host rights
server/src/game/engine/ - pure rules, no network
server/src/game/store.ts - games + action log
server/src/game/filter.ts - hide data per player
```

## 3. Duties

Backend owns lobbies, sessions, and game state. It checks count (3-4), turn, phase, and legality. It rejects illegal actions with a code. It broadcasts updates. It keeps a log. It prevents undo.

Engine: input is state + action. Output is new state or error. No network in engine.

## 4. Contract

- `POST /api/lobbies`, `POST /api/lobbies/:code/join`, `GET /api/lobbies/:code`
- `POST /api/games/:id/actions`, `GET /api/games/:id/state`
- `WS /api/games/:id/stream` for live updates.

## 5. Data

In-memory Map first. SQLite later if needed. Auth: display name + token. Filter hidden hands and deck order per player. Use HTTPS/WSS in production.
