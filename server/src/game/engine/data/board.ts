/**
 * The 22 board spaces of the Dune Imperium base game.
 *
 * The data follows the Dune: Imperium Board Space Guide.
 * Sending an Agent to a Faction space also gains one Influence.
 */

import type { AgentIcon, FactionId } from '@dune/shared';

/**
 * The cost of a board space.
 * A spice range marks the Sell Melange space (cost 2 to 5 spice).
 */
export interface SpaceCost {
    solari?: number;
    spice?: number | { min: number; max: number };
    water?: number;
}

/** The effect of a board space. */
export type SpaceEffect =
    /** Harvest base spice and all bonus spice on a Maker space. */
    | { kind: 'maker'; spice: number }
    /** Recruit troops and draw cards. */
    | { kind: 'troopsAndDraw'; troops: number; draw: number }
    /** Recruit troops and draw an Intrigue card. */
    | { kind: 'troopsAndIntrigue'; troops: number }
    /** Conspire: Emperor Influence, 5 Solari, 2 troops, 1 Intrigue. */
    | { kind: 'conspire' }
    /** Foldspace: Spacing Guild Influence and acquire a Foldspace card. */
    | { kind: 'foldspace' }
    /** Recruit troops to the garrison. */
    | { kind: 'recruit'; troops: number }
    /** Recruit troops and gain water. */
    | { kind: 'recruitAndWater'; troops: number; water: number }
    /** Gain Influence with the shown Faction. */
    | { kind: 'influence'; faction: FactionId }
    /** Gain Influence and Solari. */
    | { kind: 'influenceAndSolari'; faction: FactionId; solari: number }
    /** Gain Influence and water. */
    | { kind: 'influenceAndWater'; faction: FactionId; water: number }
    /** Gain Influence and recruit troops. */
    | { kind: 'influenceAndTroops'; faction: FactionId; troops: number }
    /** Gain Influence, recruit troops, and gain water. */
    | { kind: 'influenceAndTroopsAndWater'; faction: FactionId; troops: number; water: number }
    /** Secrets: Bene Gesserit Influence, 1 Intrigue, and steal from 4+ holders. */
    | { kind: 'secrets' }
    /** Draw cards. */
    | { kind: 'drawCards'; draw: number }
    /** Gain Solari. */
    | { kind: 'solari'; solari: number }
    /** Take a High Council seat. */
    | { kind: 'highCouncil' }
    /** Draw a card and take the Mentat. */
    | { kind: 'mentat' }
    /** Take the Swordmaster (the third Agent). */
    | { kind: 'swordmaster' }
    /** Exchange spice for Solari on the Sell Melange chart. */
    | { kind: 'sellMelange' }
    /** Selective Breeding: trash one card to draw two cards. The space costs 2 spice. */
    | { kind: 'selectiveBreeding' }
    /** Hall of Oratory: recruit 1 troop. The Reveal bonus applies. */
    | { kind: 'hallOfOratory' };

/**
 * One board space in the game data.
 * The runtime state of a space lives in the engine, not here.
 */
export interface BoardSpaceDef {
    /** The stable ID of the space. */
    id: string;
    /** The display name of the space. */
    name: string;
    /** The Agent icon that the played card must match. */
    icon: AgentIcon;
    /** True when troops may deploy to the Conflict from this space. */
    combatSpace: boolean;
    /** The Faction whose Influence track advances. It is null for a neutral space. */
    faction: FactionId | null;
    /** The cost of the space. It is null when the space has no cost. */
    cost: SpaceCost | null;
    /** True when the space may be used only once per game. */
    oncePerGame: boolean;
    /** The Influence requirement of the space. It is null when none. */
    requirementInfluence: { faction: FactionId; min: number } | null;
    /** True when the space is a Maker space. */
    maker: boolean;
    /** The control bonus of the space. It is null when none. */
    controlBonus: 'solari' | 'spice' | null;
    /** The bonus that the owner gains on a Reveal turn. It is null when none. */
    revealBonus: { persuasion: number } | null;
    /** The effect of the space. */
    effect: SpaceEffect;
}

