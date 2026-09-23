import { api, type ActionResponse, type GameAction, type GameId, type GameState, type Lobby, type LobbyCode, type ServerMessage } from '@dune/shared';

export interface SessionCredentials { token: string; playerId: string; }
export interface LobbyResponse { lobby: Lobby; playerId: string; token: string; }
export interface ApiError { error: string; code?: string; }
export type MessageHandler = (message: ServerMessage) => void;

const TOKEN_KEY = 'dune.playerToken';
const NAME_KEY = 'dune.displayName';
const API_ROOT = import.meta.env.VITE_API_URL ?? '';

export class GameApi {
  static savedToken(): string { return localStorage.getItem(TOKEN_KEY) ?? ''; }
  static savedName(): string { return localStorage.getItem(NAME_KEY) ?? ''; }
  static rememberSession(session: SessionCredentials, name?: string): void {
    localStorage.setItem(TOKEN_KEY, session.token);
    if (name !== undefined) localStorage.setItem(NAME_KEY, name);
  }
  static clearSession(): void { localStorage.removeItem(TOKEN_KEY); }

  private static async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    const token = GameApi.savedToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const response = await fetch(`${API_ROOT}${path}`, { ...options, headers });
    const body = await response.json() as T & ApiError;
    if (!response.ok) throw new Error(body.error ?? 'The request failed.');
    return body;
  }

  static createLobby(name: string): Promise<LobbyResponse> {
    return GameApi.request<LobbyResponse>('/api/lobbies', { method: 'POST', body: JSON.stringify({ name }) }).then((result) => { GameApi.rememberSession(result, name); return result; });
  }
  static joinLobby(code: LobbyCode, name: string): Promise<LobbyResponse> {
    return GameApi.request<LobbyResponse>(api.joinLobby(code), { method: 'POST', body: JSON.stringify({ name }) }).then((result) => { GameApi.rememberSession(result, name); return result; });
  }
  static getLobby(code: LobbyCode): Promise<Lobby> { return GameApi.request<Lobby>(api.getLobby(code)); }
  static setReady(code: LobbyCode, ready: boolean): Promise<Lobby> { return GameApi.request<Lobby>(`/api/lobbies/${code}/ready`, { method: 'POST', body: JSON.stringify({ ready }) }); }
  static setColor(code: LobbyCode, color: string): Promise<Lobby> { return GameApi.request<Lobby>(`/api/lobbies/${code}/color`, { method: 'POST', body: JSON.stringify({ color }) }); }
  static setLeader(code: LobbyCode, cardId: string, cardKey: string): Promise<Lobby> { return GameApi.request<Lobby>(`/api/lobbies/${code}/leader`, { method: 'POST', body: JSON.stringify({ leader: { cardId, cardKey } }) }); }
  static removePlayer(code: LobbyCode, playerId: string): Promise<Lobby> { return GameApi.request<Lobby>(`/api/lobbies/${code}/remove`, { method: 'POST', body: JSON.stringify({ playerId }) }); }
  static leaveLobby(code: LobbyCode): Promise<Lobby | null> { return GameApi.request<Lobby | null>(`/api/lobbies/${code}/leave`, { method: 'POST' }); }
  static startGame(code: LobbyCode): Promise<Lobby> { return GameApi.request<Lobby>(`/api/lobbies/${code}/start`, { method: 'POST' }); }
  static sendAction(gameId: GameId, action: GameAction): Promise<ActionResponse> { return GameApi.request<ActionResponse>(api.sendAction(gameId), { method: 'POST', body: JSON.stringify(action) }); }
  static getState(gameId: GameId): Promise<GameState> { return GameApi.request<GameState>(api.getState(gameId)); }

  static subscribe(gameId: GameId, onMessage: MessageHandler, onStatus?: (connected: boolean) => void): () => void {
    let closed = false;
    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const open = (): void => {
      if (closed) return;
      const root = API_ROOT || window.location.origin;
      const url = new URL(api.stream(gameId), root.replace(/^http/, 'ws'));
      const token = GameApi.savedToken();
      if (token) url.searchParams.set('token', token);
      socket = new WebSocket(url.toString());
      socket.onopen = () => onStatus?.(true);
      socket.onmessage = (event) => {
        try { onMessage(JSON.parse(event.data as string) as ServerMessage); } catch { /* Ignore malformed server data. */ }
      };
      socket.onerror = () => onStatus?.(false);
      socket.onclose = () => { onStatus?.(false); if (!closed) retry = setTimeout(open, 1200); };
    };
    open();
    return () => { closed = true; if (retry) clearTimeout(retry); socket?.close(); };
  }
}
