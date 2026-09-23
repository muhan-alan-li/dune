import { describe, expect, expectTypeOf, it } from 'vitest';
import { REJECT_CODES, RejectCode, isRejectCode } from './errors.js';
import { api, RestPath, SERVER_MESSAGE_TYPES, WsPath } from './protocol.js';
import type {
  ActionResponse,
  GameAction,
  ServerMessage,
  ServerMessageType,
} from './protocol.js';
import type { GameId, GameState, LobbyCode, PlayerId } from './types.js';

describe('REST paths', () => {
  it('defines the exact path templates', () => {
    expect(RestPath.createLobby).toBe('POST /api/lobbies');
    expect(RestPath.joinLobby).toBe('POST /api/lobbies/:code/join');
    expect(RestPath.getLobby).toBe('GET /api/lobbies/:code');
    expect(RestPath.sendAction).toBe('POST /api/games/:id/actions');
    expect(RestPath.getState).toBe('GET /api/games/:id/state');
  });

  it('builds the concrete paths', () => {
    const code: LobbyCode = 'AB12';
    const gameId: GameId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    expect(api.createLobby()).toBe('/api/lobbies');
    expect(api.joinLobby(code)).toBe(`/api/lobbies/${code}/join`);
    expect(api.getLobby(code)).toBe(`/api/lobbies/${code}`);
    expect(api.sendAction(gameId)).toBe(`/api/games/${gameId}/actions`);
    expect(api.getState(gameId)).toBe(`/api/games/${gameId}/state`);
  });

  it('defines the WebSocket stream path', () => {
    const gameId: GameId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    expect(WsPath.stream).toBe('/api/games/:id/stream');
    expect(api.stream(gameId)).toBe(`/api/games/${gameId}/stream`);
  });
});

describe('server messages', () => {
  it('lists the eight message types in canonical order', () => {
    expect(SERVER_MESSAGE_TYPES).toEqual([
      'LobbyUpdated',
      'GameStarted',
      'StateUpdated',
      'ActionAccepted',
      'ActionRejected',
      'TurnChanged',
      'PhaseChanged',
      'GameEnded',
    ]);
    expectTypeOf<ServerMessage['type']>().toEqualTypeOf<ServerMessageType>();
  });

  it('models each message shape', () => {
    const playerId: PlayerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const gameId: GameId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const lobby: ServerMessage = {
      type: 'LobbyUpdated',
      lobby: {
        code: 'AB12',
        gameId: null,
        hostId: playerId,
        players: [],
        minPlayers: 3,
        maxPlayers: 4,
      },
      timestamp: '2026-09-21T12:00:00.000Z',
    };
    const started: ServerMessage = {
      type: 'GameStarted',
      gameId,
      lobbyCode: 'AB12',
      timestamp: '2026-09-21T12:00:00.000Z',
    };
    expect(lobby.type).toBe('LobbyUpdated');
    expect(started.type).toBe('GameStarted');
    expect(started.lobbyCode).toBe('AB12');
  });

  it('narrows the rejected message to its code', () => {
    const message: ServerMessage = {
      type: 'ActionRejected',
      gameId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      actionId: 'action-1',
      code: 'SPACE_OCCUPIED',
      reason: 'The space already has an agent.',
      timestamp: '2026-09-21T12:00:00.000Z',
    };
    if (message.type === 'ActionRejected') {
      expect(message.code).toBe('SPACE_OCCUPIED');
      expect(message.reason).toBe('The space already has an agent.');
    } else {
      throw new Error('The message must be an ActionRejected message.');
    }
  });

  it('narrows the ended message to its winner', () => {
    const message: ServerMessage = {
      type: 'GameEnded',
      gameId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      winnerId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      state: {
        gameId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        lobbyCode: 'AB12',
        roundNumber: 6,
        phase: 'endgame',
        currentPlayerId: null,
        firstPlayerId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        viewForPlayerId: null,
        board: [],
        imperiumRow: [],
        reserve: {
          arrakisLiaison: { cardKey: 'reserve-arrakis-liaison', count: 7 },
          spiceMustFlow: { cardKey: 'reserve-the-spice-must-flow', count: 8 },
          foldspace: { cardKey: 'reserve-foldspace', count: 6 },
        },
        conflict: { card: null },
        players: [],
        legalActions: [],
        log: [],
        ended: true,
        winnerId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      },
      timestamp: '2026-09-21T12:00:00.000Z',
    };
    if (message.type === 'GameEnded') {
      expect(message.winnerId).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
      expect(message.state.ended).toBe(true);
    } else {
      throw new Error('The message must be a GameEnded message.');
    }
  });
});

