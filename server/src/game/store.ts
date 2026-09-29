import { randomUUID } from 'node:crypto';
import type { GameAction, GameId, LobbyCode } from '@dune/shared';
import {
    applyAction,
    createGame,
    startRound,
    toGameState,
    type EngineState,
    type SetupPlayer,
} from './engine/index.js';
import type { EngineRejection } from './engine/reducer.js';

export interface ActionLogEntry {
    actionId: string;
    playerId: string;
    action: GameAction;
    accepted: boolean;
    timestamp: string;
}

export interface StoredGame {
    gameId: GameId;
    lobbyCode: LobbyCode;
    state: EngineState;
    actions: ActionLogEntry[];
}

export class GameStore {
    private readonly games = new Map<GameId, StoredGame>();

    start(
        lobbyCode: LobbyCode,
        gameId: GameId,
        players: readonly SetupPlayer[],
        seed = Date.now(),
    ): StoredGame {
        const initial = createGame(players, { gameId, lobbyCode, seed });
        const game: StoredGame = { gameId, lobbyCode, state: startRound(initial), actions: [] };
        this.games.set(gameId, game);
        return game;
    }

    get(gameId: string): StoredGame {
        const game = this.games.get(gameId);
        if (!game) throw new Error('The game does not exist.');
        return game;
    }

    state(gameId: string, playerId: string) {
        return toGameState(this.get(gameId).state, playerId);
    }

    action(
        gameId: string,
        playerId: string,
        action: GameAction,
    ):
        | { accepted: true; actionId: string; state: ReturnType<GameStore['state']> }
        | ({ accepted: false; actionId: string } & EngineRejection) {
        const game = this.get(gameId);
        const actionId = randomUUID();
        const result = applyAction(game.state, playerId, action);
        game.actions.push({
            actionId,
            playerId,
            action,
            accepted: result.accepted,
            timestamp: new Date().toISOString(),
        });
        if (!result.accepted) return { ...result, actionId };
        game.state = result.state;
        return { accepted: true, actionId, state: toGameState(game.state, playerId) };
    }
}
