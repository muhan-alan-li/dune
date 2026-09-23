import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify';
import websocket from '@fastify/websocket';
import { z } from 'zod';
import type { GameAction, ServerMessage } from '@dune/shared';
import { api } from '@dune/shared';
import { LobbyError, LobbyStore } from './lobby/store.js';
import { GameStore } from './game/store.js';
import type { SetupPlayer } from './game/engine/index.js';
import type { WebSocket } from 'ws';

export interface AppOptions {
  lobbyStore?: LobbyStore;
  gameStore?: GameStore;
  seedFactory?: () => number;
}

const nameSchema = z.object({ name: z.string().trim().min(1).max(24) });
const colorSchema = z.enum(['red', 'blue', 'green', 'black']);
const leaderSchema = z.object({ cardId: z.string().min(1), cardKey: z.string().min(1) });
const actionSchema = z.object({
  kind: z.enum(['playCard', 'sendAgent', 'deployTroops', 'useSignetRing', 'useLeaderAbility', 'playIntrigue', 'acquireCard', 'pass', 'confirmCombat', 'chooseConflictInfluence', 'advancePhase']),
}).passthrough();

function tokenFrom(request: FastifyRequest): string | undefined {
  const header = request.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  const value = request.headers['x-player-token'];
  return typeof value === 'string' ? value : undefined;
}

function errorStatus(error: unknown): number {
  if (!(error instanceof LobbyError)) return 500;
  if (error.code === 'unauthorized') return 401;
  if (error.code === 'notFound') return 404;
  if (error.code === 'forbidden') return 403;
  return 400;
}

function sendError(reply: { code: (status: number) => { send: (body: unknown) => unknown } }, error: unknown): unknown {
  const status = errorStatus(error);
  return reply.code(status).send({ error: error instanceof Error ? error.message : 'Request failed', code: error instanceof LobbyError ? error.code : 'internalError' });
}

