import type { PlayerColor, PlayerId } from '@dune/shared';
import { BOARD_SPACES } from './data/board.js';
import { ALL_CARDS, STARTER_CARDS } from './data/cards.js';
import { ALL_CONFLICTS, CONFLICT_I, CONFLICT_II, CONFLICT_III } from './data/conflicts.js';
import { LEADERS } from './data/leaders.js';
import { INTRIGUE_CARDS } from './data/intrigue.js';
import {
    MAX_PLAYERS,
    MIN_PLAYERS,
    STARTING_GARRISON_TROOPS,
    STARTING_RESOURCES,
    startingScore,
} from './data/constants.js';
import type { EngineCardRef, EnginePlayerState, EngineState, Rng } from './types.js';

export interface SetupPlayer {
    playerId: PlayerId;
    name: string;
    color: PlayerColor;
    leader?: string;
}

export interface SetupOptions {
    gameId?: string;
    lobbyCode?: string;
    seed?: number;
    rng?: Rng;
}

const COLORS: readonly PlayerColor[] = ['red', 'blue', 'green', 'black'];

function seededRng(seed: number): Rng {
    let value = seed >>> 0;
    return {
        next: () => {
            value = (value * 1664525 + 1013904223) >>> 0;
            return value / 0x100000000;
        },
    };
}

function shuffled<T>(items: readonly T[], rng: Rng): T[] {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
        const swap = Math.floor(rng.next() * (index + 1));
        const current = result[index];
        result[index] = result[swap]!;
        result[swap] = current!;
    }
    return result;
}

function cardCopies(kind: 'starter' | 'imperium' | 'conflict'): EngineCardRef[] {
    if (kind === 'conflict') {
        return Object.values(ALL_CONFLICTS)
            .flat()
            .map((card, index) => ({ id: `${card.key}-${index}`, key: card.key }));
    }
    const source =
        kind === 'starter'
            ? STARTER_CARDS
            : [...ALL_CARDS.values()].filter((card) => card.kind === 'imperium');
    let sequence = 0;
    return source.flatMap((card) =>
        Array.from({ length: card.copies }, () => ({
            id: `${card.key}-${sequence++}`,
            key: card.key,
        })),
    );
}

function starterDeck(playerIndex: number): EngineCardRef[] {
    const cards = STARTER_CARDS.flatMap((card) =>
        Array.from({ length: card.copies }, (_, copy) => ({
            id: `p${playerIndex}-${card.key}-${copy}`,
            key: card.key,
        })),
    );
    return cards;
}

function conflictDeck(rng: Rng): EngineCardRef[] {
    const copies = (
        cards: readonly (typeof CONFLICT_I)[number][],
        count: number,
    ): EngineCardRef[] =>
        shuffled(cards, rng)
            .slice(0, count)
            .map((card, index) => ({ id: `${card.key}-${index}`, key: card.key }));
    // The array top is the last element. Put tier I on top, then tier II, then tier III.
    return [...copies(CONFLICT_III, 4), ...copies(CONFLICT_II, 5), ...copies(CONFLICT_I, 1)];
}

function playerState(
    player: SetupPlayer,
    index: number,
    playerCount: number,
    rng: Rng,
): EnginePlayerState {
    const deck = shuffled(starterDeck(index), rng);
    const leader = player.leader ?? LEADERS[index % LEADERS.length]!.key;
    return {
        playerId: player.playerId,
        name: player.name,
        color: player.color,
        leader,
        score: startingScore(playerCount),
        resources: { ...STARTING_RESOURCES },
        troopsSupply: 9,
        troopsGarrison: STARTING_GARRISON_TROOPS,
        troopsConflict: 0,
        influence: { emperor: 0, spacingGuild: 0, beneGesserit: 0, fremen: 0 },
        alliances: [],
        hand: [],
        deck,
        discard: [],
        inPlay: [],
        intrigueHand: [],
        agentCount: 2,
        hasMentat: false,
        hasSwordmaster: false,
        councilorSeated: false,
        swordmasterUsed: false,
        revealed: false,
        combatStrength: 0,
        swordsRevealed: 0,
    };
}

