/**
 * The internal state types of the pure rules engine.
 *
 * The engine is the source of truth for the rules of Dune: Imperium.
 * It is a pure state machine: apply(action) takes the current state and
 * one action and returns an accepted new state or a rejection. It has no
 * network code, no timers, no player-facing hiding (hiding is done by
 * view.ts). All randomness goes through the injected Rng interface so the
 * engine stays deterministic for a fixed seed (tests use that).
 *
 * The engine operates on an "active round" pull-together state: each
 * dispatching step is either a phase step or one player's action. The
 * reducer decides the next interactive window (phase/current player), never
 * blocks, and always produces some deterministic default for any mandated
 * choice. Every choice that v1 cannot represent with game fidelity is
 * resolved to a documented default and logged; TODO flags mark those spots.
 *
 * This file mirrors the shapes of the shared contract (GameState, GameAction,
 * LegalAction, PlayerState, phase, etc.) so that view.ts is a thin,
 * mechanical projection.
 */

import type {
  FactionId,
  GameId,
  LobbyCode,
  PhaseId,
  PlayerColor,
  PlayerId,
} from '@dune/shared';

/**
 * A deterministic random number generator.
 * It must produce values in [0, 1). One engine uses one Rng for all of
 * deck shuffling, draws, and random selections so a single seed yields a
 * fully reproducible game.
 */
export interface Rng {
  /** Produce one value in [0, 1). */
  next(): number;
}

/**
 * One card in a player's starting deck.
 * The key is a stable catalogue key; id is a unique per-instance id.
 */
export interface EngineCardRef {
  /** The unique instance id. */
  id: string;
  /** The stable catalogue key of the card. */
  key: string;
}

/**
 * The defensive-deploy window at Round Start.
 * The controller of the revealed Conflict space may deploy one troop.
 */
export interface DefensiveDeployState {
  /** The player who may deploy. */
  playerId: PlayerId;
}

/**
 * The open part of an Agent turn.
 * When it is non-null the player has played a card and must choose a space.
 */
export interface AgentTurnState {
  /** The player who opened the Agent turn. */
  playerId: PlayerId;
  /** The id of the card that was played. */
  playedCardId: string;
  /** The space the Agent will be sent to. It is null until chosen. */
  spaceId: string | null;
  /** The troops recruited during the current Agent turn. */
  recruitedThisTurn: number;
  /** The troops recruited from the board space during the current turn. */
  recruitedFromSpace: number;
  /** The total troops deployed this turn (from the recruited + garrison pool). */
  deployedThisTurn: number;
  /** True when the conflict came from a Combat space on this turn. */
  combatSpace: boolean;
  /**
   * The number of troops that may still be deployed this turn:
   * any troops recruited this turn plus up to two from the garrison.
   */
  deployLimit: number;
  /** True when the current window is a deploy window (awaitingDeploy). */
  awaitingDeploy: boolean;
  /** True after the player passes/ends the deploy window. */
  deployDone: boolean;
  /** True when the Signet Ring card was used on this Agent turn. */
  signetUsed: boolean;
}

/**
 * The state of a Reveal turn.
 * It is active while the player resolves a Reveal turn.
 */
export interface RevealTurnState {
  /** The player taking the Reveal turn. */
  playerId: PlayerId;
  /** The cards revealed this turn (their reveal effects resolved immediately or queued). */
  revealed: EngineCardRef[];
  /** True once the player confirms Combat (ends the turn). */
  confirmed: boolean;
  /** True once persuasion from the Reveal boxes has been applied. */
  persuasionApplied: boolean;
  /** The cards still left to reveal (when a draw during the Reveal turn adds cards). */
  pendingReveal: EngineCardRef[];
}

/** A Conflict reward that needs an explicit player choice. */
export interface PendingConflictReward {
  /** The player who must resolve the reward. */
  playerId: PlayerId;
  /** The reward that needs an explicit choice. */
  reward: import('./data/conflicts.js').ConflictReward;
}

/**
 * The state of the Combat phase.
 */
export interface CombatState {
  /** Rewards that need an explicit player choice before the phase can advance. */
  pendingRewards?: PendingConflictReward[];
  /** The intrigue-card window inside Combat; null when the Combat is resolved. */
  intrigueWindow: {
    /** The player whose turn it is to play a Combat Intrigue or pass. */
    currentPlayerId: PlayerId | null;
    /** The count of consecutive passes. When it reaches the eligible count, resolve. */
    passesInARow: number;
    /** The players who have at least one troop in the Conflict. */
    eligible: PlayerId[];
  } | null;
  /** True once the Combat Intrigue window has resolved. Rewards are not resolved yet. */
  resolved: boolean;
}

/**
 * The state of the Endgame phase.
 */
export interface EndgameState {
  /** The intrigue window of one player; null when the window is closed. */
  intrigueWindow: {
    /** The player whose Endgame Intrigue window is open. */
    playerId: PlayerId;
  } | null;
}

/**
 * The persistent state of one player.
 */
