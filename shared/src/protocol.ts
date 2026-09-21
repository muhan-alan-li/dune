/**
 * The shared API protocol.
 *
 * This file is a contract only. It contains no rules and no network code.
 * It defines:
 * - the REST paths
 * - the WebSocket path
 * - the server messages
 * - the action request and response
 */

import type { GameId, GameState, Lobby, LobbyCode, PhaseId, PlayerId } from './types.js';
import type { RejectCode } from './errors.js';

/**
 * The REST path templates.
 * The value is the HTTP method followed by the path template.
 */
export const RestPath = {
  /** Create a lobby. */
  createLobby: 'POST /api/lobbies',
  /** Join a lobby with a code. */
  joinLobby: 'POST /api/lobbies/:code/join',
  /** Get one lobby with a code. */
  getLobby: 'GET /api/lobbies/:code',
  /** Send one action to a game. */
  sendAction: 'POST /api/games/:id/actions',
  /** Get the state of a game. */
  getState: 'GET /api/games/:id/state',
} as const;

/** One REST path template. */
export type RestPathTemplate = (typeof RestPath)[keyof typeof RestPath];

/**
 * The WebSocket path templates.
 */
export const WsPath = {
  /** The live update stream of a game. */
  stream: '/api/games/:id/stream',
} as const;

/** One WebSocket path template. */
export type WsPathTemplate = (typeof WsPath)[keyof typeof WsPath];

/**
 * Builders for the REST paths.
 * Each builder returns the concrete path for the given values.
 */
export const api = {
  /** The path to create a lobby. */
  createLobby: (): string => '/api/lobbies',
  /** The path to join the lobby with the given code. */
  joinLobby: (code: LobbyCode): string => `/api/lobbies/${code}/join`,
  /** The path to get the lobby with the given code. */
  getLobby: (code: LobbyCode): string => `/api/lobbies/${code}`,
  /** The path to send an action to the game with the given ID. */
  sendAction: (gameId: GameId): string => `/api/games/${gameId}/actions`,
  /** The path to get the state of the game with the given ID. */
  getState: (gameId: GameId): string => `/api/games/${gameId}/state`,
  /** The path to the stream of the game with the given ID. */
  stream: (gameId: GameId): string => `/api/games/${gameId}/stream`,
} as const;

/**
 * The type of each server message.
 */
export type ServerMessageType =
  | 'LobbyUpdated'
  | 'GameStarted'
  | 'StateUpdated'
  | 'ActionAccepted'
  | 'ActionRejected'
  | 'TurnChanged'
  | 'PhaseChanged'
  | 'GameEnded';

/**
 * The list of all server message types in canonical order.
 */
export const SERVER_MESSAGE_TYPES: readonly ServerMessageType[] = [
  'LobbyUpdated',
  'GameStarted',
  'StateUpdated',
  'ActionAccepted',
  'ActionRejected',
  'TurnChanged',
  'PhaseChanged',
  'GameEnded',
];

/**
 * A message that the server sends over the WebSocket stream.
 * The field type is the message type.
 */
export type ServerMessage =
  /** The lobby has changed. */
  | { type: 'LobbyUpdated'; lobby: Lobby; timestamp: string }
  /** The game has started. */
  | { type: 'GameStarted'; gameId: GameId; lobbyCode: LobbyCode; timestamp: string }
  /** The game state has changed. */
  | { type: 'StateUpdated'; gameId: GameId; state: GameState; timestamp: string }
  /** One action was accepted. */
  | { type: 'ActionAccepted'; gameId: GameId; actionId: string; timestamp: string }
  /** One action was rejected. The code explains the reason. */
  | {
      type: 'ActionRejected';
      gameId: GameId;
      actionId: string;
      code: RejectCode;
      reason: string;
      timestamp: string;
    }
  /** The turn has changed to another player. */
  | { type: 'TurnChanged'; gameId: GameId; playerId: PlayerId; timestamp: string }
  /** The phase has changed. */
  | { type: 'PhaseChanged'; gameId: GameId; phase: PhaseId; timestamp: string }
  /** The game has ended. */
  | { type: 'GameEnded'; gameId: GameId; winnerId: PlayerId; state: GameState; timestamp: string };

/**
 * One action that a player sends to the server.
 * It is the body of POST /api/games/:id/actions.
 */
export type GameAction =
  /** Play one card from the hand on an Agent turn. */
  | { kind: 'playCard'; cardId: string }
  /** Send an agent to a board space with a played card. */
  | { kind: 'sendAgent'; cardId: string; spaceId: string }
  /** Deploy a number of troops to the Conflict. */
  | { kind: 'deployTroops'; count: number }
  /** Use the Signet Ring ability of the Leader. */
  | { kind: 'useSignetRing'; cardId: string }
  /** Use the Leader ability. */
  | { kind: 'useLeaderAbility' }
  /** Play an Intrigue card. */
  | { kind: 'playIntrigue'; intrigueId: string }
  /** Acquire one card from the Imperium Row or the Reserve. */
  | { kind: 'acquireCard'; cardKey: string }
  /** Pass and take no more Agent turns. */
  | { kind: 'pass' }
  /** Confirm the Combat strength at the end of a Reveal turn. */
  | { kind: 'confirmCombat' };

/**
 * The response to one action.
 * The server returns it for POST /api/games/:id/actions.
 */
export type ActionResponse =
  /** The action was accepted. */
  | { accepted: true; actionId: string; state: GameState }
  /** The action was rejected. */
  | { accepted: false; code: RejectCode; reason: string };