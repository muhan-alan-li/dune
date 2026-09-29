/**
 * The playable card set of the Dune Imperium base game.
 *
 * The Imperium Deck holds 67 cards: 43 unique cards in 63 copies per
 * the fetched catalogue, plus 4 corrected copies (DECK_COPY_OVERRIDES).
 * The printed components confirm "67 Imperium Deck cards"
 * (dune_rules.txt line 100) and the German rulebook
 * "67 allgemeine Imperium-Karten".
 *
 * The effect numbers come from the machine-readable attributes of the
 * fetched catalogue (data/cards.base.json). TODO: verify each card text
 * against the physical cards; the notes flag special effects that the
 * engine does not yet resolve.
 */

import type { AgentIcon, FactionId } from '@dune/shared';

/** The kind of a card. */
export type CardKind = 'imperium' | 'starter' | 'reserve';

/** The effects of the Agent box of a card. */
export interface CardOnPlay {
    /** Optional payment for the Agent effect. */
    optionalCost?: { water?: number; spice?: number; solari?: number };
    /** Recruit this many troops to the garrison. */
    troops?: number;
    /** Draw this many cards. */
    draw?: number;
    /** Draw this many Intrigue cards. */
    drawIntrigue?: number;
    /** Gain this much Solari. */
    solari?: number;
    /** Gain this much spice. */
    spice?: number;
    /** Gain this much water. */
    water?: number;
    /** Gain this many Victory Points. */
    vp?: number;
    /** Trash one card of the player's choice. */
    trash?: boolean;
    /** Gain Influence with any Faction. */
    influenceAny?: number;
    /** Gain 1 Influence with one of these Factions. */
    influence?: FactionId[] | FactionId;
    /** Gain 1 Influence with each of these Factions. */
    bumps?: FactionId[];
    /** Lose this many Influence (a cost, the player chooses the Faction). */
    loseInfluence?: number;
}

/** The effects of the Reveal box of a card. */
export interface CardOnReveal {
    /** The Persuasion gained on reveal. */
    persuasion?: number;
    /** The Swords added to Combat strength. */
    swords?: number;
    /** Gain this much Solari. */
    solari?: number;
    /** Gain this much spice. */
    spice?: number;
    /** Gain this much water. */
    water?: number;
    /** Draw this many cards. */
    draw?: number;
    /** Draw this many Intrigue cards. */
    drawIntrigue?: number;
    /** Gain this many Victory Points. */
    vp?: number;
    /** Trash this card. */
    trashSelf?: boolean;
    /** Gain 1 Influence with each of these Factions. */
    bumps?: FactionId[];
    /** Deploy up to this many troops from the garrison to the Conflict. */
    deployFromGarrison?: number;
}

/**
 * One playable card.
 */
export interface CardDef {
    /** The stable key of the card in the catalogue. */
    key: string;
    /** The display name of the card. */
    name: string;
    /** The kind of the card. */
    kind: CardKind;
    /** The number of copies in the physical set. */
    copies: number;
    /** The Persuasion cost to acquire the card. */
    cost: number;
    /** The Agent icons of the card. "all" marks a universal card. */
    icons: AgentIcon[] | 'all';
    /** The Faction tag of the card. It is null when none. */
    faction: FactionId | null;
    /** The effects of the Agent box. It is null when none. */
    onPlay: CardOnPlay | null;
    /** The effects of the Reveal box. It is null when none. */
    onReveal: CardOnReveal | null;
    /** A human note about acquire bonuses and special effects. */
    acquireNote?: string;
    /** Notes and TODO flags. */
    note?: string;
}

