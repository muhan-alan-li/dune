import { RejectCode, type GameAction } from '@dune/shared';
import { getIntrigue } from './data/intrigue.js';
import { BOARD_SPACES, getBoardSpace, type SpaceCost } from './data/board.js';
import { getCard, type CardDef } from './data/cards.js';
import { getConflict, type ConflictReward } from './data/conflicts.js';
import { draw } from './setup.js';
import { describeInfluenceMove } from './data/tracks.js';
import type { EngineCardRef, EnginePlayerState, EngineState, PendingConflictReward } from './types.js';

export interface EngineRejection {
  accepted: false;
  code: (typeof RejectCode)[keyof typeof RejectCode];
  reason: string;
}
export interface EngineSuccess { accepted: true; state: EngineState; }
export type EngineResult = EngineSuccess | EngineRejection;

function reject(code: EngineRejection['code'], reason: string): EngineRejection { return { accepted: false, code, reason }; }
function playerFor(state: EngineState, playerId: string): EnginePlayerState | undefined { return state.players.find((player) => player.playerId === playerId); }
function cardInHand(player: EnginePlayerState, cardId: string): EngineCardRef | undefined { return player.hand.find((card) => card.id === cardId); }

function canPay(player: EnginePlayerState, cost: SpaceCost): boolean {
  return (cost.solari ?? 0) <= player.resources.solari
    && (cost.water ?? 0) <= player.resources.water
    && (typeof cost.spice === 'number' ? cost.spice <= player.resources.spice : cost.spice === undefined);
}
function pay(player: EnginePlayerState, cost: SpaceCost): void {
  player.resources.solari -= cost.solari ?? 0;
  player.resources.water -= cost.water ?? 0;
  if (typeof cost.spice === 'number') player.resources.spice -= cost.spice;
}
function recruit(player: EnginePlayerState, count: number): number {
  const amount = Math.min(count, player.troopsSupply);
  player.troopsSupply -= amount;
  player.troopsGarrison += amount;
  return amount;
}
function drawIntrigue(state: EngineState, player: EnginePlayerState, count: number): void {
  for (let index = 0; index < count; index += 1) {
    if (state.intrigueDeck.length === 0) state.intrigueDeck.push(...state.intrigueDiscard.splice(0));
    const card = state.intrigueDeck.pop();
    if (card) player.intrigueHand.push(card);
  }
}
/**
 * Return an Influence transition without changing the input player.
 * Level-four bonuses and Alliances are intentionally not supported yet.
 */
export function changeInfluence(player: EnginePlayerState, faction: keyof EnginePlayerState['influence'], amount = 1): EnginePlayerState {
  const from = player.influence[faction];
  const to = Math.max(0, Math.min(6, from + amount));
  return {
    ...player,
    influence: { ...player.influence, [faction]: to },
    score: player.score + describeInfluenceMove(from, to, faction).vpChange,
  };
}

function addInfluence(player: EnginePlayerState, faction: keyof EnginePlayerState['influence'], amount = 1): void {
  const updated = changeInfluence(player, faction, amount);
  player.influence = updated.influence;
  player.score = updated.score;
}
function supportedBoardEffect(kind: string): boolean {
  // Swordmaster needs its third-Agent effect before it can be offered safely.
  // These spaces are kept out of legal actions until their choices are modeled.
  return !['sellMelange', 'selectiveBreeding', 'secrets', 'highCouncil', 'mentat', 'swordmaster'].includes(kind);
}

function applyBoardEffect(state: EngineState, player: EnginePlayerState, spaceId: string): number {
  const definition = getBoardSpace(spaceId);
  if (!definition) throw new Error(`Unknown board space: ${spaceId}`);
  let recruited = 0;
  switch (definition.effect.kind) {
    case 'solari': player.resources.solari += definition.effect.solari; break;
    case 'recruit': recruited += recruit(player, definition.effect.troops); break;
    case 'hallOfOratory': recruited += recruit(player, 1); break;
    case 'influence': break;
    case 'influenceAndSolari': player.resources.solari += definition.effect.solari; break;
    case 'influenceAndWater': player.resources.water += definition.effect.water; break;
    case 'influenceAndTroops': recruited += recruit(player, definition.effect.troops); break;
    case 'influenceAndTroopsAndWater': recruited += recruit(player, definition.effect.troops); player.resources.water += definition.effect.water; break;
    case 'maker': player.resources.spice += definition.effect.spice + (state.board.makerBonusSpice[spaceId] ?? 0); state.board.makerBonusSpice[spaceId] = 0; break;
    case 'troopsAndDraw': recruited += recruit(player, definition.effect.troops); player.hand.push(...draw(player, definition.effect.draw, state.rng)); break;
    case 'troopsAndIntrigue': recruited += recruit(player, definition.effect.troops); drawIntrigue(state, player, 1); break;
    case 'recruitAndWater': recruited += recruit(player, definition.effect.troops); player.resources.water += definition.effect.water; break;
    case 'conspire': player.resources.solari += 5; recruited += recruit(player, 2); drawIntrigue(state, player, 1); break;
    case 'foldspace':
      state.reserve['dune-imperium-foldspace'] = (state.reserve['dune-imperium-foldspace'] ?? 0) - 1;
      player.discard.push({ id: `foldspace-${state.roundNumber}-${player.discard.length}`, key: 'dune-imperium-foldspace' });
      break;
    case 'drawCards': player.hand.push(...draw(player, definition.effect.draw, state.rng)); break;
    case 'sellMelange':
    case 'selectiveBreeding':
    case 'secrets':
    case 'highCouncil':
    case 'mentat':
      throw new Error(`Unsupported board effect: ${definition.effect.kind}`);
  }
  return recruited;
}

