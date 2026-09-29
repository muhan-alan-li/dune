/**
 * Game constants for the Dune Imperium base game.
 *
 * Values come from the printed rulebook transcript (dune_rules.txt),
 * the shared RULEBOOK.md, and the verified web sources.
 * A comment with "TODO: verify" marks a value that game knowledge
 * supports but that no fetched text source printed in full.
 */

import type { FactionId } from '@dune/shared';

/** The four Factions in a fixed order. */
export const FACTIONS: readonly FactionId[] = ['emperor', 'spacingGuild', 'beneGesserit', 'fremen'];

/**
 * The Sell Melange exchange chart.
 * The key is the spice paid. The value is the Solari gained.
 *
 * Only the 3 spice to 8 Solari row is verified (5+ independent
 * community sources). The other rows are printed on the board only.
 * TODO: verify rows 2, 4, 5.
 */
export const SELL_MELANGE_CHART: Readonly<Record<number, number>> = {
    2: 4, // TODO: verify
    3: 8,
    4: 10, // TODO: verify
    5: 13, // TODO: verify
};

/** The history of a player: the order of the player turns. */
export const MIN_PLAYERS = 3;

/** The maximum number of players. The base game supports 4. */
export const MAX_PLAYERS = 4;

/** The number of spaces on each Faction Influence track. */
export const INFLUENCE_TRACK_SPACES = 6; // Verified by FAQ: "There are six spaces on each Influence track."

/** Reaching this Influence grants 1 Victory Point. */
export const INFLUENCE_VP_LEVEL = 2;

/** Reaching this Influence grants the track bonus. */
export const INFLUENCE_BONUS_LEVEL = 4;

/** The Victory Points that an Alliance token grants when it is taken. */
export const ALLIANCE_VICTORY_POINTS = 1; // Verified: one Victory Point, per rulebook "the Victory Point shown on the Alliance token".

/**
 * The bonus that a player earns when they reach 4 Influence with a Faction.
 * The bonus is printed on the track only.
 * TODO: verify each value.
 */
export const INFLUENCE_LEVEL_FOUR_BONUS: Record<FactionId, string> = {
    emperor: 'gain 2 Solari',
    spacingGuild: 'gain 2 spice',
    beneGesserit: 'draw 1 Intrigue card',
    fremen: 'gain 1 water',
};

/** The Score value that ends the game at the end of a round. */
export const VICTORY_POINT_THRESHOLD = 10;

/** The starting resources of a normal Leader. */
export const STARTING_RESOURCES = { solari: 0, spice: 0, water: 1, persuasion: 0 } as const;

/**
 * The starting score.
 * In a 4-player game the marker starts on 1. Otherwise it starts on 0.
 */
export function startingScore(playerCount: number): number {
    return playerCount === 4 ? 1 : 0;
}

/** The number of troops in the garrison at setup. */
export const STARTING_GARRISON_TROOPS = 3;

/** The number of troops in the supply at setup. */
export const STARTING_SUPPLY_TROOPS = 9;

/** The number of cards in the Imperium Row. */
export const IMPERIUM_ROW_SIZE = 5;

/** The number of cards in the starting deck of each player. */
export const STARTING_DECK_SIZE = 10;

/** The number of cards in the per-game Conflict Deck. */
export const CONFLICT_DECK_SIZE = 10;

/** The number of Conflict I cards in the per-game deck. */
export const CONFLICT_DECK_TIER_I = 1;

/** The number of Conflict II cards in the per-game deck. */
export const CONFLICT_DECK_TIER_II = 5;

/** The number of Conflict III cards in the per-game deck. */
export const CONFLICT_DECK_TIER_III = 4;

/**
 * The number of bonus spice placed on each Maker space at setup.
 * Verified: setup places no spice on the board. Bonus spice
 * accumulates only during the Makers phase.
 */
export const MAKER_SETUP_SPICE = 0;

/** The number of bonus spice placed on a Maker space each Makers phase when it is empty. */
export const MAKER_PHASE_SPICE = 1;

/** The number of troops that a player may additionally deploy from the garrison. */
export const GARRISON_DEPLOY_LIMIT = 2;

/** The number of Swords that a player must have to be part of Combat. */
export const COMBAT_MIN_SWORDS = 0;

/** The cost to send an Agent to the Mentat space. */
export const MENTAT_COST = { solari: 2, spice: 0, water: 0 } as const;

/** The number of Intrigue cards that trigger the Secrets steal effect. */
export const SECRETS_STEAL_TRIGGER = 4;
