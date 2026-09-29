import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameState } from '@dune/shared';
import { GameView } from './GameView';
import { SessionProvider } from '../state/SessionContext';
import { GameApi } from '../api/GameApi';

const state = {
    gameId: 'g',
    lobbyCode: 'ABCD',
    roundNumber: 1,
    phase: 'playerTurns',
    currentPlayerId: 'p',
    firstPlayerId: 'p',
    viewForPlayerId: 'p',
    board: [
        {
            id: 'arrakeen',
            name: 'Arrakeen',
            icon: 'emperor',
            cost: null,
            requirementText: null,
            occupantPlayerId: null,
            controllerPlayerId: null,
            bonusSpice: 0,
        },
    ],
    imperiumRow: [],
    reserve: {
        arrakisLiaison: { cardKey: 'liaison', count: 1 },
        spiceMustFlow: { cardKey: 'spice', count: 1 },
        foldspace: { cardKey: 'fold', count: 1 },
    },
    conflict: { card: null },
    reveal: { revealed: null, pendingPersuasion: null, combatStrengthPreview: null },
    combat: null,
    players: [
        {
            playerId: 'p',
            name: 'Paul',
            color: 'red',
            leader: { cardId: 'l', cardKey: 'leader' },
            score: 1,
            combatStrength: 0,
            resources: { solari: 0, spice: 0, water: 1, persuasion: 0 },
            troopsInSupply: 9,
            troopsInGarrison: 2,
            troopsInConflict: 0,
            influence: { emperor: 0, spacingGuild: 0, beneGesserit: 0, fremen: 0 },
            alliances: [],
            hand: [{ cardId: 'c', cardKey: 'card' }],
            handCount: 1,
            deckCount: 0,
            discardCount: 0,
            intrigueCards: [],
            intrigueCount: 0,
            agentsRemaining: 2,
            agentsOnBoard: 0,
            hasMentat: false,
        },
    ],
    legalActions: [
        { kind: 'playCard', card: { cardId: 'c', cardKey: 'card' } },
        { kind: 'sendAgent', card: { cardId: 'c', cardKey: 'card' }, spaceId: 'arrakeen' },
    ],
    log: [],
    ended: false,
    winnerId: null,
} as GameState;

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

function renderGame(): void {
    render(
        <SessionProvider initialPlayerId="p">
            <MemoryRouter initialEntries={['/game/g']}>
                <Routes>
                    <Route path="/game/:id" element={<GameView />} />
                </Routes>
            </MemoryRouter>
        </SessionProvider>,
    );
}

describe('GameView', () => {
    it.each([
        ['dune-imperium-signet-ring', 'arrakeen', 'Arrakeen'],
        ['dune-imperium-seek-allies', 'wealth', 'Wealth'],
    ])('plays %s before it shows valid destinations', async (cardKey, spaceId, name) => {
        const card = { cardId: 'c', cardKey };
        const initial: GameState = {
            ...state,
            board: [
                { ...state.board[0]!, id: spaceId, name },
                { ...state.board[0]!, id: 'blocked', name: 'Blocked' },
            ],
            players: state.players.map((player) => ({ ...player, hand: [card] })),
            legalActions: [{ kind: 'playCard', card }],
        };
        const played: GameState = {
            ...initial,
            players: initial.players.map((player) => ({ ...player, hand: [], handCount: 0 })),
            legalActions: [{ kind: 'sendAgent', card, spaceId }],
        };
        vi.spyOn(GameApi, 'getState').mockResolvedValue(initial);
        vi.spyOn(GameApi, 'subscribe').mockReturnValue(() => undefined);
        const send = vi
            .spyOn(GameApi, 'sendAction')
            .mockResolvedValueOnce({ accepted: true, actionId: 'play', state: played })
            .mockResolvedValueOnce({
                accepted: true,
                actionId: 'send',
                state: { ...played, legalActions: [] },
            });
        renderGame();
        fireEvent.click(await screen.findByText(cardKey));
        expect(send).toHaveBeenNthCalledWith(1, 'g', { kind: 'playCard', cardId: 'c' });
        const destination = screen.getByRole('button', { name: new RegExp(name) });
        await waitFor(() => expect(destination).toBeEnabled());
        expect(destination).toHaveClass('legal');
        expect(screen.getByRole('button', { name: /Blocked/ })).toBeDisabled();
        fireEvent.click(destination);
        expect(send).toHaveBeenNthCalledWith(2, 'g', { kind: 'sendAgent', cardId: 'c', spaceId });
        await waitFor(() => expect(destination).toBeDisabled());
        expect(screen.queryByText(/Card selected:/)).not.toBeInTheDocument();
    });

    it('shows valid destinations when an open Agent turn is loaded', async () => {
        const open: GameState = {
            ...state,
            players: state.players.map((player) => ({ ...player, hand: [], handCount: 0 })),
            legalActions: [
                { kind: 'sendAgent', card: { cardId: 'c', cardKey: 'card' }, spaceId: 'arrakeen' },
            ],
        };
        vi.spyOn(GameApi, 'getState').mockResolvedValue(open);
        vi.spyOn(GameApi, 'subscribe').mockReturnValue(() => undefined);
        renderGame();
        expect(await screen.findByRole('button', { name: /Arrakeen/ })).toBeEnabled();
    });
});