/** The catalogue slug of each card. */
const K = {
    powerPlay: 'dune-imperium-power-play',
    assassinationMission: 'dune-imperium-assassination-mission',
    drYueh: 'dune-imperium-dr-yueh',
    missionariaProtectiva: 'dune-imperium-missionaria-protectiva',
    sardaukarInfantry: 'dune-imperium-sardaukar-infantry',
    scout: 'dune-imperium-scout',
    arrakisRecruiter: 'dune-imperium-arrakis-recruiter',
    guildAdministrator: 'dune-imperium-guild-administrator',
    imperialSpy: 'dune-imperium-imperial-spy',
    spiceHunter: 'dune-imperium-spice-hunter',
    spiceSmugglers: 'dune-imperium-spice-smugglers',
    theVoice: 'dune-imperium-the-voice',
    beneGesseritInitiate: 'dune-imperium-bene-gesserit-initiate',
    beneGesseritSister: 'dune-imperium-bene-gesserit-sister',
    crysknife: 'dune-imperium-crysknife',
    fedaykinDeathCommando: 'dune-imperium-fedaykin-death-commando',
    geneManipulation: 'dune-imperium-gene-manipulation',
    guildBankers: 'dune-imperium-guild-bankers',
    shiftingAllegiances: 'dune-imperium-shifting-allegiances',
    spaceTravel: 'dune-imperium-space-travel',
    testOfHumanity: 'dune-imperium-test-of-humanity',
    duncanIdaho: 'dune-imperium-duncan-idaho',
    firmGrip: 'dune-imperium-firm-grip',
    fremenCamp: 'dune-imperium-fremen-camp',
    guildAmbassador: 'dune-imperium-guild-ambassador',
    gunThopter: 'dune-imperium-gun-thopter',
    otherMemory: 'dune-imperium-other-memory',
    sietchReverendMother: 'dune-imperium-sietch-reverend-mother',
    smugglersThopter: 'dune-imperium-smuggler-s-thopter',
    carryall: 'dune-imperium-carryall',
    chani: 'dune-imperium-chani',
    lietKynes: 'dune-imperium-liet-kynes',
    piterDeVries: 'dune-imperium-piter-de-vries',
    sardaukarLegion: 'dune-imperium-sardaukar-legion',
    stilgar: 'dune-imperium-stilgar',
    thufirHawat: 'dune-imperium-thufir-hawat',
    gurneyHalleck: 'dune-imperium-gurney-halleck',
    opulence: 'dune-imperium-opulence',
    reverendMotherMohiam: 'dune-imperium-reverend-mother-mohiam',
    wormRiders: 'dune-imperium-worm-riders',
    ladyJessica: 'dune-imperium-lady-jessica',
    choamDirectorship: 'dune-imperium-choam-directorship',
    kwisatzHaderach: 'dune-imperium-kwisatz-haderach',
    convincingArgument: 'dune-imperium-convincing-argument',
    dagger: 'dune-imperium-dagger',
    diplomacy: 'dune-imperium-diplomacy',
    duneTheDesertPlanet: 'dune-imperium-dune-the-desert-planet',
    reconnaissance: 'dune-imperium-reconnaissance',
    seekAllies: 'dune-imperium-seek-allies',
    signetRing: 'dune-imperium-signet-ring',
    arrakisLiaison: 'dune-imperium-arrakis-liaison',
    theSpiceMustFlow: 'dune-imperium-the-spice-must-flow',
    foldspace: 'dune-imperium-foldspace',
} as const;

/**
 * The +4 copy corrections to the fetched catalogue.
 * The catalogue physicalC70opies sum to 63; the physical set holds 67.
 */
export const DECK_COPY_OVERRIDES: Readonly<Record<string, number>> = {
    [K.arrakisRecruiter]: 2,
    [K.beneGesseritSister]: 3,
    [K.spiceHunter]: 2,
    [K.wormRiders]: 2,
};

/** Helper: the copy count of one card key, or null when no override. */
export function deckCopies(key: string, catalogueCopies: number): number {
    const override = DECK_COPY_OVERRIDES[key];
    return override === undefined ? catalogueCopies : override;
}

