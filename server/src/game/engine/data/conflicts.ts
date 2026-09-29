/**
 * The 18 Conflict cards of the Dune Imperium base game.
 *
 * The tier split is 4 Conflict I, 10 Conflict II, 4 Conflict III
 * (printed components, dune_rules.txt line 89).
 * The reward text comes from the card descriptions of the fetched
 * catalogue (data/cards.base.json type "conflict").
 *
 * Catalogue corrections applied here:
 * - Raid Stockpiles: the catalogue marks it Conflict I. The printed
 *   rules have only 4 Conflict I cards (the Skirmish variants), so
 *   Raid Stockpiles is Conflict II.
 * - Battle for Arrakeen: the catalogue cost_text says "Conflict II".
 *   Its attribute conflict-3 and the 4/10/4 split make it Conflict III.
 */

import type { FactionId } from '@dune/shared';

/** One reward chunk of a Conflict card. */
export type ConflictReward =
    | { kind: 'vp'; amount: number }
    | { kind: 'solari'; amount: number }
    | { kind: 'spice'; amount: number }
    | { kind: 'water'; amount: number }
    | { kind: 'intrigue'; amount: number }
    | { kind: 'influence'; faction: FactionId; amount: number }
    /** Gain Influence with any Faction. All points go to one Faction when amount > 1. */
    | { kind: 'influenceAny'; amount: number }
    /** Trash one card from the hand, discard pile, or in play. */
    | { kind: 'trashCard' }
    /** Take the Mentat at the start of the next round. */
    | { kind: 'mentat' }
    /** Place a Control marker on the flag below the space. */
    | { kind: 'control'; spaceId: string }
    /** Choose two different options from the list. */
    | { kind: 'chooseTwo'; options: readonly ConflictReward[] }
    /** Choose one option from the list. */
    | { kind: 'chooseOne'; options: readonly ConflictReward[] };

/** The rewards of one Conflict card. */
export interface ConflictRewards {
    /** The 1st place reward. */
    first: readonly ConflictReward[];
    /** The 2nd place reward. */
    second: readonly ConflictReward[];
    /** The 3rd place reward. It applies only in a 4-player game. */
    third: readonly ConflictReward[];
}

/** The tier of a Conflict card back. */
export type ConflictTier = 'i' | 'ii' | 'iii';

/** One Conflict card. */
export interface ConflictDef {
    /** The stable key of the card. */
    key: string;
    /** The display name of the card. */
    name: string;
    /** The tier of the card back. */
    tier: ConflictTier;
    /** The rewards of the card. */
    rewards: ConflictRewards;
}

export const CONFLICT_I: readonly ConflictDef[] = [
    {
        key: 'skirmish-i',
        name: 'Skirmish I',
        tier: 'i',
        rewards: {
            first: [
                { kind: 'influenceAny', amount: 1 },
                { kind: 'solari', amount: 2 },
            ],
            second: [{ kind: 'solari', amount: 3 }],
            third: [{ kind: 'solari', amount: 2 }],
        },
    },
    {
        key: 'skirmish-ii',
        name: 'Skirmish II',
        tier: 'i',
        rewards: {
            first: [
                { kind: 'influenceAny', amount: 1 },
                { kind: 'spice', amount: 1 },
            ],
            second: [{ kind: 'spice', amount: 2 }],
            third: [{ kind: 'spice', amount: 1 }],
        },
    },
    {
        key: 'skirmish-iii',
        name: 'Skirmish III',
        tier: 'i',
        rewards: {
            first: [{ kind: 'vp', amount: 1 }],
            second: [{ kind: 'water', amount: 1 }],
            third: [{ kind: 'spice', amount: 1 }],
        },
    },
    {
        key: 'skirmish-iiii',
        name: 'Skirmish IIII',
        tier: 'i',
        rewards: {
            first: [{ kind: 'vp', amount: 1 }],
            second: [
                { kind: 'intrigue', amount: 1 },
                { kind: 'solari', amount: 2 },
            ],
            third: [{ kind: 'solari', amount: 2 }],
        },
    },
];

