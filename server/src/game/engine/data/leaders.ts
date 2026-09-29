/**
 * The 8 Leaders of the Dune Imperium base game.
 *
 * Verified sources: RulesPal Transcripts, the official FAQ
 * (DUNE_IMPERIUM_FAQ_21-12-1.pdf) and video leader guides.
 * The optional Signet ability of each Leader is played with the Signet
 * Ring card, once per turn. It costs the listed resources when stated.
 */

import type { Resources } from '@dune/shared';

/** The main ability of a Leader. */
export interface LeaderAbility {
    /** The name of the ability. */
    name: string;
    /** The simple description of the ability. */
    description: string;
    /** The spice gained at the start of the game. */
    startSpice?: number;
    /** The Solari gained at the start of the game. */
    startSolari?: number;
    /** The discount on the Solari cost of Landsraad spaces. */
    landsraadCostDiscount?: number;
    /** The spice lost on every maker space harvest (not optional). */
    makerSpicePenalty?: number;
    /** Opponent Agents do not block the player on Landsraad and City spaces. */
    ignoresBlockingOnLandsraadAndCity?: boolean;
}

/** The Signet ability of a Leader. */
export interface LeaderSignet {
    /** The name of the ability. */
    name: string;
    /** The cost to play the ability. */
    cost?: Partial<Resources>;
    /** The simple description of the ability. */
    description: string;
    /** The troops recruited by the ability. */
    troops?: number;
    /** The troops recruited by the ability when any Alliance exists. */
    troopsWithAlliance?: number;
    /** The water gained by the ability. */
    water?: number;
    /** The spice gained by the ability. */
    spice?: number;
    /** The Solari gained by the ability. */
    solari?: number;
    /** The number of cards drawn by the ability. */
    draw?: number;
    /** The number of Influence tokens gained with any Faction. */
    influenceAny?: number;
}

/** One Leader. */
export interface LeaderDef {
    /** The stable key of the Leader. */
    key: string;
    /** The display name of the Leader. */
    name: string;
    /** The main ability of the Leader. */
    ability: LeaderAbility;
    /** The Signet ability of the Leader. */
    signet: LeaderSignet;
}

export const LEADERS: readonly LeaderDef[] = [
    {
        key: 'baron-harkonnen',
        name: 'Baron Vladimir Harkonnen',
        ability: {
            name: 'Masterstroke',
            description:
                'After setup, secretly choose 2 of the 4 Faction tokens. When you deploy 4 or more troops in one turn, reveal your choice and gain 1 Influence with each chosen Faction. This happens once per game.',
        },
        signet: {
            name: 'Scheming',
            cost: { solari: 1 },
            description: 'Gain 1 Intrigue card.',
            draw: 0,
        },
    },
    {
        key: 'paul-atreides',
        name: 'Paul Atreides',
        ability: {
            name: 'Prescience',
            description: 'At any time, look at the top card of the Imperium Deck.',
        },
        signet: {
            name: 'Discipline',
            description: 'Draw 1 card.',
            draw: 1,
        },
    },
    {
        key: 'duke-leto-atreides',
        name: 'Duke Leto Atreides',
        ability: {
            name: 'Political Marriage',
            description: 'The Solari cost of Landsraad spaces is 1 less for you.',
            landsraadCostDiscount: 1,
        },
        signet: {
            name: 'Prudent Diplomacy',
            cost: { spice: 1 },
            description:
                'Gain 1 Influence with a Faction where an opponent has more Influence than you.',
            influenceAny: 1,
        },
    },
    {
        key: 'glossu-rabban',
        name: 'Glossu "The Beast" Rabban',
        ability: {
            name: 'Arrakis Fiefdom',
            description: 'At the start of the game, gain 1 spice and 1 Solari.',
            startSpice: 1,
            startSolari: 1,
        },
        signet: {
            name: 'Brutality',
            description:
                'Recruit 1 troop to your garrison. Recruit 2 troops instead when any player has an Alliance token.',
            troops: 1,
            troopsWithAlliance: 2,
        },
    },
    {
        key: 'countess-ariana-thorvald',
        name: 'Countess Ariana Thorvald',
        ability: {
            name: 'Spice Addict',
            description:
                'Harvest 1 less spice from maker spaces (this is not optional) and draw 1 card.',
            makerSpicePenalty: 1,
        },
        signet: {
            name: 'Clairvoyance',
            description: 'Gain 1 water.',
            water: 1,
        },
    },
    {
        key: 'earl-memnon-thorvald',
        name: 'Earl Memnon Thorvald',
        ability: {
            name: 'Master of Coin',
            description: 'When you take a High Council seat, gain 1 Influence with any Faction.',
        },
        signet: {
            name: 'Guild Banker',
            description: 'Gain 1 spice.',
            spice: 1,
        },
    },
    {
        key: 'count-ilban-richese',
        name: 'Count Ilban Richese',
        ability: {
            name: 'Ruthless Negotiator',
            description:
                'Pay 1 Solari for each space cost shown on a board space. After you send an Agent there, draw 1 card.',
        },
        signet: {
            name: 'Manufacturing',
            description: 'Gain 1 Solari.',
            solari: 1,
        },
    },
    {
        key: 'helena-richese',
        name: 'Helena Richese',
        ability: {
            name: 'Eyes Everywhere',
            description: 'Opponent Agents do not block you on Landsraad and City spaces.',
            ignoresBlockingOnLandsraadAndCity: true,
        },
        signet: {
            name: 'Manipulate',
            description:
                'Remove 1 card from the Imperium Row and replace it with another card of the same type. During this Reveal turn, you may acquire that card for 1 less Persuasion. Opponents cannot acquire it. If you do not acquire it, remove it at the end of your next Reveal turn.',
        },
    },
];

/** Find one Leader by key. */
export function getLeader(key: string): LeaderDef | undefined {
    return LEADERS.find((leader) => leader.key === key);
}
