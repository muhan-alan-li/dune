import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SessionProvider } from './state/SessionContext';
import { MenuView } from './views/MenuView';
import { LobbyView } from './views/LobbyView';
import { GameView } from './views/GameView';
import { EndView } from './views/EndView';
import { RulebookView } from './views/RulebookView';
export function App(): React.ReactElement { return <SessionProvider><BrowserRouter><Routes><Route path="/" element={<MenuView />} /><Route path="/rules" element={<RulebookView />} /><Route path="/lobby/:code" element={<LobbyView />} /><Route path="/game/:id" element={<GameView />} /><Route path="/game/:id/end" element={<EndView />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></BrowserRouter></SessionProvider>; }
