import { describe, expect, it } from 'vitest';
import { BOARD_SPACES, MAKER_SPACE_IDS } from './board.js';
import { IMPERIUM_CARDS, RESERVE_CARDS, STARTER_CARDS } from './cards.js';
import { CONFLICT_I, CONFLICT_II, CONFLICT_III } from './conflicts.js';
import { INTRIGUE_CARDS } from './intrigue.js';

// Counts and names come from sections 3 and 19 of the base game rulebook.
describe('base game card and space data', () => {
    it('has the printed card counts', () => {
        expect(IMPERIUM_CARDS.reduce((sum, card) => sum + card.copies, 0)).toBe(67);
        expect(INTRIGUE_CARDS.reduce((sum, card) => sum + card.copies, 0)).toBe(40);
        expect([CONFLICT_I.length, CONFLICT_II.length, CONFLICT_III.length]).toEqual([4, 10, 4]);
        expect(Object.fromEntries(RESERVE_CARDS.map((card) => [card.name, card.copies]))).toEqual({
            'Arrakis Liaison': 8,
            'The Spice Must Flow': 10,
            Foldspace: 6,
        });
        expect(Object.fromEntries(STARTER_CARDS.map((card) => [card.name, card.copies]))).toEqual({
            'Convincing Argument': 2,
            Dagger: 2,
            Diplomacy: 1,
            'Dune, the Desert Planet': 2,
            Reconnaissance: 1,
            'Seek Allies': 1,
            'Signet Ring': 1,
        });
    });

    it('has each board space in the printed guide', () => {
        expect(BOARD_SPACES.map((space) => space.name).sort()).toEqual(
            [
                'Arrakeen',
                'Carthag',
                'Conspire',
                'Foldspace',
                'The Great Flat',
                'Hagga Basin',
                'Hall of Oratory',
                'Hardy Warriors',
                'Heighliner',
                'High Council',
                'Imperial Basin',
                'Mentat',
                'Rally Troops',
                'Research Station',
                'Secrets',
                'Secure Contract',
                'Selective Breeding',
                'Sell Melange',
                'Sietch Tabr',
                'Stillsuits',
                'Swordmaster',
                'Wealth',
            ].sort(),
        );
        expect([...MAKER_SPACE_IDS].sort()).toEqual([
            'great-flat',
            'hagga-basin',
            'imperial-basin',
        ]);
    });

    it('has the Signet Ring icons shown by Dire Wolf', () => {
        expect(STARTER_CARDS.find((card) => card.name === 'Signet Ring')?.icons).toEqual([
            'landsraad',
            'city',
            'spiceTrade',
        ]);
    });

    it('has the two Agent effect costs shown in the rulebook', () => {
        expect(
            IMPERIUM_CARDS.find((card) => card.name === 'Duncan Idaho')?.onPlay?.optionalCost,
        ).toEqual({ water: 1 });
        expect(
            IMPERIUM_CARDS.find((card) => card.name === 'Fremen Camp')?.onPlay?.optionalCost,
        ).toEqual({ spice: 2 });
    });
});