/** The 43 Imperium cards. */
export const IMPERIUM_CARDS: readonly CardDef[] = [
    {
        key: K.powerPlay,
        name: 'Power Play',
        kind: 'imperium',
        copies: deckCopies(K.powerPlay, 3),
        cost: 0,
        icons: ['emperor', 'spacingGuild', 'beneGesserit', 'fremen'],
        faction: null,
        onPlay: { influenceAny: 1 },
        onReveal: { persuasion: 0 },
        note: 'Faction Influence gains +1 (2 instead of 1) on a Faction space; trash after use. TODO: verify.',
    },
    {
        key: K.assassinationMission,
        name: 'Assassination Mission',
        kind: 'imperium',
        copies: deckCopies(K.assassinationMission, 2),
        cost: 1,
        icons: [],
        faction: null,
        onPlay: null,
        onReveal: { swords: 1, solari: 1, persuasion: 0 },
        note: 'Trash when another card or effect trashes it: gain 1 Solari. TODO: verify.',
    },
    {
        key: K.drYueh,
        name: 'Dr. Yueh',
        kind: 'imperium',
        copies: deckCopies(K.drYueh, 1),
        cost: 1,
        icons: ['city'],
        faction: null,
        onPlay: { draw: 1 },
        onReveal: { persuasion: 1 },
    },
    {
        key: K.missionariaProtectiva,
        name: 'Missionaria Protectiva',
        kind: 'imperium',
        copies: deckCopies(K.missionariaProtectiva, 2),
        cost: 1,
        icons: ['city'],
        faction: 'beneGesserit',
        onPlay: { influence: 'beneGesserit' },
        onReveal: { persuasion: 1 },
        note: 'Gain 1 Influence with another Bene Gesserit card in play (choice). TODO: verify.',
    },
    {
        key: K.sardaukarInfantry,
        name: 'Sardaukar Infantry',
        kind: 'imperium',
        copies: deckCopies(K.sardaukarInfantry, 2),
        cost: 1,
        icons: [],
        faction: 'emperor',
        onPlay: null,
        onReveal: { persuasion: 1, swords: 2 },
    },
    {
        key: K.scout,
        name: 'Scout',
        kind: 'imperium',
        copies: deckCopies(K.scout, 2),
        cost: 1,
        icons: ['city', 'spiceTrade'],
        faction: null,
        onPlay: null,
        onReveal: { persuasion: 1, swords: 1 },
        note: 'Retreat up to 2 troops from the Conflict on reveal. TODO: verify.',
    },
    {
        key: K.arrakisRecruiter,
        name: 'Arrakis Recruiter',
        kind: 'imperium',
        copies: deckCopies(K.arrakisRecruiter, 1),
        cost: 2,
        icons: ['city'],
        faction: null,
        onPlay: { troops: 1 },
        onReveal: { persuasion: 1, swords: 1 },
        note: 'Copy override: 1 to 2.',
    },
    {
        key: K.guildAdministrator,
        name: 'Guild Administrator',
        kind: 'imperium',
        copies: deckCopies(K.guildAdministrator, 2),
        cost: 2,
        icons: ['spacingGuild', 'spiceTrade'],
        faction: 'spacingGuild',
        onPlay: { trash: true },
        onReveal: { persuasion: 1 },
    },
    {
        key: K.imperialSpy,
        name: 'Imperial Spy',
        kind: 'imperium',
        copies: deckCopies(K.imperialSpy, 2),
        cost: 2,
        icons: ['emperor'],
        faction: 'emperor',
        onPlay: { drawIntrigue: 1, trash: true },
        onReveal: { persuasion: 1, swords: 1 },
        note: 'Must trash itself to draw the Intrigue card (FAQ).',
    },
    {
        key: K.spiceHunter,
        name: 'Spice Hunter',
        kind: 'imperium',
        copies: deckCopies(K.spiceHunter, 1),
        cost: 2,
        icons: ['fremen', 'spiceTrade'],
        faction: 'fremen',
        onPlay: null,
        onReveal: { persuasion: 1, swords: 1, spice: 1 },
        note: 'The 1 spice is the Fremen Bond bonus. Copy override: 1 to 2.',
    },
    {
        key: K.spiceSmugglers,
        name: 'Spice Smugglers',
        kind: 'imperium',
        copies: deckCopies(K.spiceSmugglers, 2),
        cost: 2,
        icons: ['city'],
        faction: 'spacingGuild',
        onPlay: { solari: 3, bumps: ['spacingGuild'] },
        onReveal: { persuasion: 1, swords: 1 },
        note: 'Pay 2 spice to gain the effects. TODO: verify.',
    },
    {
        key: K.theVoice,
        name: 'The Voice',
        kind: 'imperium',
        copies: deckCopies(K.theVoice, 2),
        cost: 2,
        icons: ['city', 'spiceTrade'],
        faction: 'beneGesserit',
        onPlay: null,
        onReveal: { persuasion: 2 },
        note: 'Blocks one board space for opponents until your next turn. TODO: implement.',
    },
    {
        key: K.beneGesseritInitiate,
        name: 'Bene Gesserit Initiate',
        kind: 'imperium',
        copies: deckCopies(K.beneGesseritInitiate, 2),
        cost: 3,
        icons: ['landsraad', 'city', 'spiceTrade'],
        faction: 'beneGesserit',
        onPlay: { draw: 1 },
        onReveal: { persuasion: 1 },
    },
    {
        key: K.beneGesseritSister,
        name: 'Bene Gesserit Sister',
        kind: 'imperium',
        copies: deckCopies(K.beneGesseritSister, 2),
        cost: 3,
        icons: ['beneGesserit', 'landsraad'],
        faction: 'beneGesserit',
        onPlay: null,
        onReveal: { persuasion: 2, swords: 2 },
        note: 'Copy override: 2 to 3.',
    },
    {
        key: K.crysknife,
        name: 'Crysknife',
        kind: 'imperium',
        copies: deckCopies(K.crysknife, 1),
        cost: 3,
        icons: ['fremen', 'spiceTrade'],
        faction: 'fremen',
        onPlay: { solari: 1 },
        onReveal: { swords: 1, persuasion: 0, bumps: ['fremen'] },
        note: 'The Fremen Influence on reveal is the Fremen Bond bonus.',
    },
    {
        key: K.fedaykinDeathCommando,
        name: 'Fedaykin Death Commando',
        kind: 'imperium',
        copies: deckCopies(K.fedaykinDeathCommando, 2),
        cost: 3,
        icons: ['city', 'spiceTrade'],
        faction: 'fremen',
        onPlay: { trash: true },
        onReveal: { persuasion: 1, swords: 3 },
        note: 'Fremen Bond: the extra swords need another Fremen card in play. TODO: verify.',
    },
    {
        key: K.geneManipulation,
        name: 'Gene Manipulation',
        kind: 'imperium',
        copies: deckCopies(K.geneManipulation, 2),
        cost: 3,
        icons: ['landsraad', 'city'],
        faction: 'beneGesserit',
        onPlay: { trash: true, spice: 2 },
        onReveal: { persuasion: 2 },
        note: 'The 2 spice needs another Bene Gesserit card in play. TODO: verify.',
    },
    {
        key: K.guildBankers,
        name: 'Guild Bankers',
        kind: 'imperium',
        copies: deckCopies(K.guildBankers, 1),
        cost: 3,
        icons: ['emperor', 'spacingGuild', 'landsraad'],
        faction: 'spacingGuild',
        onPlay: null,
        onReveal: { persuasion: 0 },
        note: 'The Spice Must Flow costs 3 less this turn (FAQ). TODO: verify text.',
    },
    {
        key: K.shiftingAllegiances,
        name: 'Shifting Allegiances',
        kind: 'imperium',
        copies: deckCopies(K.shiftingAllegiances, 2),
        cost: 3,
        icons: ['landsraad', 'spiceTrade'],
        faction: null,
        onPlay: { loseInfluence: 1, influenceAny: 2 },
        onReveal: { persuasion: 2 },
        note: 'Pay 1 Influence and 2 spice to gain 2 other Influence (FAQ).',
    },
    {
        key: K.spaceTravel,
        name: 'Space Travel',
        kind: 'imperium',
        copies: deckCopies(K.spaceTravel, 2),
        cost: 3,
        icons: ['spacingGuild'],
        faction: 'spacingGuild',
        onPlay: { draw: 1 },
        onReveal: { persuasion: 2 },
    },
    {
        key: K.testOfHumanity,
        name: 'Test of Humanity',
        kind: 'imperium',
        copies: deckCopies(K.testOfHumanity, 1),
        cost: 3,
        icons: ['beneGesserit', 'landsraad', 'city'],
        faction: 'beneGesserit',
        onPlay: null,
        onReveal: { persuasion: 2 },
        note: 'Opponents discard 1 card or lose 1 deployed troop. TODO: verify.',
    },
    {
        key: K.duncanIdaho,
        name: 'Duncan Idaho',
        kind: 'imperium',
        copies: deckCopies(K.duncanIdaho, 1),
        cost: 4,
        icons: ['city'],
        faction: null,
        onPlay: { optionalCost: { water: 1 }, troops: 1, draw: 1 },
        onReveal: { water: 1, swords: 3, persuasion: 0 },
        note: 'Pay 1 water for the Agent effect. TODO: verify the Swords value (2 or 3) against the physical card.',
    },
    {
        key: K.firmGrip,
        name: 'Firm Grip',
        kind: 'imperium',
        copies: deckCopies(K.firmGrip, 1),
        cost: 4,
        icons: ['emperor', 'landsraad'],
        faction: 'emperor',
        onPlay: { bumps: ['spacingGuild', 'beneGesserit', 'fremen'] },
        onReveal: { persuasion: 4 },
        note: 'Pay 2 Solari to gain 1 Influence (choice); the 4 Persuasion needs an Emperor Alliance. TODO: verify.',
    },
    {
        key: K.fremenCamp,
        name: 'Fremen Camp',
        kind: 'imperium',
        copies: deckCopies(K.fremenCamp, 2),
        cost: 4,
        icons: ['spiceTrade'],
        faction: 'fremen',
        onPlay: { optionalCost: { spice: 2 }, troops: 3 },
        onReveal: { persuasion: 2, swords: 1 },
        note: 'Pay 2 spice to recruit the 3 troops. The rulebook gives this example.',
    },
    {
        key: K.guildAmbassador,
        name: 'Guild Ambassador',
        kind: 'imperium',
        copies: deckCopies(K.guildAmbassador, 1),
        cost: 4,
        icons: ['landsraad'],
        faction: 'spacingGuild',
        onPlay: { spice: 2, bumps: ['spacingGuild'] },
        onReveal: { vp: 1, persuasion: 0 },
        note: 'Gain 1 Spacing Guild Influence OR 2 spice; pay 3 spice on reveal for the Victory Point. TODO: verify.',
    },
    {
        key: K.gunThopter,
        name: 'Gun Thopter',
        kind: 'imperium',
        copies: deckCopies(K.gunThopter, 2),
        cost: 4,
        icons: ['city', 'spiceTrade'],
        faction: null,
        onPlay: null,
        onReveal: { swords: 3, deployFromGarrison: 1, persuasion: 0 },
        note: 'Each opponent loses 1 garrisoned troop (FAQ: unaffected when none). TODO: verify.',
    },
    {
        key: K.otherMemory,
        name: 'Other Memory',
        kind: 'imperium',
        copies: deckCopies(K.otherMemory, 1),
        cost: 4,
        icons: ['city', 'spiceTrade'],
        faction: 'beneGesserit',
        onPlay: { draw: 1 },
        onReveal: { persuasion: 2 },
        note: 'Draw 1 card or 1 Bene Gesserit card from the discard pile. TODO: verify.',
    },
    {
        key: K.sietchReverendMother,
        name: 'Sietch Reverend Mother',
        kind: 'imperium',
        copies: deckCopies(K.sietchReverendMother, 1),
        cost: 4,
        icons: ['beneGesserit', 'fremen'],
        faction: 'beneGesserit',
        onPlay: { trash: true },
        onReveal: { persuasion: 3, spice: 1 },
        note: 'Fremen Bond: the 3 Persuasion and 1 spice need a Fremen card in play. TODO: verify.',
    },
    {
        key: K.smugglersThopter,
        name: "Smuggler's Thopter",
        kind: 'imperium',
        copies: deckCopies(K.smugglersThopter, 2),
        cost: 4,
        icons: ['spiceTrade'],
        faction: 'spacingGuild',
        onPlay: { draw: 2 },
        onReveal: { persuasion: 1, spice: 1 },
        note: 'The draw needs 2 Spacing Guild Influence. TODO: verify.',
    },
    {
        key: K.carryall,
        name: 'Carryall',
        kind: 'imperium',
        copies: deckCopies(K.carryall, 1),
        cost: 5,
        icons: ['spiceTrade'],
        faction: null,
        onPlay: null,
        onReveal: { persuasion: 1, spice: 2 },
        note: 'Doubles the base spice harvest (not the bonus spice). TODO: verify.',
    },
    {
        key: K.chani,
        name: 'Chani',
        kind: 'imperium',
        copies: deckCopies(K.chani, 1),
        cost: 5,
        icons: ['fremen', 'city', 'spiceTrade'],
        faction: 'fremen',
        onPlay: null,
        onReveal: { persuasion: 2 },
        acquireNote: 'Acquire: gain 1 water.',
    },
    {
        key: K.lietKynes,
        name: 'Liet Kynes',
        kind: 'imperium',
        copies: deckCopies(K.lietKynes, 1),
        cost: 5,
        icons: ['fremen', 'city'],
        faction: 'emperor',
        onPlay: null,
        onReveal: { persuasion: 2 },
        acquireNote: 'Acquire: gain 1 Emperor Influence.',
        note: 'Provides 2 Persuasion for each Fremen card in play (FAQ).',
    },
    {
        key: K.piterDeVries,
        name: 'Piter De Vries',
        kind: 'imperium',
        copies: deckCopies(K.piterDeVries, 1),
        cost: 5,
        icons: ['landsraad', 'city'],
        faction: null,
        onPlay: { drawIntrigue: 1 },
        onReveal: { persuasion: 3, swords: 1 },
    },
    {
        key: K.sardaukarLegion,
        name: 'Sardaukar Legion',
        kind: 'imperium',
        copies: deckCopies(K.sardaukarLegion, 2),
        cost: 5,
        icons: ['emperor', 'landsraad'],
        faction: 'emperor',
        onPlay: { troops: 2 },
        onReveal: { persuasion: 1, deployFromGarrison: 3 },
    },
    {
        key: K.stilgar,
        name: 'Stilgar',
        kind: 'imperium',
        copies: deckCopies(K.stilgar, 1),
        cost: 5,
        icons: ['fremen', 'city', 'spiceTrade'],
        faction: 'fremen',
        onPlay: { water: 1 },
        onReveal: { persuasion: 2, swords: 3 },
    },
    {
        key: K.thufirHawat,
        name: 'Thufir Hawat',
        kind: 'imperium',
        copies: deckCopies(K.thufirHawat, 1),
        cost: 5,
        icons: ['emperor', 'spacingGuild', 'beneGesserit', 'fremen', 'city', 'spiceTrade'],
        faction: null,
        onPlay: { draw: 1 },
        onReveal: { persuasion: 1, drawIntrigue: 1 },
    },
    {
        key: K.gurneyHalleck,
        name: 'Gurney Halleck',
        kind: 'imperium',
        copies: deckCopies(K.gurneyHalleck, 1),
        cost: 6,
        icons: ['city'],
        faction: null,
        onPlay: { troops: 2, draw: 1 },
        onReveal: { persuasion: 2 },
        note: 'Pay 3 Solari: +2 troops to the garrison or the Conflict. TODO: verify.',
    },
    {
        key: K.opulence,
        name: 'Opulence',
        kind: 'imperium',
        copies: deckCopies(K.opulence, 1),
        cost: 6,
        icons: ['emperor'],
        faction: 'emperor',
        onPlay: { solari: 3 },
        onReveal: { persuasion: 1, vp: 1 },
        note: 'Pay 6 Solari on reveal for the Victory Point. TODO: verify.',
    },
    {
        key: K.reverendMotherMohiam,
        name: 'Reverend Mother Mohiam',
        kind: 'imperium',
        copies: deckCopies(K.reverendMotherMohiam, 1),
        cost: 6,
        icons: ['emperor', 'beneGesserit'],
        faction: 'emperor',
        onPlay: null,
        onReveal: { persuasion: 2, spice: 2 },
        note: 'Each opponent discards 2 cards. TODO: verify.',
    },
    {
        key: K.wormRiders,
        name: 'Worm Riders',
        kind: 'imperium',
        copies: deckCopies(K.wormRiders, 1),
        cost: 6,
        icons: ['city', 'spiceTrade'],
        faction: 'fremen',
        onPlay: { spice: 2 },
        onReveal: { swords: 6, persuasion: 0 },
        note: 'The 6 Swords need 2 Fremen Influence; +2 more with an Alliance. Copy override: 1 to 2. TODO: verify.',
    },
    {
        key: K.ladyJessica,
        name: 'Lady Jessica',
        kind: 'imperium',
        copies: deckCopies(K.ladyJessica, 1),
        cost: 7,
        icons: ['beneGesserit', 'landsraad', 'city', 'spiceTrade'],
        faction: 'beneGesserit',
        onPlay: { draw: 2 },
        onReveal: { persuasion: 3, swords: 1 },
        acquireNote: 'Acquire: draw 2 cards and gain 1 Influence with any Faction.',
    },
    {
        key: K.choamDirectorship,
        name: 'CHOAM Directorship',
        kind: 'imperium',
        copies: deckCopies(K.choamDirectorship, 1),
        cost: 8,
        icons: [],
        faction: null,
        onPlay: null,
        onReveal: { solari: 3, persuasion: 0 },
        acquireNote: 'Acquire: gain 1 Influence with all 4 Factions.',
    },
    {
        key: K.kwisatzHaderach,
        name: 'Kwisatz Haderach',
        kind: 'imperium',
        copies: deckCopies(K.kwisatzHaderach, 1),
        cost: 8,
        icons: [
            'emperor',
            'spacingGuild',
            'beneGesserit',
            'fremen',
            'landsraad',
            'city',
            'spiceTrade',
        ],
        faction: 'beneGesserit',
        onPlay: { draw: 1 },
        onReveal: { persuasion: 0 },
        note: 'Also sends an Agent from its current space to any other space (no card needed). TODO: verify.',
    },
];