export interface EnginePlayerState {
  playerId: PlayerId;
  name: string;
  color: PlayerColor;
  leader: string;
  /** The Victory Points. */
  score: number;
  /** The resources. */
  resources: {
    solari: number;
    spice: number;
    water: number;
    persuasion: number;
  };
  /** The troops in supply, in garrison, and in the Conflict. */
  troopsSupply: number;
  troopsGarrison: number;
  troopsConflict: number;
  /** The Influence with each Faction (0..6). */
  influence: Record<FactionId, number>;
  /** The Alliances the player holds. */
  alliances: FactionId[];
  /** The hand of the player (owner view only). */
  hand: EngineCardRef[];
  /** The draw deck. The top is the last card of the array. */
  deck: EngineCardRef[];
  /** The discard pile. */
  discard: EngineCardRef[];
  /** The cards currently in play (Agent turns + revealed cards). */
  inPlay: EngineCardRef[];
  /** The Intrigue cards of the player (owner view only). */
  intrigueHand: EngineCardRef[];
  /** The count of Agents the player has: two, plus Mentat and Swordmaster. */
  agentCount: number;
  /** True when the player holds the Mentat (extra Agent this round). */
  hasMentat: boolean;
  /** True when the player holds the Swordmaster (third Agent). */
  hasSwordmaster: boolean;
  /** True when the player has taken a seat on the High Council (once per game). */
  councilorSeated: boolean;
  /** True when the Swordmaster board space has been used by the player (once per game). */
  swordmasterUsed: boolean;
  /** True once the player takes a Reveal turn this round. */
  revealed: boolean;
  /** The combat strength of the player this round (troops*2 + swords from revealed + intrigue). */
  combatStrength: number;
  /** The swords gained from revealed cards and Combat Intrigues this round. */
  swordsRevealed: number;
}

/**
 * One occupied board space.
 */
export interface SpaceOccupant {
  /** The player who occupies the space. */
  playerId: PlayerId;
  /** The card id that sent the Agent. */
  cardId: string;
}

/**
 * The state of the board.
 */
export interface BoardState {
  /** Per-space occupant. */
  occupants: Partial<Record<string, SpaceOccupant>>;
  /** The bonus spice on each Maker space. */
  makerBonusSpice: Record<string, number>;
  /** The Control marker owner per control space. */
  controlMarkers: Partial<Record<string, PlayerId>>;
}

/**
 * The full internal engine state.
 */
export interface EngineState {
  gameId: GameId;
  lobbyCode: LobbyCode;
  roundNumber: number;
  /** The phase. */
  phase: PhaseId;
  /** The current player. It is null when no player may act (makers, endgame end). */
  currentPlayerId: PlayerId | null;
  /** The First Player of the round. */
  firstPlayerId: PlayerId;
  players: EnginePlayerState[];
  board: BoardState;
  /** The Imperium deck. Imperium row refills come from the top. */
  imperiumDeck: EngineCardRef[];
  /** The Imperium Row. The 5 slots; null means already acquired. */
  imperiumRow: (EngineCardRef | null)[];
  /** The Reserve stacks: Arrakis Liaison, The Spice Must Flow. */
  reserve: Record<string, number>;
  /** The Conflict deck. The top is the last card. */
  conflictDeck: EngineCardRef[];
  /** The current Conflict card. It is revealed at Round Start. */
  currentConflict: EngineCardRef | null;
  /** The Intrigue deck and discard. */
  intrigueDeck: EngineCardRef[];
  intrigueDiscard: EngineCardRef[];
  /** The next defensive-deploy window at Round Start. */
  defensiveDeploy: DefensiveDeployState | null;
  /** The open Agent turn. It is null when no Agent turn is open. */
  agentTurn: AgentTurnState | null;
  /** The open Reveal turn. It is null when no Reveal turn is open. */
  revealTurn: RevealTurnState | null;
  /** The Combat state. */
  combat: CombatState | null;
  /** The Endgame state. */
  endgame: EndgameState | null;
  /** True when the game has ended. */
  ended: boolean;
  /** The IDs of the winning players. It is empty when the game has not ended. */
  winner: PlayerId[];
  /** The game log. */
  log: (string | { text: string; playerId?: PlayerId | null })[];
  /** The injected Rng. */
  rng: Rng;
}

/**
 * The dispatch step phases in order.
 */
export const PHASE_ORDER: readonly PhaseId[] = [
  'roundStart',
  'playerTurns',
  'combat',
  'makers',
  'recall',
  'endgame',
] as const;

/** The number of troops in the garrison at setup. */
export const STARTING_GARRISON_TROOPS = 3;
/** The number of troops a player starts in the Conflict. */
export const STARTING_CONFLICT_TROOPS = 0;
/** The number of troops a player may deploy up to two times per Agent turn. */
export const GARRISON_DEPLOY_LIMIT = 2;
/** A troop in the Conflict is worth this much strength. */
export const CONFLICT_TROOP_STRENGTH = 2;
/** The number of VP needed to trigger the Endgame. */
export const ENDGAME_VICTORY_POINTS = 10;
/** The number of cards drawn at Round Start. */
export const ROUND_DRAW_COUNT = 5;
