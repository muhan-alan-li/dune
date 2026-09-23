import type React from 'react';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { GameState, Lobby, ServerMessage } from '@dune/shared';
import { GameApi, type LobbyResponse } from '../api/GameApi';

interface SessionValue {
  token: string;
  playerId: string;
  displayName: string;
  lobby: Lobby | null;
  game: GameState | null;
  connected: boolean;
  error: string;
  setError: (error: string) => void;
  enterLobby: (result: LobbyResponse) => void;
  setLobby: (lobby: Lobby) => void;
  setGame: (game: GameState) => void;
  handleMessage: (message: ServerMessage) => void;
  setConnected: (connected: boolean) => void;
  clear: () => void;
}
const SessionContext = createContext<SessionValue | null>(null);
export function SessionProvider({ children, initialPlayerId = '' }: { children: ReactNode; initialPlayerId?: string }): React.ReactElement {
  const [token, setToken] = useState(GameApi.savedToken());
  const [playerId, setPlayerId] = useState(initialPlayerId);
  const [displayName] = useState(GameApi.savedName());
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const enterLobby = useCallback((result: LobbyResponse) => { GameApi.rememberSession(result, displayName); setToken(result.token); setPlayerId(result.playerId); setLobby(result.lobby); }, [displayName]);
  const handleMessage = useCallback((message: ServerMessage) => { if (message.type === 'LobbyUpdated') setLobby(message.lobby); if (message.type === 'StateUpdated' || message.type === 'GameEnded') setGame(message.state); }, []);
  const clear = useCallback(() => { GameApi.clearSession(); setToken(''); setPlayerId(''); setLobby(null); setGame(null); }, []);
  const value = useMemo<SessionValue>(() => ({ token, playerId, displayName, lobby, game, connected, error, setError, enterLobby, setLobby, setGame, handleMessage, setConnected, clear }), [token, playerId, displayName, lobby, game, connected, error, enterLobby, handleMessage, clear]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
export function useSession(): SessionValue { const value = useContext(SessionContext); if (!value) throw new Error('SessionProvider is required.'); return value; }