/** The board space data in table order. */
export const BOARD_SPACES: readonly BoardSpaceDef[] = [
    {
        id: 'arrakeen',
        name: 'Arrakeen',
        icon: 'city',
        combatSpace: true,
        faction: null,
        cost: null,
        oncePerGame: false,
        requirementInfluence: null,
        maker: false,
        controlBonus: 'solari',
        revealBonus: null,
        effect: { kind: 'troopsAndDraw', troops: 1, draw: 1 },
    },
    {
        id: 'carthag',
        name: 'Carthag',
        icon: 'city',
        combatSpace: true,
        faction: null,
        cost: null,
        oncePerGame: false,
        requirementInfluence: null,
        maker: false,
        controlBonus: 'solari',
        revealBonus: null,
        effect: { kind: 'troopsAndIntrigue', troops: 1 },
    },
    {
        id: 'conspire',
        name: 'Conspire',
        icon: 'emperor',
        combatSpace: false,
        faction: 'emperor',
        cost: { spice: 4 },
        oncePerGame: false,
        requirementInfluence: null,
        maker: false,
        controlBonus: null,
        revealBonus: null,
        effect: { kind: 'conspire' },
    },
    {
        id: 'foldspace',
        name: 'Foldspace',
        icon: 'spacingGuild',
        combatSpace: false,
        faction: 'spacingGuild',
        cost: null,
        oncePerGame: false,
        requirementInfluence: null,
        maker: false,
        controlBonus: null,
        revealBonus: null,
        effect: { kind: 'foldspace' },
    },
    {
        id: 'great-flat',
        name: 'The Great Flat',
        icon: 'spiceTrade',
        combatSpace: true,
        faction: null,
        cost: { water: 2 },
        oncePerGame: false,
        requirementInfluence: null,
        maker: true,
        controlBonus: null,
        revealBonus: null,
        effect: { kind: 'maker', spice: 3 },
    },
    {
        id: 'hagga-basin',
        name: 'Hagga Basin',
        icon: 'spiceTrade',
        combatSpace: true,
        faction: null,
        cost: { water: 1 },
        oncePerGame: false,
        requirementInfluence: null,
        maker: true,
        controlBonus: null,
        revealBonus: null,
        effect: { kind: 'maker', spice: 2 },
    },
    {
        id: 'hall-of-oratory',
        name: 'Hall of Oratory',
        icon: 'landsraad',
        combatSpace: false,
        faction: null,
        cost: null,
        oncePerGame: false,
        requirementInfluence: null,
        maker: false,
        controlBonus: null,
        revealBonus: { persuasion: 1 },
        effect: { kind: 'hallOfOratory' },
    },
    {
        id: 'hardy-warriors',
        name: 'Hardy Warriors',
        icon: 'fremen',
        combatSpace: true,
        faction: 'fremen',
        cost: { water: 1 },
        oncePerGame: false,
        requirementInfluence: null,
        maker: false,
        controlBonus: null,
        revealBonus: null,
        effect: { kind: 'influenceAndTroops', faction: 'fremen', troops: 2 },
    },
    {
        id: 'heighliner',
        name: 'Heighliner',
        icon: 'spacingGuild',
        combatSpace: true,
        faction: 'spacingGuild',
        cost: { spice: 6 },
        oncePerGame: false,
        requirementInfluence: null,
        maker: false,
        controlBonus: null,
        revealBonus: null,
        effect: {
            kind: 'influenceAndTroopsAndWater',
            faction: 'spacingGuild',
            troops: 5,
            water: 2,
        },
    },
    {
        id: 'high-council',
        name: 'High Council',
        icon: 'landsraad',
        combatSpace: false,
        faction: null,
        cost: { solari: 5 },
        oncePerGame: true,
        requirementInfluence: null,
        maker: false,
        controlBonus: null,
        revealBonus: null,
        effect: { kind: 'highCouncil' },
    },
    {
        id: 'imperial-basin',
        name: 'Imperial Basin',
        icon: 'spiceTrade',
        combatSpace: true,
        faction: null,
        cost: null,
        oncePerGame: false,
        requirementInfluence: null,
        maker: true,
        controlBonus: 'spice',
        revealBonus: null,
        effect: { kind: 'maker', spice: 1 },
    },
    {
        id: 'mentat',
        name: 'Mentat',
        icon: 'landsraad',
        combatSpace: false,
        faction: null,
        cost: { solari: 2 },
        oncePerGame: false,
        requirementInfluence: null,
        maker: false,
        controlBonus: null,
        revealBonus: null,
        effect: { kind: 'mentat' },
    },
    {
        id: 'rally-troops',
        name: 'Rally Troops',
        icon: 'landsraad',
        combatSpace: false,
        faction: null,
        cost: { solari: 4 },
        oncePerGame: false,
        requirementInfluence: null,
        maker: false,
        controlBonus: null,
        revealBonus: null,
        effect: { kind: 'recruit', troops: 4 },
    },
    {
        id: 'research-station',
        name: 'Research Station',
        icon: 'city',
        combatSpace: true,
        faction: null,
        cost: { water: 2 },
        oncePerGame: false,
        requirementInfluence: null,
        maker: false,
        controlBonus: null,
        revealBonus: null,
        effect: { kind: 'drawCards', draw: 3 },
    },
    {
        id: 'secrets',
        name: 'Secrets',
        icon: 'beneGesserit',
        combatSpace: false,
        faction: 'beneGesserit',
        cost: null,
        oncePerGame: false,
        requirementInfluence: null,
        maker: false,
        controlBonus: null,
        revealBonus: null,
        effect: { kind: 'secrets' },
    },
    {
        id: 'secure-contract',
        name: 'Secure Contract',
        icon: 'spiceTrade',
        combatSpace: false,
        faction: null,
        cost: null,
        oncePerGame: false,
        requirementInfluence: null,
        maker: false,
        controlBonus: null,
        revealBonus: null,
        effect: { kind: 'solari', solari: 3 },
    },
    {
        id: 'selective-breeding',
        name: 'Selective Breeding',
        icon: 'beneGesserit',
        combatSpace: false,
        faction: 'beneGesserit',
        cost: { spice: 2 },
        oncePerGame: false,
        requirementInfluence: null,
        maker: false,
        controlBonus: null,
        revealBonus: null,
        effect: { kind: 'selectiveBreeding' },
    },
    {
        id: 'sell-melange',
        name: 'Sell Melange',
        icon: 'spiceTrade',
        combatSpace: false,
        faction: null,
        cost: { spice: { min: 2, max: 5 } },
        oncePerGame: false,
        requirementInfluence: null,
        maker: false,
        controlBonus: null,
        revealBonus: null,
        effect: { kind: 'sellMelange' },
    },
    {
        id: 'sietch-tabr',
        name: 'Sietch Tabr',
        icon: 'city',
        combatSpace: true,
        faction: null,
        cost: null,
        oncePerGame: false,
        requirementInfluence: { faction: 'fremen', min: 2 },
        maker: false,
        controlBonus: null,
        revealBonus: null,
        effect: { kind: 'recruitAndWater', troops: 1, water: 1 },
    },
    {
        id: 'stillsuits',
        name: 'Stillsuits',
        icon: 'fremen',
        combatSpace: true,
        faction: 'fremen',
        cost: null,
        oncePerGame: false,
        requirementInfluence: null,
        maker: false,
        controlBonus: null,
        revealBonus: null,
        effect: { kind: 'influenceAndWater', faction: 'fremen', water: 1 },
    },
    {
        id: 'swordmaster',
        name: 'Swordmaster',
        icon: 'landsraad',
        combatSpace: false,
        faction: null,
        cost: { solari: 8 },
        oncePerGame: true,
        requirementInfluence: null,
        maker: false,
        controlBonus: null,
        revealBonus: null,
        effect: { kind: 'swordmaster' },
    },
    {
        id: 'wealth',
        name: 'Wealth',
        icon: 'emperor',
        combatSpace: false,
        faction: 'emperor',
        cost: null,
        oncePerGame: false,
        requirementInfluence: null,
        maker: false,
        controlBonus: null,
        revealBonus: null,
        effect: { kind: 'influenceAndSolari', faction: 'emperor', solari: 2 },
    },
] as const;

/** The IDs of the Maker board spaces. */
export const MAKER_SPACE_IDS: readonly string[] = [
    'great-flat',
    'hagga-basin',
    'imperial-basin',
] as const;

/** The IDs of the board spaces that are also Combat spaces. */
export const COMBAT_SPACE_IDS: readonly string[] = BOARD_SPACES.filter((s) => s.combatSpace).map(
    (s) => s.id,
);

/** Find one board space by ID. */
export function getBoardSpace(id: string): BoardSpaceDef | undefined {
    return BOARD_SPACES.find((s) => s.id === id);
}