/**
 * Cards supported by the current Reveal slice.
 *
 * This is an explicit allowlist, not an inference from the shape of card
 * metadata. The slice resolves scalar Persuasion, swords, Solari, spice, and
 * water effects only. It does not resolve choices, costs, discounts, Bonds,
 * Alliances, opponent effects, Victory Points, trash, or draw queues. Keep
 * this list narrow until ordered Reveal decisions are implemented.
 */
const SCALAR_REVEAL_CARD_KEYS: ReadonlySet<string> = new Set([
  'dune-imperium-assassination-mission',
  'dune-imperium-dr-yueh',
  'dune-imperium-sardaukar-infantry',
  'dune-imperium-guild-administrator',
  'dune-imperium-duncan-idaho',
  'dune-imperium-bene-gesserit-initiate',
  'dune-imperium-bene-gesserit-sister',
  'dune-imperium-space-travel',
  'dune-imperium-stilgar',
  'dune-imperium-lady-jessica',
  'dune-imperium-convincing-argument',
  'dune-imperium-dagger',
  'dune-imperium-diplomacy',
  'dune-imperium-dune-the-desert-planet',
  'dune-imperium-reconnaissance',
  'dune-imperium-arrakis-liaison',
  // These normal starter cards have no Reveal effect. They must remain
  // valid in a hand so a player can complete a normal five-card Reveal.
  'dune-imperium-seek-allies',
  'dune-imperium-signet-ring',
  'dune-imperium-the-spice-must-flow',
]);

export function supportedOnReveal(card: CardDef | undefined): boolean {
  if (!card || !SCALAR_REVEAL_CARD_KEYS.has(card.key)) return false;
  const effect = card.onReveal;
  if (!effect) return true;
  // Every draw card is gated. Draw resolution needs an explicit queue and
  // ordered decisions before it can be safe. The allowlist also excludes all
  // other non-scalar effects, including the named conditional cards.
  return effect.draw === undefined
    && effect.drawIntrigue === undefined
    && effect.vp === undefined
    && effect.trashSelf !== true
    && effect.bumps === undefined
    && effect.deployFromGarrison === undefined;
}

function applyRevealEffect(player: EnginePlayerState, card: EngineCardRef): void {
  const definition = getCard(card.key);
  if (!definition || !supportedOnReveal(definition)) return;
  const effect = definition.onReveal;
  if (!effect) return;
  if (effect.persuasion) player.resources.persuasion += effect.persuasion;
  if (effect.swords) player.swordsRevealed += effect.swords;
  if (effect.solari) player.resources.solari += effect.solari;
  if (effect.spice) player.resources.spice += effect.spice;
  if (effect.water) player.resources.water += effect.water;
}

function resolveRevealQueue(player: EnginePlayerState, revealed: EngineCardRef[]): void {
  // The current slice has no draw cards, but process through a queue with an
  // instance-id guard so a future scalar draw implementation cannot resolve
  // one card twice. Ordered Reveal effects are deliberately not implemented.
  const queue = [...revealed];
  const processed = new Set<string>();
  while (queue.length > 0) {
    const card = queue.shift()!;
    if (processed.has(card.id)) continue;
    processed.add(card.id);
    applyRevealEffect(player, card);
  }
}

/**
 * True when acquiring this card cannot introduce an unsupported future Reveal
 * card. Keep this rule shared by legal-action projection and the reducer.
 */
export function supportedAcquire(card: CardDef): boolean {
  if (card.key === 'dune-imperium-foldspace') return false;
  if (!supportedOnReveal(card)) return false;
  return !card.acquireNote || card.key === 'dune-imperium-the-spice-must-flow';
}

function supportedOnPlay(card: CardDef): boolean {
  const effect = card.onPlay;
  if (!effect) return true;
  if (card.key === 'dune-imperium-guild-ambassador') return false;
  if (effect.trash || effect.influenceAny !== undefined || effect.loseInfluence !== undefined
    || (effect.influence !== undefined && Array.isArray(effect.influence))) return false;
  if (/\b(choice|choose|optional|pay|needs?)\b/i.test(card.note ?? '')) return false;
  return true;
}

