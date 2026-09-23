import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameApi } from './GameApi';

describe('GameApi', () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });
  it('builds lobby URLs and sends the token', async () => {
    localStorage.setItem('dune.playerToken', 'token');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ code: 'ABCD', players: [] }), { status: 200 }));
    await GameApi.getLobby('ABCD');
    expect(fetchMock).toHaveBeenCalledWith('/api/lobbies/ABCD', expect.objectContaining({ headers: expect.any(Headers) }));
    const headers = (fetchMock.mock.calls[0]?.[1] as RequestInit).headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer token');
  });
});
