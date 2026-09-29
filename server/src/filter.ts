import type { GameState } from '@dune/shared';
import { toGameState, type EngineState } from './game/engine/index.js';

/** Build a private view. The engine projection removes hidden cards for opponents. */
export function filterGameState(state: EngineState, playerId: string): GameState {
    return toGameState(state, playerId);
}