export function buildApp(options: AppOptions = {}): FastifyInstance {
  const lobbies = options.lobbyStore ?? new LobbyStore();
  const games = options.gameStore ?? new GameStore();
  const seedFactory = options.seedFactory ?? (() => Date.now());
  const gameLobbies = new Map<string, string>();
  const sockets = new Map<string, Set<{ socket: WebSocket; playerId: string }>>();

  const broadcast = (gameId: string, makeMessage: (playerId: string) => ServerMessage | null): void => {
    for (const entry of sockets.get(gameId) ?? []) {
      if (entry.socket.readyState === 1) {
        const message = makeMessage(entry.playerId);
        if (message) entry.socket.send(JSON.stringify(message));
      }
    }
  };
  const now = (): string => new Date().toISOString();

  const app = Fastify({ logger: false });
  void app.register(websocket);

  app.post(api.createLobby(), async (request, reply) => {
    const parsed = nameSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid display name.', code: 'invalidRequest' });
    try { return lobbies.create(parsed.data.name); } catch (error) { return sendError(reply, error); }
  });

  app.post('/api/lobbies/:code/join', async (request, reply) => {
    const parsed = nameSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid display name.', code: 'invalidRequest' });
    try { return lobbies.join((request.params as { code: string }).code, parsed.data.name); } catch (error) { return sendError(reply, error); }
  });

  app.get('/api/lobbies/:code', async (request, reply) => {
    try { return lobbies.get((request.params as { code: string }).code); } catch (error) { return sendError(reply, error); }
  });

  const withLobby = (request: FastifyRequest, code: string) => {
    const session = lobbies.authenticate(tokenFrom(request), code);
    return session;
  };

  app.post('/api/lobbies/:code/ready', async (request, reply) => {
    try {
      const code = (request.params as { code: string }).code;
      const session = withLobby(request, code);
      const body = z.object({ ready: z.boolean() }).parse(request.body);
      return lobbies.setReady(code, session.playerId, body.ready);
    } catch (error) { return sendError(reply, error); }
  });
  app.post('/api/lobbies/:code/color', async (request, reply) => {
    try {
      const code = (request.params as { code: string }).code;
      const session = withLobby(request, code);
      const body = z.object({ color: colorSchema }).parse(request.body);
      return lobbies.setColor(code, session.playerId, body.color);
    } catch (error) { return sendError(reply, error); }
  });
  app.post('/api/lobbies/:code/leader', async (request, reply) => {
    try {
      const code = (request.params as { code: string }).code;
      const session = withLobby(request, code);
      const body = z.object({ leader: leaderSchema }).parse(request.body);
      return lobbies.setLeader(code, session.playerId, body.leader);
    } catch (error) { return sendError(reply, error); }
  });
  app.post('/api/lobbies/:code/leave', async (request, reply) => {
    try {
      const code = (request.params as { code: string }).code;
      const session = withLobby(request, code);
      return lobbies.leave(code, session.playerId);
    } catch (error) { return sendError(reply, error); }
  });
  app.post('/api/lobbies/:code/remove', async (request, reply) => {
    try {
      const code = (request.params as { code: string }).code;
      const session = withLobby(request, code);
      const body = z.object({ playerId: z.string().min(1) }).parse(request.body);
      return lobbies.remove(code, session.playerId, body.playerId);
    } catch (error) { return sendError(reply, error); }
  });
  app.post('/api/lobbies/:code/start', async (request, reply) => {
    try {
      const code = (request.params as { code: string }).code;
      const session = withLobby(request, code);
      const lobby = lobbies.start(code, session.playerId);
      const players = lobby.players.map((player): SetupPlayer => {
        const setup: SetupPlayer = { playerId: player.id, name: player.name, color: player.color! };
        if (player.leader) setup.leader = player.leader.cardKey;
        return setup;
      });
      games.start(code, lobby.gameId!, players, seedFactory());
      gameLobbies.set(lobby.gameId!, code);
      const stamp = now();
      broadcast(lobby.gameId!, () => ({ type: 'LobbyUpdated', lobby, timestamp: stamp }));
      broadcast(lobby.gameId!, () => ({ type: 'GameStarted', gameId: lobby.gameId!, lobbyCode: code, timestamp: stamp }));
      return lobby;
    } catch (error) { return sendError(reply, error); }
  });

  app.post('/api/games/:id/actions', async (request, reply) => {
    try {
      const gameId = (request.params as { id: string }).id;
      const code = gameLobbies.get(gameId) ?? games.get(gameId).lobbyCode;
      const session = withLobby(request, code);
      const parsed = actionSchema.safeParse(request.body);
      if (!parsed.success) return reply.code(400).send({ error: 'Invalid action.', code: 'invalidRequest' });
      const game = games.get(gameId);
      const previous = game.state;
      const result = games.action(gameId, session.playerId, parsed.data as GameAction);
      if (!result.accepted) {
        broadcast(gameId, (playerId) => playerId === session.playerId ? { type: 'ActionRejected', gameId, actionId: result.actionId, code: result.code, reason: result.reason, timestamp: now() } : null);
        return reply.code(400).send({ accepted: false, code: result.code, reason: result.reason, actionId: result.actionId });
      }
      const timestamp = now();
      broadcast(gameId, (playerId) => ({ type: 'StateUpdated', gameId, state: games.state(gameId, playerId), timestamp }));
      broadcast(gameId, () => ({ type: 'ActionAccepted', gameId, actionId: result.actionId, timestamp }));
      if (previous.currentPlayerId !== game.state.currentPlayerId && game.state.currentPlayerId) broadcast(gameId, () => ({ type: 'TurnChanged', gameId, playerId: game.state.currentPlayerId!, timestamp }));
      if (previous.phase !== game.state.phase) broadcast(gameId, () => ({ type: 'PhaseChanged', gameId, phase: game.state.phase, timestamp }));
      if (game.state.ended && game.state.winner[0]) broadcast(gameId, (playerId) => ({ type: 'GameEnded', gameId, winnerId: game.state.winner[0]!, state: games.state(gameId, playerId), timestamp }));
      return { accepted: true, actionId: result.actionId, state: games.state(gameId, session.playerId) };
    } catch (error) { return sendError(reply, error); }
  });

  app.get('/api/games/:id/state', async (request, reply) => {
    try {
      const gameId = (request.params as { id: string }).id;
      const game = games.get(gameId);
      const session = withLobby(request, game.lobbyCode);
      return games.state(gameId, session.playerId);
    } catch (error) { return sendError(reply, error); }
  });

  app.after(() => app.get('/api/games/:id/stream', { websocket: true }, (ws, request) => {
    const socket = ws as unknown as WebSocket;
    const requestUrl = request.raw.url ?? '';
    const parsedUrl = new URL(requestUrl, 'http://localhost');
    const gameId = (request.params as { id?: string } | undefined)?.id ?? parsedUrl.pathname.split('/')[3];
    if (!gameId) {
      ws.close(1008, 'The game ID is required.');
      return;
    }
    let session: { playerId: string; lobbyCode: string };
    try {
      const queryToken = (request.query as { token?: unknown } | undefined)?.token;
      const token = typeof queryToken === 'string' ? queryToken : parsedUrl.searchParams.get('token') ?? undefined;
      const game = games.get(gameId);
      session = lobbies.authenticate(token, game.lobbyCode);
    } catch (error) {
      ws.close(1008, error instanceof Error ? error.message : 'Unauthorized');
      return;
    }
    const entry = { socket: ws, playerId: session.playerId };
    const list = sockets.get(gameId) ?? new Set<{ socket: WebSocket; playerId: string }>();
    list.add(entry);
    sockets.set(gameId, list);
    ws.send(JSON.stringify({ type: 'StateUpdated', gameId, state: games.state(gameId, session.playerId), timestamp: now() } satisfies ServerMessage));
    socket.on('message', (raw) => {
      try {
        const message = JSON.parse(raw.toString()) as { token?: string; subscribe?: string };
        if (message.subscribe === gameId && message.token) {
          lobbies.authenticate(message.token, games.get(gameId).lobbyCode);
          ws.send(JSON.stringify({ type: 'StateUpdated', gameId, state: games.state(gameId, session.playerId), timestamp: now() } satisfies ServerMessage));
        }
      } catch { ws.close(1008, 'Invalid subscription.'); }
    });
    ws.on('close', () => { list.delete(entry); });
  }));

  return app;
}

export async function createServer(options: AppOptions = {}): Promise<FastifyInstance> {
  const app = buildApp(options);
  await app.ready();
  return app;
}

if (process.argv[1]?.endsWith('/dist/index.js')) {
  const port = Number(process.env.PORT ?? 3000);
  const app = buildApp();
  app.listen({ port, host: process.env.HOST ?? '0.0.0.0' }).catch((error: unknown) => { app.log.error(error); process.exit(1); });
}
