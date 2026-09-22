/**
 * The 34 unique Intrigue cards of the Dune Imperium base game.
 * The physical set holds 40 cards; the copies field sums to 40.
 *
 * Timing rule (dune_rules.txt lines 348-352):
 * - Plot: played during one of your Agent or Reveal turns.
 * - Combat: played only during Combat.
 * - Endgame: played only at the end of the game.
 *
 * Conditions and costs come from the official FAQ
 * (DUNE_IMPERIUM_FAQ_21-12-1.pdf). The effect numbers come from the
 * fetched catalogue attributes. TODO: verify the human text of each
 * card and the timing of the flagged entries.
 */

import type { FactionId, IntrigueTiming } from '@dune/shared';

/** The effect numbers of one Intrigue card. */
export interface IntrigueEffects {
  swords?: number;
  draw?: number;
  drawIntrigue?: number;
  spice?: number;
  solari?: number;
  water?: number;
  troops?: number;
  vp?: number;
  trash?: boolean;
  influenceAny?: number;
  influence?: FactionId[] | FactionId;
}

/** One Intrigue card. */
export interface IntrigueDef {
  /** The stable key of the card. */
  key: string;
  /** The display name of the card. */
  name: string;
  /** The number of copies in the physical set. */
  copies: number;
  /** The time when the card may be played. */
  timing: IntrigueTiming;
  /** The condition to play the card. It is null when none is verified. */
  condition: string | null;
  /** The effect numbers of the card. */
  effects: IntrigueEffects;
  /** Notes and TODO flags. */
  note?: string;
}

