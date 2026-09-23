/**
 * Shared types for the Dune Imperium online game.
 *
 * This file is a contract only. It contains no game rules and no network code.
 * The client and the server import these types. Do not duplicate them.
 *
 * Rules for values:
 * - IDs are strings in UUID format.
 * - Resources are numbers.
 * - The GameState view is marked with viewForPlayerId.
 */

/** The ID of a player. It is a string in UUID format. */
export type PlayerId = string;

/** The ID of a game. It is a string in UUID format. */
export type GameId = string;

/** The unique code of a lobby. It is a short string, for example "AB12". */
export type LobbyCode = string;

/** The color of a player. It is one of the four player colors. */
export type PlayerColor = 'red' | 'blue' | 'green' | 'black';

/** The four factions of the game. */
export type FactionId = 'emperor' | 'spacingGuild' | 'beneGesserit' | 'fremen';

/** The phase of a round. */
export type PhaseId =
  | 'roundStart'
  | 'playerTurns'
  | 'combat'
  | 'makers'
  | 'recall'
  | 'endgame';

/** The seven agent icons on cards. */
export type AgentIcon =
  | 'emperor'
  | 'spacingGuild'
  | 'beneGesserit'
  | 'fremen'
  | 'landsraad'
  | 'city'
  | 'spiceTrade';

/** The time when an intrigue card may be played. */
export type IntrigueTiming = 'plot' | 'combat' | 'endgame';

/**
 * The resources of a player.
 * Each value is a number.
 */
export interface Resources {
  /** The amount of Solari. */
  solari: number;
  /** The amount of spice. */
  spice: number;
  /** The amount of water. */
  water: number;
  /** The amount of Persuasion. */
  persuasion: number;
}

/**
 * A reference to one card.
 * The cardId is the ID of the card instance in the game.
 * The cardKey is the stable key of the card in the catalogue,
 * for example "dune-imperium-sardaukar-legion".
 */
export interface CardRef {
  /** The ID of the card instance. It is a string in UUID format. */
  cardId: string;
  /** The stable key of the card in the catalogue. */
  cardKey: string;
  /** The ID of the player who owns the card. It is present for a card in a player's zone. */
  ownerId?: PlayerId;
}

/**
 * One board space.
 * The space does not carry rules. It carries the data that a player can view.
 */
export interface BoardSpace {
  /** The stable ID of the space, for example "arrakeen". */
  id: string;
  /** The display name of the space. */
  name: string;
  /** The agent icon that the played card must match. It is null when no icon is required. */
  icon: AgentIcon | null;
  /** The cost to send an agent to the space. It is null when the space has no cost. */
  cost: Resources | null;
  /** The requirement text of the space. It is null when the space has no requirement. */
  requirementText: string | null;
  /** The ID of the player whose agent is on the space. It is null when the space is empty. */
  occupantPlayerId: PlayerId | null;
  /** The ID of the player who controls the space. It is null when no player controls it. */
  controllerPlayerId: PlayerId | null;
  /** The amount of bonus spice on a Maker space. */
  bonusSpice: number;
}

/**
 * One player in a lobby.
 * The host is the player who created the lobby.
 */
export interface Player {
  /** The ID of the player. */
  id: PlayerId;
  /** The display name of the player. */
  name: string;
  /** The color of the player. It is null until the host sets it. */
  color: PlayerColor | null;
  /** The leader of the player. It is null until the host sets it. */
  leader: CardRef | null;
  /** True when the player is the host. */
  isHost: boolean;
  /** True when the player is ready to play. */
  isReady: boolean;
  /** True when the player is connected. */
  isConnected: boolean;
}

/**
 * A lobby.
 * The lobby becomes a game when the host starts it.
 */
export interface Lobby {
  /** The unique code of the lobby. */
  code: LobbyCode;
  /** The ID of the game. It is null until the game starts. */
  gameId: GameId | null;
  /** The ID of the host player. */
  hostId: PlayerId;
  /** The players in the lobby. */
  players: Player[];
  /** The minimum number of players for the game. It is 3. */
  minPlayers: number;
  /** The maximum number of players in the game. It is 4. */
  maxPlayers: number;
}

/**
 * One stack of identical Reserve cards.
 */
export interface ReserveStack {
  /** The stable key of the stack card in the catalogue. */
  cardKey: string;
  /** The number of cards in the stack. */
  count: number;
}

/**
 * The view of the Reserve stacks.
 */
export interface ReserveView {
  /** The Arrakis Liaison stack. */
  arrakisLiaison: ReserveStack;
  /** The Spice Must Flow stack. */
  spiceMustFlow: ReserveStack;
  /** The Foldspace stack. */
  foldspace: ReserveStack;
}

/**
 * The view of the current Conflict.
 */
export interface ConflictView {
  /** The current Conflict card. It is null when the Conflict is not resolved yet. */
  card: CardRef | null;
}

