import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  BoardSpace,
  CardRef,
  GameLogEntry,
  GameState,
  LegalAction,
  Lobby,
  PhaseId,
  Player,
  PlayerId,
  PlayerState,
  Resources,
} from './types.js';

/**
 * The samples below use UUID-format strings for the ID fields.
 * They check the shape of the types at compile time and at runtime.
 */

describe('types contract', () => {
  it('keeps the ID fields as strings', () => {
    expectTypeOf<PlayerId>().toBeString();
    expectTypeOf<CardRef['cardId']>().toBeString();
    expectTypeOf<CardRef['cardKey']>().toBeString();
    expectTypeOf<CardRef['ownerId']>().toEqualTypeOf<PlayerId | undefined>();
  });

  it('keeps the resource fields as numbers', () => {
    expectTypeOf<Resources['solari']>().toBeNumber();
    expectTypeOf<Resources['spice']>().toBeNumber();
    expectTypeOf<Resources['water']>().toBeNumber();
    expectTypeOf<Resources['persuasion']>().toBeNumber();
    expectTypeOf<BoardSpace['bonusSpice']>().toBeNumber();
  });

  it('keeps the phase as one of the six phases', () => {
    expectTypeOf<PhaseId>().toEqualTypeOf<
      'roundStart' | 'playerTurns' | 'combat' | 'makers' | 'recall' | 'endgame'
    >();
  });

  it('models a lobby with players and a unique code', () => {
    const host: Player = {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Alice',
      color: 'red',
      leader: null,
      isHost: true,
      isReady: true,
      isConnected: true,
    };
    const guest: Player = {
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Bob',
      color: 'blue',
      leader: null,
      isHost: false,
      isReady: false,
      isConnected: true,
    };
    const lobby: Lobby = {
      code: 'AB12',
      gameId: null,
      hostId: host.id,
      players: [host, guest],
      minPlayers: 3,
      maxPlayers: 4,
    };
    expect(lobby.code).toBe('AB12');
    expect(lobby.players).toHaveLength(2);
    expect(lobby.players[0]?.isHost).toBe(true);
    expect(lobby.players[1]?.name).toBe('Bob');
    expect(lobby.gameId).toBeNull();
    expectTypeOf<Lobby['code']>().toBeString();
    expectTypeOf<Lobby['players']>().toEqualTypeOf<Player[]>();
  });

  it('models a board space', () => {
    const space: BoardSpace = {
      id: 'arrakeen',
      name: 'Arrakeen',
      icon: 'city',
      cost: null,
      requirementText: null,
      occupantPlayerId: null,
      controllerPlayerId: '33333333-3333-4333-8333-333333333333',
      bonusSpice: 0,
    };
    expect(space.id).toBe('arrakeen');
    expect(space.cost).toBeNull();
    expect(space.occupantPlayerId).toBeNull();
    expect(space.controllerPlayerId).toBe('33333333-3333-4333-8333-333333333333');
    expectTypeOf<BoardSpace['icon']>().toEqualTypeOf<
      'emperor' | 'spacingGuild' | 'beneGesserit' | 'fremen' | 'landsraad' | 'city' | 'spiceTrade' | null
    >();
  });

  it('hides the hand and Intrigue cards from opponents', () => {
    const ownerId: PlayerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const opponentId: PlayerId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

    const dagger: CardRef = { cardId: 'card-1', cardKey: 'dune-imperium-dagger', ownerId };
    const ambush: CardRef = { cardId: 'intrigue-1', cardKey: 'dune-imperium-ambush', ownerId };

    const ownerState: PlayerState = {
      playerId: ownerId,
      name: 'Alice',
      color: 'red',
      leader: { cardId: 'leader-1', cardKey: 'leader-paul-atreides', ownerId },
      score: 3,
      combatStrength: 0,
      resources: { solari: 2, spice: 0, water: 1, persuasion: 0 },
      troopsInSupply: 4,
      troopsInGarrison: 8,
      troopsInConflict: 2,
      influence: { emperor: 1, spacingGuild: 0, beneGesserit: 0, fremen: 0 },
      alliances: [],
      hand: [dagger],
      handCount: 1,
      deckCount: 6,
      discardCount: 3,
      intrigueCards: [ambush],
      intrigueCount: 1,
      agentsRemaining: 1,
      agentsOnBoard: 2,
      hasMentat: false,
    };

    const opponentState: PlayerState = {
      playerId: opponentId,
      name: 'Bob',
      color: 'blue',
      leader: { cardId: 'leader-2', cardKey: 'leader-glossu-rabban', ownerId: opponentId },
      score: 1,
      combatStrength: 3,
      resources: { solari: 0, spice: 1, water: 2, persuasion: 0 },
      troopsInSupply: 10,
      troopsInGarrison: 4,
      troopsInConflict: 2,
      influence: { emperor: 0, spacingGuild: 0, beneGesserit: 0, fremen: 2 },
      alliances: [],
      hand: null,
      handCount: 1,
      deckCount: 5,
      discardCount: 4,
      intrigueCards: null,
      intrigueCount: 2,
      agentsRemaining: 3,
      agentsOnBoard: 0,
      hasMentat: false,
    };

    const rowCard: CardRef = { cardId: 'row-1', cardKey: 'dune-imperium-sardaukar-legion' };
    const logEntry: GameLogEntry = {
      id: 'log-1',
      roundNumber: 1,
      phase: 'playerTurns',
      playerId: ownerId,
      text: 'Alice sends an agent to Arrakeen.',
      timestamp: '2026-09-21T12:00:00.000Z',
    };

    const state: GameState = {
      gameId: 'game-1',
      lobbyCode: 'AB12',
      roundNumber: 1,
      phase: 'playerTurns',
      currentPlayerId: ownerId,
      firstPlayerId: ownerId,
      viewForPlayerId: ownerId,
      board: [],
      imperiumRow: [rowCard],
      reserve: {
        arrakisLiaison: { cardKey: 'reserve-arrakis-liaison', count: 8 },
        spiceMustFlow: { cardKey: 'reserve-the-spice-must-flow', count: 10 },
        foldspace: { cardKey: 'reserve-foldspace', count: 6 },
      },
      conflict: { card: { cardId: 'conflict-1', cardKey: 'conflict-arrakeen' } },
      players: [ownerState, opponentState],
      legalActions: [],
      log: [logEntry],
      ended: false,
      winnerId: null,
    };

    expect(state.viewForPlayerId).toBe(ownerId);
    expect(state.players[0]?.hand).toHaveLength(1);
    expect(state.players[1]?.hand).toBeNull();
    expect(state.players[1]?.handCount).toBe(1);
    expect(state.players[1]?.intrigueCount).toBe(2);
    expect(state.imperiumRow[0]?.ownerId).toBeUndefined();
    expectTypeOf<GameState['viewForPlayerId']>().toEqualTypeOf<PlayerId | null>();
    expectTypeOf<PlayerState['hand']>().toEqualTypeOf<CardRef[] | null>();
    expectTypeOf<PlayerState['intrigueCards']>().toEqualTypeOf<CardRef[] | null>();
    expectTypeOf<GameState['gameId']>().toBeString();
    expectTypeOf<GameState['phase']>().toEqualTypeOf<PhaseId>();
    expect(state.log[0]?.text).toBe('Alice sends an agent to Arrakeen.');
  });

  it('models legal actions as a discriminated union', () => {
    const ownerId: PlayerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const card: CardRef = { cardId: 'card-1', cardKey: 'dune-imperium-dagger', ownerId };
    const intrigue: CardRef = { cardId: 'intrigue-1', cardKey: 'dune-imperium-ambush', ownerId };
    const rowCard: CardRef = { cardId: 'row-1', cardKey: 'dune-imperium-sardaukar-legion' };

    const actions: LegalAction[] = [
      { kind: 'playCard', card },
      { kind: 'sendAgent', card, spaceId: 'arrakeen' },
      { kind: 'deployTroops', count: 2 },
      { kind: 'useSignetRing', card },
      { kind: 'useLeaderAbility' },
      { kind: 'playIntrigue', intrigue, timing: 'plot' },
      { kind: 'acquireCard', card: rowCard, cost: 5 },
      { kind: 'pass' },
      { kind: 'confirmCombat' },
    ];
    expect(actions).toHaveLength(9);
    for (const action of actions) {
      if (action.kind === 'sendAgent') {
        expect(action.spaceId).toBe('arrakeen');
      }
      if (action.kind === 'acquireCard') {
        expect(action.cost).toBe(5);
      }
    }
    expectTypeOf<LegalAction>().toMatchTypeOf<{ kind: string }>();
  });
});