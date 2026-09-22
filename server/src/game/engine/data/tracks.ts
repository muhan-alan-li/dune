/**
 * The Faction Influence tracks.
 *
 * Rulebook (dune_rules.txt lines 321-330 and RULEBOOK.md):
 * - Reaching 2 Influence grants 1 Victory Point.
 *   Dropping below 2 loses that Victory Point.
 * - Reaching 4 Influence grants the bonus shown on that space.
 *   The bonus is kept after a drop. It can be earned again.
 * - The first player to reach 4 Influence earns the Alliance token,
 *   gains its Victory Points, and keeps the token until an opponent
 *   rises to a higher space on the track and passes them.
 */

import type { FactionId } from '@dune/shared';
import {
  ALLIANCE_VICTORY_POINTS,
  FACTIONS,
  INFLUENCE_BONUS_LEVEL,
  INFLUENCE_LEVEL_FOUR_BONUS,
  INFLUENCE_TRACK_SPACES,
  INFLUENCE_VP_LEVEL,
} from './constants.js';

/**
 * One Faction Influence track.
 */
export interface FactionTrack {
  /** The Faction of the track. */
  faction: FactionId;
  /** The number of spaces on the track, starting at 0. */
  spaces: number;
  /** The Influence level that grants 1 Victory Point. */
  vpLevel: number;
  /** The Influence level that grants the bonus and the Alliance. */
  bonusLevel: number;
  /** The text of the level-4 bonus. TODO: verify each value. */
  levelFourBonus: string;
  /** The Victory Points that the Alliance token grants when taken. */
  allianceVictoryPoints: number;
}

/** The four Faction tracks in order. */
export const FACTION_TRACKS: readonly FactionTrack[] = FACTIONS.map((faction) => ({
  faction,
  spaces: INFLUENCE_TRACK_SPACES,
  vpLevel: INFLUENCE_VP_LEVEL,
  bonusLevel: INFLUENCE_BONUS_LEVEL,
  levelFourBonus: INFLUENCE_LEVEL_FOUR_BONUS[faction] ?? '',
  allianceVictoryPoints: ALLIANCE_VICTORY_POINTS,
}));

/** Find one Faction track by Faction ID. */
export function getFactionTrack(faction: FactionId): FactionTrack {
  const track = FACTION_TRACKS.find((t) => t.faction === faction);
  if (!track) {
    throw new Error(`Unknown Faction: ${faction}`);
  }
  return track;
}

/**
 * The influence track changes for one move.
 * A move from below the VP level to the level or above grants a VP.
 * A move from the VP level or above to below it loses the VP.
 * A move that first crosses the bonus level grants the bonus once
 * and takes the Alliance when the token is free.
 */
export function describeInfluenceMove(from: number, to: number, faction: FactionId): {
  vpChange: number;
  bonusEarned: boolean;
} {
  const track = getFactionTrack(faction);
  const vpChange = (to >= track.vpLevel ? 1 : 0) - (from >= track.vpLevel ? 1 : 0);
  const bonusEarned = from < track.bonusLevel && to >= track.bonusLevel;
  return { vpChange, bonusEarned };
}