/**
 * One entry in the game log.
 */
export interface GameLogEntry {
  /** The ID of the entry. It is a string in UUID format. */
  id: string;
  /** The round number in which the entry happened. */
  roundNumber: number;
  /** The phase in which the entry happened. */
  phase: PhaseId;
  /** The ID of the player who caused the entry. It is null for a round event. */
  playerId: PlayerId | null;
  /** The text of the entry. */
  text: string;
  /** The time of the entry in ISO 8601 format. */
  timestamp: string;
}

/**
 * One action that the current player may take now.
 * The server sends only legal actions for the current player.
 */
export type LegalAction =
  /** Play one card from the hand on an Agent turn. */
  | { kind: 'playCard'; card: CardRef }
  /** Send an agent to a board space with a played card. */
  | { kind: 'sendAgent'; card: CardRef; spaceId: string }
  /** Deploy a number of troops to the Conflict. */
  | { kind: 'deployTroops'; count: number }
  /** Use the Signet Ring ability of the Leader. */
  | { kind: 'useSignetRing'; card: CardRef }
  /** Use the Leader ability. */
  | { kind: 'useLeaderAbility' }
  /** Play an Intrigue card. */
  | { kind: 'playIntrigue'; intrigue: CardRef; timing: IntrigueTiming }
  /** Acquire one card from the Imperium Row or the Reserve. */
  | { kind: 'acquireCard'; card: CardRef; cost: number }
  /** Pass and take no more Agent turns. */
  | { kind: 'pass' }
  /** Confirm the Combat strength at the end of a Reveal turn. */
  | { kind: 'confirmCombat' };

/**
 * The state of one player during a game.
 * The client and the server hide data with viewForPlayerId:
 * - The owner sees the full hand and the full Intrigue cards.
 * - An opponent sees only the counts.
 * - No player sees the deck order.
 */
export interface PlayerState {
  /** The ID of the player. */
  playerId: PlayerId;
  /** The display name of the player. */
  name: string;
  /** The color of the player. */
  color: PlayerColor;
  /** The leader of the player. */
  leader: CardRef;
  /** The Victory Points of the player. */
  score: number;
  /** The Combat strength of the player. */
  combatStrength: number;
  /** The resources of the player. */
  resources: Resources;
  /** The number of troops in the supply of the player. */
  troopsInSupply: number;
  /** The number of troops in the garrison of the player. */
  troopsInGarrison: number;
  /** The number of troops in the Conflict of the player. */
  troopsInConflict: number;
  /** The Influence of the player with each Faction. */
  influence: Record<FactionId, number>;
  /** The Factions with which the player has an Alliance. */
  alliances: FactionId[];
  /** The full hand of the player. It is present only for the owner. It is null for an opponent. */
  hand: CardRef[] | null;
  /** The number of cards in the hand of the player. */
  handCount: number;
  /** The number of cards in the deck of the player. */
  deckCount: number;
  /** The number of cards in the discard pile of the player. */
  discardCount: number;
  /** The full Intrigue cards of the player. It is present only for the owner. It is null for an opponent. */
  intrigueCards: CardRef[] | null;
  /** The number of Intrigue cards of the player. */
  intrigueCount: number;
  /** The number of agents on the Leader of the player. */
  agentsRemaining: number;
  /** The number of agents on the board spaces. */
  agentsOnBoard: number;
  /** True when the player has the Mentat on their Leader. */
  hasMentat: boolean;
}

/**
 * The state of a game.
 * The field viewForPlayerId marks the player for whom the state is made:
 * - It is the ID of the owner for a private view.
 * - It is null for a public view.
 */
export interface GameState {
  /** The ID of the game. */
  gameId: GameId;
  /** The unique code of the lobby from which the game started. */
  lobbyCode: LobbyCode;
  /** The number of the current round. */
  roundNumber: number;
  /** The current phase. */
  phase: PhaseId;
  /** The ID of the player whose turn it is. It is null outside the player turns. */
  currentPlayerId: PlayerId | null;
  /** The ID of the player who has the First Player marker. */
  firstPlayerId: PlayerId;
  /** The player for whom the state is made. It is null for a public view. */
  viewForPlayerId: PlayerId | null;
  /** The board spaces. */
  board: BoardSpace[];
  /** The five cards in the Imperium Row. */
  imperiumRow: CardRef[];
  /** The Reserve stacks. */
  reserve: ReserveView;
  /** The current Conflict. */
  conflict: ConflictView;
  /** The state of each player. */
  players: PlayerState[];
  /** The legal actions for the current player. It is empty when the game is not in player turns. */
  legalActions: LegalAction[];
  /** The game log. */
  log: GameLogEntry[];
  /** True when the game has ended. */
  ended: boolean;
  /** The ID of the winner. It is null until the game ends. */
  winnerId: PlayerId | null;
}