export function createGame(
    players: readonly SetupPlayer[],
    options: SetupOptions = {},
): EngineState {
    if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) {
        throw new Error(`A game requires ${MIN_PLAYERS} to ${MAX_PLAYERS} players.`);
    }
    const rng = options.rng ?? seededRng(options.seed ?? 1);
    const firstPlayerIndex = Math.floor(rng.next() * players.length);
    const orderedPlayers = players.map((player, index) => ({
        ...player,
        color: player.color ?? COLORS[index]!,
    }));
    const imperiumDeck = shuffled(cardCopies('imperium'), rng);
    const conflicts = conflictDeck(rng);
    let intrigueSequence = 0;
    const intrigueCopies = INTRIGUE_CARDS.flatMap((card) =>
        Array.from({ length: card.copies }, () => ({
            id: `${card.key}-${intrigueSequence++}`,
            key: card.key,
        })),
    );
    const intrigueDeck = shuffled(intrigueCopies, rng);
    const row = imperiumDeck.splice(0, 5);
    const reserve = {
        'dune-imperium-arrakis-liaison': 8,
        'dune-imperium-the-spice-must-flow': 10,
        'dune-imperium-foldspace': 6,
    };
    return {
        gameId: options.gameId ?? 'game-1',
        lobbyCode: options.lobbyCode ?? 'TEST',
        roundNumber: 1,
        phase: 'roundStart',
        currentPlayerId: null,
        firstPlayerId: orderedPlayers[firstPlayerIndex]!.playerId,
        players: orderedPlayers.map((player, index) =>
            playerState(player, index, orderedPlayers.length, rng),
        ),
        board: {
            occupants: {},
            makerBonusSpice: Object.fromEntries(
                BOARD_SPACES.filter((space) => space.maker).map((space) => [space.id, 0]),
            ),
            controlMarkers: {},
        },
        imperiumDeck,
        imperiumRow: row,
        reserve,
        conflictDeck: conflicts,
        currentConflict: null,
        intrigueDeck,
        intrigueDiscard: [],
        defensiveDeploy: null,
        agentTurn: null,
        revealTurn: null,
        combat: null,
        endgame: null,
        ended: false,
        winner: [],
        log: [],
        rng,
    };
}

export function startRound(state: EngineState): EngineState {
    if (state.phase !== 'roundStart') return state;
    const next = cloneState(state);
    const conflict = next.conflictDeck.pop() ?? null;
    next.currentConflict = conflict;
    for (const player of next.players) {
        player.hand.push(...draw(player, 5, next.rng));
        player.revealed = false;
        player.combatStrength = 0;
        player.swordsRevealed = 0;
    }
    next.phase = 'playerTurns';
    next.currentPlayerId = next.firstPlayerId;
    return next;
}

export function draw(player: EnginePlayerState, count: number, rng?: Rng): EngineCardRef[] {
    const drawn: EngineCardRef[] = [];
    for (let index = 0; index < count; index += 1) {
        if (player.deck.length === 0) {
            const rebuilt = player.discard.splice(0);
            if (rng) player.deck.push(...shuffled(rebuilt, rng));
            else player.deck.push(...rebuilt);
        }
        const card = player.deck.pop();
        if (card) drawn.push(card);
    }
    return drawn;
}

function cloneState(state: EngineState): EngineState {
    return {
        ...state,
        players: state.players.map((player) => ({
            ...player,
            resources: { ...player.resources },
            influence: { ...player.influence },
            hand: [...player.hand],
            deck: [...player.deck],
            discard: [...player.discard],
            inPlay: [...player.inPlay],
            intrigueHand: [...player.intrigueHand],
            alliances: [...player.alliances],
        })),
        board: {
            occupants: { ...state.board.occupants },
            makerBonusSpice: { ...state.board.makerBonusSpice },
            controlMarkers: { ...state.board.controlMarkers },
        },
        imperiumDeck: [...state.imperiumDeck],
        imperiumRow: [...state.imperiumRow],
        reserve: { ...state.reserve },
        conflictDeck: [...state.conflictDeck],
        intrigueDeck: [...state.intrigueDeck],
        intrigueDiscard: [...state.intrigueDiscard],
        agentTurn: state.agentTurn ? { ...state.agentTurn } : null,
        revealTurn: state.revealTurn
            ? {
                  ...state.revealTurn,
                  revealed: [...state.revealTurn.revealed],
                  pendingReveal: [...state.revealTurn.pendingReveal],
              }
            : null,
        combat: state.combat
            ? {
                  ...state.combat,
                  intrigueWindow: state.combat.intrigueWindow
                      ? {
                            ...state.combat.intrigueWindow,
                            eligible: [...state.combat.intrigueWindow.eligible],
                        }
                      : null,
              }
            : null,
        endgame: state.endgame
            ? {
                  ...state.endgame,
                  intrigueWindow: state.endgame.intrigueWindow
                      ? { ...state.endgame.intrigueWindow }
                      : null,
              }
            : null,
        log: [...state.log],
        winner: [...state.winner],
    };
}