/** The 7 starter card types. Each row states the copies in the 10-card deck. */
export const STARTER_CARDS: readonly CardDef[] = [
    {
        key: K.convincingArgument,
        name: 'Convincing Argument',
        kind: 'starter',
        copies: 2,
        cost: 0,
        icons: [],
        faction: null,
        onPlay: null,
        onReveal: { persuasion: 2 },
    },
    {
        key: K.dagger,
        name: 'Dagger',
        kind: 'starter',
        copies: 2,
        cost: 0,
        icons: ['landsraad', 'city'],
        faction: null,
        onPlay: null,
        onReveal: { swords: 1 },
        note: 'One source labels the second icon "CHOAM". The base game has no CHOAM Agent icon; the City icon is used.',
    },
    {
        key: K.diplomacy,
        name: 'Diplomacy',
        kind: 'starter',
        copies: 1,
        cost: 0,
        icons: ['emperor', 'spacingGuild', 'beneGesserit', 'fremen'],
        faction: null,
        onPlay: null,
        onReveal: { persuasion: 1, solari: 1 },
    },
    {
        key: K.duneTheDesertPlanet,
        name: 'Dune, the Desert Planet',
        kind: 'starter',
        copies: 2,
        cost: 0,
        icons: 'all',
        faction: null,
        onPlay: null,
        onReveal: { persuasion: 1 },
    },
    {
        key: K.reconnaissance,
        name: 'Reconnaissance',
        kind: 'starter',
        copies: 1,
        cost: 0,
        icons: [],
        faction: null,
        onPlay: null,
        onReveal: { persuasion: 1 },
        note: 'TODO: verify the Agent icons and the Reveal value against the physical card.',
    },
    {
        key: K.seekAllies,
        name: 'Seek Allies',
        kind: 'starter',
        copies: 1,
        cost: 0,
        icons: ['beneGesserit'],
        faction: null,
        onPlay: { trash: true },
        onReveal: null,
        note: 'Trash this card when it sends an Agent.',
    },
    {
        key: K.signetRing,
        name: 'Signet Ring',
        kind: 'starter',
        copies: 1,
        cost: 0,
        icons: ['landsraad', 'city', 'spiceTrade'],
        faction: null,
        onPlay: null,
        onReveal: null,
        note: 'On an Agent turn, this card activates the Leader Signet ability. The icons are shown on a Dire Wolf card image.',
    },
];

