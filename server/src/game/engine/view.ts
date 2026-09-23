import type { BoardSpace, CombatView, FactionId, GameState, PlayerState } from '@dune/shared';
import { BOARD_SPACES } from './data/board.js';
import { getCard } from './data/cards.js';
import type { EngineState } from './types.js';
import { legalSpaces, legalSpacesForOpenAgent, supportedAcquire, supportedCombatIntrigue, supportedOnReveal } from './reducer.js';

export function toGameState(state: EngineState, viewForPlayerId: string | null = null): GameState {
  const board: BoardSpace[] = BOARD_SPACES.map((space) => ({
    id: space.id,
    name: space.name,
    icon: space.icon,
    cost: space.cost ? { solari: space.cost.solari ?? 0, spice: typeof space.cost.spice === 'number' ? space.cost.spice : 0, water: space.cost.water ?? 0, persuasion: 0 } : null,
    requirementText: space.requirementInfluence ? `Requires ${space.requirementInfluence.min} ${space.requirementInfluence.faction} Influence.` : null,
    occupantPlayerId: state.board.occupants[space.id]?.playerId ?? null,
    controllerPlayerId: state.board.controlMarkers[space.id] ?? null,
    bonusSpice: state.board.makerBonusSpice[space.id] ?? 0,
  }));
  const players: PlayerState[] = state.players.map((player) => ({
    playerId: player.playerId,
    name: player.name,
    color: player.color,
    leader: { cardId: `leader-${player.playerId}`, cardKey: player.leader },
    score: player.score,
    combatStrength: player.combatStrength,
    resources: { ...player.resources },
    troopsInSupply: player.troopsSupply,
    troopsInGarrison: player.troopsGarrison,
    troopsInConflict: player.troopsConflict,
    influence: { ...player.influence },
    alliances: [...player.alliances],
    hand: player.playerId === viewForPlayerId ? player.hand.map((card) => ({ cardId: card.id, cardKey: card.key })) : null,
    handCount: player.hand.length,
    deckCount: player.deck.length,
    discardCount: player.discard.length,
    intrigueCards: player.playerId === viewForPlayerId ? player.intrigueHand.map((card) => ({ cardId: card.id, cardKey: card.key })) : null,
    intrigueCount: player.intrigueHand.length,
    agentsRemaining: player.agentCount,
    agentsOnBoard: Object.values(state.board.occupants).filter((occupant) => occupant?.playerId === player.playerId).length,
    hasMentat: player.hasMentat,
  }));
  const combat: CombatView | null = state.phase === 'combat' && state.combat
    ? {
      activePlayerId: state.combat.intrigueWindow?.currentPlayerId ?? null,
      eligiblePlayerIds: state.combat.intrigueWindow?.eligible ?? [],
      consecutivePasses: state.combat.intrigueWindow?.passesInARow ?? 0,
      windowResolved: state.combat.resolved,
      strengths: state.players.map((player) => ({ playerId: player.playerId, strength: player.combatStrength })),
    }
    : null;
  return {
    gameId: state.gameId,
    lobbyCode: state.lobbyCode,
    roundNumber: state.roundNumber,
    phase: state.phase,
    currentPlayerId: state.currentPlayerId,
    firstPlayerId: state.firstPlayerId,
    viewForPlayerId,
    board,
    imperiumRow: state.imperiumRow.filter((card): card is NonNullable<typeof card> => card !== null).map((card) => ({ cardId: card.id, cardKey: card.key })),
    reserve: {
      arrakisLiaison: { cardKey: 'dune-imperium-arrakis-liaison', count: state.reserve['dune-imperium-arrakis-liaison'] ?? 0 },
      spiceMustFlow: { cardKey: 'dune-imperium-the-spice-must-flow', count: state.reserve['dune-imperium-the-spice-must-flow'] ?? 0 },
      foldspace: { cardKey: 'dune-imperium-foldspace', count: state.reserve['dune-imperium-foldspace'] ?? 0 },
    },
    conflict: { card: state.currentConflict ? { cardId: state.currentConflict.id, cardKey: state.currentConflict.key } : null },
    reveal: {
      revealed: state.revealTurn?.playerId === viewForPlayerId ? state.revealTurn.revealed.map((card) => ({ cardId: card.id, cardKey: card.key })) : null,
      pendingPersuasion: state.revealTurn?.playerId === viewForPlayerId ? (state.players.find((player) => player.playerId === viewForPlayerId)?.resources.persuasion ?? 0) : null,
      combatStrengthPreview: state.revealTurn?.playerId === viewForPlayerId ? (state.players.find((player) => player.playerId === viewForPlayerId)?.troopsConflict ?? 0) > 0 ? (state.players.find((player) => player.playerId === viewForPlayerId)?.troopsConflict ?? 0) * 2 + (state.players.find((player) => player.playerId === viewForPlayerId)?.swordsRevealed ?? 0) : 0 : null,
    },
    combat,
    players,
    legalActions: (() => {
      if (state.phase === 'combat') {
        const pending = state.combat?.pendingRewards?.find((entry) => entry.playerId === viewForPlayerId);
        if (pending?.reward.kind === 'influenceAny') return (['emperor', 'spacingGuild', 'beneGesserit', 'fremen'] as const satisfies readonly FactionId[]).map((faction) => ({ kind: 'chooseConflictInfluence' as const, faction }));
        const window = state.combat?.intrigueWindow;
        if (!window || state.combat?.resolved || window.currentPlayerId !== viewForPlayerId) return state.combat?.resolved && (state.combat.pendingRewards?.length ?? 0) === 0 && viewForPlayerId === state.firstPlayerId ? [{ kind: 'advancePhase' as const }] : [];
        const player = state.players.find((entry) => entry.playerId === viewForPlayerId);
        if (!player) return [];
        return [
          { kind: 'pass' as const },
          ...player.intrigueHand.filter((card) => supportedCombatIntrigue(card.key)).map((card) => ({ kind: 'playIntrigue' as const, intrigue: { cardId: card.id, cardKey: card.key }, timing: 'combat' as const })),
        ];
      }
      if (state.phase === 'makers' || state.phase === 'recall') return viewForPlayerId === state.firstPlayerId ? [{ kind: 'advancePhase' as const }] : [];
      if (viewForPlayerId !== state.currentPlayerId || state.phase !== 'playerTurns') return [];
      const player = state.players.find((entry) => entry.playerId === viewForPlayerId);
      if (!player) return [];
      if (state.revealTurn?.playerId === viewForPlayerId) return [
        { kind: 'confirmCombat' as const },
        ...state.imperiumRow.filter((card): card is NonNullable<typeof card> => card !== null).filter((card) => {
          const definition = getCard(card.key);
          return definition !== undefined && supportedAcquire(definition) && definition.cost <= player.resources.persuasion;
        }).map((card) => ({ kind: 'acquireCard' as const, card: { cardId: card.id, cardKey: card.key }, cost: getCard(card.key)!.cost })),
        ...(['dune-imperium-arrakis-liaison', 'dune-imperium-the-spice-must-flow'] as const).filter((key) => (state.reserve[key] ?? 0) > 0 && supportedAcquire(getCard(key)!)).filter((key) => getCard(key)!.cost <= player.resources.persuasion).map((key) => ({ kind: 'acquireCard' as const, card: { cardId: `${key}-reserve`, cardKey: key }, cost: getCard(key)!.cost })),
      ];
      if (state.agentTurn?.playerId === viewForPlayerId) {
        if (state.agentTurn.awaitingDeploy) return Array.from({ length: state.agentTurn.deployLimit + 1 }, (_, count) => ({ kind: 'deployTroops' as const, count }));
        const card = player.inPlay.find((entry) => entry.id === state.agentTurn?.playedCardId);
        return card ? legalSpacesForOpenAgent(state, viewForPlayerId).map((spaceId) => ({ kind: 'sendAgent' as const, card: { cardId: card.id, cardKey: card.key }, spaceId })) : [];
      }
      if (state.agentTurn) return [];
      const canReveal = player.hand.every((card) => supportedOnReveal(getCard(card.key)));
      return [
        ...player.hand.flatMap((card) => legalSpaces(state, viewForPlayerId!, card.id).length > 0 ? [{ kind: 'playCard' as const, card: { cardId: card.id, cardKey: card.key } }] : []),
        ...(canReveal ? [{ kind: 'pass' as const }] : []),
      ];
    })(),
    log: state.log.map((entry, index) => typeof entry === 'string' ? { id: `log-${index}`, roundNumber: state.roundNumber, phase: state.phase, playerId: null, text: entry, timestamp: new Date(0).toISOString() } : { id: `log-${index}`, roundNumber: state.roundNumber, phase: state.phase, playerId: entry.playerId ?? null, text: entry.text, timestamp: new Date(0).toISOString() }),
    ended: state.ended,
    winnerId: state.winner[0] ?? null,
  };
}