function reachesUnsupportedInfluenceLevel(player: EnginePlayerState, card: CardDef): boolean {
  const effect = card.onPlay;
  if (!effect) return false;
  const increases = new Map<keyof EnginePlayerState['influence'], number>();
  for (const faction of effect.bumps ?? []) increases.set(faction, (increases.get(faction) ?? 0) + 1);
  if (effect.influence && !Array.isArray(effect.influence)) {
    increases.set(effect.influence, (increases.get(effect.influence) ?? 0) + 1);
  }
  return [...increases].some(([faction, amount]) => player.influence[faction] < 4 && player.influence[faction] + amount >= 4);
}
function applyOnPlay(state: EngineState, player: EnginePlayerState, card: EngineCardRef): number {
  const effect = getCard(card.key)?.onPlay;
  if (!effect) return 0;
  let recruited = 0;
  if (effect.troops) recruited += recruit(player, effect.troops);
  if (effect.draw) player.hand.push(...draw(player, effect.draw, state.rng));
  if (effect.drawIntrigue) drawIntrigue(state, player, effect.drawIntrigue);
  if (effect.solari) player.resources.solari += effect.solari;
  if (effect.spice) player.resources.spice += effect.spice;
  if (effect.water) player.resources.water += effect.water;
  if (effect.vp) player.score += effect.vp;
  if (effect.influence) addInfluence(player, Array.isArray(effect.influence) ? effect.influence[0]! : effect.influence);
  for (const faction of effect.bumps ?? []) addInfluence(player, faction);
  return recruited;
}

function legalSpacesForCard(state: EngineState, player: EnginePlayerState, card: EngineCardRef): string[] {
  const cardDefinition = getCard(card.key);
  if (!cardDefinition || player.agentCount <= 0 || !supportedOnPlay(cardDefinition)) return [];
  return BOARD_SPACES.filter((space) => !state.board.occupants[space.id]
    && supportedBoardEffect(space.effect.kind)
    && !(space.id === 'foldspace' && (state.reserve['dune-imperium-foldspace'] ?? 0) === 0)
    && (cardDefinition.icons === 'all' || cardDefinition.icons.includes(space.icon))
    && (!space.cost || canPay(player, space.cost))
    && (!space.requirementInfluence || player.influence[space.requirementInfluence.faction] >= space.requirementInfluence.min)
    && (!space.faction || player.influence[space.faction] >= 4 || player.influence[space.faction] + 1 < 4)
    && !(space.oncePerGame && ((space.id === 'high-council' && player.councilorSeated) || (space.id === 'swordmaster' && player.swordmasterUsed))))
    .map((space) => space.id);
}

export function legalSpaces(state: EngineState, playerId: string, cardId: string): string[] {
  if (state.phase !== 'playerTurns' || state.currentPlayerId !== playerId || state.agentTurn !== null) return [];
  const player = playerFor(state, playerId);
  const card = player ? cardInHand(player, cardId) : undefined;
  return player && card ? legalSpacesForCard(state, player, card) : [];
}

export function legalSpacesForOpenAgent(state: EngineState, playerId: string): string[] {
  if (state.phase !== 'playerTurns' || state.currentPlayerId !== playerId || !state.agentTurn || state.agentTurn.playerId !== playerId) return [];
  const player = playerFor(state, playerId);
  const card = player?.inPlay.find((entry) => entry.id === state.agentTurn?.playedCardId);
  return player && card ? legalSpacesForCard(state, player, card) : [];
}

function advanceToNextPlayer(state: EngineState, playerId: string): void {
  const index = state.players.findIndex((entry) => entry.playerId === playerId);
  if (index < 0) { state.currentPlayerId = null; return; }
  for (let offset = 1; offset <= state.players.length; offset += 1) {
    const candidate = state.players[(index + offset) % state.players.length];
    // Every unrevealed player must receive a turn. This includes a player
    // with no Agents and no cards: pass starts an empty Reveal turn, and
    // confirm safely completes it.
    if (candidate && !candidate.revealed) {
      state.currentPlayerId = candidate.playerId;
      return;
    }
  }
  state.currentPlayerId = null;
}

function payControlBonus(state: EngineState, spaceId: string): void {
  const controllerId = state.board.controlMarkers[spaceId];
  const space = getBoardSpace(spaceId);
  if (!controllerId || !space?.controlBonus) return;
  const controller = playerFor(state, controllerId);
  if (!controller) return;
  if (space.controlBonus === 'solari') controller.resources.solari += 1;
  else controller.resources.spice += 1;
}

const SUPPORTED_COMBAT_INTRIGUE_KEYS: ReadonlySet<string> = new Set([
  'dune-imperium-allied-armada',
  'dune-imperium-ambush',
  'dune-imperium-master-tactician',
  'dune-imperium-private-army',
]);

