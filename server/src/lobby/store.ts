import { randomBytes, randomUUID } from 'node:crypto';
import type { CardRef, Lobby, LobbyCode, Player, PlayerColor, PlayerId } from '@dune/shared';

interface LobbyRecord {
    lobby: Lobby;
    tokens: Map<PlayerId, string>;
}

export interface Session {
    token: string;
    playerId: PlayerId;
    lobbyCode: LobbyCode;
}

export interface LobbyStoreOptions {
    codeFactory?: () => string;
}

const COLORS: readonly PlayerColor[] = ['red', 'blue', 'green', 'black'];

export class LobbyError extends Error {
    constructor(
        public readonly code: string,
        message: string,
    ) {
        super(message);
        this.name = 'LobbyError';
    }
}

export class LobbyStore {
    private readonly lobbies = new Map<LobbyCode, LobbyRecord>();
    private readonly sessions = new Map<string, Session>();
    private readonly codeFactory: () => string;

    constructor(options: LobbyStoreOptions = {}) {
        this.codeFactory =
            options.codeFactory ?? (() => randomBytes(3).toString('hex').toUpperCase());
    }

    create(name: string): { lobby: Lobby; playerId: PlayerId; token: string } {
        const cleanName = this.name(name);
        let code = this.codeFactory();
        for (let attempts = 0; this.lobbies.has(code) && attempts < 20; attempts += 1)
            code = randomBytes(3).toString('hex').toUpperCase();
        if (this.lobbies.has(code))
            throw new LobbyError('lobbyUnavailable', 'A unique lobby code is not available.');
        const playerId = randomUUID();
        const token = randomUUID();
        const player = this.player(playerId, cleanName, true);
        const lobby: Lobby = {
            code,
            gameId: null,
            hostId: playerId,
            players: [player],
            minPlayers: 3,
            maxPlayers: 4,
        };
        this.lobbies.set(code, { lobby, tokens: new Map([[playerId, token]]) });
        this.sessions.set(token, { token, playerId, lobbyCode: code });
        return { lobby: this.publicLobby(lobby), playerId, token };
    }

    join(code: string, name: string): { lobby: Lobby; playerId: PlayerId; token: string } {
        const record = this.record(code);
        if (record.lobby.gameId)
            throw new LobbyError('gameStarted', 'The game has already started.');
        if (record.lobby.players.length >= record.lobby.maxPlayers)
            throw new LobbyError('lobbyFull', 'The lobby is full.');
        const playerId = randomUUID();
        const token = randomUUID();
        record.lobby.players.push(this.player(playerId, this.name(name), false));
        record.tokens.set(playerId, token);
        this.sessions.set(token, { token, playerId, lobbyCode: record.lobby.code });
        return { lobby: this.publicLobby(record.lobby), playerId, token };
    }

    get(code: string): Lobby {
        return this.publicLobby(this.record(code).lobby);
    }

    authenticate(token: string | undefined, code?: string): Session {
        const session = token ? this.sessions.get(token) : undefined;
        if (!session || (code && session.lobbyCode !== code))
            throw new LobbyError('unauthorized', 'A valid player token is required.');
        const record = this.record(session.lobbyCode);
        const player = record.lobby.players.find((entry) => entry.id === session.playerId);
        if (!player) throw new LobbyError('unauthorized', 'A valid player token is required.');
        player.isConnected = true;
        return session;
    }

    setReady(code: string, playerId: string, ready: boolean): Lobby {
        const lobby = this.record(code).lobby;
        this.findPlayer(lobby, playerId).isReady = ready;
        return this.publicLobby(lobby);
    }

    setColor(code: string, playerId: string, color: PlayerColor): Lobby {
        const lobby = this.record(code).lobby;
        if (!COLORS.includes(color))
            throw new LobbyError('invalidColor', 'The color is not valid.');
        if (lobby.players.some((player) => player.id !== playerId && player.color === color))
            throw new LobbyError('colorTaken', 'That color is already taken.');
        this.findPlayer(lobby, playerId).color = color;
        return this.publicLobby(lobby);
    }

