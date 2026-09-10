# Shared Architecture

Contract only. No rules. No network code.

## 1. Package

`shared/src/types.ts` - `Lobby`, `Player`, `GameState`, `BoardSpace`, `CardRef`, `Resources`, `LegalAction`
`shared/src/protocol.ts` - REST paths + WS messages
`shared/src/errors.ts` - reject codes

Client and server import from here. Do not duplicate types.

## 2. Messages

- `LobbyUpdated`, `GameStarted`, `StateUpdated`, `ActionAccepted`, `ActionRejected`, `TurnChanged`, `PhaseChanged`, `GameEnded`.

IDs are strings (UUID). Resources are numbers.

## 3. Hidden Data

Send full hand + intrigue only to owner. Send counts only to opponents. Never send deck order. Mark view with `viewForPlayerId`.

Reject codes: `NOT_YOUR_TURN`, `WRONG_PHASE`, `ILLEGAL_SPACE`, `SPACE_OCCUPIED`, `MISSING_COST`, `MISSING_REQUIREMENT`, `UNKNOWN_CARD`, `ILLEGAL_ACTION`.