/** True when this Combat Intrigue has only a supported scalar sword effect. */
export function supportedCombatIntrigue(key: string): boolean {
  const definition = getIntrigue(key);
  return definition !== undefined
    && definition.timing === 'combat'
    && SUPPORTED_COMBAT_INTRIGUE_KEYS.has(key)
    && definition.effects.swords !== undefined
    && Object.keys(definition.effects).every((effect) => effect === 'swords');
}

function nextEligiblePlayer(eligible: string[], currentPlayerId: string): string | null {
  const index = eligible.indexOf(currentPlayerId);
  if (index < 0 || eligible.length === 0) return null;
  return eligible[(index + 1) % eligible.length] ?? null;
}

function applyConflictReward(state: EngineState, player: EnginePlayerState, reward: ConflictReward): PendingConflictReward | null {
  switch (reward.kind) {
    case 'vp': player.score += reward.amount; return null;
    case 'solari': player.resources.solari += reward.amount; return null;
    case 'spice': player.resources.spice += reward.amount; return null;
    case 'water': player.resources.water += reward.amount; return null;
    case 'intrigue': drawIntrigue(state, player, reward.amount); return null;
    case 'influence': addInfluence(player, reward.faction, reward.amount); return null;
    case 'influenceAny':
      return { playerId: player.playerId, reward };
    case 'control':
      state.board.controlMarkers[reward.spaceId] = player.playerId;
      return null;
    case 'trashCard':
    case 'mentat':
    case 'chooseOne':
    case 'chooseTwo':
      return { playerId: player.playerId, reward };
  }
}

/**
 * The reward rank for one strength group, by rulebook tie rules:
 * - The highest strength group wins first place only when it has one player.
 * - A tie for first means no first place; the tied players each get second.
 * - The next group gets second place only when first place was awarded and it
 *   has one player; otherwise it gets third place in a 4-player game.
 * - Third place exists only in a 4-player game and only when second place was
 *   not awarded to the group that already took it.
 */
function rewardRank(groups: readonly EnginePlayerState[][], groupIndex: number, playerCount: number): 'first' | 'second' | 'third' | null {
  const group = groups[groupIndex];
  if (!group) return null;
  const firstAwarded = groups[0]?.length === 1;
  if (groupIndex === 0) {
    return firstAwarded ? 'first' : 'second';
  }
  if (groupIndex === 1) {
    if (firstAwarded && group.length === 1) return 'second';
    return playerCount === 4 ? 'third' : null;
  }
  if (groupIndex === 2) {
    // Only reached in a 4-player game after the first two groups each had one player.
    return playerCount === 4 && firstAwarded && groups[1]?.length === 1 && group.length === 1 ? 'third' : null;
  }
  return null;
}

function resolveCombat(state: EngineState): void {
  const combat = state.combat;
  const conflict = state.currentConflict ? getConflict(state.currentConflict.key) : undefined;
  if (!combat || !conflict) return;
  const groups = [...state.players]
    .filter((player) => player.combatStrength > 0)
    .sort((left, right) => right.combatStrength - left.combatStrength)
    .reduce<EnginePlayerState[][]>((result, player) => {
      const group = result.at(-1);
      if (group && group[0]?.combatStrength === player.combatStrength) group.push(player);
      else result.push([player]);
      return result;
    }, []);
  const pending: PendingConflictReward[] = [];
  for (const [groupIndex, group] of groups.entries()) {
    const rank = rewardRank(groups, groupIndex, state.players.length);
    if (!rank) continue;
    const rewards = conflict.rewards[rank];
    for (const player of group) {
      for (const reward of rewards) {
        const choice = applyConflictReward(state, player, reward);
        if (choice) pending.push(choice);
      }
    }
  }
  for (const player of state.players) {
    player.troopsSupply += player.troopsConflict;
    player.troopsConflict = 0;
    player.combatStrength = 0;
    player.swordsRevealed = 0;
  }
  if (pending.length > 0) combat.pendingRewards = pending;
  combat.resolved = true;
  if (combat.intrigueWindow) combat.intrigueWindow.currentPlayerId = null;
  state.log.push({ text: `Combat resolved: ${conflict.name}.`, playerId: null });
  if (pending.length === 0) state.phase = 'makers';
}