/** The 3 Reserve card types. */
export const RESERVE_CARDS: readonly CardDef[] = [
    {
        key: K.arrakisLiaison,
        name: 'Arrakis Liaison',
        kind: 'reserve',
        copies: 8,
        cost: 0,
        icons: [],
        faction: 'fremen',
        onPlay: null,
        onReveal: { persuasion: 1 },
    },
    {
        key: K.theSpiceMustFlow,
        name: 'The Spice Must Flow',
        kind: 'reserve',
        copies: 10,
        cost: 9,
        icons: [],
        faction: null,
        onPlay: null,
        onReveal: null,
        acquireNote:
            'Acquire: gain 1 Victory Point. The Victory Point is kept even if the card is trashed (FAQ).',
    },
    {
        key: K.foldspace,
        name: 'Foldspace',
        kind: 'reserve',
        copies: 6,
        cost: 0,
        icons: 'all',
        faction: 'spacingGuild',
        onPlay: null,
        onReveal: { draw: 1, trashSelf: true },
        acquireNote: 'Acquire only from the Foldspace board space.',
        note: 'Two separate effects: "Trash this card." and "Draw 1 card." (FAQ).',
    },
];

/** All playable cards by key. */
export const ALL_CARDS: ReadonlyMap<string, CardDef> = new Map(
    [...IMPERIUM_CARDS, ...STARTER_CARDS, ...RESERVE_CARDS].map((card) => [card.key, card]),
);

/** Find one playable card by key. */
export function getCard(key: string): CardDef | undefined {
    return ALL_CARDS.get(key);
}

/** The total number of Imperium Deck cards. It must be 67. */
export const IMPERIUM_TOTAL_COPIES: number = IMPERIUM_CARDS.reduce(
    (sum, card) => sum + card.copies,
    0,
);

/** The total number of Reserve cards. It must be 24. */
export const RESERVE_TOTAL_COPIES: number = RESERVE_CARDS.reduce(
    (sum, card) => sum + card.copies,
    0,
);