export const INTRIGUE_CARDS: readonly IntrigueDef[] = [
  { key: 'dune-imperium-allied-armada', name: 'Allied Armada', copies: 1, timing: 'combat', condition: null, effects: { swords: 7 }, note: 'TODO: verify text.' },
  { key: 'dune-imperium-ambush', name: 'Ambush', copies: 2, timing: 'combat', condition: null, effects: { swords: 4 }, note: 'Rulebook combat example (line 628).' },
  { key: 'dune-imperium-bindu-suspension', name: 'Bindu Suspension', copies: 1, timing: 'plot', condition: null, effects: { draw: 1 }, note: 'TODO: verify text and timing.' },
  { key: 'dune-imperium-bribery', name: 'Bribery', copies: 1, timing: 'plot', condition: 'pay 2 Solari', effects: { influenceAny: 1 }, note: 'Cost verified by FAQ.' },
  { key: 'dune-imperium-bypass-protocol', name: 'Bypass Protocol', copies: 1, timing: 'plot', condition: null, effects: {}, note: 'TODO: verify text and timing.' },
  { key: 'dune-imperium-calculated-hire', name: 'Calculated Hire', copies: 1, timing: 'plot', condition: null, effects: {}, note: 'Rulebook: takes the Mentat only (line 682). TODO: verify effect.' },
  { key: 'dune-imperium-charisma', name: 'Charisma', copies: 1, timing: 'plot', condition: null, effects: {}, note: 'Kept face up until the next Reveal turn (FAQ). TODO: verify effect.' },
  { key: 'dune-imperium-choam-shares', name: 'CHOAM Shares', copies: 1, timing: 'plot', condition: null, effects: { vp: 1 }, note: 'TODO: verify condition and text.' },
  { key: 'dune-imperium-corner-the-marker', name: 'Corner the Market', copies: 1, timing: 'plot', condition: 'have as many The Spice Must Flow cards as each opponent', effects: { vp: 1 }, note: 'Condition verified by FAQ.' },
  { key: 'dune-imperium-councilor-s-dispensation', name: "Councilor's Dispensation", copies: 1, timing: 'plot', condition: 'have a High Council seat', effects: { spice: 2 }, note: 'Condition verified by FAQ.' },
  { key: 'dune-imperium-demand-respect', name: 'Demand Respect', copies: 1, timing: 'plot', condition: null, effects: { influenceAny: 1 }, note: 'TODO: verify text.' },
  { key: 'dune-imperium-dispatch-an-envoy', name: 'Dispatch an Envoy', copies: 2, timing: 'plot', condition: 'play during an Agent turn', effects: {}, note: 'Adds the missing faction icons to a card (FAQ).' },
  { key: 'dune-imperium-double-cross', name: 'Double Cross', copies: 1, timing: 'plot', condition: 'an opponent has a troop in the Conflict', effects: {}, note: 'Condition verified by FAQ. TODO: verify timing and text.' },
  { key: 'dune-imperium-favored-subject', name: 'Favored Subject', copies: 1, timing: 'plot', condition: null, effects: { influence: 'emperor' }, note: 'TODO: verify text.' },
  { key: 'dune-imperium-guild-authorization', name: 'Guild Authorization', copies: 1, timing: 'plot', condition: null, effects: { influence: 'spacingGuild' }, note: 'TODO: verify text.' },
  { key: 'dune-imperium-infiltrate', name: 'Infiltrate', copies: 1, timing: 'plot', condition: null, effects: {}, note: 'Related to Spies (FAQ). TODO: verify text and timing.' },
  { key: 'dune-imperium-know-their-ways', name: 'Know Their Ways', copies: 1, timing: 'plot', condition: null, effects: { influence: 'fremen' }, note: 'TODO: verify text.' },
  { key: 'dune-imperium-master-tactician', name: 'Master Tactician', copies: 3, timing: 'combat', condition: null, effects: { swords: 3 }, note: 'TODO: verify text.' },
  { key: 'dune-imperium-plans-within-plans', name: 'Plans Within Plans', copies: 1, timing: 'plot', condition: null, effects: { vp: 1 }, note: 'TODO: verify condition and text.' },
  { key: 'dune-imperium-poison-snooper', name: 'Poison Snooper', copies: 2, timing: 'plot', condition: null, effects: { draw: 1, trash: true }, note: 'Used on a Reveal turn (FAQ).' },
  { key: 'dune-imperium-private-army', name: 'Private Army', copies: 2, timing: 'combat', condition: null, effects: { swords: 5 }, note: 'TODO: verify text.' },
  { key: 'dune-imperium-rapid-mobilization', name: 'Rapid Mobilization', copies: 1, timing: 'combat', condition: null, effects: {}, note: 'Related to Retreat (FAQ). TODO: verify text and timing.' },
  { key: 'dune-imperium-recruitment-mission', name: 'Recruitment Mission', copies: 1, timing: 'plot', condition: 'play during a Reveal turn', effects: {}, note: 'Applies only to the current Reveal turn (FAQ).' },
  { key: 'dune-imperium-refocus', name: 'Refocus', copies: 1, timing: 'plot', condition: null, effects: { draw: 1 }, note: 'Reshuffles the discard pile (FAQ).' },
  { key: 'dune-imperium-reinforcements', name: 'Reinforcements', copies: 1, timing: 'plot', condition: null, effects: { troops: 3 }, note: 'TODO: verify text.' },
  { key: 'dune-imperium-secret-of-the-sisterhood', name: 'Secret of the Sisterhood', copies: 1, timing: 'plot', condition: null, effects: { influence: 'beneGesserit' }, note: 'TODO: verify text.' },
  { key: 'dune-imperium-staged-incident', name: 'Staged Incident', copies: 1, timing: 'combat', condition: null, effects: {}, note: 'Adjusts combat strength (FAQ). TODO: verify effect.' },
  { key: 'dune-imperium-the-sleeper-must-awaken', name: 'The Sleeper Must Awaken', copies: 1, timing: 'plot', condition: null, effects: { vp: 1 }, note: 'TODO: verify condition, text, and timing.' },
  { key: 'dune-imperium-tiebreaker', name: 'Tiebreaker', copies: 1, timing: 'combat', condition: null, effects: { swords: 2, spice: 10 }, note: 'TODO: verify text and effect values.' },
  { key: 'dune-imperium-to-the-victory', name: 'To The Victory...', copies: 1, timing: 'combat', condition: 'play when you win a Conflict', effects: { spice: 3 }, note: 'TODO: verify condition and text.' },
  { key: 'dune-imperium-urgent-mission', name: 'Urgent Mission', copies: 1, timing: 'plot', condition: null, effects: {}, note: 'TODO: verify text and timing.' },
  { key: 'dune-imperium-water-of-life', name: 'Water Of Life', copies: 1, timing: 'plot', condition: null, effects: { draw: 3 }, note: 'TODO: verify text.' },
  { key: 'dune-imperium-water-peddlers-union', name: 'Water Peddlers Union', copies: 1, timing: 'plot', condition: null, effects: { water: 1 }, note: 'TODO: verify text.' },
  { key: 'dune-imperium-windfall', name: 'Windfall', copies: 1, timing: 'plot', condition: null, effects: { solari: 2 }, note: 'TODO: verify text (2 Solari per full 10 Solari).' },
];

/** Find one Intrigue card by key. */
export function getIntrigue(key: string): IntrigueDef | undefined {
  return INTRIGUE_CARDS.find((c) => c.key === key);
}

/** The total number of Intrigue cards in the physical set. */
export const INTRIGUE_TOTAL_COPIES: number = INTRIGUE_CARDS.reduce((sum, c) => sum + c.copies, 0);