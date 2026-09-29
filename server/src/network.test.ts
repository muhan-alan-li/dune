import { describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { buildApp } from './index.js';

async function createPlayer(app: ReturnType<typeof buildApp>, name: string) {
    const response = await app.inject({ method: 'POST', url: '/api/lobbies', payload: { name } });
    expect(response.statusCode).toBe(200);
    return response.json() as {
        lobby: { code: string; players: Array<{ id: string }> };
        playerId: string;
        token: string;
    };
}

async function configure(
    app: ReturnType<typeof buildApp>,
    code: string,
    token: string,
    color: string,
) {
    const headers = { authorization: `Bearer ${token}` };
    expect(
        (
            await app.inject({
                method: 'POST',
                url: `/api/lobbies/${code}/color`,
                headers,
                payload: { color },
            })
        ).statusCode,
    ).toBe(200);
    expect(
        (
            await app.inject({
                method: 'POST',
                url: `/api/lobbies/${code}/leader`,
                headers,
                payload: { leader: { cardId: `leader-${color}`, cardKey: `leader-${color}` } },
            })
        ).statusCode,
    ).toBe(200);
    expect(
        (
            await app.inject({
                method: 'POST',
                url: `/api/lobbies/${code}/ready`,
                headers,
                payload: { ready: true },
            })
        ).statusCode,
    ).toBe(200);
}

describe('server lobby and game API', () => {
    it('creates, joins, configures, and starts only a ready three-player lobby', async () => {
        const app = buildApp({ seedFactory: () => 1 });
        const host = await createPlayer(app, 'Host');
        const joined = await app.inject({
            method: 'POST',
            url: `/api/lobbies/${host.lobby.code}/join`,
            payload: { name: 'Second' },
        });
        const second = joined.json() as { token: string };
        const third = await app.inject({
            method: 'POST',
            url: `/api/lobbies/${host.lobby.code}/join`,
            payload: { name: 'Third' },
        });
        const thirdSession = third.json() as { token: string };
        await configure(app, host.lobby.code, host.token, 'red');
        await configure(app, host.lobby.code, second.token, 'blue');
        const notReady = await app.inject({
            method: 'POST',
            url: `/api/lobbies/${host.lobby.code}/start`,
            headers: { authorization: `Bearer ${host.token}` },
        });
        expect(notReady.statusCode).toBe(400);
        await configure(app, host.lobby.code, thirdSession.token, 'green');
        const started = await app.inject({
            method: 'POST',
            url: `/api/lobbies/${host.lobby.code}/start`,
            headers: { authorization: `Bearer ${host.token}` },
        });
        expect(started.statusCode).toBe(200);
        expect(started.json().gameId).toBeTruthy();
        await app.close();
    });

    it('rejects an unauthenticated action and a wrong-player action', async () => {
        const app = buildApp({ seedFactory: () => 2 });
        const host = await createPlayer(app, 'Host');
        const sessions = await Promise.all(
            ['Two', 'Three'].map(
                async (name) =>
                    (
                        await app.inject({
                            method: 'POST',
                            url: `/api/lobbies/${host.lobby.code}/join`,
                            payload: { name },
                        })
                    ).json() as { token: string },
            ),
        );
        for (const [index, token] of [
            host.token,
            ...sessions.map((session) => session.token),
        ].entries())
            await configure(app, host.lobby.code, token, ['red', 'blue', 'green'][index]!);
        await app.inject({
            method: 'POST',
            url: `/api/lobbies/${host.lobby.code}/start`,
            headers: { authorization: `Bearer ${host.token}` },
        });
        const lobby = (
            await app.inject({ method: 'GET', url: `/api/lobbies/${host.lobby.code}` })
        ).json() as { gameId: string };
        expect(
            (
                await app.inject({
                    method: 'POST',
                    url: `/api/games/${lobby.gameId}/actions`,
                    payload: { kind: 'pass' },
                })
            ).statusCode,
        ).toBe(401);
        const wrong = await app.inject({
            method: 'POST',
            url: `/api/games/${lobby.gameId}/actions`,
            headers: { authorization: `Bearer ${sessions[0]!.token}` },
            payload: { kind: 'pass' },
        });
        expect(wrong.statusCode).toBe(400);
        expect(wrong.json().accepted).toBe(false);
        await app.close();
    });

    it('broadcasts the current filtered state over WebSocket and supports reconnect', async () => {
        const app = buildApp({ seedFactory: () => 4 });
        await app.listen({ port: 0, host: '127.0.0.1' });
        const address = app.server.address();
        if (!address || typeof address === 'string')
            throw new Error('The test server did not bind.');
        const host = await createPlayer(app, 'Host');
        const sessions = await Promise.all(
            ['Two', 'Three'].map(
                async (name) =>
                    (
                        await app.inject({
                            method: 'POST',
                            url: `/api/lobbies/${host.lobby.code}/join`,
                            payload: { name },
                        })
                    ).json() as { token: string },
            ),
        );
        for (const [index, token] of [
            host.token,
            ...sessions.map((session) => session.token),
        ].entries())
            await configure(app, host.lobby.code, token, ['red', 'blue', 'green'][index]!);
        await app.inject({
            method: 'POST',
            url: `/api/lobbies/${host.lobby.code}/start`,
            headers: { authorization: `Bearer ${host.token}` },
        });
        const gameId = (
            (
                await app.inject({ method: 'GET', url: `/api/lobbies/${host.lobby.code}` })
            ).json() as {
                gameId: string;
            }
        ).gameId;
        const message = await new Promise<{ type: string; state: { viewForPlayerId: string } }>(
            (resolve, reject) => {
                const socket = new WebSocket(
                    `ws://127.0.0.1:${address.port}/api/games/${gameId}/stream?token=${host.token}`,
                );
                socket.once('message', (data) => {
                    resolve(
                        JSON.parse(data.toString()) as {
                            type: string;
                            state: { viewForPlayerId: string };
                        },
                    );
                    socket.close();
                });
                socket.once('error', reject);
            },
        );
        expect(message.type).toBe('StateUpdated');
        expect(message.state.viewForPlayerId).toBe(host.playerId);
        await app.close();
    });

    it('returns private card contents only to the owning player', async () => {
        const app = buildApp({ seedFactory: () => 3 });
        const host = await createPlayer(app, 'Host');
        const sessions = await Promise.all(
            ['Two', 'Three'].map(
                async (name) =>
                    (
                        await app.inject({
                            method: 'POST',
                            url: `/api/lobbies/${host.lobby.code}/join`,
                            payload: { name },
                        })
                    ).json() as { token: string },
            ),
        );
        for (const [index, token] of [
            host.token,
            ...sessions.map((session) => session.token),
        ].entries())
            await configure(app, host.lobby.code, token, ['red', 'blue', 'green'][index]!);
        await app.inject({
            method: 'POST',
            url: `/api/lobbies/${host.lobby.code}/start`,
            headers: { authorization: `Bearer ${host.token}` },
        });
        const gameId = (
            (
                await app.inject({ method: 'GET', url: `/api/lobbies/${host.lobby.code}` })
            ).json() as {
                gameId: string;
            }
        ).gameId;
        const own = (
            await app.inject({
                method: 'GET',
                url: `/api/games/${gameId}/state`,
                headers: { authorization: `Bearer ${host.token}` },
            })
        ).json();
        const other = (
            await app.inject({
                method: 'GET',
                url: `/api/games/${gameId}/state`,
                headers: { authorization: `Bearer ${sessions[0]!.token}` },
            })
        ).json();
        expect(own.viewForPlayerId).not.toBe(other.viewForPlayerId);
        expect(
            own.players.find(
                (player: { playerId: string }) => player.playerId === own.viewForPlayerId,
            ).hand,
        ).not.toBeNull();
        expect(
            other.players.find(
                (player: { playerId: string }) => player.playerId === own.viewForPlayerId,
            ).hand,
        ).toBeNull();
        await app.close();
    });
});