function applyPhaseAdvance(state: EngineState, playerId: string): EngineResult {
  if (state.currentPlayerId !== null || playerId !== state.firstPlayerId) return reject(RejectCode.notYourTurn, 'Only the First Player can advance this phase.');
  if (state.phase === 'combat' && state.combat && !state.combat.intrigueWindow) {
    if ((state.combat.pendingRewards?.length ?? 0) > 0) return reject(RejectCode.illegalAction, 'Resolve the pending Combat reward first.');
    const next = cloneState(state);
    if (next.combat) next.combat.resolved = true;
    next.phase = 'makers';
    return { accepted: true, state: next };
  }
  if (state.phase === 'makers') {
    const next = cloneState(state);
    for (const space of BOARD_SPACES) {
      if (space.maker && !next.board.occupants[space.id]) next.board.makerBonusSpice[space.id] = (next.board.makerBonusSpice[space.id] ?? 0) + 1;
    }
    next.phase = 'recall';
    next.log.push({ text: 'Makers phase resolved.', playerId: null });
    return { accepted: true, state: next };
  }
  if (state.phase === 'recall') {
    const next = cloneState(state);
    next.board.occupants = {};
    for (const player of next.players) {
      player.agentCount = 2 + (player.hasSwordmaster ? 1 : 0);
      player.hasMentat = false;
      player.revealed = false;
      player.resources.persuasion = 0;
    }
    const firstIndex = next.players.findIndex((player) => player.playerId === next.firstPlayerId);
    next.firstPlayerId = next.players[(firstIndex + 1) % next.players.length]?.playerId ?? next.firstPlayerId;
    const shouldEnd = next.players.some((player) => player.score >= 10) || next.conflictDeck.length === 0;
    if (shouldEnd) {
      next.phase = 'endgame';
      next.ended = true;
      const ranked = [...next.players].sort((left, right) => right.score - left.score || right.resources.spice - left.resources.spice || right.resources.solari - left.resources.solari || right.resources.water - left.resources.water || right.troopsGarrison - left.troopsGarrison);
      const winner = ranked[0];
      next.winner = winner ? ranked.filter((player) => player.score === winner.score && player.resources.spice === winner.resources.spice && player.resources.solari === winner.resources.solari && player.resources.water === winner.resources.water && player.troopsGarrison === winner.troopsGarrison).map((player) => player.playerId) : [];
      next.log.push({ text: winner ? `${winner.name} won the game.` : 'The game ended.', playerId: null });
    } else {
      next.phase = 'roundStart';
      next.currentConflict = null;
      next.combat = null;
      next.endgame = null;
      const started = startNextRound(next);
      Object.assign(next, started);
    }
    return { accepted: true, state: next };
  }
  return reject(RejectCode.wrongPhase, 'There is no automatic phase to advance.');
}

function startNextRound(state: EngineState): EngineState {
  const conflict = state.conflictDeck.pop() ?? null;
  state.currentConflict = conflict;
  for (const player of state.players) {
    player.hand.push(...draw(player, 5, state.rng));
    player.combatStrength = 0;
    player.swordsRevealed = 0;
  }
  state.phase = 'playerTurns';
  state.currentPlayerId = state.firstPlayerId;
  state.agentTurn = null;
  state.revealTurn = null;
  return state;
}

function applyCombatAction(state: EngineState, playerId: string, action: GameAction): EngineResult {
  if (action.kind === 'advancePhase') return applyPhaseAdvance(state, playerId);
  if (action.kind === 'chooseConflictInfluence') {
    const pending = state.combat?.pendingRewards?.find((entry) => entry.playerId === playerId);
    if (!pending || pending.reward.kind !== 'influenceAny') return reject(RejectCode.illegalAction, 'There is no Influence choice for this player.');
    const next = cloneState(state);
    const choice = next.combat!.pendingRewards?.find((entry) => entry.playerId === playerId && entry.reward.kind === 'influenceAny');
    if (!choice || choice.reward.kind !== 'influenceAny') return reject(RejectCode.illegalAction, 'There is no Influence choice for this player.');
    addInfluence(next.players.find((entry) => entry.playerId === playerId)!, action.faction, choice.reward.amount);
    next.combat!.pendingRewards?.splice(next.combat!.pendingRewards.indexOf(choice), 1);
    if ((next.combat!.pendingRewards?.length ?? 0) === 0) next.phase = 'makers';
    return { accepted: true, state: next };
  }
  const window = state.combat?.intrigueWindow;
  if (state.phase !== 'combat' || !state.combat || !window || state.combat.resolved || window.currentPlayerId === null) {
    return reject(RejectCode.wrongPhase, 'The Combat Intrigue window is not open.');
  }
  if (window.currentPlayerId !== playerId) return reject(RejectCode.notYourTurn, 'It is not your turn.');
  const player = playerFor(state, playerId);
  if (!player || !window.eligible.includes(playerId)) return reject(RejectCode.illegalAction, 'This player is not eligible for Combat.');
  if (action.kind !== 'pass' && action.kind !== 'playIntrigue') {
    return reject(RejectCode.illegalAction, 'Only Combat Intrigue cards or pass are available.');
  }
  const next = cloneState(state);
  const nextWindow = next.combat!.intrigueWindow!;
  if (action.kind === 'pass') {
    nextWindow.passesInARow += 1;
    if (nextWindow.passesInARow >= nextWindow.eligible.length) {
      nextWindow.currentPlayerId = null;
      resolveCombat(next);
      next.log.push({ text: 'Combat Intrigue window resolved after all eligible players passed.', playerId: null });
    } else {
      nextWindow.currentPlayerId = nextEligiblePlayer(nextWindow.eligible, playerId);
    }
    next.log.push({ text: `${player.name} passed in Combat.`, playerId });
    return { accepted: true, state: next };
  }
  const intrigue = player.intrigueHand.find((card) => card.id === action.intrigueId);
  if (!intrigue) return reject(RejectCode.unknownCard, 'The Intrigue card is not in your hand.');
  if (!supportedCombatIntrigue(intrigue.key)) return reject(RejectCode.illegalAction, 'This Combat Intrigue card is not supported yet.');
  const definition = getIntrigue(intrigue.key)!;
  next.players.find((entry) => entry.playerId === playerId)!.intrigueHand = player.intrigueHand.filter((card) => card.id !== intrigue.id);
  next.intrigueDiscard.push(intrigue);
  next.players.find((entry) => entry.playerId === playerId)!.combatStrength += definition.effects.swords ?? 0;
  nextWindow.passesInARow = 0;
  nextWindow.currentPlayerId = nextEligiblePlayer(nextWindow.eligible, playerId);
  next.log.push({ text: `${player.name} played ${definition.name} in Combat.`, playerId });
  return { accepted: true, state: next };
}