export const CONFLICT_II: readonly ConflictDef[] = [
    {
        key: 'raid-stockpiles',
        name: 'Raid Stockpiles',
        tier: 'ii',
        rewards: {
            first: [
                { kind: 'intrigue', amount: 1 },
                { kind: 'spice', amount: 3 },
            ],
            second: [{ kind: 'spice', amount: 2 }],
            third: [{ kind: 'spice', amount: 1 }],
        },
    },
    {
        key: 'cloak-and-dagger',
        name: 'Cloak and Dagger',
        tier: 'ii',
        rewards: {
            first: [
                { kind: 'influenceAny', amount: 1 },
                { kind: 'intrigue', amount: 2 },
            ],
            second: [
                { kind: 'intrigue', amount: 1 },
                { kind: 'spice', amount: 1 },
            ],
            third: [
                {
                    kind: 'chooseOne',
                    options: [
                        { kind: 'intrigue', amount: 1 },
                        { kind: 'spice', amount: 1 },
                    ],
                },
            ],
        },
    },
    {
        key: 'desert-power',
        name: 'Desert Power',
        tier: 'ii',
        rewards: {
            first: [
                { kind: 'vp', amount: 1 },
                { kind: 'water', amount: 1 },
            ],
            second: [
                { kind: 'water', amount: 1 },
                { kind: 'spice', amount: 1 },
            ],
            third: [{ kind: 'spice', amount: 1 }],
        },
    },
    {
        key: 'machinations',
        name: 'Machinations',
        tier: 'ii',
        rewards: {
            first: [
                {
                    kind: 'chooseTwo',
                    options: [
                        { kind: 'influence', faction: 'emperor', amount: 1 },
                        { kind: 'influence', faction: 'spacingGuild', amount: 1 },
                        { kind: 'influence', faction: 'beneGesserit', amount: 1 },
                        { kind: 'influence', faction: 'fremen', amount: 1 },
                    ],
                },
            ],
            second: [
                { kind: 'water', amount: 1 },
                { kind: 'solari', amount: 2 },
            ],
            third: [{ kind: 'water', amount: 1 }],
        },
    },
    {
        key: 'guild-bank-raid',
        name: 'Guild Bank Raid',
        tier: 'ii',
        rewards: {
            first: [{ kind: 'solari', amount: 6 }],
            second: [{ kind: 'solari', amount: 4 }],
            third: [{ kind: 'solari', amount: 2 }],
        },
    },
    {
        key: 'sort-through-the-chaos',
        name: 'Sort Through the Chaos',
        tier: 'ii',
        rewards: {
            first: [
                { kind: 'mentat' },
                { kind: 'intrigue', amount: 1 },
                { kind: 'solari', amount: 2 },
            ],
            second: [
                { kind: 'intrigue', amount: 1 },
                { kind: 'solari', amount: 2 },
            ],
            third: [{ kind: 'solari', amount: 2 }],
        },
    },
    {
        key: 'terrible-purpose',
        name: 'Terrible Purpose',
        tier: 'ii',
        rewards: {
            first: [{ kind: 'vp', amount: 1 }, { kind: 'trashCard' }],
            second: [
                { kind: 'water', amount: 1 },
                { kind: 'spice', amount: 1 },
            ],
            third: [{ kind: 'spice', amount: 1 }],
        },
    },
    {
        key: 'secure-imperial-basin',
        name: 'Secure Imperial Basin',
        tier: 'ii',
        rewards: {
            first: [
                { kind: 'vp', amount: 1 },
                { kind: 'control', spaceId: 'imperial-basin' },
            ],
            second: [{ kind: 'water', amount: 2 }],
            third: [{ kind: 'water', amount: 1 }],
        },
    },
    {
        key: 'siege-of-arrakeen',
        name: 'Siege of Arrakeen',
        tier: 'ii',
        rewards: {
            first: [
                { kind: 'vp', amount: 1 },
                { kind: 'control', spaceId: 'arrakeen' },
            ],
            second: [{ kind: 'solari', amount: 4 }],
            third: [{ kind: 'solari', amount: 2 }],
        },
    },
    {
        key: 'siege-of-carthag',
        name: 'Siege of Carthag',
        tier: 'ii',
        rewards: {
            first: [
                { kind: 'vp', amount: 1 },
                { kind: 'control', spaceId: 'carthag' },
            ],
            second: [
                { kind: 'intrigue', amount: 1 },
                { kind: 'spice', amount: 1 },
            ],
            third: [{ kind: 'spice', amount: 1 }],
        },
    },
];

export const CONFLICT_III: readonly ConflictDef[] = [
    {
        key: 'battle-for-arrakeen',
        name: 'Battle for Arrakeen',
        tier: 'iii',
        rewards: {
            first: [
                { kind: 'vp', amount: 2 },
                { kind: 'control', spaceId: 'arrakeen' },
            ],
            second: [
                {
                    kind: 'chooseTwo',
                    options: [
                        { kind: 'intrigue', amount: 1 },
                        { kind: 'spice', amount: 2 },
                        { kind: 'solari', amount: 3 },
                    ],
                },
            ],
            third: [
                { kind: 'intrigue', amount: 1 },
                { kind: 'solari', amount: 2 },
            ],
        },
    },
    {
        key: 'battle-for-carthag',
        name: 'Battle for Carthag',
        tier: 'iii',
        rewards: {
            first: [
                { kind: 'vp', amount: 2 },
                { kind: 'control', spaceId: 'carthag' },
            ],
            second: [
                { kind: 'intrigue', amount: 1 },
                { kind: 'spice', amount: 3 },
            ],
            third: [{ kind: 'spice', amount: 3 }],
        },
    },
    {
        key: 'battle-for-imperial-basin',
        name: 'Battle for Imperial Basin',
        tier: 'iii',
        rewards: {
            first: [
                { kind: 'vp', amount: 2 },
                { kind: 'control', spaceId: 'imperial-basin' },
            ],
            second: [{ kind: 'solari', amount: 5 }],
            third: [{ kind: 'solari', amount: 3 }],
        },
    },
    {
        key: 'grand-vision',
        name: 'Grand Vision',
        tier: 'iii',
        rewards: {
            first: [
                { kind: 'influenceAny', amount: 2 },
                { kind: 'intrigue', amount: 1 },
            ],
            second: [
                { kind: 'intrigue', amount: 1 },
                { kind: 'spice', amount: 3 },
            ],
            third: [{ kind: 'spice', amount: 3 }],
        },
    },
];

/** All 18 Conflict cards grouped by tier. */
export const ALL_CONFLICTS: Record<ConflictTier, readonly ConflictDef[]> = {
    i: CONFLICT_I,
    ii: CONFLICT_II,
    iii: CONFLICT_III,
};

/** Find one Conflict card by key. */
export function getConflict(key: string): ConflictDef | undefined {
    for (const tier of ['i', 'ii', 'iii'] as const) {
        const card = ALL_CONFLICTS[tier].find((c) => c.key === key);
        if (card) {
            return card;
        }
    }
    return undefined;
}
