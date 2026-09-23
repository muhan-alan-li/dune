import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LobbyView } from './LobbyView';
import { SessionProvider } from '../state/SessionContext';
import { GameApi } from '../api/GameApi';

describe('LobbyView', () => { it('renders lobby players and host controls', async () => { vi.spyOn(GameApi, 'getLobby').mockResolvedValue({ code: 'ABCD', gameId: null, hostId: 'p', players: [{ id: 'p', name: 'Paul', color: null, leader: null, isHost: true, isReady: false, isConnected: true }], minPlayers: 3, maxPlayers: 4 }); render(<SessionProvider initialPlayerId="p"><MemoryRouter initialEntries={['/lobby/ABCD']}><Routes><Route path="/lobby/:code" element={<LobbyView />} /></Routes></MemoryRouter></SessionProvider>); expect(await screen.findByText('ABCD')).toBeInTheDocument(); expect(screen.getByText('Paul')).toBeInTheDocument(); expect(screen.getByRole('button', { name: 'Ready' })).toBeInTheDocument(); }); });
