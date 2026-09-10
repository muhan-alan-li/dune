# Client Architecture

Frontend only. See `server/ARCHITECTURE.md` and `SHARED-ARCHITECTURE.md`.

## 1. Stack

- TypeScript strict, React 18+, Vite, React Router.
- Server data: React Query or Zustand. Local selection: useState/useReducer.
- Real-time: WebSocket client with reconnect.
- Tests: Vitest + React Testing Library. Style: Tailwind or CSS Modules.

## 2. Views

- `MenuView`, `LobbyView`, `GameView`, `EndView`.
- Paths: `/`, `/lobby/:code`, `/game/:id`.

## 3. Game Components

`BoardMap`, `ConflictPanel`, `ImperiumRow`, `PlayerHand`, `ActionPanel`, `ResourceBar`, `InfluenceTracks`, `IntrigueHand`, `OpponentPanel`, `GameLog`, `HelpPopover`.

## 4. State Model

- Server state: lobby, board, hand metadata, legal actions. Do not edit locally.
- Selection state: card, space, troop count. Clear after confirm.
- UI state: dialogs, log filter, help.

Flow: select card -> show legal spaces -> select space -> send command -> apply new server state.

## 5. API Layer

- All backend calls live in `client/src/api/` as `GameApi`: `createLobby`, `joinLobby`, `setReady`, `startGame`, `sendAction`, `subscribe`.
- No fetch or WebSocket outside `api/`. No rule decisions in views.
