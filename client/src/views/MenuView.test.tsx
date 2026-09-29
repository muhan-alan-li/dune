import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { MenuView } from './MenuView';
import { SessionProvider } from '../state/SessionContext';
import { GameApi } from '../api/GameApi';

describe('MenuView', () => {
    it('validates an empty display name', () => {
        render(
            <SessionProvider>
                <MemoryRouter>
                    <MenuView />
                </MemoryRouter>
            </SessionProvider>,
        );
        fireEvent.click(screen.getAllByRole('button', { name: 'Create lobby' })[1]!);
        expect(screen.getByRole('alert')).toHaveTextContent('display name');
    });
    it('submits a valid name', async () => {
        vi.spyOn(GameApi, 'createLobby').mockResolvedValue({
            token: 't',
            playerId: 'p',
            lobby: {
                code: 'ABCD',
                gameId: null,
                hostId: 'p',
                players: [],
                minPlayers: 3,
                maxPlayers: 4,
            },
        });
        render(
            <SessionProvider>
                <MemoryRouter>
                    <MenuView />
                </MemoryRouter>
            </SessionProvider>,
        );
        fireEvent.change(screen.getAllByLabelText('Display name')[0]!, {
            target: { value: 'Jessica' },
        });
        fireEvent.click(screen.getAllByRole('button', { name: 'Create lobby' })[1]!);
        expect(GameApi.createLobby).toHaveBeenCalledWith('Jessica');
    });
});