export function applyAction(state: EngineState, playerId: string, action: GameAction): EngineResult {
  if (state.phase === 'combat') return applyCombatAction(state, playerId, action);
  if (action.kind === 'advancePhase') return applyPhaseAdvance(state, playerId);
  if (state.currentPlayerId !== playerId) return reject(RejectCode.notYourTurn, 'It is not your turn.');
  if (state.phase !== 'playerTurns') return reject(RejectCode.wrongPhase, 'Agent actions are not available in this phase.');
  const player = playerFor(state, playerId);
  if (!player) return reject(RejectCode.illegalAction, 'The player does not exist.');
  if (action.kind === 'pass') {
    if (state.agentTurn?.awaitingDeploy) return reject(RejectCode.illegalAction, 'Choose a troop deployment count before ending the Agent turn.');
    if (state.agentTurn) return reject(RejectCode.illegalAction, 'Finish the open Agent turn before taking a Reveal turn.');
    if (state.revealTurn) return reject(RejectCode.illegalAction, 'Confirm your Reveal turn before taking another action.');
    if (player.revealed) return reject(RejectCode.illegalAction, 'You already took your Reveal turn.');
    if (player.hand.some((card) => !supportedOnReveal(getCard(card.key)))) {
      return reject(RejectCode.illegalAction, 'Your hand contains a Reveal effect that is not supported yet.');
    }
    const next = cloneState(state);
    const nextPlayer = playerFor(next, playerId)!;
    const revealed = [...nextPlayer.hand];
    nextPlayer.hand = [];
    nextPlayer.inPlay.push(...revealed);
    nextPlayer.revealed = true;
    next.revealTurn = {
      playerId,
      revealed,
      pendingReveal: [],
      confirmed: false,
      persuasionApplied: true,
    };
    resolveRevealQueue(nextPlayer, revealed);
    const hallOccupied = Object.entries(next.board.occupants).some(([spaceId, occupant]) => spaceId === 'hall-of-oratory' && occupant?.playerId === playerId);
    if (hallOccupied) nextPlayer.resources.persuasion += 1;
    next.log.push({ text: `${player.name} took a Reveal turn.`, playerId });
    return { accepted: true, state: next };
  }
  if (action.kind === 'confirmCombat') {
    if (!state.revealTurn || state.revealTurn.playerId !== playerId || state.revealTurn.confirmed) {
      return reject(RejectCode.illegalAction, 'There is no active Reveal turn to confirm.');
    }
    const next = cloneState(state);
    const nextPlayer = playerFor(next, playerId)!;
    nextPlayer.combatStrength = nextPlayer.troopsConflict > 0
      ? nextPlayer.troopsConflict * 2 + nextPlayer.swordsRevealed
      : 0;
    nextPlayer.discard.push(...nextPlayer.inPlay.splice(0));
    nextPlayer.resources.persuasion = 0;
    next.revealTurn = null;
    advanceToNextPlayer(next, playerId);
    if (next.currentPlayerId === null) {
      const eligible = next.players.filter((entry) => entry.troopsConflict > 0).map((entry) => entry.playerId);
      const firstEligible = next.players.find((entry) => entry.playerId === next.firstPlayerId && eligible.includes(entry.playerId))
        ?? next.players.find((entry) => eligible.includes(entry.playerId));
      next.phase = 'combat';
      next.combat = {
        resolved: false,
        intrigueWindow: eligible.length > 0 && firstEligible
          ? { currentPlayerId: firstEligible.playerId, passesInARow: 0, eligible }
          : null,
      };
      next.log.push({ text: 'Combat phase started.', playerId: null });
    }
    next.log.push({ text: `${player.name} confirmed ${nextPlayer.combatStrength} Combat strength.`, playerId });
    return { accepted: true, state: next };
  }
  if (action.kind === 'acquireCard') {
    if (!state.revealTurn || state.revealTurn.playerId !== playerId) return reject(RejectCode.illegalAction, 'Acquire cards during your Reveal turn.');
    const rowIndex = state.imperiumRow.findIndex((card) => card?.key === action.cardKey);
    const isReserve = action.cardKey === 'dune-imperium-arrakis-liaison' || action.cardKey === 'dune-imperium-the-spice-must-flow';
    const reserveCount = state.reserve[action.cardKey] ?? 0;
    if (rowIndex < 0 && (!isReserve || reserveCount <= 0)) return reject(RejectCode.unknownCard, 'The card is not available to acquire.');
    const definition = getCard(action.cardKey);
    if (!definition || definition.kind === 'starter' || !supportedAcquire(definition)) return reject(RejectCode.illegalAction, 'This card has an unsupported acquire effect.');
    if (player.resources.persuasion < definition.cost) return reject(RejectCode.missingCost, 'You do not have enough Persuasion.');
    const next = cloneState(state);
    const nextPlayer = playerFor(next, playerId)!;
    nextPlayer.resources.persuasion -= definition.cost;
    const instance = rowIndex >= 0 ? next.imperiumRow[rowIndex] : { id: `${action.cardKey}-${next.roundNumber}-${nextPlayer.discard.length}`, key: action.cardKey };
    if (!instance) return reject(RejectCode.unknownCard, 'The card is not available to acquire.');
    nextPlayer.discard.push(instance);
    if (rowIndex >= 0) next.imperiumRow[rowIndex] = next.imperiumDeck.pop() ?? null;
    else next.reserve[action.cardKey] = reserveCount - 1;
    if (action.cardKey === 'dune-imperium-the-spice-must-flow') nextPlayer.score += 1;
    next.log.push({ text: `${player.name} acquired ${definition.name}.`, playerId });
    return { accepted: true, state: next };
  }
  if (action.kind === 'playCard') {
    if (state.agentTurn) return reject(RejectCode.illegalAction, 'Finish or pass the open Agent turn first.');
    const card = cardInHand(player, action.cardId);
    if (!card) return reject(RejectCode.unknownCard, 'The card is not in your hand.');
    if (player.agentCount <= 0) return reject(RejectCode.illegalAction, 'You have no Agent available.');
    const definition = getCard(card.key);
    if (!definition || definition.icons !== 'all' && definition.icons.length === 0) return reject(RejectCode.illegalAction, 'This card cannot send an Agent.');
    if (!supportedOnPlay(definition)) return reject(RejectCode.illegalAction, 'This card requires an unsupported choice or cost.');
    if (reachesUnsupportedInfluenceLevel(player, definition)) return reject(RejectCode.illegalAction, 'Level-four Influence rewards and Alliances are not supported yet.');
    if (legalSpacesForCard(state, player, card).length === 0) return reject(RejectCode.illegalAction, 'This card has no legal destination.');
    const next = cloneState(state);
    const nextPlayer = playerFor(next, playerId)!;
    nextPlayer.hand = nextPlayer.hand.filter((entry) => entry.id !== action.cardId);
    nextPlayer.inPlay.push(card);
    next.agentTurn = { playerId, playedCardId: action.cardId, spaceId: null, recruitedThisTurn: 0, recruitedFromSpace: 0, deployedThisTurn: 0, combatSpace: false, deployLimit: 0, awaitingDeploy: false, deployDone: false, signetUsed: false };
    next.log.push({ text: `${player.name} played ${definition.name}.`, playerId });
    return { accepted: true, state: next };
  }
  if (action.kind === 'deployTroops') {
    if (!state.agentTurn?.awaitingDeploy || state.agentTurn.playerId !== playerId) return reject(RejectCode.illegalAction, 'There is no troop deployment window.');
    if (!Number.isInteger(action.count) || action.count < 0 || action.count > state.agentTurn.deployLimit || action.count > player.troopsGarrison) return reject(RejectCode.illegalAction, 'The troop count is not legal.');
    const next = cloneState(state);
    const nextPlayer = playerFor(next, playerId)!;
    nextPlayer.troopsGarrison -= action.count;
    nextPlayer.troopsConflict += action.count;
    next.agentTurn = null;
    advanceToNextPlayer(next, playerId);
    next.log.push({ text: `${player.name} deployed ${action.count} troops.`, playerId });
    return { accepted: true, state: next };
  }
  if (action.kind !== 'sendAgent') return reject(RejectCode.illegalAction, 'This action is not available during an Agent turn.');
  if (state.agentTurn?.awaitingDeploy) return reject(RejectCode.illegalAction, 'Choose a troop deployment count before sending another Agent.');
  if (!state.agentTurn || state.agentTurn.playerId !== playerId || state.agentTurn.playedCardId !== action.cardId) return reject(RejectCode.illegalAction, 'Play the selected card before sending an Agent.');
  const card = player.inPlay.find((entry) => entry.id === action.cardId);
  const cardDefinition = card ? getCard(card.key) : undefined;
  const space = getBoardSpace(action.spaceId);
  if (!card || !cardDefinition || !space || !supportedBoardEffect(space.effect.kind) || cardDefinition.icons !== 'all' && !cardDefinition.icons.includes(space.icon)) return reject(RejectCode.illegalSpace, 'The card does not permit this board space.');
  if (reachesUnsupportedInfluenceLevel(player, cardDefinition)) return reject(RejectCode.illegalAction, 'Level-four Influence rewards and Alliances are not supported yet.');
  if (state.board.occupants[action.spaceId]) return reject(RejectCode.spaceOccupied, 'This board space is occupied.');
  if (space.oncePerGame && ((space.id === 'high-council' && player.councilorSeated) || (space.id === 'swordmaster' && player.swordmasterUsed))) return reject(RejectCode.illegalAction, 'This board space can only be used once.');
  if (space.faction && player.influence[space.faction] < 4 && Math.min(6, player.influence[space.faction] + 1) >= 4) {
    return reject(RejectCode.illegalAction, 'Level-four Influence rewards and Alliances are not supported yet.');
  }
  if (space.id === 'foldspace' && (state.reserve['dune-imperium-foldspace'] ?? 0) === 0) return reject(RejectCode.illegalAction, 'The Foldspace reserve is empty.');
  if (space.requirementInfluence && player.influence[space.requirementInfluence.faction] < space.requirementInfluence.min) return reject(RejectCode.missingRequirement, 'You do not meet the Influence requirement.');
  if (space.cost && !canPay(player, space.cost)) return reject(RejectCode.missingCost, 'You cannot pay the cost of this board space.');
  const next = cloneState(state);
  const nextPlayer = playerFor(next, playerId)!;
  if (space.cost) pay(nextPlayer, space.cost);
  next.board.occupants[action.spaceId] = { playerId, cardId: action.cardId };
  payControlBonus(next, action.spaceId);
  nextPlayer.agentCount -= 1;
  if (space.faction) addInfluence(nextPlayer, space.faction);
  const recruitedFromSpace = applyBoardEffect(next, nextPlayer, action.spaceId);
  const recruitedFromCard = applyOnPlay(next, nextPlayer, card);
  const recruitedThisTurn = recruitedFromSpace + recruitedFromCard;
  const deployLimit = space.combatSpace ? recruitedThisTurn + Math.min(2, Math.max(0, nextPlayer.troopsGarrison - recruitedThisTurn)) : 0;
  next.agentTurn = space.combatSpace && deployLimit > 0
    ? { ...next.agentTurn!, playerId, spaceId: action.spaceId, recruitedThisTurn, recruitedFromSpace, combatSpace: true, deployLimit, awaitingDeploy: true, deployDone: false }
    : null;
  if (next.agentTurn === null) advanceToNextPlayer(next, playerId);
  next.log.push({ text: `${player.name} sent an Agent to ${space.name}.`, playerId });
  return { accepted: true, state: next };
}

