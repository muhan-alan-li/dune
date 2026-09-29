import type React from 'react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GameApi } from '../api/GameApi';
import { useSession } from '../state/SessionContext';
import { Button, Panel } from '../components/UI';

export function MenuView(): React.ReactElement {
    const navigate = useNavigate();
    const session = useSession();
    const [name, setName] = useState(session.displayName);
    const [code, setCode] = useState('');
    const [mode, setMode] = useState<'create' | 'join'>('create');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    async function submit(event: FormEvent): Promise<void> {
        event.preventDefault();
        const clean = name.trim();
        if (!clean || clean.length > 24) {
            setError('Enter a display name from 1 to 24 characters.');
            return;
        }
        if (mode === 'join' && !/^[A-Z0-9]{4,8}$/i.test(code.trim())) {
            setError('Enter a valid lobby code.');
            return;
        }
        setBusy(true);
        setError('');
        try {
            const result =
                mode === 'create'
                    ? await GameApi.createLobby(clean)
                    : await GameApi.joinLobby(code.trim().toUpperCase(), clean);
            session.enterLobby(result);
            navigate(`/lobby/${result.lobby.code}`);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Unable to join the lobby.');
        } finally {
            setBusy(false);
        }
    }
    return (
        <main className="menu shell">
            <div className="hero">
                <p className="eyebrow">The spice must flow</p>
                <h1>
                    DUNE <span>IMPERIUM</span>
                </h1>
                <p className="lead">Command your House. Shape the Imperium. Claim the throne.</p>
            </div>
            <Panel>
                <div className="tabs">
                    <Button
                        variant={mode === 'create' ? 'primary' : 'quiet'}
                        onClick={() => setMode('create')}
                    >
                        Create lobby
                    </Button>
                    <Button
                        variant={mode === 'join' ? 'primary' : 'quiet'}
                        onClick={() => setMode('join')}
                    >
                        Join lobby
                    </Button>
                </div>
                <form onSubmit={submit}>
                    <label>
                        Display name
                        <input
                            aria-label="Display name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            maxLength={24}
                            autoFocus
                        />
                    </label>
                    {mode === 'join' && (
                        <label>
                            Lobby code
                            <input
                                aria-label="Lobby code"
                                value={code}
                                onChange={(event) => setCode(event.target.value.toUpperCase())}
                                maxLength={8}
                            />
                        </label>
                    )}
                    {error && (
                        <p className="error" role="alert">
                            {error}
                        </p>
                    )}
                    <Button type="submit" disabled={busy}>
                        {busy ? 'Connecting…' : mode === 'create' ? 'Create lobby' : 'Join lobby'}
                    </Button>
                </form>
            </Panel>
            <Link className="rulebook-link" to="/rules">
                Read the rulebook
            </Link>
        </main>
    );
}
