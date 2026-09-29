import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameApi } from './GameApi';

describe('GameApi', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        vi.restoreAllMocks();
    });
    it('keeps the player token separate from other windows', () => {
        GameApi.rememberSession({ token: 'first', playerId: 'one' });
        localStorage.setItem('dune.playerToken', 'second');
        expect(GameApi.savedToken()).toBe('first');
        GameApi.clearSession();
        expect(GameApi.savedToken()).toBe('');
    });
    it('builds lobby URLs and sends the token', async () => {
        sessionStorage.setItem('dune.playerToken', 'token');
        const fetchMock = vi
            .spyOn(globalThis, 'fetch')
            .mockResolvedValue(
                new Response(JSON.stringify({ code: 'ABCD', players: [] }), { status: 200 }),
            );
        await GameApi.getLobby('ABCD');
        expect(fetchMock).toHaveBeenCalledWith(
            '/api/lobbies/ABCD',
            expect.objectContaining({ headers: expect.any(Headers) }),
        );
        const headers = (fetchMock.mock.calls[0]?.[1] as RequestInit).headers as Headers;
        expect(headers.get('Authorization')).toBe('Bearer token');
    });
    it.each(['startGame', 'leaveLobby'] as const)(
        'sends %s without an empty JSON body',
        async (method) => {
            const fetchMock = vi
                .spyOn(globalThis, 'fetch')
                .mockResolvedValue(
                    new Response(JSON.stringify({ code: 'ABCD', players: [] }), { status: 200 }),
                );
            await GameApi[method]('ABCD');
            const options = fetchMock.mock.calls[0]?.[1] as RequestInit;
            expect(options.method).toBe('POST');
            expect(options.body).toBeUndefined();
            expect((options.headers as Headers).has('Content-Type')).toBe(false);
        },
    );
    it('sets the JSON content type when the request has a body', async () => {
        const fetchMock = vi
            .spyOn(globalThis, 'fetch')
            .mockResolvedValue(
                new Response(JSON.stringify({ code: 'ABCD', players: [] }), { status: 200 }),
            );
        await GameApi.setReady('ABCD', true);
        const options = fetchMock.mock.calls[0]?.[1] as RequestInit;
        expect(options.body).toBe(JSON.stringify({ ready: true }));
        expect((options.headers as Headers).get('Content-Type')).toBe('application/json');
    });
});
