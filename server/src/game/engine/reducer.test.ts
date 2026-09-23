import { describe, expect, it } from 'vitest';
import { RejectCode } from '@dune/shared';
import { applyAction, changeInfluence, legalSpaces, supportedAcquire, supportedOnReveal } from './reducer.js';
import { createGame, draw, startRound } from './setup.js';
import { CONFLICT_I, CONFLICT_II, CONFLICT_III } from './data/conflicts.js';
import { INTRIGUE_TOTAL_COPIES } from './data/intrigue.js';
import { getCard } from './data/cards.js';
import { toGameState } from './view.js';

const players = [
  { playerId: 'p1', name: 'One', color: 'red' as const },
  { playerId: 'p2', name: 'Two', color: 'blue' as const },
  { playerId: 'p3', name: 'Three', color: 'green' as const },
];

function ready() {
  return startRound(createGame(players, { seed: 4 }));
}

describe('engine setup and agent turns', () => {
  it('sets up deterministically and draws five cards per player at round start', () => {
    const first = ready();
    const second = ready();
    expect(first.firstPlayerId).toBe(second.firstPlayerId);
    expect(first.players.map((player) => player.hand.map((card) => card.key))).toEqual(second.players.map((player) => player.hand.map((card) => card.key)));
    expect(first.players.every((player) => player.hand.length === 5)).toBe(true);
    expect(first.currentConflict).not.toBeNull();
  });

  it('rejects an action from the wrong player', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId !== state.currentPlayerId)!;
    const card = player.hand[0]!;
    const result = applyAction(state, player.playerId, { kind: 'playCard', cardId: card.id });
    expect(result).toEqual({ accepted: false, code: RejectCode.notYourTurn, reason: 'It is not your turn.' });
  });

  it('rejects an illegal board space and a missing cost', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    const card = { id: 'test-dune', key: 'dune-imperium-dune-the-desert-planet' };
    player.hand.push(card);
    expect(legalSpaces(state, player.playerId, card.id)).not.toContain('conspire');
    const played = applyAction(state, player.playerId, { kind: 'playCard', cardId: card.id });
    expect(played.accepted).toBe(true);
    if (!played.accepted) return;
    const illegal = applyAction(played.state, player.playerId, { kind: 'sendAgent', cardId: card.id, spaceId: 'conspire' });
    expect(illegal).toEqual({ accepted: false, code: RejectCode.missingCost, reason: 'You cannot pay the cost of this board space.' });
  });

  it('uses the player count for the starting score', () => {
    expect(ready().players.every((player) => player.score === 0)).toBe(true);
    expect(startRound(createGame([...players, { playerId: 'p4', name: 'Four', color: 'black' as const }], { seed: 4 })).players.every((player) => player.score === 1)).toBe(true);
  });

  it('builds the ten-card Conflict deck with the correct top order', () => {
    const state = createGame(players, { seed: 4 });
    expect(state.conflictDeck).toHaveLength(10);
    expect(state.conflictDeck.filter((card) => CONFLICT_I.some((definition) => definition.key === card.key))).toHaveLength(1);
    expect(state.conflictDeck.filter((card) => CONFLICT_II.some((definition) => definition.key === card.key))).toHaveLength(5);
    expect(state.conflictDeck.filter((card) => CONFLICT_III.some((definition) => definition.key === card.key))).toHaveLength(4);
    expect(CONFLICT_I.some((definition) => definition.key === state.conflictDeck.at(-1)?.key)).toBe(true);
  });

  it('builds Intrigue cards from real catalogue keys and copy counts', () => {
    const state = createGame(players, { seed: 4 });
    expect(state.intrigueDeck).toHaveLength(INTRIGUE_TOTAL_COPIES);
    expect(state.intrigueDeck.every((card) => card.key.startsWith('dune-imperium-'))).toBe(true);
  });

  it('closes an Agent turn and rejects incompatible follow-up actions', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    const card = { id: 'test-dune-close', key: 'dune-imperium-dune-the-desert-planet' };
    player.hand.push(card);
    const played = applyAction(state, player.playerId, { kind: 'playCard', cardId: card.id });
    expect(played.accepted).toBe(true);
    if (!played.accepted) return;
    const sent = applyAction(played.state, player.playerId, { kind: 'sendAgent', cardId: card.id, spaceId: 'imperial-basin' });
    expect(sent.accepted).toBe(true);
    if (!sent.accepted) return;
    expect(applyAction(sent.state, player.playerId, { kind: 'playCard', cardId: card.id }).accepted).toBe(false);
    const deployed = applyAction(sent.state, player.playerId, { kind: 'deployTroops', count: 0 });
    expect(deployed.accepted).toBe(true);
    if (deployed.accepted) expect(applyAction(deployed.state, player.playerId, { kind: 'pass' }).accepted).toBe(false);
  });

  it('rejects pass and sendAgent while troop deployment is pending', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    const card = { id: 'test-deploy-pending', key: 'dune-imperium-dune-the-desert-planet' };
    player.hand.push(card);
    const played = applyAction(state, player.playerId, { kind: 'playCard', cardId: card.id });
    expect(played.accepted).toBe(true);
    if (!played.accepted) return;
    const sent = applyAction(played.state, player.playerId, { kind: 'sendAgent', cardId: card.id, spaceId: 'imperial-basin' });
    expect(sent.accepted).toBe(true);
    if (!sent.accepted) return;
    expect(applyAction(sent.state, player.playerId, { kind: 'pass' })).toEqual({ accepted: false, code: RejectCode.illegalAction, reason: 'Choose a troop deployment count before ending the Agent turn.' });
    expect(applyAction(sent.state, player.playerId, { kind: 'sendAgent', cardId: card.id, spaceId: 'arrakeen' })).toEqual({ accepted: false, code: RejectCode.illegalAction, reason: 'Choose a troop deployment count before sending another Agent.' });
  });

  it('does not offer Swordmaster until its third-Agent effect is implemented', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    player.resources.solari = 8;
    const card = { id: 'test-swordmaster-gate', key: 'dune-imperium-dagger' };
    player.hand.push(card);
    expect(legalSpaces(state, player.playerId, card.id)).not.toContain('swordmaster');
    const played = applyAction(state, player.playerId, { kind: 'playCard', cardId: card.id });
    expect(played.accepted).toBe(true);
    if (!played.accepted) return;
    expect(applyAction(played.state, player.playerId, { kind: 'sendAgent', cardId: card.id, spaceId: 'swordmaster' })).toEqual({ accepted: false, code: RejectCode.illegalSpace, reason: 'The card does not permit this board space.' });
  });

  it('applies and removes the level-two Influence Victory Point', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    player.influence.emperor = 1;
    player.score = 0;
    player.resources.spice = 4;
    const card = { id: 'test-influence-vp', key: 'dune-imperium-dune-the-desert-planet' };
    player.hand.push(card);
    const played = applyAction(state, player.playerId, { kind: 'playCard', cardId: card.id });
    expect(played.accepted).toBe(true);
    if (!played.accepted) return;
    const sent = applyAction(played.state, player.playerId, { kind: 'sendAgent', cardId: card.id, spaceId: 'conspire' });
    expect(sent.accepted).toBe(true);
    if (!sent.accepted) return;
    const updated = sent.state.players.find((entry) => entry.playerId === player.playerId)!;
    expect(updated.influence.emperor).toBe(2);
    expect(updated.score).toBe(1);
  });

  it('removes the level-two Influence Victory Point when Influence falls below two', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    player.influence.emperor = 2;
    player.score = 1;
    const updated = changeInfluence(player, 'emperor', -1);
    expect(player.influence.emperor).toBe(2);
    expect(updated.influence.emperor).toBe(1);
    expect(updated.score).toBe(0);
  });

  it('exposes all deployment counts from zero through the limit', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    const card = { id: 'test-deploy-options', key: 'dune-imperium-dune-the-desert-planet' };
    player.hand.push(card);
    const played = applyAction(state, player.playerId, { kind: 'playCard', cardId: card.id });
    expect(played.accepted).toBe(true);
    if (!played.accepted) return;
    const sent = applyAction(played.state, player.playerId, { kind: 'sendAgent', cardId: card.id, spaceId: 'imperial-basin' });
    expect(sent.accepted).toBe(true);
    if (!sent.accepted) return;
    const actions = toGameState(sent.state, player.playerId).legalActions.filter((action) => action.kind === 'deployTroops');
    expect(actions.map((action) => action.count)).toEqual([0, 1, 2]);
  });

  it('does not apply Guild Ambassador while its OR choice is unsupported', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    const card = { id: 'test-guild-ambassador', key: 'dune-imperium-guild-ambassador' };
    player.hand.push(card);
    expect(applyAction(state, player.playerId, { kind: 'playCard', cardId: card.id })).toEqual({ accepted: false, code: RejectCode.illegalAction, reason: 'This card requires an unsupported choice or cost.' });
  });

  it('advances to a player with zero Agents so that player can Reveal', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    player.agentCount = 0;
    player.hand = [{ id: 'zero-agent-reveal', key: 'dune-imperium-assassination-mission' }];
    const other = state.players.find((entry) => entry.playerId !== player.playerId)!;
    state.players.filter((entry) => entry.playerId !== player.playerId && entry.playerId !== other.playerId).forEach((entry) => { entry.agentCount = 0; entry.hand = []; entry.revealed = true; });
    state.currentPlayerId = other.playerId;
    other.agentCount = 0;
    other.hand = [{ id: 'other-reveal', key: 'dune-imperium-assassination-mission' }];
    const passed = applyAction(state, other.playerId, { kind: 'pass' });
    expect(passed.accepted).toBe(true);
    if (!passed.accepted) return;
    const confirmed = applyAction(passed.state, other.playerId, { kind: 'confirmCombat' });
    expect(confirmed.accepted).toBe(true);
    if (confirmed.accepted) expect(confirmed.state.currentPlayerId).toBe(player.playerId);
  });

  it('starts a Reveal turn when the player passes from a normal player-turn state', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    player.hand = [{ id: 'scalar-pass', key: 'dune-imperium-assassination-mission' }];
    const before = JSON.stringify(state);
    const passed = applyAction(state, player.playerId, { kind: 'pass' });
    expect(passed.accepted).toBe(true);
    if (!passed.accepted) return;
    expect(passed.state.revealTurn?.playerId).toBe(player.playerId);
    expect(passed.state.revealTurn?.revealed).toHaveLength(1);
    expect(passed.state.players.find((entry) => entry.playerId === player.playerId)?.hand).toHaveLength(0);
    expect(JSON.stringify(state)).toBe(before);
  });

  it('does not allow pass while an Agent card is open', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    const card = { id: 'test-dune-pass', key: 'dune-imperium-dune-the-desert-planet' };
    player.hand.push(card);
    const played = applyAction(state, player.playerId, { kind: 'playCard', cardId: card.id });
    expect(played.accepted).toBe(true);
    if (!played.accepted) return;
    expect(applyAction(played.state, player.playerId, { kind: 'pass' })).toEqual({ accepted: false, code: RejectCode.illegalAction, reason: 'Finish the open Agent turn before taking a Reveal turn.' });
  });

  it('applies scalar Reveal effects, confirms strength, and cleans up', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    const card = { id: 'test-reveal-scalar', key: 'dune-imperium-assassination-mission' };
    player.hand = [card];
    player.troopsConflict = 2;
    const passed = applyAction(state, player.playerId, { kind: 'pass' });
    expect(passed.accepted).toBe(true);
    if (!passed.accepted) return;
    const revealing = passed.state.players.find((entry) => entry.playerId === player.playerId)!;
    expect(revealing.resources.solari).toBe(1);
    expect(revealing.swordsRevealed).toBe(1);
    expect(revealing.resources.persuasion).toBe(0);
    const confirmed = applyAction(passed.state, player.playerId, { kind: 'confirmCombat' });
    expect(confirmed.accepted).toBe(true);
    if (!confirmed.accepted) return;
    const updated = confirmed.state.players.find((entry) => entry.playerId === player.playerId)!;
    expect(updated.combatStrength).toBe(5);
    expect(updated.inPlay).toHaveLength(0);
    expect(updated.discard).toContainEqual(card);
    expect(confirmed.state.revealTurn).toBeNull();
  });

  it('clears unused Persuasion when the Reveal turn is confirmed', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    player.hand = [{ id: 'persuasion-cleanup', key: 'dune-imperium-assassination-mission' }];
    player.resources.persuasion = 3;
    const passed = applyAction(state, player.playerId, { kind: 'pass' });
    expect(passed.accepted).toBe(true);
    if (!passed.accepted) return;
    const confirmed = applyAction(passed.state, player.playerId, { kind: 'confirmCombat' });
    expect(confirmed.accepted).toBe(true);
    if (confirmed.accepted) expect(confirmed.state.players.find((entry) => entry.playerId === player.playerId)?.resources.persuasion).toBe(0);
  });

  it('allows normal starter cards in a Reveal without applying unsupported effects', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    player.hand = [
      { id: 'seek-allies-reveal', key: 'dune-imperium-seek-allies' },
      { id: 'signet-ring-reveal', key: 'dune-imperium-signet-ring' },
    ];
    const passed = applyAction(state, player.playerId, { kind: 'pass' });
    expect(passed.accepted).toBe(true);
    if (!passed.accepted) return;
    expect(passed.state.revealTurn?.revealed.map((card) => card.key)).toEqual([
      'dune-imperium-seek-allies',
      'dune-imperium-signet-ring',
    ]);
    const revealed = passed.state.players.find((entry) => entry.playerId === player.playerId)!;
    expect(revealed.resources.persuasion).toBe(0);
    expect(revealed.swordsRevealed).toBe(0);
  });

  it('does not offer or accept an acquisition that would block a future Reveal', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    player.hand = [{ id: 'unsupported-acquire-reveal', key: 'dune-imperium-assassination-mission' }];
    player.resources.persuasion = 3;
    state.imperiumRow[0] = { id: 'guild-bankers-row', key: 'dune-imperium-guild-bankers' };
    const passed = applyAction(state, player.playerId, { kind: 'pass' });
    expect(passed.accepted).toBe(true);
    if (!passed.accepted) return;
    const view = toGameState(passed.state, player.playerId);
    expect(view.legalActions.some((action) => action.kind === 'acquireCard' && action.card.cardKey === 'dune-imperium-guild-bankers')).toBe(false);
    expect(applyAction(passed.state, player.playerId, { kind: 'acquireCard', cardKey: 'dune-imperium-guild-bankers' })).toEqual({
      accepted: false,
      code: RejectCode.illegalAction,
      reason: 'This card has an unsupported acquire effect.',
    });
  });

  it('starts Combat after the final player confirms their Reveal', () => {
    const state = ready();
    for (const player of state.players) {
      player.agentCount = 0;
      player.hand = [];
      player.revealed = false;
    }
    let current = state;
    for (let turn = 0; turn < state.players.length; turn += 1) {
      const playerId = current.currentPlayerId!;
      const passed = applyAction(current, playerId, { kind: 'pass' });
      expect(passed.accepted).toBe(true);
      if (!passed.accepted) return;
      const confirmed = applyAction(passed.state, playerId, { kind: 'confirmCombat' });
      expect(confirmed.accepted).toBe(true);
      if (!confirmed.accepted) return;
      current = confirmed.state;
    }
    expect(current.phase).toBe('combat');
    expect(current.currentPlayerId).toBeNull();
    expect(current.combat).toEqual({ resolved: false, intrigueWindow: null });
  });

  it('does not support unknown or conditional Reveal cards', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    player.hand = [
      { id: 'unknown-reveal', key: 'unknown-card' },
      { id: 'foldspace-reveal', key: 'dune-imperium-foldspace' },
    ];
    expect(applyAction(state, player.playerId, { kind: 'pass' })).toEqual({ accepted: false, code: RejectCode.illegalAction, reason: 'Your hand contains a Reveal effect that is not supported yet.' });
  });

  it('rejects each named conditional or choice Reveal card', () => {
    const unsupported = [
      'dune-imperium-test-of-humanity',
      'dune-imperium-reverend-mother-mohiam',
      'dune-imperium-firm-grip',
      'dune-imperium-worm-riders',
      'dune-imperium-liet-kynes',
      'dune-imperium-guild-bankers',
    ];
    for (const [index, key] of unsupported.entries()) {
      const state = ready();
      const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
      player.hand = [{ id: `unsupported-reveal-${index}`, key }];
      expect(supportedOnReveal(getCard(key))).toBe(false);
      expect(applyAction(state, player.playerId, { kind: 'pass' })).toEqual({
        accepted: false,
        code: RejectCode.illegalAction,
        reason: 'Your hand contains a Reveal effect that is not supported yet.',
      });
    }
  });

  it('allows an empty-hand player with zero Agents to pass and confirm', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    player.agentCount = 0;
    player.hand = [];
    const passed = applyAction(state, player.playerId, { kind: 'pass' });
    expect(passed.accepted).toBe(true);
    if (!passed.accepted) return;
    expect(passed.state.revealTurn?.revealed).toEqual([]);
    expect(passed.state.players.find((entry) => entry.playerId === player.playerId)?.revealed).toBe(true);
    const confirmed = applyAction(passed.state, player.playerId, { kind: 'confirmCombat' });
    expect(confirmed.accepted).toBe(true);
    if (confirmed.accepted) expect(confirmed.state.revealTurn).toBeNull();
  });

  it('resolves a repeated card instance at most once in the scalar Reveal queue', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    const repeated = { id: 'repeated-reveal', key: 'dune-imperium-assassination-mission' };
    player.hand = [repeated, repeated];
    const before = player.resources.solari;
    const passed = applyAction(state, player.playerId, { kind: 'pass' });
    expect(passed.accepted).toBe(true);
    if (passed.accepted) expect(passed.state.players.find((entry) => entry.playerId === player.playerId)?.resources.solari).toBe(before + 1);
  });

  it('keeps Reveal cards private and preserves repeat acquisition', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    const opponent = state.players.find((entry) => entry.playerId !== player.playerId)!;
    player.hand = [{ id: 'private-reveal', key: 'dune-imperium-assassination-mission' }];
    player.resources.persuasion = 10;
    const passed = applyAction(state, player.playerId, { kind: 'pass' });
    expect(passed.accepted).toBe(true);
    if (!passed.accepted) return;
    const ownerView = toGameState(passed.state, player.playerId);
    const publicView = toGameState(passed.state, opponent.playerId);
    expect(ownerView.reveal.revealed).toEqual([{ cardId: 'private-reveal', cardKey: 'dune-imperium-assassination-mission' }]);
    expect(publicView.reveal.revealed).toBeNull();
    const available = passed.state.imperiumRow.find((card) => card !== null && supportedAcquire(getCard(card.key)!))!;
    const first = applyAction(passed.state, player.playerId, { kind: 'acquireCard', cardKey: available.key });
    expect(first.accepted).toBe(true);
    if (!first.accepted) return;
    const secondAvailable = first.state.imperiumRow.find((card) => card !== null && supportedAcquire(getCard(card.key)!))!;
    const second = applyAction(first.state, player.playerId, { kind: 'acquireCard', cardKey: secondAvailable.key });
    expect(second.accepted).toBe(true);
  });

  it('sets zero combat strength when Reveal has no troops in the Conflict', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    player.hand = [{ id: 'test-reveal-zero', key: 'dune-imperium-assassination-mission' }];
    player.troopsConflict = 0;
    const passed = applyAction(state, player.playerId, { kind: 'pass' });
    expect(passed.accepted).toBe(true);
    if (!passed.accepted) return;
    const confirmed = applyAction(passed.state, player.playerId, { kind: 'confirmCombat' });
    expect(confirmed.accepted).toBe(true);
    if (confirmed.accepted) expect(confirmed.state.players.find((entry) => entry.playerId === player.playerId)?.combatStrength).toBe(0);
  });

  it('projects Reveal and confirmation legal actions without an illegal pass', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    player.hand = [{ id: 'legal-pass', key: 'dune-imperium-assassination-mission' }];
    const initial = toGameState(state, player.playerId);
    expect(initial.legalActions.some((action) => action.kind === 'pass')).toBe(true);
    const passed = applyAction(state, player.playerId, { kind: 'pass' });
    expect(passed.accepted).toBe(true);
    if (!passed.accepted) return;
    const reveal = toGameState(passed.state, player.playerId);
    expect(reveal.legalActions.some((action) => action.kind === 'confirmCombat')).toBe(true);
    expect(reveal.legalActions.some((action) => action.kind === 'acquireCard')).toBe(true);
    const staged = createGame(players, { seed: 4 });
    const stagedRound = startRound(staged);
    const stagedPlayer = stagedRound.players.find((entry) => entry.playerId === stagedRound.currentPlayerId)!;
    const card = { id: 'staged-card', key: 'dune-imperium-dune-the-desert-planet' };
    stagedPlayer.hand = [card];
    const played = applyAction(stagedRound, stagedPlayer.playerId, { kind: 'playCard', cardId: card.id });
    expect(played.accepted).toBe(true);
    if (played.accepted) expect(toGameState(played.state, stagedPlayer.playerId).legalActions.some((action) => action.kind === 'pass')).toBe(false);
  });

  it('acquires a supported Imperium card and refills its row', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    player.hand = [{ id: 'acquire-reveal', key: 'dune-imperium-assassination-mission' }];
    player.resources.persuasion = 5;
    const passed = applyAction(state, player.playerId, { kind: 'pass' });
    expect(passed.accepted).toBe(true);
    if (!passed.accepted) return;
    const row = passed.state.imperiumRow.find((card) => card !== null)!;
    const before = passed.state.imperiumRow.length;
    const acquired = applyAction(passed.state, player.playerId, { kind: 'acquireCard', cardKey: row.key });
    expect(acquired.accepted).toBe(true);
    if (!acquired.accepted) return;
    const updated = acquired.state.players.find((entry) => entry.playerId === player.playerId)!;
    expect(updated.discard.some((card) => card.key === row.key)).toBe(true);
    expect(acquired.state.imperiumRow).toHaveLength(before);
    expect(updated.resources.persuasion).toBeLessThan(5);
  });

  it('acquires Reserve cards only from supported stacks', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    player.hand = [{ id: 'reserve-reveal', key: 'dune-imperium-assassination-mission' }];
    player.resources.persuasion = 9;
    const passed = applyAction(state, player.playerId, { kind: 'pass' });
    expect(passed.accepted).toBe(true);
    if (!passed.accepted) return;
    const acquired = applyAction(passed.state, player.playerId, { kind: 'acquireCard', cardKey: 'dune-imperium-the-spice-must-flow' });
    expect(acquired.accepted).toBe(true);
    if (acquired.accepted) expect(acquired.state.reserve['dune-imperium-the-spice-must-flow']).toBe(9);
  });

  it('returns an immutable Influence transition', () => {
    const state = ready();
    const player = state.players[0]!;
    const before = JSON.stringify(player);
    const updated = changeInfluence(player, 'emperor', 1);
    expect(JSON.stringify(player)).toBe(before);
    expect(updated.influence.emperor).toBe(player.influence.emperor + 1);
  });

  it('supports the basic combat deployment count window', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    const card = { id: 'test-dune-deploy', key: 'dune-imperium-dune-the-desert-planet' };
    player.hand.push(card);
    const played = applyAction(state, player.playerId, { kind: 'playCard', cardId: card.id });
    expect(played.accepted).toBe(true);
    if (!played.accepted) return;
    const sent = applyAction(played.state, player.playerId, { kind: 'sendAgent', cardId: card.id, spaceId: 'imperial-basin' });
    expect(sent.accepted).toBe(true);
    if (!sent.accepted) return;
    expect(sent.state.agentTurn?.awaitingDeploy).toBe(true);
    const deployed = applyAction(sent.state, player.playerId, { kind: 'deployTroops', count: 2 });
    expect(deployed.accepted).toBe(true);
    if (deployed.accepted) expect(deployed.state.players.find((entry) => entry.playerId === player.playerId)?.troopsConflict).toBe(2);
  });

  it('does not mark Sell Melange legal without a fixed spice cost', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    const card = { id: 'test-dagger-sell', key: 'dune-imperium-dagger' };
    player.hand.push(card);
    expect(legalSpaces(state, player.playerId, card.id)).not.toContain('sell-melange');
  });

  it('shuffles the discard pile when rebuilding a deck', () => {
    const state = ready();
    const player = state.players[0]!;
    player.deck = [];
    player.discard = [{ id: 'discard-a', key: 'a' }, { id: 'discard-b', key: 'b' }];
    const drawn = draw(player, 2, { next: () => 0 });
    expect(drawn).toHaveLength(2);
    expect(player.discard).toHaveLength(0);
    expect(new Set(drawn.map((card) => card.id))).toEqual(new Set(['discard-a', 'discard-b']));
  });

  it('projects legal actions and log entries for the current player', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    const card = { id: 'test-dune-view', key: 'dune-imperium-dune-the-desert-planet' };
    player.hand.push(card);
    const view = toGameState(state, player.playerId);
    expect(view.legalActions.length).toBeGreaterThan(0);
    expect(view.log).toEqual([]);
  });

  it('sends an Agent to a legal space and applies its cost and effect', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    const card = { id: 'test-dune', key: 'dune-imperium-dune-the-desert-planet' };
    player.hand.push(card);
    const played = applyAction(state, player.playerId, { kind: 'playCard', cardId: card.id });
    expect(played.accepted).toBe(true);
    if (!played.accepted) return;
    const result = applyAction(played.state, player.playerId, { kind: 'sendAgent', cardId: card.id, spaceId: 'imperial-basin' });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.state.board.occupants['imperial-basin']?.playerId).toBe(player.playerId);
    expect(result.state.players.find((entry) => entry.playerId === player.playerId)?.resources.spice).toBe(1);
  });

  it('exposes each legal sendAgent destination after a card is played', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    const card = { id: 'test-view-send', key: 'dune-imperium-dune-the-desert-planet' };
    player.hand.push(card);
    const played = applyAction(state, player.playerId, { kind: 'playCard', cardId: card.id });
    expect(played.accepted).toBe(true);
    if (!played.accepted) return;
    const view = toGameState(played.state, player.playerId);
    const destinations = view.legalActions.filter((action) => action.kind === 'sendAgent');
    expect(destinations.length).toBeGreaterThan(0);
    expect(destinations.every((action) => action.card.cardId === card.id)).toBe(true);
  });

  it('rejects a card with no legal destination before opening a turn', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    for (const spaceId of ['arrakeen', 'carthag', 'research-station']) state.board.occupants[spaceId] = { playerId: 'other', cardId: `occupied-${spaceId}` };
    const card = { id: 'test-no-city', key: 'dune-imperium-dr-yueh' };
    player.hand.push(card);
    expect(applyAction(state, player.playerId, { kind: 'playCard', cardId: card.id })).toEqual({ accepted: false, code: RejectCode.illegalAction, reason: 'This card has no legal destination.' });
  });

  it('advances to the next player after a completed non-combat Agent action', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    const card = { id: 'test-advance', key: 'dune-imperium-dune-the-desert-planet' };
    player.hand.push(card);
    const played = applyAction(state, player.playerId, { kind: 'playCard', cardId: card.id });
    expect(played.accepted).toBe(true);
    if (!played.accepted) return;
    const sent = applyAction(played.state, player.playerId, { kind: 'sendAgent', cardId: card.id, spaceId: 'hall-of-oratory' });
    expect(sent.accepted).toBe(true);
    if (!sent.accepted) return;
    expect(sent.state.agentTurn).toBeNull();
    expect(sent.state.currentPlayerId).not.toBe(player.playerId);
  });

  it('counts card and board recruits plus two garrison troops for deployment', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    const card = { id: 'test-recruit-deploy', key: 'dune-imperium-duncan-idaho' };
    player.hand.push(card);
    const played = applyAction(state, player.playerId, { kind: 'playCard', cardId: card.id });
    expect(played.accepted).toBe(true);
    if (!played.accepted) return;
    const sent = applyAction(played.state, player.playerId, { kind: 'sendAgent', cardId: card.id, spaceId: 'arrakeen' });
    expect(sent.accepted).toBe(true);
    if (!sent.accepted) return;
    expect(sent.state.agentTurn?.deployLimit).toBe(4);
  });

  it('grants exactly one Influence for a faction space', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    player.resources.spice = 4;
    const card = { id: 'test-influence-once', key: 'dune-imperium-dune-the-desert-planet' };
    player.hand.push(card);
    const played = applyAction(state, player.playerId, { kind: 'playCard', cardId: card.id });
    expect(played.accepted).toBe(true);
    if (!played.accepted) return;
    const sent = applyAction(played.state, player.playerId, { kind: 'sendAgent', cardId: card.id, spaceId: 'conspire' });
    expect(sent.accepted).toBe(true);
    if (sent.accepted) expect(sent.state.players.find((entry) => entry.playerId === player.playerId)?.influence.emperor).toBe(1);
  });

  it('pays a control bonus to the controller when a controlled space is occupied', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    const controller = state.players.find((entry) => entry.playerId !== player.playerId)!;
    state.board.controlMarkers.arrakeen = controller.playerId;
    const before = controller.resources.solari;
    const card = { id: 'test-control-bonus', key: 'dune-imperium-dune-the-desert-planet' };
    player.hand.push(card);
    const played = applyAction(state, player.playerId, { kind: 'playCard', cardId: card.id });
    expect(played.accepted).toBe(true);
    if (!played.accepted) return;
    const sent = applyAction(played.state, player.playerId, { kind: 'sendAgent', cardId: card.id, spaceId: 'arrakeen' });
    expect(sent.accepted).toBe(true);
    if (sent.accepted) expect(sent.state.players.find((entry) => entry.playerId === controller.playerId)?.resources.solari).toBe(before + 1);
  });

  it('rejects Foldspace when the reserve is empty', () => {
    const state = ready();
    const player = state.players.find((entry) => entry.playerId === state.currentPlayerId)!;
    state.reserve['dune-imperium-foldspace'] = 0;
    const card = { id: 'test-foldspace-empty', key: 'dune-imperium-sardaukar-legion' };
    player.hand.push(card);
    expect(legalSpaces(state, player.playerId, card.id)).not.toContain('foldspace');
  });

  it('opens a public Combat Intrigue view with the active eligible player', () => {
    const state = ready();
    state.phase = 'combat';
    state.currentPlayerId = null;
    state.players[0]!.troopsConflict = 1;
    state.players[1]!.troopsConflict = 2;
    state.players[0]!.combatStrength = 2;
    state.players[1]!.combatStrength = 4;
    state.combat = {
      resolved: false,
      intrigueWindow: { currentPlayerId: 'p1', passesInARow: 0, eligible: ['p1', 'p2'] },
    };
    const view = toGameState(state, 'p2');
    expect(view.currentPlayerId).toBeNull();
    expect(view.combat).toEqual({
      activePlayerId: 'p1',
      eligiblePlayerIds: ['p1', 'p2'],
      consecutivePasses: 0,
      windowResolved: false,
      strengths: [{ playerId: 'p1', strength: 2 }, { playerId: 'p2', strength: 4 }, { playerId: 'p3', strength: 0 }],
    });
    expect(view.legalActions).toEqual([]);
  });

  it('rotates Combat passes and resolves after all eligible players pass', () => {
    const state = ready();
    state.phase = 'combat';
    state.currentPlayerId = null;
    state.players[0]!.troopsConflict = 1;
    state.players[1]!.troopsConflict = 1;
    state.combat = {
      resolved: false,
      intrigueWindow: { currentPlayerId: 'p1', passesInARow: 0, eligible: ['p1', 'p2'] },
    };
    const first = applyAction(state, 'p1', { kind: 'pass' });
    expect(first.accepted).toBe(true);
    if (!first.accepted) return;
    expect(first.state.currentPlayerId).toBeNull();
    expect(first.state.combat?.intrigueWindow).toEqual({ currentPlayerId: 'p2', passesInARow: 1, eligible: ['p1', 'p2'] });
    const second = applyAction(first.state, 'p2', { kind: 'pass' });
    expect(second.accepted).toBe(true);
    if (!second.accepted) return;
    expect(second.state.currentPlayerId).toBeNull();
    expect(second.state.combat?.intrigueWindow).toEqual({ currentPlayerId: null, passesInARow: 2, eligible: ['p1', 'p2'] });
    expect(second.state.combat?.resolved).toBe(true);
  });

  it('rejects a Combat action from a non-active eligible player', () => {
    const state = ready();
    state.phase = 'combat';
    state.currentPlayerId = null;
    state.players[0]!.troopsConflict = 1;
    state.players[1]!.troopsConflict = 1;
    state.combat = {
      resolved: false,
      intrigueWindow: { currentPlayerId: 'p1', passesInARow: 0, eligible: ['p1', 'p2'] },
    };
    expect(applyAction(state, 'p2', { kind: 'pass' })).toEqual({ accepted: false, code: RejectCode.notYourTurn, reason: 'It is not your turn.' });
  });

  it('resolves Combat rewards, returns troops, and advances through Makers and Recall', () => {
    const state = ready();
    state.phase = 'combat';
    state.currentPlayerId = null;
    state.currentConflict = { id: 'skirmish-iii', key: 'skirmish-iii' };
    state.players[0]!.combatStrength = 5;
    state.players[0]!.troopsConflict = 2;
    state.players[1]!.combatStrength = 3;
    state.players[1]!.troopsConflict = 1;
    state.combat = { resolved: false, intrigueWindow: { currentPlayerId: 'p1', passesInARow: 0, eligible: ['p1', 'p2'] } };
    const firstPass = applyAction(state, 'p1', { kind: 'pass' });
    expect(firstPass.accepted).toBe(true);
    if (!firstPass.accepted) return;
    const resolved = applyAction(firstPass.state, 'p2', { kind: 'pass' });
    expect(resolved.accepted).toBe(true);
    if (!resolved.accepted) return;
    expect(resolved.state.phase).toBe('makers');
    expect(resolved.state.players[0]!.score).toBe(1);
    expect(resolved.state.players[0]!.troopsConflict).toBe(0);
    expect(resolved.state.players[0]!.troopsSupply).toBe(11);
    const makers = applyAction(resolved.state, 'p1', { kind: 'advancePhase' });
    expect(makers.accepted).toBe(true);
    if (!makers.accepted) return;
    expect(makers.state.phase).toBe('recall');
    expect(makers.state.board.makerBonusSpice['great-flat']).toBe(1);
    const recall = applyAction(makers.state, 'p1', { kind: 'advancePhase' });
    expect(recall.accepted).toBe(true);
    if (recall.accepted) expect(recall.state.phase).toBe('playerTurns');
  });

  it('gives the third reward to the remaining group after a four-player tie for first', () => {
    const state = startRound(createGame([...players, { playerId: 'p4', name: 'Four', color: 'black' as const }], { seed: 4 }));
    state.phase = 'combat';
    state.currentPlayerId = null;
    state.currentConflict = { id: 'skirmish-iiii', key: 'skirmish-iiii' };
    state.players[0]!.combatStrength = 8;
    state.players[1]!.combatStrength = 8;
    state.players[2]!.combatStrength = 4;
    state.players[3]!.combatStrength = 2;
    state.players.forEach((player) => { player.troopsConflict = 1; });
    state.combat = { resolved: false, intrigueWindow: { currentPlayerId: 'p1', passesInARow: 0, eligible: ['p1', 'p2', 'p3', 'p4'] } };
    let current = applyAction(state, 'p1', { kind: 'pass' });
    if (!current.accepted) return;
    current = applyAction(current.state, 'p2', { kind: 'pass' });
    if (!current.accepted) return;
    current = applyAction(current.state, 'p3', { kind: 'pass' });
    if (!current.accepted) return;
    current = applyAction(current.state, 'p4', { kind: 'pass' });
    expect(current.accepted).toBe(true);
    if (!current.accepted) return;
    // Players 1 and 2 tie for first, so each gets the second reward: 2 Solari.
    expect(current.state.players[0]!.resources.solari).toBe(2);
    expect(current.state.players[1]!.resources.solari).toBe(2);
    // Player 3 is the remaining group and gets the third reward: 2 Solari.
    expect(current.state.players[2]!.resources.solari).toBe(2);
    // Player 4 has the lowest strength and gets nothing.
    expect(current.state.players[3]!.resources.solari).toBe(0);
  });

  it('does not award a third-place reward in a three-player game', () => {
    const state = ready();
    state.phase = 'combat';
    state.currentPlayerId = null;
    state.currentConflict = { id: 'skirmish-iiii', key: 'skirmish-iiii' };
    state.players.forEach((player, index) => { player.combatStrength = 3 - index; player.troopsConflict = 1; });
    state.combat = { resolved: false, intrigueWindow: { currentPlayerId: 'p1', passesInARow: 0, eligible: ['p1', 'p2', 'p3'] } };
    let current = applyAction(state, 'p1', { kind: 'pass' });
    if (!current.accepted) return;
    current = applyAction(current.state, 'p2', { kind: 'pass' });
    if (!current.accepted) return;
    current = applyAction(current.state, 'p3', { kind: 'pass' });
    expect(current.accepted).toBe(true);
    if (current.accepted) expect(current.state.players[2]!.score).toBe(0);
  });

  it('ends the game at Recall and selects the VP leader', () => {
    const state = ready();
    state.phase = 'recall';
    state.currentPlayerId = null;
    state.conflictDeck = [];
    state.players[0]!.score = 10;
    const result = applyAction(state, 'p1', { kind: 'advancePhase' });
    expect(result.accepted).toBe(true);
    if (result.accepted) {
      expect(result.state.phase).toBe('endgame');
      expect(result.state.ended).toBe(true);
      expect(result.state.winner).toEqual(['p1']);
      expect(result.state.currentPlayerId).toBeNull();
    }
  });

  it('requires an explicit choice for an Influence-of-choice Conflict reward', () => {
    const state = ready();
    state.phase = 'combat';
    state.currentPlayerId = null;
    state.currentConflict = { id: 'grand-vision', key: 'grand-vision' };
    state.players[0]!.combatStrength = 5;
    state.players[0]!.troopsConflict = 1;
    state.combat = { resolved: false, intrigueWindow: { currentPlayerId: 'p1', passesInARow: 0, eligible: ['p1'] } };
    const result = applyAction(state, 'p1', { kind: 'pass' });
    expect(result.accepted).toBe(true);
    if (result.accepted) {
      expect(result.state.phase).toBe('combat');
      expect(result.state.combat?.pendingRewards).toHaveLength(1);
      const chosen = applyAction(result.state, 'p1', { kind: 'chooseConflictInfluence', faction: 'fremen' });
      expect(chosen.accepted).toBe(true);
      if (chosen.accepted) expect(chosen.state.players[0]!.influence.fremen).toBe(2);
    }
  });

  it('offers only supported Combat Intrigue cards and preserves hidden cards', () => {
    const state = ready();
    state.phase = 'combat';
    state.currentPlayerId = null;
    state.players[0]!.troopsConflict = 1;
    state.players[1]!.troopsConflict = 1;
    state.players[0]!.intrigueHand = [
      { id: 'ambush-1', key: 'dune-imperium-ambush' },
      { id: 'unsupported-1', key: 'dune-imperium-staged-incident' },
    ];
    state.players[1]!.intrigueHand = [{ id: 'private-1', key: 'dune-imperium-ambush' }];
    state.combat = {
      resolved: false,
      intrigueWindow: { currentPlayerId: 'p1', passesInARow: 0, eligible: ['p1', 'p2'] },
    };
    const ownerView = toGameState(state, 'p1');
    expect(ownerView.legalActions).toEqual([
      { kind: 'pass' },
      { kind: 'playIntrigue', intrigue: { cardId: 'ambush-1', cardKey: 'dune-imperium-ambush' }, timing: 'combat' },
    ]);
    const opponentView = toGameState(state, 'p2');
    expect(opponentView.players.find((player) => player.playerId === 'p1')?.intrigueCards).toBeNull();
    const played = applyAction(state, 'p1', { kind: 'playIntrigue', intrigueId: 'ambush-1' });
    expect(played.accepted).toBe(true);
    if (played.accepted) {
      expect(played.state.players[0]!.combatStrength).toBe(4);
      expect(played.state.combat?.intrigueWindow?.passesInARow).toBe(0);
      expect(played.state.combat?.intrigueWindow?.currentPlayerId).toBe('p2');
    }
  });
});