    setLeader(code: string, playerId: string, leader: CardRef): Lobby {
        const lobby = this.record(code).lobby;
        if (
            lobby.players.some(
                (player) => player.id !== playerId && player.leader?.cardKey === leader.cardKey,
            )
        )
            throw new LobbyError('leaderTaken', 'That Leader is already taken.');
        this.findPlayer(lobby, playerId).leader = {
            cardId: leader.cardId,
            cardKey: leader.cardKey,
        };
        return this.publicLobby(lobby);
    }

    remove(code: string, hostId: string, playerId: string): Lobby {
        const lobby = this.record(code).lobby;
        if (lobby.hostId !== hostId)
            throw new LobbyError('forbidden', 'Only the host can remove a player.');
        if (hostId === playerId)
            throw new LobbyError('invalidOperation', 'The host cannot remove themself.');
        const index = lobby.players.findIndex((player) => player.id === playerId);
        if (index < 0) throw new LobbyError('playerNotFound', 'The player does not exist.');
        lobby.players.splice(index, 1);
        const token = this.record(code).tokens.get(playerId);
        if (token) this.sessions.delete(token);
        this.record(code).tokens.delete(playerId);
        return this.publicLobby(lobby);
    }

    leave(code: string, playerId: string): Lobby | null {
        const record = this.record(code);
        const index = record.lobby.players.findIndex((player) => player.id === playerId);
        if (index < 0) throw new LobbyError('playerNotFound', 'The player does not exist.');
        const token = record.tokens.get(playerId);
        if (token) this.sessions.delete(token);
        record.tokens.delete(playerId);
        record.lobby.players.splice(index, 1);
        if (record.lobby.players.length === 0) {
            this.lobbies.delete(record.lobby.code);
            return null;
        }
        if (record.lobby.hostId === playerId) {
            const nextHost = record.lobby.players[0]!;
            record.lobby.hostId = nextHost.id;
            nextHost.isHost = true;
        }
        return this.publicLobby(record.lobby);
    }

    start(code: string, playerId: string): Lobby {
        const lobby = this.record(code).lobby;
        if (lobby.hostId !== playerId)
            throw new LobbyError('forbidden', 'Only the host can start the game.');
        if (lobby.players.length < lobby.minPlayers || lobby.players.length > lobby.maxPlayers)
            throw new LobbyError('invalidPlayerCount', 'The game requires 3 or 4 players.');
        if (lobby.players.some((player) => !player.isReady))
            throw new LobbyError('playersNotReady', 'All players must be ready.');
        if (lobby.players.some((player) => !player.color || !player.leader))
            throw new LobbyError(
                'incompletePlayer',
                'Every player must select a color and Leader.',
            );
        if (lobby.gameId) throw new LobbyError('gameStarted', 'The game has already started.');
        lobby.gameId = randomUUID();
        return this.publicLobby(lobby);
    }

    setGameId(code: string, gameId: string): void {
        this.record(code).lobby.gameId = gameId;
    }

    private record(code: string): LobbyRecord {
        const record = this.lobbies.get(code.toUpperCase());
        if (!record) throw new LobbyError('notFound', 'The lobby does not exist.');
        return record;
    }

    private findPlayer(lobby: Lobby, playerId: string): Player {
        const player = lobby.players.find((entry) => entry.id === playerId);
        if (!player) throw new LobbyError('playerNotFound', 'The player does not exist.');
        return player;
    }

    private name(value: string): string {
        const clean = value.trim();
        if (clean.length < 1 || clean.length > 24)
            throw new LobbyError('invalidName', 'The display name must have 1 to 24 characters.');
        return clean;
    }

    private player(id: string, name: string, isHost: boolean): Player {
        return { id, name, color: null, leader: null, isHost, isReady: false, isConnected: false };
    }

    private publicLobby(lobby: Lobby): Lobby {
        return {
            ...lobby,
            players: lobby.players.map((player) => ({
                ...player,
                leader: player.leader ? { ...player.leader } : null,
            })),
        };
    }
}