function cloneState(state: EngineState): EngineState {
  return {
    ...state,
    players: state.players.map((player) => ({ ...player, resources: { ...player.resources }, influence: { ...player.influence }, hand: [...player.hand], deck: [...player.deck], discard: [...player.discard], inPlay: [...player.inPlay], intrigueHand: [...player.intrigueHand], alliances: [...player.alliances] })),
    board: { occupants: { ...state.board.occupants }, makerBonusSpice: { ...state.board.makerBonusSpice }, controlMarkers: { ...state.board.controlMarkers } },
    imperiumDeck: [...state.imperiumDeck], imperiumRow: [...state.imperiumRow], reserve: { ...state.reserve }, conflictDeck: [...state.conflictDeck], intrigueDeck: [...state.intrigueDeck], intrigueDiscard: [...state.intrigueDiscard],
    agentTurn: state.agentTurn ? { ...state.agentTurn } : null,
    revealTurn: state.revealTurn ? { ...state.revealTurn, revealed: [...state.revealTurn.revealed], pendingReveal: [...state.revealTurn.pendingReveal] } : null,
    combat: state.combat ? { ...state.combat, pendingRewards: [...(state.combat.pendingRewards ?? [])], intrigueWindow: state.combat.intrigueWindow ? { ...state.combat.intrigueWindow, eligible: [...state.combat.intrigueWindow.eligible] } : null } : null,
    endgame: state.endgame ? { ...state.endgame, intrigueWindow: state.endgame.intrigueWindow ? { ...state.endgame.intrigueWindow } : null } : null,
    log: [...state.log], winner: [...state.winner],
  };
}