describe('action request and response', () => {
  it('models an action request', () => {
    const actions: GameAction[] = [
      { kind: 'playCard', cardId: 'card-1' },
      { kind: 'sendAgent', cardId: 'card-1', spaceId: 'arrakeen' },
      { kind: 'deployTroops', count: 2 },
      { kind: 'useSignetRing', cardId: 'card-2' },
      { kind: 'useLeaderAbility' },
      { kind: 'playIntrigue', intrigueId: 'intrigue-1' },
      { kind: 'acquireCard', cardKey: 'dune-imperium-sardaukar-legion' },
      { kind: 'pass' },
      { kind: 'confirmCombat' },
    ];
    expect(actions).toHaveLength(9);
    expectTypeOf<GameAction>().toMatchTypeOf<{ kind: string }>();
  });

  it('models an accepted response and a rejected response', () => {
    const minimalState: GameState = {
      gameId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      lobbyCode: 'AB12',
      roundNumber: 1,
      phase: 'playerTurns',
      currentPlayerId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      firstPlayerId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      viewForPlayerId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      board: [],
      imperiumRow: [],
      reserve: {
        arrakisLiaison: { cardKey: 'reserve-arrakis-liaison', count: 8 },
        spiceMustFlow: { cardKey: 'reserve-the-spice-must-flow', count: 10 },
        foldspace: { cardKey: 'reserve-foldspace', count: 6 },
      },
      conflict: { card: null },
      players: [],
      legalActions: [],
      log: [],
      ended: false,
      winnerId: null,
    };
    const accepted: ActionResponse = { accepted: true, actionId: 'action-1', state: minimalState };
    const rejected: ActionResponse = {
      accepted: false,
      code: 'NOT_YOUR_TURN',
      reason: 'It is not your turn.',
    };
    if (accepted.accepted) {
      expect(accepted.actionId).toBe('action-1');
    } else {
      throw new Error('The response must be accepted.');
    }
    if (!rejected.accepted) {
      expect(rejected.code).toBe('NOT_YOUR_TURN');
    } else {
      throw new Error('The response must be rejected.');
    }
  });
});

describe('reject codes', () => {
  it('keeps the exact code strings', () => {
    expect(RejectCode.notYourTurn).toBe('NOT_YOUR_TURN');
    expect(RejectCode.wrongPhase).toBe('WRONG_PHASE');
    expect(RejectCode.illegalSpace).toBe('ILLEGAL_SPACE');
    expect(RejectCode.spaceOccupied).toBe('SPACE_OCCUPIED');
    expect(RejectCode.missingCost).toBe('MISSING_COST');
    expect(RejectCode.missingRequirement).toBe('MISSING_REQUIREMENT');
    expect(RejectCode.unknownCard).toBe('UNKNOWN_CARD');
    expect(RejectCode.illegalAction).toBe('ILLEGAL_ACTION');
  });

  it('lists the eight codes in canonical order', () => {
    expect(REJECT_CODES).toEqual([
      'NOT_YOUR_TURN',
      'WRONG_PHASE',
      'ILLEGAL_SPACE',
      'SPACE_OCCUPIED',
      'MISSING_COST',
      'MISSING_REQUIREMENT',
      'UNKNOWN_CARD',
      'ILLEGAL_ACTION',
    ]);
  });

  it('guards unknown values', () => {
    for (const code of REJECT_CODES) {
      expect(isRejectCode(code)).toBe(true);
    }
    expect(isRejectCode('MAYBE')).toBe(false);
    expect(isRejectCode(42)).toBe(false);
    expect(isRejectCode(undefined)).toBe(false);
  });
});